import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../../constants/theme';
import { Badge, estadoFincaVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { obtenerFincaPorId, eliminarFinca } from '../../../services/fincas.service';
import { useAuth } from '../../../context/AuthContext';
import { Finca } from '../../../types';

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
  'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&q=80',
];

export default function FincaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();

  const [finca, setFinca] = useState<Finca | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const esAdmin = usuario?.IdRol === 1 || usuario?.IdRol === 3;
  const fincaId = Number(id);

  const cargarDetalle = useCallback(async () => {
    if (!fincaId || isNaN(fincaId)) {
      setError('Identificador de finca inválido.');
      return;
    }

    const { data, error: err } = await obtenerFincaPorId(fincaId);

    if (err || !data) {
      setError(err ?? 'No se encontró la finca.');
    } else {
      setFinca(data);
      setError(null);
    }
  }, [fincaId]);

  useEffect(() => {
    let activo = true;
    cargarDetalle().finally(() => {
      if (activo) setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, [cargarDetalle]);

  const confirmarEliminar = () => {
    const procederEliminar = async () => {
      setEliminando(true);
      const { success, error: err } = await eliminarFinca(fincaId);
      setEliminando(false);

      if (!success || err) {
        if (Platform.OS === 'web') {
          window.alert(err ?? 'Error al eliminar la finca.');
        } else {
          Alert.alert('Error', err ?? 'Error al eliminar la finca.');
        }
        return;
      }

      if (Platform.OS === 'web') {
        window.alert('Finca eliminada exitosamente.');
        router.replace('/(main)/home');
      } else {
        Alert.alert('Finca eliminada', 'La finca ha sido eliminada del catálogo.', [
          { text: 'Aceptar', onPress: () => router.replace('/(main)/home') },
        ]);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta finca permanentemente?')) {
          procederEliminar();
        }
      } else {
        procederEliminar();
      }
    } else {
      Alert.alert(
        'Eliminar finca',
        '¿Estás seguro de que deseas eliminar esta finca permanentemente?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: procederEliminar },
        ]
      );
    }
  };

  const imagenPrincipal =
    finca?.Imagenes?.[0]?.UrlImagen ??
    PLACEHOLDER_IMAGES[(finca?.IdFinca ?? 0) % PLACEHOLDER_IMAGES.length];

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      {/* ── Top Bar Flotante ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>

        {esAdmin && finca && (
          <View style={styles.adminTopActions}>
            <TouchableOpacity
              style={styles.adminActionChip}
              onPress={() =>
                router.push({
                  pathname: '/(main)/admin/editar-finca/[id]',
                  params: { id: String(finca.IdFinca) },
                } as any)
              }
            >
              <Text style={styles.adminActionText}>✏️ Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.adminActionChip, styles.adminDeleteChip]}
              onPress={confirmarEliminar}
              disabled={eliminando}
            >
              <Text style={styles.adminDeleteText}>
                {eliminando ? '...' : '🗑️ Eliminar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Contenido Principal ── */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando información de la finca…</Text>
        </View>
      ) : error || !finca ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar finca</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <Button title="Volver al inicio" onPress={() => router.replace('/(main)/home')} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Imagen Cover */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imagenPrincipal }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay} />
            <View style={styles.badgesOnImage}>
              <Badge label={finca.Estado} variant={estadoFincaVariant(finca.Estado)} />
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {finca.Calificacion}/5</Text>
              </View>
            </View>
          </View>

          {/* Información Principal */}
          <View style={styles.contentCard}>
            <Text style={styles.fincaTitle}>{finca.NombreFinca}</Text>
            {finca.NombreMunicipio && (
              <Text style={styles.municipioText}>
                📍 {finca.NombreMunicipio}
                {finca.Direccion ? ` · ${finca.Direccion}` : ''}
              </Text>
            )}

            {/* Fila de características */}
            <View style={styles.featuresRow}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>👥</Text>
                <Text style={styles.featureValue}>{finca.Capacidad} personas</Text>
                <Text style={styles.featureLabel}>Capacidad máxima</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🏡</Text>
                <Text style={styles.featureValue}>{finca.Estado}</Text>
                <Text style={styles.featureLabel}>Disponibilidad</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🌿</Text>
                <Text style={styles.featureValue}>Campestre</Text>
                <Text style={styles.featureLabel}>Ambiente natural</Text>
              </View>
            </View>

            {/* Separador */}
            <View style={styles.separator} />

            {/* Descripción */}
            <Text style={styles.sectionHeader}>Descripción y comodidades</Text>
            <Text style={styles.descriptionText}>
              {finca.InformacionAdicional ||
                'Hermosa propiedad campestre rodeada de naturaleza y tranquilidad. Ideal para descanso familiar, paseos de fin de semana y celebraciones especiales con todas las comodidades.'}
            </Text>

            {/* Separador */}
            <View style={styles.separator} />

            {/* Anfitrión / Contacto */}
            <Text style={styles.sectionHeader}>Anfitrión responsable</Text>
            <View style={styles.hostCard}>
              <View style={styles.hostAvatar}>
                <Text style={styles.hostAvatarText}>
                  {finca.NombrePropietario?.[0]?.toUpperCase() ?? 'A'}
                </Text>
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostName}>
                  {finca.NombrePropietario} {finca.ApellidoPropietario}
                </Text>
                <Text style={styles.hostSub}>
                  {finca.TelefonoPropietario ? `📞 ${finca.TelefonoPropietario}` : 'Anfitrión verificado Renfi'}
                </Text>
                {finca.CorreoPropietario && (
                  <Text style={styles.hostEmail}>✉️ {finca.CorreoPropietario}</Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── Barra Inferior Fija de Reserva ── */}
      {finca && !loading && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Precio por noche</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>
                ${(finca.Precio ?? 0).toLocaleString('es-CO')}
              </Text>
              <Text style={styles.priceCurrency}> COP</Text>
            </View>
          </View>

          <Button
            title="Reservar ahora"
            size="lg"
            style={styles.reserveBtn}
            disabled={finca.Estado !== 'Disponible'}
            onPress={() =>
              router.push({
                pathname: '/(main)/reservar/[id]',
                params: { id: String(finca.IdFinca) },
              } as any)
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },

  // Top bar flotante
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 10,
    backgroundColor: 'rgba(27, 48, 34, 0.75)',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  backBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  adminTopActions: {
    flexDirection: 'row',
    gap: 8,
  },
  adminActionChip: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  adminActionText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.secondary,
  },
  adminDeleteChip: {
    backgroundColor: '#FEE2E2',
  },
  adminDeleteText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#DC2626',
  },

  // Imagen hero
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badgesOnImage: {
    position: 'absolute',
    bottom: 16,
    left: Spacing.gutter,
    right: Spacing.gutter,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  ratingText: {
    color: '#FBBF24',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Contenido
  scroll: { flex: 1 },
  contentCard: {
    backgroundColor: Colors.surfaceLight,
    marginTop: -16,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.gutter,
    paddingTop: 24,
    paddingBottom: 20,
    ...Shadows.aleroAmplio,
  },
  fincaTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  municipioText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: FontWeight.medium,
    marginTop: 4,
    marginBottom: 16,
  },

  // Características
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceBase,
    borderRadius: Radius.lg,
    padding: 12,
    marginVertical: 12,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  featureValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  featureLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  separator: {
    height: 1,
    backgroundColor: Colors.surfaceMedium,
    marginVertical: 18,
  },
  sectionHeader: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Anfitrión
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBase,
    padding: 12,
    borderRadius: Radius.lg,
    gap: 12,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.md,
  },
  hostInfo: { flex: 1 },
  hostName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  hostSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  hostEmail: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Sticky bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMedium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingTop: 12,
    ...Shadows.aleroAmplio,
  },
  priceContainer: { flex: 1 },
  priceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  priceCurrency: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  reserveBtn: {
    flex: 1.2,
    marginLeft: 16,
  },

  // Estados de carga / error
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.gutter,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  errorIcon: { fontSize: 38, marginBottom: 8 },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
});

