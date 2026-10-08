import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Radius, Fonts } from '../../constants/theme';

// =============================================================================
// BADGE — Píldoras suaves de estado (fondo tenue + texto de color)
// =============================================================================

type BadgeVariant = 'success' | 'warning' | 'danger' | 'primary' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successSurface, text: Colors.secondary },
  warning: { bg: Colors.warningSurface, text: Colors.warning },
  danger: { bg: Colors.dangerSurface, text: Colors.danger },
  primary: { bg: Colors.primarySurface, text: Colors.primaryDark },
  default: { bg: Colors.surfaceMedium, text: Colors.textPrimary },
};

export function Badge({ label, variant = 'default', dot, style }: BadgeProps) {
  const c = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: c.text }]} />}
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const norm = (s: string) => (s || '').trim().toLowerCase();

// Finca: 'Disponible' → success; cualquier otro estado → warning (web develop)
export function estadoFincaVariant(estado: string): BadgeVariant {
  const e = norm(estado);
  if (!e) return 'default';
  return e === 'disponible' ? 'success' : 'warning';
}

// Reserva / pago: activas y pagadas → success; canceladas → danger; resto → warning
export function estadoReservaVariant(estado: string): BadgeVariant {
  const e = norm(estado);
  if (['activa', 'confirmada', 'pagado', 'completada'].includes(e)) return 'success';
  if (['cancelada', 'cancelado', 'anulada', 'anulado', 'rechazado'].includes(e)) return 'danger';
  if (!e) return 'default';
  return 'warning';
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: Fonts.semibold,
    letterSpacing: 0.24,
  },
});
