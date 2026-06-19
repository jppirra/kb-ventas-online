const BACKEND = 'https://catalogia-backend.onrender.com/api'

const BOT_UA = /WhatsApp|facebookexternalhit|Twitterbot|Discordbot|Slackbot|TelegramBot|LinkedInBot|bot|crawl|spider/i

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default async function middleware(req) {
  const url = new URL(req.url)
  const match = url.pathname.match(/^\/c\/([^/]+)/)
  if (!match) return

  const ua = req.headers.get('user-agent') || ''
  if (!BOT_UA.test(ua)) return

  const catalogId = match[1]
  try {
    const res = await fetch(`${BACKEND}/public/catalog/${catalogId}`)
    if (!res.ok) return

    const d = await res.json()
    if (!d.available || !d.catalog) return

    const name = d.catalog.name || 'Catálogo'
    const vendorName = d.vendorName || ''
    const title = `${name} — Mercato`
    const image = d.catalog.coverImageUrl || d.vendorProfileImageUrl || 'https://mercato.jafpsoft.com/og-image.jpg'
    const description = esc(d.catalog.description || d.catalog.aiContent || `Catálogo de ${vendorName} en Mercato`)

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${esc(url.toString())}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Mercato" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:image" content="${esc(image)}" />
</head>
<body></body>
</html>`

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch {
    return
  }
}

export const config = {
  matcher: '/c/:path*'
}
