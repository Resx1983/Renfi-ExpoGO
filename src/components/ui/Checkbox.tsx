import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, FontSize, Fonts } from '../../constants/theme';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function Checkbox({ label, checked, onChange, error }: CheckboxProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={styles.row}
        onPress={() => onChange(!checked)}
      >
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && <Ionicons name="checkmark" size={14} color={Colors.textInverse} />}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  boxChecked: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  label: { flex: 1, fontSize: FontSize.sm, fontFamily: Fonts.medium, color: Colors.textSecondary },
  error: { marginTop: 4, fontSize: 12.8, fontFamily: Fonts.medium, color: Colors.danger, borderRadius: Radius.sm },
});
