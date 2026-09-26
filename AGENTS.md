# Route maintenance decisions

## Repository skills

- For adding or changing site action buttons, CTA controls and news reactions,
  use `$site-buttons` at `.agents/skills/site-buttons/SKILL.md`.
  If the session has not discovered the skill yet, read that file directly.
  Creating a button does not by itself authorize deployment or production test writes.

- `client/src/data/ekenRoutes.json` is the single source of truth for the Places map to Position journey.
- Every enabled route must reference a currently published place ID and resolve to exactly one matching position route.
- Until Eken exposes the public tokenized handoff endpoint, the Position screen transfers the Eken-compatible core brief in the URL fragment. Dashboard-only fields and self-assessment are excluded from that transport.
