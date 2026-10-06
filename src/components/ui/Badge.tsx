import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, FontSize, FontWeight } from '../../constants/theme';

// =============================================================================
// BADGE — Chips de estado del design system Renfi
// =============================================================================

type BadgeVariant = 'success' | 'warning' | 'danger' | 'primary' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantMap: Record<
  BadgeVariant,
  { bg: string; text: string }
> = {
  success: { bg: Colors.successSurface, text: Colors.success },
  warning: { bg: Colors.warningSurface, text: Colors.warning },
  danger: { bg: Colors.dangerSurface, text: Colors.danger },
  primary: { bg: Colors.primarySurface, text: Colors.primaryDark },
  default: { bg: Colors.surfaceMedium, text: Colors.textSecondary },
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const colors = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// Helper: convierte estado de finca a variante
export function estadoFincaVariant(estado: string): BadgeVariant {
  switch (estado) {
    case 'Disponible':
      return 'success';
    case 'Ocupada':
      return 'warning';
    case 'Mantenimiento':
      return 'danger';
    default:
      return 'default';
  }
}

// Helper: convierte estado de reserva a variante
export function estadoReservaVariant(estado: string): BadgeVariant {
  switch (estado) {
    case 'Confirmada':
      return 'success';
    case 'Pendiente':
      return 'warning';
    case 'Cancelada':
      return 'danger';
    case 'Completada':
      return 'primary';
    default:
      return 'default';
  }
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radius.full,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
});
