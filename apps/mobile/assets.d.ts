// This declaration is needed for TypeScript to understand .ttf file imports.
declare module "*.ttf" {
  // What Metro (React Native bundler) gives you for assets:
  const asset: number;
  export default asset;
}

// This declaration is needed for TypeScript to understand .png file imports.
declare module "*.png" {
  // What Metro returns for images; works fine with Image source props.
  const asset: number;
  export default asset;
}

// add jpg / jpeg support
declare module "*.jpg" {
  const asset: number;
  export default asset;
}
declare module "*.jpeg" {
  const asset: number;
  export default asset;
}

// (optional) other common static assets you might import later
declare module "*.gif" {
  const asset: number;
  export default asset;
}
declare module "*.webp" {
  const asset: number;
  export default asset;
}

// SVG asset support (handled via react-native-svg-transformer)
declare module "*.svg" {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.ComponentType<SvgProps>;
  export default content;
}
