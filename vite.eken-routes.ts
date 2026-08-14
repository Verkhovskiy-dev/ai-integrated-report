import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const REGISTRY_PATH = path.resolve(import.meta.dirname, "client", "src", "data", "ekenRoutes.json");

export function emitEkenRouteRegistry(): Plugin {
  return {
    name: "emit-eken-route-registry",
    buildStart() {
      this.addWatchFile(REGISTRY_PATH);
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "data/eken-routes.json",
        source: fs.readFileSync(REGISTRY_PATH, "utf8"),
      });
    },
  };
}
