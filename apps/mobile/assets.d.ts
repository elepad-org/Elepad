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
