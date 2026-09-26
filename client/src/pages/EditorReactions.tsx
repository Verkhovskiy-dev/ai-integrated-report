import { useMemo, useState, type FormEvent } from "react";
import { loadEditorSummary, type EditorSummary } from "@/lib/newsReactions";

function almatyDate(offsetDays = 0) {
  const value = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Almaty", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

function boundary(date: string) {
  return new Date(`${date}T00:00:00+05:00`).toISOString();
}

export default function EditorReactions() {
  const [token, setToken] = useState("");
  const [fromDate, setFromDate] = useState(() => almatyDate(-7));
  const [toDate, setToDate] = useState(() => almatyDate(1));
  const [summary, setSummary] = useState<EditorSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const periodLabel = useMemo(() => `[${fromDate}, ${toDate}) · +05`, [fromDate, toDate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      setSummary(await loadEditorSummary(token, boundary(fromDate), boundary(toDate)));
    } catch (caught) {
      const status = (caught as Error & { status?: number }).status;
      setError(status === 401 ? "Неверный или отсутствующий редакторский токен." : "Не удалось загрузить сводку.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Реакции на новости</h1>
          <p className="mt-2 text-sm text-muted-foreground">Закрытая редакторская сводка. Токен остаётся только в памяти этой вкладки и не попадает в URL или локальное хранилище.</p>
        </header>
        <form onSubmit={submit} className="grid gap-3 rounded-lg border border-border/50 bg-card/50 p-4 sm:grid-cols-4">
          <label className="text-sm">С даты (+05)<input required type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 w-full rounded border bg-background p-2" /></label>
          <label className="text-sm">До даты, не включая (+05)<input required type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 w-full rounded border bg-background p-2" /></label>
          <label className="text-sm">Редакторский токен<input required type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} className="mt-1 w-full rounded border bg-background p-2" /></label>
          <button disabled={loading} className="self-end rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-60">{loading ? "Загрузка…" : "Показать"}</button>
        </form>
        {error && <p role="alert" className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        {summary && (
          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Период</div><div>{periodLabel}</div></div>
              <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Операций в периоде</div><div className="text-2xl font-bold">{summary.operationCount}</div></div>
              <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Активных реакций на конец</div><div className="text-2xl font-bold">{summary.activeReactionCountAtEnd}</div></div>
            </div>
            <div className="overflow-x-auto rounded border">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/30"><tr><th className="p-3">Новость / версия</th><th className="p-3">Полезно</th><th className="p-3">Подробнее</th><th className="p-3">Неясно</th><th className="p-3">Всего активно</th></tr></thead>
                <tbody>{summary.newsVersions.map((row) => <tr key={`${row.newsId}:${row.contentVersion}`} className="border-t"><td className="p-3"><a href={row.url} className="font-medium text-primary underline" target="_blank" rel="noreferrer">{row.title}</a><div className="mt-1 font-mono text-[10px] text-muted-foreground">{row.newsId} · {row.contentVersion}</div></td><td className="p-3">{row.useful}</td><td className="p-3">{row.more}</td><td className="p-3">{row.unclear}</td><td className="p-3 font-bold">{row.activeReactions}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="rounded border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><strong>Как читать:</strong> одна реакция — состояние случайного ID браузера, не уникальный человек. «Полезно» — самоотчёт, не доказанная применимость. Без совместимого числа показов доли не считаются; разные версии новости не объединяются.</div>
          </section>
        )}
      </div>
    </main>
  );
}
