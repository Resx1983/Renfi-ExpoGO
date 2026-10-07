import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../../../constants/theme';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import {
  obtenerFincaPorId,
  modificarFinca,
  eliminarFinca,
  listarMunicipios,
} from '../../../../services/fincas.service';
import { Municipio, EstadoFinca } from '../../../../types';

export default function EditarFincaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const fincaId = Number(id);

  const [nombreFinca, setNombreFinca] = useState('');
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [idMunicipio, setIdMunicipio] = useState<number>(1);
  const [direccion, setDireccion] = useState('');
  const [informacion, setInformacion] = useState('');
  const [capacidad, setCapacidad] = useState('1');
  const [precio, setPrecio] = useState('0');
  const [estado, setEstado] = useState<EstadoFinca>('Disponible');
  const [urlImagen, setUrlImagen] = useState('');

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    const [resFinca, resMunicipios] = await Promise.all([
      obtenerFincaPorId(fincaId),
      listarMunicipios(),
    ]);
    setLoading(false);

    if (resMunicipios.data) {
      setMunicipios(resMunicipios.data);
    }

    if (resFinca.error || !resFinca.data) {
      setErrorGeneral(resFinca.error ?? 'Finca no encontrada.');
      return;
    }

    const f = resFinca.data;
    setNombreFinca(f.NombreFinca ?? '');
    if (f.IdMunicipio) setIdMunicipio(f.IdMunicipio);
    setDireccion(f.Direccion ?? '');
    setInformacion(f.InformacionAdicional ?? '');
    setCapacidad(String(f.Capacidad ?? 1));
    setPrecio(String(f.Precio ?? 0));
    setEstado((f.Estado as EstadoFinca) ?? 'Disponible');
    if (f.Imagenes && f.Imagenes.length > 0) {
      setUrlImagen(f.Imagenes[0].UrlImagen);
    }
  }, [fincaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    let ok = true;

    if (!nombreFinca.trim()) {
      e.nombreFinca = 'El nombre de la finca es requerido.';
      ok = false;
    }
    if (!capacidad.trim() || isNaN(Number(capacidad)) || Number(capacidad) <= 0) {
      e.capacidad = 'Ingresa una capacidad válida.';
      ok = false;
    }
    if (!precio.trim() || isNaN(Number(precio)) || Number(precio) <= 0) {
      e.precio = 'Ingresa un precio válido.';
      ok = false;
    }

    setErrores(e);
    return ok;
  };

  const handleGuardar = async () => {
    setErrorGeneral(null);
    if (!validar()) return;

    setGuardando(true);
    const { data, error: err } = await modificarFinca(fincaId, {
      NombreFinca: nombreFinca.trim(),
      IdMunicipio: idMunicipio,
      Direccion: direccion.trim() || null,
      InformacionAdicional: informacion.trim() || null,
      Capacidad: Number(capacidad),
      Precio: Number(precio),
      Estado: estado,
      UrlImagen: urlImagen.trim() || null,
    });
    setGuardando(false);

    if (err || !data) {
      const msg = err ?? 'Error al actualizar la finca.';
      setErrorGeneral(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', msg);
      }
      return;
    }

    if (Platform.OS === 'web') {
      window.alert('¡Finca actualizada correctamente!');
      router.back();
    } else {
      Alert.alert('Actualización exitosa', 'Los cambios han sido guardados.', [
        { text: 'Aceptar', onPress: () => router.back() },
      ]);
    }
  };

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
        if (window.confirm('¿Deseas eliminar permanentemente esta finca?')) {
          procederEliminar();
        }
      } else {
        procederEliminar();
      }
    } else {
      Alert.alert(
        'Eliminar finca',
        '¿Deseas eliminar permanentemente esta finca?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: procederEliminar },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
        <Text style={styles.headerTitle}>Modificar Finca</Text>
        <View style={{ width: 60 }} />
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
          <Text style={styles.loadingText}>Cargando datos de la finca…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: Spacing.gutter, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Editar Información</Text>

            {errorGeneral && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorGeneral}</Text>
              </View>
            )}

            <Input
              label="Nombre de la Finca *"
              value={nombreFinca}
              onChangeText={(v) => {
                setNombreFinca(v);
                setErrorGeneral(null);
              }}
              placeholder="Nombre de la finca"
              error={errores.nombreFinca}
            />

            {/* Selector de Municipio */}
            <Text style={styles.label}>Municipio de Antioquia</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.municipiosScroll}
              contentContainerStyle={styles.municipiosRow}
            >
              {municipios.map((m) => {
                const activo = idMunicipio === m.IdMunicipio;
                return (
                  <TouchableOpacity
                    key={m.IdMunicipio}
                    style={[styles.munChip, activo && styles.munChipActivo]}
                    onPress={() => setIdMunicipio(m.IdMunicipio)}
                  >
                    <Text style={[styles.munChipText, activo && styles.munChipTextActivo]}>
                      {m.NombreMunicipio}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Input
              label="Dirección o Vereda"
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Ej. Vereda Las Cuchillas"
            />

            <Input
              label="Descripción y Comodidades"
              value={informacion}
              onChangeText={setInformacion}
              placeholder="Descripción detallada"
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />

            {/* Fila Capacidad y Precio */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Capacidad (pers.) *"
                  value={capacidad}
                  onChangeText={setCapacidad}
                  keyboardType="numeric"
                  error={errores.capacidad}
                />
              </View>
              <View style={{ flex: 1.4, marginLeft: 8 }}>
                <Input
                  label="Precio / noche (COP) *"
                  value={precio}
                  onChangeText={setPrecio}
                  keyboardType="numeric"
                  error={errores.precio}
                />
              </View>
            </View>

            {/* Selector de Estado */}
            <Text style={styles.label}>Estado de Disponibilidad</Text>
            <View style={styles.estadoRow}>
              {(['Disponible', 'Ocupada', 'Mantenimiento'] as EstadoFinca[]).map((est) => {
                const activo = estado === est;
                return (
                  <TouchableOpacity
                    key={est}
                    style={[styles.estadoBtn, activo && styles.estadoBtnActivo]}
                    onPress={() => setEstado(est)}
                  >
                    <Text style={[styles.estadoBtnText, activo && styles.estadoBtnTextActivo]}>
                      {est}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* URL de Imagen */}
            <Input
              label="URL de Imagen de Portada"
              value={urlImagen}
              onChangeText={setUrlImagen}
              placeholder="https://images.unsplash.com/..."
            />

            <Button
              title="Guardar Cambios"
              size="lg"
              loading={guardando}
              style={{ marginTop: 16 }}
              onPress={handleGuardar}
            />

            <Button
              title={eliminando ? 'Eliminando...' : 'Eliminar Finca'}
              variant="danger"
              loading={eliminando}
              style={{ marginTop: 12 }}
              onPress={confirmarEliminar}
            />
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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

  scroll: { flex: 1 },

  formCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radius.xxl,
    padding: 20,
    ...Shadows.tarjetaElevada,
  },
  formSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 6,
  },

  municipiosScroll: {
    marginBottom: 16,
  },
  municipiosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  munChip: {
    backgroundColor: Colors.surfaceBase,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
  },
  munChipActivo: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  munChipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  munChipTextActivo: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },

  row: {
    flexDirection: 'row',
  },

  estadoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  estadoBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    backgroundColor: Colors.surfaceBase,
  },
  estadoBtnActivo: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  estadoBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  estadoBtnTextActivo: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },

  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
});

