import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, Modal, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Alert, ConfirmDialog, StateBlock } from '../../components/ui/Feedback';
import { getRecurso, type Field } from '../../constants/adminResources';
import { hashSHA512 } from '../../services/auth.service';
import {
  actualizarRegistro, cargarOpciones, crearRegistro, eliminarRegistro, listarRegistros, type Row,
} from '../../services/admin.service';
import { Colors, Fonts, Radius, Shadows, Spacing, Type } from '../../constants/theme';

type Opciones = Record<string, { label: string; value: any }[]>;

const HINTS: Partial<Record<Field['type'], string>> = {
  number: 'Ingresa solo valores numéricos.',
  email: 'Se recomienda un correo válido.',
  date: 'Formato AAAA-MM-DD',
  password: 'La contraseña será encriptada con SHA-512.',
};

export default function RecursoScreen() {
  const { recurso } = useLocalSearchParams<{ recurso: string }>();
  const cfg = getRecurso(recurso);
  const insets = useSafeAreaInsets();

  const [registros, setRegistros] = useState<Row[]>([]);
  const [cargando, setCargando] = useState(true);
  const [recargando, setRecargando] = useState(false);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');
  const [opciones, setOpciones] = useState<Opciones>({});

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Row | null>(null);
  const [valores, setValores] = useState<Record<string, any>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [porEliminar, setPorEliminar] = useState<Row | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    if (!cfg) return;
    let alive = true;
    listarRegistros(cfg.table, cfg.idField).then((r) => {
      if (!alive) return;
      setRegistros(r.data ?? []);
      setError(r.error ?? '');
      setCargando(false);
      setRecargando(false);
    });
    return () => { alive = false; };
  }, [cfg, version]);

  useEffect(() => {
    if (!cfg) return;
    let alive = true;
    for (const f of cfg.fields) {
      if (!f.source) continue;
      cargarOpciones(f.source).then((r) => {
        if (alive) setOpciones((p) => ({ ...p, [f.name]: r.data ?? [] }));
      });
    }
    return () => { alive = false; };
  }, [cfg]);

  const opcionesDe = (f: Field) => f.options ?? opciones[f.name];

  const mostrar = (f: Field, v: any): string => {
    if (v === null || v === undefined || v === '') return '—';
    if (f.type === 'password') return '••••••';
    if (f.type === 'boolean') return v ? 'Sí' : 'No';
    if (f.type === 'select') return opcionesDe(f)?.find((o) => String(o.value) === String(v))?.label ?? String(v);
    return String(v);
  };

  const recargar = () => {
    setRecargando(true);
    setVersion((v) => v + 1);
  };

  const abrirForm = (reg: Row | null) => {
    const ini: Record<string, any> = {};
    for (const f of cfg!.fields) {
      const v = reg?.[f.name];
      ini[f.name] = v === null || v === undefined || f.type === 'password' ? '' : f.type === 'boolean' ? String(v) : f.type === 'select' ? v : String(v);
    }
    setEditando(reg);
    setValores(ini);
    setErrores({});
    setErrorForm('');
    setFormAbierto(true);
  };

  const guardar = async () => {
    if (!cfg) return;
    const errs: Record<string, string> = {};
    const payload: Row = {};
    for (const f of cfg.fields) {
      const raw = valores[f.name];
      const vacio = raw === '' || raw === null || raw === undefined || (typeof raw === 'string' && !raw.trim());
      if (f.type === 'password') {
        // Igual que la web: se guarda en SHA-512; al editar, vacío = conservar la actual
        if (!vacio) payload[f.name] = await hashSHA512(String(raw));
        else if (!editando) errs[f.name] = 'Este campo es obligatorio.';
      } else if (vacio) {
        if (f.required) errs[f.name] = 'Este campo es obligatorio.';
        payload[f.name] = null;
      } else if (f.type === 'number') {
        const n = Number(raw);
        if (Number.isNaN(n)) errs[f.name] = 'Ingresa solo valores numéricos.';
        payload[f.name] = n;
      } else if (f.type === 'boolean') {
        payload[f.name] = raw === 'true';
      } else if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(String(raw).trim())) {
        errs[f.name] = 'Formato AAAA-MM-DD';
      } else {
        payload[f.name] = typeof raw === 'string' ? raw.trim() : raw;
      }
    }
    setErrores(errs);
    setErrorForm('');
    if (Object.keys(errs).length) return;

    setGuardando(true);
    const r = editando
      ? await actualizarRegistro(cfg.table, cfg.idField, editando[cfg.idField], payload)
      : await crearRegistro(cfg.table, payload);
    setGuardando(false);
    if (r.error) return setErrorForm(r.error);
    setFormAbierto(false);
    recargar();
  };

  const confirmarEliminar = async () => {
    if (!cfg || !porEliminar) return;
    setEliminando(true);
    const r = await eliminarRegistro(cfg.table, cfg.idField, porEliminar[cfg.idField]);
    setEliminando(false);
    setPorEliminar(null);
    if (r.error) setErrorEliminar(r.error);
    else {
      setErrorEliminar('');
      recargar();
    }
  };

  const campos = useMemo(() => cfg?.fields ?? [], [cfg]);

  if (!cfg) {
    return (
      <View style={styles.flex}>
        <AdminHeader />
        <StateBlock
          icon="alert-circle-outline"
          title="Recurso no encontrado"
          action={{ title: 'Volver al panel', onPress: () => router.replace('/administrador') }}
        />
      </View>
    );
  }

  const n = registros.length;
  const idEliminar = porEliminar ? porEliminar[cfg.idField] : '';

  return (
    <View style={styles.flex}>
      <AdminHeader slug={cfg.slug} />
      <FlatList
        data={cargando ? [] : registros}
        keyExtractor={(r) => String(r[cfg.idField])}
        refreshing={recargando}
        onRefresh={recargar}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        ListHeaderComponent={
          <View style={styles.toolbar}>
            {!cargando && (
              <Text style={styles.count}>
                <Text style={styles.countNum}>{n}</Text> {n === 1 ? 'registro' : 'registros'}
              </Text>
            )}
            <View style={styles.btns}>
              <Button title="Actualizar" variant="secondary" size="sm" icon="refresh" disabled={cargando || recargando} onPress={recargar} />
              <Button title="Nuevo registro" size="sm" icon="add" onPress={() => abrirForm(null)} />
            </View>
            {!!error && <Alert tone="error">{error}</Alert>}
            {!!errorEliminar && <Alert tone="error">{errorEliminar}</Alert>}
          </View>
        }
        ListEmptyComponent={
          cargando ? (
            <StateBlock loading title="Cargando información…" />
          ) : (
            <View style={styles.card}>
              <StateBlock
                icon="document-text-outline"
                title="No se encontraron registros"
                text="Comienza creando un nuevo registro o verifica los filtros disponibles."
              />
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Registro {index + 1}</Text>
              <Badge label={`${cfg.idField}: ${item[cfg.idField]}`} />
            </View>
            {cfg.slug === 'imagenes' && !!item.UrlImagen && <Image source={{ uri: item.UrlImagen }} style={styles.img} />}
            {campos.map((f) => (
              <View key={f.name} style={styles.line}>
                <Text style={styles.label}>{f.label}</Text>
                <Text style={styles.value}>{mostrar(f, item[f.name])}</Text>
              </View>
            ))}
            <View style={styles.btns}>
              <Button title="Editar" variant="secondary" size="sm" onPress={() => abrirForm(item)} />
              <Button title="Eliminar" variant="dangerGhost" size="sm" onPress={() => setPorEliminar(item)} />
            </View>
          </View>
        )}
      />

      <ConfirmDialog
        visible={!!porEliminar}
        danger
        icon="trash-outline"
        title={`¿Eliminar el registro ${idEliminar}?`}
        message="Esta acción no se puede deshacer. El registro será eliminado permanentemente de la base de datos."
        confirmText="Eliminar"
        loading={eliminando}
        onCancel={() => setPorEliminar(null)}
        onConfirm={confirmarEliminar}
      />

      <Modal visible={formAbierto} animationType="fade" transparent onRequestClose={() => setFormAbierto(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { marginBottom: insets.bottom + 8 }]}>
            <View style={styles.sheetHead}>
              <View style={styles.titles}>
                <Text style={styles.h2}>{editando ? 'Editar registro' : 'Crear nuevo registro'}</Text>
                <Text style={styles.desc}>Completa los campos del registro. Los marcados con * son obligatorios.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.close} onPress={() => setFormAbierto(false)}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
              {!!editando && <Text style={[styles.label, Type.num]}>{cfg.idField}: {editando[cfg.idField]}</Text>}
              {campos.map((f) => {
                const set = (v: any) => setValores((p) => ({ ...p, [f.name]: v }));
                if (f.type === 'select' || f.type === 'boolean') {
                  const ops = opcionesDe(f);
                  return (
                    <Select
                      key={f.name}
                      label={f.label}
                      required={f.required}
                      value={valores[f.name] === '' ? null : valores[f.name]}
                      options={ops ?? []}
                      onChange={set}
                      placeholder={ops ? 'Seleccionar…' : 'Cargando opciones…'}
                      error={errores[f.name]}
                    />
                  );
                }
                return (
                  <Input
                    key={f.name}
                    label={f.label}
                    required={f.required}
                    value={valores[f.name] ?? ''}
                    onChangeText={set}
                    error={errores[f.name]}
                    hint={f.type === 'password' && editando ? 'Déjala vacía para conservar la contraseña actual.' : HINTS[f.type]}
                    multiline={f.type === 'textarea'}
                    secureTextEntry={f.type === 'password'}
                    autoCapitalize={f.type === 'email' || f.type === 'password' || f.type === 'date' ? 'none' : undefined}
                    keyboardType={f.type === 'number' ? 'numeric' : f.type === 'email' ? 'email-address' : 'default'}
                  />
                );
              })}
              {!!errorForm && <Alert tone="error">{errorForm}</Alert>}
            </ScrollView>
            <View style={styles.sheetFoot}>
              <Button title="Cancelar" variant="secondary" onPress={() => setFormAbierto(false)} />
              <Button title={guardando ? 'Guardando…' : 'Guardar'} loading={guardando} onPress={guardar} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.surfaceBase },
  titles: { flex: 1 },
  content: { padding: Spacing.gutter, gap: 12 },
  toolbar: { gap: 12, marginBottom: 4 },
  count: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  countNum: { ...Type.num, fontFamily: Fonts.bold, color: Colors.textPrimary },
  btns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.surfaceMedium,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 8,
    ...Shadows.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary },
  line: { marginTop: 2 },
  label: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  value: { ...Type.num, fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textPrimary },
  img: { width: '100%', height: 140, borderRadius: Radius.md, backgroundColor: Colors.surfaceMedium },
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: Spacing.gutter },
  sheet: { maxHeight: '90%', backgroundColor: Colors.surfaceLight, borderRadius: Radius.xxl, ...Shadows.xl },
  sheetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, paddingBottom: 8 },
  h2: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.secondary },
  desc: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21, color: Colors.textSecondary, marginTop: 4 },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.surfaceMedium, backgroundColor: Colors.surfaceLight },
  sheetBody: { padding: 20, paddingTop: 12 },
  sheetFoot: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: Colors.surfaceMedium },
});
