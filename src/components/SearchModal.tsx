import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { StateBlock } from './ui/Feedback';
import { FincaCard } from './FincasRelevantes';
import { Colors, Fonts, Type } from '../constants/theme';
import type { Finca } from '../types';

export type Orden = 'relevancia' | 'precio-asc' | 'precio-desc' | 'capacidad' | 'municipio';
export interface Filtros {
  texto: string;
  municipio: string;
  estado: string;
  capacidad: string;
  precioMin: string;
  precioMax: string;
  calificacion: number;
  orden: Orden;
}
export const FILTROS_INICIALES: Filtros = {
  texto: '', municipio: '', estado: '', capacidad: '', precioMin: '', precioMax: '', calificacion: 0, orden: 'relevancia',
};

const norm = (s: unknown) =>
  String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Filtra y ordena fincas (cliente). Relevancia = tokens coincidentes, luego calificación.
export function filtrarFincas(fincas: Finca[], f: Filtros): Finca[] {
  const tokens = norm(f.texto).split(/\s+/).filter(Boolean);
  const cap = Number(f.capacidad) || 0;
  const min = f.precioMin ? Number(f.precioMin) : -Infinity;
  const max = f.precioMax ? Number(f.precioMax) : Infinity;
  const hits = new Map<Finca, number>();
  const out = fincas.filter((x) => {
    const hay = norm([x.NombreFinca, x.InformacionAdicional, x.Direccion, x.NombreMunicipio, x.NombrePropietario, x.ApellidoPropietario].join(' '));
    const n = tokens.filter((t) => hay.includes(t)).length;
    hits.set(x, n);
    return (
      n === tokens.length &&
      (!f.municipio || norm(x.NombreMunicipio) === norm(f.municipio)) &&
      (!f.estado || norm(x.Estado) === norm(f.estado)) &&
      x.Capacidad >= cap &&
      x.Precio >= min && x.Precio <= max &&
      (x.Calificacion || 0) >= f.calificacion
    );
  });
  const sorts: Record<Orden, (a: Finca, b: Finca) => number> = {
    relevancia: (a, b) => (hits.get(b)! - hits.get(a)!) || (b.Calificacion || 0) - (a.Calificacion || 0),
    'precio-asc': (a, b) => a.Precio - b.Precio,
    'precio-desc': (a, b) => b.Precio - a.Precio,
    capacidad: (a, b) => b.Capacidad - a.Capacidad,
    municipio: (a, b) => (a.NombreMunicipio || '').localeCompare(b.NombreMunicipio || '', 'es'),
  };
  return out.sort(sorts[f.orden]);
}

const distinct = (vals: (string | undefined)[]) =>
  [...new Set(vals.filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'es'));

interface Props {
  fincas: Finca[];
  visible: boolean;
  onClose: () => void;
  loading?: boolean;
  /** Filtros con los que se abre (p. ej. desde la búsqueda rápida del hero). */
  inicial?: Partial<Filtros>;
}

const ordenes: { label: string; value: Orden }[] = [
  { label: 'Mejor coincidencia', value: 'relevancia' },
  { label: 'Precio más bajo', value: 'precio-asc' },
  { label: 'Precio más alto', value: 'precio-desc' },
  { label: 'Mayor capacidad', value: 'capacidad' },
  { label: 'Municipio (A-Z)', value: 'municipio' },
];
const PASOS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export function SearchModal({ fincas, visible, onClose, loading = false, inicial }: Props) {
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<Filtros>({ ...FILTROS_INICIALES, ...inicial });
  const [deb, setDeb] = useState<Filtros>(f);
  const [verTodos, setVerTodos] = useState(false);
  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setF((p) => ({ ...p, [k]: v }));
  const reset = () => { setF(FILTROS_INICIALES); setDeb(FILTROS_INICIALES); setVerTodos(false); };

  // Al abrir aplica de inmediato los filtros iniciales (búsqueda rápida del hero).
  useEffect(() => {
    if (!visible) return;
    const n = { ...FILTROS_INICIALES, ...inicial };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF(n);
    setDeb(n);
    setVerTodos(false);
  }, [visible, inicial]);

  // Filtrado en vivo con debounce (~180 ms)
  useEffect(() => {
    const t = setTimeout(() => setDeb(f), 180);
    return () => clearTimeout(t);
  }, [f]);

  const resultados = useMemo(() => filtrarFincas(fincas, deb), [fincas, deb]);
  const municipios = useMemo(() => [{ label: 'Todos', value: '' }, ...distinct(fincas.map((x) => x.NombreMunicipio)).map((v) => ({ label: v, value: v }))], [fincas]);
  const estados = useMemo(() => [{ label: 'Todos', value: '' }, ...distinct(fincas.map((x) => x.Estado)).map((v) => ({ label: v, value: v }))], [fincas]);
  const lista = verTodos ? resultados : resultados.slice(0, 12);

  const abrir = (id: number) => {
    onClose();
    router.push(`/fincas/${id}`);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.page}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={styles.flex}>
            <Text style={styles.title}>Encuentra tu finca perfecta</Text>
            <Text style={styles.sub}>Filtra por municipio, capacidad, precio, estado y más.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar búsqueda" style={styles.close} onPress={onClose}>
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
          <Input icon="search" label="¿Qué estás buscando?" placeholder="Nombre, dirección o amenidades" value={f.texto} onChangeText={(v) => set('texto', v)} />
          <Select label="Municipio" value={f.municipio} options={municipios} onChange={(v) => set('municipio', v)} />
          <Select label="Estado" value={f.estado} options={estados} onChange={(v) => set('estado', v)} />
          <Input label="Capacidad mínima" placeholder="Ej. 6" keyboardType="numeric" value={f.capacidad} onChangeText={(v) => set('capacidad', v.replace(/\D/g, ''))} />
          <Select label="Ordenar por" value={f.orden} options={ordenes} onChange={(v) => set('orden', v)} />
          <Text style={styles.label}>Precio por noche (COP)</Text>
          <View style={styles.row}>
            <Input containerStyle={styles.flex} placeholder="Desde" keyboardType="numeric" value={f.precioMin} onChangeText={(v) => set('precioMin', v.replace(/\D/g, ''))} />
            <Text style={styles.dash}>—</Text>
            <Input containerStyle={styles.flex} placeholder="Hasta" keyboardType="numeric" value={f.precioMax} onChangeText={(v) => set('precioMax', v.replace(/\D/g, ''))} />
          </View>
          <Text style={styles.label}>Calificación mínima <Text style={Type.num}>{f.calificacion}/5</Text></Text>
          <View style={styles.chips}>
            {PASOS.map((n) => (
              <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Calificación ${n}`} onPress={() => set('calificacion', n)} style={[styles.chip, f.calificacion === n && styles.chipOn]}>
                <Text style={[styles.chipText, Type.num, f.calificacion === n && { color: Colors.textInverse }]}>{n}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.row}>
            <Button title="Restablecer" variant="ghost" style={styles.flex} onPress={reset} />
            <Button title="Aplicar filtros" style={styles.flex} onPress={() => { setDeb(f); setVerTodos(false); }} />
          </View>

          {loading ? (
            <Text style={styles.count}>Buscando fincas disponibles...</Text>
          ) : (
            <Text style={styles.count}>
              <Text style={[styles.countN, Type.num]}>{resultados.length}</Text> {resultados.length === 1 ? 'resultado' : 'resultados'}
            </Text>
          )}

          {loading ? (
            <StateBlock loading title="Cargando fincas disponibles..." />
          ) : resultados.length === 0 ? (
            <StateBlock
              icon="search-outline"
              title="No encontramos resultados para tu búsqueda"
              text="Prueba usando menos filtros o amplía el rango de precios y capacidad."
              action={{ title: 'Limpiar filtros', onPress: reset }}
            />
          ) : (
            <View style={styles.list}>
              {lista.map((x) => <FincaCard key={x.IdFinca} finca={x} onPress={() => abrir(x.IdFinca)} />)}
            </View>
          )}

          {!verTodos && resultados.length > 12 && (
            <Button title="Ver todos los resultados" variant="ghost" fullWidth onPress={() => setVerTodos(true)} />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.surfaceBase },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Colors.surfaceLight, borderBottomWidth: 1, borderBottomColor: Colors.surfaceMedium },
  flex: { flex: 1 },
  title: { fontFamily: Fonts.bold, fontSize: 22, color: Colors.secondary },
  sub: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, marginTop: 4 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, alignItems: 'center', justifyContent: 'center' },
  label: { ...Type.label, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  dash: { fontFamily: Fonts.bold, color: Colors.textTertiary, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { minWidth: 44, height: 44, paddingHorizontal: 10, borderRadius: 9999, borderWidth: 1, borderColor: Colors.surfaceDark, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontFamily: Fonts.semibold, fontSize: 14, color: Colors.textSecondary },
  count: { fontFamily: Fonts.regular, fontSize: 15, color: Colors.textSecondary, marginTop: 20, marginBottom: 12 },
  countN: { fontFamily: Fonts.bold, color: Colors.textPrimary },
  list: { gap: 16, marginBottom: 16 },
});
