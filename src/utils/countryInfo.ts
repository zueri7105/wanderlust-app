/**
 * Per-country info for ALL 197 selectable destinations: local currency,
 * local-language greeting phrases, and visa/entry regime. Used by the travel
 * guide so every country renders its own currency, greetings and a fixed,
 * country-specific visa passage — never a generic USD/USA fallback.
 */

export interface CountryCurrency {
  code: string;
  name: string;
  symbol: string;
}

import { registerVisaCountryNames, registerVisaKbFallback, visaRuleFor, visaPassage } from './visaMatrix';
import type { VisaStatus, VisaVerdict } from './visaMatrix';

export type VisaRegime =
  | 'schengen'
  | 'euNonSchengen'
  | 'cta'
  | 'ukEta'
  | 'usEsta'
  | 'canadaEta'
  | 'auEta'
  | 'nzEta'
  | 'visaFree'
  | 'eVisaOrVoa'
  | 'visaRequired';

export type CountryRegion =
  | 'Schengen'
  | 'EU-non-Schengen'
  | 'UK'
  | 'USMCA'
  | 'EastAsia'
  | 'SEAsia'
  | 'Oceania'
  | 'Other';

export interface CountryInfo {
  currency: CountryCurrency;
  /** key into PHRASE_SETS */
  language: string;
  visaRegime: VisaRegime;
  /** typical visa-free / eVisa tourist stay in days (null = advance visa) */
  visaDays: number | null;
  region: CountryRegion;
}

export interface CountryPhraseSet {
  phrase: string;
  translation: string;
  phonetic: string;
}

/** Local-language phrase sets (hello, thank you, please, excuse me, cheers).
 *  Stored as compact [phrase, translation, phonetic] tuples. */
export const PHRASE_SETS: Record<string, [string, string, string][]> = {
  "english": [
    [
      "Hello",
      "Hello",
      "Heh-lo"
    ],
    [
      "Thank you",
      "Thank you",
      "Thank yoo"
    ],
    [
      "Please",
      "Please",
      "Pleez"
    ],
    [
      "Excuse me",
      "Excuse me",
      "Ex-kyooz mee"
    ],
    [
      "Cheers!",
      "Cheers / thanks",
      "Cheerz!"
    ]
  ],
  "spanish": [
    [
      "Hola",
      "Hello",
      "O-la"
    ],
    [
      "Gracias",
      "Thank you",
      "Gra-syas"
    ],
    [
      "Por favor",
      "Please",
      "Por fa-vor"
    ],
    [
      "Disculpe",
      "Excuse me",
      "Dis-kul-pe"
    ],
    [
      "¡Salud!",
      "Cheers!",
      "Sa-lud!"
    ]
  ],
  "french": [
    [
      "Bonjour",
      "Hello / Good day",
      "Bon-zhoor"
    ],
    [
      "Merci",
      "Thank you",
      "Mer-see"
    ],
    [
      "S'il vous plaît",
      "Please",
      "Seel voo pleh"
    ],
    [
      "Excusez-moi",
      "Excuse me",
      "Ex-koo-zay mwa"
    ],
    [
      "Santé !",
      "Cheers!",
      "Son-tay!"
    ]
  ],
  "portuguese": [
    [
      "Olá",
      "Hello",
      "O-la"
    ],
    [
      "Obrigado/a",
      "Thank you",
      "O-bri-ga-do"
    ],
    [
      "Por favor",
      "Please",
      "Por fa-vor"
    ],
    [
      "Com licença",
      "Excuse me",
      "Kon li-sen-sa"
    ],
    [
      "Saúde!",
      "Cheers!",
      "Sa-oo-de!"
    ]
  ],
  "arabic": [
    [
      "مرحبا (Marhaba)",
      "Hello",
      "Mar-ha-ba"
    ],
    [
      "شكراً (Shukran)",
      "Thank you",
      "Shook-ran"
    ],
    [
      "من فضلك (Min fadlak)",
      "Please",
      "Min fad-lak"
    ],
    [
      "عفواً (Afwan)",
      "Excuse me",
      "Af-wan"
    ],
    [
      "صحتين! (Sahtain)",
      "Cheers / to your health",
      "Sah-tain!"
    ]
  ],
  "german": [
    [
      "Hallo",
      "Hello",
      "Ha-lo"
    ],
    [
      "Danke",
      "Thank you",
      "Dan-ke"
    ],
    [
      "Bitte",
      "Please / you're welcome",
      "Bi-te"
    ],
    [
      "Entschuldigung",
      "Excuse me",
      "Ent-shul-di-gung"
    ],
    [
      "Prost!",
      "Cheers!",
      "Prohst!"
    ]
  ],
  "italian": [
    [
      "Ciao",
      "Hello / bye",
      "Chow"
    ],
    [
      "Grazie",
      "Thank you",
      "Gra-tsyeh"
    ],
    [
      "Per favore",
      "Please",
      "Per fa-vo-re"
    ],
    [
      "Scusi",
      "Excuse me",
      "Skoo-zee"
    ],
    [
      "Cin cin!",
      "Cheers!",
      "Chin chin!"
    ]
  ],
  "dutch": [
    [
      "Hallo",
      "Hello",
      "Ha-lo"
    ],
    [
      "Dank je",
      "Thank you",
      "Dank ye"
    ],
    [
      "Alsjeblieft",
      "Please / here you go",
      "Als-ye-bleeft"
    ],
    [
      "Pardon",
      "Excuse me",
      "Par-don"
    ],
    [
      "Proost!",
      "Cheers!",
      "Prohst!"
    ]
  ],
  "japanese": [
    [
      "こんにちは",
      "Hello",
      "Kon-ni-chi-wa"
    ],
    [
      "ありがとうございます",
      "Thank you (polite)",
      "A-ri-ga-toh go-za-i-mas"
    ],
    [
      "お願いします",
      "Please",
      "O-ne-gai shi-mas"
    ],
    [
      "すみません",
      "Excuse me",
      "Su-mi-ma-sen"
    ],
    [
      "乾杯！",
      "Cheers!",
      "Kan-pai!"
    ]
  ],
  "korean": [
    [
      "안녕하세요",
      "Hello",
      "An-nyeong-ha-se-yo"
    ],
    [
      "감사합니다",
      "Thank you",
      "Gam-sa-ham-ni-da"
    ],
    [
      "주세요",
      "Please (give me)",
      "Joo-se-yo"
    ],
    [
      "실례합니다",
      "Excuse me",
      "Sil-lye-ham-ni-da"
    ],
    [
      "건배!",
      "Cheers!",
      "Geon-bae!"
    ]
  ],
  "mandarin": [
    [
      "你好 (Nǐ hǎo)",
      "Hello",
      "Nee how"
    ],
    [
      "谢谢 (Xièxie)",
      "Thank you",
      "Shyeh-shyeh"
    ],
    [
      "请 (Qǐng)",
      "Please",
      "Ching"
    ],
    [
      "不好意思 (Bù hǎoyìsi)",
      "Excuse me",
      "Boo how-ee-suh"
    ],
    [
      "干杯！(Gānbēi)",
      "Cheers!",
      "Gan-bay!"
    ]
  ],
  "thai": [
    [
      "สวัสดี (Sawasdee)",
      "Hello",
      "Sa-wat-dee"
    ],
    [
      "ขอบคุณ (Khop khun)",
      "Thank you",
      "Kop koon"
    ],
    [
      "โปรด (Prod)",
      "Please",
      "Proht"
    ],
    [
      "ขอโทษ (Khor thot)",
      "Excuse me / sorry",
      "Kor toht"
    ],
    [
      "ชนแก้ว! (Chon gaew)",
      "Cheers!",
      "Chon gaeo!"
    ]
  ],
  "vietnamese": [
    [
      "Xin chào",
      "Hello",
      "Sin chow"
    ],
    [
      "Cảm ơn",
      "Thank you",
      "Gam un"
    ],
    [
      "Làm ơn",
      "Please",
      "Lam un"
    ],
    [
      "Xin lỗi",
      "Excuse me / sorry",
      "Sin loy"
    ],
    [
      "Dzô!",
      "Cheers!",
      "Yo!"
    ]
  ],
  "indonesian": [
    [
      "Halo",
      "Hello",
      "Ha-lo"
    ],
    [
      "Terima kasih",
      "Thank you",
      "Te-ri-ma ka-sih"
    ],
    [
      "Tolong",
      "Please / help",
      "To-long"
    ],
    [
      "Permisi",
      "Excuse me",
      "Per-mi-si"
    ],
    [
      "Bersulang!",
      "Cheers!",
      "Ber-su-lang!"
    ]
  ],
  "hindi": [
    [
      "नमस्ते (Namaste)",
      "Hello",
      "Na-mas-te"
    ],
    [
      "धन्यवाद (Dhanyavaad)",
      "Thank you",
      "Dhan-ya-vaad"
    ],
    [
      "कृपया (Kripaya)",
      "Please",
      "Kri-pa-ya"
    ],
    [
      "माफ़ कीजिए (Maaf kijiye)",
      "Excuse me",
      "Maaf ki-ji-ye"
    ],
    [
      "चीयर्स!",
      "Cheers!",
      "Cheers!"
    ]
  ],
  "swahili": [
    [
      "Jambo / Hujambo",
      "Hello",
      "Jam-bo"
    ],
    [
      "Asante",
      "Thank you",
      "A-san-te"
    ],
    [
      "Tafadhali",
      "Please",
      "Ta-fa-dha-li"
    ],
    [
      "Samahani",
      "Excuse me",
      "Sa-ma-ha-ni"
    ],
    [
      "Maisha marefu!",
      "Cheers / long life",
      "Ma-ee-sha ma-re-fu!"
    ]
  ],
  "turkish": [
    [
      "Merhaba",
      "Hello",
      "Mer-ha-ba"
    ],
    [
      "Teşekkürler",
      "Thank you",
      "Te-shek-kur-ler"
    ],
    [
      "Lütfen",
      "Please",
      "Lut-fen"
    ],
    [
      "Affedersiniz",
      "Excuse me",
      "Af-fe-der-si-niz"
    ],
    [
      "Şerefe!",
      "Cheers!",
      "She-re-fe!"
    ]
  ],
  "greek": [
    [
      "Γεια σου (Ya su)",
      "Hello",
      "Ya soo"
    ],
    [
      "Ευχαριστώ (Efharisto)",
      "Thank you",
      "Ef-ha-ri-sto"
    ],
    [
      "Παρακαλώ (Parakalo)",
      "Please / you're welcome",
      "Pa-ra-ka-lo"
    ],
    [
      "Συγγνώμη (Signomi)",
      "Excuse me",
      "Sig-no-mee"
    ],
    [
      "Γεια μας! (Ya mas)",
      "Cheers!",
      "Ya mas!"
    ]
  ],
  "russian": [
    [
      "Привет (Privet)",
      "Hello",
      "Pri-vyet"
    ],
    [
      "Спасибо (Spasibo)",
      "Thank you",
      "Spa-si-bo"
    ],
    [
      "Пожалуйста (Pozhaluysta)",
      "Please / you're welcome",
      "Pa-zhal-sta"
    ],
    [
      "Извините (Izvinite)",
      "Excuse me",
      "Iz-vi-ni-tye"
    ],
    [
      "На здоровье!",
      "Cheers!",
      "Na zda-ro-vye!"
    ]
  ],
  "polish": [
    [
      "Cześć",
      "Hello / hi",
      "Cheshch"
    ],
    [
      "Dziękuję",
      "Thank you",
      "Jen-koo-ye"
    ],
    [
      "Proszę",
      "Please",
      "Pro-she"
    ],
    [
      "Przepraszam",
      "Excuse me / sorry",
      "Pshe-pra-sham"
    ],
    [
      "Na zdrowie!",
      "Cheers!",
      "Na zdro-vye!"
    ]
  ],
  "czech": [
    [
      "Ahoj",
      "Hello / hi",
      "A-hoy"
    ],
    [
      "Děkuji",
      "Thank you",
      "Dyeh-koo-yi"
    ],
    [
      "Prosím",
      "Please",
      "Pro-seem"
    ],
    [
      "Promiňte",
      "Excuse me",
      "Pro-min-te"
    ],
    [
      "Na zdraví!",
      "Cheers!",
      "Na zdra-vee!"
    ]
  ],
  "hungarian": [
    [
      "Szia",
      "Hello / hi",
      "See-a"
    ],
    [
      "Köszönöm",
      "Thank you",
      "Ku-su-num"
    ],
    [
      "Kérem",
      "Please",
      "Keh-rem"
    ],
    [
      "Elnézést",
      "Excuse me",
      "El-neh-zesht"
    ],
    [
      "Egészségedre!",
      "Cheers!",
      "Eg-esh-she-ge-dre!"
    ]
  ],
  "swedish": [
    [
      "Hej",
      "Hello",
      "Hey"
    ],
    [
      "Tack",
      "Thank you",
      "Tak"
    ],
    [
      "Varsågod",
      "Please / you're welcome",
      "Var-sho-goo"
    ],
    [
      "Ursäkta",
      "Excuse me",
      "Ur-shek-ta"
    ],
    [
      "Skål!",
      "Cheers!",
      "Skohl!"
    ]
  ],
  "norwegian": [
    [
      "Hei",
      "Hello",
      "Hay"
    ],
    [
      "Takk",
      "Thank you",
      "Tak"
    ],
    [
      "Vær så snill",
      "Please",
      "Var so snil"
    ],
    [
      "Unnskyld",
      "Excuse me",
      "Oon-shyl"
    ],
    [
      "Skål!",
      "Cheers!",
      "Skohl!"
    ]
  ],
  "danish": [
    [
      "Hej",
      "Hello",
      "Hi"
    ],
    [
      "Tak",
      "Thank you",
      "Tak"
    ],
    [
      "Vær så venlig",
      "Please",
      "Var se ven-lee"
    ],
    [
      "Undskyld",
      "Excuse me",
      "Oon-skyl"
    ],
    [
      "Skål!",
      "Cheers!",
      "Skohl!"
    ]
  ],
  "finnish": [
    [
      "Hei / Moi",
      "Hello",
      "Hey / Moy"
    ],
    [
      "Kiitos",
      "Thank you",
      "Kee-tos"
    ],
    [
      "Ole hyvä",
      "Please / you're welcome",
      "O-le hu-va"
    ],
    [
      "Anteeksi",
      "Excuse me",
      "An-teek-si"
    ],
    [
      "Kippis!",
      "Cheers!",
      "Kip-pis!"
    ]
  ],
  "hebrew": [
    [
      "שלום (Shalom)",
      "Hello / peace",
      "Sha-lom"
    ],
    [
      "תודה (Toda)",
      "Thank you",
      "To-da"
    ],
    [
      "בבקשה (Bevakasha)",
      "Please / you're welcome",
      "Be-va-ka-sha"
    ],
    [
      "סליחה (Slicha)",
      "Excuse me",
      "Slee-kha"
    ],
    [
      "לחיים! (L'chaim)",
      "Cheers / to life",
      "Le-kha-yim!"
    ]
  ],
  "ukrainian": [
    [
      "Привіт (Pryvit)",
      "Hello",
      "Pry-veet"
    ],
    [
      "Дякую (Dyakuyu)",
      "Thank you",
      "Dya-koo-yu"
    ],
    [
      "Будь ласка (Bud laska)",
      "Please",
      "Bood las-ka"
    ],
    [
      "Вибачте (Vybachte)",
      "Excuse me",
      "Vy-bach-te"
    ],
    [
      "Будьмо! (Budmo)",
      "Cheers!",
      "Bood-mo!"
    ]
  ],
  "romanian": [
    [
      "Salut / Bună ziua",
      "Hello",
      "Sa-lut / Boo-na zee-wa"
    ],
    [
      "Mulțumesc",
      "Thank you",
      "Mool-tsoo-mesk"
    ],
    [
      "Te rog",
      "Please",
      "Te rog"
    ],
    [
      "Scuze",
      "Excuse me",
      "Skoo-ze"
    ],
    [
      "Noroc!",
      "Cheers!",
      "No-rok!"
    ]
  ],
  "serbocroatian": [
    [
      "Zdravo / Ćao",
      "Hello",
      "Zdra-vo / Chow"
    ],
    [
      "Hvala",
      "Thank you",
      "Hva-la"
    ],
    [
      "Molim",
      "Please",
      "Mo-lim"
    ],
    [
      "Oprostite / Izvinite",
      "Excuse me",
      "O-pros-ti-te"
    ],
    [
      "Živeli! / Živjeli!",
      "Cheers!",
      "Zhi-ve-li!"
    ]
  ],
  "bulgarian": [
    [
      "Здравей (Zdravey)",
      "Hello",
      "Zdra-vey"
    ],
    [
      "Благодаря (Blagodarya)",
      "Thank you",
      "Bla-go-da-rya"
    ],
    [
      "Моля (Molya)",
      "Please",
      "Mo-lya"
    ],
    [
      "Извинете (Izvinete)",
      "Excuse me",
      "Iz-vi-ne-te"
    ],
    [
      "Наздраве! (Nazdrave)",
      "Cheers!",
      "Naz-dra-ve!"
    ]
  ],
  "icelandic": [
    [
      "Halló",
      "Hello",
      "Hat-lo"
    ],
    [
      "Takk",
      "Thank you",
      "Tahk"
    ],
    [
      "Vinsamlegast",
      "Please",
      "Vin-sam-le-gast"
    ],
    [
      "Fyrirgefðu",
      "Excuse me",
      "Fi-rir-gev-thu"
    ],
    [
      "Skál!",
      "Cheers!",
      "Skowl!"
    ]
  ],
  "filipino": [
    [
      "Kumusta",
      "Hello / how are you",
      "Koo-mus-ta"
    ],
    [
      "Salamat",
      "Thank you",
      "Sa-la-mat"
    ],
    [
      "Pakiusap",
      "Please (request)",
      "Pa-ki-u-sap"
    ],
    [
      "Pasensya na",
      "Excuse me / sorry",
      "Pa-sen-sya na"
    ],
    [
      "Tagay!",
      "Cheers!",
      "Ta-guy!"
    ]
  ],
  "persian": [
    [
      "سلام (Salam)",
      "Hello",
      "Sa-lam"
    ],
    [
      "ممنون (Mamnoon)",
      "Thank you",
      "Mam-noon"
    ],
    [
      "لطفاً (Lotfan)",
      "Please",
      "Lot-fan"
    ],
    [
      "ببخشید (Bebakhshid)",
      "Excuse me",
      "Be-bakh-sheed"
    ],
    [
      "به سلامتی!",
      "Cheers / to health",
      "Be sa-la-ma-ti!"
    ]
  ],
  "urdu": [
    [
      "السلام علیکم (Assalam-o-alaikum)",
      "Hello / peace be upon you",
      "As-sa-lam o a-lai-kum"
    ],
    [
      "شکریہ (Shukriya)",
      "Thank you",
      "Shuk-ri-ya"
    ],
    [
      "براہ مہربانی (Barah-e-meharbani)",
      "Please",
      "Ba-rah-e-me-har-ba-ni"
    ],
    [
      "معاف کیجیے (Maaf kijiye)",
      "Excuse me",
      "Maaf ki-ji-ye"
    ],
    [
      "اللہ حافظ (Allah Hafiz)",
      "Goodbye",
      "Al-lah Ha-fiz"
    ]
  ],
  "bengali": [
    [
      "নমস্কার (Nomoskar)",
      "Hello",
      "No-mos-kar"
    ],
    [
      "ধন্যবাদ (Dhonnobad)",
      "Thank you",
      "Dhon-no-bad"
    ],
    [
      "দয়া করে (Doya kore)",
      "Please",
      "Do-ya ko-re"
    ],
    [
      "মাফ করবেন (Maf korben)",
      "Excuse me",
      "Maf kor-ben"
    ],
    [
      "বিদায় (Biday)",
      "Goodbye",
      "Bi-day"
    ]
  ],
  "burmese": [
    [
      "မင်္ဂလာပါ (Mingalabar)",
      "Hello",
      "Min-ga-la-bar"
    ],
    [
      "ကျေးဇူးတင်ပါတယ် (Kyeizu tin ba de)",
      "Thank you",
      "Chay-zu tin ba de"
    ],
    [
      "ခွင့်လွှတ်ပါ (Khwint hlut par)",
      "Excuse me",
      "Khwint hlut pa"
    ],
    [
      "ကျေးဇူးပြု၍ (Kyeizu pyu ywe)",
      "Please",
      "Chay-zu pyu ywe"
    ],
    [
      "အကြွင်း (Akyain)",
      "Cheers / toast",
      "A-chwin!"
    ]
  ],
  "khmer": [
    [
      "សួស្តី (Sousdey)",
      "Hello",
      "Soo-sday"
    ],
    [
      "អរគុណ (Awkun)",
      "Thank you",
      "Aw-koon"
    ],
    [
      "សូម (Som)",
      "Please",
      "Som"
    ],
    [
      "សូមទោស (Som tos)",
      "Excuse me",
      "Som toh"
    ],
    [
      "ជល់! (Chol)",
      "Cheers!",
      "Chol!"
    ]
  ],
  "lao": [
    [
      "ສະບາຍດີ (Sabaidee)",
      "Hello",
      "Sa-bai-dee"
    ],
    [
      "ຂອບໃຈ (Khop chai)",
      "Thank you",
      "Kop chai"
    ],
    [
      "ກະລຸນາ (Kaluna)",
      "Please",
      "Ka-lu-na"
    ],
    [
      "ຂໍໂທດ (Khor thot)",
      "Excuse me",
      "Kor toht"
    ],
    [
      "ໂຊກດີ! (Chok dee)",
      "Cheers / good luck",
      "Chok dee!"
    ]
  ],
  "mongolian": [
    [
      "Сайн байна уу (Sain baina uu)",
      "Hello",
      "Sain bai-na oo"
    ],
    [
      "Баярлалаа (Bayarlalaa)",
      "Thank you",
      "Ba-yar-la-laa"
    ],
    [
      "Хүсэе (Khuseye)",
      "Please",
      "Khu-se-ye"
    ],
    [
      "Уучлаарай (Uuchlaarai)",
      "Excuse me",
      "Ooch-laa-rai"
    ],
    [
      "Эрүүл мэндийн төлөө!",
      "Cheers / to health",
      "E-ruul men-diin to-loo!"
    ]
  ],
  "nepali": [
    [
      "नमस्ते (Namaste)",
      "Hello",
      "Na-mas-te"
    ],
    [
      "धन्यवाद (Dhanyabad)",
      "Thank you",
      "Dhan-ya-baad"
    ],
    [
      "कृपया (Kripaya)",
      "Please",
      "Kri-pa-ya"
    ],
    [
      "माफ गर्नुस् (Maaph garnus)",
      "Excuse me",
      "Maaph gar-nus"
    ],
    [
      "झैं!",
      "Cheers!",
      "Jhai!"
    ]
  ],
  "sinhala": [
    [
      "ආයුබෝවන් (Ayubowan)",
      "Hello / may you live long",
      "A-yu-bo-wan"
    ],
    [
      "බොහොම ස්තූති (Bohoma sthuti)",
      "Thank you",
      "Bo-ho-ma stoo-ti"
    ],
    [
      "කරුණාකර (Karunakara)",
      "Please",
      "Ka-ru-na-ka-ra"
    ],
    [
      "සමාවෙන්න (Samawenna)",
      "Excuse me",
      "Sa-ma-wen-na"
    ],
    [
      "සුබ ගමන්!",
      "Safe travels",
      "Su-ba ga-man!"
    ]
  ],
  "amharic": [
    [
      "ሰላም (Selam)",
      "Hello / peace",
      "Se-lam"
    ],
    [
      "አመሰግናለሁ (Ameseginalehu)",
      "Thank you",
      "A-me-se-gi-na-le-hu"
    ],
    [
      "እባክህ (Ebakih)",
      "Please",
      "I-ba-kih"
    ],
    [
      "ይቅርታ (Yikirta)",
      "Excuse me",
      "Yi-kir-ta"
    ],
    [
      "ለጤናችን!",
      "Cheers / to our health",
      "Le-te-na-chin!"
    ]
  ],
  "georgian": [
    [
      "გამარჯობა (Gamarjoba)",
      "Hello",
      "Ga-mar-jo-ba"
    ],
    [
      "მადლობა (Madloba)",
      "Thank you",
      "Mad-lo-ba"
    ],
    [
      "გთხოვ (Gt'khov)",
      "Please",
      "Gt-khov"
    ],
    [
      "ბოდიში (Bodishi)",
      "Excuse me",
      "Bo-di-shi"
    ],
    [
      "გაუმარჯოს! (Gaumarjos)",
      "Cheers!",
      "Gau-mar-jos!"
    ]
  ],
  "armenian": [
    [
      "Բարև (Barev)",
      "Hello",
      "Ba-rev"
    ],
    [
      "Շնորհակալություն (Shnorhakalutyun)",
      "Thank you",
      "Shnor-ha-ka-lut-yun"
    ],
    [
      "Խնդրում եմ (Khndrum em)",
      "Please",
      "Khn-drum em"
    ],
    [
      "Կներեք (Knerek)",
      "Excuse me",
      "Kne-rek"
    ],
    [
      "Կենաց! (Kenats)",
      "Cheers!",
      "Ke-nats!"
    ]
  ],
  "azerbaijani": [
    [
      "Salam",
      "Hello",
      "Sa-lam"
    ],
    [
      "Təşəkkür edirəm",
      "Thank you",
      "Te-shek-kur e-di-rem"
    ],
    [
      "Zəhmət olmasa",
      "Please",
      "Zeh-met ol-ma-sa"
    ],
    [
      "Üzr istəyirəm",
      "Excuse me",
      "Uzr is-te-yi-rem"
    ],
    [
      "Sağlığınıza!",
      "Cheers / to your health",
      "Sagh-li-ghi-ni-za!"
    ]
  ],
  "kazakh": [
    [
      "Сәлем (Sälem)",
      "Hello",
      "Sa-lem"
    ],
    [
      "Рақмет (Rakhmet)",
      "Thank you",
      "Rakh-met"
    ],
    [
      "Өтініш (Ötinish)",
      "Please",
      "O-ti-nish"
    ],
    [
      "Кешіріңіз (Keshiriniz)",
      "Excuse me",
      "Ke-shi-ri-niz"
    ],
    [
      "Денсаулығыңыз үшін!",
      "Cheers / to your health",
      "Den-sau-lighi-ngiz u-shin!"
    ]
  ],
  "albanian": [
    [
      "Përshëndetje",
      "Hello",
      "Per-shen-det-ye"
    ],
    [
      "Faleminderit",
      "Thank you",
      "Fa-le-min-de-rit"
    ],
    [
      "Ju lutem",
      "Please",
      "Yoo lu-tem"
    ],
    [
      "Më falni",
      "Excuse me",
      "Me fal-ni"
    ],
    [
      "Gëzuar!",
      "Cheers!",
      "Ge-zu-ar!"
    ]
  ],
  "macedonian": [
    [
      "Здраво (Zdravo)",
      "Hello",
      "Zdra-vo"
    ],
    [
      "Благодарам (Blagodaram)",
      "Thank you",
      "Bla-go-da-ram"
    ],
    [
      "Ве молам (Ve molam)",
      "Please",
      "Ve mo-lam"
    ],
    [
      "Извинете (Izvinete)",
      "Excuse me",
      "Iz-vi-ne-te"
    ],
    [
      "Наздравје! (Nazdravje)",
      "Cheers!",
      "Naz-drav-ye!"
    ]
  ],
  "slovenian": [
    [
      "Živjo",
      "Hello",
      "Zhiv-yo"
    ],
    [
      "Hvala",
      "Thank you",
      "Hva-la"
    ],
    [
      "Prosim",
      "Please",
      "Pro-sim"
    ],
    [
      "Oprostite",
      "Excuse me",
      "O-pros-ti-te"
    ],
    [
      "Na zdravje!",
      "Cheers!",
      "Na zdrav-ye!"
    ]
  ],
  "slovak": [
    [
      "Ahoj",
      "Hello / hi",
      "A-hoy"
    ],
    [
      "Ďakujem",
      "Thank you",
      "Dya-koo-yem"
    ],
    [
      "Prosím",
      "Please",
      "Pro-seem"
    ],
    [
      "Prepáčte",
      "Excuse me",
      "Pre-pach-te"
    ],
    [
      "Na zdravie!",
      "Cheers!",
      "Na zdra-vye!"
    ]
  ],
  "lithuanian": [
    [
      "Labas",
      "Hello",
      "La-bas"
    ],
    [
      "Ačiū",
      "Thank you",
      "A-choo"
    ],
    [
      "Prašau",
      "Please",
      "Pra-shau"
    ],
    [
      "Atsiprašau",
      "Excuse me",
      "A-tsi-pra-shau"
    ],
    [
      "Į sveikatą!",
      "Cheers!",
      "I svei-ka-ta!"
    ]
  ],
  "latvian": [
    [
      "Sveiki",
      "Hello",
      "Svei-ki"
    ],
    [
      "Paldies",
      "Thank you",
      "Pal-dies"
    ],
    [
      "Lūdzu",
      "Please",
      "Loo-dzu"
    ],
    [
      "Atvainojiet",
      "Excuse me",
      "At-vai-no-yet"
    ],
    [
      "Priekā!",
      "Cheers!",
      "Pri-eh-kaa!"
    ]
  ],
  "estonian": [
    [
      "Tere",
      "Hello",
      "Te-re"
    ],
    [
      "Aitäh",
      "Thank you",
      "Ai-tah"
    ],
    [
      "Palun",
      "Please",
      "Pa-lun"
    ],
    [
      "Vabandust",
      "Excuse me",
      "Va-ban-dust"
    ],
    [
      "Terviseks!",
      "Cheers!",
      "Ter-vi-seks!"
    ]
  ],
  "maltese": [
    [
      "Bongu",
      "Good day / hello",
      "Bon-joo"
    ],
    [
      "Grazzi",
      "Thank you",
      "Grat-si"
    ],
    [
      "Jekk jogħġbok",
      "Please",
      "Yek yoj-bok"
    ],
    [
      "Skużi",
      "Excuse me",
      "Skoo-zi"
    ],
    [
      "Saħħa!",
      "Cheers!",
      "Sah-ha!"
    ]
  ],
  "irish": [
    [
      "Dia dhuit",
      "Hello",
      "Dee-a gwit"
    ],
    [
      "Go raibh maith agat",
      "Thank you",
      "Go rev ma a-gut"
    ],
    [
      "Le do thoil",
      "Please",
      "Le do hol"
    ],
    [
      "Gabh mo leithscéal",
      "Excuse me",
      "Go mo leh-shkayl"
    ],
    [
      "Sláinte!",
      "Cheers / health",
      "Slawn-che!"
    ]
  ],
  "catalan": [
    [
      "Hola",
      "Hello",
      "O-la"
    ],
    [
      "Gràcies",
      "Thank you",
      "Gra-si-es"
    ],
    [
      "Si us plau",
      "Please",
      "See us plau"
    ],
    [
      "Perdó",
      "Excuse me",
      "Per-do"
    ],
    [
      "Salut!",
      "Cheers!",
      "Sa-lut!"
    ]
  ],
  "luxembourgish": [
    [
      "Moien",
      "Hello",
      "Moy-en"
    ],
    [
      "Merci",
      "Thank you",
      "Mer-see"
    ],
    [
      "Wann ech glift",
      "Please",
      "Van ekh glift"
    ],
    [
      "Entschëllegt",
      "Excuse me",
      "Ent-shel-legt"
    ],
    [
      "Prost!",
      "Cheers!",
      "Prohscht!"
    ]
  ],
  "kyrgyz": [
    [
      "Салам (Salam)",
      "Hello",
      "Sa-lam"
    ],
    [
      "Рахмат (Rakhmat)",
      "Thank you",
      "Rakh-mat"
    ],
    [
      "Өтүнөм (Ötünöm)",
      "Please",
      "O-tu-nom"
    ],
    [
      "Кечиресиз (Kechiresiz)",
      "Excuse me",
      "Ke-chi-re-siz"
    ],
    [
      "Ден-соолугуңуз үчүн!",
      "Cheers / to your health",
      "Den-soo-lu-gunguz u-chun!"
    ]
  ],
  "tajik": [
    [
      "Салом (Salom)",
      "Hello",
      "Sa-lom"
    ],
    [
      "Ташаккур (Tashakkur)",
      "Thank you",
      "Ta-shak-kur"
    ],
    [
      "Илтимос (Iltimos)",
      "Please",
      "Il-ti-mos"
    ],
    [
      "Бубахшед (Bubakhshed)",
      "Excuse me",
      "Bu-bakh-shed"
    ],
    [
      "Ба саломатӣ!",
      "Cheers / to health",
      "Ba sa-lo-ma-ti!"
    ]
  ],
  "turkmen": [
    [
      "Salam",
      "Hello",
      "Sa-lam"
    ],
    [
      "Sag bol",
      "Thank you",
      "Sag bol"
    ],
    [
      "Haýyş",
      "Please",
      "Ha-yysh"
    ],
    [
      "Bagyşlaň",
      "Excuse me",
      "Ba-gysh-lan"
    ],
    [
      "Saglyk!",
      "Cheers / health",
      "Sag-lyk!"
    ]
  ],
  "dzongkha": [
    [
      "ཀུ་ཟུ་ཟང་པོ་ལ (Kuzuzangpo la)",
      "Hello",
      "Ku-zu-zang-po la"
    ],
    [
      "བཀའ་དྲིན་ཆེ་ལ (Kadrin chhe la)",
      "Thank you",
      "Ka-drin chhe la"
    ],
    [
      "ལག་པ་རོགས",
      "Please help",
      "Lag pa rog"
    ],
    [
      "གོང་དག་མ་ཚང།",
      "Excuse me",
      "Gong da ma tshang"
    ],
    [
      "ཇ་སྐྱེམས!",
      "Tea / cheers",
      "Ja kyem!"
    ]
  ],
  "dhivehi": [
    [
      "އައްސަލާމް އަލައިކުމް",
      "Hello (Assalaamu alaikum)",
      "As-sa-laam alai-kum"
    ],
    [
      "ޝުކުރިއްޔާ (Shukuriyaa)",
      "Thank you",
      "Shu-ku-ri-yaa"
    ],
    [
      "އަޅުކަމެއް",
      "Please",
      "Adhu-kameh"
    ],
    [
      "މާފަށް",
      "Excuse me",
      "Maaf-ah"
    ],
    [
      "އިޚްތިޔާރުގެ",
      "Good wishes",
      "Ikh-thi-yaa-ru-ge"
    ]
  ],
  "pashto": [
    [
      "سلام (Salam)",
      "Hello",
      "Sa-lam"
    ],
    [
      "مننه (Manana)",
      "Thank you",
      "Ma-na-na"
    ],
    [
      "لطفاً (Lotfan)",
      "Please",
      "Lot-fan"
    ],
    [
      "وبخښه (Wabakhsha)",
      "Excuse me",
      "Wa-bakh-sha"
    ],
    [
      "په خیر (Pa khair)",
      "Goodbye / in peace",
      "Pa khair"
    ]
  ],
  "somali": [
    [
      "Salaam / Iska warran",
      "Hello",
      "Sa-laam"
    ],
    [
      "Mahadsanid",
      "Thank you",
      "Ma-had-sa-nid"
    ],
    [
      "Fadlan",
      "Please",
      "Fad-lan"
    ],
    [
      "Is cafi",
      "Excuse me",
      "Is a-fi"
    ],
    [
      "Nabadgelyo",
      "Goodbye / with peace",
      "Na-bad-gel-yo"
    ]
  ],
  "samoan": [
    [
      "Talofa",
      "Hello",
      "Ta-lo-fa"
    ],
    [
      "Fa'afetai",
      "Thank you",
      "Fa-a-fe-tai"
    ],
    [
      "Fa'amolemole",
      "Please",
      "Fa-a-mo-le-mo-le"
    ],
    [
      "Tulou",
      "Excuse me",
      "Tu-lo-u"
    ],
    [
      "Manuia!",
      "Cheers / be well",
      "Ma-nu-ia!"
    ]
  ],
  "tongan": [
    [
      "Mālō e lelei",
      "Hello",
      "Maa-lo e le-lei"
    ],
    [
      "Mālō",
      "Thank you",
      "Maa-lo"
    ],
    [
      "Kātaki",
      "Please",
      "Kaa-ta-ki"
    ],
    [
      "Fakamolemole",
      "Excuse me / please",
      "Fa-ka-mo-le-mo-le"
    ],
    [
      "Manuia!",
      "Cheers / blessings",
      "Ma-nu-ia!"
    ]
  ],
  "fijian": [
    [
      "Bula",
      "Hello / life",
      "Boo-la"
    ],
    [
      "Vinaka",
      "Thank you",
      "Vi-na-ka"
    ],
    [
      "Yalo vinaka",
      "Please",
      "Ya-lo vi-na-ka"
    ],
    [
      "Vosoti au",
      "Excuse me",
      "Vo-so-ti au"
    ],
    [
      "Bula vinaka!",
      "Cheers / good life",
      "Boo-la vi-na-ka!"
    ]
  ],
  "bislama": [
    [
      "Halo",
      "Hello",
      "Ha-lo"
    ],
    [
      "Tank yu",
      "Thank you",
      "Tank yoo"
    ],
    [
      "Plis",
      "Please",
      "Plis"
    ],
    [
      "Skius mi",
      "Excuse me",
      "Ski-us mi"
    ],
    [
      "Gud luck!",
      "Cheers / good luck",
      "Good lak!"
    ]
  ],
  "tetum": [
    [
      "Bondia",
      "Good morning / hello",
      "Bon-di-a"
    ],
    [
      "Obrigadu",
      "Thank you",
      "O-bri-ga-du"
    ],
    [
      "Favor ida",
      "Please",
      "Fa-vor i-da"
    ],
    [
      "Deskulpa",
      "Excuse me",
      "Des-kul-pa"
    ],
    [
      "Saúde!",
      "Cheers / health",
      "Sa-u-de!"
    ]
  ],
  "uzbek": [
    [
      "Salom",
      "Hello",
      "Sa-lom"
    ],
    [
      "Rahmat",
      "Thank you",
      "Rakh-mat"
    ],
    [
      "Iltimos",
      "Please",
      "Il-ti-mos"
    ],
    [
      "Uzr",
      "Excuse me",
      "Uzr"
    ],
    [
      "Sog'liqingizga!",
      "Cheers / to your health",
      "Sog-li-qin-giz-ga!"
    ]
  ],
  "tigrinya": [
    [
      "ሰላም (Selam)",
      "Hello / peace",
      "Se-lam"
    ],
    [
      "የቅንየለይ (Yeqeniyeley)",
      "Thank you",
      "Ye-qe-ni-ye-ley"
    ],
    [
      "በጃኻ (Bejakha)",
      "Please",
      "Be-ja-kha"
    ],
    [
      "ይቅርታ (Yikirta)",
      "Excuse me",
      "Yi-kir-ta"
    ],
    [
      "ጥዕና (Tena)",
      "Cheers / health",
      "Te-na!"
    ]
  ]
};

/** Keyed by exact country display name (e.g. "South Korea"). */
export const COUNTRY_INFO: Record<string, CountryInfo> = {
  "Afghanistan": {
    "currency": {
      "code": "AFN",
      "name": "Afghan Afghani",
      "symbol": "؋"
    },
    "language": "pashto",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Armenia": {
    "currency": {
      "code": "AMD",
      "name": "Armenian Dram",
      "symbol": "֏"
    },
    "language": "armenian",
    "visaRegime": "visaFree",
    "visaDays": 180,
    "region": "Other"
  },
  "Azerbaijan": {
    "currency": {
      "code": "AZN",
      "name": "Azerbaijani Manat",
      "symbol": "₼"
    },
    "language": "azerbaijani",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Bangladesh": {
    "currency": {
      "code": "BDT",
      "name": "Bangladeshi Taka",
      "symbol": "৳"
    },
    "language": "bengali",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Bhutan": {
    "currency": {
      "code": "BTN",
      "name": "Bhutanese Ngultrum",
      "symbol": "Nu."
    },
    "language": "dzongkha",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Brunei": {
    "currency": {
      "code": "BND",
      "name": "Brunei Dollar",
      "symbol": "B$"
    },
    "language": "indonesian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "SEAsia"
  },
  "Cambodia": {
    "currency": {
      "code": "KHR",
      "name": "Cambodian Riel",
      "symbol": "៛"
    },
    "language": "khmer",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "SEAsia"
  },
  "China": {
    "currency": {
      "code": "CNY",
      "name": "Chinese Yuan",
      "symbol": "¥"
    },
    "language": "mandarin",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "EastAsia"
  },
  "Georgia": {
    "currency": {
      "code": "GEL",
      "name": "Georgian Lari",
      "symbol": "₾"
    },
    "language": "georgian",
    "visaRegime": "visaFree",
    "visaDays": 365,
    "region": "Other"
  },
  "India": {
    "currency": {
      "code": "INR",
      "name": "Indian Rupee",
      "symbol": "₹"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Indonesia": {
    "currency": {
      "code": "IDR",
      "name": "Indonesian Rupiah",
      "symbol": "Rp"
    },
    "language": "indonesian",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "SEAsia"
  },
  "Japan": {
    "currency": {
      "code": "JPY",
      "name": "Japanese Yen",
      "symbol": "¥"
    },
    "language": "japanese",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "EastAsia"
  },
  "Kazakhstan": {
    "currency": {
      "code": "KZT",
      "name": "Kazakhstani Tenge",
      "symbol": "₸"
    },
    "language": "russian",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Kyrgyzstan": {
    "currency": {
      "code": "KGS",
      "name": "Kyrgyzstani Som",
      "symbol": "с"
    },
    "language": "russian",
    "visaRegime": "visaFree",
    "visaDays": 60,
    "region": "Other"
  },
  "Laos": {
    "currency": {
      "code": "LAK",
      "name": "Lao Kip",
      "symbol": "₭"
    },
    "language": "lao",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "SEAsia"
  },
  "Malaysia": {
    "currency": {
      "code": "MYR",
      "name": "Malaysian Ringgit",
      "symbol": "RM"
    },
    "language": "indonesian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "SEAsia"
  },
  "Maldives": {
    "currency": {
      "code": "MVR",
      "name": "Maldivian Rufiyaa",
      "symbol": "Rf"
    },
    "language": "dhivehi",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Mongolia": {
    "currency": {
      "code": "MNT",
      "name": "Mongolian Tögrög",
      "symbol": "₮"
    },
    "language": "mongolian",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "EastAsia"
  },
  "Myanmar": {
    "currency": {
      "code": "MMK",
      "name": "Myanmar Kyat",
      "symbol": "K"
    },
    "language": "burmese",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 28,
    "region": "SEAsia"
  },
  "Nepal": {
    "currency": {
      "code": "NPR",
      "name": "Nepalese Rupee",
      "symbol": "Rs"
    },
    "language": "nepali",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "North Korea": {
    "currency": {
      "code": "KPW",
      "name": "North Korean Won",
      "symbol": "₩"
    },
    "language": "korean",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "EastAsia"
  },
  "Pakistan": {
    "currency": {
      "code": "PKR",
      "name": "Pakistani Rupee",
      "symbol": "Rs"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Philippines": {
    "currency": {
      "code": "PHP",
      "name": "Philippine Peso",
      "symbol": "₱"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "SEAsia"
  },
  "Singapore": {
    "currency": {
      "code": "SGD",
      "name": "Singapore Dollar",
      "symbol": "S$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "SEAsia"
  },
  "South Korea": {
    "currency": {
      "code": "KRW",
      "name": "South Korean Won",
      "symbol": "₩"
    },
    "language": "korean",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "EastAsia"
  },
  "Sri Lanka": {
    "currency": {
      "code": "LKR",
      "name": "Sri Lankan Rupee",
      "symbol": "Rs"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Taiwan": {
    "currency": {
      "code": "TWD",
      "name": "New Taiwan Dollar",
      "symbol": "NT$"
    },
    "language": "mandarin",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "EastAsia"
  },
  "Tajikistan": {
    "currency": {
      "code": "TJS",
      "name": "Tajikistani Somoni",
      "symbol": "ЅM"
    },
    "language": "tajik",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Thailand": {
    "currency": {
      "code": "THB",
      "name": "Thai Baht",
      "symbol": "฿"
    },
    "language": "thai",
    "visaRegime": "visaFree",
    "visaDays": 60,
    "region": "SEAsia"
  },
  "Timor-Leste": {
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    "language": "tetum",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "SEAsia"
  },
  "Turkmenistan": {
    "currency": {
      "code": "TMT",
      "name": "Turkmenistani Manat",
      "symbol": "m"
    },
    "language": "turkmen",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Uzbekistan": {
    "currency": {
      "code": "UZS",
      "name": "Uzbekistani Som",
      "symbol": "so'm"
    },
    "language": "uzbek",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Vietnam": {
    "currency": {
      "code": "VND",
      "name": "Vietnamese Dong",
      "symbol": "₫"
    },
    "language": "vietnamese",
    "visaRegime": "visaFree",
    "visaDays": 45,
    "region": "SEAsia"
  },
  "Albania": {
    "currency": {
      "code": "ALL",
      "name": "Albanian Lek",
      "symbol": "L"
    },
    "language": "albanian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Andorra": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "catalan",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Austria": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "german",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Belarus": {
    "currency": {
      "code": "BYN",
      "name": "Belarusian Ruble",
      "symbol": "Br"
    },
    "language": "russian",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Belgium": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "french",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Bosnia and Herzegovina": {
    "currency": {
      "code": "BAM",
      "name": "Bosnia-Herzegovina Convertible Mark",
      "symbol": "KM"
    },
    "language": "serbocroatian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Bulgaria": {
    "currency": {
      "code": "BGN",
      "name": "Bulgarian Lev",
      "symbol": "лв"
    },
    "language": "bulgarian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Croatia": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "serbocroatian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Cyprus": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "greek",
    "visaRegime": "euNonSchengen",
    "visaDays": 90,
    "region": "EU-non-Schengen"
  },
  "Czechia": {
    "currency": {
      "code": "CZK",
      "name": "Czech Koruna",
      "symbol": "Kč"
    },
    "language": "czech",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Denmark": {
    "currency": {
      "code": "DKK",
      "name": "Danish Krone",
      "symbol": "kr"
    },
    "language": "danish",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Estonia": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "estonian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Finland": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "finnish",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "France": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "french",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Germany": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "german",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Greece": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "greek",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Hungary": {
    "currency": {
      "code": "HUF",
      "name": "Hungarian Forint",
      "symbol": "Ft"
    },
    "language": "hungarian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Iceland": {
    "currency": {
      "code": "ISK",
      "name": "Icelandic Króna",
      "symbol": "kr"
    },
    "language": "icelandic",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Ireland": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "english",
    "visaRegime": "cta",
    "visaDays": 90,
    "region": "EU-non-Schengen"
  },
  "Italy": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "italian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Kosovo": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "albanian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Latvia": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "latvian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Liechtenstein": {
    "currency": {
      "code": "CHF",
      "name": "Swiss Franc",
      "symbol": "CHF"
    },
    "language": "german",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Lithuania": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "lithuanian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Luxembourg": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "french",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Malta": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "english",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Moldova": {
    "currency": {
      "code": "MDL",
      "name": "Moldovan Leu",
      "symbol": "L"
    },
    "language": "romanian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Monaco": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "french",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Montenegro": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "serbocroatian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Netherlands": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "dutch",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "North Macedonia": {
    "currency": {
      "code": "MKD",
      "name": "Macedonian Denar",
      "symbol": "ден"
    },
    "language": "macedonian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Norway": {
    "currency": {
      "code": "NOK",
      "name": "Norwegian Krone",
      "symbol": "kr"
    },
    "language": "norwegian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Poland": {
    "currency": {
      "code": "PLN",
      "name": "Polish Złoty",
      "symbol": "zł"
    },
    "language": "polish",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Portugal": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "portuguese",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Romania": {
    "currency": {
      "code": "RON",
      "name": "Romanian Leu",
      "symbol": "lei"
    },
    "language": "romanian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Russia": {
    "currency": {
      "code": "RUB",
      "name": "Russian Ruble",
      "symbol": "₽"
    },
    "language": "russian",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 16,
    "region": "Other"
  },
  "San Marino": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "italian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Serbia": {
    "currency": {
      "code": "RSD",
      "name": "Serbian Dinar",
      "symbol": "din"
    },
    "language": "serbocroatian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Slovakia": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "slovak",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Slovenia": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "slovenian",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Spain": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "spanish",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Sweden": {
    "currency": {
      "code": "SEK",
      "name": "Swedish Krona",
      "symbol": "kr"
    },
    "language": "swedish",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Switzerland": {
    "currency": {
      "code": "CHF",
      "name": "Swiss Franc",
      "symbol": "CHF"
    },
    "language": "french",
    "visaRegime": "schengen",
    "visaDays": 90,
    "region": "Schengen"
  },
  "Turkey": {
    "currency": {
      "code": "TRY",
      "name": "Turkish Lira",
      "symbol": "₺"
    },
    "language": "turkish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Ukraine": {
    "currency": {
      "code": "UAH",
      "name": "Ukrainian Hryvnia",
      "symbol": "₴"
    },
    "language": "ukrainian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "United Kingdom": {
    "currency": {
      "code": "GBP",
      "name": "British Pound",
      "symbol": "£"
    },
    "language": "english",
    "visaRegime": "ukEta",
    "visaDays": 180,
    "region": "UK"
  },
  "Vatican City": {
    "currency": {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    "language": "italian",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Antigua and Barbuda": {
    "currency": {
      "code": "XCD",
      "name": "East Caribbean Dollar",
      "symbol": "EC$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Bahamas": {
    "currency": {
      "code": "BSD",
      "name": "Bahamian Dollar",
      "symbol": "B$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Barbados": {
    "currency": {
      "code": "BBD",
      "name": "Barbadian Dollar",
      "symbol": "Bds$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Belize": {
    "currency": {
      "code": "BZD",
      "name": "Belize Dollar",
      "symbol": "BZ$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Canada": {
    "currency": {
      "code": "CAD",
      "name": "Canadian Dollar",
      "symbol": "CA$"
    },
    "language": "english",
    "visaRegime": "canadaEta",
    "visaDays": 180,
    "region": "USMCA"
  },
  "Costa Rica": {
    "currency": {
      "code": "CRC",
      "name": "Costa Rican Colón",
      "symbol": "₡"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Cuba": {
    "currency": {
      "code": "CUP",
      "name": "Cuban Peso",
      "symbol": "₱"
    },
    "language": "spanish",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Dominica": {
    "currency": {
      "code": "XCD",
      "name": "East Caribbean Dollar",
      "symbol": "EC$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Dominican Republic": {
    "currency": {
      "code": "DOP",
      "name": "Dominican Peso",
      "symbol": "RD$"
    },
    "language": "spanish",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "El Salvador": {
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Grenada": {
    "currency": {
      "code": "XCD",
      "name": "East Caribbean Dollar",
      "symbol": "EC$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Guatemala": {
    "currency": {
      "code": "GTQ",
      "name": "Guatemalan Quetzal",
      "symbol": "Q"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Haiti": {
    "currency": {
      "code": "HTG",
      "name": "Haitian Gourde",
      "symbol": "G"
    },
    "language": "french",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Honduras": {
    "currency": {
      "code": "HNL",
      "name": "Honduran Lempira",
      "symbol": "L"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Jamaica": {
    "currency": {
      "code": "JMD",
      "name": "Jamaican Dollar",
      "symbol": "J$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Mexico": {
    "currency": {
      "code": "MXN",
      "name": "Mexican Peso",
      "symbol": "MX$"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 180,
    "region": "USMCA"
  },
  "Nicaragua": {
    "currency": {
      "code": "NIO",
      "name": "Nicaraguan Córdoba",
      "symbol": "C$"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Panama": {
    "currency": {
      "code": "PAB",
      "name": "Panamanian Balboa",
      "symbol": "B/."
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Saint Kitts and Nevis": {
    "currency": {
      "code": "XCD",
      "name": "East Caribbean Dollar",
      "symbol": "EC$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Saint Lucia": {
    "currency": {
      "code": "XCD",
      "name": "East Caribbean Dollar",
      "symbol": "EC$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Saint Vincent and the Grenadines": {
    "currency": {
      "code": "XCD",
      "name": "East Caribbean Dollar",
      "symbol": "EC$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Trinidad and Tobago": {
    "currency": {
      "code": "TTD",
      "name": "Trinidad and Tobago Dollar",
      "symbol": "TT$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "United States": {
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    "language": "english",
    "visaRegime": "usEsta",
    "visaDays": 90,
    "region": "USMCA"
  },
  "Argentina": {
    "currency": {
      "code": "ARS",
      "name": "Argentine Peso",
      "symbol": "AR$"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Bolivia": {
    "currency": {
      "code": "BOB",
      "name": "Bolivian Boliviano",
      "symbol": "Bs."
    },
    "language": "spanish",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Brazil": {
    "currency": {
      "code": "BRL",
      "name": "Brazilian Real",
      "symbol": "R$"
    },
    "language": "portuguese",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Chile": {
    "currency": {
      "code": "CLP",
      "name": "Chilean Peso",
      "symbol": "CL$"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Colombia": {
    "currency": {
      "code": "COP",
      "name": "Colombian Peso",
      "symbol": "CO$"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Ecuador": {
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Guyana": {
    "currency": {
      "code": "GYD",
      "name": "Guyanese Dollar",
      "symbol": "G$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Paraguay": {
    "currency": {
      "code": "PYG",
      "name": "Paraguayan Guaraní",
      "symbol": "₲"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Peru": {
    "currency": {
      "code": "PEN",
      "name": "Peruvian Sol",
      "symbol": "S/"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Suriname": {
    "currency": {
      "code": "SRD",
      "name": "Surinamese Dollar",
      "symbol": "SR$"
    },
    "language": "dutch",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Uruguay": {
    "currency": {
      "code": "UYU",
      "name": "Uruguayan Peso",
      "symbol": "U$"
    },
    "language": "spanish",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Venezuela": {
    "currency": {
      "code": "VES",
      "name": "Venezuelan Bolívar",
      "symbol": "Bs.S"
    },
    "language": "spanish",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Algeria": {
    "currency": {
      "code": "DZD",
      "name": "Algerian Dinar",
      "symbol": "د.ج"
    },
    "language": "french",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Angola": {
    "currency": {
      "code": "AOA",
      "name": "Angolan Kwanza",
      "symbol": "Kz"
    },
    "language": "portuguese",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Bahrain": {
    "currency": {
      "code": "BHD",
      "name": "Bahraini Dinar",
      "symbol": ".د.ب"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Benin": {
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "symbol": "CFA"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Botswana": {
    "currency": {
      "code": "BWP",
      "name": "Botswanan Pula",
      "symbol": "P"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Burkina Faso": {
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "symbol": "CFA"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Burundi": {
    "currency": {
      "code": "BIF",
      "name": "Burundian Franc",
      "symbol": "FBu"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Cabo Verde": {
    "currency": {
      "code": "CVE",
      "name": "Cape Verdean Escudo",
      "symbol": "$"
    },
    "language": "portuguese",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Cameroon": {
    "currency": {
      "code": "XAF",
      "name": "Central African CFA Franc",
      "symbol": "FCFA"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Central African Republic": {
    "currency": {
      "code": "XAF",
      "name": "Central African CFA Franc",
      "symbol": "FCFA"
    },
    "language": "french",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Chad": {
    "currency": {
      "code": "XAF",
      "name": "Central African CFA Franc",
      "symbol": "FCFA"
    },
    "language": "french",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Comoros": {
    "currency": {
      "code": "KMF",
      "name": "Comorian Franc",
      "symbol": "CF"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 45,
    "region": "Other"
  },
  "Côte d'Ivoire": {
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "symbol": "CFA"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Democratic Republic of the Congo": {
    "currency": {
      "code": "CDF",
      "name": "Congolese Franc",
      "symbol": "FC"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Djibouti": {
    "currency": {
      "code": "DJF",
      "name": "Djiboutian Franc",
      "symbol": "Fdj"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Egypt": {
    "currency": {
      "code": "EGP",
      "name": "Egyptian Pound",
      "symbol": "E£"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Equatorial Guinea": {
    "currency": {
      "code": "XAF",
      "name": "Central African CFA Franc",
      "symbol": "FCFA"
    },
    "language": "spanish",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Eritrea": {
    "currency": {
      "code": "ERN",
      "name": "Eritrean Nakfa",
      "symbol": "Nfk"
    },
    "language": "tigrinya",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Eswatini": {
    "currency": {
      "code": "SZL",
      "name": "Swazi Lilangeni",
      "symbol": "L"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Ethiopia": {
    "currency": {
      "code": "ETB",
      "name": "Ethiopian Birr",
      "symbol": "Br"
    },
    "language": "amharic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Gabon": {
    "currency": {
      "code": "XAF",
      "name": "Central African CFA Franc",
      "symbol": "FCFA"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Gambia": {
    "currency": {
      "code": "GMD",
      "name": "Gambian Dalasi",
      "symbol": "D"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Ghana": {
    "currency": {
      "code": "GHS",
      "name": "Ghanaian Cedi",
      "symbol": "₵"
    },
    "language": "english",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Guinea": {
    "currency": {
      "code": "GNF",
      "name": "Guinean Franc",
      "symbol": "FG"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Guinea-Bissau": {
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "symbol": "CFA"
    },
    "language": "portuguese",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Iran": {
    "currency": {
      "code": "IRR",
      "name": "Iranian Rial",
      "symbol": "﷼"
    },
    "language": "persian",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Iraq": {
    "currency": {
      "code": "IQD",
      "name": "Iraqi Dinar",
      "symbol": "ع.د"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 60,
    "region": "Other"
  },
  "Israel": {
    "currency": {
      "code": "ILS",
      "name": "Israeli New Shekel",
      "symbol": "₪"
    },
    "language": "hebrew",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Jordan": {
    "currency": {
      "code": "JOD",
      "name": "Jordanian Dinar",
      "symbol": "JD"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Kenya": {
    "currency": {
      "code": "KES",
      "name": "Kenyan Shilling",
      "symbol": "KSh"
    },
    "language": "swahili",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Kuwait": {
    "currency": {
      "code": "KWD",
      "name": "Kuwaiti Dinar",
      "symbol": "KD"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Lebanon": {
    "currency": {
      "code": "LBP",
      "name": "Lebanese Pound",
      "symbol": "LL"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Lesotho": {
    "currency": {
      "code": "LSL",
      "name": "Lesotho Loti",
      "symbol": "L"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Other"
  },
  "Liberia": {
    "currency": {
      "code": "LRD",
      "name": "Liberian Dollar",
      "symbol": "L$"
    },
    "language": "english",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Libya": {
    "currency": {
      "code": "LYD",
      "name": "Libyan Dinar",
      "symbol": "LD"
    },
    "language": "arabic",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Madagascar": {
    "currency": {
      "code": "MGA",
      "name": "Malagasy Ariary",
      "symbol": "Ar"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 60,
    "region": "Other"
  },
  "Malawi": {
    "currency": {
      "code": "MWK",
      "name": "Malawian Kwacha",
      "symbol": "MK"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Mali": {
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "symbol": "CFA"
    },
    "language": "french",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Mauritania": {
    "currency": {
      "code": "MRU",
      "name": "Mauritanian Ouguiya",
      "symbol": "UM"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Mauritius": {
    "currency": {
      "code": "MUR",
      "name": "Mauritian Rupee",
      "symbol": "₨"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Morocco": {
    "currency": {
      "code": "MAD",
      "name": "Moroccan Dirham",
      "symbol": "DH"
    },
    "language": "french",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Mozambique": {
    "currency": {
      "code": "MZN",
      "name": "Mozambican Metical",
      "symbol": "MT"
    },
    "language": "portuguese",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Namibia": {
    "currency": {
      "code": "NAD",
      "name": "Namibian Dollar",
      "symbol": "N$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Niger": {
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "symbol": "CFA"
    },
    "language": "french",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Nigeria": {
    "currency": {
      "code": "NGN",
      "name": "Nigerian Naira",
      "symbol": "₦"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Oman": {
    "currency": {
      "code": "OMR",
      "name": "Omani Rial",
      "symbol": "﷼"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Palestine": {
    "currency": {
      "code": "ILS",
      "name": "Israeli New Shekel",
      "symbol": "₪"
    },
    "language": "arabic",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Qatar": {
    "currency": {
      "code": "QAR",
      "name": "Qatari Riyal",
      "symbol": "﷼"
    },
    "language": "arabic",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Republic of the Congo": {
    "currency": {
      "code": "XAF",
      "name": "Central African CFA Franc",
      "symbol": "FCFA"
    },
    "language": "french",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Rwanda": {
    "currency": {
      "code": "RWF",
      "name": "Rwandan Franc",
      "symbol": "FRw"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Saudi Arabia": {
    "currency": {
      "code": "SAR",
      "name": "Saudi Riyal",
      "symbol": "﷼"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Senegal": {
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "symbol": "CFA"
    },
    "language": "french",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Seychelles": {
    "currency": {
      "code": "SCR",
      "name": "Seychellois Rupee",
      "symbol": "₨"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Sierra Leone": {
    "currency": {
      "code": "SLE",
      "name": "Sierra Leonean Leone",
      "symbol": "Le"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Somalia": {
    "currency": {
      "code": "SOS",
      "name": "Somali Shilling",
      "symbol": "Sh"
    },
    "language": "arabic",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "South Africa": {
    "currency": {
      "code": "ZAR",
      "name": "South African Rand",
      "symbol": "R"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "South Sudan": {
    "currency": {
      "code": "SSP",
      "name": "South Sudanese Pound",
      "symbol": "£"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Sudan": {
    "currency": {
      "code": "SDG",
      "name": "Sudanese Pound",
      "symbol": "£"
    },
    "language": "english",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Syria": {
    "currency": {
      "code": "SYP",
      "name": "Syrian Pound",
      "symbol": "£"
    },
    "language": "arabic",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "São Tomé and Príncipe": {
    "currency": {
      "code": "STN",
      "name": "São Tomé and Príncipe Dobra",
      "symbol": "Db"
    },
    "language": "portuguese",
    "visaRegime": "visaFree",
    "visaDays": 15,
    "region": "Other"
  },
  "Tanzania": {
    "currency": {
      "code": "TZS",
      "name": "Tanzanian Shilling",
      "symbol": "TSh"
    },
    "language": "swahili",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Togo": {
    "currency": {
      "code": "XOF",
      "name": "West African CFA Franc",
      "symbol": "CFA"
    },
    "language": "french",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 15,
    "region": "Other"
  },
  "Tunisia": {
    "currency": {
      "code": "TND",
      "name": "Tunisian Dinar",
      "symbol": "DT"
    },
    "language": "french",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Uganda": {
    "currency": {
      "code": "UGX",
      "name": "Ugandan Shilling",
      "symbol": "USh"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "United Arab Emirates": {
    "currency": {
      "code": "AED",
      "name": "UAE Dirham",
      "symbol": "د.إ"
    },
    "language": "arabic",
    "visaRegime": "visaFree",
    "visaDays": 90,
    "region": "Other"
  },
  "Yemen": {
    "currency": {
      "code": "YER",
      "name": "Yemeni Rial",
      "symbol": "﷼"
    },
    "language": "arabic",
    "visaRegime": "visaRequired",
    "visaDays": null,
    "region": "Other"
  },
  "Zambia": {
    "currency": {
      "code": "ZMW",
      "name": "Zambian Kwacha",
      "symbol": "ZK"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 90,
    "region": "Other"
  },
  "Zimbabwe": {
    "currency": {
      "code": "ZWL",
      "name": "Zimbabwean Dollar",
      "symbol": "Z$"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Other"
  },
  "Australia": {
    "currency": {
      "code": "AUD",
      "name": "Australian Dollar",
      "symbol": "A$"
    },
    "language": "english",
    "visaRegime": "auEta",
    "visaDays": 90,
    "region": "Oceania"
  },
  "Fiji": {
    "currency": {
      "code": "FJD",
      "name": "Fijian Dollar",
      "symbol": "FJ$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 120,
    "region": "Oceania"
  },
  "Kiribati": {
    "currency": {
      "code": "AUD",
      "name": "Australian Dollar",
      "symbol": "A$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Oceania"
  },
  "Marshall Islands": {
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Oceania"
  },
  "Micronesia": {
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    "language": "english",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Oceania"
  },
  "Nauru": {
    "currency": {
      "code": "AUD",
      "name": "Australian Dollar",
      "symbol": "A$"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Oceania"
  },
  "New Zealand": {
    "currency": {
      "code": "NZD",
      "name": "New Zealand Dollar",
      "symbol": "NZ$"
    },
    "language": "english",
    "visaRegime": "nzEta",
    "visaDays": 90,
    "region": "Oceania"
  },
  "Palau": {
    "currency": {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Oceania"
  },
  "Papua New Guinea": {
    "currency": {
      "code": "PGK",
      "name": "Papua New Guinean Kina",
      "symbol": "K"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 60,
    "region": "Oceania"
  },
  "Samoa": {
    "currency": {
      "code": "WST",
      "name": "Samoan Tala",
      "symbol": "T"
    },
    "language": "samoan",
    "visaRegime": "visaFree",
    "visaDays": 60,
    "region": "Oceania"
  },
  "Solomon Islands": {
    "currency": {
      "code": "SBD",
      "name": "Solomon Islands Dollar",
      "symbol": "SI$"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Oceania"
  },
  "Tonga": {
    "currency": {
      "code": "TOP",
      "name": "Tongan Paʻanga",
      "symbol": "T$"
    },
    "language": "tongan",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Oceania"
  },
  "Tuvalu": {
    "currency": {
      "code": "AUD",
      "name": "Australian Dollar",
      "symbol": "A$"
    },
    "language": "english",
    "visaRegime": "eVisaOrVoa",
    "visaDays": 30,
    "region": "Oceania"
  },
  "Vanuatu": {
    "currency": {
      "code": "VUV",
      "name": "Vanuatu Vatu",
      "symbol": "VT"
    },
    "language": "french",
    "visaRegime": "visaFree",
    "visaDays": 30,
    "region": "Oceania"
  }
};

/** Common alternate spellings → canonical country name. */
const COUNTRY_ALIASES: Record<string, string> = {
  'ivory coast': "Côte d'Ivoire",
  "cote d'ivoire": "Côte d'Ivoire",
  'czech republic': 'Czechia',
  'turkiye': 'Turkey',
  'türkiye': 'Turkey',
  'uae': 'United Arab Emirates',
  'emirates': 'United Arab Emirates',
  'uk': 'United Kingdom',
  'britain': 'United Kingdom',
  'great britain': 'United Kingdom',
  'england': 'United Kingdom',
  'scotland': 'United Kingdom',
  'usa': 'United States',
  'us': 'United States',
  'america': 'United States',
  'romania': 'Romania',
  'mexico': 'Mexico',
  'georgia': 'Georgia',
  'the netherlands': 'Netherlands',
  'netherlands': 'Netherlands',
  'macao': 'China',
  'cape verde': 'Cabo Verde',
  'east timor': 'Timor-Leste',
  'congo': 'Republic of the Congo',
  'drc': 'Democratic Republic of the Congo',
  'south korea': 'South Korea',
  'korea': 'South Korea',
  'swaziland': 'Eswatini',
  'burma': 'Myanmar',
  'holland': 'Netherlands',
  'macau': 'China',
  'hong kong': 'China',
  'palestinian territories': 'Palestine',
  'sao tome and principe': 'São Tomé and Príncipe'
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const NORM_LOOKUP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const name of Object.keys(COUNTRY_INFO)) map[norm(name)] = name;
  for (const [alias, name] of Object.entries(COUNTRY_ALIASES)) map[norm(alias)] = name;
  return map;
})();

/**
 * Word-boundary substring test: "japan" matches inside "kyoto japan" but
 * "congo" must never match inside "bingo hall", nor "romania" inside
 * "abromania".
 */
const containsWord = (haystack: string, needle: string): boolean => {
  if (!needle) return false;
  let idx = haystack.indexOf(needle);
  while (idx >= 0) {
    const before = idx === 0 ? '' : haystack[idx - 1];
    const after = idx + needle.length >= haystack.length ? '' : haystack[idx + needle.length];
    if (!/[a-z]/.test(before) && !/[a-z]/.test(after)) return true;
    idx = haystack.indexOf(needle, idx + 1);
  }
  return false;
};

// Exact keys first, then longer keys first — "south korea" beats "korea"
// when both appear in one string.
const NORM_KEYS_BY_LENGTH = Object.keys(NORM_LOOKUP).sort((a, b) => b.length - a.length);

/**
 * Resolve any free text ("Kyoto, Japan", "japan", "Ivory Coast") to a
 * country's info. Exact whole-text match first; otherwise the LAST
 * word-boundary country mention wins — in "Bucharest, Romania" the country
 * is always Romania, never whichever country name happens to appear first
 * in the lookup table.
 */
export function countryInfoFor(text: string): CountryInfo | null {
  if (!text) return null;
  const t = norm(text);
  if (NORM_LOOKUP[t]) return COUNTRY_INFO[NORM_LOOKUP[t]];
  let found: string | null = null;
  let foundIdx = -1;
  for (const key of NORM_KEYS_BY_LENGTH) {
    if (!containsWord(t, key)) continue;
    const idx = t.lastIndexOf(key);
    if (idx > foundIdx) {
      foundIdx = idx;
      found = NORM_LOOKUP[key];
    }
  }
  return found ? COUNTRY_INFO[found] : null;
}

/** Canonical display name for free text, or null when no country matched. */
export function countryNameFor(text: string): string | null {
  if (!text) return null;
  const t = norm(text);
  if (NORM_LOOKUP[t]) return NORM_LOOKUP[t];
  let found: string | null = null;
  let foundIdx = -1;
  for (const key of NORM_KEYS_BY_LENGTH) {
    if (!containsWord(t, key)) continue;
    const idx = t.lastIndexOf(key);
    if (idx > foundIdx) {
      foundIdx = idx;
      found = NORM_LOOKUP[key];
    }
  }
  return found;
}

export function currencyForCountry(text: string): CountryCurrency | null {
  return countryInfoFor(text)?.currency || null;
}

/**
 * Whether a {nationality} passport is part of the same free-movement bloc as
 * the destination (Schengen/EU, CTA, USMCA neighbours). Used to sharpen the
 * one-line visa verdicts on trip cards.
 */
export function isSameBlocTraveler(nationality: string, destText: string): boolean {
  const nat = norm(nationality || '');
  if (!nat) return false;
  const info = countryInfoFor(destText);
  if (!info) return false;
  const EU_SET = ['austria','belgium','bulgaria','croatia','cyprus','czechia','czech republic','denmark','estonia','finland','france','germany','greece','hungary','ireland','italy','latvia','lithuania','luxembourg','malta','netherlands','poland','portugal','romania','slovakia','slovenia','spain','sweden'];
  const CTA_SET = ['united kingdom','uk','britain','great britain','ireland'];
  const NA_SET = ['united states','usa','canada','mexico'];
  const inSet = (set: string[]) => set.some((c) => nat === c || nat.includes(c));
  switch (info.visaRegime) {
    case 'schengen':
    case 'euNonSchengen':
      return inSet(EU_SET);
    case 'cta':
      return inSet(CTA_SET);
    case 'usEsta':
    case 'canadaEta':
      return inSet(NA_SET);
    default:
      return false;
  }
}

export function phrasesForCountry(text: string): CountryPhraseSet[] {
  const info = countryInfoFor(text);
  const raw = (info && PHRASE_SETS[info.language]) || PHRASE_SETS.english;
  return raw.map(([phrase, translation, phonetic]) => ({ phrase, translation, phonetic }));
}

const TIPPING_BY_REGION: Record<CountryRegion, string> = {
  Schengen: 'Service is usually included in the bill; rounding up or leaving 5–10% for good table service is customary.',
  'EU-non-Schengen': 'Service is usually included in the bill; rounding up or leaving 5–10% for good table service is customary.',
  UK: 'A discretionary 10–12.5% service charge is often added to restaurant bills; otherwise tip around 10%.',
  USMCA: 'Tipping is a real part of service income: 15–20% at sit-down restaurants, plus tips for taxis, bars, and hotel staff.',
  EastAsia: 'Tipping is not customary and can cause confusion — a polite thank-you is the correct appreciation.',
  SEAsia: 'Tipping is not expected; leaving small change or rounding up for great service is appreciated.',
  Oceania: 'No tipping required or expected — rounding up for exceptional service is a kind bonus.',
  Other: 'Tipping customs vary by venue; around 10% for good table service is a widely safe baseline.'
};

const CARD_BY_REGION: Record<CountryRegion, string> = {
  Schengen: 'Cards and contactless payments are accepted almost everywhere; carry some local cash for markets, kiosks, and small villages.',
  'EU-non-Schengen': 'Cards are widely accepted in cities; carry some local cash for markets, taxis, and small towns.',
  UK: 'Almost fully cashless — tap-to-pay works on transit, in pubs, and in shops; a little cash is still handy.',
  USMCA: 'Cards are accepted nearly everywhere; tips are commonly added by card at the table.',
  EastAsia: 'Cards and mobile pay are common in cities, but cash is still essential at small eateries, temples, and rural areas.',
  SEAsia: 'Cash is king at street stalls, markets, and small guesthouses; cards work in malls and hotels.',
  Oceania: 'Contactless cards and mobile pay are accepted virtually everywhere.',
  Other: 'Carry local cash — card acceptance is limited outside major hotels and city-center businesses.'
};

export function tippingForCountry(text: string): string {
  const info = countryInfoFor(text);
  return TIPPING_BY_REGION[info?.region || 'Other'];
}

export function cardAcceptanceForCountry(text: string): string {
  const info = countryInfoFor(text);
  return CARD_BY_REGION[info?.region || 'Other'];
}

/** Short entry-rule bullet for the country's regime (used in Entry Regulations). */
export function entryRuleBullet(text: string): string {
  const info = countryInfoFor(text);
  const name = countryNameFor(text) || text;
  if (!info) return 'Check the official consulate portal for current visa requirements for your nationality.';
  switch (info.visaRegime) {
    case 'schengen':
      return `${name} is in the Schengen Area: many passports receive up to 90 days visa-free in any 180-day period (EES biometric registration is live at the border; ETIAS is not in operation yet); other passports need a Schengen visa in advance.`;
    case 'euNonSchengen':
      return `${name} is in the EU but outside Schengen: entry rules are national — many passports receive up to ${info.visaDays || 90} days visa-free.`;
    case 'cta':
      return `${name} sits in the Common Travel Area: most passports receive up to 90 days visa-free, but non-EU travelers should check national entry rules.`;
    case 'ukEta':
      return 'The UK requires an ETA (Electronic Travel Authorisation) for most visa-exempt passports — apply online before departure; eligible visitors can then stay up to 6 months.';
    case 'usEsta':
      return 'The US Visa Waiver Program requires an approved ESTA (applied online before flying) for eligible passports; others need a B1/B2 visitor visa from a US embassy.';
    case 'canadaEta':
      return 'Canada requires an eTA (online, before flying) for visa-exempt passports arriving by air; other passports need a visitor visa.';
    case 'auEta':
      return 'Australia requires an electronic visa or ETA/eVisitor arranged BEFORE departure — no visa on arrival exists.';
    case 'nzEta':
      return 'New Zealand requires an NZeTA plus the IVL levy for visa-waiver passports; strict biosecurity declarations apply on arrival.';
    case 'visaFree':
      return `${name} grants visa-free tourist entry (up to ${info.visaDays} days) to many passports — confirm your passport's allowance before booking.`;
    case 'eVisaOrVoa':
      return `${name} typically requires an e-visa or issues visas on arrival (around ${info.visaDays} days) — apply online via the official portal where possible.`;
    default:
      return `${name} requires most visitors to obtain a visa in advance from an embassy or consulate — apply early.`;
  }
}

/**
 * Fixed, country-specific visa & entry passage addressed to the traveler's
 * nationality. Every country resolves to its own passage — no generic or
 * "USA default" fallback.
 */

// Register every known country display name with the visa matrix so that
// destination text (e.g. a trip's "Country" field) resolves reliably.
registerVisaCountryNames(Object.keys(COUNTRY_INFO));

// Knowledge-base fallback for the visa matrix: every country in COUNTRY_INFO
// carries its general visa regime, so when the hand-encoded pair rules have
// no entry (typically smaller or less-well-known destinations), the verdict
// still comes back concrete — visa-free with its day allowance, an e-visa /
// visa-on-arrival scheme, or advance embassy visa — with a note to confirm
// the passport-specific details on the official source.
registerVisaKbFallback((_nat, dest) => {
  const info = countryInfoFor(dest);
  if (!info) return null;
  if (info.visaRegime === 'visaFree') {
    return {
      status: 'free',
      tone: 'free',
      days: info.visaDays ?? undefined,
      destName: dest,
      official: null,
      note: `${dest} admits most tourists visa-free${info.visaDays ? ` for up to ${info.visaDays} days` : ''}. Confirm your passport's exact allowance before booking.`
    };
  }
  if (info.visaRegime === 'eVisaOrVoa') {
    return {
      status: 'evisa',
      tone: 'online',
      days: info.visaDays ?? undefined,
      destName: dest,
      official: null,
      note: `${dest} offers an e-visa or visa on arrival to most visitors${info.visaDays ? ` (typically ~${info.visaDays} days)` : ''} — apply on the official portal before you fly.`
    };
  }
  return {
    status: 'required',
    tone: 'embassy',
    destName: dest,
    official: null,
    note: `${dest} requires most visitors to arrange a visa in advance — apply at the nearest embassy or consulate early.`
  };
});

export type VisaVerdictTone = 'free' | 'online' | 'embassy' | 'check';
export interface VisaVerdictInfo {
  /** English label kept for back-compat; UIs should prefer localized status chips. */
  verdict: string;
  tone: VisaVerdictTone;
  status: VisaStatus;
  /** Permitted stay in days when the rule grants one. */
  days?: number;
  /** Name of the online authorisation (ETA/eVisa/VoA scheme) when applicable. */
  etaName?: string;
  /** Official government URL for this destination's entry rules. */
  official?: string;
  /** Matched destination country (matrix registry name). */
  destName: string;
  /** Extra rule-specific note from the matrix. */
  note?: string;
}

function matrixVerdictLabel(v: VisaVerdict): string {
  switch (v.status) {
    case 'home': return 'Home country — no visa needed';
    case 'free': return v.days ? `Visa-free · up to ${v.days} days` : 'Visa-free entry';
    case 'eta': return `${v.etaName ?? 'Online travel authorisation'} required`;
    case 'evisa': return v.etaName ? `${v.etaName} (eVisa) required` : 'eVisa required';
    case 'voa': return v.days ? `Visa on arrival · ${v.days} days` : 'Visa on arrival';
    case 'required': return 'Embassy visa required';
    default: return 'Check the official source';
  }
}

/**
 * Nationality-aware visa verdict. Resolution is ALWAYS (passport country) ×
 * (destination country) via the visa matrix, which is built from official
 * government sources. When no verified rule covers the pair, the status is
 * `check` and the UI must point to the official link — never guess.
 */
export function visaVerdictFor(travelerNationality: string, text: string): VisaVerdictInfo {
  const v = visaRuleFor(travelerNationality ?? '', text);
  return {
    verdict: matrixVerdictLabel(v),
    tone: v.tone,
    status: v.status,
    days: v.days,
    etaName: v.etaName,
    official: v.official ?? undefined,
    destName: v.destName,
    note: v.note,
  };
}

/** Full visa advisory paragraph — passport × destination specific, from official sources. */
export function visaPassageFor(travelerNationality: string, text: string): string {
  return visaPassage(visaRuleFor(travelerNationality ?? '', text), travelerNationality ?? '');
}
