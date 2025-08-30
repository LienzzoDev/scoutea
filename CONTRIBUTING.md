# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a Scoutea! Este documento te guiará a través del proceso de contribución.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Reportar Bugs](#reportar-bugs)
- [Solicitar Funcionalidades](#solicitar-funcionalidades)
- [Preguntas Frecuentes](#preguntas-frecuentes)

## 📜 Código de Conducta

Este proyecto y todos sus participantes están gobernados por nuestro Código de Conducta. Al participar, se espera que respetes este código.

## 🚀 Cómo Contribuir

### Reportar Bugs

1. **Busca en los issues existentes** para asegurarte de que el bug no haya sido reportado ya
2. **Crea un nuevo issue** usando la plantilla de Bug Report
3. **Proporciona información detallada**:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs. actual
   - Capturas de pantalla si es aplicable
   - Información del sistema

### Solicitar Funcionalidades

1. **Busca en los issues existentes** para ver si la funcionalidad ya ha sido solicitada
2. **Crea un nuevo issue** usando la plantilla de Feature Request
3. **Describe claramente**:
   - Qué funcionalidad quieres
   - Por qué es útil
   - Cómo debería funcionar

### Contribuir con Código

1. **Fork el repositorio**
2. **Crea una rama** para tu feature/fix:
   ```bash
   git checkout -b feature/nombre-de-la-funcionalidad
   # o
   git checkout -b fix/nombre-del-bug
   ```
3. **Haz tus cambios** siguiendo los estándares de código
4. **Ejecuta los tests** localmente
5. **Commit tus cambios** con mensajes descriptivos
6. **Push a tu fork**
7. **Crea un Pull Request**

## ⚙️ Configuración del Entorno

### Requisitos

- Node.js 18+
- PostgreSQL
- Cuenta de Clerk

### Pasos de Configuración

1. **Clona tu fork**:
   ```bash
   git clone https://github.com/tu-usuario/scoutea.git
   cd scoutea
   ```

2. **Instala dependencias**:
   ```bash
   npm install
   ```

3. **Configura variables de entorno**:
   ```bash
   cp env.example .env.local
   # Edita .env.local con tus credenciales
   ```

4. **Configura la base de datos**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Ejecuta en desarrollo**:
   ```bash
   npm run dev
   ```

## 🔄 Proceso de Desarrollo

### Flujo de Trabajo

1. **Sincroniza con el repositorio principal**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Crea tu rama de feature**:
   ```bash
   git checkout -b feature/tu-funcionalidad
   ```

3. **Desarrolla y testea**:
   ```bash
   npm run dev
   npm run lint
   npm run build
   ```

4. **Commit tus cambios**:
   ```bash
   git add .
   git commit -m "feat: agregar nueva funcionalidad"
   ```

5. **Push y crea PR**:
   ```bash
   git push origin feature/tu-funcionalidad
   # Crear Pull Request en GitHub
   ```

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Cambios de formato
- `refactor:` Refactorización de código
- `test:` Agregar o corregir tests
- `chore:` Cambios en build o herramientas

## 📏 Estándares de Código

### TypeScript

- Usa tipos explícitos cuando sea posible
- Evita `any` - usa tipos específicos
- Documenta interfaces complejas

### React/Next.js

- Usa Server Components cuando sea posible
- Minimiza el uso de `'use client'`
- Sigue las mejores prácticas de Next.js 15

### Estilo de Código

- Usa Prettier para formateo
- Sigue las reglas de ESLint
- Mantén funciones pequeñas y enfocadas
- Usa nombres descriptivos para variables y funciones

### Componentes

- Usa kebab-case para nombres de archivos
- Mantén componentes pequeños y reutilizables
- Implementa loading y error states
- Usa semantic HTML

## 🧪 Testing

### Tests Unitarios

- Escribe tests para funciones utilitarias
- Testea componentes críticos
- Mantén cobertura de tests alta

### Tests de Integración

- Testea flujos completos de usuario
- Verifica que las APIs funcionen correctamente
- Testea autenticación y autorización

## 📚 Documentación

### Código

- Documenta funciones complejas
- Explica la lógica de negocio
- Mantén README actualizado

### APIs

- Documenta endpoints con ejemplos
- Explica parámetros y respuestas
- Mantén documentación de cambios

## 🔍 Revisión de Código

### Antes de Enviar PR

- [ ] Código compila sin errores
- [ ] Tests pasan localmente
- [ ] Linting pasa sin errores
- [ ] Documentación actualizada
- [ ] Cambios probados manualmente

### Durante la Revisión

- Responde a comentarios rápidamente
- Haz cambios solicitados
- Mantén la conversación constructiva

## 🚀 Despliegue

### Testing en Staging

- Los PRs se despliegan automáticamente en Vercel
- Revisa el preview deployment
- Testea funcionalidades en staging

### Despliegue a Producción

- Solo se despliega desde `main`
- Requiere aprobación de maintainers
- Se ejecutan tests automáticamente

## ❓ Preguntas Frecuentes

### ¿Cómo empiezo?

1. Revisa los issues con etiqueta "good first issue"
2. Únete a las discusiones en GitHub
3. Pregunta en los issues si tienes dudas

### ¿Qué hago si tengo problemas?

1. Revisa la documentación
2. Busca en issues existentes
3. Crea un nuevo issue con detalles

### ¿Cómo me convierto en maintainer?

- Contribuye regularmente
- Ayuda a otros contribuyentes
- Mantén alta calidad en tus contribuciones
- Contacta a los maintainers actuales

## 📞 Contacto

- **Issues**: [GitHub Issues](https://github.com/samueelperez/scoutea/issues)
- **Discussions**: [GitHub Discussions](https://github.com/samueelperez/scoutea/discussions)

---

**¡Gracias por contribuir a Scoutea! 🚀**
