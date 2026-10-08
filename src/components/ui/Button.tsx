import React from 'react';
import { Pressable, View, Text, StyleSheet, ActivityIndicator, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Fonts, Shadows } from '../../constants/theme';

// =============================================================================
// BUTTON — Píldoras sólidas "La Finca Abierta" (sin gradientes)
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'forest' | 'ghost' | 'onDark' | 'danger' | 'dangerGhost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const variants: Record<ButtonVariant, { bg: string; pressed: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary, pressed: Colors.primaryDark, text: Colors.textInverse },
  secondary: { bg: Colors.surfaceLight, pressed: Colors.surfaceLight, text: Colors.textPrimary, border: Colors.surfaceDark },
  forest: { bg: Colors.secondary, pressed: Colors.secondaryDark, text: Colors.textInverse },
  ghost: { bg: 'transparent', pressed: Colors.ghostPressed, text: Colors.secondary },
  onDark: { bg: 'rgba(255,255,255,0.06)', pressed: 'rgba(255,255,255,0.14)', text: Colors.textInverse, border: 'rgba(255,255,255,0.3)' },
  danger: { bg: Colors.danger, pressed: Colors.dangerDark, text: Colors.textInverse },
  dangerGhost: { bg: 'transparent', pressed: Colors.dangerSurface, text: Colors.danger },
};

const sizes: Record<ButtonSize, { minHeight: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { minHeight: 36, paddingHorizontal: 14, fontSize: 13.6 },
  md: { minHeight: 46, paddingHorizontal: 22, fontSize: 15.2 },
  lg: { minHeight: 54, paddingHorizontal: 30, fontSize: 16 },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = !!disabled || loading;
  const v = variants[variant];
  const { fontSize, ...box } = sizes[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={size === 'sm' ? 4 : 0}
      style={({ pressed }) => [
        styles.base,
        box,
        { backgroundColor: pressed ? v.pressed : v.bg },
        !!v.border && { borderWidth: 1, borderColor: pressed && variant === 'secondary' ? Colors.secondaryLight : v.border },
        variant === 'primary' && !isDisabled && Shadows.cta,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color={v.text} />
        ) : (
          !!icon && <Ionicons name={icon} size={18} color={v.text} />
        )}
        <Text style={[styles.text, { color: v.text, fontSize }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  text: {
    fontFamily: Fonts.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});
