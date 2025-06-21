const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

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

// Enable require.context for Expo Router (critical for route discovery)
config.transformer.unstable_allowRequireContext = true;

// Additional resolver settings for better compatibility
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Ensure proper file extensions are recognized
config.resolver.sourceExts = [...config.resolver.sourceExts, 'tsx', 'ts', 'jsx', 'js', 'json', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ttf', 'otf', 'woff', 'woff2'];

// Web-specific optimizations
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native$': 'react-native-web',
    'react-native-svg': 'react-native-svg/lib/commonjs/ReactNativeSVG.web.js',
  };
  
  // Optimize for web builds
  config.transformer.minifierConfig = {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  };
}

// Improve performance for large projects
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Handle TypeScript paths
config.resolver.alias = {
  ...config.resolver.alias,
  '@': __dirname,
};

// Exclude problematic modules from bundling
config.resolver.blockList = [
  // Add any problematic modules here if needed
];

// Optimize caching
config.cacheStores = [
  {
    name: 'filesystem',
    options: {
      cacheDirectory: '.metro-cache',
    },
  },
];

// Handle React Native Reanimated worklets
config.transformer.unstable_allowRequireContext = true;

module.exports = config;