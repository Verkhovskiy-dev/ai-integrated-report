import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Briefcase, AlertTriangle, TrendingUp, CircleHelp, ArrowRight } from 'lucide-react';
import type { ExecutiveLookup, NewsImportance } from '@/data/newsContract';
import { executiveSafeDescription, importanceLabel } from '@/data/newsContract';
import { visibleNewsSources } from '@/data/inlineNews';
import { ShareButton } from '@/components/ShareableBlock';
import { buildShareId } from '@/lib/share';
import NewsReactions from '@/components/NewsReactions';
import './expandable-news.css';

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
  };
  executive: ExecutiveLookup;
  loading: boolean;
  isEn: boolean;
  accentColor: string;
  rank?: number;
}

/** Expandable news card for executive mode with full event details. */
export default function ExpandableNewsCard({ item, executive, loading, isEn, accentColor, rank }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const id = buildShareId('news', item.title);
  const sources = visibleNewsSources(item.sources);
  const shareDescription = executiveSafeDescription(item, executive, true);

  const explanation = executive.status === 'available' ? executive.explanation : undefined;
  const hasExplanation = !!explanation;

  // Determine what to show in expanded state
  const whatHappened = explanation?.what_happened?.trim() || item.fact?.trim() || item.description?.trim();
  const whyImportant = explanation?.why_important?.trim() || item.why_important?.trim();
  const businessImpact = explanation?.business_impact?.trim();
  const uncertainty = explanation?.uncertainty?.trim();
  const srtSignificance = item.srt_significance?.trim() || whyImportant;

  // Don't show duplicate text
  const shouldShowWhatHappened = whatHappened && whatHappened !== item.title;
  const hasAnyContent = shouldShowWhatHappened || srtSignificance || businessImpact || uncertainty || sources.length > 0;

  const toggleExpanded = () => {
    if (hasAnyContent) {
      setIsExpanded(!isExpanded);
    }
  };

  // Format related levels as "Ур. 5 → Ур. 4"
  const formatRelatedLevels = (levels?: number[]) => {
    if (!levels || levels.length === 0) return null;
    const sorted = [...levels].sort((a, b) => b - a);
    return sorted.map(l => `${isEn ? 'Lv.' : 'Ур.'} ${l}`).join(' → ');
  };

  const relatedLevelsText = formatRelatedLevels(item.related_levels);

  return (
    <article id={id} className="expandable-news-card" aria-labelledby={`${id}-headline`}>
      <div className="expandable-news-accent" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      <ShareButton id={id} title={item.title} text={shareDescription === item.title ? undefined : shareDescription} compact className="absolute right-2 top-2" />
      
      {/* Collapsed header - always visible */}
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        disabled={!hasAnyContent}
        className={`expandable-news-header ${!hasAnyContent ? 'not-expandable' : ''}`}
      >
        <div className="expandable-news-meta">
          {rank != null && <span className="expandable-news-rank">{rank}</span>}
          <span style={{ color: accentColor }} className="expandable-news-level">
            {isEn ? 'Lv.' : 'Ур.'}{item.level} · {item.levelName}
          </span>
          {item.related_levels && item.related_levels.length > 1 && (
            <span className="expandable-news-related-levels">
              {item.related_levels.filter(l => l !== item.level).map(l => (
                <span key={l} className="related-level-badge" style={{ borderColor: accentColor, color: accentColor }}>
                  {isEn ? 'Lv.' : 'Ур.'}{l}
                </span>
              ))}
            </span>
          )}
          {item.importance && <span className="expandable-news-importance">{importanceLabel(item.importance, isEn)}</span>}
        </div>
        <h4 id={`${id}-headline`} className="expandable-news-headline">{item.title}</h4>
        {hasAnyContent && (
          <div className="expandable-news-chevron">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && hasAnyContent && (
        <div className="expandable-news-content">
          {/* What happened */}
          {shouldShowWhatHappened && (
            <div className="expandable-news-section">
              <div className="section-icon" style={{ backgroundColor: `${accentColor}15` }}>
                <Briefcase size={12} style={{ color: accentColor }} />
              </div>
              <div className="section-text">
                <p className="section-label">{isEn ? 'What happened' : 'Что произошло'}</p>
                <p className="section-content">{whatHappened}</p>
              </div>
            </div>
          )}

          {/* Significance for SRT */}
          {srtSignificance && (
            <div className="expandable-news-section">
              <div className="section-icon" style={{ backgroundColor: '#f59e0b15' }}>
                <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
              </div>
              <div className="section-text">
                <p className="section-label">{isEn ? 'Significance for SRT' : 'Значимость для СРТ'}</p>
                {relatedLevelsText && (
                  <p className="section-content srt-levels-indicator">
                    <ArrowRight size={14} className="inline" /> {relatedLevelsText}
                  </p>
                )}
                <p className="section-content">{srtSignificance}</p>
              </div>
            </div>
          )}

          {/* Business impact - only in executive mode */}
          {businessImpact && (
            <div className="expandable-news-section">
              <div className="section-icon" style={{ backgroundColor: '#10b98115' }}>
                <TrendingUp size={12} style={{ color: '#10b981' }} />
              </div>
              <div className="section-text">
                <p className="section-label">{isEn ? 'Business impact' : 'Последствия для бизнеса'}</p>
                <p className="section-content">{businessImpact}</p>
              </div>
            </div>
          )}

          {/* Uncertainty */}
          {uncertainty && (
            <div className="expandable-news-section">
              <div className="section-icon" style={{ backgroundColor: '#6366f115' }}>
                <CircleHelp size={12} style={{ color: '#6366f1' }} />
              </div>
              <div className="section-text">
                <p className="section-label">{isEn ? 'Evidence boundary' : 'Неопределённость'}</p>
                <p className="section-content">{uncertainty}</p>
              </div>
            </div>
          )}

          {/* Sources */}
          {sources.length > 0 && (
            <div className="expandable-news-sources">
              <p className="sources-label">{isEn ? 'Sources:' : 'Источники:'}</p>
              <div className="sources-list">
                {sources.slice(0, 3).map((source, index) => {
                  // Extract published_at if available (future feature)
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

      {/* Loading state for executive data */}
      {isExpanded && loading && !hasExplanation && (
        <div className="expandable-news-content">
          <p className="text-muted-foreground text-xs">
            {isEn ? 'Loading explanation…' : 'Загрузка пояснения…'}
          </p>
        </div>
      )}

      {/* Reactions and share - always at the bottom */}
      <NewsReactions title={item.title} description={item.description} sources={item.sources} isEn={isEn} />
    </article>
  );
}
