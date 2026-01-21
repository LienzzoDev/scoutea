import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script para poblar datos de valor de mercado en reportes y jugadores existentes
 *
 * La gráfica de "Value" en /scout/players/[id] necesita:
 * 1. initial_player_trfm_value en el Reporte → Valor de mercado del jugador CUANDO se hizo el reporte
 * 2. player_trfm_value en el Jugador → Valor de mercado ACTUAL del jugador
 */
async function populateValueData() {
  try {
    console.log('🌱 Iniciando población de datos de valor de mercado...\n')

    // 1. Obtener TODOS los reportes con sus jugadores
    const allReports = await prisma.reporte.findMany({
      where: {
        id_player: { not: null }
      },
      include: {
        player: true,
        scout: true
      }
    })

    console.log(`📊 Total de reportes encontrados: ${allReports.length}\n`)

    if (allReports.length === 0) {
      console.log('⚠️  No hay reportes en la base de datos.')
      return
    }

    // Agrupar por scout para mostrar información
    const reportsByScout = new Map<string, typeof allReports>()
    for (const report of allReports) {
      const scoutName = report.scout?.scout_name || 'Sin scout'
      if (!reportsByScout.has(scoutName)) {
        reportsByScout.set(scoutName, [])
      }
      reportsByScout.get(scoutName)!.push(report)
    }

    console.log('📋 Reportes por scout:')
    for (const [scoutName, reports] of reportsByScout) {
      console.log(`   - ${scoutName}: ${reports.length} reportes`)
    }
    console.log()

    // 2. Función para generar valor de mercado realista basado en edad y posición
    function generateMarketValue(age: number | null, position: string | null): number {
      const baseValues: Record<string, { min: number; max: number }> = {
        'GK': { min: 1000000, max: 15000000 },
        'CB': { min: 2000000, max: 40000000 },
        'RB': { min: 1500000, max: 30000000 },
        'LB': { min: 1500000, max: 30000000 },
        'Right-Back': { min: 1500000, max: 30000000 },
        'Left-Back': { min: 1500000, max: 30000000 },
        'Sweeper': { min: 2000000, max: 35000000 },
        'DM': { min: 2000000, max: 50000000 },
        'CM': { min: 2500000, max: 60000000 },
        'AM': { min: 3000000, max: 70000000 },
        'CAM': { min: 3000000, max: 70000000 },
        'RM': { min: 2000000, max: 50000000 },
        'LM': { min: 2000000, max: 50000000 },
        'RW': { min: 3000000, max: 80000000 },
        'LW': { min: 3000000, max: 80000000 },
        'ST': { min: 3000000, max: 100000000 },
        'CF': { min: 3000000, max: 90000000 },
      }

      const posKey = position || 'CM'
      const range = baseValues[posKey] || { min: 2000000, max: 40000000 }

      // Ajustar por edad
      let ageFactor = 1.0
      const playerAge = age || 24
      if (playerAge < 20) ageFactor = 0.4 + (playerAge - 17) * 0.1
      else if (playerAge < 24) ageFactor = 0.7 + (playerAge - 20) * 0.075
      else if (playerAge < 28) ageFactor = 1.0
      else if (playerAge < 32) ageFactor = 1.0 - (playerAge - 28) * 0.15
      else ageFactor = 0.3

      const value = range.min + Math.random() * (range.max - range.min) * ageFactor
      return Math.round(value / 100000) * 100000 // Redondear a 100K
    }

    // 3. Actualizar jugadores sin valor de mercado
    const playersWithoutValue = await prisma.jugador.findMany({
      where: {
        player_trfm_value: null
      }
    })

    if (playersWithoutValue.length > 0) {
      console.log(`⚽ Actualizando ${playersWithoutValue.length} jugadores sin valor de mercado...\n`)

      for (const player of playersWithoutValue) {
        const currentValue = generateMarketValue(player.age, player.position_player)

        await prisma.jugador.update({
          where: { id_player: player.id_player },
          data: {
            player_trfm_value: currentValue,
            trfm_value_last_updated: new Date(),
          }
        })

        const valueM = (currentValue / 1000000).toFixed(1)
        console.log(`   ✅ ${player.player_name} → €${valueM}M (${player.position_player || 'N/A'}, ${player.age || '?'} años)`)
      }
      console.log()
    }

    // 4. Actualizar reportes con valor inicial de mercado
    let updatedReports = 0
    console.log('📝 Actualizando reportes con valor inicial de mercado...\n')

    for (const report of allReports) {
      if (!report.player) continue

      // Obtener el valor actual del jugador (puede haber sido actualizado arriba)
      const currentPlayer = await prisma.jugador.findUnique({
        where: { id_player: report.player.id_player }
      })

      if (!currentPlayer) continue

      // Si el jugador no tiene valor actual, asignar uno
      let currentValue = currentPlayer.player_trfm_value
      if (!currentValue) {
        currentValue = generateMarketValue(currentPlayer.age, currentPlayer.position_player)
        await prisma.jugador.update({
          where: { id_player: currentPlayer.id_player },
          data: {
            player_trfm_value: currentValue,
            trfm_value_last_updated: new Date(),
          }
        })
      }

      // Calcular valor inicial (el valor de mercado cuando se hizo el reporte)
      // Simulamos que el jugador ha aumentado su valor desde entonces (entre 10% y 50%)
      const growthPercent = 10 + Math.random() * 40 // 10-50% de crecimiento
      const initialValue = Math.round(currentValue / (1 + growthPercent / 100))

      // Asegurar que hay fecha de reporte
      let reportDate = report.report_date
      if (!reportDate) {
        // Generar fecha entre 3 y 12 meses atrás
        const monthsAgo = 3 + Math.floor(Math.random() * 9)
        reportDate = new Date()
        reportDate.setMonth(reportDate.getMonth() - monthsAgo)
      }

      // Actualizar el reporte
      await prisma.reporte.update({
        where: { id_report: report.id_report },
        data: {
          initial_player_trfm_value: initialValue,
          report_date: reportDate,
        }
      })

      const initialM = (initialValue / 1000000).toFixed(1)
      const currentM = (currentValue / 1000000).toFixed(1)
      const growth = (((currentValue - initialValue) / initialValue) * 100).toFixed(0)
      console.log(`   ✅ ${currentPlayer.player_name}: €${initialM}M → €${currentM}M (+${growth}%)`)

      updatedReports++
    }

    // 5. Resumen final
    const finalStats = await prisma.reporte.count({
      where: { initial_player_trfm_value: { not: null } }
    })

    const playersWithValue = await prisma.jugador.count({
      where: { player_trfm_value: { not: null } }
    })

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Población de datos completada!')
    console.log('='.repeat(60))
    console.log(`\n📊 Resumen:`)
    console.log(`   - Reportes actualizados: ${updatedReports}`)
    console.log(`   - Total reportes con valor inicial: ${finalStats}`)
    console.log(`   - Jugadores con valor de mercado: ${playersWithValue}`)

    console.log('\n💡 Ahora puedes:')
    console.log('   1. Ir a /scout/players/ y seleccionar un jugador')
    console.log('   2. Hacer clic en la tab "Value"')
    console.log('   3. Ver la gráfica mostrando:')
    console.log('      - Valor inicial de mercado (cuando se hizo el reporte)')
    console.log('      - Valor actual de mercado del jugador')

  } catch (error) {
    console.error('❌ Error poblando datos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
populateValueData()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })
