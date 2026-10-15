import {
  listarFincas,
  listarFincasDisponibles,
  obtenerFincaPorId,
  listarMunicipios,
  crearFinca,
  modificarFinca,
  cambiarEstadoFinca,
  eliminarFinca,
  listarImagenesFinca,
  subirImagenFinca,
  establecerPortada,
  eliminarImagen,
} from '../../src/services/fincas.service';
import { api } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(), subir: jest.fn() },
}));

const ok = (data: any, status = 200) => ({ data, error: null, status });
const fallo = (error: string, status = 500) => ({ data: null, error, status });

const fincaApi = {
  IdFinca: 1,
  IdMunicipio: 2,
  NumeroDocumentoUsuario: 1,
  NombreFinca: 'Finca El Paraíso',
  Direccion: 'Km 5',
  InformacionAdicional: 'Con jacuzzi',
  Capacidad: 16,
  Precio: 850000,
  Estado: 'Disponible',
  Calificacion: 5,
  NombreMunicipio: 'Guatapé',
  NombrePropietario: 'Admin',
  ApellidoPropietario: 'Renfi',
  Imagenes: [{ IdImagen: 1, UrlImagen: 'https://img/1.jpg', IdFinca: 1 }],
};

describe('Fincas Service (contra la API)', () => {
  beforeEach(() => jest.resetAllMocks());

  describe('listarFincas', () => {
    test('lista y normaliza las fincas de GET /api/finca', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(ok([fincaApi]));
      const res = await listarFincas();
      expect(api.get).toHaveBeenCalledWith('/api/finca');
      expect(res.error).toBeNull();
      expect(res.data).toHaveLength(1);
      expect(res.data![0]).toMatchObject({ IdFinca: 1, NombreMunicipio: 'Guatapé', Precio: 850000 });
      expect(res.data![0].Imagenes).toHaveLength(1);
    });

    test('rellena valores por defecto cuando faltan datos', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(ok([{ IdFinca: 9 }]));
      const res = await listarFincas();
      expect(res.data![0]).toMatchObject({ NombreFinca: 'Finca sin nombre', NombreMunicipio: 'Antioquia', Imagenes: [] });
    });

    test('propaga el error de la API', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(fallo('No fue posible conectar con el servidor.', 0));
      const res = await listarFincas();
      expect(res.data).toBeNull();
      expect(res.error).toBe('No fue posible conectar con el servidor.');
    });
  });

  test('listarFincasDisponibles filtra Estado = Disponible', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(ok([fincaApi, { ...fincaApi, IdFinca: 2, Estado: 'Mantenimiento' }]));
    const res = await listarFincasDisponibles();
    expect(res.data!.map((f) => f.IdFinca)).toEqual([1]);
  });

  describe('obtenerFincaPorId', () => {
    test('obtiene el detalle', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(ok(fincaApi));
      const res = await obtenerFincaPorId(1);
      expect(api.get).toHaveBeenCalledWith('/api/finca/1');
      expect(res.data?.NombreFinca).toBe('Finca El Paraíso');
    });

    test('404 se traduce a "Finca no encontrada."', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(fallo('no existe', 404));
      const res = await obtenerFincaPorId(99);
      expect(res).toEqual({ data: null, error: 'Finca no encontrada.' });
    });
  });

  test('listarMunicipios ordena por nombre', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(ok([
      { IdMunicipio: 2, NombreMunicipio: 'Rionegro' },
      { IdMunicipio: 1, NombreMunicipio: 'Guatapé' },
    ]));
    const res = await listarMunicipios();
    expect(res.data!.map((m) => m.NombreMunicipio)).toEqual(['Guatapé', 'Rionegro']);
  });

  describe('crearFinca', () => {
    test('crea la finca, registra su imagen y devuelve el detalle', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce(ok({ id: 5 }, 201)).mockResolvedValueOnce(ok({}, 201));
      (api.get as jest.Mock).mockResolvedValueOnce(ok({ ...fincaApi, IdFinca: 5 }));

      const res = await crearFinca({
        IdMunicipio: 2, NombreFinca: 'Nueva', Direccion: 'Calle 1', Capacidad: 10, Precio: 500000, UrlImagen: ' https://img/n.jpg ',
      } as any);

      expect((api.post as jest.Mock).mock.calls[0][0]).toBe('/api/finca');
      expect((api.post as jest.Mock).mock.calls[0][1]).toMatchObject({ NombreFinca: 'Nueva', Estado: 'Disponible', Calificacion: 5 });
      expect(api.post).toHaveBeenCalledWith('/api/imagen', { IdFinca: 5, UrlImagen: 'https://img/n.jpg' });
      expect(res.data?.IdFinca).toBe(5);
    });

    test('si la API rechaza (p. ej. no es administrador) no intenta guardar la imagen', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce(fallo('No tienes permisos para realizar esta acción.', 403));
      const res = await crearFinca({ IdMunicipio: 2, NombreFinca: 'X', Direccion: 'Y', Capacidad: 1, Precio: 1, UrlImagen: 'u' } as any);
      expect(res.error).toBe('No tienes permisos para realizar esta acción.');
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('modificarFinca y cambiarEstadoFinca', () => {
    test('envía solo los campos definidos y actualiza la imagen existente', async () => {
      (api.put as jest.Mock).mockResolvedValue(ok({}));
      (api.get as jest.Mock)
        .mockResolvedValueOnce(ok([{ IdImagen: 3 }]))
        .mockResolvedValueOnce(ok(fincaApi));

      await modificarFinca(1, { NombreFinca: 'Renombrada', UrlImagen: 'https://img/nueva.jpg' } as any);

      expect(api.put).toHaveBeenNthCalledWith(1, '/api/finca/1', { NombreFinca: 'Renombrada' });
      expect(api.put).toHaveBeenNthCalledWith(2, '/api/imagen/3', { UrlImagen: 'https://img/nueva.jpg', IdFinca: 1 });
    });

    test('crea la imagen si la finca no tenía', async () => {
      (api.put as jest.Mock).mockResolvedValue(ok({}));
      (api.post as jest.Mock).mockResolvedValue(ok({}, 201));
      (api.get as jest.Mock).mockResolvedValueOnce(ok([])).mockResolvedValueOnce(ok(fincaApi));
      await modificarFinca(1, { UrlImagen: 'https://img/x.jpg' } as any);
      expect(api.post).toHaveBeenCalledWith('/api/imagen', { IdFinca: 1, UrlImagen: 'https://img/x.jpg' });
    });

    test('cambiarEstadoFinca solo cambia el Estado', async () => {
      (api.put as jest.Mock).mockResolvedValue(ok({}));
      (api.get as jest.Mock).mockResolvedValueOnce(ok({ ...fincaApi, Estado: 'Mantenimiento' }));
      const res = await cambiarEstadoFinca(1, 'Mantenimiento');
      expect(api.put).toHaveBeenCalledWith('/api/finca/1', { Estado: 'Mantenimiento' });
      expect(res.data?.Estado).toBe('Mantenimiento');
    });
  });

  describe('eliminarFinca', () => {
    test('elimina por ID', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce(ok({}));
      expect(await eliminarFinca(1)).toEqual({ success: true, error: null });
      expect(api.delete).toHaveBeenCalledWith('/api/finca/1');
    });

    test('devuelve el error de la API', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce(fallo('No se puede eliminar: existen registros relacionados.', 409));
      expect(await eliminarFinca(1)).toEqual({ success: false, error: 'No se puede eliminar: existen registros relacionados.' });
    });
  });
  describe('ficha completa', () => {
    test('normaliza los campos nuevos', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(ok([{
        ...fincaApi, Habitaciones: '6', Banos: 4, Camas: 9, NochesMinimas: 2, Comodidades: ['Piscina', 'BBQ'],
        Reglas: 'No fiestas', HoraEntrada: '15:00', HoraSalida: '11:00', PermiteMascotas: true, PermiteEventos: false,
        Latitud: '6.244203', Longitud: -75.581212, UrlPortada: 'https://cdn/p.webp',
      }]));
      const f = (await listarFincas()).data![0];
      expect(f).toMatchObject({
        Habitaciones: 6, Banos: 4, Camas: 9, NochesMinimas: 2, Comodidades: ['Piscina', 'BBQ'], Reglas: 'No fiestas',
        HoraEntrada: '15:00', PermiteMascotas: true, PermiteEventos: false, Latitud: 6.244203, Longitud: -75.581212,
        UrlPortada: 'https://cdn/p.webp',
      });
    });

    test('una finca sin ficha (API vieja) no rompe: valores seguros', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(ok([{ IdFinca: 3 }]));
      const f = (await listarFincas()).data![0];
      expect(f.Comodidades).toEqual([]);
      expect(f.Latitud).toBeNull();
      expect(f.Habitaciones).toBeUndefined();
      expect(f.PermiteMascotas).toBe(false);
    });
  });

  describe('galería de imágenes', () => {
    const archivo = { uri: 'file:///foto.jpg', nombre: 'foto.jpg', tipo: 'image/jpeg' };

    test('listarImagenesFinca pide la galería de la finca', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce(ok([{ IdImagen: 1, UrlImagen: 'u', IdFinca: 1, EsPortada: true }]));
      const r = await listarImagenesFinca(1);
      expect(api.get).toHaveBeenCalledWith('/api/imagen/finca/1');
      expect(r.data![0].EsPortada).toBe(true);
    });

    test('subirImagenFinca envía el archivo y el texto alternativo', async () => {
      (api.subir as jest.Mock).mockResolvedValueOnce(ok({ imagen: { IdImagen: 7, UrlImagen: 'https://cdn/x.webp', IdFinca: 1 } }, 201));
      const r = await subirImagenFinca(1, archivo, { textoAlternativo: ' Piscina ', esPortada: true });
      expect(api.subir).toHaveBeenCalledWith('/api/finca/1/imagenes', archivo, { TextoAlternativo: 'Piscina', EsPortada: 'true' });
      expect(r.data?.IdImagen).toBe(7);
    });

    test('subirImagenFinca sin opciones no envía campos extra', async () => {
      (api.subir as jest.Mock).mockResolvedValueOnce(ok({ imagen: { IdImagen: 8 } }, 201));
      await subirImagenFinca(1, archivo);
      expect(api.subir).toHaveBeenCalledWith('/api/finca/1/imagenes', archivo, {});
    });

    test('muestra el error de la API (límite, formato, tamaño)', async () => {
      (api.subir as jest.Mock).mockResolvedValueOnce(fallo('Cada finca admite máximo 10 imágenes.', 409));
      const r = await subirImagenFinca(1, archivo);
      expect(r).toEqual({ data: null, error: 'Cada finca admite máximo 10 imágenes.' });
    });

    test('establecerPortada y eliminarImagen usan las rutas de imagen', async () => {
      (api.put as jest.Mock).mockResolvedValueOnce(ok({ imagen: { IdImagen: 3, EsPortada: true } }));
      expect((await establecerPortada(3)).data?.EsPortada).toBe(true);
      expect(api.put).toHaveBeenCalledWith('/api/imagen/3', { EsPortada: true });

      (api.delete as jest.Mock).mockResolvedValueOnce(ok({}));
      expect(await eliminarImagen(3)).toEqual({ success: true, error: null });
      expect(api.delete).toHaveBeenCalledWith('/api/imagen/3');
    });
  });
});
