/*
 * ProgramBadge — renders a SKOLKOVO program link as a styled inline badge
 * Used across dashboard sections to natively embed program references
 */
import { ExternalLink } from "lucide-react";
import { SKOLKOVO_PROGRAMS, type ProgramLink } from "@/data/insightsData";

interface ProgramBadgeProps {
  programKey: string;
  compact?: boolean;
}

export function ProgramBadge({ programKey, compact = false }: ProgramBadgeProps) {
  const program = SKOLKOVO_PROGRAMS[programKey];
  if (!program) return null;

  return (
    <a
      href={program.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        inline-flex items-center gap-1 rounded-md border transition-all duration-200
        border-primary/25 bg-primary/8 hover:bg-primary/15 hover:border-primary/40
        text-primary hover:text-primary/90 no-underline group
        ${compact ? "px-1.5 py-0.5 text-[9px] sm:text-[10px]" : "px-2 py-0.5 text-[10px] sm:text-xs"}
      `}
      title={program.name}
    >
      <span className="font-medium">{program.shortName || program.name}</span>
      <ExternalLink className={`${compact ? "w-2 h-2 sm:w-2.5 sm:h-2.5" : "w-2.5 h-2.5 sm:w-3 sm:h-3"} opacity-50 group-hover:opacity-80 transition-opacity`} />
    </a>
  );
}

interface ProgramBadgeGroupProps {
  programKeys: string[];
  compact?: boolean;
  label?: string;
}

export function ProgramBadgeGroup({ programKeys, compact = false, label }: ProgramBadgeGroupProps) {
  const validKeys = programKeys.filter((k) => SKOLKOVO_PROGRAMS[k]);
  if (validKeys.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {label && (
        <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider mr-0.5">
          {label}
        </span>
      )}
      {validKeys.map((key) => (
        <ProgramBadge key={key} programKey={key} compact={compact} />
      ))}
    </div>
  );
}
