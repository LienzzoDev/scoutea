import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';

/**
 * DELETE /api/admin/players/delete-all
 * Elimina TODOS los jugadores de la base de datos
 * ⚠️ OPERACIÓN PELIGROSA - Solo para administradores
 */
export async function DELETE() {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Verificar que sea admin
    // TODO: Agregar verificación de rol de admin desde Clerk metadata
    // const user = await clerkClient.users.getUser(userId);
    // if (user.publicMetadata.role !== 'admin') {
    //   return NextResponse.json({ error: 'No tienes permisos de administrador' }, { status: 403 });
    // }

    console.log('🗑️ Iniciando eliminación de TODOS los jugadores...');

    // 3. Contar jugadores antes de eliminar
    const countBefore = await prisma.jugador.count();
    console.log(`📊 Total de jugadores a eliminar: ${countBefore}`);

    // 4. Eliminar TODOS los jugadores
    const result = await prisma.jugador.deleteMany({});

    console.log(`✅ Eliminados ${result.count} jugadores de la base de datos`);

    // 5. Verificar que se eliminaron todos
    const countAfter = await prisma.jugador.count();

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${result.count} jugadores exitosamente`,
      deletedCount: result.count,
      remainingCount: countAfter,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error eliminando jugadores:', error);
    return NextResponse.json(
      {
        error: 'Error al eliminar jugadores',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
