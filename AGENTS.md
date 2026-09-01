# Places map design decisions

- The page header leads with exactly five named trends, each with a short interpretation and affected SRT levels.
- Aggregate counts remain in the secondary statistics row below the trend panel.
- Eken-enabled places are derived from `data/eken-routes.json`; stale place identifiers must fail closed and must never redirect to a different position.
