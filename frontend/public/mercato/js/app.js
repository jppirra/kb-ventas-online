const btn = document.getElementById('theme-toggle')
const saved = localStorage.getItem('theme')

if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.body.classList.add('dark')
  btn.textContent = '☀️'
}

btn.addEventListener('click', () => {
  document.body.classList.toggle('dark')
  const isDark = document.body.classList.contains('dark')
  btn.textContent = isDark ? '☀️' : '🌙'
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
})

document.getElementById('year').textContent = new Date().getFullYear()

// Tracking de visitas a la landing page
;(function () {
  function ua(pattern) { return pattern.test(navigator.userAgent) }
  const uaStr = navigator.userAgent
  let browser = 'Unknown', browserVersion = null
  if (uaStr.includes('CriOS/'))        { browser = 'Chrome';  browserVersion = (uaStr.match(/CriOS\/([\d.]+)/) || [])[1] }
  else if (uaStr.includes('FxiOS/'))   { browser = 'Firefox'; browserVersion = (uaStr.match(/FxiOS\/([\d.]+)/) || [])[1] }
  else if (uaStr.includes('Edg/'))     { browser = 'Edge';    browserVersion = (uaStr.match(/Edg\/([\d.]+)/) || [])[1] }
  else if (uaStr.includes('OPR/'))     { browser = 'Opera';   browserVersion = (uaStr.match(/OPR\/([\d.]+)/) || [])[1] }
  else if (uaStr.includes('Firefox/')) { browser = 'Firefox'; browserVersion = (uaStr.match(/Firefox\/([\d.]+)/) || [])[1] }
  else if (uaStr.includes('Chrome/'))  { browser = 'Chrome';  browserVersion = (uaStr.match(/Chrome\/([\d.]+)/) || [])[1] }
  else if (uaStr.includes('Safari/') && uaStr.includes('Version/')) { browser = 'Safari'; browserVersion = (uaStr.match(/Version\/([\d.]+)/) || [])[1] }

  const os = uaStr.includes('Android') ? 'Android'
    : /iPhone|iPad|iPod/.test(uaStr) ? 'iOS'
    : uaStr.includes('Windows NT') ? 'Windows'
    : uaStr.includes('Mac OS X') ? 'macOS'
    : uaStr.includes('Linux') ? 'Linux' : 'Unknown'

  const deviceType = /iPhone|iPod|Android.*Mobile|Mobi/.test(uaStr) ? 'MOBILE'
    : /iPad|Android(?!.*Mobile)/.test(uaStr) ? 'TABLET' : 'DESKTOP'

  let sid = sessionStorage.getItem('_sid')
  if (!sid) { sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('_sid', sid) }

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token

  fetch('/api/app/events', {
    method: 'POST',
    headers,
    body: JSON.stringify({ eventType: 'PAGE_VIEW', page: '/mercato/', sessionId: sid, browser, browserVersion, os, deviceType }),
  }).catch(() => {})
})()

// Si el usuario ya tiene sesión, reemplazar botones de auth por "Ir a la app"
if (localStorage.getItem('token')) {
  const actions = document.querySelector('.actions')
  if (actions) {
    const outlineBtn = actions.querySelector('.btn-outline')
    const primaryBtn = actions.querySelector('.btn-primary')
    if (outlineBtn) outlineBtn.remove()
    if (primaryBtn) {
      primaryBtn.textContent = 'Ir a la app'
      primaryBtn.href = '/dashboard'
    }
  }

  const footerLinks = document.querySelector('.footer-links')
  if (footerLinks) {
    footerLinks.innerHTML = '<a href="/dashboard">Ir a la app</a>'
  }
}
