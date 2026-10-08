import React from 'react';
import { View, Text, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Fonts, Shadows, Spacing } from '../../constants/theme';
import { Button } from './Button';

// =============================================================================
// FEEDBACK — Alert (avisos en línea), StateBlock (cargando/vacío/error) y
// ConfirmDialog (diálogo de confirmación) del sistema "La Finca Abierta"
// =============================================================================

type AlertTone = 'error' | 'success' | 'warning' | 'info';

const tones: Record<AlertTone, { bg: string; text: string; icon: keyof typeof Ionicons.glyphMap; border: string }> = {
  error: { bg: Colors.dangerSurface, text: Colors.danger, icon: 'alert-circle', border: 'rgba(180,35,24,0.18)' },
  success: { bg: Colors.successSurface, text: Colors.secondary, icon: 'checkmark-circle', border: 'rgba(45,106,79,0.2)' },
  warning: { bg: Colors.warningSurface, text: Colors.warning, icon: 'warning', border: 'rgba(146,64,14,0.18)' },
  info: { bg: Colors.surfaceBase, text: Colors.textPrimary, icon: 'information-circle', border: Colors.surfaceMedium },
};

export function Alert({ tone = 'info', children }: { tone?: AlertTone; children: React.ReactNode }) {
  const t = tones[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      style={[styles.alert, { backgroundColor: t.bg, borderColor: t.border }]}
    >
      <Ionicons name={t.icon} size={18} color={t.text} style={styles.alertIcon} />
      <Text style={[styles.alertText, { color: t.text }]}>{children}</Text>
    </View>
  );
}

interface StateBlockProps {
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  text?: string;
  action?: { title: string; onPress: () => void };
}

export function StateBlock({ loading, icon = 'home-outline', title, text, action }: StateBlockProps) {
  return (
    <View style={styles.state}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <View style={styles.stateIcon}>
          <Ionicons name={icon} size={26} color={Colors.secondary} />
        </View>
      )}
      {!!title && <Text style={styles.stateTitle}>{title}</Text>}
      {!!text && <Text style={styles.stateText}>{text}</Text>}
      {!!action && <Button title={action.title} variant="secondary" onPress={action.onPress} style={styles.stateAction} />}
    </View>
  );
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  detail?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  confirmText: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  detail,
  icon = 'help-circle-outline',
  danger,
  confirmText,
  cancelText = 'Cancelar',
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={[styles.dialogIcon, danger && { backgroundColor: Colors.dangerSurface }]}>
            <Ionicons name={icon} size={24} color={danger ? Colors.danger : Colors.primary} />
          </View>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogText}>{message}</Text>
          {!!detail && <Text style={[styles.dialogText, styles.dialogDetail]}>{detail}</Text>}
          <View style={styles.dialogActions}>
            <Button title={cancelText} variant="secondary" onPress={onCancel} disabled={loading} fullWidth />
            <Button
              title={confirmText}
              variant={danger ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={loading}
              fullWidth
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  alertIcon: { marginTop: 2 },
  alertText: { flex: 1, fontFamily: Fonts.medium, fontSize: 14.4, lineHeight: 22 },
  state: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16, gap: 10 },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { fontFamily: Fonts.bold, fontSize: 18.4, color: Colors.textPrimary, textAlign: 'center' },
  stateText: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 23, color: Colors.textSecondary, textAlign: 'center', maxWidth: 340 },
  stateAction: { alignSelf: 'center', marginTop: 6 },
  scrim: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.gutter },
  dialog: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xxl,
    padding: 24,
    gap: 10,
    ...Shadows.xl,
  },
  dialogIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.secondary },
  dialogText: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 23, color: Colors.textSecondary },
  dialogDetail: { fontFamily: Fonts.medium },
  dialogActions: { gap: 10, marginTop: 8 },
});
