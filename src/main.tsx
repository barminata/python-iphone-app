type RouteName = "home" | "lesson" | "progress" | "works";

type AssignmentDraft = {
  code: string;
  output: string;
};

type SavedWork = {
  id: string;
  lessonId: number;
  assignmentId: string;
  lessonTitle: string;
  assignmentTitle: string;
  code: string;
  output: string;
  savedAt: string;
};

type AppState = {
  completedLessonIds: number[];
  lessonCode: Record<number, string>;
  achievements: AchievementId[];
  firstRunDone: boolean;
  assignmentDrafts: Record<string, AssignmentDraft>;
  savedWorks: SavedWork[];
};

type RunResult = {
  ok: boolean;
  output: string;
};

declare const React: typeof import("react");
declare const ReactDOM: typeof import("react-dom/client");

declare global {
  interface Navigator {
    share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    clipboard?: {
      writeText: (text: string) => Promise<void>;
    };
  }

  interface Window {
    Sk: any;
    LearnPythonApp: any;
  }
}

const { useEffect, useMemo, useState } = React;

const {
  lessons,
  achievementMeta,
  readState,
  writeState,
  getAssignmentKey,
  CodeEditor,
  AssignmentCard,
} = window.LearnPythonApp;

const lessonById = (lessonId: number) =>
  lessons.find((lesson: Lesson) => lesson.id === lessonId) ?? lessons[0];

const progressPercent = (completedCount: number) =>
  Math.round((completedCount / lessons.length) * 100);

const formatDate = (savedAt: string) =>
  new Date(savedAt).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getRouteFromHash = (): { name: RouteName; lessonId?: number } => {
  const hash = window.location.hash.replace("#", "");

  if (hash.startsWith("lesson/")) {
    const lessonId = Number(hash.split("/")[1]);
    return { name: "lesson", lessonId: Number.isNaN(lessonId) ? 1 : lessonId };
  }

  if (hash === "progress") {
    return { name: "progress" };
  }

  if (hash === "works") {
    return { name: "works" };
  }

  return { name: "home" };
};

const setHashRoute = (route: { name: RouteName; lessonId?: number }) => {
  if (route.name === "lesson" && route.lessonId) {
    window.location.hash = `lesson/${route.lessonId}`;
    return;
  }

  window.location.hash = route.name === "home" ? "" : route.name;
};

const translateError = (message: string) => {
  const cleaned = message.replace("on line 1", "").trim();

  if (cleaned.includes("SyntaxError")) {
    return "Похоже, в коде пропущен символ или скобка. Проверь строку внимательно.";
  }

  if (cleaned.includes("NameError")) {
    return "Программа не нашла имя переменной. Возможно, ты опечатался или забыл создать переменную.";
  }

  if (cleaned.includes("IndentationError")) {
    return "Съехали отступы. В Python важно, чтобы строки внутри if были с одинаковым отступом.";
  }

  if (cleaned.includes("EOFError")) {
    return "Программа ждала ответ, но не получила его. Попробуй запустить код ещё раз.";
  }

  if (cleaned.includes("TypeError")) {
    return "Программа запуталась в типах данных. Проверь, что текст и числа используются там, где нужно.";
  }

  return `Что-то пошло не так: ${cleaned}`;
};

const runPython = async (code: string): Promise<RunResult> => {
  const output: string[] = [];

  try {
    window.Sk.pre = "output";
    window.Sk.configure({
      output: (text: string) => output.push(text),
      read: (file: string) => {
        if (!window.Sk.builtinFiles?.files?.[file]) {
          throw new Error(`Файл ${file} не найден`);
        }
        return window.Sk.builtinFiles.files[file];
      },
      inputfunTakesPrompt: true,
      inputfun: (promptText: string) => {
        const response = window.prompt(promptText) ?? "";
        return Promise.resolve(response);
      },
      __future__: window.Sk.python3,
    });

    await window.Sk.misceval.asyncToPromise(() =>
      window.Sk.importMainWithBody("<stdin>", false, code, true),
    );

    const renderedOutput = output.join("").trim();
    return {
      ok: true,
      output:
        renderedOutput ||
        "Код выполнился без ошибок. Если хочешь увидеть текст, используй print().",
    };
  } catch (error) {
    return {
      ok: false,
      output: translateError(String(error)),
    };
  }
};

const buildShareText = (work: SavedWork) =>
  [
    `Урок: ${work.lessonTitle}`,
    `Задание: ${work.assignmentTitle}`,
    `Дата выполнения: ${formatDate(work.savedAt)}`,
    "",
    "Код ученика:",
    work.code || "(пусто)",
    "",
    "Результат выполнения:",
    work.output || "(пусто)",
  ].join("\n");

const downloadTextFile = (filename: string, text: string) => {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(blobUrl);
};

const App = () => {
  const [appState, setAppState] = useState<AppState>(() => readState());
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [runOutput, setRunOutput] = useState("Здесь появится результат после запуска кода.");
  const [isRunningLesson, setIsRunningLesson] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [runningAssignmentId, setRunningAssignmentId] = useState("");

  const currentLesson = lessonById(route.lessonId ?? 1);
  const completedCount = appState.completedLessonIds.length;
  const percent = progressPercent(completedCount);

  const groupedWorks = useMemo(
    () =>
      lessons.map((lesson: Lesson) => ({
        lesson,
        works: appState.savedWorks.filter((work) => work.lessonId === lesson.id),
      })),
    [appState.savedWorks],
  );

  useEffect(() => {
    writeState(appState);
  }, [appState]);

  useEffect(() => {
    const syncRoute = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", syncRoute);
    syncRoute();

    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToastMessage(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    setShowHint(false);
    setRunOutput("Здесь появится результат после запуска кода.");
  }, [currentLesson.id]);

  const showToast = (message: string) => setToastMessage(message);

  const unlockAchievement = (id: AchievementId, state: AppState): AppState => {
    if (state.achievements.includes(id)) {
      return state;
    }

    return {
      ...state,
      achievements: [...state.achievements, id],
    };
  };

  const markLessonComplete = (lessonId: number) => {
    setAppState((prev) => {
      if (prev.completedLessonIds.includes(lessonId)) {
        return prev;
      }

      let nextState: AppState = {
        ...prev,
        completedLessonIds: [...prev.completedLessonIds, lessonId],
      };

      if (nextState.completedLessonIds.length >= 1) {
        nextState = unlockAchievement("first-lesson", nextState);
      }

      if (nextState.completedLessonIds.length === lessons.length) {
        nextState = unlockAchievement("all-lessons", nextState);
      }

      return nextState;
    });
  };

  const updateLessonCode = (lessonId: number, code: string) => {
    setAppState((prev) => ({
      ...prev,
      lessonCode: {
        ...prev.lessonCode,
        [lessonId]: code,
      },
    }));
  };

  const updateAssignmentDraft = (
    lessonId: number,
    assignmentId: string,
    patch: Partial<AssignmentDraft>,
  ) => {
    const key = getAssignmentKey(lessonId, assignmentId);

    setAppState((prev) => ({
      ...prev,
      assignmentDrafts: {
        ...prev.assignmentDrafts,
        [key]: {
          ...prev.assignmentDrafts[key],
          ...patch,
        },
      },
    }));
  };

  const resetLessonCode = () => {
    updateLessonCode(currentLesson.id, currentLesson.starterCode);
    setRunOutput("Вернули пример. Теперь можно снова запускать или менять его под себя.");
  };

  const clearLessonCode = () => {
    updateLessonCode(currentLesson.id, "");
    setRunOutput("Поле очищено. Теперь можно писать код с нуля.");
  };

  const handleRunLesson = async () => {
    setIsRunningLesson(true);
    const result = await runPython(appState.lessonCode[currentLesson.id]);
    setRunOutput(result.output);
    setIsRunningLesson(false);

    setAppState((prev) => {
      let nextState = prev;

      if (!prev.firstRunDone && result.ok) {
        nextState = unlockAchievement("first-run", {
          ...prev,
          firstRunDone: true,
        });
      }

      return nextState;
    });

    if (result.ok) {
      markLessonComplete(currentLesson.id);
      showToast("Отличная работа!");
    } else {
      showToast("Попробуй запустить код ещё раз");
    }
  };

  const handleRunAssignment = async (assignment: Assignment) => {
    const key = getAssignmentKey(currentLesson.id, assignment.id);
    const draft = appState.assignmentDrafts[key];

    setRunningAssignmentId(assignment.id);
    const result = await runPython(draft.code);
    setRunningAssignmentId("");

    updateAssignmentDraft(currentLesson.id, assignment.id, {
      output: result.output,
    });

    if (result.ok) {
      markLessonComplete(currentLesson.id);
      showToast("Отличная работа!");
    } else {
      showToast("Попробуй запустить код ещё раз");
    }
  };

  const saveAssignmentWork = (assignment: Assignment) => {
    const key = getAssignmentKey(currentLesson.id, assignment.id);
    const draft = appState.assignmentDrafts[key];
    const savedAt = new Date().toISOString();

    const work: SavedWork = {
      id: `${currentLesson.id}-${assignment.id}-${savedAt}`,
      lessonId: currentLesson.id,
      assignmentId: assignment.id,
      lessonTitle: currentLesson.title,
      assignmentTitle: assignment.title,
      code: draft.code,
      output: draft.output,
      savedAt,
    };

    setAppState((prev) => ({
      ...prev,
      savedWorks: [work, ...prev.savedWorks],
    }));

    showToast("Ответ сохранён!");
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast(successMessage);
        return;
      }
    } catch (_error) {
      // Fallback below keeps sharing available on older Safari versions.
    }

    const field = document.createElement("textarea");
    field.value = text;
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    document.body.removeChild(field);
    showToast(successMessage);
  };

  const shareWork = async (work: SavedWork) => {
    const text = buildShareText(work);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${work.lessonTitle} - ${work.assignmentTitle}`,
          text,
        });
        showToast("Отличная работа!");
        return;
      } catch (_error) {
        // If the share sheet was closed, we fall back to copy/download.
      }
    }

    await copyText(text, "Код скопирован!");
    downloadTextFile(
      `${work.lessonId}-${work.assignmentId}.txt`,
      text,
    );
  };

  const shareCurrentAssignment = async (assignment: Assignment) => {
    const key = getAssignmentKey(currentLesson.id, assignment.id);
    const draft = appState.assignmentDrafts[key];
    const work: SavedWork = {
      id: `preview-${currentLesson.id}-${assignment.id}`,
      lessonId: currentLesson.id,
      assignmentId: assignment.id,
      lessonTitle: currentLesson.title,
      assignmentTitle: assignment.title,
      code: draft.code,
      output: draft.output,
      savedAt: new Date().toISOString(),
    };

    await shareWork(work);
  };

  const deleteWork = (workId: string) => {
    setAppState((prev) => ({
      ...prev,
      savedWorks: prev.savedWorks.filter((work) => work.id !== workId),
    }));
  };

  const openLesson = (lessonId: number) => {
    setHashRoute({ name: "lesson", lessonId });
    setRoute({ name: "lesson", lessonId });
  };

  const nextLesson = lessons.find((lesson: Lesson) => lesson.id === currentLesson.id + 1);

  return (
    <div className="safe-pb min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-4">
        <header className="glass-card hero-grid overflow-hidden rounded-[28px] border border-white/70 px-5 py-5 shadow-soft">
          <div className="mb-3 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-brand-600">
            mobile-first python
          </div>
          <h1 className="max-w-xs text-3xl font-extrabold leading-tight text-slate-900">
            Учим Python
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
            Короткие уроки, удобный редактор и домашние задания прямо на телефоне.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatusPill label="Уроков" value={String(lessons.length)} />
            <StatusPill label="Пройдено" value={String(completedCount)} />
            <StatusPill label="Прогресс" value={`${percent}%`} />
          </div>
        </header>

        {route.name === "home" && (
          <HomeScreen
            completedLessonIds={appState.completedLessonIds}
            achievements={appState.achievements}
            savedWorksCount={appState.savedWorks.length}
            onStart={() => openLesson(1)}
            onOpenLesson={openLesson}
            onOpenWorks={() => {
              setHashRoute({ name: "works" });
              setRoute({ name: "works" });
            }}
          />
        )}

        {route.name === "lesson" && (
          <LessonScreen
            lesson={currentLesson}
            code={appState.lessonCode[currentLesson.id]}
            output={runOutput}
            isRunning={isRunningLesson}
            showHint={showHint}
            isCompleted={appState.completedLessonIds.includes(currentLesson.id)}
            nextLessonId={nextLesson?.id}
            assignmentDrafts={appState.assignmentDrafts}
            runningAssignmentId={runningAssignmentId}
            onCodeChange={(code) => updateLessonCode(currentLesson.id, code)}
            onRun={handleRunLesson}
            onReset={resetLessonCode}
            onClear={clearLessonCode}
            onToggleHint={() => setShowHint((prev) => !prev)}
            onAssignmentCodeChange={(assignmentId, value) =>
              updateAssignmentDraft(currentLesson.id, assignmentId, { code: value })
            }
            onAssignmentRun={handleRunAssignment}
            onAssignmentClear={(assignment) =>
              updateAssignmentDraft(currentLesson.id, assignment.id, {
                code: "",
                output: "Поле очищено. Теперь можно писать код с нуля.",
              })
            }
            onAssignmentSave={saveAssignmentWork}
            onAssignmentShare={shareCurrentAssignment}
            onNextLesson={() => {
              if (nextLesson) {
                openLesson(nextLesson.id);
                return;
              }
              setHashRoute({ name: "works" });
              setRoute({ name: "works" });
            }}
          />
        )}

        {route.name === "progress" && (
          <ProgressScreen
            completedLessonIds={appState.completedLessonIds}
            achievements={appState.achievements}
            onOpenLesson={openLesson}
          />
        )}

        {route.name === "works" && (
          <WorksScreen
            groupedWorks={groupedWorks}
            onOpenLesson={openLesson}
            onCopy={async (work) => copyText(buildShareText(work), "Код скопирован!")}
            onShare={shareWork}
            onDelete={deleteWork}
          />
        )}

        <nav className="glass-card fixed bottom-3 left-1/2 z-20 flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 gap-2 rounded-[24px] border border-white/70 p-2 shadow-soft">
          <NavButton
            label="Главная"
            active={route.name === "home"}
            onClick={() => {
              setHashRoute({ name: "home" });
              setRoute({ name: "home" });
            }}
          />
          <NavButton
            label="Урок"
            active={route.name === "lesson"}
            onClick={() => openLesson(route.lessonId ?? 1)}
          />
          <NavButton
            label="Работы"
            active={route.name === "works"}
            onClick={() => {
              setHashRoute({ name: "works" });
              setRoute({ name: "works" });
            }}
          />
          <NavButton
            label="Прогресс"
            active={route.name === "progress"}
            onClick={() => {
              setHashRoute({ name: "progress" });
              setRoute({ name: "progress" });
            }}
          />
        </nav>

        {toastMessage ? (
          <div className="pointer-events-none fixed left-1/2 top-4 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white shadow-xl">
            {toastMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const StatusPill = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl bg-white/80 px-3 py-3 text-center shadow-sm">
    <div className="text-lg font-extrabold text-slate-900">{value}</div>
    <div className="text-xs font-medium text-slate-500">{label}</div>
  </div>
);

const HomeScreen = ({
  completedLessonIds,
  achievements,
  savedWorksCount,
  onStart,
  onOpenLesson,
  onOpenWorks,
}: {
  completedLessonIds: number[];
  achievements: AchievementId[];
  savedWorksCount: number;
  onStart: () => void;
  onOpenLesson: (lessonId: number) => void;
  onOpenWorks: () => void;
}) => (
  <main className="mt-4 flex flex-1 flex-col gap-4">
    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-sky-500 px-5 py-5 text-white">
        <p className="text-sm font-semibold text-white/80">Старт за 5 минут</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight">
          Начни с первого урока и сразу запусти свой код
        </h2>
        <button
          onClick={onStart}
          className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-base font-extrabold text-brand-700 transition active:scale-[0.99]"
        >
          Начать обучение
        </button>
      </div>
    </section>

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3 rounded-[24px] bg-slate-900 px-4 py-4 text-white">
        <div>
          <div className="text-sm text-white/70">Мои работы</div>
          <div className="text-lg font-extrabold">{savedWorksCount}</div>
        </div>
        <button
          onClick={onOpenWorks}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-slate-900"
        >
          Открыть
        </button>
      </div>
    </section>

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">Уроки</h2>
        <span className="text-sm font-medium text-slate-500">
          {completedLessonIds.length}/{lessons.length}
        </span>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson: Lesson) => {
          const done = completedLessonIds.includes(lesson.id);

          return (
            <button
              key={lesson.id}
              onClick={() => onOpenLesson(lesson.id)}
              className="w-full rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-brand-600">{lesson.topic}</div>
                  <div className="mt-1 text-base font-extrabold text-slate-900">
                    {lesson.title}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {done ? "Пройден" : "Новый"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <h2 className="text-lg font-extrabold text-slate-900">Достижения</h2>
      <div className="mt-4 space-y-3">
        {Object.entries(achievementMeta).map(([id, meta]) => {
          const unlocked = achievements.includes(id as AchievementId);

          return (
            <div
              key={id}
              className={`rounded-[22px] border p-4 ${
                unlocked
                  ? "border-brand-200 bg-brand-50"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl shadow-sm">
                  {meta.icon}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900">{meta.title}</div>
                  <div className="text-sm text-slate-500">{meta.description}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  </main>
);

const LessonScreen = ({
  lesson,
  code,
  output,
  isRunning,
  showHint,
  isCompleted,
  nextLessonId,
  assignmentDrafts,
  runningAssignmentId,
  onCodeChange,
  onRun,
  onReset,
  onClear,
  onToggleHint,
  onAssignmentCodeChange,
  onAssignmentRun,
  onAssignmentClear,
  onAssignmentSave,
  onAssignmentShare,
  onNextLesson,
}: {
  lesson: Lesson;
  code: string;
  output: string;
  isRunning: boolean;
  showHint: boolean;
  isCompleted: boolean;
  nextLessonId?: number;
  assignmentDrafts: Record<string, AssignmentDraft>;
  runningAssignmentId: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onReset: () => void;
  onClear: () => void;
  onToggleHint: () => void;
  onAssignmentCodeChange: (assignmentId: string, value: string) => void;
  onAssignmentRun: (assignment: Assignment) => void;
  onAssignmentClear: (assignment: Assignment) => void;
  onAssignmentSave: (assignment: Assignment) => void;
  onAssignmentShare: (assignment: Assignment) => void;
  onNextLesson: () => void;
}) => (
  <main className="mt-4 flex flex-1 flex-col gap-4">
    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-brand-600">{lesson.topic}</div>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900">
            {lesson.title}
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {isCompleted ? "Готово" : "В процессе"}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{lesson.theory}</p>
    </section>

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="text-sm font-bold text-slate-500">Пример кода</div>
      <pre className="mt-3 overflow-x-auto rounded-[22px] bg-slate-950 p-4 font-mono text-sm leading-6 text-sky-100">
        <code>{lesson.example}</code>
      </pre>
    </section>

    <CodeEditor
      title="Редактор урока"
      subtitle="Код сохраняется отдельно для каждого урока."
      code={code}
      output={output}
      isRunning={isRunning}
      runLabel="Запустить код"
      clearLabel="Очистить код"
      resetLabel="Вернуть пример"
      onCodeChange={onCodeChange}
      onRun={onRun}
      onClear={onClear}
      onReset={onReset}
    />

    <section className="rounded-[28px] border border-brand-200 bg-brand-50 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-brand-700">Подсказка</div>
          {showHint ? (
            <p className="mt-2 text-sm leading-6 text-brand-900">{lesson.hint}</p>
          ) : (
            <p className="mt-2 text-sm leading-6 text-brand-900">
              Нажми кнопку ниже, если нужен маленький намёк.
            </p>
          )}
        </div>
        <button
          onClick={onToggleHint}
          className="rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-bold text-brand-700"
        >
          {showHint ? "Скрыть" : "Показать"}
        </button>
      </div>
    </section>

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="text-sm font-bold text-slate-500">Практика</div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{lesson.practice}</p>
    </section>

    <section className="flex flex-col gap-4">
      <div className="px-1">
        <h3 className="text-xl font-extrabold text-slate-900">Домашнее задание</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Выбери задание, напиши свой код и сохрани ответ.
        </p>
      </div>

      {lesson.assignments.map((assignment) => {
        const draft = assignmentDrafts[getAssignmentKey(lesson.id, assignment.id)];

        return (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            code={draft.code}
            output={draft.output}
            isRunning={runningAssignmentId === assignment.id}
            onCodeChange={(value) => onAssignmentCodeChange(assignment.id, value)}
            onRun={() => onAssignmentRun(assignment)}
            onClear={() => onAssignmentClear(assignment)}
            onSave={() => onAssignmentSave(assignment)}
            onShare={() => onAssignmentShare(assignment)}
          />
        );
      })}
    </section>

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <button
        onClick={onNextLesson}
        className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-base font-extrabold text-white transition active:scale-[0.99]"
      >
        {nextLessonId ? "Следующий урок" : "Перейти к моим работам"}
      </button>
    </section>
  </main>
);

const ProgressScreen = ({
  completedLessonIds,
  achievements,
  onOpenLesson,
}: {
  completedLessonIds: number[];
  achievements: AchievementId[];
  onOpenLesson: (lessonId: number) => void;
}) => {
  const percent = progressPercent(completedLessonIds.length);

  return (
    <main className="mt-4 flex flex-1 flex-col gap-4">
      <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Твой прогресс</h2>
            <p className="mt-1 text-sm text-slate-500">
              Пройдено {completedLessonIds.length} из {lessons.length} уроков
            </p>
          </div>
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-xl font-extrabold text-brand-700">
            {percent}%
          </div>
        </div>

        <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sky-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
        <h2 className="text-lg font-extrabold text-slate-900">Пройденные уроки</h2>
        <div className="mt-4 space-y-3">
          {lessons.map((lesson: Lesson) => {
            const done = completedLessonIds.includes(lesson.id);

            return (
              <button
                key={lesson.id}
                onClick={() => onOpenLesson(lesson.id)}
                className={`w-full rounded-[22px] border p-4 text-left ${
                  done
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-500">{lesson.topic}</div>
                    <div className="mt-1 text-base font-extrabold text-slate-900">
                      {lesson.title}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-500">{done ? "✓" : "•"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
        <h2 className="text-lg font-extrabold text-slate-900">Достижения</h2>
        <div className="mt-4 grid gap-3">
          {Object.entries(achievementMeta).map(([id, meta]) => {
            const unlocked = achievements.includes(id as AchievementId);

            return (
              <div
                key={id}
                className={`rounded-[22px] border p-4 ${
                  unlocked
                    ? "border-brand-200 bg-brand-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl shadow-sm">
                    {meta.icon}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900">{meta.title}</div>
                    <div className="text-sm text-slate-500">{meta.description}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};

const WorksScreen = ({
  groupedWorks,
  onOpenLesson,
  onCopy,
  onShare,
  onDelete,
}: {
  groupedWorks: { lesson: Lesson; works: SavedWork[] }[];
  onOpenLesson: (lessonId: number) => void;
  onCopy: (work: SavedWork) => Promise<void>;
  onShare: (work: SavedWork) => Promise<void>;
  onDelete: (workId: string) => void;
}) => (
  <main className="mt-4 flex flex-1 flex-col gap-4">
    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <h2 className="text-2xl font-extrabold text-slate-900">Мои работы</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Здесь хранятся все сохранённые домашние задания.
      </p>
    </section>

    {groupedWorks.map(({ lesson, works }) => (
      <section
        key={lesson.id}
        className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-brand-600">{lesson.topic}</div>
            <h3 className="text-lg font-extrabold text-slate-900">{lesson.title}</h3>
          </div>
          <button
            onClick={() => onOpenLesson(lesson.id)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
          >
            Открыть урок
          </button>
        </div>

        {works.length === 0 ? (
          <div className="rounded-[22px] bg-slate-100 px-4 py-4 text-sm text-slate-500">
            Пока нет сохранённых работ по этому уроку.
          </div>
        ) : (
          <div className="space-y-4">
            {works.map((work) => (
              <div key={work.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-extrabold text-slate-900">
                      {work.assignmentTitle}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Сохранено: {formatDate(work.savedAt)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-bold text-slate-500">Код</div>
                  <pre className="mt-2 whitespace-pre-wrap rounded-[20px] bg-slate-950 p-4 font-mono text-sm leading-6 text-sky-100">
                    {work.code || "(пусто)"}
                  </pre>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-bold text-slate-500">Результат</div>
                  <pre className="mt-2 whitespace-pre-wrap rounded-[20px] bg-slate-900 p-4 font-mono text-sm leading-6 text-emerald-100">
                    {work.output || "(пусто)"}
                  </pre>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <button
                    onClick={() => onCopy(work)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-700"
                  >
                    Скопировать
                  </button>
                  <button
                    onClick={() => onShare(work)}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white"
                  >
                    Отправить преподавателю
                  </button>
                  <button
                    onClick={() => onDelete(work.id)}
                    className="w-full rounded-2xl bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700"
                  >
                    Удалить работу
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    ))}
  </main>
);

const NavButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 rounded-2xl px-3 py-3 text-xs font-extrabold transition active:scale-[0.99] ${
      active ? "bg-slate-900 text-white" : "bg-white/80 text-slate-600"
    }`}
  >
    {label}
  </button>
);

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
