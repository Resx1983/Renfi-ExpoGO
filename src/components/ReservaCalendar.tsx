import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Type } from '../constants/theme';
import type { Reserva } from '../types';

// =============================================================================
// RESERVA CALENDAR — Calendario lunes-primero con días ocupados
// Fechas siempre como 'YYYY-MM-DD' locales (nunca toISOString).
// =============================================================================

export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const CABECERA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const pad = (n: number) => String(n).padStart(2, '0');
export const fmtYmd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`; // m 0-11
const recortar = (s: string) => String(s).slice(0, 10);

export function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = recortar(ymd).split('-').map(Number);
  return { y, m: m - 1, d };
}

export function hoyYmd(): string {
  const n = new Date();
  return fmtYmd(n.getFullYear(), n.getMonth(), n.getDate());
}

export function sumarDias(ymd: string, n: number): string {
  const { y, m, d } = parseYmd(ymd);
  const dt = new Date(y, m, d + n);
  return fmtYmd(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/** Ej. "sábado, 12 de octubre de 2026" */
export function fechaLarga(valor: string): string {
  const { y, m, d } = parseYmd(valor);
  return `${DIAS[new Date(y, m, d).getDay()]}, ${d} de ${MESES[m]} de ${y}`;
}

/** Ej. "8 oct 2026" */
export function fechaMedia(valor: string): string {
  const { y, m, d } = parseYmd(valor);
  return `${d} ${MESES[m].slice(0, 3)} ${y}`;
}

/** Ej. "12/10/2026" (acepta ISO o YYYY-MM-DD) */
export function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return '-';
  const { y, m, d } = parseYmd(valor);
  return `${pad(d)}/${pad(m + 1)}/${y}`;
}

/** Noches ocupadas: [FechaEntrada, FechaSalida) por reserva. */
export function diasOcupados(reservas: Pick<Reserva, 'FechaEntrada' | 'FechaSalida'>[]): Set<string> {
  const set = new Set<string>();
  for (const r of reservas) {
    if (!r.FechaEntrada || !r.FechaSalida) continue;
    const fin = recortar(r.FechaSalida);
    for (let d = recortar(r.FechaEntrada); d < fin; d = sumarDias(d, 1)) set.add(d);
  }
  return set;
}

/** true si alguna de las `noches` noches desde `entrada` está ocupada. */
export function hayConflicto(entrada: string, noches: number, ocupados: Set<string>): boolean {
  for (let i = 0; i < noches; i++) if (ocupados.has(sumarDias(entrada, i))) return true;
  return false;
}

export interface CeldaMes {
  ymd: string;
  dia: number;
  delMes: boolean;
}

/** Cuadrícula del mes (month 0-11), semanas completas empezando en lunes. */
export function construirMes(year: number, month: number): CeldaMes[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // lunes = 0
  const dias = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((offset + dias) / 7) * 7;
  const celdas: CeldaMes[] = [];
  for (let i = 0; i < total; i++) {
    const dt = new Date(year, month, 1 - offset + i);
    celdas.push({
      ymd: fmtYmd(dt.getFullYear(), dt.getMonth(), dt.getDate()),
      dia: dt.getDate(),
      delMes: dt.getMonth() === month,
    });
  }
  return celdas;
}

interface Props {
  ocupados: Set<string>;
  seleccionado: string | null;
  onSelect: (ymd: string) => void;
}

export function ReservaCalendar({ ocupados, seleccionado, onSelect }: Props) {
  const hoy = hoyYmd();
  const ini = parseYmd(hoy);
  const [vista, setVista] = useState({ y: ini.y, m: ini.m });
  const celdas = construirMes(vista.y, vista.m);

  const mover = (delta: number) => {
    const dt = new Date(vista.y, vista.m + delta, 1);
    setVista({ y: dt.getFullYear(), m: dt.getMonth() });
  };

  return (
    <View>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" style={styles.navBtn} onPress={() => mover(-1)}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.titulo}>
          {MESES[vista.m].charAt(0).toUpperCase() + MESES[vista.m].slice(1)} {vista.y}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" style={styles.navBtn} onPress={() => mover(1)}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.fila}>
        {CABECERA.map((c) => (
          <Text key={c} style={styles.cab}>
            {c}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {celdas.map((c) => {
          const pasado = c.ymd < hoy;
          const reservado = c.delMes && !pasado && ocupados.has(c.ymd);
          const deshabilitado = !c.delMes || pasado || reservado;
          const sel = c.ymd === seleccionado;
          const esHoy = c.ymd === hoy && c.delMes;
          const txt = sel ? styles.txtSel : reservado ? styles.txtRes : deshabilitado ? styles.txtOff : styles.txt;
          return (
            <View key={c.ymd} style={styles.celdaWrap}>
              <Pressable
                accessibilityLabel={c.ymd}
                disabled={deshabilitado}
                onPress={() => onSelect(c.ymd)}
                style={({ pressed }) => [
                  styles.celda,
                  reservado ? styles.res : deshabilitado ? styles.off : sel ? styles.sel : pressed ? styles.pres : null,
                  esHoy && !sel && styles.hoy,
                ]}
              >
                <Text style={[styles.num, Type.num, txt, esHoy && styles.numHoy]}>{c.dia}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={styles.leyenda}>
        <Leyenda estilo={styles.swLibre} texto="Disponible" />
        <Leyenda estilo={styles.swRes} texto="Reservado" />
        <Leyenda estilo={styles.swOff} texto="No disponible" />
      </View>
    </View>
  );
}

function Leyenda({ estilo, texto }: { estilo: object; texto: string }) {
  return (
    <View style={styles.ley}>
      <View style={[styles.sw, estilo]} />
      <Text style={styles.leyTxt}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceMedium, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: Fonts.semibold, fontSize: 16, color: Colors.textPrimary },
  fila: { flexDirection: 'row' },
  cab: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: Fonts.semibold, fontSize: 12, color: Colors.textSecondary, paddingVertical: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  celdaWrap: { width: `${100 / 7}%`, padding: 2 },
  celda: { height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  pres: { backgroundColor: Colors.primarySurface },
  sel: { backgroundColor: Colors.primary },
  res: { backgroundColor: 'rgba(143,152,146,0.22)' },
  off: { opacity: 0.45 },
  hoy: { borderColor: Colors.primary },
  num: { fontFamily: Fonts.medium, fontSize: 14 },
  numHoy: { fontFamily: Fonts.bold },
  txt: { color: Colors.textPrimary },
  txtRes: { color: Colors.textTertiary, textDecorationLine: 'line-through' },
  txtOff: { color: Colors.textTertiary },
  txtSel: { color: Colors.textInverse, fontFamily: Fonts.bold },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 },
  ley: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sw: { width: 14, height: 14, borderRadius: 4 },
  swLibre: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.surfaceDark },
  swRes: { backgroundColor: 'rgba(143,152,146,0.22)' },
  swOff: { backgroundColor: Colors.surfaceMedium },
  leyTxt: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
});
