import api from '../api/axios'

let _sessionId = sessionStorage.getItem('_sid')
if (!_sessionId) {
  _sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
  sessionStorage.setItem('_sid', _sessionId)
}

function detectBrowser() {
  const ua = navigator.userAgent
  if (ua.includes('CriOS/'))   return { browser: 'Chrome',  browserVersion: (ua.match(/CriOS\/([\d.]+)/) || [])[1] }
  if (ua.includes('FxiOS/'))   return { browser: 'Firefox', browserVersion: (ua.match(/FxiOS\/([\d.]+)/) || [])[1] }
  if (ua.includes('EdgiOS/'))  return { browser: 'Edge',    browserVersion: (ua.match(/EdgiOS\/([\d.]+)/) || [])[1] }
  if (ua.includes('Edg/'))     return { browser: 'Edge',    browserVersion: (ua.match(/Edg\/([\d.]+)/) || [])[1] }
  if (ua.includes('OPR/'))     return { browser: 'Opera',   browserVersion: (ua.match(/OPR\/([\d.]+)/) || [])[1] }
  if (ua.includes('Firefox/')) return { browser: 'Firefox', browserVersion: (ua.match(/Firefox\/([\d.]+)/) || [])[1] }
  if (ua.includes('Chrome/'))  return { browser: 'Chrome',  browserVersion: (ua.match(/Chrome\/([\d.]+)/) || [])[1] }
  if (ua.includes('Safari/') && ua.includes('Version/'))
                               return { browser: 'Safari',  browserVersion: (ua.match(/Version\/([\d.]+)/) || [])[1] }
  return { browser: 'Unknown', browserVersion: null }
}

function detectOS() {
  const ua = navigator.userAgent
  if (ua.includes('Android'))          return 'Android'
  if (/iPhone|iPad|iPod/.test(ua))     return 'iOS'
  if (ua.includes('Windows NT'))       return 'Windows'
  if (ua.includes('Mac OS X'))         return 'macOS'
  if (ua.includes('Linux'))            return 'Linux'
  return 'Unknown'
}

function detectDevice() {
  const ua = navigator.userAgent
  if (/iPhone|iPod/.test(ua) || /Android.*Mobile/.test(ua) || /Mobi/.test(ua)) return 'MOBILE'
  if (/iPad/.test(ua) || /Android(?!.*Mobile)/.test(ua))                        return 'TABLET'
  return 'DESKTOP'
}

let { browser, browserVersion } = detectBrowser()
const os = detectOS()
const deviceType = detectDevice()

if (typeof navigator.brave !== 'undefined') browser = 'Brave'

export function track(eventType, extra = {}) {
  const payload = {
    eventType,
    page: window.location.pathname,
    sessionId: _sessionId,
    browser,
    browserVersion,
    os,
    deviceType,
    ...extra,
  }
  api.post('/app/events', payload).catch(() => {})
}
