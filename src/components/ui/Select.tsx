import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, FontSize, Fonts, Spacing, Shadows } from '../../constants/theme';

// =============================================================================
// SELECT — Equivalente móvil del <select> web (hoja modal con opciones)
// =============================================================================

export interface SelectOption<T extends string | number> {
  label: string;
  value: T;
}

interface SelectProps<T extends string | number> {
  label?: string;
  required?: boolean;
  value: T | null | undefined;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  error?: string;
}

export function Select<T extends string | number>({
  label,
  required,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar...',
  error,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.container}>
      {!!label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.field, !!error && styles.errorBorder]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {!!label && <Text style={styles.sheetTitle}>{label}</Text>}
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
                    {active && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.label, fontFamily: Fonts.semibold, color: Colors.textPrimary, marginBottom: 6 },
  required: { color: Colors.danger },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceBase,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceDark,
    minHeight: 46,
    paddingHorizontal: 14,
  },
  errorBorder: { borderColor: Colors.danger },
  value: { flex: 1, fontSize: FontSize.input, fontFamily: Fonts.regular, color: Colors.textPrimary },
  placeholder: { color: Colors.placeholder },
  error: { marginTop: 4, fontSize: 12.8, fontFamily: Fonts.medium, color: Colors.danger },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.lg },
  sheet: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xxl,
    padding: Spacing.md,
    maxHeight: '70%',
    ...Shadows.xl,
  },
  sheetTitle: { fontSize: FontSize.lg, fontFamily: Fonts.bold, color: Colors.textPrimary, marginBottom: Spacing.sm, paddingHorizontal: 8 },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
  },
  optionActive: { backgroundColor: Colors.primarySurface },
  optionText: { fontSize: FontSize.base, fontFamily: Fonts.medium, color: Colors.textSecondary },
  optionTextActive: { color: Colors.primary, fontFamily: Fonts.semibold },
});
