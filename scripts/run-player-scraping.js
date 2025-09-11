const { PrismaClient } = require('@prisma/client')
const { scrapePlayerData } = require('./scrape-player-data')

const prisma = new PrismaClient()

// Configuración
const BATCH_SIZE = 10 // Procesar 10 jugadores por lote
const DELAY_BETWEEN_BATCHES = 30000 // 30 segundos entre lotes
const DELAY_BETWEEN_PLAYERS = 3000 // 3 segundos entre jugadores

async function runPlayerScraping() {
  try {
    console.log('🚀 Iniciando scraping de datos de jugadores...')
    console.log(`📊 Configuración: ${BATCH_SIZE} jugadores por lote`)
    console.log(`⏱️ Pausa entre lotes: ${DELAY_BETWEEN_BATCHES / 1000} segundos`)
    console.log(`⏱️ Pausa entre jugadores: ${DELAY_BETWEEN_PLAYERS / 1000} segundos\n`)
    
    let totalProcessed = 0
    let totalSuccess = 0
    let totalErrors = 0
    let batchNumber = 1
    
    while (true) {
      console.log(`\n${'='.repeat(60)}`)
      console.log(`📦 LOTE ${batchNumber}`)
      console.log(`${'='.repeat(60)}`)
      
      // Obtener jugadores para este lote
      const players = await prisma.jugador.findMany({
        where: {
          OR: [
            { date_of_birth: null },
            { team_name: null },
            { position_player: null },
            { height: null },
            { nationality_1: null }
          ]
        },
        select: {
          id_player: true,
          player_name: true,
          complete_player_name: true
        },
        take: BATCH_SIZE
      })
      
      if (players.length === 0) {
        console.log('✅ No hay más jugadores para procesar!')
        break
      }
      
      console.log(`📊 Procesando ${players.length} jugadores en este lote...`)
      
      let batchSuccess = 0
      let batchErrors = 0
      
      for (let i = 0; i < players.length; i++) {
        const player = players[i]
        const fullName = player.complete_player_name || player.player_name
        
        console.log(`\n[${i + 1}/${players.length}] ${fullName}`)
        
        try {
          const playerData = await scrapePlayerData(fullName)
          
          if (playerData) {
            // Filtrar solo los campos que no son null
            const updateData = Object.fromEntries(
              Object.entries(playerData).filter(([key, value]) => value !== null)
            )
            
            if (Object.keys(updateData).length > 0) {
              await prisma.jugador.update({
                where: { id_player: player.id_player },
                data: updateData
              })
              
              console.log(`✅ Actualizado: ${Object.keys(updateData).join(', ')}`)
              batchSuccess++
              totalSuccess++
            } else {
              console.log(`ℹ️ No se encontraron datos nuevos`)
            }
          } else {
            console.log(`❌ No se pudieron obtener datos`)
            batchErrors++
            totalErrors++
          }
        } catch (error) {
          console.log(`❌ Error: ${error.message}`)
          batchErrors++
          totalErrors++
        }
        
        totalProcessed++
        
        // Pausa entre jugadores
        if (i < players.length - 1) {
          console.log(`⏳ Esperando ${DELAY_BETWEEN_PLAYERS / 1000}s...`)
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_PLAYERS))
        }
      }
      
      console.log(`\n📊 Resumen del lote ${batchNumber}:`)
      console.log(`✅ Exitosos: ${batchSuccess}`)
      console.log(`❌ Errores: ${batchErrors}`)
      
      batchNumber++
      
      // Pausa entre lotes
      if (players.length === BATCH_SIZE) {
        console.log(`\n⏳ Pausa entre lotes: ${DELAY_BETWEEN_BATCHES / 1000} segundos...`)
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    }
    
    console.log(`\n🎉 Scraping completado!`)
    console.log(`📊 Total procesados: ${totalProcessed}`)
    console.log(`✅ Total exitosos: ${totalSuccess}`)
    console.log(`❌ Total errores: ${totalErrors}`)
    
  } catch (error) {
    console.error('❌ Error general:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Función para verificar el progreso
async function checkProgress() {
  try {
    const totalPlayers = await prisma.jugador.count()
    
    const stats = await prisma.jugador.groupBy({
      by: ['date_of_birth', 'team_name', 'position_player', 'height', 'nationality_1'],
      _count: {
        id_player: true
      }
    })
    
    console.log('📊 Estadísticas de progreso:')
    console.log(`Total de jugadores: ${totalPlayers}`)
    
    const fields = [
      { name: 'date_of_birth', label: 'Fecha de nacimiento' },
      { name: 'team_name', label: 'Nombre del equipo' },
      { name: 'position_player', label: 'Posición' },
      { name: 'height', label: 'Altura' },
      { name: 'nationality_1', label: 'Nacionalidad' }
    ]
    
    for (const field of fields) {
      const count = await prisma.jugador.count({
        where: { [field.name]: { not: null } }
      })
      const percentage = ((count / totalPlayers) * 100).toFixed(1)
      console.log(`${field.label}: ${count}/${totalPlayers} (${percentage}%)`)
    }
    
  } catch (error) {
    console.error('❌ Error verificando progreso:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar según los argumentos
if (process.argv.includes('--check')) {
  checkProgress()
} else {
  runPlayerScraping()
}
