module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],   // ✅ one-stop shop
    // plugins: ['expo-router/babel'], // ❌ deleted this line and never add it again - deprecated
  };
};
