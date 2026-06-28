// Monorepo-aware Metro config (pnpm hoisted + Turborepo) with NativeWind.
// Follows Expo's official monorepo guidance: watch the workspace root and let
// Metro resolve from both the app and the hoisted root node_modules.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

// Force a single copy of React (19.0.0, from this app) for every `react` /
// `react-dom` import. The web app pins React 18, which pnpm hoists to the root
// node_modules; without this, packages that lack a nested React fall back to
// that root copy while react-native uses 19, producing the runtime error
// "Invalid hook call ... more than one copy of React".
const SINGLETON_PREFIXES = ["react", "react-dom"];
const upstreamResolveRequest = nativeWindConfig.resolver.resolveRequest;

nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  const isSingleton = SINGLETON_PREFIXES.some(
    (pkg) => moduleName === pkg || moduleName.startsWith(`${pkg}/`),
  );

  if (isSingleton) {
    try {
      return {
        type: "sourceFile",
        filePath: require.resolve(moduleName, { paths: [projectRoot] }),
      };
    } catch {
      // Fall through to default resolution if the subpath isn't resolvable.
    }
  }

  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
