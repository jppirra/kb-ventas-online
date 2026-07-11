export const COUNTRIES = [
  { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'MX', name: 'México', dial: '+52' },
  { code: 'BR', name: 'Brasil', dial: '+55' },
  { code: 'CL', name: 'Chile', dial: '+56' },
  { code: 'CO', name: 'Colombia', dial: '+57' },
  { code: 'PE', name: 'Perú', dial: '+51' },
  { code: 'UY', name: 'Uruguay', dial: '+598' },
  { code: 'PY', name: 'Paraguay', dial: '+595' },
  { code: 'BO', name: 'Bolivia', dial: '+591' },
  { code: 'EC', name: 'Ecuador', dial: '+593' },
  { code: 'VE', name: 'Venezuela', dial: '+58' },
  { code: 'ES', name: 'España', dial: '+34' },
]

export function countryName(code) {
  return COUNTRIES.find(c => c.code === code)?.name ?? code
}

export function flagEmoji(code) {
  if (!code) return '🌐'
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('')
}
