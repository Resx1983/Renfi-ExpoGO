import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { useAuth, esAdmin } from '../context/AuthContext';
import { Colors, Radius, Fonts, Spacing, Shadows } from '../constants/theme';
import { LogoMark } from './Brand';
import { Button } from './ui/Button';

// =============================================================================
// APP HEADER — Barra cal con logo + menú desplegable (header web develop)
// "Fincas" y "Cómo funciona" llevan a Inicio con ?seccion=portafolio|procesos
// =============================================================================

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const { usuario, cerrarSesion } = useAuth();
  const [open, setOpen] = useState(false);

  const go = (href: Href) => {
    setOpen(false);
    router.navigate(href);
  };

  const nombreCorto = usuario
    ? usuario.NombreUsuario
      ? `${usuario.NombreUsuario} ${usuario.ApellidoUsuario?.[0] ?? ''}.`.replace(/ \.$/, '')
      : usuario.Correo || 'Usuario Renfi'
    : '';

  return (
    <View style={[styles.bar, { paddingTop: insets.top }]}>
      <Pressable accessibilityRole="link" accessibilityLabel="Renfi, ir al inicio" style={styles.brand} onPress={() => router.navigate('/')}>
        <LogoMark />
        <View>
          <Text style={styles.brandTitle}>Renfi</Text>
          <Text style={styles.brandSub}>Fincas de recreo en Colombia</Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Cerrar menú' : 'Abrir menú'}
        style={styles.menuBtn}
        onPress={() => setOpen((o) => !o)}
      >
        <Ionicons name={open ? 'close' : 'menu'} size={20} color={Colors.textPrimary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { paddingTop: insets.top + 68 }]} onPress={() => setOpen(false)}>
          <Pressable style={styles.menu} onPress={() => {}}>
            <MenuLink label="Fincas" onPress={() => go({ pathname: '/', params: { seccion: 'portafolio' } })} />
            <MenuLink label="Cómo funciona" onPress={() => go({ pathname: '/', params: { seccion: 'procesos' } })} />
            <MenuLink label="Sobre nosotros" onPress={() => go('/sobre-nosotros')} last />

            <View style={styles.auth}>
              {usuario ? (
                <>
                  <Pressable accessibilityRole="link" accessibilityLabel="Mi cuenta" style={styles.chip} onPress={() => go('/mi-cuenta')}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(usuario.NombreUsuario || usuario.Correo || 'U')[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.chipText} numberOfLines={1}>
                      {nombreCorto}
                    </Text>
                  </Pressable>
                  {esAdmin(usuario) && (
                    <Button title="Panel admin" icon="grid-outline" variant="ghost" size="sm" onPress={() => go('/administrador')} />
                  )}
                  <Button
                    title="Cerrar sesión"
                    icon="log-out-outline"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setOpen(false);
                      cerrarSesion();
                      router.replace('/');
                    }}
                  />
                </>
              ) : (
                <>
                  <Button title="Iniciar sesión" variant="ghost" size="sm" onPress={() => go('/iniciar-sesion')} />
                  <Button title="Crear cuenta" size="sm" onPress={() => go('/registrarse')} />
                </>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuLink({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.link, !last && styles.linkBorder, pressed && { backgroundColor: Colors.ghostPressed }]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    minHeight: 68,
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMedium,
    zIndex: 10,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  brandTitle: { fontFamily: Fonts.bold, fontSize: 22, lineHeight: 24, letterSpacing: -0.4, color: Colors.secondary },
  brandSub: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.textSecondary },
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
  overlay: { flex: 1, backgroundColor: 'rgba(8,28,21,0.2)', paddingHorizontal: Spacing.gutter },
  menu: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.lg,
  },
  link: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 4 },
  linkBorder: { borderBottomWidth: 1, borderBottomColor: Colors.surfaceMedium },
  linkText: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textSecondary },
  auth: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMedium,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    maxWidth: 220,
    minHeight: 40,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textInverse },
  chipText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textPrimary, flexShrink: 1 },
});
