# Guía de Componentes Reutilizables - Scoutea

## 📋 Índice

- [Componentes UI Base](#componentes-ui-base)
- [Componentes de Jugadores](#componentes-de-jugadores)
- [Componentes de Filtros](#componentes-de-filtros)
- [Componentes de Layout](#componentes-de-layout)
- [Componentes de Autenticación](#componentes-de-autenticación)
- [Guías de Uso](#guías-de-uso)
- [Patrones y Convenciones](#patrones-y-convenciones)

---

## 🎨 Componentes UI Base

### Button

**Ubicación:** `src/components/ui/button.tsx`

**Propósito:** Botón reutilizable con múltiples variantes y tamaños.

**Props:**

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}
```

**Variantes disponibles:**

- `default`: Botón primario con fondo rojo corporativo
- `destructive`: Para acciones destructivas (eliminar, cancelar)
- `outline`: Botón con borde, sin fondo
- `secondary`: Botón secundario con fondo gris
- `ghost`: Botón transparente, solo hover
- `link`: Estilo de enlace con subrayado

**Tamaños disponibles:**

- `default`: Altura estándar (40px)
- `sm`: Botón pequeño (36px)
- `lg`: Botón grande (44px)
- `icon`: Botón cuadrado para íconos (40x40px)

**Ejemplos de uso:**

```tsx
// Botón primario estándar
<Button>Guardar Jugador</Button>

// Botón destructivo
<Button variant="destructive">Eliminar</Button>

// Botón pequeño con ícono
<Button size="sm" variant="outline">
  <Plus className="w-4 h-4 mr-2" />
  Añadir
</Button>

// Botón solo ícono
<Button size="icon" variant="ghost">
  <Search className="w-4 h-4" />
</Button>
```

**Cuándo usar:**

- ✅ Para todas las acciones principales y secundarias
- ✅ Cuando necesites consistencia visual
- ✅ Para formularios y CTAs
- ❌ No uses para navegación (usa Link en su lugar)

---

### Card

**Ubicación:** `src/components/ui/card.tsx`

**Propósito:** Contenedor con sombra y bordes redondeados para agrupar contenido relacionado.

**Componentes incluidos:**

- `Card`: Contenedor principal
- `CardHeader`: Encabezado con padding
- `CardTitle`: Título del card (h3)
- `CardDescription`: Descripción/subtítulo
- `CardContent`: Contenido principal
- `CardFooter`: Pie del card para acciones

**Ejemplo de uso:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Lionel Messi</CardTitle>
    <CardDescription>Delantero • Argentina</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Información del jugador...</p>
  </CardContent>
  <CardFooter>
    <Button>Ver Detalles</Button>
  </CardFooter>
</Card>
```

**Cuándo usar:**

- ✅ Para mostrar información agrupada
- ✅ En dashboards y listas
- ✅ Para formularios complejos
- ❌ No abuses, puede crear demasiada separación visual

---

### Input

**Ubicación:** `src/components/ui/input.tsx`

**Propósito:** Campo de entrada de texto con estilos consistentes.

**Props:**

```typescript
interface InputProps extends React.ComponentProps<"input"> {
  type?: string;
  className?: string;
}
```

**Características:**

- Estilos focus consistentes
- Soporte para estados de error (`aria-invalid`)
- Soporte para archivos
- Responsive (texto más pequeño en móvil)

**Ejemplo de uso:**

```tsx
// Input básico
<Input
  type="text"
  placeholder="Nombre del jugador"
  value={playerName}
  onChange={(e) => setPlayerName(e.target.value)}
/>

// Input con error
<Input
  type="email"
  placeholder="Email"
  aria-invalid={hasError}
  className="border-red-500"
/>

// Input de archivo
<Input
  type="file"
  accept="image/*"
/>
```

**Cuándo usar:**

- ✅ Para todos los campos de texto
- ✅ En formularios
- ✅ Para búsquedas
- ❌ No uses para selecciones múltiples (usa MultiSelectFilter)

---

### Badge

**Ubicación:** `src/components/ui/badge.tsx`

**Propósito:** Etiqueta pequeña para mostrar estados, categorías o información destacada.

**Props:**

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}
```

**Variantes:**

- `default`: Badge primario (rojo corporativo)
- `secondary`: Badge gris
- `destructive`: Badge rojo para errores/alertas
- `outline`: Badge con borde, sin fondo

**Ejemplo de uso:**

```tsx
// Badge de posición
<Badge>Delantero</Badge>

// Badge de estado
<Badge variant="secondary">Disponible</Badge>

// Badge de alerta
<Badge variant="destructive">Lesionado</Badge>

// Badge outline
<Badge variant="outline">Cedido</Badge>
```

**Cuándo usar:**

- ✅ Para posiciones de jugadores
- ✅ Para estados (disponible, lesionado, etc.)
- ✅ Para categorías y tags
- ❌ No uses para texto largo (máximo 2-3 palabras)

---

### LoadingSpinner

**Ubicación:** `src/components/ui/loading-spinner.tsx`

**Propósito:** Indicador de carga con múltiples variantes y tamaños.

**Props:**

```typescript
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "primary" | "secondary";
  text?: string;
  className?: string;
}
```

**Componentes especializados incluidos:**

- `PlayerLoadingSpinner`: Para páginas de jugadores
- `TableLoadingSpinner`: Para tablas de datos
- `ButtonLoadingSpinner`: Para botones en estado de carga
- `LoadingPage`: Para páginas completas en estado de carga
- `LoadingCard`: Para contenido de cards en estado de carga

**Ejemplo de uso:**

```tsx
// Spinner básico
<LoadingSpinner size="md" text="Cargando..." />

// Spinner para jugadores
<PlayerLoadingSpinner text="Cargando perfil del jugador..." />

// Spinner en botón
<Button disabled={isLoading}>
  {isLoading ? <ButtonLoadingSpinner /> : "Guardar"}
</Button>

// Spinner para página completa
<LoadingPage text="Cargando torneos..." />

// Spinner para contenido de card
<LoadingCard text="Cargando jugadores..." />
```

**Variantes especializadas:**

#### LoadingSpinner (Base)

- **Uso:** Componente base personalizable
- **Tamaños:** sm (16px), md (24px), lg (32px), xl (48px)
- **Variantes:** default (gris), primary (rojo corporativo), secondary (azul)

#### PlayerLoadingSpinner

- **Uso:** Páginas de perfil de jugadores
- **Tamaño:** lg con padding vertical de 48px
- **Texto predeterminado:** "Cargando jugador..."

#### TableLoadingSpinner

- **Uso:** Tablas y listas de datos
- **Tamaño:** md con padding vertical de 32px
- **Texto predeterminado:** "Cargando datos..."

#### ButtonLoadingSpinner

- **Uso:** Dentro de botones durante acciones
- **Tamaño:** sm sin texto
- **Estilo:** Adaptado para fondos de botones

#### LoadingPage

- **Uso:** Páginas completas en estado de carga
- **Tamaño:** xl con altura mínima de 400px
- **Texto predeterminado:** "Cargando..."

#### LoadingCard

- **Uso:** Contenido de cards y secciones
- **Tamaño:** lg con padding vertical de 48px
- **Texto predeterminado:** "Cargando datos..."

**Cuándo usar:**

- ✅ Durante llamadas a API
- ✅ En estados de carga de páginas
- ✅ En botones durante acciones async
- ❌ No uses para cargas muy rápidas (<200ms)

---

## ⚽ Componentes de Jugadores

### PlayerCard

**Ubicación:** `src/components/player/PlayerCard.tsx`

**Propósito:** Tarjeta reutilizable para mostrar información de jugadores en diferentes formatos.

**Props:**

```typescript
interface PlayerCardProps {
  player: Player;
  variant?: "compact" | "detailed" | "list";
  showActions?: boolean;
  onPlayerClick?: (player: Player) => void;
  onBookmarkToggle?: (playerId: string) => Promise<boolean>;
  isBookmarked?: boolean;
}
```

**Variantes:**

#### 1. Compact (Predeterminada)

- **Uso:** Grids de jugadores, vistas de resumen
- **Tamaño:** ~200px ancho, altura variable
- **Información:** Nombre, posición, edad, equipo, rating

```tsx
<PlayerCard
  player={player}
  variant="compact"
  onPlayerClick={handlePlayerClick}
/>
```

#### 2. Detailed

- **Uso:** Páginas principales, destacados
- **Tamaño:** Ancho completo, más altura
- **Información:** Toda la información disponible + avatar grande

```tsx
<PlayerCard
  player={player}
  variant="detailed"
  showActions={true}
  onBookmarkToggle={handleBookmark}
  isBookmarked={isPlayerBookmarked}
/>
```

#### 3. List

- **Uso:** Listas verticales, resultados de búsqueda
- **Tamaño:** Ancho completo, altura fija
- **Información:** Información esencial en formato horizontal

```tsx
<PlayerCard player={player} variant="list" onPlayerClick={handlePlayerClick} />
```

**Características:**

- ✨ Optimizado con `React.memo` para performance
- 🔄 Memoización de cálculos costosos con `useMemo`
- 📱 Responsive en todos los tamaños
- ♿ Accesible con navegación por teclado

**Cuándo usar cada variante:**

- `compact`: Dashboards, grids de jugadores, vistas de resumen
- `detailed`: Páginas de jugador destacado, modales de detalle
- `list`: Resultados de búsqueda, listas largas, tablas alternativas

---

### PlayerAvatar

**Ubicación:** `src/components/ui/player-avatar.tsx`

**Propósito:** Avatar especializado para jugadores con soporte para banderas y badges.

**Props:**

```typescript
interface PlayerAvatarProps {
  player: Player;
  size?: "sm" | "md" | "lg" | "xl";
  showFlag?: boolean;
  showBadge?: boolean;
  className?: string;
}
```

**Tamaños:**

- `sm`: 32x32px - Para listas compactas
- `md`: 48x48px - Uso general
- `lg`: 64x64px - Para cards detallados
- `xl`: 96x96px - Para páginas de perfil

**Ejemplo de uso:**

```tsx
// Avatar básico
<PlayerAvatar player={player} size="md" />

// Avatar sin bandera
<PlayerAvatar
  player={player}
  size="lg"
  showFlag={false}
/>

// Avatar personalizado
<PlayerAvatar
  player={player}
  size="xl"
  className="border-2 border-red-500"
/>
```

**Cuándo usar:**

- ✅ En todas las representaciones de jugadores
- ✅ Cuando necesites consistencia visual
- ✅ Para identificación rápida
- ❌ No uses tamaños muy grandes en listas

---

## 🔍 Componentes de Filtros

### MultiSelectFilter

**Ubicación:** `src/components/filters/multi-select-filter.tsx`

**Propósito:** Filtro de selección múltiple con búsqueda integrada.

**Props:**

```typescript
interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxDisplayTags?: number;
}
```

**Características:**

- 🔍 Búsqueda en tiempo real
- 🏷️ Tags visuales para selecciones
- 🧹 Botón "Limpiar todo"
- 📱 Responsive y accesible
- ⌨️ Navegación por teclado

**Ejemplo de uso:**

```tsx
<MultiSelectFilter
  label="Posiciones"
  options={["Portero", "Defensa", "Centrocampista", "Delantero"]}
  selectedValues={selectedPositions}
  onSelectionChange={setSelectedPositions}
  placeholder="Seleccionar posiciones..."
  searchPlaceholder="Buscar posición..."
  maxDisplayTags={3}
/>
```

**Cuándo usar:**

- ✅ Para filtros con múltiples opciones
- ✅ Cuando hay muchas opciones (>10)
- ✅ Para categorías y tags
- ❌ No uses para opciones binarias (usa toggle)

---

## 📐 Componentes de Layout

### PageContainer

**Ubicación:** `src/components/layout/page-container.tsx`

**Propósito:** Contenedor estándar para páginas con título y descripción opcionales.

**Props:**

```typescript
interface PageContainerProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}
```

**Ejemplo de uso:**

```tsx
<PageContainer
  title="Gestión de Jugadores"
  description="Administra la base de datos de jugadores"
>
  <PlayerTable />
</PageContainer>
```

**Cuándo usar:**

- ✅ Para todas las páginas principales
- ✅ Cuando necesites consistencia de layout
- ✅ Para páginas con títulos
- ❌ No uses en modales o componentes anidados

---

## 🔐 Componentes de Autenticación

### BookmarkButton

**Ubicación:** `src/components/ui/bookmark-button.tsx`

**Propósito:** Botón para añadir/quitar elementos de listas personales.

**Props:**

```typescript
interface BookmarkButtonProps {
  entityId: string;
  isBookmarked: boolean;
  onToggle: (entityId: string) => Promise<boolean>;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

**Características:**

- 🔄 Estados de carga automáticos
- 🎨 Animaciones suaves
- ⚡ Optimizado para performance
- 🛡️ Manejo de errores integrado

**Ejemplo de uso:**

```tsx
<BookmarkButton
  entityId={player.id_player}
  isBookmarked={isPlayerBookmarked}
  onToggle={handleBookmarkToggle}
  size="md"
/>
```

**Cuándo usar:**

- ✅ En cards de jugadores
- ✅ En listas y tablas
- ✅ Para funcionalidad de "favoritos"
- ❌ No uses para acciones permanentes

---

## 📚 Guías de Uso

### Patrones de Composición

#### 1. Card + Avatar + Badge

```tsx
<Card>
  <CardHeader>
    <div className="flex items-center gap-3">
      <PlayerAvatar player={player} size="md" />
      <div>
        <CardTitle>{player.player_name}</CardTitle>
        <Badge>{player.position_player}</Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent>{/* Contenido adicional */}</CardContent>
</Card>
```

#### 2. Formulario con Validación

```tsx
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="name">Nombre</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-invalid={errors.name ? "true" : "false"}
      />
      {errors.name && <Badge variant="destructive">{errors.name}</Badge>}
    </div>

    <Button type="submit" disabled={isLoading}>
      {isLoading ? <ButtonLoadingSpinner /> : "Guardar"}
    </Button>
  </div>
</form>
```

#### 3. Lista con Filtros

```tsx
<div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <MultiSelectFilter
      label="Posiciones"
      options={positions}
      selectedValues={selectedPositions}
      onSelectionChange={setSelectedPositions}
    />
    {/* Más filtros */}
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {filteredPlayers.map((player) => (
      <PlayerCard
        key={player.id_player}
        player={player}
        variant="compact"
        onPlayerClick={handlePlayerClick}
      />
    ))}
  </div>
</div>
```

### Estados de Carga

#### 1. Página Completa (Loading Pages)

```tsx
// Para páginas de Next.js (loading.tsx)
export default function TorneosLoading() {
  return <LoadingPage text="Cargando torneos..." />;
}

// Para estados condicionales en páginas
if (isLoading) {
  return (
    <PageContainer>
      <LoadingPage text="Cargando datos..." />
    </PageContainer>
  );
}
```

#### 2. Secciones de Jugadores

```tsx
// Para perfiles de jugadores
{
  isLoadingPlayer ? (
    <PlayerLoadingSpinner text="Cargando perfil del jugador..." />
  ) : (
    <PlayerProfile player={player} />
  );
}

// Para listas de jugadores
{
  isLoadingPlayers ? (
    <PlayerLoadingSpinner text="Buscando jugadores..." />
  ) : (
    <div className="grid gap-4">
      {players.map((player) => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}
```

#### 3. Tablas y Listas de Datos

```tsx
// Para tablas simples
{
  isLoading ? (
    <TableLoadingSpinner text="Cargando estadísticas..." />
  ) : (
    <div className="space-y-4">
      {data.map((item) => (
        <DataRow key={item.id} data={item} />
      ))}
    </div>
  );
}

// Para contenido de cards
<Card>
  <CardContent>
    {isLoading ? (
      <LoadingCard text="Cargando jugadores..." />
    ) : (
      <PlayerList players={players} />
    )}
  </CardContent>
</Card>;
```

#### 4. Botones con Acciones

```tsx
<Button disabled={isSubmitting}>
  {isSubmitting ? <ButtonLoadingSpinner /> : "Guardar Jugador"}
</Button>

<Button disabled={isDeleting} variant="destructive">
  {isDeleting ? <ButtonLoadingSpinner /> : "Eliminar"}
</Button>
```

#### 5. Componentes Personalizados

```tsx
// Para casos específicos
<LoadingSpinner
  size="lg"
  variant="primary"
  text="Procesando datos..."
  className="my-8"
/>
```

### Manejo de Errores

#### 1. Formularios

```tsx
<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  aria-invalid={emailError ? "true" : "false"}
  className={emailError ? "border-red-500" : ""}
/>;
{
  emailError && (
    <Badge variant="destructive" className="mt-1">
      {emailError}
    </Badge>
  );
}
```

#### 2. Estados Vacíos

```tsx
{players.length === 0 ? (
  <Card>
    <CardContent className="text-center py-12">
      <p className="text-gray-500 mb-4">No se encontraron jugadores</p>
      <Button onClick={handleAddPlayer}>
        Añadir Primer Jugador
      </Button>
    </CardContent>
  </Card>
) : (
  // Lista de jugadores
)}
```

---

## 🎯 Patrones y Convenciones

### Nomenclatura de Componentes

1. **PascalCase** para nombres de componentes
2. **Prefijos descriptivos** para componentes especializados:
   - `Player*` para componentes de jugadores
   - `*Filter` para componentes de filtrado
   - `*Button` para variantes de botones
   - `*Spinner` para indicadores de carga

### Estructura de Props

1. **Props requeridas primero**
2. **Props opcionales después**
3. **Callbacks al final**
4. **className siempre opcional**

```typescript
interface ComponentProps {
  // Requeridas
  data: DataType;
  title: string;

  // Opcionales
  variant?: "default" | "compact";
  showActions?: boolean;
  className?: string;

  // Callbacks
  onItemClick?: (item: DataType) => void;
  onItemSelect?: (id: string) => void;
}
```

### Variantes Estándar

Usa estas variantes consistentemente:

- **Tamaños:** `sm`, `md`, `lg`, `xl`
- **Variantes:** `default`, `primary`, `secondary`, `destructive`, `outline`, `ghost`
- **Estados:** `loading`, `error`, `success`, `disabled`

### Performance

1. **Usa `React.memo`** para componentes que reciben props complejas
2. **Usa `useMemo`** para cálculos costosos
3. **Usa `useCallback`** para funciones que se pasan como props
4. **Evita crear objetos** en el render

```tsx
// ✅ Bueno
const PlayerCard = memo(({ player, onPlayerClick }) => {
  const playerInfo = useMemo(
    () => ({
      displayAge: player.age ? `${player.age} años` : "N/A",
      displayTeam: player.team_name || "Sin equipo",
    }),
    [player.age, player.team_name]
  );

  const handleClick = useCallback(() => {
    onPlayerClick?.(player);
  }, [onPlayerClick, player]);

  return <div onClick={handleClick}>{/* Contenido */}</div>;
});

// ❌ Malo
const PlayerCard = ({ player, onPlayerClick }) => {
  return (
    <div onClick={() => onPlayerClick(player)}>
      <span>{player.age ? `${player.age} años` : "N/A"}</span>
    </div>
  );
};
```

### Accesibilidad

1. **Usa `aria-*` attributes** apropiados
2. **Incluye `alt` text** para imágenes
3. **Soporte para navegación por teclado**
4. **Contraste adecuado** en colores

```tsx
// ✅ Accesible
<Button
  onClick={handleDelete}
  aria-label="Eliminar jugador Lionel Messi"
  className="text-red-600"
>
  <Trash className="w-4 h-4" />
</Button>

// ❌ No accesible
<div onClick={handleDelete} className="cursor-pointer">
  <Trash className="w-4 h-4" />
</div>
```

---

## 🚀 Próximos Pasos

### Componentes Planificados

1. **DataTable**: Tabla avanzada con sorting, filtros y paginación
2. **SearchInput**: Input de búsqueda con sugerencias
3. **PlayerComparison**: Componente para comparar jugadores
4. **StatChart**: Gráficos para estadísticas
5. **NotificationToast**: Sistema de notificaciones

### Mejoras Futuras

1. **Storybook**: Documentación interactiva
2. **Tests automatizados**: Para todos los componentes
3. **Temas**: Soporte para modo oscuro
4. **Animaciones**: Transiciones más suaves
5. **Internacionalización**: Soporte multi-idioma

---

## � Soplución de Problemas Comunes

### Errores de Importación

#### Error: "no tiene ningún miembro exportado"

```tsx
// ❌ Incorrecto - Componente no existe
import { LoadingCard } from "@/components/ui/loading-spinner";

// ✅ Correcto - Verifica las exportaciones disponibles
import {
  LoadingPage,
  LoadingCard,
  PlayerLoadingSpinner,
} from "@/components/ui/loading-spinner";
```

#### Error: "Cannot resolve module"

```tsx
// ❌ Incorrecto - Ruta relativa incorrecta
import { Button } from "../ui/button";
import { useCache } from "./base"; // En subdirectorio

// ✅ Correcto - Usa alias de path
import { Button } from "@/components/ui/button";
import { useCache } from "../base"; // Ruta relativa correcta
```

#### Error: "Module not found: Can't resolve './base'"

```tsx
// ❌ Incorrecto - Ruta relativa desde subdirectorio
import { useCache } from "./base";

// ✅ Correcto - Subir un nivel desde subdirectorio
import { useCache } from "../base";
```

### Errores de Runtime

#### Error: "cache.getStats is not a function"

```tsx
// ❌ Incorrecto - getStats no es un método
const cache = useCache({ key: "players" });
const stats = cache.getStats();

// ✅ Correcto - stats es una propiedad
const cache = useCache({ key: "players" });
const stats = cache.stats;
```

#### Error: "Cannot read property of undefined"

```tsx
// ❌ Problemático - No verificar si existe
const playerName = player.player_name;

// ✅ Seguro - Verificar antes de usar
const playerName = player?.player_name || "N/A";
```

#### Error: "❌ Error Handler: {}"

```tsx
// ❌ Problemático - Lanzar objetos como errores
const errorData = await response.json().catch(() => ({}));
throw {
  message: errorData.error || "Error message",
  status: response.status,
  code: errorData.code, // undefined si errorData es {}
};

// ✅ Correcto - Usar Error objects
const errorData = await response.json().catch(() => ({}));
throw new Error(errorData.error || `Error message (${response.status})`);
```

#### Error: "cache.someMethod is not a function"

```tsx
// ❌ Problemático - Llamar métodos que no existen
cache.invalidatePattern("player-"); // Método no existe

// ✅ Correcto - Verificar métodos disponibles
// Solo usar: get, set, clear, refresh, has, isExpired
cache.clear(); // Método que sí existe
```

#### Error: Normalización de errores en catch blocks

```tsx
// ❌ Problemático - Pasar cualquier tipo de error
} catch (err) {
  handleError(err, options); // err puede ser {}, string, etc.
}

// ✅ Correcto - Normalizar error antes de pasar
} catch (err) {
  // Log para debugging en desarrollo
  console.error('Error original:', err);

  const error = err instanceof Error ? err : new Error(
    typeof err === 'string' ? err : 'Mensaje de error por defecto'
  );
  handleError(error, options);
}

// ✅ Patrón para debugging de respuestas API
const data = await response.json();
if (!data.expectedProperty) {
  console.error('Respuesta API inesperada:', data);
  throw new Error('Respuesta inválida del servidor');
}
```

#### Error: "Maximum update depth exceeded"

```tsx
// ❌ Problemático - Función en dependencias que cambia constantemente
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData se recrea en cada render

// ✅ Correcto - Solo incluir valores primitivos estables
useEffect(() => {
  fetchData();
}, [id, isLoaded]); // Solo valores que realmente cambian

// ✅ Alternativa - Memoizar la función
const fetchData = useCallback(() => {
  // lógica
}, [id]); // Solo recrear cuando id cambie

// ❌ Problemático - setState dentro de función llamada en useEffect
const getData = useCallback(() => {
  setError(null); // Causa re-render infinito
  return cache.get();
}, []);

// ✅ Correcto - Evitar setState innecesarios
const getData = useCallback(() => {
  return cache.get(); // Solo setState cuando hay error real
}, []);

// ❌ Problemático - clearError incondicional en useEffect
useEffect(() => {
  const loadData = async () => {
    clearError("context"); // Siempre causa setState
    // fetch data...
  };
  loadData();
}, []);

// ✅ Correcto - clearError condicional
useEffect(() => {
  const loadData = async () => {
    if (error) {
      clearError("context"); // Solo setState si hay error
    }
    // fetch data...
  };
  loadData();
}, []);
```

### Problemas de Performance

#### Re-renders excesivos en PlayerCard

```tsx
// ❌ Problemático - Crea nueva función en cada render
<PlayerCard
  player={player}
  onPlayerClick={(p) => handleClick(p)}
/>

// ✅ Optimizado - Usa useCallback
const handlePlayerClick = useCallback((player) => {
  // Lógica de click
}, [])

<PlayerCard
  player={player}
  onPlayerClick={handlePlayerClick}
/>
```

#### Listas grandes lentas

```tsx
// ❌ Problemático - Renderiza todos los elementos
{
  players.map((player) => <PlayerCard key={player.id} player={player} />);
}

// ✅ Optimizado - Usa paginación o virtualización
{
  currentPagePlayers.map((player) => (
    <PlayerCard key={player.id} player={player} />
  ));
}
```

### Problemas de Estilos

#### Componentes no se ven correctamente

1. **Verifica que Tailwind CSS esté configurado**
2. **Asegúrate de que los estilos base estén importados**
3. **Revisa que no haya conflictos de CSS**

#### Responsive no funciona

```tsx
// ❌ Problemático - Clases conflictivas
<div className="w-full w-1/2 md:w-1/3">

// ✅ Correcto - Orden lógico de breakpoints
<div className="w-full md:w-1/2 lg:w-1/3">
```

### Problemas de Accesibilidad

#### Botones sin etiquetas

```tsx
// ❌ No accesible
<Button onClick={handleDelete}>
  <Trash className="w-4 h-4" />
</Button>

// ✅ Accesible
<Button
  onClick={handleDelete}
  aria-label="Eliminar jugador"
>
  <Trash className="w-4 h-4" />
</Button>
```

### Debugging Tips

1. **Usa React Developer Tools** para inspeccionar props
2. **Verifica la consola** para warnings de React
3. **Usa `console.log`** para debuggear props complejas
4. **Revisa el Network tab** para llamadas API fallidas

---

## 📞 Soporte

Para preguntas sobre componentes o sugerencias de mejora:

1. **Revisa esta guía** primero
2. **Consulta el código fuente** del componente
3. **Crea un issue** en el repositorio
4. **Pregunta al equipo** en Slack

---

_Última actualización: Diciembre 2024_
_Versión: 1.0.0_
