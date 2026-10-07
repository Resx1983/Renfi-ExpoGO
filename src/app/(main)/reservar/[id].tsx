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
import { Button } from '../../../components/ui/Button';
import { obtenerFincaPorId } from '../../../services/fincas.service';
import { listarMetodosDePago, crearReserva } from '../../../services/reservas.service';
import { useAuth } from '../../../context/AuthContext';
import { Finca, MetodoDePago, Reserva } from '../../../types';

export default function ReservarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();

  const [finca, setFinca] = useState<Finca | null>(null);
  const [metodosPago, setMetodosPago] = useState<MetodoDePago[]>([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<number>(4); // Nequi/Daviplata por defecto si existe
  const [noches, setNoches] = useState<number>(2);
  const [huespedes, setHuespedes] = useState<number>(2);

  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservaExitosa, setReservaExitosa] = useState<Reserva | null>(null);

  const fincaId = Number(id);

  // Fechas estimadas basadas en noches seleccionadas
  const calcularFechas = useCallback(() => {
    const hoy = new Date();
    const fechaEntrada = new Date(hoy);
    fechaEntrada.setDate(hoy.getDate() + 2); // 2 días en el futuro por defecto

    const fechaSalida = new Date(fechaEntrada);
    fechaSalida.setDate(fechaEntrada.getDate() + noches);

    const formato = (d: Date) => d.toISOString().split('T')[0];
    return {
      entradaISO: fechaEntrada.toISOString(),
      salidaISO: fechaSalida.toISOString(),
      entradaTexto: formato(fechaEntrada),
      salidaTexto: formato(fechaSalida),
    };
  }, [noches]);

  const { entradaISO, salidaISO, entradaTexto, salidaTexto } = calcularFechas();
  const total = (finca?.Precio ?? 0) * noches;

  useEffect(() => {
    async function inicializar() {
      setLoading(true);
      const [resFinca, resMetodos] = await Promise.all([
        obtenerFincaPorId(fincaId),
        listarMetodosDePago(),
      ]);
      setLoading(false);

      if (resFinca.error || !resFinca.data) {
        setError(resFinca.error ?? 'Finca no encontrada.');
        return;
      }

      setFinca(resFinca.data);
      if (resMetodos.data && resMetodos.data.length > 0) {
        setMetodosPago(resMetodos.data);
        setMetodoSeleccionado(resMetodos.data[0].IdMetodoDePago);
      }
    }
    inicializar();
  }, [fincaId]);

  const handleConfirmarReserva = async () => {
    if (!usuario?.NumeroDocumento) {
      if (Platform.OS === 'web') {
        window.alert('Debes iniciar sesión para realizar una reserva.');
      } else {
        Alert.alert('Sesión requerida', 'Debes iniciar sesión para realizar una reserva.', [
          { text: 'Ir a Login', onPress: () => router.push('/(auth)/login') },
        ]);
      }
      return;
    }

    if (!finca) return;

    setProcesando(true);
    const { data: nuevaReserva, error: reservaError } = await crearReserva({
      IdFinca: finca.IdFinca,
      NumeroDocumentoUsuario: usuario.NumeroDocumento,
      FechaEntrada: entradaISO,
      FechaSalida: salidaISO,
      MontoReserva: total,
      IdMetodoDePago: metodoSeleccionado,
      Estado: 'Confirmada',
    });
    setProcesando(false);

    if (reservaError || !nuevaReserva) {
      const msg = reservaError ?? 'No se pudo completar la reserva.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Error al reservar', msg);
      }
      return;
    }

    setReservaExitosa(nuevaReserva);
  };

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />

      {/* ── Encabezado ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Reserva</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Zócalo ── */}
      <View style={styles.zocalo}>
        <View style={styles.zocaloGreen} />
        <View style={styles.zocaloWhite} />
        <View style={styles.zocaloTerra} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Preparando tu reserva…</Text>
        </View>
      ) : error || !finca ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <Button title="Regresar" onPress={() => router.back()} />
        </View>
      ) : reservaExitosa ? (
        /* ── Pantalla de Éxito ── */
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <View style={styles.successIconBadge}>
              <Text style={{ fontSize: 36 }}>🎉</Text>
            </View>
            <Text style={styles.successTitle}>¡Reserva Confirmada!</Text>
            <Text style={styles.successSubtitle}>
              Tu estadía en {finca.NombreFinca} está asegurada.
            </Text>

            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Reserva #</Text>
                <Text style={styles.receiptValue}>{reservaExitosa.IdReserva}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Finca</Text>
                <Text style={styles.receiptValue}>{finca.NombreFinca}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Entrada</Text>
                <Text style={styles.receiptValue}>{entradaTexto}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Salida</Text>
                <Text style={styles.receiptValue}>{salidaTexto}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Noches</Text>
                <Text style={styles.receiptValue}>{noches} noches</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Total Pagado</Text>
                <Text style={styles.receiptValueHighlight}>
                  ${total.toLocaleString('es-CO')} COP
                </Text>
              </View>
            </View>

            <Button
              title="Ver mis reservas"
              fullWidth
              style={{ marginBottom: 12 }}
              onPress={() => router.replace('/(main)/mis-reservas')}
            />

            <Button
              title="Volver al inicio"
              variant="secondary"
              fullWidth
              onPress={() => router.replace('/(main)/home')}
            />
          </View>
        </View>
      ) : (
        /* ── Formulario de Reserva ── */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: Spacing.gutter, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta Resumen Finca */}
          <View style={styles.summaryCard}>
            <Image
              source={{
                uri:
                  finca.Imagenes?.[0]?.UrlImagen ??
                  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
              }}
              style={styles.summaryImage}
            />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {finca.NombreFinca}
              </Text>
              <Text style={styles.summaryLocation}>
                📍 {finca.NombreMunicipio ?? 'Antioquia'}
              </Text>
              <Text style={styles.summaryPrice}>
                ${(finca.Precio ?? 0).toLocaleString('es-CO')} COP{' '}
                <Text style={styles.summaryPriceUnit}>/noche</Text>
              </Text>
            </View>
          </View>

          {/* Configuración de Estadía (Noches y Huéspedes) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Detalles de tu estadía</Text>

            {/* Contador de Noches */}
            <View style={styles.counterRow}>
              <View>
                <Text style={styles.counterLabel}>Duración de estadía</Text>
                <Text style={styles.counterSub}>
                  {entradaTexto} al {salidaTexto}
                </Text>
              </View>
              <View style={styles.counterControls}>
                <TouchableOpacity
                  style={[styles.counterBtn, noches <= 1 && styles.counterBtnDisabled]}
                  onPress={() => setNoches(Math.max(1, noches - 1))}
                  disabled={noches <= 1}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{noches} noches</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setNoches(noches + 1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.counterDivider} />

            {/* Contador de Huéspedes */}
            <View style={styles.counterRow}>
              <View>
                <Text style={styles.counterLabel}>Número de huéspedes</Text>
                <Text style={styles.counterSub}>
                  Máximo {finca.Capacidad} personas
                </Text>
              </View>
              <View style={styles.counterControls}>
                <TouchableOpacity
                  style={[styles.counterBtn, huespedes <= 1 && styles.counterBtnDisabled]}
                  onPress={() => setHuespedes(Math.max(1, huespedes - 1))}
                  disabled={huespedes <= 1}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{huespedes} pers.</Text>
                <TouchableOpacity
                  style={[
                    styles.counterBtn,
                    huespedes >= finca.Capacidad && styles.counterBtnDisabled,
                  ]}
                  onPress={() => setHuespedes(Math.min(finca.Capacidad, huespedes + 1))}
                  disabled={huespedes >= finca.Capacidad}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Método de Pago */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <Text style={styles.sectionSub}>Selecciona tu forma de pago preferida:</Text>

            <View style={styles.paymentMethodsGrid}>
              {metodosPago.map((mp) => {
                const seleccionado = metodoSeleccionado === mp.IdMetodoDePago;
                let icono = '💳';
                if (mp.NombreMetodoDePago.includes('Nequi')) icono = '📱';
                else if (mp.NombreMetodoDePago.includes('Efectivo')) icono = '💵';
                else if (mp.NombreMetodoDePago.includes('Transferencia')) icono = '🏦';

                return (
                  <TouchableOpacity
                    key={mp.IdMetodoDePago}
                    style={[
                      styles.paymentOption,
                      seleccionado && styles.paymentOptionSelected,
                    ]}
                    onPress={() => setMetodoSeleccionado(mp.IdMetodoDePago)}
                  >
                    <Text style={styles.paymentIcon}>{icono}</Text>
                    <Text
                      style={[
                        styles.paymentName,
                        seleccionado && styles.paymentNameSelected,
                      ]}
                    >
                      {mp.NombreMetodoDePago}
                    </Text>
                    {seleccionado && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Desglose de Precios */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Desglose del pago</Text>
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>
                ${(finca.Precio ?? 0).toLocaleString('es-CO')} × {noches} noches
              </Text>
              <Text style={styles.priceLineValue}>${total.toLocaleString('es-CO')} COP</Text>
            </View>
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>Tarifa de servicio Renfi</Text>
              <Text style={styles.priceLineFree}>¡Gratis!</Text>
            </View>
            <View style={styles.counterDivider} />
            <View style={styles.priceTotalRow}>
              <Text style={styles.priceTotalLabel}>Total a pagar</Text>
              <Text style={styles.priceTotalValue}>
                ${total.toLocaleString('es-CO')} COP
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── Barra Inferior Fija de Acción ── */}
      {finca && !loading && !reservaExitosa && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.bottomPriceBox}>
            <Text style={styles.bottomPriceLabel}>Total ({noches} noches)</Text>
            <Text style={styles.bottomPriceValue}>
              ${total.toLocaleString('es-CO')} COP
            </Text>
          </View>
          <Button
            title="Confirmar y Pagar"
            size="lg"
            loading={procesando}
            style={styles.confirmBtn}
            onPress={handleConfirmarReserva}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },

  // Header
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

  // Zócalo
  zocalo: { flexDirection: 'column', height: 12 },
  zocaloGreen: { height: 2, backgroundColor: Colors.secondary },
  zocaloWhite: { height: 3, backgroundColor: Colors.surfaceLight },
  zocaloTerra: { flex: 1, backgroundColor: Colors.primary },

  scroll: { flex: 1 },

  // Tarjeta Resumen Finca
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xl,
    padding: 12,
    marginBottom: Spacing.md,
    ...Shadows.tarjetaElevada,
  },
  summaryImage: {
    width: 90,
    height: 80,
    borderRadius: Radius.lg,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  summaryName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryLocation: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  summaryPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  summaryPriceUnit: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.regular,
  },

  // Secciones
  sectionCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: Spacing.md,
    ...Shadows.tarjetaElevada,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 12,
  },

  // Contadores
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  counterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  counterSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnDisabled: {
    opacity: 0.35,
  },
  counterBtnText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  counterValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    minWidth: 70,
    textAlign: 'center',
  },
  counterDivider: {
    height: 1,
    backgroundColor: Colors.surfaceMedium,
    marginVertical: 10,
  },

  // Métodos de pago
  paymentMethodsGrid: {
    gap: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.surfaceMedium,
    backgroundColor: Colors.surfaceBase,
  },
  paymentOptionSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondarySurface,
  },
  paymentIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  paymentName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  paymentNameSelected: {
    color: Colors.secondary,
    fontWeight: FontWeight.bold,
  },
  checkIcon: {
    fontSize: FontSize.base,
    color: Colors.secondary,
    fontWeight: FontWeight.bold,
  },

  // Desglose de precios
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceLineLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  priceLineValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  priceLineFree: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: FontWeight.bold,
  },
  priceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: 4,
  },
  priceTotalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  priceTotalValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  // Sticky Bottom Bar
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
  bottomPriceBox: { flex: 1 },
  bottomPriceLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  bottomPriceValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  confirmBtn: {
    flex: 1.3,
    marginLeft: 16,
  },

  // Pantalla de Éxito
  successContainer: {
    flex: 1,
    padding: Spacing.gutter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xxl,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...Shadows.aleroAmplio,
  },
  successIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.secondarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  receiptBox: {
    backgroundColor: Colors.surfaceBase,
    borderRadius: Radius.lg,
    padding: 14,
    width: '100%',
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  receiptLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  receiptValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  receiptValueHighlight: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  // Carga y Error
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

