#!/usr/bin/env tsx
/**
 * Script para migrar console.logs a sistema de logging centralizado
 *
 * Este script:
 * 1. Busca console.log/error/warn/debug en archivos API
 * 2. Los reemplaza por logger.info/error/warn/debug
 * 3. Agrega imports del logger si no existen
 */

import { readFileSync, writeFileSync } from 'fs'
import { glob } from 'glob'
import path from 'path'

const logger = {
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  warn: (msg: string) => console.warn(`⚠️  ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  success: (msg: string) => console.log(`✅ ${msg}`)
}

async function migrateConsoleLogs() {
  logger.info('Iniciando migración de console.logs...')

  // Buscar archivos API
  const files = await glob('src/app/api/**/route.ts', {
    ignore: ['**/node_modules/**', '**/debug/**']
  })

  logger.info(`Encontrados ${files.length} archivos API`)

  let totalReplacements = 0
  let filesModified = 0

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')
      let newContent = content
      let fileChanged = false

      // Contar console.logs en este archivo
      const consoleMatches = content.match(/console\.(log|error|warn|debug)/g)
      if (!consoleMatches || consoleMatches.length === 0) {
        continue
      }

      // Verificar si ya tiene logger importado
      const hasLoggerImport = content.includes("from '@/lib/logging/production-logger'") ||
                             content.includes("from '@/lib/logging/logger'")

      // Agregar import si no existe
      if (!hasLoggerImport) {
        // Buscar última línea de imports
        const importRegex = /^import .+ from .+$/gm
        const imports = content.match(importRegex)
        if (imports && imports.length > 0) {
          const lastImport = imports[imports.length - 1]
          const lastImportIndex = content.indexOf(lastImport) + lastImport.length
          newContent = content.slice(0, lastImportIndex) +
                      "\nimport { logger } from '@/lib/logging/production-logger'" +
                      content.slice(lastImportIndex)
          fileChanged = true
        }
      }

      // Reemplazar console.logs (mantener la estructura original)
      const replacements = [
        { from: /console\.error\(/g, to: 'logger.error(' },
        { from: /console\.warn\(/g, to: 'logger.warn(' },
        { from: /console\.log\(/g, to: 'logger.info(' },
        { from: /console\.debug\(/g, to: 'logger.debug(' }
      ]

      for (const { from, to } of replacements) {
        const matches = newContent.match(from)
        if (matches) {
          newContent = newContent.replace(from, to)
          totalReplacements += matches.length
          fileChanged = true
        }
      }

      if (fileChanged) {
        writeFileSync(file, newContent, 'utf-8')
        filesModified++
        logger.success(`Actualizado: ${path.relative(process.cwd(), file)} (${consoleMatches.length} reemplazos)`)
      }

    } catch (error) {
      logger.error(`Error procesando ${file}: ${error}`)
    }
  }

  logger.success(`\n✨ Migración completa!`)
  logger.info(`   Archivos modificados: ${filesModified}`)
  logger.info(`   Total reemplazos: ${totalReplacements}`)
}

migrateConsoleLogs().catch(error => {
  logger.error(`Error fatal: ${error}`)
  process.exit(1)
})
