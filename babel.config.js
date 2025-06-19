module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel', // CRITICAL: Required for Expo Router to work
    ],
  };
};