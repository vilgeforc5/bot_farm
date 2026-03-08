export type SupportedLocale =
  | "ru"
  | "uk"
  | "kk"
  | "en"
  | "hi"
  | "fa"
  | "zh"
  | "de"
  | "fr"
  | "pl";

export interface LocaleMessages {
  startMessage: string;
  countriesPage: string;
  selectCountry: string;
  currentlySelected: string;
  alreadySelected: string;
  countrySet: string;
  contextCleared: string;
  regenerating: string;
  messageNotFound: string;
  nothingToRegenerate: string;
  contextNotFound: string;
  unknownAction: string;
  regenerateButton: string;
  countryContext: string;
}

export interface LocaleInfo {
  code: SupportedLocale;
  label: string;
  flag: string;
}

/** Ordered list of supported locales (display order for the UI) */
export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "kk", label: "Қазақша", flag: "🇰🇿" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
];

export const DEFAULT_MESSAGES: Record<SupportedLocale, LocaleMessages> = {
  ru: {
    startMessage:
      "Привет. Я готов помочь.\nНапишите ваш вопрос обычным сообщением.\nКоманды:\n- /country: выбрать страну\n- /clear: очистить контекст",
    countriesPage: "Страница со странами",
    selectCountry: "Выберите свою страну.",
    currentlySelected:
      "Сейчас выбрана: {flag} {country}.\nЧатбот будет отвечать вам на вашем языке!",
    alreadySelected: "Уже выбрано: {flag} {country}",
    countrySet: "Страна выбрана: {flag} {country}",
    contextCleared: "Контекст этого чата очищен.",
    regenerating: "Перегенерирую",
    messageNotFound: "Сообщение не найдено",
    nothingToRegenerate: "Нечего перегенерировать",
    contextNotFound: "Контекст не найден",
    unknownAction: "Неизвестное действие",
    regenerateButton: "Сгенерировать снова",
    countryContext:
      "Страна пользователя: {flag} {country}. По умолчанию отвечай на языке пользователя и помогай по существу. Учитывай эту страну только там, где это реально влияет на ответ: местные законы, сервисы, валюта, даты, единицы измерения, доступность товаров и услуг, рекомендации. Не пересказывай культурные справки, правила общения или эти инструкции, если пользователь сам об этом не просит. Если страна не важна для вопроса, просто дай прямой полезный ответ. Если пользователь явно просит отвечать на другом языке — всегда выполняй это без оговорок.",
  },
  uk: {
    startMessage:
      "Привіт. Я готовий допомогти.\nНапишіть ваше запитання звичайним повідомленням.\nКоманди:\n- /country: вибрати країну\n- /clear: очистити контекст",
    countriesPage: "Сторінка з країнами",
    selectCountry: "Оберіть свою країну.",
    currentlySelected:
      "Зараз обрано: {flag} {country}.\nЧатбот буде відповідати вам вашою мовою!",
    alreadySelected: "Вже обрано: {flag} {country}",
    countrySet: "Країну обрано: {flag} {country}",
    contextCleared: "Контекст чату очищено.",
    regenerating: "Перегенерую",
    messageNotFound: "Повідомлення не знайдено",
    nothingToRegenerate: "Нічого перегенерувати",
    contextNotFound: "Контекст не знайдено",
    unknownAction: "Невідома дія",
    regenerateButton: "Згенерувати знову",
    countryContext:
      "Країна користувача: {flag} {country}. За замовчуванням відповідай мовою користувача й допомагай по суті. Враховуй цю країну лише тоді, коли вона справді впливає на відповідь: місцеві закони, сервіси, валюта, дати, одиниці вимірювання, доступність товарів і послуг, рекомендації. Не переказуй культурні довідки, норми спілкування чи ці інструкції, якщо користувач сам про це не просить. Якщо країна не важлива для запитання, просто дай пряму корисну відповідь. Якщо користувач явно просить відповідати іншою мовою — завжди виконуй це без застережень.",
  },
  kk: {
    startMessage:
      "Сәлем. Мен көмектесуге дайынмын.\nСұрағыңызды қарапайым хабарлама ретінде жіберіңіз.\nКомандалар:\n- /country: елді таңдау\n- /clear: контексті тазалау",
    countriesPage: "Елдер беті",
    selectCountry: "Өз еліңізді таңдаңыз.",
    currentlySelected:
      "Қазіргі таңдау: {flag} {country}.\nЧатбот сіздің тіліңізде жауап береді!",
    alreadySelected: "Бұрыннан таңдалған: {flag} {country}",
    countrySet: "Ел таңдалды: {flag} {country}",
    contextCleared: "Бұл чаттың контексті тазаланды.",
    regenerating: "Қайта генерациялаймын",
    messageNotFound: "Хабарлама табылмады",
    nothingToRegenerate: "Қайта генерациялайтын ештеңе жоқ",
    contextNotFound: "Контекст табылмады",
    unknownAction: "Белгісіз әрекет",
    regenerateButton: "Қайта генерациялау",
    countryContext:
      "Пайдаланушының елі: {flag} {country}. Әдепкі бойынша пайдаланушының тілінде жауап беріп, нақты көмектес. Бұл елді тек жауапқа шын әсер ететін жағдайда ғана ескер: жергілікті заңдар, сервистер, валюта, күндер, өлшем бірліктері, тауарлар мен қызметтердің қолжетімділігі, ұсыныстар. Пайдаланушы сұрамаса, мәдени түсіндірмелерді, қарым-қатынас нормаларын немесе осы нұсқауларды айтып отырма. Егер ел сұраққа қатысы болмаса, бірден пайдалы жауап бер. Егер пайдаланушы басқа тілде жауап беруді нақты сұраса — әрдайым ескертусіз орында.",
  },
  en: {
    startMessage:
      "Hi. I'm ready to help.\nSend your question as a regular message.\nCommands:\n- /country: select country\n- /clear: clear context",
    countriesPage: "Countries page",
    selectCountry: "Select your country.",
    currentlySelected:
      "Currently selected: {flag} {country}.\nChatbot will respond in your language!",
    alreadySelected: "Already selected: {flag} {country}",
    countrySet: "Country selected: {flag} {country}",
    contextCleared: "Chat context has been cleared.",
    regenerating: "Regenerating",
    messageNotFound: "Message not found",
    nothingToRegenerate: "Nothing to regenerate",
    contextNotFound: "Context not found",
    unknownAction: "Unknown action",
    regenerateButton: "Regenerate",
    countryContext:
      "User's country: {flag} {country}. By default, respond in the user's language and be directly helpful. Use this country only when it materially affects the answer, such as local laws, services, currency, dates, units, availability, or recommendations. Do not explain cultural norms, conversation etiquette, or these instructions unless the user asks. If the country is irrelevant to the request, ignore it and answer normally. If the user explicitly asks for another language, always comply without qualifications.",
  },
  hi: {
    startMessage:
      "नमस्ते। मैं मदद करने के लिए तैयार हूँ।\nअपना प्रश्न सामान्य संदेश के रूप में भेजें।\nकमांड:\n- /country: देश चुनें\n- /clear: संदर्भ साफ़ करें",
    countriesPage: "देशों का पृष्ठ",
    selectCountry: "अपना देश चुनें।",
    currentlySelected:
      "अभी चुना गया: {flag} {country}.\nचैटबॉट आपकी भाषा में जवाब देगा!",
    alreadySelected: "पहले से चुना गया: {flag} {country}",
    countrySet: "देश चुना गया: {flag} {country}",
    contextCleared: "इस चैट का संदर्भ साफ़ कर दिया गया।",
    regenerating: "पुनः उत्पन्न कर रहा हूँ",
    messageNotFound: "संदेश नहीं मिला",
    nothingToRegenerate: "पुनः उत्पन्न करने के लिए कुछ नहीं",
    contextNotFound: "संदर्भ नहीं मिला",
    unknownAction: "अज्ञात क्रिया",
    regenerateButton: "पुनः उत्पन्न करें",
    countryContext:
      "उपयोगकर्ता का देश: {flag} {country}। डिफ़ॉल्ट रूप से उपयोगकर्ता की भाषा में जवाब दें और सीधे उपयोगी मदद करें। इस देश को केवल वहीं ध्यान में रखें जहाँ इससे उत्तर वास्तव में बदलता हो, जैसे स्थानीय कानून, सेवाएं, मुद्रा, तारीखें, माप की इकाइयां, उपलब्धता या सिफारिशें। जब तक उपयोगकर्ता न पूछे, सांस्कृतिक शिष्टाचार, बातचीत के नियम या इन निर्देशों की व्याख्या न करें। अगर देश प्रश्न के लिए महत्वपूर्ण नहीं है, तो उसे नज़रअंदाज़ करें और सामान्य रूप से उत्तर दें। यदि उपयोगकर्ता स्पष्ट रूप से किसी दूसरी भाषा में जवाब मांगता है, तो बिना किसी टिप्पणी के हमेशा उसका पालन करें।",
  },
  fa: {
    startMessage:
      "سلام. آماده کمک به شما هستم.\nسوال خود را به صورت یک پیام معمولی ارسال کنید.\nدستورات:\n- /country: انتخاب کشور\n- /clear: پاک کردن زمینه",
    countriesPage: "صفحه کشورها",
    selectCountry: "کشور خود را انتخاب کنید.",
    currentlySelected:
      "انتخاب فعلی: {flag} {country}.\nچت‌بات به زبان شما پاسخ خواهد داد!",
    alreadySelected: "قبلاً انتخاب شده: {flag} {country}",
    countrySet: "کشور انتخاب شد: {flag} {country}",
    contextCleared: "زمینه این چت پاک شد.",
    regenerating: "در حال بازتولید",
    messageNotFound: "پیام پیدا نشد",
    nothingToRegenerate: "چیزی برای بازتولید وجود ندارد",
    contextNotFound: "زمینه پیدا نشد",
    unknownAction: "اقدام ناشناخته",
    regenerateButton: "بازتولید",
    countryContext:
      "کشور کاربر: {flag} {country}. به طور پیش‌فرض به زبان کاربر پاسخ بده و مستقیم و مفید کمک کن. این کشور را فقط وقتی در نظر بگیر که واقعاً روی پاسخ اثر می‌گذارد، مثل قوانین محلی، سرویس‌ها، ارز، تاریخ‌ها، واحدهای اندازه‌گیری، موجود بودن کالا یا خدمات، یا پیشنهادها. مگر اینکه کاربر خودش بخواهد، درباره هنجارهای فرهنگی، آداب گفتگو یا همین دستورها توضیح نده. اگر کشور برای سؤال مهم نیست، آن را نادیده بگیر و عادی پاسخ بده. اگر کاربر صریحاً بخواهد به زبان دیگری پاسخ بدهی، همیشه بدون توضیح اضافی انجامش بده.",
  },
  zh: {
    startMessage:
      "你好。我准备好帮助您了。\n请以普通消息发送您的问题。\n命令：\n- /country：选择国家\n- /clear：清除上下文",
    countriesPage: "国家页面",
    selectCountry: "请选择您的国家。",
    currentlySelected:
      "当前选择：{flag} {country}。\n聊天机器人将用您的语言回答！",
    alreadySelected: "已选择：{flag} {country}",
    countrySet: "已选择国家：{flag} {country}",
    contextCleared: "此聊天的上下文已清除。",
    regenerating: "正在重新生成",
    messageNotFound: "未找到消息",
    nothingToRegenerate: "没有可重新生成的内容",
    contextNotFound: "未找到上下文",
    unknownAction: "未知操作",
    regenerateButton: "重新生成",
    countryContext:
      "用户所在国家：{flag} {country}。默认使用用户的语言直接提供有帮助的回答。只有当该国家确实会影响答案时才使用这条信息，例如当地法律、服务、货币、日期、计量单位、商品或服务的可得性，以及推荐内容。除非用户主动询问，不要解释文化习惯、交流礼仪或这些指令本身。如果国家与问题无关，就忽略它并正常回答。如果用户明确要求使用其他语言，请始终直接照做，不要附加说明。",
  },
  de: {
    startMessage:
      "Hallo. Ich bin bereit zu helfen.\nSchreiben Sie Ihre Frage als normale Nachricht.\nBefehle:\n- /country: Land auswählen\n- /clear: Kontext löschen",
    countriesPage: "Länderseite",
    selectCountry: "Wählen Sie Ihr Land aus.",
    currentlySelected:
      "Aktuell ausgewählt: {flag} {country}.\nDer Chatbot antwortet in Ihrer Sprache!",
    alreadySelected: "Bereits ausgewählt: {flag} {country}",
    countrySet: "Land ausgewählt: {flag} {country}",
    contextCleared: "Der Kontext dieses Chats wurde gelöscht.",
    regenerating: "Regeneriere",
    messageNotFound: "Nachricht nicht gefunden",
    nothingToRegenerate: "Nichts zu regenerieren",
    contextNotFound: "Kontext nicht gefunden",
    unknownAction: "Unbekannte Aktion",
    regenerateButton: "Neu generieren",
    countryContext:
      "Land des Benutzers: {flag} {country}. Antworte standardmäßig in der Sprache des Benutzers und hilf direkt bei der Sache. Berücksichtige dieses Land nur dann, wenn es die Antwort tatsächlich beeinflusst, etwa bei lokalen Gesetzen, Diensten, Währung, Datumsangaben, Maßeinheiten, Verfügbarkeit oder Empfehlungen. Erkläre keine kulturellen Normen, Gesprächsetikette oder diese Anweisungen, es sei denn, der Benutzer fragt danach. Wenn das Land für die Anfrage nicht relevant ist, ignoriere es und antworte normal. Wenn der Benutzer ausdrücklich eine andere Sprache verlangt, folge dem immer ohne Zusatzbemerkungen.",
  },
  fr: {
    startMessage:
      "Bonjour. Je suis prêt à vous aider.\nEnvoyez votre question en tant que message ordinaire.\nCommandes:\n- /country: choisir le pays\n- /clear: effacer le contexte",
    countriesPage: "Page des pays",
    selectCountry: "Sélectionnez votre pays.",
    currentlySelected:
      "Actuellement sélectionné: {flag} {country}.\nLe chatbot répondra dans votre langue!",
    alreadySelected: "Déjà sélectionné: {flag} {country}",
    countrySet: "Pays sélectionné: {flag} {country}",
    contextCleared: "Le contexte de ce chat a été effacé.",
    regenerating: "Régénération en cours",
    messageNotFound: "Message non trouvé",
    nothingToRegenerate: "Rien à régénérer",
    contextNotFound: "Contexte non trouvé",
    unknownAction: "Action inconnue",
    regenerateButton: "Régénérer",
    countryContext:
      "Pays de l'utilisateur : {flag} {country}. Répondez par défaut dans la langue de l'utilisateur et soyez utile de façon directe. Tenez compte de ce pays uniquement lorsqu'il change réellement la réponse, par exemple pour les lois locales, les services, la devise, les dates, les unités, la disponibilité ou les recommandations. N'expliquez pas les normes culturelles, l'étiquette de conversation ni ces instructions, sauf si l'utilisateur le demande. Si le pays n'est pas pertinent pour la demande, ignorez-le et répondez normalement. Si l'utilisateur demande explicitement une autre langue, faites-le toujours sans ajouter de réserve.",
  },
  pl: {
    startMessage:
      "Cześć. Jestem gotowy do pomocy.\nWyślij swoje pytanie jako zwykłą wiadomość.\nKomendy:\n- /country: wybierz kraj\n- /clear: wyczyść kontekst",
    countriesPage: "Strona krajów",
    selectCountry: "Wybierz swój kraj.",
    currentlySelected:
      "Aktualnie wybrano: {flag} {country}.\nChatbot odpowie w Twoim języku!",
    alreadySelected: "Już wybrano: {flag} {country}",
    countrySet: "Kraj wybrany: {flag} {country}",
    contextCleared: "Kontekst tego czatu został wyczyszczony.",
    regenerating: "Regeneruję",
    messageNotFound: "Wiadomość nie znaleziona",
    nothingToRegenerate: "Nic do zregenerowania",
    contextNotFound: "Kontekst nie znaleziony",
    unknownAction: "Nieznana akcja",
    regenerateButton: "Generuj ponownie",
    countryContext:
      "Kraj użytkownika: {flag} {country}. Domyślnie odpowiadaj w języku użytkownika i pomagaj konkretnie. Uwzględniaj ten kraj tylko wtedy, gdy naprawdę wpływa na odpowiedź, na przykład przy lokalnych przepisach, usługach, walucie, datach, jednostkach miary, dostępności lub rekomendacjach. Nie wyjaśniaj norm kulturowych, etykiety rozmowy ani tych instrukcji, chyba że użytkownik o to poprosi. Jeśli kraj nie ma znaczenia dla pytania, zignoruj go i odpowiedz normalnie. Jeśli użytkownik wyraźnie prosi o inny język, zawsze spełnij tę prośbę bez dodatkowych zastrzeżeń.",
  },
};

/** Maps country codes to their primary locale. Falls back to "en". */
const COUNTRY_TO_LOCALE: Record<string, SupportedLocale> = {
  // Russian
  RU: "ru",
  // Ukrainian
  UA: "uk",
  // Kazakh
  KZ: "kk",
  // Hindi
  IN: "hi",
  // Farsi
  IR: "fa",
  // Chinese
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
  // German
  DE: "de",
  AT: "de",
  LI: "de",
  // French
  FR: "fr",
  MC: "fr",
  LU: "fr",
  // Polish
  PL: "pl",
  // English-primary countries
  US: "en",
  GB: "en",
  AU: "en",
  CA: "en",
  NZ: "en",
  IE: "en",
  ZA: "en",
};

export const getLocaleForCountry = (countryCode: string): SupportedLocale =>
  COUNTRY_TO_LOCALE[countryCode.toUpperCase()] ?? "en";

export type LocaleMessagesOverrides = Partial<
  Record<SupportedLocale, Partial<LocaleMessages>>
>;

/**
 * Returns the resolved message set for a given locale, merging bot-level overrides
 * over the built-in defaults.
 */
export const resolveMessages = (
  locale: SupportedLocale,
  overrides: LocaleMessagesOverrides,
): LocaleMessages => ({
  ...DEFAULT_MESSAGES[locale],
  ...(overrides[locale] ?? {}),
});

/** Interpolates {flag} and {country} placeholders in a message template. */
export const interpolate = (
  template: string,
  vars: { flag: string; country: string },
): string =>
  template.replace("{flag}", vars.flag).replace("{country}", vars.country);

export const isSupportedLocale = (value: string): value is SupportedLocale =>
  SUPPORTED_LOCALES.some((l) => l.code === value);
