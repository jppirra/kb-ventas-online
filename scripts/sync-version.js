#!/usr/bin/env node
// Lee la versión del README.md y la sincroniza con frontend/package.json
// Uso: node scripts/sync-version.js

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const readmePath = path.join(root, 'README.md')
const packagePath = path.join(root, 'frontend', 'package.json')

const readme = fs.readFileSync(readmePath, 'utf8')
const match = readme.match(/\*\*v([\d.]+)\*\*/)
if (!match) {
  console.error('Version no encontrada en README.md. Formato esperado: **v1.000.08**')
  process.exit(1)
}

const version = match[1]
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const prev = pkg.version
pkg.version = version
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n')

console.log(`Version sincronizada: ${prev} → ${version}`)
console.log(`Actualizado: frontend/package.json`)
