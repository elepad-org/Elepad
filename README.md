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

Elepad ofrece una interfaz intuitiva diseñada para todas las edades. Por ahora solo estará disponible en Android.

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
  - [Backlog](https://github.com/users/elepad/projects/1/views/3).
  - [Roadmap](https://github.com/users/elepad/projects/1/views/2) (avance del proyecto).
  - [Tablero de la release actual](https://github.com/users/elepad/projects/1/views/1).
- **Diseño**
  - [Canva](https://www.canva.com/design/DAGtndSDPec/fhyqoHBOG9PvgYRHk9xqmA) (User Story Map).
  - [Figma](https://www.figma.com/design/rQOZ89Fed9UmfvBsExJyAo/Elepad-Mobile-App) (mockups de las vistas principales).

En cada release se subirán sus historias de usuario al [listado de Issues](https://github.com/elepad/Elepad/issues?q=is%3Aissue) de este repositorio.

## 👨‍💻 Desarrollo

Se aplicarán **técnicas ágiles** y **prácticas DevOps** en el desarrollo de Elepad para trabajar de manera productiva y asincrónica. Los cinco miembros del equipo se comunicarán constantemente el progreso del proyecto.

### 🚀 Cómo Levantar la Aplicación

1. Instalar dependencias y configurar Supabase:

    ```bash
    npm install
    npx supabase login
    npx supabase link --project-ref sdnmoweppzszpxyggdyg
    npx supabase db reset
    npx supabase start
    ```

2. Levantar la app en modo desarrollo:

    ```bash
    npx supabase start
    npm run dev
    ```

3. Compilar y ejecutar la versión buildeada:

    ```bash
    npm run build
    npm run start
    ```

Si se desea utilizar el **devcontainer** configurado, se debe agregar `sudo` a algunos comandos de `supabase` ya que la CLI también gestiona contenedores.

### 🔨 Herramientas

- **Lenguajes, frameworks y librerías**: Nodejs, TypeScript, React Native, Expo, React Native Paper, Hono.
- **Dev tools**: npm, Turborepo, eslint, Prettier, OpenAPI, orval.
- **Servicios**: [Supabase](https://supabase.com/dashboard/project/sdnmoweppzszpxyggdyg) (Database, Storage, Auth, Edge Functions).

### 📂 Estructura del Repositorio

```yaml
├── apps            # Aplicaciones
│   ├── api           # Servidor back end con Hono y OpenAPI
│   └── mobile        # App móvil con React Native y Expo
├── packages        # Paquetes comunes a las aplicaciones
│   ├── api-client    # Hooks de Tanstack Query generados con orval
│   └── assets        # Imágenes de la marca Elepad
└── supabase        # Gestionar Supabase en local
    └── migrations
```

Utilizamos una estructura de monorepo con [Turborepo](https://turborepo.com/docs) como sistema de build. Esto permite ejecutar procesos en varias subcarpetas a la vez. Con un solo comando `turbo run dev` se levanta el servidor back end y la app mobile.

El código de `packages/api-client` es autogenerado. Al utilizar el comando `npm run dev`:

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
- `chore/`: para tareas que no implican cambios en el código, como actualización de dependencias o documentación (por ejemplo, `chore/update-deps`).

Referencia: [https://conventional-branch.github.io/](https://conventional-branch.github.io/).

En lo posible, los **mensajes de commits** tendrán la estructura `<type>: <description>` donde:

- `<type>`: indica el tipo de cambio. Puede ser `fix`, `feat`, `refactor`, `docs`, `test`, `ci`, etc.
- `<description>`: es un breve resumen de los cambios. Se escribe en infinitivo, describiendo lo que el commit va a hacer.

Referencia: [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/).

Si en el código hay deuda técnica o cambios pendientes, se lo debe señalar con un comentario que diga `// TODO: ...` para que luego se lo pueda encontrar fácilmente. Ej: `// TODO: reduce this method's time complexity to O(n)`.
