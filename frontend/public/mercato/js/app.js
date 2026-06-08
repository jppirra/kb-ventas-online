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
