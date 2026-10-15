import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, guardarToken, cargarToken, alExpirarSesion } from '../../src/services/api';

const respuesta = (status: number, cuerpo: any) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => cuerpo }) as Response;

describe('cliente HTTP de la API', () => {
  const fetchMock = jest.fn();
  beforeEach(async () => {
    jest.clearAllMocks();
    (globalThis as any).fetch = fetchMock;
    await AsyncStorage.clear();
    await guardarToken(null);
    alExpirarSesion(null);
  });

  test('adjunta el token Bearer a cada petición y usa EXPO_PUBLIC_API_URL', async () => {
    await guardarToken('jwt-1');
    fetchMock.mockResolvedValueOnce(respuesta(200, []));
    await api.get('/api/finca');
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/finca');
    expect(opciones.headers.Authorization).toBe('Bearer jwt-1');
  });

  test('sin sesión no envía Authorization', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, []));
    await api.get('/api/finca');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  test('el token se persiste y se recupera', async () => {
    await guardarToken('jwt-2');
    expect(await AsyncStorage.getItem('@renfi_token')).toBe('jwt-2');
    expect(await cargarToken()).toBe('jwt-2');
  });

  test('un 401 con sesión activa borra el token y avisa para cerrar la sesión', async () => {
    const cerrar = jest.fn();
    alExpirarSesion(cerrar);
    await guardarToken('jwt-vencido');
    fetchMock.mockResolvedValueOnce(respuesta(401, { message: 'El token de sesión ha expirado.' }));

    const r = await api.get('/api/reserva/usuario/2');

    expect(r.error).toBe('El token de sesión ha expirado.');
    expect(cerrar).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem('@renfi_token')).toBeNull();
  });

  test('un 401 del login (credenciales malas) no cierra ninguna sesión', async () => {
    const cerrar = jest.fn();
    alExpirarSesion(cerrar);
    await guardarToken('jwt-vigente');
    fetchMock.mockResolvedValueOnce(respuesta(401, { message: 'Credenciales inválidas.' }));
    await api.post('/api/usuario/login', {});
    expect(cerrar).not.toHaveBeenCalled();
  });

  test('un fallo de red devuelve un mensaje amigable', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const r = await api.get('/api/finca');
    expect(r).toMatchObject({ data: null, status: 0 });
    expect(r.error).toBe('No fue posible conectar con el servidor. Revisa tu conexión a internet.');
  });

  test('envía el cuerpo como JSON', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(201, { id: 1 }));
    const r = await api.post('/api/imagen', { UrlImagen: 'u' });
    expect(fetchMock.mock.calls[0][1].body).toBe('{"UrlImagen":"u"}');
    expect(r.data).toEqual({ id: 1 });
  });
  test('subir envía multipart sin Content-Type JSON (fetch pone el boundary) y con el token', async () => {
    await guardarToken('jwt-3');
    fetchMock.mockResolvedValueOnce(respuesta(201, { imagen: { IdImagen: 1 } }));

    const r = await api.subir('/api/finca/1/imagenes', { uri: 'file:///f.jpg', nombre: 'f.jpg', tipo: 'image/jpeg' }, { TextoAlternativo: 'Sala' });

    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/finca/1/imagenes');
    expect(opciones.method).toBe('POST');
    expect(opciones.body).toBeInstanceOf(FormData);
    expect(opciones.headers['Content-Type']).toBeUndefined();
    expect(opciones.headers.Authorization).toBe('Bearer jwt-3');
    expect(r.data).toEqual({ imagen: { IdImagen: 1 } });
  });

  test('subir devuelve el mensaje de la API ante un 413 (imagen demasiado grande)', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(413, { message: 'La imagen supera el tamaño máximo de 5 MB.' }));
    const r = await api.subir('/api/finca/1/imagenes', { uri: 'file:///f.jpg', nombre: 'f.jpg', tipo: 'image/jpeg' });
    expect(r).toMatchObject({ data: null, status: 413, error: 'La imagen supera el tamaño máximo de 5 MB.' });
  });
});
