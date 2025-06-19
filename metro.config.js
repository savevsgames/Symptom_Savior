// metro.config.js
const { getDefaultConfig } = require('expo-router/metro'); // 👈 change this line

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/* ------------------------------------------------------------------ */
/* Everything you added for polyfills and symlinks can stay as-is.     */
/* ------------------------------------------------------------------ */

// Enable Node-style imports required by Supabase on Web
config.resolver.extraNodeModules = {
  stream: require.resolve('readable-stream'),
  crypto: require.resolve('crypto-browserify'),
  buffer: require.resolve('buffer'),
  util: require.resolve('util'),
};

// Optional tweaks you had before
config.transformer.unstable_allowRequireContext = true;   // already true in router preset, but harmless
config.resolver.unstable_enableSymlinks      = true;
config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.push('tsx', 'ts', 'jsx', 'js', 'json');
config.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'webp', 'svg');

module.exports = config;
