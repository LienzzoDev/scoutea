const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAtributosTable() {
  console.log('🔍 Verificando tabla atributos...\n');

  try {
    // 1. Verificar si podemos consultar la tabla atributos directamente
    console.log('📊 Consultando tabla atributos directamente...');
    const atributosCount = await prisma.atributos.count();
    console.log(`✅ Tabla atributos existe: ${atributosCount} registros`);

    // 2. Verificar si podemos consultar jugadores con atributos
    console.log('\n👥 Consultando jugadores con include atributos...');
    const jugadoresConAtributos = await prisma.jugador.findMany({
      take: 1,
      include: {
        atributos: true
      }
    });
    console.log(`✅ Include atributos funciona: ${jugadoresConAtributos.length} jugadores`);

    if (jugadoresConAtributos.length > 0) {
      const jugador = jugadoresConAtributos[0];
      console.log(`   - Jugador: ${jugador.player_name}`);
      console.log(`   - Tiene atributos: ${jugador.atributos ? 'Sí' : 'No'}`);
      if (jugador.atributos) {
        console.log(`   - FMI pts: ${jugador.atributos.total_fmi_pts}`);
      }
    }

    // 3. Probar el filtro problemático
    console.log('\n🎯 Probando filtro problemático...');
    try {
      const jugadoresConFiltro = await prisma.jugador.findMany({
        where: {
          atributos: {
            isNot: null
          }
        },
        take: 1
      });
      console.log(`✅ Filtro atributos funciona: ${jugadoresConFiltro.length} jugadores`);
    } catch (error) {
      console.log(`❌ Error con filtro atributos: ${error.message}`);
    }

    // 4. Verificar la estructura del schema
    console.log('\n📋 Verificando relaciones...');
    const jugadorConTodo = await prisma.jugador.findFirst({
      include: {
        atributos: true,
        radarMetrics: true,
        beeswarmData: true,
        lollipopData: true
      }
    });

    if (jugadorConTodo) {
      console.log(`✅ Todas las relaciones funcionan:`);
      console.log(`   - atributos: ${jugadorConTodo.atributos ? 'OK' : 'NULL'}`);
      console.log(`   - radarMetrics: ${jugadorConTodo.radarMetrics.length} registros`);
      console.log(`   - beeswarmData: ${jugadorConTodo.beeswarmData.length} registros`);
      console.log(`   - lollipopData: ${jugadorConTodo.lollipopData.length} registros`);
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAtributosTable()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });