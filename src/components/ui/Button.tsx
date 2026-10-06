import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, FontSize, FontWeight, Shadows } from '../../constants/theme';

// =============================================================================
// BUTTON — Cápsulas táctiles del design system Renfi
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'forest' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: Colors.primary,
      ...Shadows.tejaPrimary,
    },
    text: { color: Colors.textInverse },
  },
  secondary: {
    container: {
      backgroundColor: Colors.surfaceLight,
      borderWidth: 1,
      borderColor: Colors.surfaceDark,
    },
    text: { color: Colors.textPrimary },
  },
  forest: {
    container: { backgroundColor: Colors.secondary },
    text: { color: Colors.textInverse },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: Colors.secondary },
  },
  danger: {
    container: { backgroundColor: Colors.danger },
    text: { color: Colors.textInverse },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { height: 36, paddingHorizontal: 14 },
    text: { fontSize: FontSize.sm },
  },
  md: {
    container: { height: 46, paddingHorizontal: 24 },
    text: { fontSize: FontSize.base },
  },
  lg: {
    container: { height: 54, paddingHorizontal: 30 },
    text: { fontSize: FontSize.md },
  },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={isDisabled}
      style={[
        styles.base,
        variantStyles[variant].container,
        sizeStyles[size].container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? Colors.secondary : Colors.textInverse}
        />
      ) : (
        <Text style={[styles.text, variantStyles[variant].text, sizeStyles[size].text]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
