const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Metro watches the correct directories
config.watchFolders = [__dirname];

// Configure resolver to handle the app directory properly
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// CRITICAL: Enable symlinks and package exports for proper module resolution
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Ensure source extensions are properly configured
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'tsx',
  'ts',
  'jsx',
  'js',
  'json'
];

// Configure transformer for proper module resolution
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

// Add resolver configuration for better module discovery
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