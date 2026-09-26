import { useEffect, useMemo, useRef, useState } from "react";
import { buildNewsIdentity } from "@shared/newsIdentity";
import {
  getBrowserIdentity, loadReaction, newReactionIntent, saveReaction,
  type NewsReaction, type ReactionIntent,
} from "@/lib/newsReactions";

const OPTIONS: Array<{ value: NewsReaction; ru: string; en: string }> = [
  { value: "useful", ru: "Полезно", en: "Useful" },
  { value: "important", ru: "Важно", en: "Important" },
  { value: "more", ru: "Хочу подробнее", en: "Tell me more" },
  { value: "unclear", ru: "Неясно", en: "Unclear" },
];

interface NewsReactionsProps {
  title: string;
  description: string;
  sources: string[];
  isEn?: boolean;
  className?: string;
}

export default function NewsReactions({ title, description, sources, isEn = false, className = "" }: NewsReactionsProps) {
  const identity = useMemo(() => buildNewsIdentity({ title, description, sources }), [title, description, sources]);
  const browser = useMemo(() => getBrowserIdentity(), []);
  const [selected, setSelected] = useState<NewsReaction | null>(null);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<ReactionIntent | null>(null);
  const [inFlight, setInFlight] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const identityKey = `${identity.newsId}:${identity.contentVersion}`;
  const currentIdentityKey = useRef(identityKey);
  currentIdentityKey.current = identityKey;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPending(null);
    setInFlight(false);
    setSelected(null);
    setRevision(0);
    loadReaction(browser.browserId, identity.newsId, identity.contentVersion)
      .then((state) => {
        if (!active) return;
        setSelected(state.reaction);
        setRevision(state.revision);
        setError(null);
      })
      .catch(() => active && setError(isEn ? "Could not load your reaction" : "Не удалось загрузить реакцию"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [browser.browserId, identity.newsId, identity.contentVersion, isEn]);

  const submit = async (intent: ReactionIntent) => {
    const requestIdentityKey = `${intent.newsId}:${intent.contentVersion}`;
    setPending(intent);
    setInFlight(true);
    setError(null);
    try {
      const result = await saveReaction(intent);
      if (currentIdentityKey.current !== requestIdentityKey) return;
      setSelected(result.state.reaction);
      setRevision(result.state.revision);
      setPending(null);
    } catch (caught) {
      if (currentIdentityKey.current !== requestIdentityKey) return;
      const conflict = caught as Error & { status?: number; current?: { reaction: NewsReaction | null; revision: number } };
      if (conflict.status === 409 && conflict.current) {
        setSelected(conflict.current.reaction);
        setRevision(conflict.current.revision);
        setPending({ ...intent, expectedRevision: conflict.current.revision });
        setError(isEn ? "Changed in another tab. Retry to apply your choice." : "Изменено в другой вкладке. Повторите, чтобы применить выбор.");
      } else {
        setError(isEn ? "Not saved. Check the connection and retry." : "Не сохранено. Проверьте соединение и повторите.");
      }
    } finally {
      if (currentIdentityKey.current === requestIdentityKey) setInFlight(false);
    }
  };

  const choose = (reaction: NewsReaction) => {
    if (inFlight || loading) return;
    void submit(newReactionIntent({ ...identity, browserId: browser.browserId }, selected === reaction ? null : reaction, revision));
  };

  return (
    <div
      className={`border-t border-border/20 px-3 py-2 ${className}`}
      data-news-reactions
      data-news-id={identity.newsId}
      data-content-version={identity.contentVersion}
      aria-label={isEn ? "Reaction to this news" : "Реакция на эту новость"}
    >
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={isEn ? "Choose one reaction" : "Выберите одну реакцию"}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected === option.value}
            disabled={loading || inFlight}
            onClick={() => choose(option.value)}
            className={`min-h-8 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 ${
              selected === option.value
                ? "border-primary/60 bg-primary/20 text-primary"
                : "border-border/40 bg-background/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {isEn ? option.en : option.ru}
          </button>
        ))}
        {inFlight && <span className="text-[10px] text-muted-foreground" role="status">{isEn ? "Saving…" : "Сохраняем…"}</span>}
      </div>
      <div className="mt-1 min-h-4 text-[9px] text-muted-foreground" aria-live="polite">
        {error ? (
          <span className="text-red-400">
            {error}{" "}
            {pending && !inFlight && <button type="button" className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => void submit(pending)}>{isEn ? "Retry" : "Повторить"}</button>}
          </span>
        ) : selected ? (
          <span>{isEn ? "Saved. Press the selected reaction again to remove it." : "Сохранено. Нажмите выбранную реакцию ещё раз, чтобы снять её."}</span>
        ) : !browser.persistent ? (
          <span>{isEn ? "Saved on the server; this browser may not remember the choice after the tab closes." : "Сохраняется на сервере; после закрытия вкладки браузер может не узнать свой выбор."}</span>
        ) : (
          <span>{isEn ? "No public counters. Stored up to 30 days with a random browser ID, without names." : "Без публичных счётчиков. Храним до 30 дней со случайным ID браузера, без имён."}</span>
        )}
      </div>
    </div>
  );
}
