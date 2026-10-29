import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Fonts, Radius, Shadows, Type } from '../../constants/theme';

// Piezas compartidas por las pantallas del panel "Mi finca"

export function Card({ children, style }: Readonly<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Stat({ title, value, desc }: Readonly<{ title: string; value: string; desc: string }>) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statDesc}>{desc}</Text>
    </Card>
  );
}

export const panelStyles = StyleSheet.create({
  title: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.secondary },
  sub: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  strong: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textPrimary },
  num: { ...Type.num, fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textPrimary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, borderRadius: Radius.xl, padding: 16, gap: 6, ...Shadows.sm },
  stat: { flexBasis: '47%', flexGrow: 1 },
  statTitle: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textPrimary },
  statValue: { ...Type.num, fontFamily: Fonts.bold, fontSize: 26, color: Colors.secondary },
  statDesc: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
});
