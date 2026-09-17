export const UI_TEXT = {
  en: {
    notValid: "NOT IN WORD LIST!",
    win: "BRILLIANT! YOU GUESSED IT!",
	luckyWin: "WOW, WHAT LUCK!! FIRST TRY!",
    over: (secret) => `Game Over! Word was: ${secret}`,
    keepGoing: "Keep going — bonus guesses unlocked!",
    notEnough: "Not enough letters!",
    lockedArchive: "Solve today's puzzle to unlock past days!",
    streakText: (current, longest) => `${current}-day streak (best: ${longest})`,
    defaultPrompt: "GUESS THE WORD!",
    helpTitle: "How to Play",
    helpDesc1: "Guess the hidden word in 6 tries. Each guess must be a valid 5-letter word.(This game is still in 🧪 BETA!)",
    helpLabelClues: "Color Clues",
    helpDescClues: '• <span style="color: #6aaa64; font-weight:bold;">Green:</span> Letter is in the correct spot.<br>• <span style="color: #c9b458; font-weight:bold;">Yellow:</span> Letter is in the word but wrong spot.<br>• <span style="color: var(--color-ai); font-weight:bold;">Red:</span> Letter is not in the word.',
    helpLabelLang: "Multilingual Support",
    helpDescLang: "Switch between English, German, and Persian anytime using the dropdown menu!",
    helpClose: "Back to Game",
    prev: "Previous",
    next: "Next",
    outOfTriesTitle: "Out of Tries!",
    outOfTriesDesc: "You've used all 6 guesses. Would you like to see the answer or keep guessing?",
    keepGuessingBtn: "Keep Guessing",
    seeAnswerBtn: "See Answer"
  },
  de: {
    notValid: "KEIN GÜLTIGES WORT!",
    win: "GENIAL! DU HAST ES ERRATEN!",
	luckyWin: "WAS FÜR EIN GLÜCK! ERSTER VERSUCH!",
    over: (secret) => `Spiel vorbei! Das Wort war: ${secret}`,
    keepGoing: "Weiter so — Bonusversuche freigeschaltet!",
    notEnough: "Nicht genug Buchstaben!",
    lockedArchive: "Löse das heutige Rätsel, um vergangene Tage freizuschalten!",
    streakText: (current, longest) => `${current}-Tage-Serie (Rekord: ${longest})`,
    defaultPrompt: "ERRATE DAS WORT!",
    helpTitle: "Spielanleitung",
    helpDesc1: "Errate das geheime Wort in 6 Versuchen. Jeder Tipp muss ein gültiges 5-Buchstaben-Wort sein. (Dieses Spiel ist noch in der 🧪 BETA!)",
    helpLabelClues: "Farb-Hinweise",
    helpDescClues: '• <span style="color: #6aaa64; font-weight:bold;">Grün:</span> Buchstabe ist an der richtigen Stelle.<br>• <span style="color: #c9b458; font-weight:bold;">Gelb:</span> Buchstabe ist im Wort, aber falsche Stelle.<br>• <span style="color: var(--color-ai); font-weight:bold;">Rot:</span> Buchstabe ist nicht im Wort.',
    helpLabelLang: "Mehrsprachigkeit",
    helpDescLang: "Wechsle jederzeit über das Menü zwischen Englisch, Deutsch und Persisch!",
    helpClose: "Zurück zum Spiel",
    prev: "Vorherige",
    next: "Nächste",
    outOfTriesTitle: "Keine Versuche mehr!",
    outOfTriesDesc: "Du hast alle 6 Versuche aufgebraucht. Möchtest du die Antwort sehen oder weiterspielen?",
    keepGuessingBtn: "Weiterspielen",
    seeAnswerBtn: "Antwort zeigen"
  },
  fa: {
    notValid: ".این کلمه در واژه نامه ام نیست",
    win: "!آفرین! درسته حدس زدی",
	luckyWin: "!اولین حدس! عجب شانسی",
    over: (secret) => `کلمه این بود: ${secret}`,
    keepGoing: "!به حدس زدن ادامه بده — تلاش‌های اضافه باز شد",
    notEnough: "!حرف‌های کافی وارد نکردی",
    lockedArchive: "!اول معمای امروز رو حل کن",
    streakText: (current, longest) => `زنجیره ${current} روزه (رکورد: ${longest})`,
    defaultPrompt: ".کلمه را حدس بزن",
    helpTitle: "راهنمای بازی",
    helpDesc1: "کلمه را در ۶ تلاش حدس بزن. هر حدس باید یک کلمه معتبر ۵ حرفی باشه. (این بازی هنوز در مرحله آزمایشیه🧪 )",
    helpLabelClues: "راهنمای رنگ‌ها",
    helpDescClues: '• <span style="color: #6aaa64; font-weight:bold;">سبز:</span> حرف در جایگاه درسته .<br>• <span style="color: #c9b458; font-weight:bold;">زرد:</span> حرف در کلمه هست اما جایگاه نادرسته .<br>• <span style="color: var(--color-ai); font-weight:bold;">قرمز:</span> حرف در کلمه وجود نداره.',
    helpLabelLang: "پشتیبانی چندزبانه",
    helpDescLang: "می‌تونی هر زمان از منو زبان را تغییر بدی.",
    helpClose: "بازگشت به بازی",
    prev: "قبلی",
    next: "بعدی",
    outOfTriesTitle: "!تلاش‌هات تموم شد",
    outOfTriesDesc: "۶ تلاشت تموم شد. دوست داری جواب رو ببینی یا به حدس زدن ادامه بدی؟",
    keepGuessingBtn: "ادامه حدس زدن",
    seeAnswerBtn: "دیدن پاسخ"
  }
};

export const KEYBOARDS = {
  en: {
    dir: "ltr",
    keyboard: [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["BACK", "Z", "X", "C", "V", "B", "N", "M", "ENTER"]
    ]
  },
  de: {
    dir: "ltr",
    keyboard: [
      ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "Ü","ß"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ö", "Ä"],
      ["BACK", "Y", "X", "C", "V", "B", "N", "M", "ENTER"]
    ]
  },
  fa: {
    dir: "rtl",
    keyboard: [
      ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "چ"],
      ["ش", "س","ی", "ب", "ل","آ","ا", "ت", "ن", "م", "ک", "گ"],
      ["BACK", "ظ", "ط", "ز", "ر", "ذ", "د", "پ","و", "ئ", "ENTER"]
    ]
  }
};