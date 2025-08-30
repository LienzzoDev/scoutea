import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Crear jugadores de ejemplo
  const jugadores = [
    {
      nombre: 'Ethan Carter',
      nombreUsuario: 'ethan.carter',
      posicion: 'Forward',
      edad: 22,
      equipo: 'United FC',
      valoracion: '250k',
      urlAvatar: '/young-soccer-player.png',
      biografia: 'Jugador promesa con gran velocidad y técnica',
      numeroCamiseta: 10,
      atributos: [
        { nombre: 'Velocidad', valor: '85' },
        { nombre: 'Técnica', valor: '78' },
        { nombre: 'Resistencia', valor: '82' },
        { nombre: 'Definición', valor: '80' },
      ],
    },
    {
      nombre: 'Liam Johnson',
      nombreUsuario: 'liam.johnson',
      posicion: 'Midfielder',
      edad: 24,
      equipo: 'City SC',
      valoracion: '300k',
      urlAvatar: '/soccer-midfielder.png',
      biografia: 'Centrocampista creativo con visión de juego',
      numeroCamiseta: 8,
      atributos: [
        { nombre: 'Visión', valor: '88' },
        { nombre: 'Pase', valor: '85' },
        { nombre: 'Control', valor: '82' },
        { nombre: 'Tiro', valor: '75' },
      ],
    },
    {
      nombre: 'Noah Brown',
      nombreUsuario: 'noah.brown',
      posicion: 'Defender',
      edad: 26,
      equipo: 'Lions FC',
      valoracion: '350k',
      urlAvatar: '/soccer-defender.png',
      biografia: 'Defensa central sólido y líder en el campo',
      numeroCamiseta: 4,
      atributos: [
        { nombre: 'Marcaje', valor: '87' },
        { nombre: 'Aéreo', valor: '85' },
        { nombre: 'Tackle', valor: '88' },
        { nombre: 'Liderazgo', valor: '90' },
      ],
    },
    {
      nombre: 'Oliver Martinez',
      nombreUsuario: 'oliver.martinez',
      posicion: 'Goalkeeper',
      edad: 28,
      equipo: 'Eagles FC',
      valoracion: '400k',
      urlAvatar: '/soccer-goalkeeper.png',
      biografia: 'Portero experimentado con reflejos excepcionales',
      numeroCamiseta: 1,
      atributos: [
        { nombre: 'Reflejos', valor: '89' },
        { nombre: 'Aéreo', valor: '87' },
        { nombre: 'Mano', valor: '85' },
        { nombre: 'Comunicación', valor: '88' },
      ],
    },
    {
      nombre: 'Lucas Wilson',
      nombreUsuario: 'lucas.wilson',
      posicion: 'Forward',
      edad: 20,
      equipo: 'Sharks FC',
      valoracion: '150k',
      urlAvatar: '/young-soccer-forward.png',
      biografia: 'Joven delantero con potencial de crecimiento',
      numeroCamiseta: 11,
      atributos: [
        { nombre: 'Potencial', valor: '90' },
        { nombre: 'Velocidad', valor: '88' },
        { nombre: 'Agilidad', valor: '85' },
        { nombre: 'Aprendizaje', valor: '92' },
      ],
    },
  ]

  for (const jugadorData of jugadores) {
    const { atributos, ...jugadorInfo } = jugadorData

    // Crear el jugador
    const jugador = await prisma.jugador.create({
      data: jugadorInfo,
    })

    console.log(`✅ Jugador creado: ${jugador.nombre}`)

    // Crear atributos
    for (const attr of atributos) {
      await prisma.atributoJugador.create({
        data: {
          jugadorId: jugador.id,
          nombre: attr.nombre,
          valor: attr.valor,
        },
      })
    }

    // Crear equipo actual
    await prisma.equipoJugador.create({
      data: {
        jugadorId: jugador.id,
        nombreEquipo: jugadorInfo.equipo,
        fechaInicio: new Date(),
        esActual: true,
      },
    })

    console.log(`   - Atributos y equipo creados`)
  }

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })