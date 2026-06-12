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

declare global {
  interface Window {
    LearnPythonApp: any;
  }
}

(() => {
  const STORAGE_KEY = "learn-python-mobile-state-v2";

  const { lessons } = window.LearnPythonApp;

  const getAssignmentKey = (lessonId: number, assignmentId: string) =>
    `${lessonId}:${assignmentId}`;

  const buildDefaultDrafts = () =>
    Object.fromEntries(
      lessons.flatMap((lesson: Lesson) =>
        lesson.assignments.map((assignment) => [
          getAssignmentKey(lesson.id, assignment.id),
          {
            code: "",
            output: "Здесь появится результат после запуска задания.",
          },
        ]),
      ),
    );

  const normalizeAssignmentDrafts = (
    parsedDrafts: Record<string, AssignmentDraft> | undefined,
  ) => {
    const defaults = buildDefaultDrafts();

    if (!parsedDrafts) {
      return defaults;
    }

    const starterCodeByKey = Object.fromEntries(
      lessons.flatMap((lesson: Lesson) =>
        lesson.assignments.map((assignment) => [
          getAssignmentKey(lesson.id, assignment.id),
          assignment.starterCode,
        ]),
      ),
    );

    return Object.fromEntries(
      Object.entries({
        ...defaults,
        ...parsedDrafts,
      }).map(([key, draft]) => {
        const looksLikeOldTemplate =
          draft.code === starterCodeByKey[key] &&
          draft.output === "Здесь появится результат после запуска задания.";

        return [
          key,
          looksLikeOldTemplate
            ? defaults[key]
            : {
                ...defaults[key],
                ...draft,
              },
        ];
      }),
    );
  };

  const defaultState = (): AppState => ({
    completedLessonIds: [],
    lessonCode: Object.fromEntries(
      lessons.map((lesson: Lesson) => [lesson.id, lesson.starterCode]),
    ),
    achievements: [],
    firstRunDone: false,
    assignmentDrafts: buildDefaultDrafts(),
    savedWorks: [],
  });

  const readState = (): AppState => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const baseState = defaultState();

      if (!raw) {
        return baseState;
      }

      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        ...baseState,
        ...parsed,
        lessonCode: {
          ...baseState.lessonCode,
          ...(parsed.lessonCode ?? {}),
        },
        assignmentDrafts: normalizeAssignmentDrafts(parsed.assignmentDrafts),
        savedWorks: parsed.savedWorks ?? [],
      };
    } catch (_error) {
      return defaultState();
    }
  };

  const writeState = (state: AppState) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  window.LearnPythonApp = {
    ...window.LearnPythonApp,
    STORAGE_KEY,
    defaultState,
    readState,
    writeState,
    getAssignmentKey,
  };
})();
