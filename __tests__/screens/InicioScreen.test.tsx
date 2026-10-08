import React from 'react';
import { render, screen } from '@testing-library/react-native';
import InicioScreen from '../../src/app/index';
import { filtrarFincas, FILTROS_INICIALES } from '../../src/components/SearchModal';
import { listarFincas } from '../../src/services/fincas.service';
import type { Finca } from '../../src/types';

jest.mock('../../src/services/fincas.service', () => ({ listarFincas: jest.fn() }));
jest.mock('../../src/components/AppHeader', () => ({ AppHeader: () => null }));
jest.mock('../../src/components/Footer', () => ({ Footer: () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const mk = (o: Partial<Finca>): Finca => ({
  IdFinca: 1, IdMunicipio: 1, NumeroDocumentoUsuario: 1, NombreFinca: 'Finca', Direccion: null,
  InformacionAdicional: null, Capacidad: 4, Precio: 100000, Estado: 'Disponible', Calificacion: 4,
  NombreMunicipio: 'Girardot', Imagenes: [], ...o,
});
const fincas = [
  mk({ IdFinca: 1, NombreFinca: 'Villa Esperanza', NombreMunicipio: 'Girardot', Precio: 300000, Capacidad: 10 }),
  mk({ IdFinca: 2, NombreFinca: 'Casa Café', NombreMunicipio: 'Armenia', Precio: 150000, Capacidad: 4, InformacionAdicional: 'Piscina' }),
];

describe('InicioScreen', () => {
  it('muestra el hero y el nombre de una finca', async () => {
    (listarFincas as jest.Mock).mockResolvedValue({ data: fincas, error: null });
    await render(<InicioScreen />);
    expect(screen.getByText('Encuentra y reserva fincas de recreo en toda Colombia')).toBeTruthy();
    expect((await screen.findAllByText('Villa Esperanza')).length).toBeGreaterThan(0);
  });
});

describe('filtrarFincas', () => {
  it('filtra por texto sin acentos, municipio y precio', () => {
    expect(filtrarFincas(fincas, { ...FILTROS_INICIALES, texto: 'cafe' }).map((f) => f.IdFinca)).toEqual([2]);
    expect(filtrarFincas(fincas, { ...FILTROS_INICIALES, municipio: 'Girardot' }).map((f) => f.IdFinca)).toEqual([1]);
    expect(filtrarFincas(fincas, { ...FILTROS_INICIALES, precioMax: '200000' }).map((f) => f.IdFinca)).toEqual([2]);
    expect(filtrarFincas(fincas, { ...FILTROS_INICIALES, orden: 'precio-desc' }).map((f) => f.IdFinca)).toEqual([1, 2]);
  });
});
