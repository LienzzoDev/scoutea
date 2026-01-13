/**
 * Script: Calcular Normalizaciones de Competiciones
 *
 * Ejecutar con: npx tsx scripts/calculate-competition-normalizations.ts
 *
 * Este script calcula automaticamente:
 * - competition_trfm_value_norm (normalizacion del valor de mercado)
 * - competition_rating_norm (normalizacion del rating)
 *
 * Las normalizaciones se calculan usando percentiles (0-1) donde:
 * - 0 = el valor mas bajo
 * - 1 = el valor mas alto
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
    sourceField: 'competition_trfm_value',
    targetField: 'competition_trfm_value_norm',
    label: 'Valor de Mercado (TM)'
  },
  {
    sourceField: 'competition_rating',
    targetField: 'competition_rating_norm',
    label: 'Rating'
  }
]

async function calculateNormalizations() {
  console.log('Iniciando calculo de normalizaciones de competiciones...\n')

  for (const field of FIELDS_TO_NORMALIZE) {
    console.log(`\nProcesando: ${field.label}`)
    console.log(`   Fuente: ${field.sourceField} -> Destino: ${field.targetField}`)

    // Obtener todas las competiciones con valores no nulos para el campo
    const competitions = await prisma.competition.findMany({
      select: {
        id_competition: true,
        [field.sourceField]: true
      },
      where: {
        [field.sourceField]: { not: null }
      }
    })

    if (competitions.length === 0) {
      console.log(`   No hay valores para ${field.sourceField}`)
      continue
    }

    console.log(`   Encontradas ${competitions.length} competiciones con ${field.sourceField}`)

    // Extraer valores y ordenarlos
    const values = competitions
      .map(c => (c as Record<string, unknown>)[field.sourceField] as number)
      .filter(v => v !== null && v !== undefined && !isNaN(v))
      .sort((a, b) => a - b)

    if (values.length === 0) {
      console.log(`   No hay valores validos para ${field.sourceField}`)
      continue
    }

    const minValue = values[0]!
    const maxValue = values[values.length - 1]!

    console.log(`   Rango: ${minValue} - ${maxValue}`)

    // Calcular normalizacion para cada competicion
    let updatedCount = 0
    const batchSize = 50

    for (let i = 0; i < competitions.length; i += batchSize) {
      const batch = competitions.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (competition) => {
          const value = (competition as Record<string, unknown>)[field.sourceField] as number
          if (value === null || value === undefined || isNaN(value)) return

          // Calcular percentil (posicion relativa en la distribucion)
          const position = values.filter(v => v <= value).length
          const percentile = position / values.length

          // Redondear a 4 decimales
          const normalizedValue = Math.round(percentile * 10000) / 10000

          await prisma.competition.update({
            where: { id_competition: competition.id_competition },
            data: {
              [field.targetField]: normalizedValue
            }
          })

          updatedCount++
        })
      )

      // Mostrar progreso
      const progress = Math.min(i + batchSize, competitions.length)
      process.stdout.write(`\r   Progreso: ${progress}/${competitions.length} competiciones`)
    }

    console.log(`\n   ${field.label}: ${updatedCount} competiciones normalizadas`)
  }

  // Mostrar estadisticas finales
  console.log('\n\nVerificacion de resultados:')

  for (const field of FIELDS_TO_NORMALIZE) {
    const stats = await prisma.competition.aggregate({
      _count: { [field.targetField]: true },
      _min: { [field.targetField]: true },
      _max: { [field.targetField]: true },
      _avg: { [field.targetField]: true }
    })

    console.log(`\n${field.label} (${field.targetField}):`)
    console.log(`   Registros: ${(stats._count as Record<string, number>)[field.targetField]}`)
    console.log(`   Min: ${(stats._min as Record<string, number | null>)[field.targetField]?.toFixed(4) ?? 'N/A'}`)
    console.log(`   Max: ${(stats._max as Record<string, number | null>)[field.targetField]?.toFixed(4) ?? 'N/A'}`)
    console.log(`   Promedio: ${(stats._avg as Record<string, number | null>)[field.targetField]?.toFixed(4) ?? 'N/A'}`)
  }

  // Mostrar algunos ejemplos
  console.log('\nEjemplos de normalizacion:')

  const examples = await prisma.competition.findMany({
    select: {
      competition_name: true,
      name: true,
      competition_trfm_value: true,
      competition_trfm_value_norm: true,
      competition_rating: true,
      competition_rating_norm: true
    },
    where: {
      OR: [
        { competition_trfm_value: { not: null } },
        { competition_rating: { not: null } }
      ]
    },
    orderBy: { competition_trfm_value: 'desc' },
    take: 10
  })

  console.log('\nTop 10 por valor de mercado:')
  examples.forEach((c, i) => {
    const name = c.competition_name || c.name || 'Sin nombre'
    console.log(`   ${i + 1}. ${name}: Valor=${c.competition_trfm_value ?? 'N/A'} (norm: ${c.competition_trfm_value_norm?.toFixed(4) ?? 'N/A'}) | Rating=${c.competition_rating ?? 'N/A'} (norm: ${c.competition_rating_norm?.toFixed(4) ?? 'N/A'})`)
  })
}

async function main() {
  try {
    await calculateNormalizations()
    console.log('\nProceso completado exitosamente!')
  } catch (error) {
    console.error('\nError:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
