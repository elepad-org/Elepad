# 🐘 Elepad

<p align="center">
  <b>¡Conectá con tus seres queridos mediante amor y tecnología!</b>
</p>

<p align="center">
  <img src="packages/assets/ele-excited.png" alt="Ele, el elefante de Elepad" width="200" />
</p>

Elepad es una aplicación móvil diseñada para que los adultos mayores se mantengan conectados con sus familias, compartiendo actividades, recuerdos y desafíos cognitivos en una plataforma intuitiva.

1. 📱 Descargá Elepad desde la Play Store.
2. 👨‍👩‍👧‍👦 Creá un grupo familiar.
3. 📆 Registrá actividades en tu calendario semanal.
4. 🧩 Resolvé desafíos para ejercitar la mente.
5. 🎯 ¡Conectá con tus seres queridos mediante amor y tecnología!

Elepad ofrece una interfaz diseñada para todas las edades.

¿Tenés preguntas o sugerencias? ¡Nos encantaría escucharte!

- Email: [proyectoelepad@gmail.com](mailto:proyectoelepad@gmail.com)
- Sitio web: pendiente...

## 🗺️ Proyecto

La planificación del proyecto se puede ver en varias partes:

- **Planificación**
  - [Especificación de Requisitos de Software](https://docs.google.com/document/d/1R3vB02NTxqxi9H_KYEBNzvEl6xEbmV-Q1nAyWVGubfI).
  - [Planificación](https://docs.google.com/document/d/1NqHx6Go_-peDly_qNYltLgTfeM6FCRMo5ZNa35w0yvI).
  - [Diagramas técnicos](https://drive.google.com/file/d/1_6j1oftihcGSm7DQh2r-obAzsL51-S-g) (DER).
- **Gestión del proyecto**
  - [Backlog](https://github.com/orgs/elepad-org/projects/2/views/3).
  - [Roadmap](https://github.com/orgs/elepad-org/projects/2/views/2) (avance del proyecto).
  - [Tablero](https://github.com/orgs/elepad-org/projects/2/views/1) (de la release actual).
- **Diseño**
  - [Canva](https://www.canva.com/design/DAGtndSDPec/fhyqoHBOG9PvgYRHk9xqmA/edit) (User Story Map).
  - [Figma](https://www.figma.com/design/rQOZ89Fed9UmfvBsExJyAo/Elepad-Mobile-App) (mockups de las vistas principales).

En cada release se subirán sus historias de usuario al [listado de Issues](https://github.com/elepad-org/Elepad/issues?q=is%3Aissue) de este repositorio.

## 👨‍💻 Desarrollo

Se aplicarán **técnicas ágiles** y **prácticas DevOps** para trabajar de manera productiva y asincrónica. Los cinco miembros del equipo se mantendrán en comunicación constante durante el el desarrollo de Elepad.

### 📂 Estructura del Repositorio

```yaml
├── apps            # Aplicaciones
│   ├── api           # Servidor back end con Hono y OpenAPI
│   └── mobile        # App móvil con React Native y Expo
├── packages        # Paquetes comunes a las aplicaciones
│   ├── api-client    # Hooks de Tanstack Query generados con orval
│   └── assets        # Imágenes de la marca Elepad
└── supabase        # Gestionar Supabase en entorno local
    └── migrations
```

Utilizamos una estructura de monorepo con [Turborepo](https://turborepo.com/docs) como sistema de build. Esto permite ejecutar procesos en varias subcarpetas a la vez. Con un solo comando `turbo run dev` se levanta el servidor back end y la app mobile a la vez.

El código de `packages/api-client` es autogenerado por orval, una herramienta que lee la descripción OpenAPI (en formato JSON) de nuestra API para generar un cliente con Tanstack Query.

### ✅ Convenciones

Si bien la planificación se debe documentar en español, en lo posible se intentará **desarrollar en inglés** para adoptar convenciones de la industria.

Los GitHub Issues se pueden referenciar en commits: si hacemos `git commit -m "feat: implement #3"`, el `#3` será un enlace al Issue número 3 (elepad-org/Elepad#3).

En lo posible, los **mensajes de commits** tendrán la estructura `<type>: <description>` donde:

- `<type>`: indica el tipo de cambio. Puede ser `fix`, `feat`, `refactor`, `docs`, `test`, `ci`, etc.
- `<description>`: es un breve resumen de los cambios. Se escribe en infinitivo, describiendo lo que el commit va a hacer.

Referencia: [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/).

Siempre que sea conveniente se utilizará la siguiente **estructura de ramas**:

- `main`: la rama principal a donde apuntan las PRs. Debe tener cógido funcional ya que será desplegado.
- `feature/`: para nuevas funcionalidades y cambios (por ejemplo, `feature/add-login`).
- `bugfix/`: para correcciones de errores (por ejemplo, `bugfix/fix-header-bug`).
- `chore/`: para tareas que no implican cambios en el código, como actualización de dependencias o documentación (por ejemplo, `chore/update-deps`).

Referencia: [https://conventional-branch.github.io/](https://conventional-branch.github.io/).

Las ramas se unen a main mediante Pull Requests. Es recomendable tildar la opción "Squash commits" al completar una PR para que el historial de commits sea más legible.

Si en el código hay deuda técnica o cambios pendientes, se lo debe señalar con un comentario que diga `// TODO: ...` para que luego se lo pueda encontrar fácilmente. Ej: `// TODO: optimize this method's time complexity to O(n)`.

### 🔨 Herramientas

- **Lenguajes, frameworks y librerías**: Node.js, TypeScript, Hono, React Native, React Native Paper, Expo.
- **Dev tools**: npm, Turborepo, eslint, Prettier, OpenAPI.
- **Servicios**: [Supabase](https://supabase.com/dashboard/project/sdnmoweppzszpxyggdyg) (Database, Storage, Auth), [Google Cloud](https://console.cloud.google.com/auth/clients?project=elepad-mobile) (OAuth), [Expo EAS](https://expo.dev/accounts/elepad-org/projects/elepad), [Cloudflare Workers](https://dash.cloudflare.com/6eee324495e2fe7945478ecec8158c8e/workers-and-pages).

## 🚀 Despliegue

A continuación se muestra cómo configurar el entorno de desarrollo,

### 🏗️ Entorno de Desarrollo

Pasos manuales previos:

- Configurar un OAuth Client en Google Cloud para referenciar el client ID en la variable de entorno SUPABASE_AUTH_GOOGLE_CLIENT_ID.
- Crear un proyecto en Supabase para vincularlo desde la `supabase` CLI.

1. Definir archivos `.env` con variables de entorno según los siguientes archivos de ejemplo:

   ```bash
   # apps/api/.env.example
   # apps/mobile/.env.example
   # supabase/.env.example
   ```

2. Instalar dependencias y configurar Supabase:

   ```bash
   npm install
   npx supabase login
   npx supabase link --project-ref sdnmoweppzszpxyggdyg
   ```

   Se usa un [proyecto de desarrollo](https://supabase.com/dashboard/project/sdnmoweppzszpxyggdyg) de Supabase. Si se prefiere tener un stack local propio con Docker, se puede ejecutar `npx supabase start` para levantarlo y `npx supabase db pull` para actualizar la base de datos local.
   Nota: para el despliegue se utiliza otro [proyecto de producción](https://supabase.com/dashboard/org/oabegetinldkjgxchssx).

3. Levantar la app en modo desarrollo:

   ```bash
   npm run dev
   ```

4. Compilar y ejecutar la versión buildeada:

   ```bash
   npm run build
   npm run start
   ```

Si se desea trabajar desde el **devcontainer** configurado, se debe agregar `sudo` a algunos comandos de `supabase` ya que la CLI gestiona contenedores por fuera del contenedor.

### 📦 Despliegue Manual

Para desplegar la aplicación a la nube por primera vez es necesario realizar algunos pasos a mano. Se asume que:

- Ya se tiene un entorno de desarrollo configurado.
- Ya está creado el OAuth Client en Google Cloud.
- Ya está creado el proyecto en Supabase.

Es necesario:

1. Crear una cuenta en Cloudflare para poder desplegar la API en un [Cloudflare Worker](https://dash.cloudflare.com/6eee324495e2fe7945478ecec8158c8e/workers/services/view/api/production/metrics). Luego, ejecutar:

   ```bash
   npx -w apps/api wrangler login       # Iniciar sesión en la CLI
   npx -w apps/api turbo run build:edge # Buildear la app
   npx -w apps/api wrangler deploy      # Desplegar a CF Workers
   npx -w apps/api wrangler secret put SUPABASE_URL
   npx -w apps/api wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   ```

2. Crear una cuenta en Expo Application Services (EAS) para crear un [proyecto](https://expo.dev/accounts/elepad-org/projects/elepad) y desplegar la app mobile a la web. Luego, configurar las variables de entorno en el dashboard. Finalmente, crear un nuevo despliegue con:

   ```bash
   npx -w apps/mobile eas login
   npx -w apps/mobile expo export --platform web
   npx -w apps/mobile eas deploy
   ```

### 🤖 Despliegue con GitHub Actions

Una vez que las cuentas y proyectos de cada nube están creados y configurados, se utiliza GitHub Actions como pipeline de CI/CD para despliegues automáticos. Workflows actuales:

- `deploy-api.yml`: despliega la API Hono a Cloudflare Workers.
- `deploy-mobile-web.yml`: despliega la app mobile a EAS Hosting.

Desde GitHub Actions se actualizan las variables de entorno de cada nube. Es necesario definir en este repositorio los siguientes secrets:

```bash
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
API_URL
SUPABASE_PUBLISHABLE_KEY
GOOGLE_CLIENT_ID
EAS_TOKEN
```

Aclaración: solo algunos valores son sensibles, pero por simplicidad se los maneja a todos como secrets.
