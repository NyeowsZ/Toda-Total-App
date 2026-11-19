import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { FlatList, Pressable, Text, View } from 'react-native';

import { TerminalColors, TerminalFonts } from '@/constants/terminal-theme';
import type { TallyEntry } from '@/types/tally';

interface HistoryTapeViewProps {
  entries: TallyEntry[];
  cursorIndex: number;
  onSelectRow: (row1Index: number) => void;
  onResumeEntry: () => void;
  compact: boolean;
}

export function HistoryTapeView({
  entries,
  cursorIndex,
  onSelectRow,
  onResumeEntry,
  compact,
}: HistoryTapeViewProps) {
  return (
    <View className="flex-1 w-full pt-1">
      {/* Subheader */}
      <View className="flex-row items-center justify-between pb-2 px-1">
        <View className="flex-row items-center gap-1.5">
          <MaterialIcons name="receipt-long" size={16} color={TerminalColors.outline} />
          <Text
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: 12,
              letterSpacing: 0.9,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
            }}>
            CHRONOLOGICAL TAPE
          </Text>
        </View>
        <Text
          style={{
            fontFamily: TerminalFonts.bodySemiBold,
            fontSize: 12,
            color: TerminalColors.outline,
          }}>
          {entries.length} {entries.length === 1 ? 'record' : 'records'}
        </Text>
      </View>

      {/* Rounded Table Card */}
      <View
        className="flex-1 w-full rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'rgba(248, 250, 252, 0.85)' }}>
        {/* Column Header */}
        <View
          className="flex-row items-center px-4 py-2"
          style={{ backgroundColor: 'rgba(226, 232, 240, 0.68)' }}>
          <Text
            className="w-1/4"
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: 11,
              letterSpacing: 0.6,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
            }}>
            INDEX
          </Text>
          <Text
            className="w-5/12"
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: 11,
              letterSpacing: 0.6,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
            }}>
            BODY NO.
          </Text>
          <Text
            className="w-4/12 text-right"
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: 11,
              letterSpacing: 0.6,
              color: TerminalColors.outline,
              textTransform: 'uppercase',
            }}>
            AMOUNT
          </Text>
        </View>

        {/* Scrollable Rows */}
        {entries.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text
              style={{
                fontFamily: TerminalFonts.bodyMedium,
                fontSize: 14,
                color: TerminalColors.outline,
              }}>
              No tally entries in batch yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(_, idx) => `entry-${idx}`}
            showsVerticalScrollIndicator
            contentContainerStyle={{ paddingBottom: 6 }}
            renderItem={({ item, index }) => {
              const row1Index = index + 1;
              const isSelected = cursorIndex === row1Index;
              return (
                <Pressable
                  onPress={() => onSelectRow(row1Index)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: compact ? 8 : 10,
                    paddingHorizontal: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
                    borderLeftWidth: isSelected ? 4 : 0,
                    borderLeftColor: TerminalColors.accent,
                    backgroundColor: isSelected
                      ? TerminalColors.accentTint
                      : pressed
                        ? TerminalColors.surfaceContainer
                        : TerminalColors.surface,
                  })}>
                  <Text
                    className="w-1/4"
                    style={{
                      fontFamily: TerminalFonts.displayBold,
                      fontSize: compact ? 18 : 22,
                      color: TerminalColors.outline,
                      fontVariant: ['tabular-nums'],
                    }}>
                    #{row1Index}
                  </Text>
                  <Text
                    className="w-5/12"
                    style={{
                      fontFamily: TerminalFonts.displayExtraBold,
                      fontSize: compact ? 18 : 22,
                      color: TerminalColors.onSurface,
                      fontVariant: ['tabular-nums'],
                    }}>
                    {item.bn}
                  </Text>
                  <Text
                    className="w-4/12 text-right"
                    style={{
                      fontFamily: TerminalFonts.displayBlack,
                      fontSize: compact ? 18 : 22,
                      color: TerminalColors.onSurface,
                      fontVariant: ['tabular-nums'],
                    }}>
                    {item.amount}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      {/* Bottom Helper Row */}
      <View className="flex-row items-center justify-between pt-2 px-1">
        <Text
          style={{
            fontFamily: TerminalFonts.bodyMedium,
            fontSize: 12,
            color: TerminalColors.outline,
          }}>
          Tap any row to inspect/edit
        </Text>
        <Pressable
          onPress={onResumeEntry}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
          <Text
            style={{
              fontFamily: TerminalFonts.bodyBold,
              fontSize: 12,
              color: TerminalColors.accent,
            }}>
            Resume Entry
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
