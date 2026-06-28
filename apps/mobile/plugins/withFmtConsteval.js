const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// The `fmt` library (v11) bundled via React Native uses `consteval` behind
// FMT_STRING. The clang shipped in recent Xcode (16.3+/26.x) rejects it as
// "not a constant expression", failing the iOS build in format-inl.h.
//
// fmt's base.h decides FMT_USE_CONSTEVAL with a bare `#define ... 1` under the
// `__cpp_consteval` / clang-version branches (NOT guarded by #ifndef), so an
// external -D or a prepended define gets overwritten. We instead rewrite those
// `#define FMT_USE_CONSTEVAL 1` lines to `0` directly, from the Podfile's
// post_install hook — which runs *after* pods are downloaded, so the edit lands
// on the real header Xcode compiles. The Podfile is regenerated on every
// prebuild, so we inject the hook here.
const MARKER = "withFmtConsteval";
const SNIPPET = `
    # ${MARKER}: force fmt's FMT_USE_CONSTEVAL=0 (consteval is rejected by recent clang).
    fmt_base = File.join(__dir__, 'Pods', 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      fmt_text = File.read(fmt_base)
      fmt_patched = fmt_text.gsub('#  define FMT_USE_CONSTEVAL 1', '#  define FMT_USE_CONSTEVAL 0')
      File.write(fmt_base, fmt_patched) if fmt_patched != fmt_text
    end
`;

module.exports = function withFmtConsteval(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      let contents = fs.readFileSync(podfilePath, "utf8");
      if (!contents.includes(MARKER)) {
        contents = contents.replace(
          /(post_install do \|installer\|\n)/,
          `$1${SNIPPET}`,
        );
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
};
