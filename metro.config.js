const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure Metro watches the correct directories
config.watchFolders = [__dirname];

// Configure resolver to handle the app directory properly
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Add symlinks and package exports support for better module resolution
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

module.exports = config;