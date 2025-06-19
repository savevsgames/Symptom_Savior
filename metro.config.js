const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// CRITICAL: Enable require.context for Expo Router
config.transformer.unstable_allowRequireContext = true;

// Enable symlinks and package exports for proper module resolution
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Provide Node.js polyfills for web compatibility (Supabase needs these)
config.resolver.extraNodeModules = {
  stream: require.resolve('readable-stream'),
  crypto: require.resolve('crypto-browserify'),
  buffer: require.resolve('buffer'),
  util: require.resolve('util'),
};

// Ensure proper source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'tsx',
  'ts',
  'jsx',
  'js',
  'json'
];

// Configure resolver for better module discovery
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Ensure proper asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg'
];

module.exports = config;