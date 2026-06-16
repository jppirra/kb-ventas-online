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
