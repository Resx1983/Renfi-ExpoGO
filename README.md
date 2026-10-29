# Renfi — App móvil (Expo)

App móvil de **Renfi**, la plataforma para buscar, reservar y administrar fincas vacacionales en Antioquia. Es el equivalente de la [web en Angular](https://github.com/Ache-dev/Renfi) y consume la misma API ([API-Renfi](https://github.com/Ache-dev/API-Renfi)).

Construida con Expo SDK 57, React Native 0.86, React 19, Expo Router y TypeScript. También corre en web (`react-native-web`).

## Qué hace según el rol

| Rol | Funcionalidad |
|---|---|
| Visitante | Catálogo con buscador (municipio, capacidad, precio, orden), detalle de finca con ficha completa y galería, calendario de fechas ocupadas, "Sobre nosotros" |
| Cliente | Registro e inicio de sesión, reserva y pago, comprobante (compartible), "Mi cuenta" con edición de perfil y cancelación de reservas |
| Dueño de finca | Panel **Mi finca** (`/mi-finca`): resumen, sus fincas con galería de fotos, reservas recibidas (confirmar, finalizar, cancelar) e ingresos |
| Administrador | Panel (`/administrador`): indicadores, reportes y CRUD de usuarios, fincas (con galería), reservas, pagos, facturas, métodos de pago, municipios y roles |

Al registrarse se elige entre "reservar fincas" y "publicar mi finca". Los roles se reconocen por nombre ("Dueño de finca"), igual que en la API, que valida rol y propiedad en cada petición.

## Requisitos

- Node.js 20 o superior
- API-Renfi en marcha, con las migraciones `db/migraciones/001` a `004` aplicadas (sin la `003`, registrarse como dueño falla)
- Expo Go o un emulador (Android Studio / Xcode)

## Puesta en marcha

```bash
npm install
cp .env.example .env     # y ajusta EXPO_PUBLIC_API_URL
npx expo start
```

`EXPO_PUBLIC_API_URL` es la URL de la API. En un celular físico no sirve `localhost`: usa la IP de tu PC (`http://192.168.x.x:3000`) o la URL `https` del despliegue. La app no lleva ninguna clave de Supabase: todo pasa por la API con un JWT.

## Scripts

```bash
npx expo start        # servidor de desarrollo
npx expo lint         # lint
npx tsc --noEmit      # verificación de tipos
npx jest              # pruebas
```

## Estructura

```text
src/
├── app/                      # Rutas (Expo Router)
│   ├── index.tsx             # Inicio y catálogo
│   ├── fincas/[id].tsx       # Detalle de finca
│   ├── iniciar-sesion.tsx · registrarse.tsx · mi-cuenta.tsx · sobre-nosotros.tsx
│   ├── reserva/              # pago.tsx · comprobante.tsx
│   ├── administrador/        # Panel admin (solo administrador)
│   └── mi-finca/             # Panel del dueño (dueño o administrador)
├── components/
│   ├── admin/                # AdminHeader, RecursoCrud, ImagenesFinca, PanelUI (compartidos por ambos paneles)
│   └── ui/                   # Button, Input, Select, Badge, Feedback...
├── constants/                # theme.ts · adminResources.ts (módulos CRUD y navegación de los paneles)
├── context/AuthContext.tsx   # Sesión, esAdmin(), esDueno()
├── services/                 # api.ts (HTTP + JWT) y un servicio por dominio
└── types/
__tests__/                    # Jest + Testing Library
```

## Notas

- Las fotos se eligen de la galería, se reducen en el dispositivo y se suben a la API (máximo 10 por finca; la API las optimiza y las guarda en Supabase Storage).
- El monto de una reserva lo calcula la API (noches × precio); la app solo lo muestra.
- Si la API responde 401, la sesión local se cierra y hay que iniciar sesión de nuevo.
- Las convenciones de Expo para este repo están en [AGENTS.md](AGENTS.md).

## Licencia

MIT. Ver [LICENSE](LICENSE).
