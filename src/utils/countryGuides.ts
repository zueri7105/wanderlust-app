/**
 * Country travel knowledge base.
 *
 * For every known destination country this provides: entry rules & regulations,
 * cultural norms & customs, and basic local-language phrases — plus the local
 * currency and the Schengen/visa group used for nationality-aware visa and
 * tipping advice. Detailed entries exist for major destinations; ALL 197
 * selectable countries resolve to a country-specific profile via countryInfo
 * (correct currency, local greetings, fixed per-country visa passage) — only
 * truly unrecognised text falls back to a generic profile.
 */

import {
  countryInfoFor,
  countryNameFor,
  phrasesForCountry,
  tippingForCountry,
  entryRuleBullet,
  visaPassageFor
} from './countryInfo';

export interface CountryPhrase {
  phrase: string;
  translation: string;
  phonetic: string;
}

export interface CountryGuideData {
  /** Match key (lowercase country name) */
  key: string;
  /** Display name */
  name: string;
  /** Extra words that should map to this country (cities, regions) */
  aliases: string[];
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  /** Passport/visa group used for nationality-aware advice */
  region: 'Schengen' | 'EU-non-Schengen' | 'UK' | 'USMCA' | 'EastAsia' | 'SEAsia' | 'Oceania' | 'Other';
  /** Canonical country name for the fixed per-country visa passage (set for info-built guides) */
  visaCountry?: string;
  /** Rules & regulations every traveler should know on arrival */
  entryRules: string[];
  /** Local customs & social norms */
  customs: string[];
  /** Basic local-language phrases */
  phrases: CountryPhrase[];
  /** Default tipping custom (used when the visitor is from a similar-tipping culture) */
  tipping: string;
}

export const COUNTRY_GUIDES: CountryGuideData[] = [
  {
    key: 'japan',
    name: 'Japan',
    aliases: ['kyoto', 'tokyo', 'osaka', 'nara', 'hiroshima', 'sapporo', 'fukuoka', 'uji'],
    currencyCode: 'JPY', currencyName: 'Japanese Yen', currencySymbol: '¥', region: 'EastAsia',
    entryRules: [
      'Passport must be valid for the duration of stay; most Western passports get a 90-day visa-free "Temporary Visitor" stamp on arrival.',
      'Visit Japan Web: complete immigration & customs declarations online before flying to use the fast QR lanes.',
      'Strict drug laws: some common medicines (e.g. pseudoephedrine, ADHD stimulants) are illegal — carry prescriptions and check the embassy list.',
      'Carry your passport at all times; police may legally ask foreign visitors for it.',
      'Customs restricts fresh fruit, meat products, and plants — declare or leave them behind.'
    ],
    customs: [
      'Bowing is the standard greeting; a small nod is fine for tourists.',
      'Shoes off inside homes, ryokans, temples, and some restaurants — wear easy slip-on shoes and clean socks.',
      'Quiet on trains: phone calls are taboo; keep devices on "manner mode".',
      'No eating while walking in historic districts; finish street food beside the stall.',
      'Cash still matters at shrines, small ramen shops, and older inns — always carry some yen.'
    ],
    phrases: [
      { phrase: 'こんにちは', translation: 'Hello / Good afternoon', phonetic: 'Kon-ni-chi-wa' },
      { phrase: 'ありがとうございます', translation: 'Thank you (polite)', phonetic: 'A-ri-ga-toh go-za-i-mas' },
      { phrase: 'すみません', translation: 'Excuse me / Sorry', phonetic: 'Su-mi-ma-sen' },
      { phrase: 'おいくらですか？', translation: 'How much is this?', phonetic: 'O-i-ku-ra des ka?' },
      { phrase: 'ごちそうさまでした', translation: 'Thanks for the meal', phonetic: 'Go-chi-soh sa-ma desh-ta' },
      { phrase: '英語が話せますか？', translation: 'Do you speak English?', phonetic: 'E-go ga ha-na-se-mas ka?' }
    ],
    tipping: 'Strictly no tipping — it can be seen as rude. A polite "Gochisousama deshita" is the right way to show appreciation.'
  },
  {
    key: 'croatia',
    name: 'Croatia',
    aliases: ['dubrovnik', 'split', 'zagreb', 'hvar', 'rovinj', 'zadar'],
    currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', region: 'Schengen',
    entryRules: [
      'Schengen rules apply since 2023: passport/ID per your nationality, 90-days-in-180 rule for visa-exempt visitors.',
      'Tourists must be registered with police — hotels do this automatically; if you stay in private rentals, confirm your host registers you.',
      'Carry ID at all times; police spot-checks happen in tourist zones.',
      'Sea shoes are strongly recommended — sea urchins line many rocky beaches.',
      'The Dubrovnik Pass bundles city walls, museums, and buses — cheaper than the walls ticket alone.'
    ],
    customs: [
      'Coffee culture is sacred — a "quick coffee" easily lasts 1–2 hours; never rush it.',
      'Greet with "Dobar dan" and a handshake; dress modestly when entering churches.',
      'Dinner starts late (after 20:00); many kitchens close mid-afternoon.',
      'Avoid war topics from the 1990s unless a local raises them first.',
      'The polished limestone of old towns is extremely slippery — wear grippy soles.'
    ],
    phrases: [
      { phrase: 'Dobar dan', translation: 'Good day / Hello', phonetic: 'Doh-bar dahn' },
      { phrase: 'Hvala', translation: 'Thank you', phonetic: 'Hvah-lah' },
      { phrase: 'Molim', translation: 'Please / You\'re welcome', phonetic: 'Moh-leem' },
      { phrase: 'Izvolite', translation: 'Here you go', phonetic: 'Eez-voh-lee-teh' },
      { phrase: 'Koliko košta?', translation: 'How much does it cost?', phonetic: 'Koh-lee-koh kosh-ta?' },
      { phrase: 'Živjeli!', translation: 'Cheers!', phonetic: 'Zhee-vye-lee' }
    ],
    tipping: 'Service is not itemized; rounding up or leaving ~10% in restaurants is customary.'
  },
  {
    key: 'mexico',
    name: 'Mexico',
    aliases: ['oaxaca', 'cancun', 'mexico city', 'cdmx', 'tulum', 'playa del carmen', 'guadalajara', 'puerto escondido'],
    currencyCode: 'MXN', currencyName: 'Mexican Peso', currencySymbol: '$', region: 'Other',
    entryRules: [
      'Most Western passports receive a 180-day FMM tourist permit on arrival — keep the small paper slip, you must surrender it when leaving.',
      'Passport validity only needs to cover your stay, but airlines may demand more — check your carrier.',
      'Strict biosecurity: no fresh fruit, seeds, meat, or cheese in luggage.',
      'Keep small peso bills handy — markets, colectivos, and street food are cash-only.',
      'Ask before photographing people, especially in indigenous communities and markets.'
    ],
    customs: [
      'Greetings are warm: a handshake, and among friends one kiss on the cheek (women).',
      '"¡Provecho!" — always say it when passing people who are eating.',
      'Lunch (comida, 14:00–16:00) is the main meal; dinner is late and light.',
      'Bargaining is normal in artisan markets, never in restaurants or shops with price tags.',
      'Mezcal is sipped ("kiss it"), never shot — with orange slices and sal de gusano.'
    ],
    phrases: [
      { phrase: 'Hola / Buenos días', translation: 'Hello / Good morning', phonetic: 'Oh-lah / Bweh-nos dee-as' },
      { phrase: 'Gracias', translation: 'Thank you', phonetic: 'Grah-syas' },
      { phrase: '¿Cuánto cuesta?', translation: 'How much does it cost?', phonetic: 'Kwahn-toh kwes-ta?' },
      { phrase: 'La cuenta, por favor', translation: 'The bill, please', phonetic: 'La kwen-ta por fa-vor' },
      { phrase: '¡Provecho!', translation: 'Enjoy your meal!', phonetic: 'Pro-veh-cho' },
      { phrase: '¿Dónde está el baño?', translation: 'Where is the bathroom?', phonetic: 'Don-deh es-ta el ban-yo?' }
    ],
    tipping: 'La propina: 10–15% is standard at sit-down restaurants; leave small change for baggers and gas attendants.'
  },
  {
    key: 'italy',
    name: 'Italy',
    aliases: ['amalfi', 'rome', 'roma', 'positano', 'florence', 'firenze', 'venice', 'venezia', 'milan', 'naples', 'capri', 'sicily', 'tuscany', 'sorrento'],
    currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', region: 'Schengen',
    entryRules: [
      'Schengen rules: visa-exempt passports get 90 days in any 180; passport valid 3 months beyond departure.',
      'Tourist tax (tassa di soggiorno) is paid per person per night at hotels — usually cash on checkout.',
      'Many churches (Vatican, Duomo) enforce dress codes: covered shoulders and knees.',
      'Validate regional train tickets before boarding — unvalidated tickets mean instant fines.',
      'ZTL zones: driving into historic centers without a permit triggers heavy camera fines.'
    ],
    customs: [
      'Cappuccino after 11:00 marks you as a tourist — espresso is the all-day norm.',
      '"Coperto" (cover charge €1–3 per person) on restaurant bills is normal, not a scam.',
      'Greet shopkeepers with "Buongiorno" when entering and "Grazie, arrivederci" when leaving.',
      'Dinner rarely starts before 19:30; aperitivo hour (18:00–20:00) is a beloved ritual.',
      'Meals are slow — you must ask for the bill ("il conto"); it won\'t be brought automatically.'
    ],
    phrases: [
      { phrase: 'Buongiorno', translation: 'Good morning / Hello', phonetic: 'Bwon-jor-no' },
      { phrase: 'Grazie mille', translation: 'Thanks a lot', phonetic: 'Gra-tsyeh meel-leh' },
      { phrase: 'Per favore', translation: 'Please', phonetic: 'Per fa-vo-reh' },
      { phrase: 'Il conto, per favore', translation: 'The bill, please', phonetic: 'Eel kon-toh per fa-vo-reh' },
      { phrase: 'Quanto costa?', translation: 'How much does it cost?', phonetic: 'Kwan-toh kos-ta?' },
      { phrase: 'Mi scusi', translation: 'Excuse me', phonetic: 'Mee skoo-zee' }
    ],
    tipping: 'Service (servizio) is usually included; rounding up or leaving €1–2 per person is a kind gesture, never required.'
  },
  {
    key: 'spain',
    name: 'Spain',
    aliases: ['barcelona', 'madrid', 'seville', 'sevilla', 'valencia', 'granada', 'mallorca', 'ibiza', 'bilbao', 'costa brava'],
    currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', region: 'Schengen',
    entryRules: [
      'Schengen rules: visa-exempt passports get 90 days in any 180; ETIAS pre-authorization applies to visa-exempt nationals.',
      'Passport or EU ID required for hotel check-in and sometimes card payments.',
      'Pickpocketing is the main risk in Barcelona/Madrid tourist zones — use cross-body bags and never leave phones on café tables.',
      'Many sights (Sagrada Família, Alhambra, Park Güell) require timed tickets booked days ahead.',
      'Siesta hours still apply: small shops often close 14:00–17:00.'
    ],
    customs: [
      'Two kisses (cheek to cheek) is the normal greeting among friends.',
      'Lunch is 14:00–16:00, dinner 21:00–23:00 — restaurants often won\'t open earlier.',
      'Tapas etiquette: order at the bar, and in Andalusia tapas often come free with drinks.',
      'Bread, water, and olives placed on your table may appear as small charges — ask if unsure.',
      'Punctuality is relaxed; arriving 10–15 minutes "late" socially is normal.'
    ],
    phrases: [
      { phrase: 'Hola / Buenos días', translation: 'Hello / Good morning', phonetic: 'Oh-lah / Bweh-nos dee-as' },
      { phrase: 'Gracias', translation: 'Thank you', phonetic: 'Grah-thyas' },
      { phrase: 'Por favor', translation: 'Please', phonetic: 'Por fa-vor' },
      { phrase: 'La cuenta, por favor', translation: 'The bill, please', phonetic: 'La kwen-ta por fa-vor' },
      { phrase: '¿Cuánto cuesta?', translation: 'How much is it?', phonetic: 'Kwan-toh kwes-ta?' },
      { phrase: '¡Salud!', translation: 'Cheers!', phonetic: 'Sa-lood' }
    ],
    tipping: 'Not obligatory; locals round up or leave 5–10% for good service. Small change in bars is enough.'
  },
  {
    key: 'china',
    name: 'China',
    aliases: ['shanghai', 'beijing', 'guangzhou', 'shenzhen', 'chengdu', 'hangzhou', 'xian', "xi'an", 'guilin'],
    currencyCode: 'CNY', currencyName: 'Chinese Yuan (RMB)', currencySymbol: '¥', region: 'EastAsia',
    entryRules: [
      'Many nationalities (incl. most EU, Singapore, Japan) get 15–30 days visa-free; others need an L tourist visa or the 144-hour transit exemption — verify for your passport before booking.',
      'Fingerprint scans at immigration kiosks are standard on arrival.',
      'Hotels must register you with local police — carry your physical passport for every check-in and high-speed train.',
      'Google, WhatsApp, Instagram, and Gmail are blocked: install an international eSIM or a VPN before you land.',
      'Drone flights and photography near military or government sites are prohibited.'
    ],
    customs: [
      'Never stick chopsticks upright in rice (funeral symbolism); lay them on the rest.',
      'Receive business cards and gifts with both hands.',
      'Slurping noodles is fine; splitting bills is common ("AA制").',
      'Queue-pushing happens in crowded transit — stay patient and polite.',
      'Cash is nearly dead: bind a foreign card to Alipay or WeChat Pay before arrival.'
    ],
    phrases: [
      { phrase: '你好', translation: 'Hello', phonetic: 'Nee hao' },
      { phrase: '谢谢', translation: 'Thank you', phonetic: 'Shyeh-shyeh' },
      { phrase: '多少钱？', translation: 'How much?', phonetic: 'Dwo-shao chyen?' },
      { phrase: '买单', translation: 'The bill, please', phonetic: 'My dahn' },
      { phrase: '不好意思', translation: 'Excuse me', phonetic: 'Boo hao yee-suh' },
      { phrase: '我不会说中文', translation: 'I can\'t speak Chinese', phonetic: 'Wo boo-hway shwo jong-wen' }
    ],
    tipping: 'Strictly no tipping — it is not part of the culture and may cause confusion or offense.'
  },
  {
    key: 'thailand',
    name: 'Thailand',
    aliases: ['bangkok', 'chiang mai', 'phuket', 'krabi', 'pai', 'koh', 'samui'],
    currencyCode: 'THB', currencyName: 'Thai Baht', currencySymbol: '฿', region: 'SEAsia',
    entryRules: [
      'Most Western passports receive 60 days visa-exempt on arrival (extendable 30 days at immigration).',
      'Lèse-majesté laws are strict: never speak disrespectfully about the monarchy.',
      'Temples require covered shoulders and knees; shoes off before entering any temple hall.',
      'Vaping/e-cigarettes are illegal — fines and even jail are possible.',
      'Passport must have 6 months validity; proof of onward travel is sometimes requested.'
    ],
    customs: [
      'The wai (palms together, slight bow) is the polite greeting — return it when offered.',
      'Never touch anyone\'s head; feet are considered low — don\'t point them at people or Buddha images.',
      'Bargaining is expected at markets but done with a smile.',
      'Shoes off when entering homes and some small shops.',
      'Public displays of anger ("losing face") are frowned upon — stay cool and smile.'
    ],
    phrases: [
      { phrase: 'สวัสดีครับ/ค่ะ', translation: 'Hello', phonetic: 'Sa-wat-dee khrap / kha' },
      { phrase: 'ขอบคุณ', translation: 'Thank you', phonetic: 'Khop khun' },
      { phrase: 'เท่าไหร่?', translation: 'How much?', phonetic: 'Tao-rai?' },
      { phrase: 'ไม่เผ็ด', translation: 'Not spicy', phonetic: 'Mai phet' },
      { phrase: 'เก็บเงิน', translation: 'The bill, please', phonetic: 'Gep nguen' },
      { phrase: 'ลดหน่อยได้ไหม?', translation: 'Can you lower the price?', phonetic: 'Lot noi dai mai?' }
    ],
    tipping: 'Not customary, but rounding up or leaving 20–50 THB at restaurants is appreciated.'
  },
  {
    key: 'france',
    name: 'France',
    aliases: ['paris', 'nice', 'lyon', 'marseille', 'bordeaux', 'provence', 'cote d\'azur', 'chamonix'],
    currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', region: 'Schengen',
    entryRules: [
      'Schengen rules: visa-exempt passports get 90 days in any 180; ETIAS applies to visa-exempt nationals.',
      'Carry ID — French police can request identification at any time.',
      'Metro tickets: keep your ticket until you exit; inspectors fine on the spot.',
      'Smoking is banned on restaurant terraces where covered; rules are enforced.',
      'Museums often close on Mondays or Tuesdays — check days before planning.'
    ],
    customs: [
      'Always greet with "Bonjour" when entering any shop or starting any interaction — skipping it is rude.',
      'La bise (cheek kisses) is the social greeting; a handshake is fine for strangers.',
      'Bread goes directly on the table, not the plate; keep hands visible (not on lap) at meals.',
      'Lunch is a proper seated meal 12:00–14:00; dinner after 19:30.',
      'Speak quietly in public — loud voices in restaurants draw disapproval.'
    ],
    phrases: [
      { phrase: 'Bonjour', translation: 'Hello / Good day', phonetic: 'Bon-zhoor' },
      { phrase: 'Merci beaucoup', translation: 'Thank you very much', phonetic: 'Mehr-see boh-koo' },
      { phrase: 'S\'il vous plaît', translation: 'Please', phonetic: 'Seel voo pleh' },
      { phrase: 'L\'addition, s\'il vous plaît', translation: 'The bill, please', phonetic: 'La-dee-syon seel voo pleh' },
      { phrase: 'Combien ça coûte?', translation: 'How much is it?', phonetic: 'Kom-byen sa koot?' },
      { phrase: 'Excusez-moi', translation: 'Excuse me', phonetic: 'Ex-kew-zay mwah' }
    ],
    tipping: 'Service compris is included by law; rounding up or leaving 5% for great service is appreciated, never expected.'
  },
  {
    key: 'germany',
    name: 'Germany',
    aliases: ['berlin', 'munich', 'hamburg', 'cologne', 'frankfurt', 'dresden', 'bavaria'],
    currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', region: 'Schengen',
    entryRules: [
      'Schengen rules apply; EU citizens enter with an ID card, others by passport.',
      'Cash is still king at bakeries, markets, small restaurants, and many taxis — always carry euros.',
      'Shops are closed on Sundays (except bakeries and stations) — plan groceries ahead.',
      'Validate paper transit tickets in the stamping machines before boarding.',
      'Jaywalking is genuinely frowned upon — wait for the green Ampelmännchen.'
    ],
    customs: [
      'Punctuality is a form of respect — arrive on time or a few minutes early.',
      'Quiet hours (Ruhezeit) after 22:00 and all Sunday: no loud music, drilling, or mowing.',
      'Recycling (Pfand): bottles carry a deposit — return them to machines in supermarkets.',
      'Greet with a firm handshake and eye contact; use "Sie" (formal you) until invited to "du".',
      'In beer gardens it\'s fine to share long tables with strangers — ask "Ist hier frei?"'
    ],
    phrases: [
      { phrase: 'Guten Tag', translation: 'Good day', phonetic: 'Goo-ten tahk' },
      { phrase: 'Danke schön', translation: 'Thank you very much', phonetic: 'Dahn-keh shurn' },
      { phrase: 'Bitte', translation: 'Please / You\'re welcome', phonetic: 'Bit-teh' },
      { phrase: 'Die Rechnung, bitte', translation: 'The bill, please', phonetic: 'Dee resh-noong bit-teh' },
      { phrase: 'Was kostet das?', translation: 'How much is that?', phonetic: 'Vas kos-tet das?' },
      { phrase: 'Prost!', translation: 'Cheers!', phonetic: 'Prohst' }
    ],
    tipping: 'Round up or add 5–10% by telling the server the total when paying ("Stimmt so" = keep the change).'
  },
  {
    key: 'united kingdom',
    name: 'United Kingdom',
    aliases: ['uk', 'london', 'england', 'scotland', 'wales', 'britain', 'edinburgh', 'manchester', 'liverpool', 'bath', 'cotswolds'],
    currencyCode: 'GBP', currencyName: 'British Pound', currencySymbol: '£', region: 'UK',
    entryRules: [
      'Most visa-exempt visitors (US, EU, AU, CA) need an ETA (Electronic Travel Authorisation) — apply online before travel.',
      'UK is not Schengen — your Schengen days do not count here and vice versa.',
      'ePassport gates are available for many nationalities; keep your ETA approval email.',
      'Driving is on the left; look right first when crossing streets.',
      'Pub hours and Sunday trading laws shorten Sunday shopping (usually 10:00–16:00).'
    ],
    customs: [
      'Queueing is sacred — never skip a line; join at the back.',
      'Order and pay at the bar in pubs; table service is rare in traditional pubs.',
      '"Sorry" and "please" are used constantly — mirror the politeness.',
      'Tipping in pubs is not expected, but "have one yourself" to the bartender is a classic gesture.',
      'Stand on the right on escalators; walk on the left.'
    ],
    phrases: [
      { phrase: 'Cheers', translation: 'Thanks / Goodbye', phonetic: 'Cheerz' },
      { phrase: 'Excuse me', translation: 'Getting attention politely', phonetic: 'Ex-kyooz mee' },
      { phrase: 'Could I get...?', translation: 'Polite way to order', phonetic: 'Kud eye get...' },
      { phrase: 'The bill, please', translation: 'Asking to pay (never "check")', phonetic: 'Thuh bil pleez' },
      { phrase: 'Lovely, thank you', translation: 'Warm appreciation', phonetic: 'Luv-lee thank yoo' },
      { phrase: 'Where\'s the loo?', translation: 'Where is the toilet?', phonetic: 'Wehz thuh loo?' }
    ],
    tipping: 'A discretionary 12.5% service charge is often added — check before adding more; otherwise ~10% is standard at restaurants.'
  },
  {
    key: 'switzerland',
    name: 'Switzerland',
    aliases: ['zurich', 'geneva', 'grindelwald', 'interlaken', 'lucerne', 'zermatt', 'bern'],
    currencyCode: 'CHF', currencyName: 'Swiss Franc', currencySymbol: 'Fr.', region: 'Schengen',
    entryRules: [
      'Schengen member: visa-exempt passports get 90 days in any 180.',
      'It is expensive — budget CHF 150–250/day; supermarket picnics (Coop/Migros) save a lot.',
      'The Swiss Half Fare Card or Travel Pass pays off quickly for mountain rail and cable cars.',
      'Quiet hours are taken seriously, especially Sundays — no laundry or noise in apartments.',
      'Tap water from public fountains is safe and delicious unless marked otherwise.'
    ],
    customs: [
      'Punctuality to the minute is the national virtue — trains truly leave on the dot.',
      'Greet with "Grüezi" (German region) and a handshake.',
      'Sunday is genuinely quiet — most shops are closed.',
      'Fondue etiquette: never drop your bread in the pot (traditional "penalties" apply).',
      'Recycling is strict; sorted bins are everywhere.'
    ],
    phrases: [
      { phrase: 'Grüezi', translation: 'Hello (Swiss German)', phonetic: 'Grew-eh-tsee' },
      { phrase: 'Merci vielmal / Danke vielmal', translation: 'Thanks a lot', phonetic: 'Mehr-see feel-mahl' },
      { phrase: 'Bitte', translation: 'Please', phonetic: 'Bit-teh' },
      { phrase: 'Wie viel kostet das?', translation: 'How much is that?', phonetic: 'Vee feel kos-tet das?' },
      { phrase: 'Die Rechnung, bitte', translation: 'The bill, please', phonetic: 'Dee resh-noong bit-teh' },
      { phrase: 'En Guete!', translation: 'Enjoy your meal!', phonetic: 'En gweh-teh' }
    ],
    tipping: 'Service is included by law; rounding up to the next 5 francs is a kind norm.'
  },
  {
    key: 'south korea',
    name: 'South Korea',
    aliases: ['korea', 'seoul', 'busan', 'jeju', 'incheon', 'gyeongju'],
    currencyCode: 'KRW', currencyName: 'South Korean Won', currencySymbol: '₩', region: 'EastAsia',
    entryRules: [
      'Many nationalities need a K-ETA (online travel authorization) — check before flying.',
      'Google Maps has limited navigation data; download Naver Map or KakaoMap.',
      'Cards accepted almost everywhere, but get a T-Money card for buses, metro, and convenience stores.',
      'Strict drug laws — even prescription stimulants common abroad require advance permission.',
      'Passport required for SIM/eSIM purchase and tax-free shopping.'
    ],
    customs: [
      'Use both hands (or support your arm) when giving or receiving anything.',
      'Shoes off in homes, many restaurants, and jjimjilbang bathhouses.',
      'Age hierarchy matters — let elders eat and board first.',
      'Tipping is not done; there are even signs asking you not to.',
      'In restaurants, shout "Yogiyo!" or press the table bell to call staff — waving is not rude here.'
    ],
    phrases: [
      { phrase: '안녕하세요', translation: 'Hello (polite)', phonetic: 'An-nyong-ha-se-yo' },
      { phrase: '감사합니다', translation: 'Thank you', phonetic: 'Kam-sa-ham-ni-da' },
      { phrase: '얼마예요?', translation: 'How much is it?', phonetic: 'Ol-ma-ye-yo?' },
      { phrase: '계산해 주세요', translation: 'The bill, please', phonetic: 'Gye-san-hae ju-se-yo' },
      { phrase: '저기요!', translation: 'Excuse me! (to call staff)', phonetic: 'Jo-gi-yo!' },
      { phrase: '맛있어요', translation: 'It\'s delicious', phonetic: 'Ma-shi-sso-yo' }
    ],
    tipping: 'No tipping culture — service charges are built in; tipping can even cause confusion.'
  },
  {
    key: 'vietnam',
    name: 'Vietnam',
    aliases: ['hanoi', 'ho chi minh', 'saigon', 'da nang', 'hoi an', 'hue', 'nha trang', 'sapa', 'ha long'],
    currencyCode: 'VND', currencyName: 'Vietnamese Dong', currencySymbol: '₫', region: 'SEAsia',
    entryRules: [
      'Many nationalities need an e-visa (apply online, ~3 working days) — some EU passports get 45 days visa-free.',
      'Passport needs 6 months validity and a blank page.',
      'Motorbike traffic is intense: cross slowly and predictably, never stop mid-flow.',
      'Agree taxi/Grab prices before riding; use the Grab app to avoid scams.',
      'Strict drug laws with severe penalties — zero tolerance.'
    ],
    customs: [
      'Bargaining is expected in markets — start around 50–60% of the first price, keep it friendly.',
      'Shoes off when entering homes and temples; dress modestly at pagodas.',
      'Don\'t touch anyone\'s head; pass items with both hands to elders.',
      'Eating is social and loud; slurping phở is a compliment.',
      'Small notes are essential — street stalls rarely have change for 500k bills.'
    ],
    phrases: [
      { phrase: 'Xin chào', translation: 'Hello', phonetic: 'Sin chow' },
      { phrase: 'Cảm ơn', translation: 'Thank you', phonetic: 'Gahm uhn' },
      { phrase: 'Bao nhiêu tiền?', translation: 'How much?', phonetic: 'Baow nyew tyen?' },
      { phrase: 'Không cay', translation: 'Not spicy', phonetic: 'Khong kai' },
      { phrase: 'Tính tiền', translation: 'The bill, please', phonetic: 'Ting tyen' },
      { phrase: 'Ngon quá!', translation: 'Delicious!', phonetic: 'Ngon kwa!' }
    ],
    tipping: 'Not expected; small change at cafés or rounding up for good service is appreciated.'
  },
  {
    key: 'indonesia',
    name: 'Indonesia',
    aliases: ['bali', 'jakarta', 'ubud', 'yogyakarta', 'lombok', 'gili', 'canggu', 'seminyak', 'uluwatu'],
    currencyCode: 'IDR', currencyName: 'Indonesian Rupiah', currencySymbol: 'Rp', region: 'SEAsia',
    entryRules: [
      'Most tourists need a Visa on Arrival (~IDR 500,000, payable by card) or e-VOA — extendable once for 30 days.',
      'Bali levies a tourist tax (~IDR 150,000) — pay online before or on arrival.',
      'Temples require a sarong and sash (usually provided at the entrance).',
      'Very strict drug laws — trafficking can carry the death penalty.',
      'Scooter rental requires an International Driving Permit; police check frequently.'
    ],
    customs: [
      'Use your right hand for giving, receiving, and eating.',
      'Never touch heads; feet are impure — don\'t point them at people or altars.',
      'Balinese Hindu offerings (canang) line sidewalks — step around, never on them.',
      'During Nyepi (Day of Silence) the whole island shuts down — even the airport.',
      'Bargaining with a smile is expected at art markets.'
    ],
    phrases: [
      { phrase: 'Halo / Selamat pagi', translation: 'Hello / Good morning', phonetic: 'Ha-lo / Se-la-mat pa-gi' },
      { phrase: 'Terima kasih', translation: 'Thank you', phonetic: 'Te-ree-ma ka-seeh' },
      { phrase: 'Berapa harganya?', translation: 'How much is it?', phonetic: 'Be-ra-pa har-gan-ya?' },
      { phrase: 'Tidak pedas', translation: 'Not spicy', phonetic: 'Tee-dak pe-das' },
      { phrase: 'Permisi', translation: 'Excuse me', phonetic: 'Per-mee-see' },
      { phrase: 'Enak sekali!', translation: 'Very delicious!', phonetic: 'E-nak se-ka-lee!' }
    ],
    tipping: 'Not required; 5–10% is appreciated in restaurants if no service charge is added.'
  },
  {
    key: 'australia',
    name: 'Australia',
    aliases: ['sydney', 'melbourne', 'brisbane', 'perth', 'cairns', 'gold coast', 'byron'],
    currencyCode: 'AUD', currencyName: 'Australian Dollar', currencySymbol: 'A$', region: 'Oceania',
    entryRules: [
      'All non-citizens need a visa or ETA — apply via the Australian ETA app before flying.',
      'Biosecurity is extremely strict: declare all food, plants, wooden items, and dirty shoes — fines are instant and large.',
      'Sun is fierce: SPF 50+, hat, and swim between the red-and-yellow flags only (rips are deadly).',
      'Distances are vast — internal flights are normal; don\'t plan Sydney–Perth by car in a week.',
      'Tipping is not expected; minimum wages are high.'
    ],
    customs: [
      'Very casual culture — first names immediately, "mate" for everyone.',
      'BYO restaurants are common; bottle shops sell alcohol (not supermarkets in some states).',
      '"Bring a plate" to a BBQ means bring food to share.',
      'Swearing is more casual than elsewhere — don\'t be shocked.',
      'Coffee culture is world-class; ordering a "flat white" is the local move.'
    ],
    phrases: [
      { phrase: 'G\'day', translation: 'Hello', phonetic: 'Guh-day' },
      { phrase: 'Cheers / Ta', translation: 'Thank you', phonetic: 'Cheerz / Tah' },
      { phrase: 'No worries', translation: 'You\'re welcome / It\'s fine', phonetic: 'No wuh-reez' },
      { phrase: 'How ya going?', translation: 'How are you?', phonetic: 'How ya go-in?' },
      { phrase: 'Arvo', translation: 'Afternoon', phonetic: 'Ah-vo' },
      { phrase: 'Too easy', translation: 'Sure / No problem', phonetic: 'Too ee-zee' }
    ],
    tipping: 'Not expected anywhere; rounding up at great restaurants is a bonus, never required.'
  },
  {
    key: 'canada',
    name: 'Canada',
    aliases: ['vancouver', 'toronto', 'montreal', 'quebec', 'banff', 'calgary', 'ottawa', 'whistler'],
    currencyCode: 'CAD', currencyName: 'Canadian Dollar', currencySymbol: 'CA$', region: 'USMCA',
    entryRules: [
      'Visa-exempt nationals need an eTA (Electronic Travel Authorization) when flying — apply online for CAD $7.',
      'Legal cannabis is age-restricted and rules differ by province — never carry it across borders.',
      'Bear country: store food properly and carry bear spray on hikes in the Rockies.',
      'Weather swings hard — layers even in summer, and real winter gear Nov–Mar.',
      'Provincial sales taxes (5–15%) are added at checkout — prices shown exclude tax.'
    ],
    customs: [
      'Politeness is real: "sorry" is used constantly, even when not at fault.',
      'Tipping culture mirrors the US: 15–20% at sit-down restaurants is expected.',
      'Quebec is proudly Francophone — start with "Bonjour" and you\'ll be welcomed warmly.',
      'Queuing and personal space are respected; small talk with strangers is normal.',
      'First Nations history and land acknowledgments are part of public life — listen respectfully.'
    ],
    phrases: [
      { phrase: 'Hello / Bonjour', translation: 'Hello (EN / Québec French)', phonetic: 'Heh-lo / Bon-zhoor' },
      { phrase: 'Thank you / Merci', translation: 'Thank you', phonetic: 'Thank yoo / Mehr-see' },
      { phrase: 'Sorry / Excuse me', translation: 'Apology / passing by', phonetic: 'Saw-ree' },
      { phrase: 'Could I get the bill?', translation: 'Asking to pay', phonetic: 'Kud eye get thuh bil?' },
      { phrase: 'Double-double', translation: 'Coffee with double cream & sugar', phonetic: 'Dub-ul dub-ul' },
      { phrase: 'Washroom', translation: 'Bathroom / toilet', phonetic: 'Wash-room' }
    ],
    tipping: '15–20% at sit-down restaurants is standard; taxi and bar tips of 10–15% are customary.'
  },
  {
    key: 'greece',
    name: 'Greece',
    aliases: ['athens', 'santorini', 'mykonos', 'crete', 'rhodes', 'corfu', 'thessaloniki'],
    currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', region: 'Schengen',
    entryRules: [
      'Schengen rules: visa-exempt passports get 90 days in any 180.',
      'Ferries sell out in summer — book inter-island routes days in advance.',
      'Archaeological sites have combined tickets and free days (first Sundays in winter).',
      'Stray cats are cared for by communities; don\'t remove them.',
      'Water on islands is often not potable — buy bottled water there.'
    ],
    customs: [
      'Dinner starts at 21:00 or later; tavernas stay lively past midnight.',
      'Hospitality (filoxenia) is deep-rooted — refusing offered treats can seem cold.',
      'The open-palm "moutza" gesture is an insult — wave with a closed hand.',
      'August 15th is a huge holiday; much of the country shuts down.',
      'Names days are celebrated more than birthdays.'
    ],
    phrases: [
      { phrase: 'Γεια σας', translation: 'Hello (polite)', phonetic: 'Ya sas' },
      { phrase: 'Ευχαριστώ', translation: 'Thank you', phonetic: 'Ef-ha-ree-sto' },
      { phrase: 'Παρακαλώ', translation: 'Please / You\'re welcome', phonetic: 'Pa-ra-ka-lo' },
      { phrase: 'Πόσο κάνει?', translation: 'How much is it?', phonetic: 'Po-so ka-nee?' },
      { phrase: 'Τον λογαριασμό', translation: 'The bill, please', phonetic: 'Ton lo-ga-ri-as-mo' },
      { phrase: 'Νόστιμο!', translation: 'Delicious!', phonetic: 'No-stee-mo!' }
    ],
    tipping: 'Rounding up or 5–10% in cash on the table is customary; not added to card payments.'
  },
  {
    key: 'portugal',
    name: 'Portugal',
    aliases: ['lisbon', 'lisboa', 'porto', 'algarve', 'faro', 'sintra', 'madeira'],
    currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', region: 'Schengen',
    entryRules: [
      'Schengen rules: visa-exempt passports get 90 days in any 180.',
      'Bread, olives, and cheese brought to your table ("couvert") are charged if eaten — wave them away if unwanted.',
      'Hills are real: Lisbon and Porto demand grippy shoes; cobblestones are slippery when wet.',
      'Tram 28 and popular miradouros get packed — go before 9:00.',
      'Card acceptance is good, but small tascas and markets prefer cash.'
    ],
    customs: [
      'Greet with "Bom dia" (until noon) / "Boa tarde"; two cheek kisses among friends.',
      'Lunch is the main meal; dinner after 20:00.',
      'Fado houses expect silence during songs.',
      'Portuguese appreciate any attempt at their language — they\'ll switch to English kindly.',
      'Coffee culture: a "bica" (espresso) standing at the counter is the local rhythm.'
    ],
    phrases: [
      { phrase: 'Bom dia', translation: 'Good morning', phonetic: 'Bom dee-a' },
      { phrase: 'Obrigado / Obrigada', translation: 'Thank you (m / f)', phonetic: 'O-bree-ga-do / da' },
      { phrase: 'Por favor', translation: 'Please', phonetic: 'Por fa-vor' },
      { phrase: 'A conta, por favor', translation: 'The bill, please', phonetic: 'Ah kon-ta por fa-vor' },
      { phrase: 'Quanto custa?', translation: 'How much?', phonetic: 'Kwan-to koos-ta?' },
      { phrase: 'Saúde!', translation: 'Cheers!', phonetic: 'Sa-oo-deh!' }
    ],
    tipping: 'Not obligatory; rounding up or 5% for good service is appreciated.'
  },
  {
    key: 'netherlands',
    name: 'Netherlands',
    aliases: ['amsterdam', 'rotterdam', 'utrecht', 'the hague', 'haarlem', 'keukenhof'],
    currencyCode: 'EUR', currencyName: 'Euro', currencySymbol: '€', region: 'Schengen',
    entryRules: [
      'Schengen rules: visa-exempt passports get 90 days in any 180.',
      'Bike lanes are sacred — never walk in them; cyclists move fast and expect awareness.',
      'Many shops and cafés are card-only (some even refuse cash).',
      'Soft drugs are tolerated only inside licensed coffeeshops; public smoking rules vary by city.',
      'Photography of the Red Light District windows is forbidden and enforced.'
    ],
    customs: [
      'Directness is honesty, not rudeness — expect blunt opinions.',
      'Greet with three cheek kisses among friends; a firm handshake otherwise.',
      'Birthdays: congratulate the family too ("Gefeliciteerd!").',
      'Dinner is early (18:00–19:30); restaurants close kitchens early.',
      'Always lock your bike twice — theft is a national sport.'
    ],
    phrases: [
      { phrase: 'Hallo / Goedemorgen', translation: 'Hello / Good morning', phonetic: 'Ha-lo / Khoo-duh-mor-khen' },
      { phrase: 'Dank je wel', translation: 'Thank you', phonetic: 'Dank ye vel' },
      { phrase: 'Alstublieft', translation: 'Please / Here you go', phonetic: 'Als-too-bleeft' },
      { phrase: 'De rekening, alstublieft', translation: 'The bill, please', phonetic: 'Duh ray-keh-ning als-too-bleeft' },
      { phrase: 'Hoeveel kost dit?', translation: 'How much is this?', phonetic: 'Hoo-vale kost dit?' },
      { phrase: 'Proost!', translation: 'Cheers!', phonetic: 'Prohst!' }
    ],
    tipping: 'Rounding up or 5–10% for good service is appreciated; service is included.'
  },
  {
    key: 'morocco',
    name: 'Morocco',
    aliases: ['marrakech', 'marrakesh', 'fes', 'fez', 'casablanca', 'essaouira', 'chefchaouen', 'agadir', 'tangier'],
    currencyCode: 'MAD', currencyName: 'Moroccan Dirham', currencySymbol: 'DH', region: 'Other',
    entryRules: [
      'Most Western passports get 90 days visa-free; passport must be valid at entry.',
      'The dirham is a closed currency — exchange on arrival, not before.',
      'Dress modestly, especially outside big cities; women may prefer covered shoulders.',
      'Friday is the holy day — many shops close midday for prayers.',
      'Haggling in souks is expected; first prices are often 2–3x the real value.'
    ],
    customs: [
      'Greet with "Salam alaykum" — reply "Wa alaykum salam".',
      'Eat and pass items with the right hand only.',
      'Mint tea is poured from a height and refusing it can seem impolite.',
      'During Ramadan, avoid eating/drinking publicly in daylight out of respect.',
      'Ask before photographing people — especially in medinas.'
    ],
    phrases: [
      { phrase: 'Salam alaykum', translation: 'Peace be upon you (hello)', phonetic: 'Sa-lam a-lay-kum' },
      { phrase: 'Choukran', translation: 'Thank you', phonetic: 'Shoo-kran' },
      { phrase: 'Bslama', translation: 'Goodbye', phonetic: 'Be-sla-ma' },
      { phrase: 'Bshhal?', translation: 'How much?', phonetic: 'Besh-hal?' },
      { phrase: 'La, choukran', translation: 'No, thank you', phonetic: 'La shoo-kran' },
      { phrase: 'Smeh liya', translation: 'Excuse me', phonetic: 'Smeh lee-ya' }
    ],
    tipping: 'Small tips (10–20 MAD) for guides, servers, and porters are customary and appreciated.'
  },
  {
    key: 'egypt',
    name: 'Egypt',
    aliases: ['cairo', 'giza', 'luxor', 'aswan', 'hurghada', 'sharm', 'dahab', 'alexandria'],
    currencyCode: 'EGP', currencyName: 'Egyptian Pound', currencySymbol: 'E£', region: 'Other',
    entryRules: [
      'Most tourists need a visa — e-Visa online (~$25) or visa on arrival at major airports.',
      'Passport must have 6 months validity.',
      'Photography permits are needed for some sites; drones are illegal without permits.',
      'Dress conservatively, especially at mosques (scarf for women).',
      '"Baksheesh" (small tips) is expected for nearly every service — carry small notes.'
    ],
    customs: [
      'Haggling is a social ritual — smile, counter at ~40%, meet in the middle.',
      'Eat with the right hand; the left is considered unclean.',
      'During Ramadan, daytime eating in public is sensitive.',
      'Egyptians are warmly hospitable; refusing tea outright can seem distant.',
      'Fridays are the main prayer day — sights can be closed midday.'
    ],
    phrases: [
      { phrase: 'Salam alaykum', translation: 'Peace be upon you (hello)', phonetic: 'Sa-lam a-lay-kum' },
      { phrase: 'Shukran', translation: 'Thank you', phonetic: 'Shoo-kran' },
      { phrase: 'Bikam da?', translation: 'How much is this?', phonetic: 'Bee-kam da?' },
      { phrase: 'La, shukran', translation: 'No, thank you', phonetic: 'La shoo-kran' },
      { phrase: 'Ma\'a salama', translation: 'Goodbye', phonetic: 'Ma-a sa-la-ma' },
      { phrase: 'Afwan', translation: 'You\'re welcome / Excuse me', phonetic: 'Af-wan' }
    ],
    tipping: 'Baksheesh is part of daily life — tip EGP 10–50 for small services, ~10% at restaurants.'
  },
  {
    key: 'peru',
    name: 'Peru',
    aliases: ['lima', 'cusco', 'machu picchu', 'arequipa', 'sacred valley', 'iquitos', 'puno'],
    currencyCode: 'PEN', currencyName: 'Peruvian Sol', currencySymbol: 'S/', region: 'Other',
    entryRules: [
      'Most Western passports get up to 90 days visa-free; passport valid 6 months recommended.',
      'Machu Picchu entry is timed and capped — book weeks ahead; passport checked at the gate.',
      'Altitude sickness is real in Cusco (3,400 m): rest day one, hydrate, try coca tea.',
      'Yellow fever vaccination is recommended for jungle regions.',
      'Use registered taxis or apps (Uber/Cabify) at night in Lima.'
    ],
    customs: [
      'Greet with a handshake; one cheek kiss among friends.',
      'Pachamama (Mother Earth) offerings are sacred in Andean culture — observe respectfully.',
      'Bargaining is normal in markets, not in restaurants.',
      'Lunch (almuerzo) is the main meal with cheap "menú" deals.',
      'Ask before photographing traditionally dressed locals — a small tip is often expected.'
    ],
    phrases: [
      { phrase: 'Hola / Buenos días', translation: 'Hello / Good morning', phonetic: 'Oh-lah / Bweh-nos dee-as' },
      { phrase: 'Gracias', translation: 'Thank you', phonetic: 'Grah-syas' },
      { phrase: '¿Cuánto cuesta?', translation: 'How much?', phonetic: 'Kwan-toh kwes-ta?' },
      { phrase: 'La cuenta, por favor', translation: 'The bill, please', phonetic: 'La kwen-ta por fa-vor' },
      { phrase: '¡Qué rico!', translation: 'Delicious!', phonetic: 'Keh ree-ko!' },
      { phrase: 'Disculpe', translation: 'Excuse me', phonetic: 'Dees-kool-peh' }
    ],
    tipping: '10% in restaurants is customary; small change for guides and porters is appreciated.'
  },
  {
    key: 'iceland',
    name: 'Iceland',
    aliases: ['reykjavik', 'akureyri', 'vik', 'golden circle', 'blue lagoon'],
    currencyCode: 'ISK', currencyName: 'Icelandic Króna', currencySymbol: 'kr', region: 'Schengen',
    entryRules: [
      'Schengen member: visa-exempt passports get 90 days in any 180.',
      'Weather changes in minutes — check vedur.is and road.is daily before driving.',
      'Off-road driving is illegal and heavily fined; stick to marked roads.',
      'Nearly everything is card/contactless — you can skip cash entirely.',
      'Book the Blue Lagoon and popular tours days ahead in summer.'
    ],
    customs: [
      'Shower naked before pools — strictly enforced and completely normal.',
      'Shoes off when entering homes.',
      'Names are patronymic; everyone is on a first-name basis, even the president.',
      'Alcohol is sold only in state Vínbúðin stores (and bars).',
      'Respect elves jokes lightly — road projects really have been rerouted around "elf rocks".'
    ],
    phrases: [
      { phrase: 'Halló', translation: 'Hello', phonetic: 'Ha-low' },
      { phrase: 'Takk fyrir', translation: 'Thank you', phonetic: 'Tahk fi-rir' },
      { phrase: 'Vinsamlegast', translation: 'Please', phonetic: 'Vin-sam-le-gast' },
      { phrase: 'Hvað kostar þetta?', translation: 'How much is this?', phonetic: 'Kvath kos-tar thet-ta?' },
      { phrase: 'Skál!', translation: 'Cheers!', phonetic: 'Skowl!' },
      { phrase: 'Afsakið', translation: 'Excuse me / Sorry', phonetic: 'Af-sa-kith' }
    ],
    tipping: 'Not expected — service and VAT are included; rounding up is a kind bonus.'
  },
  {
    key: 'new zealand',
    name: 'New Zealand',
    aliases: ['auckland', 'queenstown', 'wellington', 'christchurch', 'rotorua', 'milford', 'wanaka'],
    currencyCode: 'NZD', currencyName: 'New Zealand Dollar', currencySymbol: 'NZ$', region: 'Oceania',
    entryRules: [
      'Most visa-waiver nationals need an NZeTA plus the IVL tourist levy — apply via the official app before flying.',
      'Biosecurity is strict: declare all food, outdoor gear, and muddy boots — on-the-spot fines apply.',
      'Drive on the left; rural roads are narrow and winding — allow double the map time.',
      'Sun is harsh (thin ozone) — SPF 50 even on cloudy days.',
      'Book DOC huts and Great Walks months ahead in season.'
    ],
    customs: [
      'Very informal culture — first names and g\'day-style greetings everywhere.',
      'Māori culture is living heritage: a hongi (forehead press) may be offered on marae — follow the host\'s lead.',
      'Remove shoes when entering homes and marae.',
      'BYO wine to casual restaurants is common and accepted.',
      'Tipping is not part of the culture — wages are livable.'
    ],
    phrases: [
      { phrase: 'Kia ora', translation: 'Hello / Thank you (Māori)', phonetic: 'Kee-a o-ra' },
      { phrase: 'Cheers', translation: 'Thanks', phonetic: 'Cheerz' },
      { phrase: 'Sweet as', translation: 'Great / no problem', phonetic: 'Sweet az' },
      { phrase: 'No worries', translation: 'You\'re welcome', phonetic: 'No wuh-reez' },
      { phrase: 'How\'s it going?', translation: 'How are you?', phonetic: 'Howz it go-ing?' },
      { phrase: 'Chur', translation: 'Thanks / nice one', phonetic: 'Chur' }
    ],
    tipping: 'Not expected; rounding up for exceptional service is a pleasant surprise, never required.'
  },
  {
    key: 'united states',
    name: 'United States',
    aliases: ['usa', 'america', 'new york', 'nyc', 'los angeles', 'la', 'san francisco', 'miami', 'chicago', 'las vegas', 'hawaii', 'boston', 'seattle'],
    currencyCode: 'USD', currencyName: 'US Dollar', currencySymbol: '$', region: 'USMCA',
    entryRules: [
      'Most Western passports travel on ESTA (Visa Waiver Program) — apply online before flying.',
      'Prices exclude sales tax (added at checkout, 0–10%).',
      'Tipping is essentially mandatory in restaurants — service staff rely on it.',
      'ID is checked for alcohol regardless of apparent age — carry your passport.',
      'Distances are huge; domestic flights or rental cars are the norm between cities.'
    ],
    customs: [
      'Friendly small talk with strangers ("How\'s it going?") is normal — a short friendly reply suffices.',
      'Tipping: 18–20% at sit-down restaurants, $1–2 per drink at bars, 15–20% for taxis.',
      'Portions are large; asking for a "to-go box" is completely normal.',
      'Personal space is valued — stand an arm\'s length apart.',
      'Everything runs on credit/debit cards and tips by card are fine.'
    ],
    phrases: [
      { phrase: 'Hi, how\'s it going?', translation: 'Standard greeting', phonetic: 'Hi, howz it go-ing?' },
      { phrase: 'Thank you so much', translation: 'Warm thanks', phonetic: 'Thank yoo so much' },
      { phrase: 'Could I get...?', translation: 'Polite ordering', phonetic: 'Kud eye get...?' },
      { phrase: 'Check, please', translation: 'The bill, please', phonetic: 'Chek pleez' },
      { phrase: 'Have a good one!', translation: 'Friendly goodbye', phonetic: 'Hav a good wun!' },
      { phrase: 'Excuse me', translation: 'Attention / passing by', phonetic: 'Ex-kyooz mee' }
    ],
    tipping: '18–20% is the restaurant standard; service workers depend on tips.'
  }
];

/** Generic fallback for countries not in the knowledge base */
export const GENERIC_GUIDE: Omit<CountryGuideData, 'key' | 'aliases' | 'name'> = {
  currencyCode: 'EUR', currencyName: 'Local Currency', currencySymbol: '€', region: 'Other',
  entryRules: [
    'Ensure your passport is valid for at least 6 months beyond your planned departure date.',
    'Check the official consulate or government travel portal for current visa requirements for your nationality.',
    'Register with your embassy\'s traveler program for safety alerts.',
    'Keep digital and paper copies of your passport, bookings, and insurance.',
    'Check customs allowances for restricted items before packing.'
  ],
  customs: [
    'Learn a few local greetings — even a simple hello in the local language opens doors.',
    'Dress modestly when visiting religious or historic sites.',
    'Observe how locals queue, greet, and tip — mirroring them is the fastest way to blend in.',
    'Ask permission before photographing people.',
    'Respect local quiet hours and public behavior norms.'
  ],
  phrases: [
    { phrase: 'Hello', translation: 'Standard greeting', phonetic: 'Heh-lo' },
    { phrase: 'Thank you', translation: 'Appreciation', phonetic: 'Thank yoo' },
    { phrase: 'Please', translation: 'Polite request', phonetic: 'Pleez' },
    { phrase: 'Excuse me', translation: 'Getting attention', phonetic: 'Ex-kyooz mee' },
    { phrase: 'How much?', translation: 'Asking the price', phonetic: 'How much?' }
  ],
  tipping: 'Check local customs: tipping varies from offensive to expected depending on the country.'
};

/**
 * Find the knowledge-base entry for any destination text ("Kyoto, Japan",
 * "Oaxaca", "South Korea", ...). Matches country name first, then aliases.
 */
export function lookupCountryGuide(destinationText: string): CountryGuideData {
  const t = destinationText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  for (const g of COUNTRY_GUIDES) {
    if (t.includes(g.key) || t.includes(g.name.toLowerCase())) return g;
  }
  for (const g of COUNTRY_GUIDES) {
    // Short aliases ("la", "us") need word boundaries or "atlantis" → Los Angeles
    if (
      g.aliases.some((a) =>
        a.length <= 3 ? new RegExp(`\\b${a}\\b`, 'i').test(t) : t.includes(a)
      )
    )
      return g;
  }
  // Full 197-country coverage: build a country-specific guide from countryInfo
  // so currency, greetings, entry rules and visa advice are ALWAYS for the
  // actual destination country — never a generic USD/EUR/English fallback.
  const info = countryInfoFor(destinationText);
  const canonical = countryNameFor(destinationText);
  if (info && canonical) {
    return {
      key: canonical.toLowerCase(),
      name: canonical,
      aliases: [],
      currencyCode: info.currency.code,
      currencyName: info.currency.name,
      currencySymbol: info.currency.symbol,
      region: info.region,
      visaCountry: canonical,
      entryRules: [
        entryRuleBullet(destinationText),
        'Passport should be valid for at least 6 months beyond your arrival date.',
        'Carry proof of onward/return travel and your first accommodation booking — border officers may ask.',
        `Check ${canonical} customs rules for restricted items (medicines, food, drones, large cash amounts) before packing.`,
        `Save ${canonical} emergency numbers and your embassy's contact details on arrival.`
      ],
      customs: [
        `A few words of the local language open doors in ${canonical} — start with hello and thank you.`,
        'Dress modestly when visiting religious or historic sites; follow the local lead on shoes and head coverings.',
        'Ask permission before photographing people, ceremonies, or official buildings.',
        'Observe how locals queue, greet, and dine — mirroring them is the fastest way to blend in.',
        'Respect local quiet hours and norms around alcohol and public behavior.',
        'Learn the local hand gestures and table manners before you go — what is friendly at home can be rude abroad.'
      ],
      phrases: phrasesForCountry(destinationText),
      tipping: tippingForCountry(destinationText)
    };
  }
  return {
    ...GENERIC_GUIDE,
    key: 'generic',
    name: destinationText,
    aliases: []
  };
}

/** Whether the traveler is from a high-tipping culture (US/Canada-style) */
export function isHighTippingNationality(nationality: string): boolean {
  const n = nationality.toLowerCase();
  return ['united states', 'usa', 'america', 'canada', 'canadian', 'u.s.'].some((k) => n.includes(k));
}

/** Whether traveler and destination share the same region (EU, Schengen, etc.) */
export function isSameRegionTraveler(nationality: string, dest: CountryGuideData): boolean {
  const n = nationality.toLowerCase();
  const euWords = ['germany', 'france', 'italy', 'spain', 'portugal', 'netherlands', 'austria', 'belgium', 'greece', 'ireland', 'croatia', 'poland', 'czech', 'sweden', 'denmark', 'finland', 'europe', 'eu'];
  const isEU = euWords.some((w) => n.includes(w));
  if (isEU && (dest.region === 'Schengen' || dest.region === 'EU-non-Schengen')) return true;
  const isNA = isHighTippingNationality(n);
  if (isNA && dest.region === 'USMCA') return true;
  return false;
}

/**
 * Nationality-aware visa & entry summary.
 */
export function visaAdviceFor(travelerNationality: string, dest: CountryGuideData): string {
  const nat = travelerNationality.trim() || 'your nationality';
  // Info-built guides carry a fixed, fully country-specific visa passage.
  if (dest.visaCountry) return visaPassageFor(nat, dest.visaCountry);
  if (isSameRegionTraveler(nat, dest)) {
    if (dest.region === 'Schengen') {
      return `As a ${nat} traveler, you enjoy free movement within the Schengen area — no visa needed for ${dest.name}. Carry your passport or national ID card, and respect the 90-days-in-180 rule if you are not an EU citizen.`;
    }
    if (dest.region === 'USMCA') {
      return `As a ${nat} traveler, entry to ${dest.name} is straightforward under regional agreements — typically no visa is needed for short tourism stays. Carry your passport and proof of onward travel.`;
    }
  }
  if (dest.region === 'Schengen') {
    return `${dest.name} follows Schengen rules: many passports (US, UK, CA, AU, JP and others) get 90 days visa-free in any 180-day period; ETIAS pre-authorization may apply. As a ${nat} traveler, verify your status on the official EU/consulate portal before booking.`;
  }
  if (dest.region === 'UK') {
    return `As a ${nat} traveler, you will most likely need the UK ETA (Electronic Travel Authorisation) applied for online before departure. The UK is not in Schengen.`;
  }
  if (dest.region === 'Oceania') {
    return `As a ${nat} traveler, apply for the electronic travel authorization (ETA / NZeTA) before flying to ${dest.name}; biosecurity declarations on arrival are strict.`;
  }
  if (dest.region === 'EastAsia') {
    return `Visa rules for ${dest.name} differ strongly by passport — several Western passports enjoy visa-free short stays, others need a visa or e-visa in advance. As a ${nat} traveler, confirm with the official ${dest.name} embassy or consulate site before booking.`;
  }
  if (dest.region === 'SEAsia') {
    return `${dest.name} typically offers visa-free entry or Visa-on-Arrival/e-visa for many passports. As a ${nat} traveler, check the latest entry rules — policies changed frequently in recent years.`;
  }
  return `Entry rules for ${dest.name} depend on your passport. As a ${nat} traveler, check the official consulate portal for visa requirements and passport-validity rules before departure.`;
}

/**
 * Nationality-aware tipping guidance.
 */
export function tippingAdviceFor(travelerNationality: string, dest: CountryGuideData): string {
  const highTipper = isHighTippingNationality(travelerNationality);
  const nat = travelerNationality.trim() || 'your home country';
  if (highTipper && !isHighTippingNationality(dest.name)) {
    return `${dest.tipping} (Heads up: coming from ${nat}, tipping feels automatic — but the norm in ${dest.name} is very different, so dial it back.)`;
  }
  if (!highTipper && isHighTippingNationality(dest.name)) {
    return `${dest.tipping} (Important if you're used to ${nat}: tipping in ${dest.name} is a real part of service workers' income — budget for it.)`;
  }
  return dest.tipping;
}
