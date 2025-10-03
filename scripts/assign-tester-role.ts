/**
 * Script para asignar el rol "tester" a un usuario específico
 * 
 * Uso:
 * npx tsx scripts/assign-tester-role.ts <userId>
 * 
 * O desde el código:
 * import { assignTesterRole } from './scripts/assign-tester-role'
 * await assignTesterRole('user_xxxxx')
 */

import { RoleService } from '../src/lib/services/role-service'

export async function assignTesterRole(userId: string) {
  try {
    console.log(`Asignando rol tester al usuario: ${userId}`)
    
    const result = await RoleService.updateUserRole(userId, {
      role: 'tester',
      profileStatus: 'complete'
    }, 'manual_tester_assignment')

    if (result.success) {
      console.log('✅ Rol tester asignado exitosamente')
      console.log(`Usuario: ${result.userId}`)
      console.log(`Rol anterior: ${result.previousRole}`)
      console.log(`Nuevo rol: ${result.newRole}`)
    } else {
      console.error('❌ Error al asignar rol tester:', result.error)
    }

    return result
  } catch (error) {
    console.error('❌ Error inesperado:', error)
    throw error
  }
}

// Si se ejecuta directamente desde la línea de comandos
if (require.main === module) {
  const userId = process.argv[2]
  
  if (!userId) {
    console.error('❌ Debes proporcionar un userId')
    console.log('Uso: npx tsx scripts/assign-tester-role.ts <userId>')
    process.exit(1)
  }

  assignTesterRole(userId)
    .then(() => {
      console.log('✅ Proceso completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en el proceso:', error)
      process.exit(1)
    })
}