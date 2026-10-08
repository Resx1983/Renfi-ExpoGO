import { iniciarSesion, registrarUsuario, hashSHA512 } from '../../src/services/auth.service';
import { supabase } from '../../src/services/supabase';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA512: 'SHA-512' },
  digestStringAsync: jest.fn(async (_alg: string, v: string) => `sha512(${v})`),
}));

jest.mock('../../src/services/supabase', () => ({
  supabase: { from: jest.fn() },
}));

// Cadena PostgREST simulada: cada método devuelve la cadena; los terminales resuelven `result`
function query(result: { data: any; error: any }) {
  const chain: any = {};
  for (const m of ['select', 'insert', 'update', 'eq', 'ilike', 'in', 'limit']) chain[m] = jest.fn(() => chain);
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  chain.single = jest.fn().mockResolvedValue(result);
  return chain;
}

const usuarioDB = {
  NumeroDocumento: 2,
  IdRol: 2,
  NombreUsuario: 'Juan',
  ApellidoUsuario: 'Pérez',
  Telefono: '3109876543',
  Correo: 'juan.perez@example.com',
  Estado: 'Activo',
  Rol: { NombreRol: 'Cliente' },
};

describe('Auth Service (con Mocks)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('iniciarSesion', () => {
    test('compara la contraseña en texto plano o SHA-512 en el servidor', async () => {
      const q = query({ data: usuarioDB, error: null });
      (supabase.from as jest.Mock).mockReturnValueOnce(q);

      const res = await iniciarSesion('  Juan.Perez@Example.com ', 'cliente123');

      expect(res.error).toBeNull();
      expect(res.data?.NombreUsuario).toBe('Juan');
      expect(res.data?.NombreRol).toBe('Cliente');
      expect(q.ilike).toHaveBeenCalledWith('Correo', 'juan.perez@example.com');
      expect(q.in).toHaveBeenCalledWith('Contrasena', ['cliente123', 'sha512(cliente123)']);
    });

    test('rechaza credenciales incorrectas', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(query({ data: null, error: null }));
      const res = await iniciarSesion('x@y.com', 'malaclave');
      expect(res.data).toBeNull();
      expect(res.error).toBe('Credenciales incorrectas. Verifica tu correo y contraseña.');
    });

    test('rechaza cuentas inactivas', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(query({ data: { ...usuarioDB, Estado: 'Inactivo' }, error: null }));
      const res = await iniciarSesion('juan.perez@example.com', 'cliente123');
      expect(res.error).toBe('Tu cuenta se encuentra inactiva. Contacta al administrador.');
    });

    test('informa el error de permisos 42501', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(
        query({ data: null, error: { code: '42501', message: 'permission denied for table Usuario' } })
      );
      const res = await iniciarSesion('a@b.com', '123456');
      expect(res.error).toContain('Permisos denegados');
    });
  });

  describe('registrarUsuario', () => {
    test('guarda la contraseña en SHA-512 y el correo en minúsculas', async () => {
      const q = query({ data: { NumeroDocumento: 10 }, error: null });
      (supabase.from as jest.Mock).mockReturnValueOnce(q);

      const res = await registrarUsuario({
        nombre: ' Ana ',
        apellido: 'Gómez',
        telefono: '3001234567',
        correo: 'Ana@Renfi.com',
        contrasena: 'secreta123',
      });

      expect(res).toEqual({ numeroDocumento: 10, error: null });
      expect(q.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          IdRol: 2,
          NombreUsuario: 'Ana',
          Correo: 'ana@renfi.com',
          Contrasena: 'sha512(secreta123)',
          Estado: 'Activo',
        })
      );
    });

    test('detecta correo duplicado', async () => {
      (supabase.from as jest.Mock).mockReturnValueOnce(
        query({ data: null, error: { code: '23505', message: 'duplicate key value' } })
      );
      const res = await registrarUsuario({ nombre: 'A', apellido: 'B', telefono: '', correo: 'a@b.com', contrasena: '12345678' });
      expect(res.error).toBe('Este correo electrónico ya está registrado. Intenta iniciar sesión.');
    });
  });

  test('hashSHA512 usa expo-crypto', async () => {
    expect(await hashSHA512('abc')).toBe('sha512(abc)');
  });
});
