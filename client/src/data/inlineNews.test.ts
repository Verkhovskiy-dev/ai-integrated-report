import { describe, expect, it } from 'vitest';
import { inlineWhy, visibleNewsSources } from './inlineNews';
import type { ExecutiveLookup } from './newsContract';

describe('visible source links', () => {
  it('keeps all distinct materials and exact destination queries', () => {
    const urls = ['https://www.ft.com/content/a?x=1', 'https://www.ft.com/content/b'];
    expect(visibleNewsSources(urls)).toEqual(urls.map(url => ({ url, host: 'ft.com' })));
    expect(urls[0]).toContain('?x=1');
  });
  it('deduplicates exact URLs for presentation without mutating input', () => {
    const input = ['https://site.test/a', 'https://site.test/a'];
    expect(visibleNewsSources(input)).toHaveLength(1);
    expect(input).toHaveLength(2);
  });
  it('retains aggregator links instead of inventing original publishers', () => {
    expect(visibleNewsSources(['https://news.google.com/rss/articles/id?oc=5'])[0].host).toBe('news.google.com');
  });
  it.each(['javascript:alert(1)', 'data:text/html,<script>', 'file:///a', 'https://user:password@site.test/', '/relative', ''])('rejects unsafe URL %s', url => {
    expect(visibleNewsSources([url])).toEqual([]);
  });
  it('handles absent, malformed and mixed data', () => {
    expect(visibleNewsSources(null)).toEqual([]);
    expect(visibleNewsSources('https://site.test')).toEqual([]);
    expect(visibleNewsSources([null, 17, {}, 'https://site.test'])).toEqual([{url:'https://site.test/',host:'site.test'}]);
  });
});

describe('inline interpretation preserves fail-closed executive contract', () => {
  it('uses the accepted why exactly, including qualifications', () => {
    const lookup: ExecutiveLookup = {status:'available',explanation:{news_id:'n',content_version:'cv',status:'available',why_important:'Если это подтвердится, влияние возможно.'}};
    expect(inlineWhy(lookup,false,false)).toEqual({available:true,text:'Если это подтвердится, влияние возможно.'});
  });
  it.each(['missing_contract','missing','stale','not_generated'] as const)('does not substitute raw description for %s', reason => {
    expect(inlineWhy({status:'unavailable',reason},false,false)).toEqual({available:false,text:'Проверенное пояснение для этой версии новости пока недоступно.'});
  });
  it('keeps loading separate from unavailable', () => {
    expect(inlineWhy({status:'unavailable',reason:'missing'},true,false).text).toContain('загружается');
    expect(inlineWhy({status:'unavailable',reason:'missing'},true,true).text).toContain('Loading');
  });
  it('does not claim an empty accepted why exists', () => {
    const lookup: ExecutiveLookup = {status:'available',explanation:{news_id:'n',content_version:'v',status:'available',why_important:'  '}};
    expect(inlineWhy(lookup,false,true).available).toBe(false);
  });
});
