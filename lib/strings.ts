// All user-facing Hebrew UI strings live here, so wording can be refined in one place.
export const strings = {
  appName: "טריוויקיד",

  nav: {
    back: "חזרה לדף הבית",
  },

  home: {
    play: "בואו נשחק!",
    about: "אודות",
    imageAlt: "מגש טריוויה מעץ עם סימן שאלה במרכז",
    description: "משחק טריוויה לילדים: בוחרים נושא ומקבלים שאלות עליו.",
  },

  about: {
    title: "אודות",
    whatTitle: "מה זה טריוויקיד?",
    whatBody:
      "טריוויקיד הוא משחק טריוויה לילדים. בוחרים כל נושא שאוהבים, ומקבלים שאלות חדשות ומעניינות עליו.",
    howTitle: "איך משחקים?",
    howBody:
      "כותבים נושא, לוחצים על הכפתור ובוחרים תשובה אחת מתוך ארבע. אחרי כל תשובה מגלים אם צדקתם ולומדים עובדה מעניינת!",
  },

  trivia: {
    title: "טריוויקיד",
    pageTitle: "שאלות טריוויה",
    topicLabel: "על מה תרצו שאלה?",
    topicPlaceholder: "כתבו נושא…",
    optionLetters: ["א", "ב", "ג", "ד"],
    newQuestion: "שאלה חדשה",
    loading: "טוען…",
    success: "כל הכבוד! תשובה נכונה 🎉",
    failurePrefix: "לא נורא! התשובה הנכונה היא:",
    emptyTopic: "כתבו נושא כדי לקבל שאלה 🙂",
    unclearTopic: "לא הצלחנו להבין את הנושא, נסו נושא אחר",
    error: "אופס! משהו השתבש. נסו שוב",
    retry: "נסו שוב",
    offline: "אין חיבור לאינטרנט. התחברו ונסו שוב",
    noNewQuestion: "נגמרו לנו שאלות חדשות על הנושא הזה. נסו נושא אחר!",
  },
} as const;
