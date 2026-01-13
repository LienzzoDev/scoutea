/**
 * Script: Calcular Normalizaciones de Jugadores
 *
 * Ejecutar con: npx tsx scripts/calculate-player-normalizations.ts
 *
 * Este script calcula automáticamente:
 * - player_trfm_value_norm (normalización del valor de mercado)
 * - player_rating_norm (normalización del rating)
 *
 * Las normalizaciones se calculan usando percentiles (0-1) donde:
 * - 0 = el valor más bajo
 * - 1 = el valor más alto
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface NormalizationField {
  sourceField: string
  targetField: string
  label: string
}

const FIELDS_TO_NORMALIZE: NormalizationField[] = [
  {
    sourceField: 'player_trfm_value',
    targetField: 'player_trfm_value_norm',
    label: 'Valor de Mercado (TM)'
  },
  {
    sourceField: 'player_rating',
    targetField: 'player_rating_norm',
    label: 'Rating'
  }
]

async function calculateNormalizations() {
  console.log('🚀 Iniciando cálculo de normalizaciones de jugadores...\n')

  for (const field of FIELDS_TO_NORMALIZE) {
    console.log(`\n📊 Procesando: ${field.label}`)
    console.log(`   Fuente: ${field.sourceField} → Destino: ${field.targetField}`)

    // Obtener todos los valores no nulos para el campo
    const players = await prisma.jugador.findMany({
      select: {
        id_player: true,
        [field.sourceField]: true
      },
      where: {
        [field.sourceField]: { not: null }
      }
    })

    if (players.length === 0) {
      console.log(`   ⚠️ No hay valores para ${field.sourceField}`)
      continue
    }

    console.log(`   ✓ Encontrados ${players.length} jugadores con ${field.sourceField}`)

    // Extraer valores y ordenarlos
    const values = players
      .map(p => (p as any)[field.sourceField] as number)
      .filter(v => v !== null && v !== undefined && !isNaN(v))
      .sort((a, b) => a - b)

    if (values.length === 0) {
      console.log(`   ⚠️ No hay valores válidos para ${field.sourceField}`)
      continue
    }

    const minValue = values[0]!
    const maxValue = values[values.length - 1]!

    console.log(`   📈 Rango: ${minValue} - ${maxValue}`)

    // Calcular normalización para cada jugador
    let updatedCount = 0
    const batchSize = 50

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (player) => {
          const value = (player as any)[field.sourceField] as number
          if (value === null || value === undefined || isNaN(value)) return

          // Calcular percentil (posición relativa en la distribución)
          const position = values.filter(v => v <= value).length
          const percentile = position / values.length

          // Redondear a 4 decimales
          const normalizedValue = Math.round(percentile * 10000) / 10000

          await prisma.jugador.update({
            where: { id_player: player.id_player },
            data: {
              [field.targetField]: normalizedValue
            }
          })

          updatedCount++
        })
      )

      // Mostrar progreso
      const progress = Math.min(i + batchSize, players.length)
      process.stdout.write(`\r   Progreso: ${progress}/${players.length} jugadores`)
    }

    console.log(`\n   ✅ ${field.label}: ${updatedCount} jugadores normalizados`)
  }

  // Mostrar estadísticas finales
  console.log('\n\n📊 Verificación de resultados:')

  for (const field of FIELDS_TO_NORMALIZE) {
    const stats = await prisma.jugador.aggregate({
      _count: { [field.targetField]: true },
      _min: { [field.targetField]: true },
      _max: { [field.targetField]: true },
      _avg: { [field.targetField]: true }
    })

    console.log(`\n${field.label} (${field.targetField}):`)
    console.log(`   Registros: ${(stats._count as any)[field.targetField]}`)
    console.log(`   Min: ${(stats._min as any)[field.targetField]?.toFixed(4) ?? 'N/A'}`)
    console.log(`   Max: ${(stats._max as any)[field.targetField]?.toFixed(4) ?? 'N/A'}`)
    console.log(`   Promedio: ${(stats._avg as any)[field.targetField]?.toFixed(4) ?? 'N/A'}`)
  }

  // Mostrar algunos ejemplos
  console.log('\n📋 Ejemplos de normalización:')

  const examples = await prisma.jugador.findMany({
    select: {
      player_name: true,
      player_trfm_value: true,
      player_trfm_value_norm: true,
      player_rating: true,
      player_rating_norm: true
    },
    where: {
      player_trfm_value: { not: null },
      player_rating: { not: null }
    },
    orderBy: { player_trfm_value: 'desc' },
    take: 5
  })

  console.log('\nTop 5 por valor de mercado:')
  examples.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.player_name}: €${p.player_trfm_value}M (norm: ${p.player_trfm_value_norm?.toFixed(4)}) | Rating: ${p.player_rating} (norm: ${p.player_rating_norm?.toFixed(4)})`)
  })

  const bottomExamples = await prisma.jugador.findMany({
    select: {
      player_name: true,
      player_trfm_value: true,
      player_trfm_value_norm: true,
      player_rating: true,
      player_rating_norm: true
    },
    where: {
      player_trfm_value: { not: null },
      player_rating: { not: null }
    },
    orderBy: { player_trfm_value: 'asc' },
    take: 5
  })

  console.log('\nBottom 5 por valor de mercado:')
  bottomExamples.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.player_name}: €${p.player_trfm_value}M (norm: ${p.player_trfm_value_norm?.toFixed(4)}) | Rating: ${p.player_rating} (norm: ${p.player_rating_norm?.toFixed(4)})`)
  })
}

async function main() {
  try {
    await calculateNormalizations()
    console.log('\n✅ ¡Proceso completado exitosamente!')
  } catch (error) {
    console.error('\n❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
