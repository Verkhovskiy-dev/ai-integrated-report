/*
 * DESIGN: Intelligence Dashboard — Cross-Level Connections
 * Visualize connections between СРТ levels
 */
import { CROSS_LEVEL_CONNECTIONS, SRT_LEVELS } from "@/data/reportData";

const NETWORK_BG = "https://private-us-east-1.manuscdn.com/sessionFile/v7uKuw67xnKHKY8cq65BNf/sandbox/TAGv8ZfRAyZfV9Lj7wYGNr-img-3_1770928036000_na1fn_bmV0d29yay1wYXR0ZXJu.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvdjd1S3V3Njd4bktIS1k4Y3E2NUJOZi9zYW5kYm94L1RBR3Y4WmZSQXlaZlY5TGo3d1lHTnItaW1nLTNfMTc3MDkyODAzNjAwMF9uYTFmbl9ibVYwZDI5eWF5MXdZWFIwWlhKdS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=l2i1-TKPKCMxV5epfGaypgxiWzh5WCeFd2s2R3bNAROSkiBJNfFT1xLNQRZf4BETQgRn2ZaYncJNdJEliAk0m8zE5UM1t5bCEKb~9ma7~4Ow6rHxhiv7DFUUPGdhf7MzadZk4EdE0cDNu-Le-Q5L0Yl9nzxHl0SzxruaauwNoU1Fv4tkLa969kgaAQCn17eNNz7LIf-YELQ7ToSp0tFOPufwKKoU~C0pwbBWJ8-6UmMQe0cuNY7Pt-t15nlBa6q5hRVa9OkmXPLwiKzUu6f3XqMAs1osIsFWCK6w5sMyRlD0KONx7YaIpXMcp~WWW~Hghafn9K9unwR8~HLkuyYx6g__";

function getLevelColor(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.color || "#666";
}

function getLevelName(id: number): string {
  const level = SRT_LEVELS.find((l) => l.id === id);
  return level?.short || "";
}

export default function CrossLevelConnections() {
  return (
    <div className="container">
      <div className="relative overflow-hidden rounded-xl border border-border/30">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img src={NETWORK_BG} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/95 to-background" />
        </div>

        <div className="relative z-10 p-6 lg:p-10">
          <div className="mb-8">
            <p className="text-xs font-mono text-primary/70 tracking-widest uppercase mb-2">
              Межуровневые связи
            </p>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
              Каскадные эффекты между уровнями СРТ
            </h3>
            <p className="text-sm text-muted-foreground max-w-xl">
              Ключевые причинно-следственные цепочки, связывающие события на разных уровнях Структуры Разделения Труда.
            </p>
          </div>

          <div className="space-y-4">
            {CROSS_LEVEL_CONNECTIONS.map((conn) => (
              <div
                key={conn.id}
                className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-lg p-4 hover:border-primary/20 transition-all duration-300"
              >
                {/* Connection path visualization */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {/* From level */}
                  <span
                    className="text-xs font-mono font-medium px-2 py-1 rounded border"
                    style={{
                      color: getLevelColor(conn.from),
                      borderColor: `${getLevelColor(conn.from)}40`,
                      backgroundColor: `${getLevelColor(conn.from)}10`,
                    }}
                  >
                    {conn.from}·{getLevelName(conn.from)}
                  </span>

                  {/* Through levels */}
                  {conn.through.map((lvl) => (
                    <span key={lvl} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary/40" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span
                        className="text-xs font-mono px-2 py-1 rounded border"
                        style={{
                          color: getLevelColor(lvl),
                          borderColor: `${getLevelColor(lvl)}30`,
                          backgroundColor: `${getLevelColor(lvl)}08`,
                        }}
                      >
                        {lvl}·{getLevelName(lvl)}
                      </span>
                    </span>
                  ))}

                  {/* To level */}
                  <svg className="w-4 h-4 text-primary/40" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M10 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span
                    className="text-xs font-mono font-medium px-2 py-1 rounded border"
                    style={{
                      color: getLevelColor(conn.to),
                      borderColor: `${getLevelColor(conn.to)}40`,
                      backgroundColor: `${getLevelColor(conn.to)}10`,
                    }}
                  >
                    {conn.to}·{getLevelName(conn.to)}
                  </span>
                </div>

                {/* Title and description */}
                <h4 className="text-sm font-heading font-semibold text-foreground mb-1">
                  {conn.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {conn.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
