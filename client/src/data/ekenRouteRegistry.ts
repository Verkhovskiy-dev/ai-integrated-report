import registryJson from "./ekenRoutes.json";

export interface EkenRouteRegistryEntry {
  placeId: string;
  positionRouteId: string;
  enabled: boolean;
  ctaLabel: string;
  surface: "places-map";
  sourceId: string;
  scenarioId: string;
  version: number;
  promise: string;
  artifact: string;
  estimatedMinutes: number;
  starterInputs: string[];
  successCriteria: string[];
}

export interface EkenRouteRegistry {
  schemaVersion: "1.1";
  updatedAt: string;
  routes: EkenRouteRegistryEntry[];
}

export const EKEN_ROUTE_REGISTRY = registryJson as EkenRouteRegistry;

export function getEkenRouteForPlace(placeId: string) {
  return EKEN_ROUTE_REGISTRY.routes.find((route) => route.enabled && route.placeId === placeId);
}

export function getPlaceIdsForPositionRoute(positionRouteId: string) {
  return EKEN_ROUTE_REGISTRY.routes
    .filter((route) => route.enabled && route.positionRouteId === positionRouteId)
    .map((route) => route.placeId);
}

export function buildPositionRouteHref(route: EkenRouteRegistryEntry) {
  const params = new URLSearchParams({
    place: route.placeId,
    route: route.positionRouteId,
    source: "places",
  });

  return `/positions?${params.toString()}`;
}
