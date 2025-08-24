// this declaration is needed for TypeScript to understand the import of .ttf files
declare module "*.ttf" {
  // What Metro (React Native bundler) gives you for assets:
  const asset: number;
  export default asset;
}

// this declaration is needed for TypeScript to understand the import of .png files
declare module "*.png" {
  // What Metro returns for images; works fine with Image source props
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
