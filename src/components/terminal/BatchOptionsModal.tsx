import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Modal, Pressable, Switch, Text, View } from 'react-native';

import { ShadowMd, TerminalColors, TerminalFonts } from '@/constants/terminal-theme';
import type { TallyEntry } from '@/types/tally';
import { buildCsvContent, buildJsonContent, exportBatchFile } from '@/utils/tally';

interface BatchOptionsModalProps {
  visible: boolean;
  entries: TallyEntry[];
  confirmStepOnNext: boolean;
  onClose: () => void;
  onToggleConfirmStep: (enabled: boolean) => void;
  onClearBatch: () => void;
}

export function BatchOptionsModal({
  visible,
  entries,
  confirmStepOnNext,
  onClose,
  onToggleConfirmStep,
  onClearBatch,
}: BatchOptionsModalProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleClose = () => {
    setConfirmingClear(false);
    setStatusMessage(null);
    onClose();
  };

  const handleExportCsv = async () => {
    const csv = buildCsvContent(entries);
    const result = await exportBatchFile('tally_batch.csv', csv, 'text/csv');
    setStatusMessage(result.message);
    if (result.ok) {
      setTimeout(() => {
        handleClose();
      }, 650);
    }
  };

  const handleExportJson = async () => {
    const json = buildJsonContent(entries);
    const result = await exportBatchFile('tally_batch.json', json, 'application/json');
    setStatusMessage(result.message);
    if (result.ok) {
      setTimeout(() => {
        handleClose();
      }, 650);
    }
  };

  const handleClearPress = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    onClearBatch();
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right', 'portrait']}
      onRequestClose={handleClose}>
      <Pressable
        onPress={handleClose}
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: TerminalColors.backdrop }}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            ShadowMd,
            {
              width: '100%',
              maxWidth: 400,
              borderRadius: 16,
              backgroundColor: TerminalColors.surface,
              borderWidth: 1,
              borderColor: TerminalColors.outlineMuted,
              padding: 20,
              gap: 14,
            },
          ]}>
          {/* Header */}
          <View
            className="flex-row items-center justify-between pb-2.5"
            style={{ borderBottomWidth: 1, borderBottomColor: TerminalColors.surfaceContainerHigh }}>
            <Text
              style={{
                fontFamily: TerminalFonts.displayBold,
                fontSize: 22,
                color: TerminalColors.onSurface,
              }}>
              Batch Options
            </Text>
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              accessibilityLabel="Close Batch Options"
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
              <MaterialIcons name="close" size={24} color={TerminalColors.outline} />
            </Pressable>
          </View>

          <Text
            style={{
              fontFamily: TerminalFonts.bodyMedium,
              fontSize: 13,
              color: TerminalColors.outline,
            }}>
            Manage offline tally storage &amp; reporting ({entries.length}{' '}
            {entries.length === 1 ? 'slip' : 'slips'})
          </Text>

          {/* Export Buttons */}
          <View className="flex-row gap-2.5">
            <Pressable
              onPress={handleExportCsv}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 11,
                borderRadius: 10,
                backgroundColor: pressed
                  ? TerminalColors.surfaceContainerHigh
                  : TerminalColors.surfaceContainer,
                borderWidth: 1,
                borderColor: TerminalColors.outlineMuted,
              })}>
              <MaterialIcons name="download" size={18} color={TerminalColors.onSurface} />
              <Text
                style={{
                  fontFamily: TerminalFonts.bodyBold,
                  fontSize: 13,
                  color: TerminalColors.onSurface,
                }}>
                Export CSV
              </Text>
            </Pressable>

            <Pressable
              onPress={handleExportJson}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 11,
                borderRadius: 10,
                backgroundColor: pressed
                  ? TerminalColors.surfaceContainerHigh
                  : TerminalColors.surfaceContainer,
                borderWidth: 1,
                borderColor: TerminalColors.outlineMuted,
              })}>
              <MaterialIcons name="data-object" size={18} color={TerminalColors.onSurface} />
              <Text
                style={{
                  fontFamily: TerminalFonts.bodyBold,
                  fontSize: 13,
                  color: TerminalColors.onSurface,
                }}>
                Export JSON
              </Text>
            </Pressable>
          </View>

          {statusMessage && (
            <View
              className="rounded-lg px-3 py-2"
              style={{ backgroundColor: TerminalColors.successTint }}>
              <Text
                style={{
                  fontFamily: TerminalFonts.bodySemiBold,
                  fontSize: 12,
                  color: TerminalColors.success,
                  textAlign: 'center',
                }}>
                {statusMessage}
              </Text>
            </View>
          )}

          {/* Confirm Step on Next Switch */}
          <View
            className="flex-row items-center justify-between rounded-xl px-3.5 py-3"
            style={{ backgroundColor: TerminalColors.surfaceContainer }}>
            <View className="flex-1 pr-3">
              <Text
                style={{
                  fontFamily: TerminalFonts.bodyBold,
                  fontSize: 13.5,
                  color: TerminalColors.onSurface,
                }}>
                Confirm Step on Next
              </Text>
              <Text
                style={{
                  fontFamily: TerminalFonts.bodyRegular,
                  fontSize: 12,
                  color: TerminalColors.outline,
                  marginTop: 2,
                }}>
                First press checks off, second press advances
              </Text>
            </View>
            <Switch
              value={confirmStepOnNext}
              onValueChange={onToggleConfirmStep}
              trackColor={{
                false: TerminalColors.surfaceContainerHigh,
                true: TerminalColors.primary,
              }}
              thumbColor={TerminalColors.surface}
            />
          </View>

          {/* Divider */}
          <View
            style={{
              height: 1,
              backgroundColor: TerminalColors.surfaceContainerHigh,
            }}
          />

          {/* Clear / New Batch Two-Step Confirmation */}
          {confirmingClear ? (
            <View className="gap-2">
              <Text
                style={{
                  fontFamily: TerminalFonts.bodySemiBold,
                  fontSize: 12.5,
                  color: TerminalColors.error,
                  textAlign: 'center',
                }}>
                Clear entire active batch? This cannot be undone.
              </Text>
              <View className="flex-row gap-2.5">
                <Pressable
                  onPress={() => setConfirmingClear(false)}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed
                      ? TerminalColors.surfaceContainerHigh
                      : TerminalColors.surfaceContainer,
                  })}>
                  <Text
                    style={{
                      fontFamily: TerminalFonts.bodyBold,
                      fontSize: 13,
                      color: TerminalColors.onSurface,
                    }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleClearPress}
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: TerminalColors.error,
                    opacity: pressed ? 0.85 : 1,
                  })}>
                  <Text
                    style={{
                      fontFamily: TerminalFonts.bodyBold,
                      fontSize: 13,
                      color: TerminalColors.onPrimary,
                    }}>
                    Confirm Clear
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={handleClearPress}
              style={({ pressed }) => ({
                width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 11,
                borderRadius: 10,
                backgroundColor: TerminalColors.error,
                opacity: pressed ? 0.85 : 1,
              })}>
              <MaterialIcons name="delete-forever" size={19} color={TerminalColors.onPrimary} />
              <Text
                style={{
                  fontFamily: TerminalFonts.bodyBold,
                  fontSize: 13,
                  color: TerminalColors.onPrimary,
                }}>
                Clear / New Batch
              </Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
