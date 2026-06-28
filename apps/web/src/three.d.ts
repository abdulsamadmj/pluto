// @react-three/fiber v8 augments the global JSX namespace, but @types/react 19
// moved JSX to React.JSX. Re-expose the three.js intrinsic elements there so
// <mesh>, <group>, <meshStandardMaterial>, etc. typecheck.
import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
