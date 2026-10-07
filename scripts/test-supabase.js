/**
 * Script de prueba de conexión y peticiones a Supabase para Renfi.
 * Ejecución: node scripts/test-supabase.js
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env manualmente sin dependencias adicionales
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      process.env[key.trim()] = values.join('=').trim();
    }
  }
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

console.log('====================================================');
console.log(' Diagnóstico de Conexión Supabase - Renfi');
console.log('====================================================');
console.log('URL:', supabaseUrl || '❌ NO CONFIGURADA');
console.log('KEY:', supabaseKey ? `${supabaseKey.substring(0, 15)}...` : '❌ NO CONFIGURADA');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ERROR: Faltan variables en el archivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosticar() {
  console.log('\n--- 1. Prueba de Tablas Directas ---');
  const tablas = ['Rol', 'Usuario', 'Municipio', 'Finca', 'Imagen', 'MetodoDePago', 'Reserva', 'Factura', 'Pago'];

  let permisosOk = true;
  for (const tabla of tablas) {
    const { data, error } = await supabase.from(tabla).select('*').limit(3);
    if (error) {
      permisosOk = false;
      console.log(`❌ Tabla [${tabla}]: Error ${error.code} - ${error.message}`);
    } else {
      console.log(`✅ Tabla [${tabla}]: OK (${data.length} registros obtenidos)`);
    }
  }

  console.log('\n--- 2. Prueba de Procedimientos Almacenados (RPC) ---');

  // SP_ListarFincas
  const rpcFincas = await supabase.rpc('SP_ListarFincas');
  if (rpcFincas.error) {
    console.log(`❌ RPC [SP_ListarFincas]: Error ${rpcFincas.error.code} - ${rpcFincas.error.message}`);
  } else {
    console.log(`✅ RPC [SP_ListarFincas]: OK (${(rpcFincas.data || []).length} fincas devueltas)`);
  }

  // SP_IniciarSesion
  const rpcLogin = await supabase.rpc('SP_IniciarSesion', {
    p_Correo: 'admin@renfi.com',
    p_Contrasena: 'admin123',
  });
  if (rpcLogin.error) {
    console.log(`❌ RPC [SP_IniciarSesion]: Error ${rpcLogin.error.code} - ${rpcLogin.error.message}`);
  } else {
    console.log(`✅ RPC [SP_IniciarSesion]: OK (Login exitoso para: ${rpcLogin.data?.[0]?.NombreUsuario || 'Sin datos'})`);
  }

  // SP_ListarMunicipios
  const rpcMunis = await supabase.rpc('SP_ListarMunicipios');
  if (rpcMunis.error) {
    console.log(`❌ RPC [SP_ListarMunicipios]: Error ${rpcMunis.error.code} - ${rpcMunis.error.message}`);
  } else {
    console.log(`✅ RPC [SP_ListarMunicipios]: OK (${(rpcMunis.data || []).length} municipios devueltos)`);
  }

  console.log('\n====================================================');
  if (!permisosOk || rpcFincas.error || rpcLogin.error) {
    console.log('⚠️  ESTADO: Requiere ejecutar el script en Supabase SQL Editor.');
    console.log('    Archivo: supabase/setup_renfi_database.sql');
    console.log('    URL del proyecto: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1]?.split('.')[0] + '/sql/new');
  } else {
    console.log('🎉  ESTADO: ¡La base de datos de Supabase está 100% operativa!');
  }
  console.log('====================================================\n');
}

diagnosticar().catch(console.error);

