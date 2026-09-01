const DEFAULT_EKEN_INTEGRATION_URL =
  "https://app.ekenlab.com/integrations/verkhovskiy";
const DEFAULT_EKEN_HANDOFF_API_URL =
  "https://app.ekenlab.com/api/integrations/verkhovskiy/handoffs";
const HANDOFF_TIMEOUT_MS = 8_000;

export function buildEkenIntegrationUrl(handoffToken: string) {
  const baseUrl =
    import.meta.env.VITE_EKEN_INTEGRATION_URL?.trim() ||
    DEFAULT_EKEN_INTEGRATION_URL;
  const url = new URL(baseUrl);
  url.searchParams.set("handoffToken", handoffToken);
  return url.toString();
}

/**
 * Working PositionRouteV1 transport supported by the current Eken frontend.
 * The fragment is not sent with the HTTP request; Eken stores it in session
 * before authentication and removes it from the address bar.
 */
export function buildEkenFragmentUrl(payload: unknown) {
  const baseUrl = import.meta.env.VITE_EKEN_INTEGRATION_URL?.trim()
    || DEFAULT_EKEN_INTEGRATION_URL;
  return `${baseUrl}#route=${encodeURIComponent(JSON.stringify(payload))}`;
}

export class HandoffServiceError extends Error {
  constructor(
    message: string,
    readonly kind: "network" | "timeout" | "service" | "invalid-response",
  ) {
    super(message);
    this.name = "HandoffServiceError";
  }
}

export interface CreatedEkenHandoff {
  handoffToken: string;
  redirectUrl: string;
}

export interface EkenCompatibilityReference {
  routeId: string;
  scenarioId: string;
  sourceId: string;
  surface: "hero" | "event" | "insight" | "trend" | "model" | "position";
}

/**
 * Explicit degraded-mode link. It carries identifiers only: never the brief,
 * evidence, audience, source title, or other user-entered content.
 */
export function buildEkenCompatibilityUrl(reference: EkenCompatibilityReference) {
  const baseUrl = import.meta.env.VITE_EKEN_INTEGRATION_URL?.trim()
    || DEFAULT_EKEN_INTEGRATION_URL;
  const url = new URL(baseUrl);
  url.searchParams.set("integrationVersion", "2");
  url.searchParams.set("routeId", reference.routeId);
  url.searchParams.set("scenarioId", reference.scenarioId);
  url.searchParams.set("sourceId", reference.sourceId);
  url.searchParams.set("surface", reference.surface);
  url.searchParams.set("handoffStatus", "local-preview");
  return url.toString();
}

function handoffEndpoint() {
  return import.meta.env.VITE_EKEN_HANDOFF_API_URL?.trim()
    || DEFAULT_EKEN_HANDOFF_API_URL;
}

async function postHandoff(payload: unknown): Promise<CreatedEkenHandoff> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), HANDOFF_TIMEOUT_MS);
  try {
    const response = await fetch(handoffEndpoint(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new HandoffServiceError(`Handoff service returned ${response.status}`, "service");
    }
    const body = await response.json() as { handoffToken?: unknown };
    if (typeof body.handoffToken !== "string" || !body.handoffToken.trim()) {
      throw new HandoffServiceError("Handoff service response has no token", "invalid-response");
    }
    return {
      handoffToken: body.handoffToken,
      redirectUrl: buildEkenIntegrationUrl(body.handoffToken),
    };
  } catch (error) {
    if (error instanceof HandoffServiceError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new HandoffServiceError("Handoff request timed out", "timeout");
    }
    throw new HandoffServiceError("Handoff service is unavailable", "network");
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export async function createEkenHandoff(payload: unknown): Promise<CreatedEkenHandoff> {
  try {
    return await postHandoff(payload);
  } catch (error) {
    if (!(error instanceof HandoffServiceError) || error.kind !== "network") throw error;
    return postHandoff(payload);
  }
}
