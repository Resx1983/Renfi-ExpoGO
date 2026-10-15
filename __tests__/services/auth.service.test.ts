import { iniciarSesion, registrarUsuario, actualizarUsuario, hashSHA512 } from '../../src/services/auth.service';
import { api, guardarToken } from '../../src/services/api';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA512: 'SHA-512' },
  digestStringAsync: jest.fn(async (_alg: string, v: string) => `sha512(${v})`),
}));

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
  guardarToken: jest.fn(),
}));

const usuarioApi = {
  NumeroDocumento: 2,
  IdRol: 2,
  NombreUsuario: 'Juan',
  ApellidoUsuario: 'Pérez',
  Telefono: '3109876543',
  Correo: 'juan.perez@example.com',
  Estado: 'Activo',
  NombreRol: 'Cliente',
};

describe('Auth Service (contra la API)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('iniciarSesion', () => {
    test('envía correo y contraseña a la API y guarda el token', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { token: 'jwt-123', usuario: usuarioApi }, error: null, status: 200 });

      const res = await iniciarSesion('  Juan.Perez@Example.com ', 'cliente123');

      expect(api.post).toHaveBeenCalledWith('/api/usuario/login', { Correo: 'juan.perez@example.com', Contrasena: 'cliente123' });
      expect(guardarToken).toHaveBeenCalledWith('jwt-123');
      expect(res.error).toBeNull();
      expect(res.data?.NombreUsuario).toBe('Juan');
      expect(res.data?.NombreRol).toBe('Cliente');
      expect(res.data).not.toHaveProperty('Contrasena');
    });

    test('rechaza credenciales incorrectas sin guardar token', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: null, error: 'Credenciales inválidas.', status: 401 });
      const res = await iniciarSesion('x@y.com', 'malaclave');
      expect(res.data).toBeNull();
      expect(res.error).toBe('Credenciales incorrectas. Verifica tu correo y contraseña.');
      expect(guardarToken).not.toHaveBeenCalled();
    });

    test('muestra el mensaje de la API en otros errores (cuenta inactiva, red)', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: null, error: 'No fue posible conectar con el servidor.', status: 0 });
      const res = await iniciarSesion('juan.perez@example.com', 'cliente123');
      expect(res.error).toBe('No fue posible conectar con el servidor.');
    });
  });

  describe('registrarUsuario', () => {
    test('registra solo datos personales: la API decide rol y estado', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { id: 7, NumeroDocumento: 7 }, error: null, status: 201 });

      const res = await registrarUsuario({
        nombre: ' Ana ', apellido: 'Gómez', telefono: '', correo: ' Ana@Mail.com ', contrasena: 'Secreta123',
      });

      expect(res).toEqual({ numeroDocumento: 7, error: null });
      const enviado = (api.post as jest.Mock).mock.calls[0][1];
      expect(enviado).toEqual({
        NombreUsuario: 'Ana', ApellidoUsuario: 'Gómez', Telefono: null, Correo: 'ana@mail.com', Contrasena: 'Secreta123',
      });
      expect(enviado).not.toHaveProperty('IdRol');
      expect(enviado).not.toHaveProperty('Estado');
    });

    test('traduce el correo duplicado (409)', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({ data: null, error: 'ya registrado', status: 409 });
      const res = await registrarUsuario({ nombre: 'A', apellido: 'B', telefono: '', correo: 'a@b.com', contrasena: 'x' });
      expect(res.numeroDocumento).toBeNull();
      expect(res.error).toBe('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
    });
  });

  describe('actualizarUsuario', () => {
    test('solo envía nombre, apellido y teléfono', async () => {
      (api.put as jest.Mock).mockResolvedValueOnce({ data: {}, error: null, status: 200 });
      const res = await actualizarUsuario(2, { NombreUsuario: 'Juan', ApellidoUsuario: 'P', Telefono: null });
      expect(api.put).toHaveBeenCalledWith('/api/usuario/2', { NombreUsuario: 'Juan', ApellidoUsuario: 'P', Telefono: '' });
      expect(res.error).toBeNull();
    });
  });

  test('hashSHA512 delega en expo-crypto', async () => {
    expect(await hashSHA512('abc')).toBe('sha512(abc)');
  });
});
