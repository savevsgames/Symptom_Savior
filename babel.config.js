module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Note: expo-router/babel plugin is deprecated in Expo Router 5.x
    // The router preset handles this automatically
  };
};