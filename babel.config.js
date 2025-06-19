module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['expo-router/babel'], // ✅ CRITICAL: This plugin is required for Expo Router
  };
};