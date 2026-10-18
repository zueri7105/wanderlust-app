import { GoogleGenAI } from '@google/genai';
import { SoloTraveler, TravelTrip, TravelActivity, TravelGuideInfo } from '../types/travel';

const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';

let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('GoogleGenAI initialization skipped:', err);
  }
}

export async function generateDestinationTravelGuide(
  destination: string,
  travelerNationality: string,
  travelNotes?: string
): Promise<TravelGuideInfo> {
  const destCountry = destination.includes(',') ? destination.split(',')[1].trim() : destination;
  const destCity = destination.includes(',') ? destination.split(',')[0].trim() : destination;

  // High-fidelity fallback based on destination
  const isSpain = destination.toLowerCase().includes('spain') || destination.toLowerCase().includes('barcelona') || destination.toLowerCase().includes('madrid');
  const isJapan = destination.toLowerCase().includes('japan') || destination.toLowerCase().includes('kyoto') || destination.toLowerCase().includes('tokyo');
  const isChina = destination.toLowerCase().includes('china') || destination.toLowerCase().includes('shanghai') || destination.toLowerCase().includes('beijing');

  if (isChina) {
    return {
      travelerNationality,
      destinationCity: destCity,
      destinationCountry: 'China',
      visaRequirements: `Citizens of many EU countries (including Germany, France, Italy, Spain, Netherlands) enjoy 15-day Visa-Free tourism entry. Other nationalities require an L-Tourist Visa or 144-hour transit visa exemption. Passport must have at least 6 months validity.`,
      specificCurrency: {
        code: 'CNY',
        name: 'Chinese Yuan Renminbi (RMB / ¥)',
        symbol: '¥',
        rateBenchmark: '1 USD ≈ ¥7.15 CNY · 1 EUR ≈ ¥7.80 CNY',
        cardAcceptance: 'Physical foreign Visa/Mastercard rarely accepted at street shops. You MUST bind your foreign credit card to Alipay or WeChat Pay before arrival.',
        tippingRules: 'Strictly No Tipping: Tipping is not part of Chinese culture and may be considered offensive or confusing.'
      },
      weatherOutlook: {
        cityName: `${destCity} Weather Trends`,
        seasonPeriod: 'Spring & Autumn Golden Season',
        temperatureRange: '13°C – 22°C (55°F – 72°F)',
        daytimeAvg: '20°C',
        nighttimeAvg: '12°C',
        rainProbability: '20% chance of overcast skies or light rain',
        conditions: 'Pleasant daytime strolling temperatures with cool evening breezes. Air quality generally good in autumn.',
        daylightSummary: 'Approx. 11.5 hours of daylight (06:00 AM – 05:40 PM).',
        clothingAdvice: 'Pack breathable layers, comfortable walking shoes for high step counts, and a light jacket for breezy evenings.'
      },
      recommendedToBring: [
        'High-capacity power bank (essential as all payments, metro passes, and menus use your phone)',
        'Passport pouch (carry physical passport everywhere for high-speed train entry and museum check-ins)',
        'Compact pocket tissues / wet wipes (most public restrooms outside malls do not provide toilet paper)',
        'Universal 2/3-pin plug adapter (220V 50Hz)',
        'Comfortable cushioned walking shoes for expansive palaces and vast metro stations'
      ],
      arrivalRulesAndApps: {
        connectivityAdvice: 'Google, Google Maps, WhatsApp, Instagram, and Gmail are blocked in China. To access them, purchase an international roaming eSIM (like Airalo, Nomad, or Holafly) before arrival which bypasses firewall restrictions without requiring a local VPN, OR install a verified VPN (Astrill / LetsVPN) before departing your home country.',
        recommendedApps: [
          { name: 'Alipay (TourPass/Bank Card)', purpose: 'Essential mobile payments, Didi taxi calling, and metro QR codes' },
          { name: 'WeChat (Weixin Pay)', purpose: 'Payments, communication, and ordering food at tables via mini-programs' },
          { name: 'Amap (Gaode Map) / Apple Maps', purpose: 'Accurate navigation in China where Google Maps is inaccurate/blocked' },
          { name: 'Trip.com', purpose: 'English booking for Chinese high-speed trains (Gaotie) and entrance tickets' }
        ],
        entryRegulations: [
          'Fingerprint scan at immigration kiosks upon arrival at airport terminal.',
          'Keep your customs entry slip safely inside your passport until departure.',
          'Hotel check-in requires physical passport scan for automatic police registration.'
        ]
      },
      culturalNorms: [
        'Cashless Society: Almost zero cash is used; street vendors, fruit stalls, and taxis all use QR code payments via Alipay or WeChat Pay.',
        'Dining Etiquette: Never stick chopsticks vertically into a bowl of rice (symbolizes incense at funerals). Slurping hot noodles is normal.',
        'Personal Space: High population density means bustling queues; speak courteously and stay patient at transit hubs.'
      ],
      basicGreetings: [
        { phrase: 'Nǐ Hǎo (你好)', translation: 'Hello / Greetings', phonetic: 'Nee-how' },
        { phrase: 'Xièxiè (谢谢)', translation: 'Thank you', phonetic: 'Shyeh-shyeh' },
        { phrase: 'Duōshǎo qián? (多少钱?)', translation: 'How much is this?', phonetic: 'Dwoh-shao chyen?' },
        { phrase: 'Mǎidān (买单)', translation: 'The bill / check please', phonetic: 'My-dahn' }
      ],
      culturalShocks: [
        {
          title: 'Total Digital Cashless Ecosystem',
          description: 'Even street fruit carts and temple incense vendors do not take cash or coins. Failing to set up Alipay before landing leaves you stranded.',
          tip: 'Download Alipay international version at home, pass passport verification, and link your Visa/Mastercard.'
        },
        {
          title: 'Great Firewall & No Google Maps',
          description: 'Google Maps shows roads offset by hundreds of meters and search will fail completely on local Wi-Fi.',
          tip: 'Use Apple Maps (works natively in China) or download Amap (Gaode) with translated landmarks.'
        },
        {
          title: 'Squat Restrooms in Historic Sites',
          description: 'Traditional public restrooms in parks and older subway stations feature squat toilets and rarely supply free paper.',
          tip: 'Carry small packs of pocket tissues and travel hand sanitizer in your day bag.'
        }
      ],
      soloSafetyAdvisories: [
        'Violent crime is practically nonexistent; solo travel at night is remarkably safe in all major Chinese cities.',
        'Watch out for the "Tea Ceremony / English Practice" scam near tourist hotspots: strangers inviting you to an expensive hidden tea house.',
        'Emergency number: 110 for Police, 120 for Ambulance.'
      ]
    };
  }

  if (isSpain) {
    const isEU = ['Germany', 'France', 'Italy', 'Netherlands', 'Spain', 'EU'].some(c =>
      travelerNationality.toLowerCase().includes(c.toLowerCase())
    );
    return {
      travelerNationality,
      destinationCity: destCity,
      destinationCountry: 'Spain',
      visaRequirements: isEU
        ? `As a ${travelerNationality} citizen (EU/EEA), you enjoy Freedom of Movement. No visa required; enter with a valid National Identity Card or Passport.`
        : `Visa-free tourist stay up to 90 days within any 180-day period for tourism (Schengen Area). Ensure passport is valid at least 3 months beyond departure.`,
      specificCurrency: {
        code: 'EUR',
        name: 'Euro (€)',
        symbol: '€',
        rateBenchmark: '1 EUR ≈ 1.09 USD · 1 EUR ≈ 0.86 GBP',
        cardAcceptance: 'Cards and Apple/Google Pay accepted everywhere from tapas bars to city buses. Carry €10–€20 cash for neighborhood markets.',
        tippingRules: 'Service included. Rounding up to the nearest euro or leaving 5% for exceptional sit-down dinner service is customary but optional.'
      },
      weatherOutlook: {
        cityName: `${destCity} Weather Trends`,
        seasonPeriod: 'Sunny Mediterranean Season',
        temperatureRange: '15°C – 25°C (59°F – 77°F)',
        daytimeAvg: '22°C',
        nighttimeAvg: '14°C',
        rainProbability: '10% chance of brief showers',
        conditions: 'Warm, sun-drenched afternoons with comfortable, mild evenings.',
        daylightSummary: 'Approx. 11 hours of sunlight; sunset around 7:30 PM.',
        clothingAdvice: 'Breathable linens, sun hat, comfortable walking sandals, and a light jacket for late-night tapas walks.'
      },
      recommendedToBring: [
        'Light layers & breathable linen: warm in the sun, breezy in evenings.',
        'Comfortable cushioned walking shoes for historic cobblestone streets.',
        'Crossbody anti-theft bag with secure zips for crowded plazas and transit.',
        'Type C/F European two-pin power adapter.',
        'High-SPF sunscreen and polarized sunglasses for bright Iberian sunlight.'
      ],
      arrivalRulesAndApps: {
        connectivityAdvice: 'EU travelers enjoy free data roaming with no extra charge. Non-EU travelers can purchase a local Orange or Vodafone eSIM at airport kiosks.',
        recommendedApps: [
          { name: 'Citymapper / Google Maps', purpose: 'Metro and walking navigation in Madrid and Barcelona' },
          { name: 'Renfe / Trainline', purpose: 'Booking high-speed AVE trains between Spanish cities' },
          { name: 'Cabify / FreeNow', purpose: 'Licensed rideshare and taxi hailing' }
        ],
        entryRegulations: [
          'EU / Schengen arrivals undergo zero border customs friction.',
          'Non-EU arrivals require passport stamping and minimum 3 months validity beyond planned stay.'
        ]
      },
      culturalNorms: [
        'Dining times are late: Lunch is 2:00 PM – 4:00 PM, and dinner rarely starts before 9:00 PM or 9:30 PM.',
        'Tipping is not customary or expected; leaving small change is appreciated but optional.',
        'Always greet shopkeepers and cafe hosts with "¡Hola!" or "Buenos días/tardes" upon entering.'
      ],
      basicGreetings: [
        { phrase: '¡Hola! (Buenos días)', translation: 'Hello / Good morning', phonetic: 'Oh-lah / Bway-nos dee-ahs' },
        { phrase: 'Por favor / Gracias', translation: 'Please / Thank you', phonetic: 'Por fah-vor / Grah-syahs' },
        { phrase: 'La cuenta, por favor', translation: 'The bill, please', phonetic: 'Lah kwen-tah por fah-vor' },
        { phrase: 'Una cerveza / café con leche', translation: 'A beer / coffee with milk', phonetic: 'Oo-nah ther-veh-thah' }
      ],
      culturalShocks: [
        {
          title: 'Late Evening Dining Culture',
          description: 'Arriving at a restaurant at 7:00 PM will find empty dining rooms or closed kitchens.',
          tip: 'Have a late afternoon merienda (snack or coffee) around 5:30 PM to pace yourself.'
        },
        {
          title: 'Afternoon Siesta Closures',
          description: 'Independent artisan shops outside malls close between 2:00 PM and 5:00 PM.',
          tip: 'Plan museum visits and relaxed lunches during early afternoon hours.'
        }
      ],
      soloSafetyAdvisories: [
        'Watch for pickpockets in crowded tourist hubs (Sol, Gran Vía, Las Ramblas). Keep valuables in front pockets.',
        'When meeting new travel companions, rendezvous at bustling open plazas (Plaza Mayor, Plaza de España) during daylight.',
        'National emergency number in Spain is 112 (operators speak English, German, French, and Spanish).'
      ]
    };
  }

  if (isJapan) {
    return {
      travelerNationality,
      destinationCity: destCity,
      destinationCountry: 'Japan',
      visaRequirements: `Citizens of ${travelerNationality} enjoy Visa-Free entry for temporary tourism stays up to 90 days. Passport must be valid for the duration of stay. Complete Visit Japan Web for digital customs QR codes.`,
      specificCurrency: {
        code: 'JPY',
        name: 'Japanese Yen (¥ / JPY)',
        symbol: '¥',
        rateBenchmark: '1 USD ≈ ¥152 JPY · 1 EUR ≈ ¥165 JPY',
        cardAcceptance: 'Cards and digital IC cards (Suica/Pasmo) accepted at most stores, convenience stores, and transit stations. Carry ¥10,000–¥20,000 cash for historic shrines, gachapon, and neighborhood ramen shops.',
        tippingRules: 'Strictly No Tipping: Tipping is not practiced in Japan and will cause confusion. Outstanding hospitable service is standard.'
      },
      weatherOutlook: {
        cityName: `${destCity} Local Climate`,
        seasonPeriod: 'Autumn Foliage / Spring Blossom',
        temperatureRange: '12°C – 21°C (54°F – 70°F)',
        daytimeAvg: '19°C',
        nighttimeAvg: '11°C',
        rainProbability: '15% chance of light drizzle',
        conditions: 'Crisp morning air, sunny mild afternoons, ideal for temple gardens and walking trails.',
        daylightSummary: 'Approx. 11 hours daylight (06:05 AM – 05:15 PM).',
        clothingAdvice: 'Slip-on shoes, layered warm fleece or light down jacket for morning shrines, and a small daypack.'
      },
      recommendedToBring: [
        'Slip-on walking shoes: You will frequently take shoes off at temples, traditional ryokans, and tea houses.',
        'Dedicated coin pouch: Japanese Yen uses heavy coins (¥100, ¥500) for lockers, buses, and vending machines.',
        'Light packable down jacket or fleece for chilly temple mornings and mountain trails.',
        'Type A two-prong ungrounded plug adapter (100V).',
        'Pocket WiFi or local travel eSIM for continuous Google Maps navigation.'
      ],
      arrivalRulesAndApps: {
        connectivityAdvice: 'Rent a Pocket WiFi at airport arrivals (Ninja WiFi / Telecom) or install an international eSIM before departure for seamless connectivity.',
        recommendedApps: [
          { name: 'Suica / Pasmo (Apple Wallet)', purpose: 'Tap-to-pay subway, bus, convenience stores, and vending machines' },
          { name: 'Google Maps / Japan Travel by NAVITIME', purpose: 'Platform number, car transfer, and train timetable navigation' },
          { name: 'Visit Japan Web', purpose: 'Digital QR codes for expedited immigration and customs inspection' },
          { name: 'Google Translate (Camera)', purpose: 'Instant visual translation for kanji menus and shrine signs' }
        ],
        entryRegulations: [
          'Complete Visit Japan Web online 24–48 hours prior to departure for fast-track immigration.',
          'Strict customs prohibitions: narcotics, pseudoephedrine/codeine cold medicines without prior official yakkan shoumei permit.'
        ]
      },
      culturalNorms: [
        'No street eating while walking: finish food and drinks near the vending machine or stall where bins are provided.',
        'Manner Mode on transit: keep phones silenced and never take phone calls on trains or subways.',
        'Shoes off indoors: remove footwear when stepping onto tatami mats or elevated wooden temple floors.'
      ],
      basicGreetings: [
        { phrase: 'Konnichiwa (こんにちは)', translation: 'Hello / Good afternoon', phonetic: 'Kohn-nee-chee-wah' },
        { phrase: 'Arigatou gozaimasu (ありがとうございます)', translation: 'Thank you very much', phonetic: 'Ah-ree-gah-toh goh-zah-ee-mahs' },
        { phrase: 'Sumimasen (すみません)', translation: 'Excuse me / Sorry', phonetic: 'Soo-mee-mah-sen' },
        { phrase: 'Kore o kudasai (これをください)', translation: 'This one please (pointing)', phonetic: 'Koh-reh oh koo-dah-sigh' }
      ],
      culturalShocks: [
        {
          title: 'Complete Absence of Street Trash Cans',
          description: 'Japanese streets have almost zero public garbage bins to maintain public cleanliness.',
          tip: 'Carry a small plastic bag in your backpack to hold wrappers until you return to your hotel or convenience store.'
        },
        {
          title: 'Strict Quiet Zones on Public Transit',
          description: 'Subways and Shinkansen bullet trains are exceptionally quiet; talking loudly draws disapproving looks.',
          tip: 'Keep conversations in quiet whispers and wear earphones with no audio bleed.'
        }
      ],
      soloSafetyAdvisories: [
        'Japan is one of the safest nations in the world for solo travelers, including walking alone at night.',
        'Meet travel companions in prominent well-lit public spots: Kyoto Station Kyoto Tower exit or Hachiko statue.',
        'Emergency numbers: 110 for Police, 119 for Ambulance/Fire.'
      ]
    };
  }

  return getRichDestinationGuide(destination, travelerNationality, destCity, destCountry);
}

function getRichDestinationGuide(
  destination: string,
  travelerNationality: string,
  destCity: string,
  destCountry: string
): TravelGuideInfo {
  const destLower = destination.toLowerCase();

  if (destLower.includes('croatia') || destLower.includes('dubrovnik') || destLower.includes('split')) {
    return {
      travelerNationality,
      destinationCity: destCity || 'Dubrovnik',
      destinationCountry: 'Croatia',
      visaRequirements: 'Schengen Area Member: EU/EEA citizens enter with national ID or passport. US, UK, Canada, Australia enter visa-free for up to 90 days in 180 days.',
      specificCurrency: {
        code: 'EUR',
        name: 'Euro (€)',
        symbol: '€',
        rateBenchmark: '1 EUR ≈ 1.09 USD · 1 EUR ≈ 0.86 GBP (Croatian Kuna HRK was phased out in Jan 2023)',
        cardAcceptance: 'Cards widely accepted across restaurants and Old Town shops. Keep €20–€30 cash for island water taxis and small bakeries.',
        tippingRules: 'Service charge not itemized. Rounding up to the nearest Euro or leaving 10% for pleasant table dining service is customary.'
      },
      weatherOutlook: {
        cityName: `${destCity} Coastal Adriatic Climate`,
        seasonPeriod: 'Spring & Autumn Season (Ideal for wall walks)',
        temperatureRange: '16°C – 24°C (61°F – 75°F)',
        daytimeAvg: '22°C (Warm sun, gentle sea breeze)',
        nighttimeAvg: '15°C (Pleasantly cool)',
        rainProbability: '15% chance of passing Adriatic showers',
        conditions: 'Bright Mediterranean sunshine, crystal-clear coastal visibility, mild evening breeze along the Stradun promenade.',
        daylightSummary: 'Approx. 11 hours daylight.',
        clothingAdvice: 'Pack sturdy sneakers with high friction (limestone streets are polished slick as glass), swim gear, and sunglasses.'
      },
      recommendedToBring: [
        'High-traction rubber-soled walking sneakers (Dubrovnik Old Town limestone paving is extremely slippery)',
        'Dubrovnik Pass digital voucher on phone (includes City Walls walk and 10+ museums)',
        'Compact reef-safe sunblock and sunglasses for glaring Adriatic reflections',
        'Refillable water bottle (fountain water at Onofrio Fountain is mountain spring-fed and clean)',
        'Type C/F European two-pin plug adapter'
      ],
      arrivalRulesAndApps: {
        connectivityAdvice: 'Croatia is in the EU Roaming zone (free for EU mobile plans). Non-EU travelers can purchase a Telemach or A1 tourist eSIM for €10–€15.',
        recommendedApps: [
          { name: 'Dubrovnik Pass (Official)', purpose: 'Discounted access to city walls and free local Libertas bus rides' },
          { name: 'Ferryhopper / Jadrolinija', purpose: 'Live timetables and tickets for catamaran ferries to Lokrum and islands' },
          { name: 'Google Maps / Citymapper', purpose: 'Old Town navigation and bus station timetables' }
        ],
        entryRegulations: [
          'Dubrovnik is inside Schengen since 2023.',
          'Strict local ordinance: Walking shirtless or in swimsuits through Old Town center incurs fines up to €150.'
        ]
      },
      culturalNorms: [
        'Kava (Coffee) Culture: Drinking coffee is a sacred 1-2 hour social ritual; never rush a server for the bill.',
        'Always greet shopkeepers with "Dobar dan" (Good day) when walking into local shops.',
        'Respect quiet hours inside ancient residential alleys where local families reside.'
      ],
      basicGreetings: [
        { phrase: 'Dobar dan', translation: 'Good day / Hello', phonetic: 'DOH-bar dahn' },
        { phrase: 'Hvala lijepa', translation: 'Thank you very much', phonetic: 'HVAH-lah LYEH-pah' },
        { phrase: 'Molim / Račun, molim', translation: 'Please / The bill please', phonetic: 'MOH-leem / RAH-choon MOH-leem' }
      ],
      culturalShocks: [
        {
          title: 'Steep City Stairs Everywhere',
          description: 'The northern side of Old Town rises sharply up hundreds of steep stone stairs, making heavy luggage difficult to wheel.',
          tip: 'Book lodging near the Stradun main street or arrange porter assistance from Ploče or Pile gate.'
        }
      ],
      soloSafetyAdvisories: [
        'Croatia is ranked among the top 10 safest countries globally; solo female travelers feel exceptionally secure.',
        'Emergency number: 112 (General European Emergency), 192 (Police).'
      ]
    };
  }

  if (destLower.includes('italy') || destLower.includes('amalfi') || destLower.includes('rome') || destLower.includes('positano')) {
    return {
      travelerNationality,
      destinationCity: destCity || 'Amalfi Coast',
      destinationCountry: 'Italy',
      visaRequirements: 'Schengen Area Member: EU citizens enter with ID. US/UK/Canada enter visa-free up to 90 days in 180 days.',
      specificCurrency: {
        code: 'EUR',
        name: 'Euro (€)',
        symbol: '€',
        rateBenchmark: '1 EUR ≈ 1.09 USD · 1 EUR ≈ 0.86 GBP',
        cardAcceptance: 'Contactless accepted at restaurants and train stations. Carry €15–€25 cash for espresso bars and beach lockers.',
        tippingRules: 'Coperto (cover charge per person, usually €2–€3) is automatically added to table service. Additional tipping is optional.'
      },
      weatherOutlook: {
        cityName: `${destCity} Mediterranean Sea Outlook`,
        seasonPeriod: 'Spring to Autumn Coastal Window',
        temperatureRange: '17°C – 26°C (63°F – 79°F)',
        daytimeAvg: '23°C (Sunny & breezy)',
        nighttimeAvg: '16°C (Mild cliffside evening)',
        rainProbability: '12% chance of quick coastal rain',
        conditions: 'Golden coastal sunshine, warm sea breezes, mild romantic evenings on cliffside terraces.',
        daylightSummary: 'Approx. 11.5 hours daylight.',
        clothingAdvice: 'Linen shirts, non-slip sandals, swimwear, sun hat, and light evening sweater.'
      },
      recommendedToBring: [
        'Grippy footwear for cliffside footpaths like Path of the Gods',
        'Motion sickness remedies if prone to nausea on winding SITA buses',
        'Light shawl or scarf to cover shoulders when visiting cathedrals',
        'Type C/L European plug adapter'
      ],
      arrivalRulesAndApps: {
        connectivityAdvice: 'EU Roaming applies for European SIMs. Non-EU travelers can use Airalo, Iliad, or TIM eSIM.',
        recommendedApps: [
          { name: 'Trenitalia / Italo', purpose: 'High-speed trains to Salerno/Naples and regional rail' },
          { name: 'Travelmar (Amalfi Ferry)', purpose: 'Coastal ferries between Salerno, Amalfi, and Positano' }
        ],
        entryRegulations: [
          'Schengen rules apply.',
          'City tourist tax of €1.50–€5 per night paid at hotel checkout.'
        ]
      },
      culturalNorms: [
        'Coffee Etiquette: Cappuccino is traditionally morning only; ordering it after dinner is considered unusual.',
        'Standing at the counter costs ~€1.20, whereas sitting at a table includes table service fee.'
      ],
      basicGreetings: [
        { phrase: 'Buongiorno / Ciao', translation: 'Good morning / Hello', phonetic: 'Bwohn-JOHR-noh / CHOW' },
        { phrase: 'Grazie mille', translation: 'Thank you very much', phonetic: 'GRAHT-tsyeh MEEL-leh' },
        { phrase: 'Il conto, per favore', translation: 'The bill, please', phonetic: 'Eel KOHN-toh pehr fah-VOH-reh' }
      ],
      culturalShocks: [
        {
          title: 'SITA Cliffside Bus Crowds',
          description: 'During peak months, SITA buses along the Amalfi drive fill to capacity quickly.',
          tip: 'Opt for the Travelmar coastal ferry whenever possible—it is fast, scenic, and avoids road congestion.'
        }
      ],
      soloSafetyAdvisories: [
        'Amalfi Coast is very safe. In major transit hubs (Napoli Centrale, Rome Termini), keep bags zipped in front.',
        'Emergency number: 112.'
      ]
    };
  }

  if (destLower.includes('mexico') || destLower.includes('oaxaca')) {
    return {
      travelerNationality,
      destinationCity: destCity || 'Oaxaca',
      destinationCountry: 'Mexico',
      visaRequirements: 'Citizens of US, Canada, EU, UK, and Japan enter visa-free for tourism up to 180 days with a valid passport.',
      specificCurrency: {
        code: 'MXN',
        name: 'Mexican Peso (MXN / $)',
        symbol: '$',
        rateBenchmark: '1 USD ≈ 19.80 MXN · 1 EUR ≈ 21.50 MXN',
        cardAcceptance: 'Cards accepted at modern cafes and hotels. CASH IS ESSENTIAL ($500–$1,000 MXN in small bills) for food markets, artisan mezcalerías, street tacos, and colectivos.',
        tippingRules: 'La propina (tip) is expected in sit-down restaurants: 10%–15% is standard for good table service.'
      },
      weatherOutlook: {
        cityName: `${destCity} Central Highlands Climate`,
        seasonPeriod: 'Dry Golden Highland Season',
        temperatureRange: '12°C – 28°C (54°F – 82°F)',
        daytimeAvg: '26°C (Sun-drenched, clear blue skies)',
        nighttimeAvg: '13°C (Brisk mountain cool)',
        rainProbability: '8% chance of brief afternoon cloud',
        conditions: 'Warm daytime sun in the valley, low humidity, crisp refreshing evenings requiring a light sweater.',
        daylightSummary: 'Approx. 11.5 hours daylight.',
        clothingAdvice: 'Breathable daytime cottons, walking shoes for cobblestones, sun hat, and warm evening jacket.'
      },
      recommendedToBring: [
        'Dedicated cash pouch with small denominations for market stalls',
        'Sturdy flat walking shoes for uneven stone alleys and pyramid steps at Monte Albán',
        'Type A/B 2-pin or 3-pin plug (same as US/Canada 127V 60Hz)'
      ],
      arrivalRulesAndApps: {
        connectivityAdvice: 'Telcel SIM cards offer the best coverage throughout Oaxaca. Purchase at OXXO or use Airalo eSIM.',
        recommendedApps: [
          { name: 'DiDi / Uber', purpose: 'Safe city transit and estimated fares' },
          { name: 'Ado Móvil', purpose: 'Booking comfortable long-distance ADO buses between cities' }
        ],
        entryRegulations: [
          'Digital FMM immigration system is now automatic at major airports.',
          'Never drink unfiltered tap water; only drink bottled or purified water (agua purificada).'
        ]
      },
      culturalNorms: [
        'Polite Courtesy: Always say "Buenas días" or "Buenas tardes" when stepping into any shop or taxi.',
        'Saying "Provecho" (Enjoy your meal) to fellow diners when entering or leaving dining areas is deeply polite.'
      ],
      basicGreetings: [
        { phrase: '¡Hola, buenas tardes!', translation: 'Hello, good afternoon!', phonetic: 'OH-lah BWAY-nahs TAHR-dehs' },
        { phrase: 'Muchas gracias', translation: 'Thank you very much', phonetic: 'MOO-chahs GRAH-syahs' },
        { phrase: 'La cuenta, por favor', translation: 'The bill, please', phonetic: 'Lah KWEN-tah pohr fah-VOHR' }
      ],
      culturalShocks: [
        {
          title: 'Lively Smoke Alleys (Pasillo de Humo)',
          description: 'Oaxaca’s Mercado 20 de Noviembre features an intense meat-grilling aisle filled with sizzling tasajo and cecina smoke.',
          tip: 'Grab a table, order your choice of grilled meat by weight, and buy fresh tortillas from passing market ladies.'
        }
      ],
      soloSafetyAdvisories: [
        'Oaxaca City historic center is welcoming and safe for solo travelers. Stick to well-lit blocks around Santo Domingo at night.',
        'Emergency number: 911.'
      ]
    };
  }

  // Global Currency Detection for ANY other country (never defaults to JPY)
  const isUK = destLower.includes('uk') || destLower.includes('london') || destLower.includes('england');
  const isSwitzerland = destLower.includes('swiss') || destLower.includes('switzerland') || destLower.includes('zurich');
  const isKorea = destLower.includes('korea') || destLower.includes('seoul');
  const isThailand = destLower.includes('thailand') || destLower.includes('bangkok');
  const isAustralia = destLower.includes('australia') || destLower.includes('sydney');
  const isCanada = destLower.includes('canada') || destLower.includes('vancouver');
  const isVietnam = destLower.includes('vietnam') || destLower.includes('hanoi');
  const isIndonesia = destLower.includes('indonesia') || destLower.includes('bali');

  const currCode = isUK ? 'GBP' : isSwitzerland ? 'CHF' : isKorea ? 'KRW' : isThailand ? 'THB' : isAustralia ? 'AUD' : isCanada ? 'CAD' : isVietnam ? 'VND' : isIndonesia ? 'IDR' : destLower.includes('europe') || destLower.includes('france') || destLower.includes('germany') || destLower.includes('greece') ? 'EUR' : 'USD';
  const currSymbol = isUK ? '£' : isSwitzerland ? 'Fr.' : isKorea ? '₩' : isThailand ? '฿' : isVietnam ? '₫' : isIndonesia ? 'Rp' : currCode === 'EUR' ? '€' : '$';

  return {
    travelerNationality,
    destinationCity: destCity,
    destinationCountry: destCountry,
    visaRequirements: `Entry advisory for ${travelerNationality} passport holders: Verify passport has at least 6 months validity. Most tourism stays permit visa-free or eVisa access up to 30–90 days.`,
    specificCurrency: {
      code: currCode,
      name: `${currCode} Official Currency (${currSymbol})`,
      symbol: currSymbol,
      rateBenchmark: `Check current forex conversion for ${currCode}`,
      cardAcceptance: 'Major international cards (Visa/Mastercard) accepted in urban establishments. Carry modest local currency cash for transit, markets, and regional vendors.',
      tippingRules: currCode === 'EUR' ? 'Service included; rounding up is customary.' : currCode === 'USD' ? '15-20% standard tipping for table service.' : 'Tipping is optional or not customary in local culture.'
    },
    weatherOutlook: {
      cityName: `${destCity} Local Climate Outlook`,
      seasonPeriod: 'Travel Window Weather Trends',
      temperatureRange: '16°C – 25°C (60°F – 77°F)',
      daytimeAvg: '22°C (Pleasant strolling weather)',
      nighttimeAvg: '15°C (Cool & comfortable)',
      rainProbability: '18% chance of light showers',
      conditions: 'Moderate seasonal weather with clear daytime hours, good visibility for sightseeing, and refreshing evenings.',
      daylightSummary: 'Approx. 11 hours of natural daylight.',
      clothingAdvice: 'Wear comfortable layered clothing, broken-in walking shoes, and carry a compact light windbreaker or rain shell.'
    },
    recommendedToBring: [
      'Universal travel power adapter with USB-C surge protection',
      'Comfortable broken-in walking shoes suitable for all-day exploring',
      'Compact power bank to maintain phone navigation throughout the day',
      'Refillable travel water bottle and lightweight daypack'
    ],
    arrivalRulesAndApps: {
      connectivityAdvice: `Ensure international roaming is enabled or set up an international eSIM before departure for continuous map guidance.`,
      recommendedApps: [
        { name: 'Google Maps / Citymapper', purpose: 'Offline navigation, walking routes, and public transit schedules' },
        { name: 'Local Rideshare / Taxi App', purpose: 'Reliable on-demand transport with fixed upfront fares' }
      ],
      entryRegulations: [
        'Keep passport accessible and carry digital copies stored securely offline.',
        'Review duty-free allowances and customs agricultural restrictions before landing.'
      ]
    },
    culturalNorms: [
      'Learn basic local polite phrases: greeting shopkeepers and servers respectfully sets a warm tone everywhere.',
      'Respect local sanctuary and cultural site dress codes by dressing modestly when entering religious sites.'
    ],
    basicGreetings: [
      { phrase: 'Hello / Good day', translation: 'Greeting', phonetic: 'Heh-loh' },
      { phrase: 'Thank you', translation: 'Appreciation', phonetic: 'Thank-yoo' }
    ],
    culturalShocks: [
      {
        title: 'Local Rhythm & Opening Hours',
        description: 'Store hours, dining times, and Sunday closures vary by country and region.',
        tip: 'Check venue opening hours in advance on maps or local tourism portals.'
      }
    ],
    soloSafetyAdvisories: [
      'Save local emergency contact numbers and the location of your home country\'s embassy in your notes.',
      'Always arrange to meet new travel companions in prominent, public, well-lit spaces during daylight hours.'
    ]
  };
}


export async function generateCompanionIcebreakers(
  currentUser: SoloTraveler,
  matchUser: SoloTraveler,
  destination: string,
  sharedInterests: string[],
  tripScope: string = 'Flexible'
): Promise<string[]> {
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert travel companion coordinator for solo travelers.
Solo traveler A: ${currentUser.name} (Interests: ${currentUser.interests.join(', ')}, Pace: ${currentUser.travelPace}).
Solo traveler B: ${matchUser.name} (Interests: ${matchUser.interests.join(', ')}, Pace: ${matchUser.travelPace}).
Destination: ${destination}.
Travel together scope: ${tripScope} (same trip or part of the trip).
Shared interests: ${sharedInterests.join(', ')}.

Generate 3 friendly, natural, respectful conversation starter messages for Solo Traveler A to reach out to Solo Traveler B to propose traveling together for either the full trip or a portion of it.
Return exactly 3 lines, each line starting with a bullet or number, under 30 words each.`
      });
      const text = response.text || '';
      const lines = text
        .split('\n')
        .map(l => l.replace(/^[-*0-9.)\s]+/, '').trim())
        .filter(l => l.length > 10);
      if (lines.length >= 2) {
        return lines.slice(0, 3);
      }
    } catch (e) {
      console.warn('Gemini icebreaker fallback triggered:', e);
    }
  }

  // High-fidelity fallback
  const firstInterest = sharedInterests[0] || 'exploring the area';
  const secondInterest = sharedInterests[1] || 'finding local food';
  return [
    `Hey ${matchUser.name}! I noticed we're both traveling to ${destination.split(',')[0]} and keen on ${firstInterest}. Would you be interested in traveling together or joining forces for part of the trip?`,
    `Hi ${matchUser.name}! Saw your upcoming trip to ${destination.split(',')[0]}. I'm looking for a travel buddy for ${secondInterest} and exploring together—let me know if you want to connect!`,
    `Heading to ${destination.split(',')[0]} too! Whether you're looking for someone for the whole trip or just certain days to split transport and meals, I'd love to chat!`
  ];
}

export async function generateJointTripPlan(
  destination: string,
  traveler1: SoloTraveler,
  traveler2: SoloTraveler,
  daysCount: number
): Promise<{ title: string; summary: string; days: { day: string; morning: string; afternoon: string; evening: string; sharedCostEstimate: string }[] }> {
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a smart ${daysCount}-day balanced joint trip itinerary for two solo travelers exploring ${destination} together (full trip or part of trip).
Traveler 1: ${traveler1.name} (${traveler1.interests.slice(0, 3).join(', ')})
Traveler 2: ${traveler2.name} (${traveler2.interests.slice(0, 3).join(', ')})

Respond in strict JSON with the following structure:
{
  "title": "Concise theme title",
  "summary": "1-2 sentence overview of how this joint trip itinerary balances togetherness and travel flexibility",
  "days": [
    {
      "day": "Day 1: [Theme]",
      "morning": "Shared morning activity and meeting point",
      "afternoon": "Sightseeing or flexible exploration together",
      "evening": "Shared group dinner or sunset viewpoint",
      "sharedCostEstimate": "$XX per person saved by sharing transport/meals"
    }
  ]
}`
      });

      const raw = response.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.days && Array.isArray(parsed.days)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Gemini itinerary fallback triggered:', e);
    }
  }

  // High-fidelity fallback
  return {
    title: `${destination.split(',')[0]} Joint Explorer Itinerary`,
    summary: `Curated for solo travelers who want to explore together for the entire trip or team up for key days and shared costs.`,
    days: [
      {
        day: 'Day 1: Arrival & Local Food Exploration',
        morning: `Meet up at a central landmark cafe to get acquainted and map out joint highlights.`,
        afternoon: `Stroll through historic quarters, visiting local artisan markets and scenic viewpoints.`,
        evening: `Shared dinner at a lively traditional restaurant to sample regional specialties together.`,
        sharedCostEstimate: `$35 saved via split tasting dishes`
      },
      {
        day: 'Day 2: Day Trip & Scenic Excursion',
        morning: `Head out together via shared rental car or taxi to scenic countryside trails and landmarks.`,
        afternoon: `Explore nature trails and historic sites at a relaxed shared pace.`,
        evening: `Casual sunset drinks by the water, recapping the day's adventures.`,
        sharedCostEstimate: `$55 saved via shared vehicle & fuel`
      }
    ]
  };
}

export async function generateSafeMeetingGuide(destination: string, activityName: string): Promise<{
  safePublicSpot: string;
  transitTip: string;
  soloTravelerPledge: string;
}> {
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Suggest a verified, highly-visible public meetup point and solo traveler safety tip for:
Destination: ${destination}
Activity: ${activityName}

Return strict JSON:
{
  "safePublicSpot": "Specific well-lit landmark, station exit, or reputable public cafe",
  "transitTip": "Public transport advice to reach it safely",
  "soloTravelerPledge": "Key safety recommendation for meeting a new travel companion"
}`
      });
      const raw = response.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Gemini safety guide fallback triggered:', e);
    }
  }

  return {
    safePublicSpot: `Main Central Train Station North Ticket Concourse or Major Plaza Coffee Roaster with public seating`,
    transitTip: `Arrive via official city metro or daylight bus line; save offline maps on your device before heading out.`,
    soloTravelerPledge: `Always meet in a daylight public place first. Share your live check-in link with an emergency contact back home.`
  };
}
