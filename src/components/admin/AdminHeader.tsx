import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { ADMIN_NAV } from '../../constants/adminResources';
import { LogoMark } from '../Brand';
import { Button } from '../ui/Button';
import { Colors, Radius, Fonts, Spacing, Shadows, Type } from '../../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

// slug -> icono Ionicons ('' = Inicio)
const ICONOS: Record<string, IconName> = {
  '': 'grid-outline',
  usuarios: 'people-outline',
  fincas: 'home-outline',
  reservas: 'calendar-outline',
  pagos: 'card-outline',
  facturas: 'document-text-outline',
  'metodos-de-pago': 'wallet-outline',
  imagenes: 'images-outline',
  municipios: 'location-outline',
  roles: 'shield-outline',
};

// Barra superior del panel admin + drawer verde. `slug` = sección actual ('' = Inicio).
export function AdminHeader({ slug = '' }: Readonly<{ slug?: string }>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { usuario, cerrarSesion } = useAuth();
  const [open, setOpen] = useState(false);
  const actual = ADMIN_NAV.find((n) => n.slug === slug) ?? ADMIN_NAV[0];
  const nombre = usuario ? `${usuario.NombreUsuario} ${usuario.ApellidoUsuario}`.trim() : '';

  const go = (href: Href, replace = false) => {
    setOpen(false);
    if (replace) router.replace(href);
    else router.push(href);
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 10 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
        style={styles.menuBtn}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="menu" size={20} color={Colors.textPrimary} />
      </Pressable>
      <View style={styles.flex}>
        <Text style={styles.h1} numberOfLines={1}>{actual.title}</Text>
        <Text style={styles.p} numberOfLines={1}>{actual.description}</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(nombre || 'A')[0].toUpperCase()}</Text>
      </View>
      <Button title="Ver portal" size="sm" variant="secondary" onPress={() => go('/')} />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.drawer, { width: Math.min(264, width * 0.86), paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.brand}>
              <LogoMark size={36} />
              <View>
                <Text style={styles.brandTitle}>Renfi</Text>
                <Text style={styles.brandSub}>Administración</Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.nav}>
              {ADMIN_NAV.map((n) => {
                const on = n.slug === slug;
                return (
                  <Pressable
                    key={n.slug || 'inicio'}
                    accessibilityRole="link"
                    accessibilityState={{ selected: on }}
                    style={({ pressed }) => [styles.navItem, on && styles.navOn, pressed && !on && styles.navPressed]}
                    onPress={() => go((n.slug ? `/administrador/${n.slug}` : '/administrador') as Href, true)}
                  >
                    <Ionicons name={ICONOS[n.slug] ?? 'grid-outline'} size={20} color={on ? Colors.onDarkAccent : Colors.textOnDarkMuted} />
                    <Text style={[styles.navLabel, on && styles.navLabelOn]}>{n.title}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.foot}>
              <Pressable style={styles.navItem} accessibilityRole="link" onPress={() => go('/')}>
                <Ionicons name="globe-outline" size={20} color={Colors.textOnDarkMuted} />
                <Text style={styles.navLabel}>Ver portal público</Text>
              </Pressable>
              <Pressable
                style={styles.navItem}
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  cerrarSesion();
                  router.replace('/');
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={Colors.textOnDarkMuted} />
                <Text style={styles.navLabel}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
          <Pressable style={styles.flex} accessibilityLabel="Cerrar menú" onPress={() => setOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 68,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMedium,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
  },
  h1: { ...Type.title, fontFamily: Fonts.bold, color: Colors.secondary, fontSize: 18 },
  p: { fontFamily: Fonts.regular, fontSize: 13.6, color: Colors.textSecondary },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.secondary },
  avatarText: { color: Colors.textInverse, fontFamily: Fonts.bold, fontSize: 15 },
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(8,28,21,0.45)' },
  drawer: { backgroundColor: Colors.secondary, ...Shadows.xl },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 68, paddingHorizontal: 20 },
  brandTitle: { fontFamily: Fonts.bold, fontSize: 17.6, color: Colors.surfaceLight },
  brandSub: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textOnDarkMuted },
  nav: { paddingVertical: 16, paddingHorizontal: 12, gap: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: Radius.md },
  navOn: { backgroundColor: 'rgba(255,255,255,0.10)' },
  navPressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
  navLabel: { fontFamily: Fonts.medium, fontSize: 14.4, color: Colors.textOnDarkMuted },
  navLabelOn: { color: Colors.surfaceLight },
  foot: {
    padding: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(8,28,21,0.45)',
  },
});
