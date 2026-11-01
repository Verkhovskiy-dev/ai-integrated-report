import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Briefcase, AlertTriangle, TrendingUp, CircleHelp, ArrowRight, Eye } from 'lucide-react';
import type { ExecutiveLookup, NewsImportance } from '@/data/newsContract';
import { executiveSafeDescription, importanceLabel } from '@/data/newsContract';
import { visibleNewsSources } from '@/data/inlineNews';
import { ShareButton } from '@/components/ShareableBlock';
import { buildShareId } from '@/lib/share';
import NewsReactions from '@/components/NewsReactions';
import './inline-news.css';

interface Props {
  item: {
    title: string;
    description: string;
    fact?: string;
    sources: string[];
    level: number;
    levelName: string;
    importance?: NewsImportance | null;
    related_levels?: number[];
    srt_significance?: string;
    why_important?: string;
    watch_next?: string | string[];
  };
  executive?: ExecutiveLookup;
  loading: boolean;
  isEn: boolean;
  accentColor: string;
  rank?: number;
}

/** Expandable news card with progressive multi-step disclosure. */
export default function InlineNewsCard({ item, executive, loading, isEn, accentColor, rank }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const id = buildShareId('news', item.title);
  const sources = visibleNewsSources(item.sources);
  const shareDescription = executiveSafeDescription(item, executive, true);

  const explanation = executive?.status === 'available' ? executive.explanation : undefined;

  // Determine what to show in expanded state
  const whatHappened = explanation?.what_happened?.trim() || item.fact?.trim() || item.description?.trim();
  const whyImportant = explanation?.why_important?.trim() || item.why_important?.trim();
  const businessImpact = explanation?.business_impact?.trim();
  const uncertainty = explanation?.uncertainty?.trim();
  const srtSignificance = item.srt_significance?.trim() || whyImportant;

  // Teaser line for collapsed state (shown below title)
  const teaserText = item.srt_significance?.trim() || item.why_important?.trim();

  // Watch next section
  const watchNext = Array.isArray(item.watch_next) 
    ? item.watch_next.filter(s => s?.trim()).map(s => s.trim())
    : item.watch_next?.trim() ? [item.watch_next.trim()] : [];

  // Don't show duplicate text
  const shouldShowWhatHappened = whatHappened && whatHappened !== item.title;
  const hasAnyContent = shouldShowWhatHappened || srtSignificance || businessImpact || uncertainty || watchNext.length > 0 || sources.length > 0;

  const toggleExpanded = () => {
    if (hasAnyContent) {
      setIsExpanded(!isExpanded);
      // Reset inner sections when collapsing
      if (isExpanded) {
        setOpenSections(new Set());
      }
    }
  };

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Format related levels as "Ур. 5 → Ур. 4"
  const formatRelatedLevels = (levels?: number[]) => {
    if (!levels || levels.length === 0) return null;
    const sorted = [...levels].sort((a, b) => b - a);
    return sorted.map(l => `${isEn ? 'Lv.' : 'Ур.'} ${l}`).join(' → ');
  };

  const relatedLevelsText = formatRelatedLevels(item.related_levels);

  return (
    <article id={id} className="inline-news-card" aria-labelledby={`${id}-headline`}>
      <div className="inline-news-accent" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      <ShareButton id={id} title={item.title} text={shareDescription === item.title ? undefined : shareDescription} compact className="absolute right-2 top-2" />

      {/* Collapsed header - always visible */}
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        disabled={!hasAnyContent}
        className={`inline-news-header ${!hasAnyContent ? 'not-expandable' : ''}`}
      >
        <div className="inline-news-meta">
          {rank != null && <span className="inline-news-rank">{rank}</span>}
          <span style={{ color: accentColor }} className="inline-news-level">
            {isEn ? 'Lv.' : 'Ур.'}{item.level} · {item.levelName}
          </span>
          {item.related_levels && item.related_levels.length > 1 && (
            <span className="inline-news-related-levels">
              {item.related_levels.filter(l => l !== item.level).map(l => (
                <span key={l} className="related-level-badge" style={{ borderColor: accentColor, color: accentColor }}>
                  {isEn ? 'Lv.' : 'Ур.'}{l}
                </span>
              ))}
            </span>
          )}
          {item.importance && <span className="inline-news-importance">{importanceLabel(item.importance, isEn)}</span>}
        </div>
        <h4 id={`${id}-headline`} className="inline-news-headline">{item.title}</h4>
        {teaserText && !isExpanded && (
          <p className="inline-news-teaser">{isEn ? 'Why it matters' : 'почему важно'}: {teaserText}</p>
        )}
        {hasAnyContent && (
          <div className="inline-news-chevron">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </button>

      {/* Step 2: Expanded content with «Что произошло» and accordion sections */}
      {isExpanded && hasAnyContent && (
        <div className="inline-news-expanded-content">
          {/* Always show «Что произошло» when expanded (Step 2) */}
          {shouldShowWhatHappened && (
            <div className="inline-news-section">
              <div className="section-icon" style={{ backgroundColor: `${accentColor}15` }}>
                <Briefcase size={12} style={{ color: accentColor }} />
              </div>
              <div className="section-text">
                <p className="section-label">{isEn ? 'What happened' : 'Что произошло'}</p>
                <p className="section-content">{whatHappened}</p>
              </div>
            </div>
          )}

          {/* Step 3: Accordion sections - each opens independently */}
          <div className="inline-news-accordion">
            {/* Significance for SRT */}
            {srtSignificance && (
              <div className="accordion-section">
                <button
                  type="button"
                  onClick={() => toggleSection('significance')}
                  aria-expanded={openSections.has('significance')}
                  className="accordion-header"
                >
                  <div className="accordion-icon" style={{ backgroundColor: '#f59e0b15' }}>
                    <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
                  </div>
                  <span className="accordion-title">{isEn ? 'Significance for SRT' : 'Значимость для СРТ'}</span>
                  {openSections.has('significance') ? (
                    <ChevronUp size={14} className="accordion-chevron" />
                  ) : (
                    <ChevronDown size={14} className="accordion-chevron" />
                  )}
                </button>
                {openSections.has('significance') && (
                  <div className="accordion-content">
                    {relatedLevelsText && (
                      <p className="section-content srt-levels-indicator">
                        <ArrowRight size={14} className="inline" /> {relatedLevelsText}
                      </p>
                    )}
                    <p className="section-content">{srtSignificance}</p>
                  </div>
                )}
              </div>
            )}

            {/* Business impact - only in executive mode */}
            {businessImpact && (
              <div className="accordion-section">
                <button
                  type="button"
                  onClick={() => toggleSection('business')}
                  aria-expanded={openSections.has('business')}
                  className="accordion-header"
                >
                  <div className="accordion-icon" style={{ backgroundColor: '#10b98115' }}>
                    <TrendingUp size={12} style={{ color: '#10b981' }} />
                  </div>
                  <span className="accordion-title">{isEn ? 'Business impact' : 'Последствия для бизнеса'}</span>
                  {openSections.has('business') ? (
                    <ChevronUp size={14} className="accordion-chevron" />
                  ) : (
                    <ChevronDown size={14} className="accordion-chevron" />
                  )}
                </button>
                {openSections.has('business') && (
                  <div className="accordion-content">
                    <p className="section-content">{businessImpact}</p>
                  </div>
                )}
              </div>
            )}

            {/* Uncertainty */}
            {uncertainty && (
              <div className="accordion-section">
                <button
                  type="button"
                  onClick={() => toggleSection('uncertainty')}
                  aria-expanded={openSections.has('uncertainty')}
                  className="accordion-header"
                >
                  <div className="accordion-icon" style={{ backgroundColor: '#6366f115' }}>
                    <CircleHelp size={12} style={{ color: '#6366f1' }} />
                  </div>
                  <span className="accordion-title">{isEn ? 'Evidence boundary' : 'Неопределённость'}</span>
                  {openSections.has('uncertainty') ? (
                    <ChevronUp size={14} className="accordion-chevron" />
                  ) : (
                    <ChevronDown size={14} className="accordion-chevron" />
                  )}
                </button>
                {openSections.has('uncertainty') && (
                  <div className="accordion-content">
                    <p className="section-content">{uncertainty}</p>
                  </div>
                )}
              </div>
            )}

            {/* Watch next */}
            {watchNext.length > 0 && (
              <div className="accordion-section">
                <button
                  type="button"
                  onClick={() => toggleSection('watch')}
                  aria-expanded={openSections.has('watch')}
                  className="accordion-header"
                >
                  <div className="accordion-icon" style={{ backgroundColor: '#8b5cf615' }}>
                    <Eye size={12} style={{ color: '#8b5cf6' }} />
                  </div>
                  <span className="accordion-title">{isEn ? 'What to watch' : 'На что смотреть дальше'}</span>
                  {openSections.has('watch') ? (
                    <ChevronUp size={14} className="accordion-chevron" />
                  ) : (
                    <ChevronDown size={14} className="accordion-chevron" />
                  )}
                </button>
                {openSections.has('watch') && (
                  <div className="accordion-content">
                    {watchNext.length === 1 ? (
                      <p className="section-content">{watchNext[0]}</p>
                    ) : (
                      <ul className="section-content watch-next-list">
                        {watchNext.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sources */}
            {sources.length > 0 && (
              <div className="accordion-section">
                <button
                  type="button"
                  onClick={() => toggleSection('sources')}
                  aria-expanded={openSections.has('sources')}
                  className="accordion-header"
                >
                  <div className="accordion-icon" style={{ backgroundColor: '#6366f115' }}>
                    <ExternalLink size={12} style={{ color: '#6366f1' }} />
                  </div>
                  <span className="accordion-title">{isEn ? 'Sources' : 'Источники'}</span>
                  {openSections.has('sources') ? (
                    <ChevronUp size={14} className="accordion-chevron" />
                  ) : (
                    <ChevronDown size={14} className="accordion-chevron" />
                  )}
                </button>
                {openSections.has('sources') && (
                  <div className="accordion-content">
                    <div className="sources-list">
                      {sources.slice(0, 3).map((source) => {
                        const sourceWithDate = source as typeof source & { published_at?: string };
                        return (
                          <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="source-link">
                            <ExternalLink size={12} aria-hidden="true" />
                            <span>
                              {source.host}
                              {sourceWithDate.published_at && (
                                <span className="source-date"> · {new Date(sourceWithDate.published_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { month: 'short', day: 'numeric' })}</span>
                              )}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading state for executive data */}
      {isExpanded && loading && !explanation && (
        <div className="inline-news-expanded-content">
          <p className="text-muted-foreground text-xs">
            {isEn ? 'Loading explanation…' : 'Загрузка пояснения…'}
          </p>
        </div>
      )}

      {/* Reactions - always at the bottom */}
      <NewsReactions title={item.title} description={item.description} sources={item.sources} isEn={isEn} />
    </article>
  );
}
