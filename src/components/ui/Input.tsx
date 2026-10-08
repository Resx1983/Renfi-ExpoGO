import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, FontSize, Fonts, Spacing } from '../../constants/theme';

// =============================================================================
// INPUT — Campo con etiqueta arriba; foco terracota con halo
// =============================================================================

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, required, error, hint, icon, containerStyle, multiline, editable = true, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={[styles.halo, focused && styles.haloFocused, !!error && styles.haloError]}>
        {!!icon && <Ionicons name={icon} size={18} color={Colors.textTertiary} style={styles.icon} />}
        <TextInput
          style={[
            styles.input,
            !!icon && styles.withIcon,
            multiline && styles.multiline,
            focused && styles.focused,
            !!error && styles.errorBorder,
            !editable && styles.readonly,
            style,
          ]}
          placeholderTextColor={Colors.placeholder}
          multiline={multiline}
          editable={editable}
          accessibilityLabel={label}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
      </View>
      {!!error ? <Text style={styles.error}>{error}</Text> : !!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.label,
    fontFamily: Fonts.semibold,
    letterSpacing: 0.14,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  required: {
    color: Colors.danger,
  },
  halo: {
    borderRadius: Radius.md + 3,
    borderWidth: 3,
    borderColor: 'transparent',
    margin: -3,
  },
  haloFocused: {
    borderColor: Colors.focusHalo,
  },
  haloError: {
    borderColor: 'rgba(180,35,24,0.14)',
  },
  icon: {
    position: 'absolute',
    left: 14,
    top: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceDark,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: FontSize.input,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
  },
  withIcon: {
    paddingLeft: 42,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  focused: {
    borderColor: Colors.primary,
  },
  errorBorder: {
    borderColor: Colors.danger,
  },
  readonly: {
    backgroundColor: Colors.surfaceBase,
    color: Colors.textSecondary,
  },
  error: {
    marginTop: 6,
    fontSize: FontSize.sm,
    fontFamily: Fonts.medium,
    color: Colors.danger,
  },
  hint: {
    marginTop: 6,
    fontSize: FontSize.sm,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
});
