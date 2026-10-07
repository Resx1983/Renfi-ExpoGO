import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../../constants/theme';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { crearFinca, listarMunicipios } from '../../../services/fincas.service';
import { useAuth } from '../../../context/AuthContext';
import { Municipio, EstadoFinca } from '../../../types';

const IMAGENES_SUGERIDAS = [
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
];

export default function CrearFincaScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();

  const [nombreFinca, setNombreFinca] = useState('');
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [idMunicipio, setIdMunicipio] = useState<number>(2); // Guatapé por defecto
  const [direccion, setDireccion] = useState('');
  const [informacion, setInformacion] = useState('');
  const [capacidad, setCapacidad] = useState('10');
  const [precio, setPrecio] = useState('800000');
  const [estado, setEstado] = useState<EstadoFinca>('Disponible');
  const [urlImagen, setUrlImagen] = useState(IMAGENES_SUGERIDAS[0]);

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  useEffect(() => {
    async function cargarMunicipios() {
      const { data } = await listarMunicipios();
      if (data && data.length > 0) {
        setMunicipios(data);
        setIdMunicipio(data[0].IdMunicipio);
      }
    }
    cargarMunicipios();
  }, []);

  const validar = (): boolean => {
    const e: Record<string, string> = {};
    let ok = true;

    if (!nombreFinca.trim()) {
      e.nombreFinca = 'El nombre de la finca es requerido.';
      ok = false;
    }
    if (!capacidad.trim() || isNaN(Number(capacidad)) || Number(capacidad) <= 0) {
      e.capacidad = 'Ingresa una capacidad válida en personas.';
      ok = false;
    }
    if (!precio.trim() || isNaN(Number(precio)) || Number(precio) <= 0) {
      e.precio = 'Ingresa un precio válido por noche.';
      ok = false;
    }

    setErrores(e);
    return ok;
  };

  const handleCrear = async () => {
    setErrorGeneral(null);
    if (!validar()) return;

    setLoading(true);
    const { data, error: err } = await crearFinca({
      NombreFinca: nombreFinca.trim(),
      IdMunicipio: idMunicipio,
      NumeroDocumentoUsuario: usuario?.NumeroDocumento ?? 1,
      Direccion: direccion.trim() || null,
      InformacionAdicional: informacion.trim() || null,
      Capacidad: Number(capacidad),
      Precio: Number(precio),
      Estado: estado,
      Calificacion: 5,
      UrlImagen: urlImagen.trim() || null,
    });
    setLoading(false);

    if (err || !data) {
      const msg = err ?? 'Error al guardar la nueva finca.';
      setErrorGeneral(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', msg);
      }
      return;
    }

    if (Platform.OS === 'web') {
      window.alert('¡Finca creada con éxito!');
      router.replace('/(main)/home');
    } else {
      Alert.alert('¡Finca creada!', 'La nueva finca ha sido publicada exitosamente.', [
        { text: 'Aceptar', onPress: () => router.replace('/(main)/home') },
      ]);
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
        <Text style={styles.headerTitle}>Nueva Finca</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Zócalo */}
      <View style={styles.zocalo}>
        <View style={styles.zocaloGreen} />
        <View style={styles.zocaloWhite} />
        <View style={styles.zocaloTerra} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: Spacing.gutter, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Información de la Propiedad</Text>

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
            placeholder="Ej. Hacienda Las Palmas"
            error={errores.nombreFinca}
          />

          {/* Selector de Municipio */}
          <Text style={styles.label}>Municipio de Antioquia *</Text>
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
            placeholder="Ej. Vereda La Selva, Km 4"
          />

          <Input
            label="Descripción y Comodidades"
            value={informacion}
            onChangeText={setInformacion}
            placeholder="Piscina, zona BBQ, vista panorámica..."
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
                placeholder="10"
                error={errores.capacidad}
              />
            </View>
            <View style={{ flex: 1.4, marginLeft: 8 }}>
              <Input
                label="Precio por noche (COP) *"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
                placeholder="800000"
                error={errores.precio}
              />
            </View>
          </View>

          {/* Selector de Estado */}
          <Text style={styles.label}>Estado Inicial</Text>
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

          <Text style={styles.presetLabel}>O elige una imagen prediseñada:</Text>
          <View style={styles.presetsRow}>
            {IMAGENES_SUGERIDAS.map((url, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.presetChip,
                  urlImagen === url && styles.presetChipSelected,
                ]}
                onPress={() => setUrlImagen(url)}
              >
                <Text style={styles.presetChipText}>Foto {idx + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title="Publicar Finca"
            size="lg"
            loading={loading}
            style={{ marginTop: 20 }}
            onPress={handleCrear}
          />
        </View>
      </ScrollView>
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

  presetLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: -8,
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceBase,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
  },
  presetChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FEF3C7',
  },
  presetChipText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
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
});

