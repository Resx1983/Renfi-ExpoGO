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
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../constants/theme';
import { Badge, estadoReservaVariant } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { listarReservasPorUsuario, actualizarEstadoReserva } from '../../services/reservas.service';
import { useAuth } from '../../context/AuthContext';
import { Reserva } from '../../types';

export default function MisReservasScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();

  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarReservas = useCallback(async () => {
    if (!usuario?.NumeroDocumento) {
      setError('Debes iniciar sesión para consultar tus reservas.');
      return;
    }

    const { data, error: err } = await listarReservasPorUsuario(usuario.NumeroDocumento);
    if (err) {
      setError(err);
      setReservas([]);
    } else {
      setReservas(data ?? []);
      setError(null);
    }
  }, [usuario]);

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

  const handleCancelarReserva = (idReserva: number) => {
    const procederCancelar = async () => {
      const { success, error: err } = await actualizarEstadoReserva(idReserva, 'Cancelada');
      if (!success || err) {
        if (Platform.OS === 'web') {
          window.alert(err ?? 'Error al cancelar la reserva.');
        } else {
          Alert.alert('Error', err ?? 'Error al cancelar la reserva.');
        }
        return;
      }

      if (Platform.OS === 'web') {
        window.alert('Reserva cancelada exitosamente.');
      }
      cargarReservas();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('¿Deseas cancelar esta reserva?')) {
          procederCancelar();
        }
      } else {
        procederCancelar();
      }
    } else {
      Alert.alert(
        'Cancelar reserva',
        '¿Estás seguro de que deseas cancelar esta reserva?',
        [
          { text: 'No, mantener', style: 'cancel' },
          { text: 'Sí, cancelar', style: 'destructive', onPress: procederCancelar },
        ]
      );
    }
  };

  const renderItem = ({ item }: { item: Reserva }) => {
    const fechaEntrada = item.FechaEntrada
      ? item.FechaEntrada.split('T')[0]
      : 'Fecha pendiente';
    const fechaSalida = item.FechaSalida
      ? item.FechaSalida.split('T')[0]
      : 'Fecha pendiente';

    const esCancelable = item.Estado === 'Pendiente' || item.Estado === 'Confirmada';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardFincaName} numberOfLines={1}>
              {item.NombreFinca}
            </Text>
            {item.NombreMunicipio && (
              <Text style={styles.cardMunicipio}>📍 {item.NombreMunicipio}</Text>
            )}
          </View>
          <Badge
            label={item.Estado}
            variant={estadoReservaVariant(item.Estado)}
          />
        </View>

        <View style={styles.datesBox}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Llegada</Text>
            <Text style={styles.dateValue}>{fechaEntrada}</Text>
          </View>
          <Text style={styles.dateArrow}>→</Text>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Salida</Text>
            <Text style={styles.dateValue}>{fechaSalida}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Pagado</Text>
            <Text style={styles.totalValue}>
              ${(item.MontoReserva ?? 0).toLocaleString('es-CO')} COP
            </Text>
          </View>

          {esCancelable && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelarReserva(item.IdReserva)}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
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
        <Text style={styles.headerTitle}>Mis Reservas</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Zócalo */}
      <View style={styles.zocalo}>
        <View style={styles.zocaloGreen} />
        <View style={styles.zocaloWhite} />
        <View style={styles.zocaloTerra} />
      </View>

      {/* Contenido */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando tus reservas…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <Button title="Reintentar" onPress={cargarConSpinner} />
        </View>
      ) : reservas.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🏕️</Text>
          <Text style={styles.emptyTitle}>No tienes reservas activas</Text>
          <Text style={styles.emptyDesc}>
            Explora las mejores fincas de Antioquia y reserva tu próxima escapada.
          </Text>
          <Button
            title="Explorar Fincas"
            style={{ marginTop: 12 }}
            onPress={() => router.replace('/(main)/home')}
          />
        </View>
      ) : (
        <FlatList
          data={reservas}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardFincaName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  cardMunicipio: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginTop: 2,
    fontWeight: FontWeight.medium,
  },

  datesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceBase,
    padding: 12,
    borderRadius: Radius.lg,
    marginBottom: 12,
  },
  dateCol: { flex: 1 },
  dateLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  dateValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  dateArrow: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    paddingHorizontal: 8,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMedium,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  totalValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#DC2626',
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
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 16,
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

