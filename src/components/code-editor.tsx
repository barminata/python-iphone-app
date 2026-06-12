declare const React: typeof import("react");

(() => {
  const CodeEditor = ({
    title,
    subtitle,
    code,
    isRunning,
    runLabel = "Запустить",
    resetLabel = "Вернуть пример",
    clearLabel = "Очистить код",
    output,
    onCodeChange,
    onRun,
    onReset,
    onClear,
    tone = "primary",
  }: {
    title: string;
    subtitle?: string;
    code: string;
    isRunning?: boolean;
    runLabel?: string;
    resetLabel?: string;
    clearLabel?: string;
    output: string;
    onCodeChange: (value: string) => void;
    onRun: () => void;
    onReset?: () => void;
    onClear: () => void;
    tone?: "primary" | "soft";
  }) => {
    const runButtonClass =
      tone === "soft"
        ? "bg-slate-900 text-white"
        : "bg-brand-600 text-white shadow-lg shadow-brand-200";

    return (
      <section className="glass-card candy-card rounded-[28px] border border-white/70 p-5 shadow-soft">
        <div className="mb-3">
          <div className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
            код
          </div>
          <div className="mt-2 text-lg font-extrabold text-slate-900">{title}</div>
          {subtitle ? <div className="text-sm text-slate-500">{subtitle}</div> : null}
        </div>

        <textarea
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          spellCheck={false}
          className="min-h-[220px] w-full rounded-[24px] border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-6 text-sky-100 outline-none ring-0 shadow-inner"
        />

        <div className="mt-4 grid grid-cols-1 gap-3">
          <button
            onClick={onRun}
            disabled={isRunning}
            className={`w-full rounded-2xl px-5 py-4 text-base font-extrabold transition disabled:opacity-70 active:scale-[0.99] ${runButtonClass}`}
          >
            {isRunning ? "Запускаем..." : runLabel}
          </button>

          <div className={`grid gap-3 ${onReset ? "grid-cols-2" : "grid-cols-1"}`}>
            <button
              onClick={onClear}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition active:scale-[0.99]"
            >
              {clearLabel}
            </button>
            {onReset ? (
              <button
                onClick={onReset}
                className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 transition active:scale-[0.99]"
              >
                {resetLabel}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-sm font-bold text-slate-500">Результат</div>
          <pre className="mt-3 min-h-[120px] whitespace-pre-wrap rounded-[22px] bg-gradient-to-br from-slate-900 to-slate-800 p-4 font-mono text-sm leading-6 text-emerald-100">
            {output}
          </pre>
        </div>
      </section>
    );
  };

  window.LearnPythonApp = {
    ...window.LearnPythonApp,
    CodeEditor,
  };
})();
