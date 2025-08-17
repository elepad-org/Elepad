# 🐘 Elepad

# 🐘 Elepad

<p align="center">
  <b>¡Conectá con tus seres queridos mediante amor y tecnología!</b>
</p>

<p align="center">
  <img src="packages/assets/ele-excited.png" alt="Ele, el elefante de Elepad" width="200" />
</p>

Elepad es una aplicación móvil diseñada para fortalecer la conexión entre adultos mayores y sus familias a través de una plataforma intuitiva y fácil de usar.

1. 📱 Descargá Elepad desde la Play Store.
2. 👨‍👩‍👧‍👦 Creá un grupo familiar.
3. 📆 Registrá actividades en tu calendario semanal.
4. 🧩 Resolvé desafíos para ejercitar la mente.
5. 🎯 ¡Conectá con tus seres queridos mediante amor y tecnología!

Elepad ofrece una interfaz intuitiva diseñada para todas las edades. Por ahora solo estará disponible en Android.

¿Tenés preguntas o sugerencias? ¡Nos encantaría escucharte!

- Email: [proyectoelepad@gmail.com](mailto:proyectoelepad@gmail.com)
- Sitio web: pendiente...

## 🗺️ Proyecto

La planificación del proyecto se puede ver en varias partes:

- [Carpeta de Google Drive](https://drive.google.com/drive/folders/198iZvngiNkAGevNMSZ7UdcGgAXYiP7KN).
  - [Especificación de Requisitos de Software](https://docs.google.com/document/d/1R3vB02NTxqxi9H_KYEBNzvEl6xEbmV-Q1nAyWVGubfI).
  - [Planificación](https://docs.google.com/document/d/1NqHx6Go_-peDly_qNYltLgTfeM6FCRMo5ZNa35w0yvI).
  - [Diagramas técnicos](https://drive.google.com/file/d/1_6j1oftihcGSm7DQh2r-obAzsL51-S-g/view?usp=sharing) (tiene un DER).
- [GitHub](https://github.com/elepad/Elepad)
  - [Backlog](https://github.com/users/elepad/projects/1/views/3).
  - [Roadmap](https://github.com/users/elepad/projects/1/views/3).
  - [Tablero de la release actual](https://github.com/users/elepad/projects/1/views/3).
- [Canva](https://www.canva.com/design/DAGtndSDPec/fhyqoHBOG9PvgYRHk9xqmA/edit?utm_content=DAGtndSDPec&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton) (tiene un User Story Map).
- [Figma](https://www.canva.com/design/DAGtndSDPec/fhyqoHBOG9PvgYRHk9xqmA) (mockups de vistas principales).

Cada historia de usuario planificada se puede ver en el [listado de Issues](https://github.com/elepad/Elepad/issues?q=is%3Aissue) de este repositorio.

## 🚀 Cómo Levantar la Aplicación

Para levantar la app en un entorno de desarrollo:

```bash
npm install
npm run dev
```

Se utiliza Turborepo (`turbo`) como sistema de build para levantar con un solo comando todos los componentes de la aplicación.

Para buildear y ejecutar la app:

```bash
npm install
npm run build
npm run start
```

## 🧑‍💻 Flujo de Trabajo

Se aplicarán **prácticas de DevOps** en el desarrollo de Elepad para poder trabajar de manera productiva y asincrónica. Dado que los cinco miembros del equipo cursamos múltiples materias juntos, constantemente se comunica el progreso del proyecto.

### 🔨 Herramientas

Servicios de terceros:

- [Supabase](https://supabase.com/dashboard/project/sdnmoweppzszpxyggdyg).
  - Database: una base de datos PostgreSQL gestionada.
  - Storage: para audios, imagenes, videos.
  - Auth: para autenticar usuarios.
  - Edge Functions: para ejecutar llamadas a la API.

Herramientas de desarrollo:

- npm: gestor de paquetes.
- Turborepo: build system para el monorepo.
- eslint: linter de JavaScript.
- Pendiente...

### 📂 Estructura del Repositorio

Estructura de monorepo:

```yaml
├── apps          # Aplicaciones
│   ├── api           # Servidor backend con Hono y OpenAPI
│   └── mobile        # App móvil con React Native y Expo
└── packages      # Paquetes comunes a las aplicaciones
    ├── api-client    # Hooks de Tanstack Query generados con `orval`
    └── assets        # Imágenes de Elepad
```

Utilizamos Turborepo (un sistema de build) para ejecutar procesos en varias subcarpetas a la vez.

El código de `packages/api-client` es autogenerado utilizando `orval`. Al utilizar el comando `npm run dev`:

1. Cuando `apps/api` detecta un cambio en algún archivo, ejecuta su `scripts/emit-openapi.ts` para generar el archivo `openapi.json`.
2. Cuando `packages/api-client` detecta un cambio en `openapi.json`, regenera el código del cliente en `src/gen/`.
3. `apps/mobile` utiliza `packages/api-client` como dependencia.

### ✅ Convenciones

Si bien la planificación se debe documentar en español, en lo posible se intentará **desarrollar en inglés** con el objetivo de adoptar convenciones de la industria.

Siempre que sea conveniente se utilizará la siguiente **estructura de ramas**:

- `prod`: la rama con el código fuente a desplegar.
- `main`: la rama principal de desarrollo.
- `feature/`: para nuevas funcionalidades y cambios (por ejemplo, `feature/add-login`).
- `bugfix/`: para correcciones de errores (por ejemplo, `bugfix/fix-header-bug`).
- `hotfix/`: para correcciones urgentes (por ejemplo, `hotfix/security-patch`).
- `chore/`: para tareas que no implican cambios en el código, como actualización de dependencias o documentación (por ejemplo, `chore/update-deps`).

Referencia: [https://conventional-branch.github.io/](https://conventional-branch.github.io/).

En lo posible, los **mensajes de commits** tendrán la estructura `<type>: <description>` donde:

- `<type>`: indica el tipo de cambio. Puede ser `fix`, `feat`, `refactor`, `docs`, `test`, `ci`, etc.
- `<description>`: es un breve resumen de los cambios. Se escribe en infinitivo, describiendo lo que el commit va a hacer.

Referencia: [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/).

Si en el código hay deuda técnica o cambios pendientes, se lo puede señalar con un comentario que diga `// TODO: ...`. Ej: `// TODO: optimize this method`.
