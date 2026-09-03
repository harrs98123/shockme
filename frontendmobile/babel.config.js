module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // babel-preset-expo v54 automatically appends `react-native-worklets/plugin`
    // (Reanimated 4's worklet transform) because `react-native-worklets` is
    // installed — it must stay last, so do not add it again here.
  };
};
