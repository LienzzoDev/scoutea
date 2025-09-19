# Fix: Error "Usuario no encontrado en la base de datos"

## Problema
Los usuarios experimentaban el error "Usuario no encontrado en la base de datos" al intentar guardar jugadores en su lista. Esto ocurría cuando:

1. El usuario se registraba exitosamente con Clerk
2. El webhook de Clerk fallaba al crear el usuario en la base de datos local
3. El usuario quedaba autenticado en Clerk pero sin registro en la base de datos

## Causa Raíz
El webhook de Clerk (`src/app/api/webhooks/clerk/route.ts`) tenía un try-catch que continuaba la ejecución aunque fallara la creación del usuario en la base de datos, causando una inconsistencia entre Clerk y la base de datos local.

## Solución Implementada

### 1. Función Helper para Sincronización Automática
Creamos `src/lib/utils/user-sync.ts` con la función `getOrCreateUser()` que:
- Busca el usuario en la base de datos local
- Si no existe, lo crea automáticamente usando la información de Clerk
- Maneja errores de forma robusta

### 2. Actualización de APIs
Modificamos los siguientes endpoints para usar la sincronización automática:

#### `src/app/api/player-list/route.ts`
- **GET**: Crea usuario automáticamente si no existe, devuelve lista vacía en caso de error
- **POST**: Crea usuario automáticamente antes de añadir jugador a la lista

#### `src/app/api/player-list/[playerId]/route.ts`
- **DELETE**: Crea usuario automáticamente antes de remover jugador de la lista

### 3. Beneficios de la Solución
- **Robustez**: Los usuarios nunca experimentarán el error "Usuario no encontrado"
- **Autocorrección**: El sistema se autocorrige automáticamente
- **Transparencia**: El proceso es invisible para el usuario
- **Consistencia**: Garantiza que todos los usuarios autenticados existan en la base de datos

## Archivos Modificados
1. `src/lib/utils/user-sync.ts` (nuevo)
2. `src/app/api/player-list/route.ts`
3. `src/app/api/player-list/[playerId]/route.ts`

## Flujo de la Solución
1. Usuario intenta guardar un jugador
2. API verifica si el usuario existe en la base de datos
3. Si no existe, obtiene información de Clerk y crea el usuario automáticamente
4. Continúa con la operación normal (guardar/remover jugador)

## Prevención Futura
Esta solución previene el problema en el futuro y también corrige casos existentes donde usuarios ya están en esta situación inconsistente.