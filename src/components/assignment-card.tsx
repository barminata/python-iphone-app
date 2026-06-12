declare const React: typeof import("react");

(() => {
  const { CodeEditor } = window.LearnPythonApp;

  const AssignmentCard = ({
    assignment,
    code,
    output,
    isRunning,
    onCodeChange,
    onRun,
    onClear,
    onSave,
    onShare,
  }: {
    assignment: Assignment;
    code: string;
    output: string;
    isRunning: boolean;
    onCodeChange: (value: string) => void;
    onRun: () => void;
    onClear: () => void;
    onSave: () => void;
    onShare: () => void;
  }) => (
    <section className="glass-card candy-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="mb-4">
        <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-amber-700">
          задание
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-slate-900">{assignment.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{assignment.description}</p>
        <div className="mt-3 rounded-[20px] bg-gradient-to-r from-brand-50 to-sky-50 px-4 py-3 text-sm text-brand-900">
          Подсказка: {assignment.hint}
        </div>
      </div>

      <CodeEditor
        title="Поле для ответа"
        subtitle="Можно стереть весь пример и написать код с нуля."
        code={code}
        output={output}
        isRunning={isRunning}
        runLabel="Запустить"
        clearLabel="Очистить код"
        onCodeChange={onCodeChange}
        onRun={onRun}
        onClear={onClear}
        tone="soft"
      />

      <div className="mt-4 grid grid-cols-1 gap-3">
        <button
          onClick={onSave}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-base font-extrabold text-white transition active:scale-[0.99]"
        >
          Сохранить ответ
        </button>
        <button
          onClick={onShare}
          className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-extrabold text-slate-700 transition active:scale-[0.99]"
        >
          Отправить преподавателю
        </button>
      </div>
    </section>
  );

  window.LearnPythonApp = {
    ...window.LearnPythonApp,
    AssignmentCard,
  };
})();
