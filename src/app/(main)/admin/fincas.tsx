import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../../constants/theme';
import { Badge, estadoFincaVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  listarFincas,
  cambiarEstadoFinca,
  eliminarFinca,
} from '../../../services/fincas.service';
import { Finca, EstadoFinca } from '../../../types';

export default function AdminFincasScreen() {
  const insets = useSafeAreaInsets();
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarFincas = useCallback(async () => {
    const { data, error: err } = await listarFincas();
    if (err) {
      setError(err);
      setFincas([]);
    } else {
      setFincas(data ?? []);
      setError(null);
    }
  }, []);

  const cargarConSpinner = useCallback(async () => {
    setLoading(true);
    await cargarFincas();
    setLoading(false);
  }, [cargarFincas]);

  useEffect(() => {
    cargarConSpinner();
  }, [cargarConSpinner]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarFincas();
    setRefreshing(false);
  }, [cargarFincas]);

  const handleToggleEstado = async (item: Finca) => {
    const siguienteEstado: Record<EstadoFinca, EstadoFinca> = {
      Disponible: 'Ocupada',
      Ocupada: 'Mantenimiento',
      Mantenimiento: 'Disponible',
    };
    const nuevo = siguienteEstado[(item.Estado as EstadoFinca) ?? 'Disponible'];

    const { error: err } = await cambiarEstadoFinca(item.IdFinca, nuevo);
    if (err) {
      if (Platform.OS === 'web') {
        window.alert(err);
      } else {
        Alert.alert('Error', err);
      }
      return;
    }
    cargarFincas();
  };

  const handleEliminar = (idFinca: number, nombre: string) => {
    const proceder = async () => {
      const { success, error: err } = await eliminarFinca(idFinca);
      if (!success || err) {
        if (Platform.OS === 'web') {
          window.alert(err ?? 'Error al eliminar');
        } else {
          Alert.alert('Error', err ?? 'Error al eliminar');
        }
        return;
      }
      cargarFincas();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm(`¿Deseas eliminar la finca "${nombre}"?`)) {
          proceder();
        }
      } else {
        proceder();
      }
    } else {
      Alert.alert('Eliminar finca', `¿Deseas eliminar la finca "${nombre}"?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: proceder },
      ]);
    }
  };

  const renderItem = ({ item }: { item: Finca }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.NombreFinca}
          </Text>
          <Text style={styles.cardLocation}>
            📍 {item.NombreMunicipio ?? 'Antioquia'} · 👥 {item.Capacidad} pers.
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleToggleEstado(item)}>
          <Badge label={item.Estado} variant={estadoFincaVariant(item.Estado)} />
        </TouchableOpacity>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Precio noche:</Text>
        <Text style={styles.priceValue}>
          ${(item.Precio ?? 0).toLocaleString('es-CO')} COP
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() =>
            router.push({
              pathname: '/(main)/finca/[id]',
              params: { id: String(item.IdFinca) },
            } as any)
          }
        >
          <Text style={styles.actionBtnTextSecondary}>Ver Detalle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() =>
            router.push({
              pathname: '/(main)/admin/editar-finca/[id]',
              params: { id: String(item.IdFinca) },
            } as any)
          }
        >
          <Text style={styles.actionBtnTextPrimary}>✏️ Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnDanger}
          onPress={() => handleEliminar(item.IdFinca, item.NombreFinca)}
        >
          <Text style={styles.actionBtnTextDanger}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Fincas</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(main)/admin/crear-finca')}
        >
          <Text style={styles.addBtnText}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      {/* Zócalo */}
      <View style={styles.zocalo}>
        <View style={styles.zocaloGreen} />
        <View style={styles.zocaloWhite} />
        <View style={styles.zocaloTerra} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando catálogo completo…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <Button title="Reintentar" onPress={cargarConSpinner} />
        </View>
      ) : (
        <FlatList
          data={fincas}
          keyExtractor={(item) => String(item.IdFinca)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeaderRow}>
              <Text style={styles.countText}>{fincas.length} fincas en catálogo</Text>
              <Text style={styles.hintText}>Toca el badge de estado para alternarlo</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },

  header: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.gutter,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  backBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  addBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },

  zocalo: { flexDirection: 'column', height: 12 },
  zocaloGreen: { height: 2, backgroundColor: Colors.secondary },
  zocaloWhite: { height: 3, backgroundColor: Colors.surfaceLight },
  zocaloTerra: { flex: 1, backgroundColor: Colors.primary },

  listContent: {
    padding: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.bold,
  },
  hintText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  card: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: Spacing.md,
    ...Shadows.tarjetaElevada,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardLocation: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  priceValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMedium,
    paddingTop: 10,
    gap: 8,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: Colors.surfaceBase,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
  },
  actionBtnTextSecondary: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: Colors.secondarySurface,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.secondaryLight,
  },
  actionBtnTextPrimary: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: FontWeight.bold,
  },
  actionBtnDanger: {
    width: 36,
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionBtnTextDanger: {
    fontSize: FontSize.xs,
  },

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

