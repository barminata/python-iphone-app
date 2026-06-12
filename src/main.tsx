type RouteName = "home" | "lesson" | "progress";

type Lesson = {
  id: number;
  title: string;
  topic: string;
  theory: string;
  example: string;
  starterCode: string;
  practice: string;
  hint: string;
};

type AchievementId = "first-run" | "first-lesson" | "all-lessons";

type AppState = {
  completedLessonIds: number[];
  lessonCode: Record<number, string>;
  achievements: AchievementId[];
  firstRunDone: boolean;
};

type RunResult = {
  ok: boolean;
  output: string;
};

declare const React: typeof import("react");
declare const ReactDOM: typeof import("react-dom/client");
declare global {
  interface Window {
    Sk: any;
  }
}

const { useEffect, useState } = React;

const STORAGE_KEY = "learn-python-mobile-state-v1";

const lessons: Lesson[] = [
  {
    id: 1,
    title: "Урок 1. Первая программа",
    topic: "print()",
    theory:
      "Команда print() показывает текст на экране. Это самый первый шаг в Python: ты пишешь сообщение, а программа его выводит.",
    example: 'print("Привет, мир!")',
    starterCode: 'print("Привет, мир!")',
    practice:
      'Напиши свою фразу с помощью print(). Например: print("Я учу Python!")',
    hint:
      'Внутри скобок и кавычек нужно написать текст, который ты хочешь увидеть на экране.',
  },
  {
    id: 2,
    title: "Урок 2. Переменные",
    topic: 'name = "Аня"',
    theory:
      "Переменная помогает сохранить значение в памяти программы. Потом это значение можно использовать сколько угодно раз.",
    example: 'name = "Аня"\nprint(name)',
    starterCode: 'name = "Аня"\nprint(name)',
    practice:
      'Создай переменную city и сохрани в ней название города. Потом выведи её через print().',
    hint:
      'Сначала напиши имя переменной, потом знак =, а справа значение. Например: city = "Москва".',
  },
  {
    id: 3,
    title: "Урок 3. Ввод данных",
    topic: "input()",
    theory:
      "Функция input() спрашивает что-то у пользователя. Ответ сохраняется в переменную, и с ним можно работать дальше.",
    example: 'name = input("Как тебя зовут? ")\nprint("Привет,", name)',
    starterCode: 'name = input("Как тебя зовут? ")\nprint("Привет,", name)',
    practice:
      "Спроси у пользователя любимый цвет и выведи ответ на экран.",
    hint:
      'Используй input("Твой вопрос") и сохрани ответ в переменную. Потом покажи его через print().',
  },
  {
    id: 4,
    title: "Урок 4. Условия",
    topic: "if / else",
    theory:
      "Условия помогают программе выбирать, что делать дальше. Если условие верное, сработает одна часть кода. Если нет, другая.",
    example:
      'age = 15\nif age >= 14:\n    print("Можно начинать учить Python")\nelse:\n    print("Начнём с простого")',
    starterCode:
      'age = 15\nif age >= 14:\n    print("Можно начинать учить Python")\nelse:\n    print("Начнём с простого")',
    practice:
      "Создай переменную score. Если score больше или равно 5, выведи 'Отлично!'. Иначе выведи 'Ещё потренируемся'.",
    hint:
      "После if ставь двоеточие. Следующая строка должна быть с отступом в 4 пробела.",
  },
  {
    id: 5,
    title: "Урок 5. Мини-игра",
    topic: "простая логика",
    theory:
      "Когда мы соединяем переменные, условия и сравнение, получается простая игра. Это уже похоже на настоящую программу.",
    example:
      'secret = 7\nguess = 7\nif guess == secret:\n    print("Ты угадала!")\nelse:\n    print("Попробуй ещё раз")',
    starterCode:
      'secret = 7\nguess = 7\nif guess == secret:\n    print("Ты угадала!")\nelse:\n    print("Попробуй ещё раз")',
    practice:
      "Сделай свою мини-игру: задай secret и guess, а потом проверь, совпадают ли они.",
    hint:
      "Для проверки равенства используй два знака равно: ==. Один знак = только записывает значение.",
  },
];

const achievementMeta: Record<
  AchievementId,
  { title: string; description: string; icon: string }
> = {
  "first-run": {
    title: "Первый запуск кода",
    description: "Ты впервые запустил программу.",
    icon: "▶",
  },
  "first-lesson": {
    title: "Первый урок пройден",
    description: "Один урок уже в твоей копилке.",
    icon: "★",
  },
  "all-lessons": {
    title: "5 уроков пройдено",
    description: "Ты прошёл весь стартовый набор уроков.",
    icon: "🏆",
  },
};

const defaultState = (): AppState => ({
  completedLessonIds: [],
  lessonCode: Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson.starterCode])),
  achievements: [],
  firstRunDone: false,
});

const readState = (): AppState => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState();
    }

    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...defaultState(),
      ...parsed,
      lessonCode: {
        ...defaultState().lessonCode,
        ...(parsed.lessonCode ?? {}),
      },
    };
  } catch (_error) {
    return defaultState();
  }
};

const writeState = (state: AppState) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const getRouteFromHash = (): { name: RouteName; lessonId?: number } => {
  const hash = window.location.hash.replace("#", "");

  if (hash.startsWith("lesson/")) {
    const lessonId = Number(hash.split("/")[1]);
    return { name: "lesson", lessonId: Number.isNaN(lessonId) ? 1 : lessonId };
  }

  if (hash === "progress") {
    return { name: "progress" };
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
    return "Программа ждала ответ, но не получила его. Попробуй снова и введи текст в появившемся окне.";
  }

  if (cleaned.includes("TypeError")) {
    return "Программа запуталась в типах данных. Проверь, что текст и числа используются там, где нужно.";
  }

  return `Что-то пошло не так: ${cleaned}`;
};

const runPython = async (code: string): Promise<RunResult> => {
  const output: string[] = [];

  try {
    // Настройка Skulpt для вывода print() и input() в браузере без сервера.
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
      output: renderedOutput || "Код выполнился без ошибок. Если хочешь увидеть текст, используй print().",
    };
  } catch (error) {
    return {
      ok: false,
      output: translateError(String(error)),
    };
  }
};

const lessonById = (lessonId: number) => lessons.find((lesson) => lesson.id === lessonId) ?? lessons[0];

const progressPercent = (completedCount: number) =>
  Math.round((completedCount / lessons.length) * 100);

const App = () => {
  const [appState, setAppState] = useState<AppState>(() => readState());
  const [route, setRoute] = useState(() => getRouteFromHash());
  const [runOutput, setRunOutput] = useState("Здесь появится результат после запуска кода.");
  const [isRunning, setIsRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentLesson = lessonById(route.lessonId ?? 1);
  const completedCount = appState.completedLessonIds.length;
  const percent = progressPercent(completedCount);

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
    setShowHint(false);
    setRunOutput("Здесь появится результат после запуска кода.");
  }, [currentLesson.id]);

  const updateCode = (lessonId: number, code: string) => {
    setAppState((prev) => ({
      ...prev,
      lessonCode: {
        ...prev.lessonCode,
        [lessonId]: code,
      },
    }));
  };

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

  const handleRun = async () => {
    setIsRunning(true);
    const result = await runPython(appState.lessonCode[currentLesson.id]);
    setRunOutput(result.output);
    setIsRunning(false);

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
    }
  };

  const resetCode = () => {
    updateCode(currentLesson.id, currentLesson.starterCode);
    setRunOutput("Код сброшен. Можешь запускать пример или менять его под себя.");
  };

  const openLesson = (lessonId: number) => {
    setHashRoute({ name: "lesson", lessonId });
    setRoute({ name: "lesson", lessonId });
  };

  const nextLesson = lessons.find((lesson) => lesson.id === currentLesson.id + 1);

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
            Короткие уроки, удобный редактор и запуск кода прямо на телефоне.
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
            onStart={() => openLesson(1)}
            onOpenLesson={openLesson}
          />
        )}

        {route.name === "lesson" && (
          <LessonScreen
            lesson={currentLesson}
            code={appState.lessonCode[currentLesson.id]}
            output={runOutput}
            isRunning={isRunning}
            showHint={showHint}
            isCompleted={appState.completedLessonIds.includes(currentLesson.id)}
            nextLessonId={nextLesson?.id}
            onCodeChange={(code) => updateCode(currentLesson.id, code)}
            onRun={handleRun}
            onReset={resetCode}
            onToggleHint={() => setShowHint((prev) => !prev)}
            onNextLesson={() => {
              if (nextLesson) {
                openLesson(nextLesson.id);
                return;
              }
              setHashRoute({ name: "progress" });
              setRoute({ name: "progress" });
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
            label="Прогресс"
            active={route.name === "progress"}
            onClick={() => {
              setHashRoute({ name: "progress" });
              setRoute({ name: "progress" });
            }}
          />
        </nav>
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
  onStart,
  onOpenLesson,
}: {
  completedLessonIds: number[];
  achievements: AchievementId[];
  onStart: () => void;
  onOpenLesson: (lessonId: number) => void;
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">Уроки</h2>
        <span className="text-sm font-medium text-slate-500">
          {completedLessonIds.length}/{lessons.length}
        </span>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson) => {
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
  onCodeChange,
  onRun,
  onReset,
  onToggleHint,
  onNextLesson,
}: {
  lesson: Lesson;
  code: string;
  output: string;
  isRunning: boolean;
  showHint: boolean;
  isCompleted: boolean;
  nextLessonId?: number;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onReset: () => void;
  onToggleHint: () => void;
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

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-lg font-extrabold text-slate-900">Редактор</div>
          <div className="text-sm text-slate-500">Код сохраняется сам для каждого урока.</div>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        spellCheck={false}
        className="min-h-[220px] w-full rounded-[24px] border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-6 text-sky-100 outline-none ring-0"
      />

      <div className="mt-4 grid grid-cols-1 gap-3">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="w-full rounded-2xl bg-brand-600 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-brand-200 transition disabled:opacity-70 active:scale-[0.99]"
        >
          {isRunning ? "Запускаем..." : "Запустить код"}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onReset}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition active:scale-[0.99]"
          >
            Сбросить код
          </button>
          <button
            onClick={onToggleHint}
            className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-700 transition active:scale-[0.99]"
          >
            {showHint ? "Скрыть подсказку" : "Показать подсказку"}
          </button>
        </div>
      </div>
    </section>

    {showHint && (
      <section className="rounded-[28px] border border-brand-200 bg-brand-50 p-5 shadow-sm">
        <div className="text-sm font-bold text-brand-700">Подсказка</div>
        <p className="mt-2 text-sm leading-6 text-brand-900">{lesson.hint}</p>
      </section>
    )}

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="text-sm font-bold text-slate-500">Результат</div>
      <pre className="mt-3 min-h-[120px] whitespace-pre-wrap rounded-[22px] bg-slate-900 p-4 font-mono text-sm leading-6 text-emerald-100">
        {output}
      </pre>
    </section>

    <section className="glass-card rounded-[28px] border border-white/70 p-5 shadow-soft">
      <div className="text-sm font-bold text-slate-500">Практическое задание</div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{lesson.practice}</p>
      <button
        onClick={onNextLesson}
        className="mt-4 w-full rounded-2xl bg-slate-900 px-5 py-4 text-base font-extrabold text-white transition active:scale-[0.99]"
      >
        {nextLessonId ? "Следующий урок" : "Перейти к прогрессу"}
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
          {lessons.map((lesson) => {
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
                  <span className="text-sm font-bold text-slate-500">
                    {done ? "✓" : "•"}
                  </span>
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
    className={`flex-1 rounded-2xl px-4 py-3 text-sm font-extrabold transition active:scale-[0.99] ${
      active ? "bg-slate-900 text-white" : "bg-white/80 text-slate-600"
    }`}
  >
    {label}
  </button>
);

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);
