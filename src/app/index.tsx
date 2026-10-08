import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Linking, StyleSheet, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { Footer } from '../components/Footer';
import { Cordillera, FincaImage, Zocalo } from '../components/Brand';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { FincasRelevantes } from '../components/FincasRelevantes';
import { SearchModal, type Filtros } from '../components/SearchModal';
import { listarFincas } from '../services/fincas.service';
import { Colors, Fonts, Radius, Shadows, Type, WHATSAPP_URL, formatCOP } from '../constants/theme';
import type { Finca } from '../types';

type Icon = keyof typeof Ionicons.glyphMap;

const STATS = [
  ['100%', 'Fincas verificadas en Colombia'],
  ['+500', 'Huéspedes satisfechos'],
  ['4.9/5', 'Calificación promedio de estadía'],
];
const BENEFITS: [Icon, string, string][] = [
  ['shield-checkmark-outline', 'Verificación garantizada', 'Inspeccionamos cada finca para asegurar fotos reales, servicios activos y anfitriones confiables.'],
  ['card-outline', 'Tarifas claras en COP', 'Sin cargos sorpresa en moneda extranjera. Precios en pesos colombianos con pasarela de pago segura.'],
  ['home-outline', 'Espacios campestres únicos', 'Propiedades equipadas con piscina, zonas verdes, BBQ y privacidad total para tu descanso.'],
  ['sparkles-outline', 'Atención personalizada', 'Soporte directo antes y durante tu viaje para resolver cualquier inquietud sobre tu estancia.'],
];
const STEPS: [string, string, string[]][] = [
  ['Encuentra tu destino', 'Explora fincas por municipio, capacidad, amenidades y rango de precio en pesos colombianos.', ['Fotos y descripciones verificadas', 'Ubicación precisa y clima']],
  ['Selecciona fechas', 'Elige los días de tu estadía y el número de huéspedes para verificar disponibilidad al instante.', ['Calendario en tiempo real', 'Cálculo transparente de noches']],
  ['Reserva segura', 'Realiza el pago protegido y recibe de inmediato tu comprobante oficial con código único.', ['Confirmación inmediata', 'Comprobante digital descargable']],
  ['Disfruta el campo', 'Coordina la llegada directamente con el anfitrión y vive unas vacaciones inolvidables.', ['Guía de acceso y contacto', 'Soporte Renfi en todo momento']],
];
const TESTIMONIOS = [
  ['Camila Restrepo', 'Viajó en familia a Sopetrán', 'La finca superó nuestras expectativas. Todo estaba impecable, la piscina perfecta y el anfitrión muy atento.'],
  ['Andrés Jaramillo', 'Grupo de amigos en La Vega', 'Reservar por Renfi fue facilísimo. El precio en pesos sin sorpresas y la confirmación inmediata nos dio mucha seguridad.'],
  ['Mariana Duarte', 'Descanso en Melgar', 'Espacios verdes amplios, tranquilidad absoluta y la certeza de que la finca era exactamente como se mostraba en la plataforma.'],
];

const Heading = ({ title, text }: { title: string; text: string }) => (
  <View style={styles.heading}>
    <Text accessibilityRole="header" style={styles.h2}>{title}</Text>
    <Text style={styles.p}>{text}</Text>
  </View>
);

export default function InicioScreen() {
  const insets = useSafeAreaInsets();
  const { seccion } = useLocalSearchParams<{ seccion?: string }>();
  const scroll = useRef<ScrollView>(null);
  const ys = useRef<Record<string, number>>({});
  const pendiente = useRef<string | undefined>(undefined);
  const [fincas, setFincas] = useState<Finca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [buscar, setBuscar] = useState(false);
  const [inicial, setInicial] = useState<Partial<Filtros> | undefined>(undefined);
  const [qMunicipio, setQMunicipio] = useState('');
  const [qHuespedes, setQHuespedes] = useState('');

  const cargar = () => {
    setLoading(true);
    setError(false);
    listarFincas().then((r) => {
      setFincas(r.data ?? []);
      setError(!!r.error);
      setLoading(false);
    });
  };
  useEffect(() => {
    let alive = true;
    listarFincas().then((r) => {
      if (!alive) return;
      setFincas(r.data ?? []);
      setError(!!r.error);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const irA = useCallback((id: string) => {
    const y = ys.current[id];
    if (y === undefined) { pendiente.current = id; return; }
    pendiente.current = undefined;
    scroll.current?.scrollTo({ y, animated: true });
  }, []);
  useEffect(() => {
    if (seccion === 'portafolio' || seccion === 'procesos') irA(seccion);
  }, [seccion, irA]);
  const medir = useCallback((id: string, e: LayoutChangeEvent) => {
    ys.current[id] = e.nativeEvent.layout.y;
    if (pendiente.current === id) irA(id);
  }, [irA]);

  const municipios = useMemo(() => {
    const m = [...new Set(fincas.map((x) => x.NombreMunicipio).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'es'));
    return [{ label: 'Todos los municipios', value: '' }, ...m.map((v) => ({ label: v, value: v }))];
  }, [fincas]);

  const abrirBuscador = (ini?: Partial<Filtros>) => {
    setInicial(ini);
    setBuscar(true);
  };

  const f = fincas[0];
  const meta = f
    ? [f.NombreMunicipio || 'Ubicación reservada', `${f.Capacidad} huéspedes`]
    : ['Antioquia · Cundinamarca · Eje Cafetero', 'Tarifas directas en COP', 'Reserva 100% verificada'];

  return (
    <View style={styles.page}>
      <AppHeader />
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom }}>
        {/* 1. Hero */}
        <View style={styles.heroWrap}>
          <LinearGradient colors={['#1b4332', '#081c15']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
          <Cordillera height={170} style={styles.ridge} />
          <View style={styles.hero}>
            <Text accessibilityRole="header" style={styles.h1}>Encuentra y reserva fincas de recreo en toda Colombia</Text>
            <Text style={styles.lead}>
              Disfruta de espacios campestres auténticos para tus vacaciones o fines de semana con tarifas transparentes en COP y reserva directa garantizada.
            </Text>
            <View style={styles.btns}>
              <Button title="Explorar fincas" size="lg" fullWidth onPress={() => abrirBuscador()} />
              <Button title="Cómo funciona" variant="onDark" size="lg" fullWidth onPress={() => irA('procesos')} />
            </View>

            <View style={styles.quick}>
              <Select label="Municipio" value={qMunicipio} options={municipios} onChange={setQMunicipio} />
              <Input label="Huéspedes" placeholder="¿Cuántos?" keyboardType="numeric" value={qHuespedes} onChangeText={(v) => setQHuespedes(v.replace(/\D/g, ''))} />
              <Button title="Buscar" icon="search" fullWidth onPress={() => abrirBuscador({ municipio: qMunicipio, capacidad: qHuespedes })} />
            </View>

            <View style={styles.stats}>
              {STATS.map(([v, l], i) => (
                <View key={l} style={[styles.stat, i > 0 && styles.statDiv]}>
                  <Text style={[styles.statV, Type.num]}>{v}</Text>
                  <Text style={styles.statL}>{l}</Text>
                </View>
              ))}
            </View>

            <View style={styles.show}>
              <View>
                {f ? (
                  <FincaImage uri={f.Imagenes?.[0]?.UrlImagen} style={styles.showImg} />
                ) : (
                  <FincaImage uri={null} style={styles.showImg} />
                )}
                <Badge
                  label={f ? 'Finca verificada' : 'Experiencia Renfi'}
                  variant="success"
                  style={styles.showBadge}
                />
              </View>
              <View style={styles.showBody}>
                <Text style={styles.showTitle}>{f ? f.NombreFinca : 'Fincas campestres con todo incluido'}</Text>
                {!f && (
                  <Text style={styles.showText}>
                    Espacios privados con piscina, zonas verdes y áreas para asados en los mejores climas de Colombia.
                  </Text>
                )}
                {meta.map((m) => <Text key={m} style={[styles.showMeta, Type.num]}>{m}</Text>)}
                {f && (
                  <Text style={[styles.price, Type.num]}>
                    {formatCOP(f.Precio)}<Text style={styles.night}> /noche</Text>
                  </Text>
                )}
                <Button
                  title={f ? 'Ver detalle' : 'Explorar fincas'}
                  variant="secondary"
                  fullWidth
                  onPress={() => (f ? router.push(`/fincas/${f.IdFinca}`) : abrirBuscador())}
                />
              </View>
            </View>
          </View>
          <Zocalo />
        </View>

        {/* 2. Fincas destacadas */}
        <View style={styles.section} onLayout={(e) => medir('portafolio', e)}>
          <View style={styles.gutter}>
            <Heading title="Fincas campestres destacadas" text="Encuentra el lugar ideal para relajarte con tu familia o amigos en los mejores destinos rurales de Colombia." />
          </View>
          <FincasRelevantes fincas={fincas} loading={loading} error={error} onRetry={cargar} />
        </View>

        {/* 3. Beneficios */}
        <View style={[styles.section, styles.cal, styles.gutter]}>
          <Heading title="Descanso auténtico con total tranquilidad" text="Propiedades seleccionadas, verificación rigurosa y pagos seguros para que tus escapadas al campo sean memorables." />
          <View>
            {BENEFITS.map(([icon, t, d]) => (
              <View key={t} style={styles.benefit}>
                <View style={styles.circle}>
                  <Ionicons name={icon} size={22} color={Colors.secondary} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.itemT}>{t}</Text>
                  <Text style={styles.p}>{d}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 4. Proceso */}
        <View style={[styles.section, styles.gutter]} onLayout={(e) => medir('procesos', e)}>
          <Heading title="Tu escapada en 4 sencillos pasos" text="Desde la búsqueda del destino hasta la llegada a la finca, hacemos que reservar sea transparente y confiable." />
          <View>
            {STEPS.map(([t, d, checks], i) => (
              <View key={t} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={[styles.stepN, Type.num]}>{String(i + 1).padStart(2, '0')}</Text>
                  {i < STEPS.length - 1 && <View style={styles.connector} />}
                </View>
                <View style={[styles.flex, i < STEPS.length - 1 && { paddingBottom: 28 }]}>
                  <Text style={styles.itemT}>{t}</Text>
                  <Text style={styles.p}>{d}</Text>
                  {checks.map((c) => (
                    <View key={c} style={styles.check}>
                      <Ionicons name="checkmark" size={16} color={Colors.success} />
                      <Text style={styles.checkT}>{c}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 5. Testimonios */}
        <View style={[styles.section, styles.cal, styles.gutter]}>
          <Heading title="Experiencias de nuestros huéspedes" text="Descanso, naturaleza y momentos memorables compartidos en el campo." />
          <View>
            {TESTIMONIOS.map(([n, r, q], i) => (
              <View key={n} style={[styles.quote, i > 0 && styles.quoteSep]}>
                <Ionicons name="chatbox-ellipses-outline" size={30} color={Colors.primary} />
                <Text style={styles.quoteT}>{q}</Text>
                <Text style={styles.quoteN}>{n}</Text>
                <Text style={styles.quoteR}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 6. CTA final */}
        <View style={styles.cta}>
          <Text accessibilityRole="header" style={styles.h2}>¿Listo para tu próxima escapada al campo?</Text>
          <Text style={styles.p}>Explora nuestras fincas campestres verificadas o comunícate con nosotros para brindarte asistencia personalizada.</Text>
          <Button title="Explorar fincas" size="lg" fullWidth onPress={() => abrirBuscador()} />
          <Button title="Contactar por WhatsApp" variant="secondary" size="lg" fullWidth onPress={() => Linking.openURL(WHATSAPP_URL)} />
        </View>

        <Footer />
      </ScrollView>
      <SearchModal fincas={fincas} loading={loading} visible={buscar} inicial={inicial} onClose={() => setBuscar(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.surfaceBase },
  flex: { flex: 1 },
  gutter: { paddingHorizontal: 16 },
  heroWrap: { backgroundColor: Colors.secondary, overflow: 'hidden' },
  ridge: { position: 'absolute', left: 0, right: 0, bottom: 14 },
  hero: { padding: 16, paddingTop: 40, paddingBottom: 112, gap: 20 },
  h1: { ...Type.display, color: Colors.textInverse },
  lead: { fontFamily: Fonts.regular, fontSize: 18, lineHeight: 28, color: Colors.textOnDarkMuted },
  btns: { gap: 12 },
  quick: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.xl, padding: 16, ...Shadows.xl },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, paddingHorizontal: 8, gap: 2 },
  statDiv: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.18)' },
  statV: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textInverse },
  statL: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textOnDarkMuted },
  show: { backgroundColor: Colors.surfaceLight, borderRadius: Radius.xxl, overflow: 'hidden', ...Shadows.xl },
  showImg: { width: '100%', aspectRatio: 4 / 3 },
  showBadge: { position: 'absolute', top: 12, left: 12 },
  showBody: { padding: 18, gap: 8 },
  showTitle: { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 26, color: Colors.textPrimary },
  showText: { ...Type.body, fontSize: 15, lineHeight: 23 },
  showMeta: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  price: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.primary, marginTop: 4, marginBottom: 6 },
  night: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary },
  section: { paddingVertical: 60, gap: 24 },
  cal: { backgroundColor: Colors.surfaceLight },
  heading: { gap: 10 },
  h2: { ...Type.headline },
  p: { ...Type.body, fontSize: 15, lineHeight: 23 },
  benefit: { flexDirection: 'row', gap: 16, paddingVertical: 20, borderTopWidth: 1, borderTopColor: Colors.surfaceMedium },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.secondarySurface, alignItems: 'center', justifyContent: 'center' },
  itemT: { fontFamily: Fonts.bold, fontSize: 18, color: Colors.textPrimary, marginBottom: 4 },
  step: { flexDirection: 'row', gap: 12 },
  stepNum: { width: 44, alignItems: 'flex-start' },
  stepN: { fontFamily: Fonts.bold, fontSize: 20, color: Colors.primary },
  connector: { flex: 1, width: 1, backgroundColor: Colors.surfaceMedium, marginTop: 8, marginLeft: 10 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  checkT: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textPrimary },
  quote: { gap: 10, paddingVertical: 20 },
  quoteSep: { borderTopWidth: 1, borderTopColor: Colors.surfaceMedium },
  quoteT: { fontFamily: Fonts.regular, fontSize: 17.6, lineHeight: 27, color: Colors.textPrimary },
  quoteN: { fontFamily: Fonts.semibold, fontSize: 15, color: Colors.textPrimary },
  quoteR: { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textSecondary, marginTop: -6 },
  cta: { margin: 16, marginVertical: 40, paddingVertical: 40, paddingHorizontal: 24, gap: 14, backgroundColor: Colors.primarySurface, borderWidth: 1, borderColor: 'rgba(194,65,12,0.12)', borderRadius: Radius.xxl },
});
