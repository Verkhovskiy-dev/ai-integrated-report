import { ExternalLink } from 'lucide-react';
import type { ExecutiveLookup, NewsImportance } from '@/data/newsContract';
import { executiveSafeDescription, importanceLabel } from '@/data/newsContract';
import { inlineWhy, visibleNewsSources } from '@/data/inlineNews';
import { ShareButton } from '@/components/ShareableBlock';
import { buildShareId } from '@/lib/share';
import NewsReactions from '@/components/NewsReactions';
import './inline-news.css';

interface Props {
  item: { title: string; description: string; fact?: string; sources: string[]; level: number; levelName: string; importance?: NewsImportance | null };
  executive: ExecutiveLookup;
  loading: boolean;
  isEn: boolean;
  accentColor: string;
  rank?: number;
}

/** All essential reading actions stay inline; no modal or card toggle. */
export default function InlineNewsCard({ item, executive, loading, isEn, accentColor, rank }: Props) {
  const id = buildShareId('news', item.title);
  const why = inlineWhy(executive, loading, isEn);
  const sources = visibleNewsSources(item.sources);
  const shareDescription = executiveSafeDescription(item, executive, true);
  return (
    <article id={id} className="inline-news-card" aria-labelledby={`${id}-headline`}>
      <div className="inline-news-accent" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      <ShareButton id={id} title={item.title} text={shareDescription === item.title ? undefined : shareDescription} compact className="absolute right-2 top-2" />
      <div className="inline-news-content">
        <div className="inline-news-meta">
          {rank != null && <span className="inline-news-rank">{rank}</span>}
          <span style={{ color: accentColor }}>{isEn ? 'Lv.' : 'Ур.'}{item.level} {item.levelName}</span>
          {item.importance && <span className="text-muted-foreground">{importanceLabel(item.importance, isEn)}</span>}
        </div>
        <h4 id={`${id}-headline`} className="inline-news-headline">{item.title}</h4>
        <div className="inline-news-why" data-why-available={why.available}>
          <p className="inline-news-label">{isEn ? 'Why it matters' : 'Почему важно'}</p>
          {/* Never substitute unreviewed report.description/why_important for missing executive data.
              React conditional rendering: https://react.dev/learn/conditional-rendering */}
          <p className={why.available ? 'inline-news-explanation' : 'inline-news-unavailable'}>{why.text}</p>
        </div>
      </div>
      {/* Preserve original payload inputs and the existing set/change/remove/retry contract. */}
      <NewsReactions title={item.title} description={item.description} sources={item.sources} isEn={isEn} />
      <div className="inline-news-sources" aria-label={isEn ? 'News sources' : 'Источники новости'}>
        {sources.length ? sources.map((source, index) => (
          <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={13} aria-hidden="true" />
            <span>{isEn ? 'Source' : 'Источник'}: {source.host}{sources.filter(s => s.host === source.host).length > 1 ? ` (${index + 1})` : ''}</span>
          </a>
        )) : <span className="text-muted-foreground">{isEn ? 'Source link not provided.' : 'Ссылка на источник не предоставлена.'}</span>}
      </div>
    </article>
  );
}
