// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable Node-style imports required by Supabase on Web
config.resolver.extraNodeModules = {
  stream: require.resolve('readable-stream'),
  crypto: require.resolve('crypto-browserify'),
  buffer: require.resolve('buffer'),
  util: require.resolve('util'),
};

// Enable require.context for Expo Router (critical for route discovery)
config.transformer.unstable_allowRequireContext = true;

// Additional resolver settings for better compatibility
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Ensure proper file extensions are recognized
config.resolver.sourceExts.push('tsx', 'ts', 'jsx', 'js', 'json');
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg');

module.exports = config;