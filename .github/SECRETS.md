# Configuración de Secrets para GitHub Actions

Este documento explica cómo configurar los secrets necesarios para el despliegue automático en Vercel.

## Secrets Requeridos

Para que el workflow de CI/CD funcione correctamente, necesitas configurar los siguientes secrets en tu repositorio de GitHub:

### 1. VERCEL_TOKEN
- **Descripción**: Token de autenticación de Vercel
- **Cómo obtenerlo**:
  1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
  2. Ve a Settings > Tokens
  3. Crea un nuevo token con permisos de deploy
  4. Copia el token generado

### 2. VERCEL_ORG_ID
- **Descripción**: ID de la organización en Vercel
- **Cómo obtenerlo**:
  1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
  2. Ve a Settings > General
  3. Copia el "Team ID" o "Personal Account ID"

### 3. VERCEL_PROJECT_ID
- **Descripción**: ID del proyecto en Vercel
- **Cómo obtenerlo**:
  1. Ve a tu proyecto en Vercel Dashboard
  2. Ve a Settings > General
  3. Copia el "Project ID"

## Cómo Configurar los Secrets

1. Ve a tu repositorio en GitHub
2. Ve a Settings > Secrets and variables > Actions
3. Haz clic en "New repository secret"
4. Agrega cada uno de los secrets mencionados arriba

## Verificación

Una vez configurados los secrets, el workflow debería ejecutarse sin errores cuando:
- Se haga push a la rama `main`
- Se cree un pull request hacia `main`

## Troubleshooting

Si el despliegue falla:
1. Verifica que todos los secrets estén configurados correctamente
2. Asegúrate de que el token de Vercel tenga los permisos necesarios
3. Revisa los logs del workflow en la pestaña "Actions" de GitHub
