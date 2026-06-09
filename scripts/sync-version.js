#!/usr/bin/env node
// Lee la versión del README.md y la sincroniza con frontend/package.json y backend/application.properties
// Uso: node scripts/sync-version.js

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const readmePath = path.join(root, 'README.md')
const packagePath = path.join(root, 'frontend', 'package.json')
const propsPath = path.join(root, 'backend', 'src', 'main', 'resources', 'application.properties')

const readme = fs.readFileSync(readmePath, 'utf8')
const match = readme.match(/\*\*v([\d.]+)\*\*/)
if (!match) {
  console.error('Version no encontrada en README.md. Formato esperado: **v1.000.08**')
  process.exit(1)
}

const version = match[1]

// Sync frontend/package.json
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const prevPkg = pkg.version
pkg.version = version
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n')
console.log(`frontend/package.json: ${prevPkg} → ${version}`)

// Sync backend/application.properties
const props = fs.readFileSync(propsPath, 'utf8')
const prevProps = (props.match(/^app\.version=(.+)$/m) || [])[1] || 'no encontrado'
const updatedProps = props.replace(/^app\.version=.+$/m, `app.version=${version}`)
fs.writeFileSync(propsPath, updatedProps)
console.log(`backend/application.properties: ${prevProps} → ${version}`)
