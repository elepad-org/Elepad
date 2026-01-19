# Elepad Landing Page

Landing page del proyecto Elepad, construida con Vite, React, Material UI y Tailwind CSS.

## 🎨 Características de Diseño

- **Identidad Visual**: Usa la misma paleta de colores y fuentes que la aplicación móvil
- **Minimalista**: Diseño limpio y moderno sin degradados innecesarios
- **Responsivo**: Se adapta perfectamente a todos los tamaños de pantalla
- **Componentes Material UI**: Interfaz consistente y accesible
- **Tailwind CSS**: Estilos utilitarios para desarrollo rápido

## 🚀 Inicio Rápido

### Instalación

\`\`\`bash
npm install
\`\`\`

### Desarrollo

\`\`\`bash
npm run dev
\`\`\`

El servidor se iniciará en [http://localhost:3000](http://localhost:3000)

### Build de Producción

\`\`\`bash
npm run build
\`\`\`

### Preview del Build

\`\`\`bash
npm run preview
\`\`\`

## 📁 Estructura del Proyecto

\`\`\`
web/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx      # Barra de navegación
│   │   ├── Hero.tsx        # Sección hero principal
│   │   ├── Features.tsx    # Sección de características
│   │   ├── CTA.tsx         # Call to action
│   │   └── Footer.tsx      # Footer del sitio
│   ├── theme.ts            # Configuración del tema Material UI
│   ├── App.tsx             # Componente principal
│   ├── main.tsx            # Punto de entrada
│   └── index.css           # Estilos globales
├── tailwind.config.js      # Configuración de Tailwind
├── postcss.config.js       # Configuración de PostCSS
└── package.json
\`\`\`

## 🎨 Paleta de Colores

La landing page usa la misma paleta de colores que la app móvil:

- **Primary**: \`#9a9ece\` - Púrpura suave
- **Secondary**: \`#424a70\` - Púrpura-azul medio
- **Accent**: \`#9eadc8\` - Azul claro
- **Background**: \`#FFFFFF\` - Blanco
- **Background Secondary**: \`#F2F2F7\` - Gris claro
- **Text**: \`#000000\` - Negro
- **Text Secondary**: \`#7374a7\` - Púrpura profundo
- **Success**: \`#6B8DD6\` - Azul violáceo

## 🔧 Tecnologías

- **React 19** - Framework UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultrarrápido
- **Material UI v7** - Librería de componentes
- **Tailwind CSS** - Framework de utilidades CSS
- **Emotion** - CSS-in-JS para Material UI

## 📝 Notas de Desarrollo

- El preflight de Tailwind está deshabilitado para evitar conflictos con Material UI
- Las fuentes de Google (Montserrat) se cargan desde CDN
- Los componentes están diseñados para ser modulares y reutilizables
- El diseño sigue los principios de Material Design 3

## 🐘 ¡Elepad!

Conectando generaciones con amor 💜
