/**
 * 🧮 SCRIPT: Calcular Normalizaciones y Rankings de Stats
 * 
 * Ejecutar con: npx tsx scripts/calculate-stats-normalizations.ts
 * 
 * Este script calcula automáticamente:
 * - Valores normalizados (_norm) usando percentiles
 * - Rankings (_rank) para cada métrica
 * - Valores negativos invertidos (_norm_neg) para métricas negativas
 */

import { prisma } from '../src/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

type StatsPeriod = '3m' | '6m' | '1y' | '2y'

function getPrismaTableByPeriod(period: StatsPeriod) {
  const tables = {
    '3m': prisma.playerStats3m,
    '6m': prisma.playerStats6m,
    '1y': prisma.playerStats1y,
    '2y': prisma.playerStats2y,
  } as const

  return tables[period]
}

async function calculateNormalizationsForPeriod(period: StatsPeriod) {
  console.log(`\n🔄 Procesando período: ${period.toUpperCase()}`)
  
  const suffix = period
  const statsTable = getPrismaTableByPeriod(period)

  // Obtener todas las estadísticas del período
  const whereClause: Record<string, any> = {}
  whereClause[`matches_played_tot_${suffix}`] = { gt: 0 }
  
  const allStats = await statsTable.findMany({
    where: whereClause
  })

  if (allStats.length === 0) {
    console.log(`⚠️  No hay estadísticas para el período ${period}`)
    return
  }

  console.log(`📊 Encontrados ${allStats.length} jugadores con estadísticas`)

  // Campos a normalizar
  // Campos con ranking y normalización
  const fieldsToNormalize = [
    'goals_p90', 'assists_p90', 'yellow_cards_p90', 'red_cards_p90',
    'conceded_goals_p90', 'prevented_goals_p90', 'shots_against_p90',
    'tackles_p90', 'interceptions_p90', 'fouls_p90',
    'passes_p90', 'forward_passes_p90', 'crosses_p90', 'shots_p90',
    'off_duels_p90', 'def_duels_p90', 'aerials_duels_p90',
    // Porcentajes
    'clean_sheets_percent', 'save_rate_percent', 'accurate_passes_percent',
    'effectiveness_percent', 'off_duels_won_percent', 'def_duels_won_percent',
    'aerials_duels_won_percent',
    // Básicos
    'matches_played_tot', 'minutes_played_tot'
  ]
  
  // Campos solo con normalización (NO tienen ranking en el esquema)
  const fieldsOnlyNorm = [
    'goals_tot', 'assists_tot', 'yellow_cards_tot', 'red_cards_tot',
    'conceded_goals_tot', 'shots_against_tot', 'clean_sheets_tot',
    'tackles_tot', 'interceptions_tot', 'fouls_tot',
    'passes_tot', 'forward_passes_tot', 'crosses_tot', 'shots_tot',
    'off_duels_tot', 'def_duels_tot', 'aerials_duels_tot',
    'prevented_goals_tot'
  ]

  // Recolectar valores para cada campo (con y sin ranking)
  const statsForNormalization: Record<string, { values: number[], indices: number[], hasRank: boolean }> = {}
  
  // Procesar campos con ranking
  fieldsToNormalize.forEach(field => {
    const fieldWithSuffix = `${field}_${suffix}`
    const values: number[] = []
    const indices: number[] = []
    
    allStats.forEach((stat, index) => {
      const value = stat[fieldWithSuffix as keyof typeof stat]
      if (value !== null && value !== undefined) {
        const numValue = value instanceof Decimal
          ? value.toNumber() 
          : typeof value === 'object' && 'toNumber' in value 
            ? (value as any).toNumber() 
            : Number(value)
        
        if (!isNaN(numValue)) {
          values.push(numValue)
          indices.push(index)
        }
      }
    })
    
    if (values.length > 0) {
      statsForNormalization[field] = { values, indices, hasRank: true }
      console.log(`   ✓ ${field}: ${values.length} valores`)
    }
  })
  
  // Procesar campos solo con normalización
  fieldsOnlyNorm.forEach(field => {
    const fieldWithSuffix = `${field}_${suffix}`
    const values: number[] = []
    const indices: number[] = []
    
    allStats.forEach((stat, index) => {
      const value = stat[fieldWithSuffix as keyof typeof stat]
      if (value !== null && value !== undefined) {
        const numValue = value instanceof Decimal
          ? value.toNumber() 
          : typeof value === 'object' && 'toNumber' in value 
            ? (value as any).toNumber() 
            : Number(value)
        
        if (!isNaN(numValue)) {
          values.push(numValue)
          indices.push(index)
        }
      }
    })
    
    if (values.length > 0) {
      statsForNormalization[field] = { values, indices, hasRank: false }
      console.log(`   ✓ ${field} (solo norm): ${values.length} valores`)
    }
  })

  // Calcular normalizaciones y rankings
  console.log(`\n🧮 Calculando normalizaciones y rankings...`)
  const updates: Array<{ id_player: string, data: Record<string, any> }> = []

  allStats.forEach((stat) => {
    const updateData: Record<string, any> = {}

    // Procesar todos los campos (con y sin ranking)
    Object.keys(statsForNormalization).forEach(field => {
      const fieldWithSuffix = `${field}_${suffix}`
      const normField = `${field}_${suffix}_norm`
      
      const statsData = statsForNormalization[field]
      if (!statsData) return

      const value = stat[fieldWithSuffix as keyof typeof stat]
      if (value === null || value === undefined) return

      // Convertir Decimal de Prisma a number
      const numValue = value instanceof Decimal
        ? value.toNumber() 
        : typeof value === 'object' && 'toNumber' in value 
          ? (value as any).toNumber() 
          : Number(value)
      
      if (isNaN(numValue)) return
      
      const { values, hasRank } = statsData

      // Calcular normalización (0-100 usando percentil)
      const sortedValues = [...values].sort((a, b) => a - b)
      const position = sortedValues.findIndex(v => v >= numValue)
      const percentile = position >= 0 ? (position / sortedValues.length) * 100 : 100
      updateData[normField] = Math.round(percentile * 100) / 100

      // Solo calcular ranking si el campo lo tiene en el esquema
      if (hasRank) {
        // Algunos rankings NO tienen sufijo de período (son globales)
        const fieldsWithoutPeriodSuffix = ['yellow_cards_p90', 'red_cards_p90', 'prevented_goals_p90']
        const rankField = fieldsWithoutPeriodSuffix.includes(field)
          ? `${field}_rank`
          : `${field}_${suffix}_rank`
        
        // Calcular ranking (1 = mejor)
        const descendingValues = [...values].sort((a, b) => b - a)
        const rank = descendingValues.findIndex(v => v <= numValue) + 1
        
        // Para campos "negativos" (tarjetas, faltas, goles concedidos), invertir el ranking
        const negativeFields = ['yellow_cards', 'red_cards', 'fouls', 'conceded_goals']
        const isNegative = negativeFields.some(nf => field.startsWith(nf))
        
        if (isNegative) {
          updateData[rankField] = values.length - rank + 1
          // Calcular también la normalización negativa
          const normNegField = `${field}_${suffix}_norm_neg`
          updateData[normNegField] = Math.round((100 - percentile) * 100) / 100
        } else {
          updateData[rankField] = rank
        }
      }
    })

    if (Object.keys(updateData).length > 0) {
      updates.push({
        id_player: stat.id_player,
        data: updateData
      })
    }
  })

  // Aplicar actualizaciones
  console.log(`\n💾 Guardando ${updates.length} actualizaciones...`)
  
  let processed = 0
  for (const update of updates) {
    await statsTable.update({
      where: { id_player: update.id_player },
      data: update.data
    })
    processed++
    
    if (processed % 10 === 0) {
      process.stdout.write(`\r   Progreso: ${processed}/${updates.length}`)
    }
  }
  
  console.log(`\n✅ Período ${period.toUpperCase()} completado: ${updates.length} jugadores actualizados`)
}

async function main() {
  console.log('🚀 Iniciando cálculo de normalizaciones y rankings...\n')
  
  const periods: StatsPeriod[] = ['3m', '6m', '1y', '2y']
  
  for (const period of periods) {
    try {
      await calculateNormalizationsForPeriod(period)
    } catch (error) {
      console.error(`❌ Error en período ${period}:`, error)
    }
  }
  
  console.log('\n✅ ¡Proceso completado!')
  console.log('\n📊 Verificación:')
  
  // Mostrar una muestra
  const sample = await prisma.playerStats3m.findFirst({
    where: { goals_p90_3m: { not: null } },
    select: {
      id_player: true,
      goals_p90_3m: true,
      goals_tot_3m: true,
      goals_p90_3m_norm: true,
      goals_p90_3m_rank: true,
      minutes_played_tot_3m: true
    }
  })
  
  console.log('\nEjemplo de stats calculadas:')
  console.log(JSON.stringify(sample, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

