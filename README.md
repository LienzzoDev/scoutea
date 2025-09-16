# Scoutea - Web Scraping & Analytics Platform

Una plataforma avanzada de web scraping y análisis de datos para gestión de jugadores deportivos.

## 🚀 Características

- **Autenticación segura** con Clerk
- **Gestión de jugadores** con base de datos PostgreSQL
- **Dashboard analítico** con métricas en tiempo real
- **API RESTful** para operaciones CRUD
- **Interfaz moderna** con TailwindCSS y componentes shadcn/ui
- **TypeScript** para type safety completo
- **Next.js 15** con App Router

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de datos**: PostgreSQL
- **Autenticación**: Clerk
- **Styling**: TailwindCSS 4, shadcn/ui
- **Deployment**: Vercel

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL
- Cuenta de Clerk

## 🚀 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/samueelperez/scoutea.git
cd scoutea
```

2. **Instalar dependencias**
```bash
npm install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clerk_publishable_key
CLERK_SECRET_KEY=tu_clerk_secret_key
DATABASE_URL="postgresql://usuario:password@host:puerto/database"
```

4. **Configurar base de datos**
```bash
npx prisma generate
npx prisma db push
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🗄️ Estructura de Base de Datos

### Modelos principales:
- **Jugador**: Información básica del jugador
- **AtributoJugador**: Atributos personalizables
- **EquipoJugador**: Historial de equipos
- **UrlScraping**: URLs para scraping de datos

## 📱 Funcionalidades

### Dashboard
- Métricas en tiempo real
- Indicadores de rendimiento
- Gráficos de evolución de datos

### Gestión de Jugadores
- Crear, editar, eliminar jugadores
- Búsqueda y filtrado avanzado
- Perfiles detallados con atributos
- Historial de equipos

### API Endpoints
- `GET /api/players` - Listar jugadores con filtros y paginación
- `POST /api/players` - Crear jugador
- `GET /api/players/[id]` - Obtener jugador específico
- `PUT /api/players/[id]` - Actualizar jugador
- `DELETE /api/players/[id]` - Eliminar jugador
- `GET /api/players/stats` - Estadísticas de jugadores
- `GET /api/players/filters` - Opciones de filtros disponibles

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting
npm run db:generate  # Generar cliente Prisma
npm run db:push      # Sincronizar base de datos
npm run db:studio    # Abrir Prisma Studio
```

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Deploy automático en cada push

### Variables de entorno para producción:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clerk_publishable_key_produccion
CLERK_SECRET_KEY=tu_clerk_secret_key_produccion
DATABASE_URL=tu_url_base_datos_produccion
```

## 📊 Monitoreo y Analytics

- **Vercel Analytics**: Métricas de rendimiento
- **Clerk Dashboard**: Análisis de autenticación
- **Prisma Studio**: Gestión de base de datos

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/samueelperez/scoutea/issues)
- **Email**: [Tu email]

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework de React
- [Clerk](https://clerk.com/) - Autenticación
- [Prisma](https://www.prisma.io/) - ORM
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
