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
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
        // Fase 2: navegar al detalle de la finca
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
              ${finca.Precio.toLocaleString('es-CO')}
            </Text>
            <Text style={styles.priceUnit}>/noche</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>👥 {finca.Capacidad} pers.</Text>
            <Text style={styles.metaItem}>⭐ {finca.Calificacion}/5</Text>
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      await cargarFincas();
      setLoading(false);
    })();
  }, [cargarFincas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarFincas();
    setRefreshing(false);
  }, [cargarFincas]);

  const handleCerrarSesion = () => {
    cerrarSesion();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>
            Hola, {usuario?.NombreUsuario ?? 'Bienvenido'} 👋
          </Text>
          <Text style={styles.headerSub}>Encuentra tu próxima escapada</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={handleCerrarSesion}>
          <Text style={styles.avatarText}>
            {usuario?.NombreUsuario?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Zócalo ── */}
      <View style={styles.zocalo}>
        <View style={styles.zocaloGreen} />
        <View style={styles.zocaloWhite} />
        <View style={styles.zocaloTerra} />
      </View>

      {/* ── Cuerpo ── */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando fincas…</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>Error al cargar</Text>
          <Text style={styles.emptyDesc}>{error}</Text>
          <Button title="Reintentar" onPress={cargarFincas} />
        </View>
      ) : fincas.length === 0 ? (
        <EmptyState onRetry={cargarFincas} />
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
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: Spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  // ── Zócalo ──────────────────────────────────────────────────────────────
  zocalo: { flexDirection: 'column', height: 14 },
  zocaloGreen: { height: 2, backgroundColor: Colors.secondary },
  zocaloWhite: { height: 3, backgroundColor: Colors.surfaceLight },
  zocaloTerra: { flex: 1, backgroundColor: Colors.primary },

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
