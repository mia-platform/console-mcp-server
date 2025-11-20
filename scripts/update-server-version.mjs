#!/usr/bin/env node

// This script updates the version in server.json to match package.json
// It runs automatically via the npm "version" lifecycle hook
// (checkout the package.json "version" script)

import { fileURLToPath } from 'url'

import { dirname, join } from 'path'
import { readFileSync, writeFileSync } from 'fs'

import process from 'process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJsonPath = join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const newVersion = packageJson.version

const serverJsonPath = join(__dirname, '..', 'server.json')
const serverJson = JSON.parse(readFileSync(serverJsonPath, 'utf8'))

serverJson.version = newVersion
if (serverJson.packages && Array.isArray(serverJson.packages)) {
  serverJson.packages.forEach((pkg) => {
    if (pkg.identifier === '@mia-platform/console-mcp-server') {
      pkg.version = newVersion
    }
  })
}

writeFileSync(serverJsonPath, JSON.stringify(serverJson, null, 2) + '\n', 'utf8')

process.stdout.write(`Updated server.json version to ${newVersion}\n`)
