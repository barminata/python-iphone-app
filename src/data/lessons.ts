type Assignment = {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  hint: string;
};

type Lesson = {
  id: number;
  title: string;
  topic: string;
  theory: string;
  example: string;
  starterCode: string;
  practice: string;
  hint: string;
  assignments: Assignment[];
};

type AchievementId = "first-run" | "first-lesson" | "all-lessons";

(() => {
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
      assignments: [
        {
          id: "about-me",
          title: "Расскажи о себе",
          description:
            "Напиши программу, которая выводит твоё имя, возраст и любимое занятие.",
          starterCode:
            'print("Меня зовут Даша")\nprint("Мне 15 лет")\nprint("Я люблю рисовать")',
          hint: "Сделай 3 строки с print(), по одной мысли в каждой строке.",
        },
        {
          id: "hero-card",
          title: "Карточка персонажа",
          description:
            "Создай карточку игрового героя с именем, уровнем, силой и суперспособностью.",
          starterCode:
            'print("Имя: Луна")\nprint("Уровень: 3")\nprint("Сила: молния")\nprint("Суперспособность: быстрый рывок")',
          hint: "Каждую характеристику можно вывести отдельной строкой через print().",
        },
        {
          id: "ascii-art",
          title: "Рисунок символами",
          description:
            "Нарисуй с помощью print() ёлку, домик или любой символ, который тебе нравится.",
          starterCode: 'print("  *  ")\nprint(" *** ")\nprint("*****")\nprint("  |  ")',
          hint: "Один print() = одна строка рисунка.",
        },
      ],
    },
    {
      id: 2,
      title: "Урок 2. Переменные",
      topic: 'name = "Даша"',
      theory:
        "Переменная помогает сохранить значение в памяти программы. Потом это значение можно использовать сколько угодно раз.",
      example: 'name = "Даша"\nprint(name)',
      starterCode: 'name = "Даша"\nprint(name)',
      practice:
        'Создай переменную city и сохрани в ней название города. Потом выведи её через print().',
      hint:
        'Сначала напиши имя переменной, потом знак =, а справа значение. Например: city = "Москва".',
      assignments: [
        {
          id: "pet-profile",
          title: "Профиль питомца",
          description:
            "Создай переменные с именем питомца, его возрастом и любимой едой. Потом выведи всё на экран.",
          starterCode:
            'pet_name = "Мотя"\npet_age = 4\npet_food = "яблоки"\nprint(pet_name)\nprint(pet_age)\nprint(pet_food)',
          hint: "Сначала сохрани значения в переменные, а потом выведи их с помощью print().",
        },
        {
          id: "dream-trip",
          title: "Поездка мечты",
          description:
            "Сохрани в переменные страну, город и транспорт для путешествия мечты.",
          starterCode:
            'country = "Япония"\ncity = "Токио"\ntransport = "поезд"\nprint(country)\nprint(city)\nprint(transport)',
          hint: "Придумай свои значения и подставь их вместо примера.",
        },
      ],
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
      assignments: [
        {
          id: "favorite-food",
          title: "Любимая еда",
          description:
            "Спроси у пользователя, какая еда ему нравится, и выведи красивое сообщение.",
          starterCode:
            'food = input("Какая у тебя любимая еда? ")\nprint("Здорово, я тоже люблю", food)',
          hint: "Ответ пользователя сохраняется в переменную, например food.",
        },
        {
          id: "mini-interview",
          title: "Мини-интервью",
          description:
            "Спроси имя и любимую музыку, а потом выведи короткое приветствие.",
          starterCode:
            'name = input("Как тебя зовут? ")\nmusic = input("Какую музыку ты любишь? ")\nprint("Привет,", name)\nprint("Классно, что тебе нравится", music)',
          hint: "Можно использовать две разные переменные для двух ответов.",
        },
      ],
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
      assignments: [
        {
          id: "weather-choice",
          title: "Выбор по погоде",
          description:
            "Создай переменную weather. Если там 'солнечно', выведи 'Иду гулять!'. Иначе выведи 'Останусь дома'.",
          starterCode:
            'weather = "солнечно"\nif weather == "солнечно":\n    print("Иду гулять!")\nelse:\n    print("Останусь дома")',
          hint: 'Для сравнения текста используй ==, например weather == "солнечно".',
        },
        {
          id: "level-check",
          title: "Проверка уровня",
          description:
            "Сделай переменную level. Если level больше или равно 10, выведи 'Ты готов к боссу!'. Иначе выведи 'Ещё качаемся'.",
          starterCode:
            'level = 8\nif level >= 10:\n    print("Ты готов к боссу!")\nelse:\n    print("Ещё качаемся")',
          hint: "Не забудь отступы внутри if и else.",
        },
      ],
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
      assignments: [
        {
          id: "guess-color",
          title: "Угадай цвет",
          description:
            "Сделай игру, где secret_color и guess_color сравниваются между собой.",
          starterCode:
            'secret_color = "синий"\nguess_color = "синий"\nif guess_color == secret_color:\n    print("Ты угадала цвет!")\nelse:\n    print("Пока не угадала")',
          hint: "Можно сравнивать не только числа, но и текст.",
        },
        {
          id: "treasure-door",
          title: "Дверь к сокровищу",
          description:
            "Сделай игру с числом двери. Если выбрана правильная дверь, покажи сокровище.",
          starterCode:
            'secret_door = 2\nchosen_door = 1\nif chosen_door == secret_door:\n    print("Сокровище найдено!")\nelse:\n    print("Попробуй другую дверь")',
          hint: "Используй две переменные и одно условие if/else.",
        },
      ],
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

  window.LearnPythonApp = {
    ...(window.LearnPythonApp ?? {}),
    lessons,
    achievementMeta,
  };
})();
