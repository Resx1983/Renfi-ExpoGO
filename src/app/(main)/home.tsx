import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../constants/theme';
import { Badge, estadoFincaVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { listarFincasDisponibles } from '../../services/fincas.service';
import { useAuth } from '../../context/AuthContext';
import { Finca } from '../../types';

// =============================================================================
// PANTALLA HOME
// =============================================================================

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80',
  'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&q=80',
  'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&q=80',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&q=80',
];

function getPlaceholderImage(id: number) {
  return PLACEHOLDER_IMAGES[id % PLACEHOLDER_IMAGES.length];
}

// ── Tarjeta de finca ─────────────────────────────────────────────────────────
function FincaCard({ finca }: { finca: Finca }) {
  const imageUrl = finca.Imagenes?.[0]?.UrlImagen ?? getPlaceholderImage(finca.IdFinca);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.card}
      onPress={() => {
        router.push({ pathname: '/(main)/finca/[id]', params: { id: String(finca.IdFinca) } } as any);
      }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardBody}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {finca.NombreFinca}
          </Text>
          <Badge
            label={finca.Estado}
            variant={estadoFincaVariant(finca.Estado)}
          />
        </View>

        {finca.NombreMunicipio && (
          <Text style={styles.cardMunicipio}>
            📍 {finca.NombreMunicipio}
          </Text>
        )}

        {finca.InformacionAdicional && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {finca.InformacionAdicional}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ${(finca.Precio ?? 0).toLocaleString('es-CO')}
            </Text>
            <Text style={styles.priceUnit}>/noche</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>👥 {finca.Capacidad ?? 1} pers.</Text>
            <Text style={styles.metaItem}>⭐ {finca.Calificacion ?? 5}/5</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Estado vacío ──────────────────────────────────────────────────────────────
function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Text style={{ fontSize: 32 }}>🌿</Text>
      </View>
      <Text style={styles.emptyTitle}>Sin fincas disponibles</Text>
      <Text style={styles.emptyDesc}>
        Por el momento no hay fincas disponibles.{'\n'}Vuelve a intentarlo más tarde.
      </Text>
      <Button title="Reintentar" variant="secondary" onPress={onRetry} />
    </View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { usuario, cerrarSesion } = useAuth();
  const insets = useSafeAreaInsets();
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarFincas = useCallback(async () => {
    const { data, error: err } = await listarFincasDisponibles();
    if (err) {
      setError(err);
      setFincas([]);
    } else {
      setFincas(data ?? []);
      setError(null);
    }
  }, []);

  // Carga con spinner a pantalla completa (inicial y botón "Reintentar")
  const cargarConSpinner = useCallback(async () => {
    setLoading(true);
    await cargarFincas();
    setLoading(false);
  }, [cargarFincas]);

  useEffect(() => {
    let activo = true;
    cargarFincas().finally(() => {
      if (activo) setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, [cargarFincas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarFincas();
    setRefreshing(false);
  }, [cargarFincas]);

  const salir = () => {
    cerrarSesion();
    router.replace('/(auth)/login');
  };

  const handleCerrarSesion = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const confirmar = window.confirm('¿Quieres cerrar sesión y salir de tu cuenta?');
        if (confirmar) salir();
      } else {
        salir();
      }
    } else {
      Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: salir,
        },
      ]);
    }
  };

  const esAdmin = usuario?.IdRol === 1 || usuario?.IdRol === 3;

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTextBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.headerGreeting} numberOfLines={1}>
              Hola, {usuario?.NombreUsuario ?? 'Bienvenido'} 👋
            </Text>
            {usuario?.NombreRol && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{usuario.NombreRol}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSub}>Encuentra tu próxima escapada</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleCerrarSesion}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {usuario?.NombreUsuario?.[0]?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text style={styles.logoutBtnText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* ── Zócalo ── */}
      <View style={styles.zocalo}>
        <View style={styles.zocaloGreen} />
        <View style={styles.zocaloWhite} />
        <View style={styles.zocaloTerra} />
      </View>

      {/* ── Barra de Navegación Rápida / Acciones por Rol ── */}
      <View style={styles.navBar}>
        {esAdmin ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navBarContent}
          >
            <TouchableOpacity
              style={styles.navPillPrimary}
              onPress={() => router.push('/(main)/admin/crear-finca')}
            >
              <Text style={styles.navPillPrimaryText}>+ Crear Finca</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navPill}
              onPress={() => router.push('/(main)/admin/fincas')}
            >
              <Text style={styles.navPillText}>🏡 Gestión Fincas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navPill}
              onPress={() => router.push('/(main)/admin/reservas')}
            >
              <Text style={styles.navPillText}>📋 Reservas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navPill}
              onPress={() => router.push('/(main)/mis-reservas')}
            >
              <Text style={styles.navPillText}>📅 Mis Reservas</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.navBarClient}>
            <TouchableOpacity
              style={styles.navPillPrimary}
              onPress={() => router.push('/(main)/mis-reservas')}
            >
              <Text style={styles.navPillPrimaryText}>📅 Mis Reservas</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Cuerpo ── */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando fincas…</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Error al cargar</Text>
          <Text style={styles.emptyDesc}>{error}</Text>
          <Button title="Reintentar" onPress={cargarConSpinner} />
        </View>
      ) : fincas.length === 0 ? (
        <EmptyState onRetry={cargarConSpinner} />
      ) : (
        <FlatList
          data={fincas}
          keyExtractor={(item) => String(item.IdFinca)}
          renderItem={({ item }) => <FincaCard finca={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Fincas disponibles</Text>
              <Text style={styles.sectionCount}>{fincas.length} encontradas</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.secondary,
    paddingBottom: 20,
    paddingHorizontal: Spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextBox: { flex: 1 },
  headerGreeting: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textOnDarkMuted,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    gap: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  logoutBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },

  // ── Zócalo ──────────────────────────────────────────────────────────────
  zocalo: { flexDirection: 'column', height: 14 },
  zocaloGreen: { height: 2, backgroundColor: Colors.secondary },
  zocaloWhite: { height: 3, backgroundColor: Colors.surfaceLight },
  zocaloTerra: { flex: 1, backgroundColor: Colors.primary },

  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },

  navBar: {
    backgroundColor: Colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMedium,
    paddingVertical: 10,
    paddingHorizontal: Spacing.gutter,
  },
  navBarContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  navBarClient: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navPill: {
    backgroundColor: Colors.surfaceBase,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
  },
  navPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  navPillPrimary: {
    backgroundColor: Colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
  },
  navPillPrimaryText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  // ── Lista ───────────────────────────────────────────────────────────────
  listContent: {
    padding: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // ── Tarjeta ──────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    marginBottom: 16,
    overflow: 'hidden',
    ...Shadows.alerLeve,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.surfaceMedium,
  },
  cardBody: {
    padding: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardMunicipio: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMedium,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  price: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metaItem: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // ── Loader / Empty / Error ────────────────────────────────────────────────
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
