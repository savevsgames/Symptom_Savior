const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable require.context for Expo Router (critical for route discovery)
config.transformer.unstable_allowRequireContext = true;

// Enable Node.js polyfills for Supabase on Web
config.resolver.extraNodeModules = {
  stream: require.resolve('readable-stream'),
  crypto: require.resolve('crypto-browserify'),
  buffer: require.resolve('buffer'),
  util: require.resolve('util'),
  process: require.resolve('process/browser'),
  path: require.resolve('path-browserify'),
  os: require.resolve('os-browserify/browser'),
  fs: false, // Disable fs for web
  net: false, // Disable net for web
  tls: false, // Disable tls for web
};

// Ensure proper file extensions are recognized
config.resolver.sourceExts = [...config.resolver.sourceExts, 'tsx', 'ts', 'jsx', 'js', 'json', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ttf', 'otf', 'woff', 'woff2'];

// TypeScript paths
config.resolver.alias = {
  '@': __dirname,
};

module.exports = config;