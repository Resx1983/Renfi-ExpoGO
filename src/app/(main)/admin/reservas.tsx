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
import { Badge, estadoReservaVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  listarReservas,
  actualizarEstadoReserva,
} from '../../../services/reservas.service';
import { Reserva, EstadoReserva } from '../../../types';

export default function AdminReservasScreen() {
  const insets = useSafeAreaInsets();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>('Todas');

  const cargarReservas = useCallback(async () => {
    const { data, error: err } = await listarReservas();
    if (err) {
      setError(err);
      setReservas([]);
    } else {
      setReservas(data ?? []);
      setError(null);
    }
  }, []);

  const cargarConSpinner = useCallback(async () => {
    setLoading(true);
    await cargarReservas();
    setLoading(false);
  }, [cargarReservas]);

  useEffect(() => {
    let activo = true;
    cargarReservas().finally(() => {
      if (activo) setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, [cargarReservas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarReservas();
    setRefreshing(false);
  }, [cargarReservas]);

  const handleCambiarEstado = async (idReserva: number, nuevo: EstadoReserva) => {
    const { success, error: err } = await actualizarEstadoReserva(idReserva, nuevo);
    if (!success || err) {
      if (Platform.OS === 'web') {
        window.alert(err ?? 'Error al actualizar reserva');
      } else {
        Alert.alert('Error', err ?? 'Error al actualizar reserva');
      }
      return;
    }
    cargarReservas();
  };

  const reservasFiltradas = reservas.filter((r) => {
    if (filtro === 'Todas') return true;
    return r.Estado === filtro;
  });

  const renderItem = ({ item }: { item: Reserva }) => {
    const fechaEntrada = item.FechaEntrada ? item.FechaEntrada.split('T')[0] : 'N/A';
    const fechaSalida = item.FechaSalida ? item.FechaSalida.split('T')[0] : 'N/A';

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.cardFinca} numberOfLines={1}>
              {item.NombreFinca}
            </Text>
            <Text style={styles.cardCliente}>
              👤 {item.NombreCliente} {item.ApellidoCliente}
            </Text>
          </View>
          <Badge label={item.Estado} variant={estadoReservaVariant(item.Estado)} />
        </View>

        <View style={styles.datesBox}>
          <Text style={styles.datesText}>
            📅 {fechaEntrada} → {fechaSalida}
          </Text>
          <Text style={styles.montoText}>
            ${(item.MontoReserva ?? 0).toLocaleString('es-CO')} COP
          </Text>
        </View>

        {/* Acciones de Estado para Administrador */}
        <View style={styles.actionsRow}>
          <Text style={styles.actionsLabel}>Cambiar a:</Text>
          {item.Estado !== 'Confirmada' && (
            <TouchableOpacity
              style={styles.actionPillSuccess}
              onPress={() => handleCambiarEstado(item.IdReserva, 'Confirmada')}
            >
              <Text style={styles.actionPillSuccessText}>Confirmar</Text>
            </TouchableOpacity>
          )}
          {item.Estado !== 'Completada' && (
            <TouchableOpacity
              style={styles.actionPillPrimary}
              onPress={() => handleCambiarEstado(item.IdReserva, 'Completada')}
            >
              <Text style={styles.actionPillPrimaryText}>Completar</Text>
            </TouchableOpacity>
          )}
          {item.Estado !== 'Cancelada' && (
            <TouchableOpacity
              style={styles.actionPillDanger}
              onPress={() => handleCambiarEstado(item.IdReserva, 'Cancelada')}
            >
              <Text style={styles.actionPillDangerText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Gestión de Reservas</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Zócalo */}
      <View style={styles.zocalo}>
        <View style={styles.zocaloGreen} />
        <View style={styles.zocaloWhite} />
        <View style={styles.zocaloTerra} />
      </View>

      {/* Filtros */}
      <View style={styles.filtersBar}>
        {['Todas', 'Confirmada', 'Pendiente', 'Completada', 'Cancelada'].map((f) => {
          const activo = filtro === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activo && styles.filterChipActivo]}
              onPress={() => setFiltro(f)}
            >
              <Text style={[styles.filterText, activo && styles.filterTextActivo]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando reservas globales…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error al cargar</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <Button title="Reintentar" onPress={cargarConSpinner} />
        </View>
      ) : reservasFiltradas.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>📋</Text>
          <Text style={styles.emptyTitle}>Sin reservas registradas</Text>
          <Text style={styles.emptyDesc}>
            {`No hay reservas que coincidan con el filtro "${filtro}".`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reservasFiltradas}
          keyExtractor={(item) => String(item.IdReserva)}
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

  zocalo: { flexDirection: 'column', height: 12 },
  zocaloGreen: { height: 2, backgroundColor: Colors.secondary },
  zocaloWhite: { height: 3, backgroundColor: Colors.surfaceLight },
  zocaloTerra: { flex: 1, backgroundColor: Colors.primary },

  filtersBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMedium,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceBase,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
  },
  filterChipActivo: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  filterText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  filterTextActivo: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },

  listContent: {
    padding: Spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
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
  cardFinca: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardCliente: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },

  datesBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceBase,
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: 10,
  },
  datesText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  montoText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMedium,
    paddingTop: 8,
  },
  actionsLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginRight: 4,
  },
  actionPillSuccess: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  actionPillSuccessText: {
    fontSize: FontSize.xs,
    color: '#166534',
    fontWeight: FontWeight.bold,
  },
  actionPillPrimary: {
    backgroundColor: '#E0E7FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#A5B4FC',
  },
  actionPillPrimaryText: {
    fontSize: FontSize.xs,
    color: '#3730A3',
    fontWeight: FontWeight.bold,
  },
  actionPillDanger: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionPillDangerText: {
    fontSize: FontSize.xs,
    color: '#991B1B',
    fontWeight: FontWeight.bold,
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
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
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

