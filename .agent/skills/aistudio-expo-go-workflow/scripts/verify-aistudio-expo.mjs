#!/usr/bin/env node
/**
 * Pre-flight verifier for Expo / React Native projects running in
 * Google AI Studio Build, Expo Go, and GitHub Actions Android APK CI.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const warnings = [];

function readJson(relPath) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) {
    errors.push(`Missing required file: ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (err) {
    errors.push(`Invalid JSON in ${relPath}: ${err.message}`);
    return null;
  }
}

function walkFiles(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, exts, out);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

// 1. package.json port 3000 & build scripts
const pkg = readJson('package.json');
if (pkg) {
  const startScript = pkg.scripts?.start ?? '';
  if (!startScript.includes('3000')) {
    errors.push('package.json "scripts.start" must bind to --port 3000 for AI Studio preview.');
  }
  if (!pkg.scripts?.dev?.includes('3000')) {
    warnings.push('package.json "scripts.dev" should also bind to --port 3000.');
  }
  if (!pkg.scripts?.build) {
    warnings.push('package.json is missing a "scripts.build" script (e.g., "expo export --platform web").');
  }
}

// 2. app.json Android package & iOS bundleIdentifier
const appJson = readJson('app.json');
if (appJson?.expo) {
  if (!appJson.expo.android?.package) {
    errors.push('app.json is missing expo.android.package (required for non-interactive CI prebuild).');
  }
  if (!appJson.expo.ios?.bundleIdentifier) {
    warnings.push('app.json is missing expo.ios.bundleIdentifier.');
  }
}

// 3. Committed CSS module declarations for fresh CI checkouts
const dtsFiles = walkFiles(path.join(root, 'src'), ['.d.ts']);
const hasCssDecl = dtsFiles.some((file) => {
  const content = fs.readFileSync(file, 'utf8');
  return content.includes("declare module '*.css'") || content.includes('declare module "*.css"');
});
if (!hasCssDecl) {
  errors.push(
    "Missing committed '*.css' declaration in src/ (e.g., src/types/css.d.ts). Fresh CI clones without gitignored expo-env.d.ts will fail tsc."
  );
}

// 4. Scan src/ for Expo Go / NativeWind / Web truncation pitfalls
const srcFiles = walkFiles(path.join(root, 'src'), ['.ts', '.tsx']);
const activeClassRe = /\bactive:(bg|text|border|scale|opacity)-/;
const spaceClassRe = /\bspace-[xy]-/;
const vectorIconsRe = /from\s+['"]@expo\/vector-icons/;

for (const file of srcFiles) {
  const rel = path.relative(root, file);
  const content = fs.readFileSync(file, 'utf8');

  if (activeClassRe.test(content)) {
    errors.push(`${rel}: Avoid NativeWind "active:*" classes (triggers LinkingContext crash on mobile). Use Pressable style callback.`);
  }
  if (spaceClassRe.test(content)) {
    errors.push(`${rel}: Avoid NativeWind "space-x-*"/"space-y-*" combinators. Use "gap-*".`);
  }
  if (vectorIconsRe.test(content)) {
    warnings.push(`${rel}: Uses @expo/vector-icons font; prefer react-native-svg icons so mobile/Expo Go never renders blank icons.`);
  }
  if (content.includes('adjustsFontSizeToFit') && content.includes('numberOfLines={1}')) {
    warnings.push(`${rel}: adjustsFontSizeToFit + numberOfLines={1} truncates with "..." on Web; prefer onLayout width-based font scaling.`);
  }
}

// 5. GitHub Actions workflow check (NODE_ENV trap)
const workflowDir = path.join(root, '.github', 'workflows');
for (const wf of walkFiles(workflowDir, ['.yml', '.yaml'])) {
  const rel = path.relative(root, wf);
  const content = fs.readFileSync(wf, 'utf8');
  if (/^\s*NODE_ENV:\s*['"]?production['"]?/m.test(content)) {
    errors.push(`${rel}: Do not set job-level NODE_ENV=production before dependency install (skips devDependencies like typescript/tailwindcss).`);
  }
}

console.log('AI Studio + Expo Go Pre-Flight Audit');
console.log('------------------------------------');
if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}
if (errors.length > 0) {
  console.log('\nErrors:');
  for (const e of errors) console.log(`  ✖ ${e}`);
  process.exit(1);
}

console.log('\n✅ All AI Studio + Expo Go + CI checks passed.');
