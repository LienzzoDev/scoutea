const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Datos de prueba para estadísticas
const sampleStats = [
  // Estadísticas generales
  { category: 'general', metricName: 'matches', totalValue: 25, p90Value: 1.0, averageValue: 0.8, maximumValue: 1.0 },
  { category: 'general', metricName: 'minutes', totalValue: 2250, p90Value: 90.0, averageValue: 90.0, maximumValue: 90.0 },
  { category: 'general', metricName: 'yellowCards', totalValue: 3, p90Value: 0.12, averageValue: 0.12, maximumValue: 1.0 },
  { category: 'general', metricName: 'redCards', totalValue: 0, p90Value: 0.0, averageValue: 0.0, maximumValue: 0.0 },
  
  // Estadísticas de portería
  { category: 'goalkeeping', metricName: 'concededGoals', totalValue: 15, p90Value: 0.6, averageValue: 0.6, maximumValue: 2.0 },
  { category: 'goalkeeping', metricName: 'preventedGoals', totalValue: 8, p90Value: 0.32, averageValue: 0.32, maximumValue: 1.0 },
  { category: 'goalkeeping', metricName: 'shotsAgainst', totalValue: 45, p90Value: 1.8, averageValue: 1.8, maximumValue: 6.0 },
  { category: 'goalkeeping', metricName: 'cleanSheetsPercentage', totalValue: 40, p90Value: 1.6, averageValue: 1.6, maximumValue: 1.0 },
  { category: 'goalkeeping', metricName: 'saveRate', totalValue: 75, p90Value: 3.0, averageValue: 3.0, maximumValue: 1.0 },
  
  // Estadísticas de defensa
  { category: 'defending', metricName: 'tackles', totalValue: 45, p90Value: 1.8, averageValue: 1.8, maximumValue: 5.0 },
  { category: 'defending', metricName: 'interceptions', totalValue: 32, p90Value: 1.28, averageValue: 1.28, maximumValue: 4.0 },
  { category: 'defending', metricName: 'fouls', totalValue: 18, p90Value: 0.72, averageValue: 0.72, maximumValue: 3.0 },
  
  // Estadísticas de pase
  { category: 'passing', metricName: 'passes', totalValue: 1200, p90Value: 48.0, averageValue: 48.0, maximumValue: 80.0 },
  { category: 'passing', metricName: 'forwardPasses', totalValue: 450, p90Value: 18.0, averageValue: 18.0, maximumValue: 35.0 },
  { category: 'passing', metricName: 'crosses', totalValue: 25, p90Value: 1.0, averageValue: 1.0, maximumValue: 5.0 },
  { category: 'passing', metricName: 'assists', totalValue: 8, p90Value: 0.32, averageValue: 0.32, maximumValue: 2.0 },
  { category: 'passing', metricName: 'accuratePassesPercentage', totalValue: 85, p90Value: 3.4, averageValue: 3.4, maximumValue: 1.0 },
  
  // Estadísticas de finalización
  { category: 'finishing', metricName: 'shots', totalValue: 35, p90Value: 1.4, averageValue: 1.4, maximumValue: 6.0 },
  { category: 'finishing', metricName: 'shotsOnTarget', totalValue: 18, p90Value: 0.72, averageValue: 0.72, maximumValue: 4.0 },
  { category: 'finishing', metricName: 'goals', totalValue: 12, p90Value: 0.48, averageValue: 0.48, maximumValue: 3.0 },
  { category: 'finishing', metricName: 'goalsPerShot', totalValue: 0.34, p90Value: 0.014, averageValue: 0.014, maximumValue: 1.0 },
  { category: 'finishing', metricName: 'conversionRate', totalValue: 34, p90Value: 1.36, averageValue: 1.36, maximumValue: 1.0 }
]

// Datos de prueba para radar
const sampleRadarData = [
  { category: 'off_transition', playerValue: 85, positionAverage: 72, percentile: 78 },
  { category: 'maintenance', playerValue: 92, positionAverage: 88, percentile: 65 },
  { category: 'progression', playerValue: 78, positionAverage: 75, percentile: 55 },
  { category: 'finishing', playerValue: 88, positionAverage: 82, percentile: 70 },
  { category: 'off_stopped_ball', playerValue: 65, positionAverage: 68, percentile: 45 },
  { category: 'def_transition', playerValue: 82, positionAverage: 78, percentile: 60 },
  { category: 'recovery', playerValue: 90, positionAverage: 85, percentile: 68 },
  { category: 'evitation', playerValue: 87, positionAverage: 80, percentile: 72 },
  { category: 'def_stopped_ball', playerValue: 70, positionAverage: 73, percentile: 48 }
]

// Datos de prueba para enjambre
const sampleBeeswarmData = [
  { metric: 'goals', playerName: 'Lionel Messi', value: 25, position: 'FW', age: 36, nationality: 'Argentina', competition: 'Ligue 1', trfmValue: 50000000 },
  { metric: 'goals', playerName: 'Cristiano Ronaldo', value: 22, position: 'FW', age: 39, nationality: 'Portugal', competition: 'Saudi Pro League', trfmValue: 15000000 },
  { metric: 'goals', playerName: 'Kylian Mbappé', value: 28, position: 'FW', age: 25, nationality: 'France', competition: 'Ligue 1', trfmValue: 180000000 },
  { metric: 'goals', playerName: 'Erling Haaland', value: 30, position: 'FW', age: 24, nationality: 'Norway', competition: 'Premier League', trfmValue: 180000000 },
  { metric: 'goals', playerName: 'Robert Lewandowski', value: 18, position: 'FW', age: 35, nationality: 'Poland', competition: 'LaLiga', trfmValue: 5000000 },
  { metric: 'assists', playerName: 'Kevin De Bruyne', value: 15, position: 'CM', age: 33, nationality: 'Belgium', competition: 'Premier League', trfmValue: 60000000 },
  { metric: 'assists', playerName: 'Bruno Fernandes', value: 12, position: 'CM', age: 29, nationality: 'Portugal', competition: 'Premier League', trfmValue: 50000000 },
  { metric: 'assists', playerName: 'Luka Modrić', value: 8, position: 'CM', age: 38, nationality: 'Croatia', competition: 'LaLiga', trfmValue: 10000000 },
  { metric: 'tackles', playerName: 'Casemiro', value: 45, position: 'DM', age: 32, nationality: 'Brazil', competition: 'Premier League', trfmValue: 40000000 },
  { metric: 'tackles', playerName: 'N\'Golo Kanté', value: 38, position: 'DM', age: 33, nationality: 'France', competition: 'Saudi Pro League', trfmValue: 15000000 }
]

// Datos de prueba para paleta
const sampleLollipopData = [
  { metricName: 'goals', value: 12, rank: 15, totalPlayers: 500, percentile: 85, category: 'finishing' },
  { metricName: 'assists', value: 8, rank: 8, totalPlayers: 500, percentile: 92, category: 'passing' },
  { metricName: 'passes', value: 1200, rank: 25, totalPlayers: 500, percentile: 75, category: 'passing' },
  { metricName: 'tackles', value: 45, rank: 12, totalPlayers: 500, percentile: 88, category: 'defending' },
  { metricName: 'interceptions', value: 32, rank: 18, totalPlayers: 500, percentile: 82, category: 'defending' },
  { metricName: 'shots', value: 35, rank: 20, totalPlayers: 500, percentile: 80, category: 'finishing' }
]

async function seedChartData() {
  try {
    console.log('🌱 Iniciando población de datos de gráficos...')

    // Obtener algunos jugadores existentes
    const players = await prisma.jugador.findMany({
      take: 5,
      select: { id_player: true, player_name: true, position_player: true, nationality_1: true, team_competition: true, age: true, player_trfm_value: true }
    })

    if (players.length === 0) {
      console.log('❌ No hay jugadores en la base de datos. Ejecuta primero el seed de jugadores.')
      return
    }

    console.log(`📊 Poblando datos para ${players.length} jugadores...`)

    // Poblar estadísticas de jugadores
    for (const player of players) {
      console.log(`📈 Poblando estadísticas para ${player.player_name}...`)
      
      for (const stat of sampleStats) {
        await prisma.playerStats.create({
          data: {
            playerId: player.id_player,
            period: 'current',
            category: stat.category,
            metricName: stat.metricName,
            totalValue: stat.totalValue + Math.random() * 10 - 5, // Agregar variación
            p90Value: stat.p90Value + Math.random() * 2 - 1,
            averageValue: stat.averageValue + Math.random() * 2 - 1,
            maximumValue: stat.maximumValue + Math.random() * 2 - 1,
            percentile: Math.random() * 100
          }
        })
      }

      // Poblar datos de radar
      console.log(`🎯 Poblando datos de radar para ${player.player_name}...`)
      for (const radar of sampleRadarData) {
        await prisma.radarMetrics.create({
          data: {
            playerId: player.id_player,
            position: player.position_player || 'CM',
            category: radar.category,
            playerValue: radar.playerValue + Math.random() * 10 - 5,
            positionAverage: radar.positionAverage + Math.random() * 5 - 2.5,
            percentile: radar.percentile + Math.random() * 10 - 5,
            period: 'current'
          }
        })
      }

      // Poblar datos de paleta
      console.log(`🍭 Poblando datos de paleta para ${player.player_name}...`)
      for (const lollipop of sampleLollipopData) {
        await prisma.lollipopData.create({
          data: {
            playerId: player.id_player,
            metricName: lollipop.metricName,
            value: lollipop.value + Math.random() * 5 - 2.5,
            rank: lollipop.rank + Math.floor(Math.random() * 10 - 5),
            totalPlayers: lollipop.totalPlayers,
            percentile: lollipop.percentile + Math.random() * 5 - 2.5,
            category: lollipop.category,
            period: 'current',
            position: player.position_player || 'CM'
          }
        })
      }
    }

    // Poblar datos de enjambre (datos de múltiples jugadores)
    console.log('🐝 Poblando datos de enjambre...')
    for (const beeswarm of sampleBeeswarmData) {
      // Buscar un jugador que coincida o usar el primero
      const matchingPlayer = players.find(p => 
        p.position_player === beeswarm.position || 
        p.nationality_1 === beeswarm.nationality
      ) || players[0]

      await prisma.beeswarmData.create({
        data: {
          metric: beeswarm.metric,
          playerId: matchingPlayer.id_player,
          playerName: beeswarm.playerName,
          value: beeswarm.value + Math.random() * 5 - 2.5,
          position: beeswarm.position,
          age: beeswarm.age,
          nationality: beeswarm.nationality,
          competition: beeswarm.competition,
          trfmValue: beeswarm.trfmValue,
          isSelected: false,
          period: 'current'
        }
      })
    }

    console.log('✅ Datos de gráficos poblados exitosamente!')
    console.log(`📊 Estadísticas: ${players.length * sampleStats.length} registros`)
    console.log(`🎯 Radar: ${players.length * sampleRadarData.length} registros`)
    console.log(`🍭 Paleta: ${players.length * sampleLollipopData.length} registros`)
    console.log(`🐝 Enjambre: ${sampleBeeswarmData.length} registros`)

  } catch (error) {
    console.error('❌ Error al poblar datos de gráficos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
seedChartData()
