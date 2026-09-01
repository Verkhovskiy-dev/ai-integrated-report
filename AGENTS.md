# Route maintenance decisions

- `client/src/data/ekenRoutes.json` is the single source of truth for the Places map to Position journey.
- Every enabled route must reference a currently published place ID and resolve to exactly one matching position route.
- Until Eken exposes the public tokenized handoff endpoint, the Position screen transfers the Eken-compatible core brief in the URL fragment. Dashboard-only fields and self-assessment are excluded from that transport.
