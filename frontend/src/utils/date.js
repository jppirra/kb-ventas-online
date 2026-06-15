function toUtc(dt) {
  if (!dt) return null
  const s = String(dt)
  // Si ya tiene zona horaria (Z, +, -offset al final) no modificar
  if (s.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s)
  // Sin zona: el backend guarda en UTC, agregar Z para que el navegador convierta correctamente
  return new Date(s + 'Z')
}

export function fmtDate(dt, opts = { dateStyle: 'short', timeStyle: 'short' }) {
  if (!dt) return ''
  return toUtc(dt).toLocaleString('es-AR', opts)
}

export function fmtDateOnly(dt) {
  if (!dt) return ''
  return toUtc(dt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function fmtDateTime(dt) {
  return fmtDate(dt, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function fmtDateLong(dt) {
  return fmtDate(dt, { dateStyle: 'long', timeStyle: 'short' })
}
