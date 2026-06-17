export const RUBROS = [
  {
    value: 'ropa',
    label: 'Ropa',
    atributo: 'Talle',
    opcionesDefault: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    value: 'calzado',
    label: 'Calzado',
    atributo: 'Número',
    opcionesDefault: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  },
  {
    value: 'accesorios',
    label: 'Accesorios',
    atributo: null,
    opcionesDefault: [],
  },
  {
    value: 'alimentos',
    label: 'Alimentos',
    atributo: 'Presentación',
    opcionesDefault: [],
  },
  {
    value: 'bebidas',
    label: 'Bebidas',
    atributo: 'Volumen',
    opcionesDefault: [],
  },
  {
    value: 'hogar_cocina',
    label: 'Hogar y Cocina',
    atributo: 'Medida',
    opcionesDefault: [],
  },
  {
    value: 'electronica',
    label: 'Electrónica',
    atributo: 'Variante',
    opcionesDefault: [],
  },
  {
    value: 'belleza',
    label: 'Belleza',
    atributo: 'Variante',
    opcionesDefault: [],
  },
  {
    value: 'deportes',
    label: 'Deportes',
    atributo: 'Talle',
    opcionesDefault: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    value: 'mascotas',
    label: 'Mascotas',
    atributo: 'Tamaño',
    opcionesDefault: [],
  },
]

export function getRubro(value) {
  return RUBROS.find(r => r.value === value) || null
}
