module.exports = function (api) {
  api.cache(true);

  // nativewind 4.2 (via react-native-css-interop 0.2.x) injects
  // "react-native-worklets/plugin" into its babel preset. That package targets
  // reanimated 4, and its iOS pod is incompatible with this RN 0.79 / Xcode
  // toolchain (so it is intentionally not installed). reanimated 3 ships its own
  // worklet transform via react-native-reanimated/plugin, so we strip the
  // worklets entry from nativewind's preset to keep both the JS bundle and the
  // native build working.
  const nativewindPreset = require("nativewind/babel")();
  nativewindPreset.plugins = (nativewindPreset.plugins || []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return typeof name !== "string" || !name.includes("react-native-worklets");
  });

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      nativewindPreset,
    ],
    // react-native-reanimated/plugin must be listed last.
    plugins: ["react-native-reanimated/plugin"],
  };
};
