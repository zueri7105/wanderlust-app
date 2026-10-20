import {
  SoloTraveler,
  TravelTrip,
  TravelActivity,
  ExpenseItem,
  ChatMessage,
  SafeCheckinRecord,
  SoloPersonalExpense,
  TravelItinerary
} from '../types/travel';

export const CURRENT_USER: SoloTraveler = {
  id: 'user_elena',
  name: 'Elena Rostova',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  age: 28,
  gender: 'female',
  homeCity: 'Berlin',
  country: 'Germany',
  bio: 'Freelance UX designer traveling across East Asia and Southern Europe. Love early morning temple strolls, specialty pour-overs, and pairing up with fellow solo travelers for road trips, shared dining, or entire journeys.',
    travelGoals: ['Dawn photography walks', 'Shared local dinners', 'Split cabs to temples'],
  languages: ['English', 'German', 'Conversational Japanese'],
  travelPace: 'Moderate Explorer',
  budgetTier: '$$',
  interests: ['Photography', 'Architecture', 'Street Food', 'Day Hikes', 'Local Markets', 'Cafes'],
  emergencyContactLinked: true,
  soloTripsCount: 14,
  safetyRating: 4.96,
  vouchedByCount: 22,
  currentDestination: 'Kyoto, Japan'
};

export const INITIAL_TRAVELERS: SoloTraveler[] = [
  CURRENT_USER,
  {
    id: 'user_kenji',
    name: 'Kenji Sato',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    age: 31,
    gender: 'male',
    homeCity: 'Tokyo',
    country: 'Japan',
    bio: 'Software engineer & amateur alpine photographer. Heading to Kyoto for autumn colors. Open to joining for part of the trip or teaming up for full days of mountain treks and hidden soba spots.',
    travelGoals: ['Alpine photo hikes', 'Hidden soba spots', 'Scenic drive co-pilot'],
    languages: ['Japanese', 'English'],
    travelPace: 'Moderate Explorer',
    budgetTier: '$$',
    interests: ['Photography', 'Hiking', 'Temple Architecture', 'Local Soba', 'Scenic Drives'],
    emergencyContactLinked: true,
    soloTripsCount: 19,
    safetyRating: 4.98,
    vouchedByCount: 31,
    currentDestination: 'Kyoto, Japan',
    isStarred: true,
    isConfirmedBuddy: true,
    reviews: [
      {
        id: 'rev_k1',
        reviewerId: 'user_elena',
        reviewerName: 'Elena Rostova',
        reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        travelerId: 'user_kenji',
        rating: 5,
        comment: 'Kenji was an exceptional travel companion on the Fushimi Inari and Arashiyama trails! Super respectful, punctual, and split all taxi & food expenses on time.',
        date: 'Oct 2026',
        destinationVisited: 'Kyoto, Japan'
      },
      {
        id: 'rev_k2',
        reviewerId: 'user_sarah',
        reviewerName: 'Sarah Jenkins',
        reviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
        travelerId: 'user_kenji',
        rating: 5,
        comment: 'Great eye for photography and knows the best quiet soba places away from tourist lines. Highly recommended companion!',
        date: 'Sep 2026',
        destinationVisited: 'Kyoto, Japan'
      }
    ]
  },
  {
    id: 'user_sarah',
    name: 'Sarah Jenkins',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    age: 27,
    gender: 'female',
    homeCity: 'Melbourne',
    country: 'Australia',
    bio: 'Solo female explorer & landscape painter. In Kyoto for tranquil morning temple walks, tea ceremonies, and bamboo grove sketches. Seeking fellow women solo travelers for day excursions.',
    travelGoals: ['Temple walks at dawn', 'Tea ceremony partner', 'Women-only day trips'],
    languages: ['English', 'Basic Japanese'],
    travelPace: 'Chill & Scenic',
    budgetTier: '$$',
    interests: ['Photography', 'Architecture', 'Cafes', 'Day Hikes', 'Artisan Crafts'],
    emergencyContactLinked: true,
    soloTripsCount: 12,
    safetyRating: 4.97,
    vouchedByCount: 24,
    currentDestination: 'Kyoto, Japan',
    isStarred: true,
    reviews: [
      {
        id: 'rev_s1',
        reviewerId: 'user_maya',
        reviewerName: 'Maya Chen',
        reviewerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
        travelerId: 'user_sarah',
        rating: 5,
        comment: 'Sarah is so wonderful to travel with! Very mindful of safety, super friendly, and made me feel so comfortable exploring as a solo woman.',
        date: 'Aug 2026',
        destinationVisited: 'Kyoto, Japan'
      }
    ]
  },
  {
    id: 'user_maya',
    name: 'Maya Chen',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    age: 26,
    gender: 'female',
    homeCity: 'Vancouver',
    country: 'Canada',
    bio: 'Culinary writer on a solo deep-dive into Oaxaca gastronomy. Looking for female or friendly solo travel buddies to explore together for the entire week or meet up for market crawls and mole tastings.',
    travelGoals: ['Market crawls', 'Mole tasting tour', 'Full-week food buddy'],
    languages: ['English', 'Spanish'],
    travelPace: 'Chill & Scenic',
    budgetTier: '$$',
    interests: ['Street Food', 'Cooking Classes', 'Markets', 'Mezcal', 'Artisan Textiles'],
    emergencyContactLinked: true,
    soloTripsCount: 9,
    safetyRating: 4.92,
    vouchedByCount: 18,
    currentDestination: 'Oaxaca, Mexico',
    isStarred: false
  },
  {
    id: 'user_marcos',
    name: 'Marcos Delgado',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    age: 33,
    gender: 'male',
    homeCity: 'Guadalajara',
    country: 'Mexico',
    bio: 'Landscape architect documenting pre-Columbian ruins. Renting a car to explore natural springs and ancient sites around Oaxaca. Seeking travel partners for the full road trip or individual day trips.',
    travelGoals: ['Split rental car', 'White villages route', 'Sunset viewpoints'],
    languages: ['Spanish', 'English'],
    travelPace: 'Moderate Explorer',
    budgetTier: '$',
    interests: ['Archaeology', 'Day Hikes', 'Local Markets', 'Photography', 'Roadtrips'],
    emergencyContactLinked: true,
    soloTripsCount: 16,
    safetyRating: 5.0,
    vouchedByCount: 27,
    currentDestination: 'Oaxaca, Mexico',
    isStarred: false
  },
  {
    id: 'user_clara',
    name: 'Clara Moreau',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    age: 29,
    gender: 'female',
    homeCity: 'Lyon',
    country: 'France',
    bio: 'Freelance illustrator spending a week exploring the Amalfi Coast and Capri. Seeking fellow solo female travelers or companions to team up for the whole coastal journey or split a private vintage wooden boat charter.',
    travelGoals: ['Tapas crawl partner', 'Flamenco nights', 'Day trips to Ronda'],
    languages: ['French', 'English', 'Italian'],
    travelPace: 'Chill & Scenic',
    budgetTier: '$$$',
    interests: ['Sailing & Boating', 'Coastal Hikes', 'Seafood', 'Sketching', 'Sunsets'],
    emergencyContactLinked: true,
    soloTripsCount: 11,
    safetyRating: 4.95,
    vouchedByCount: 19,
    currentDestination: 'Amalfi Coast, Italy',
    isStarred: true
  },
  {
    id: 'user_lucia',
    name: 'Lucia Rossi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    age: 28,
    gender: 'female',
    homeCity: 'Milan',
    country: 'Italy',
    bio: 'Marine biologist & coastal trekker. Exploring Amalfi Coast cliff paths and hidden sea caves. Passionate about women traveling safely and independently across Southern Europe.',
    travelGoals: ['Coastal hikes', 'Boat charter share', 'Seafood dinners'],
    languages: ['Italian', 'English', 'Spanish'],
    travelPace: 'Moderate Explorer',
    budgetTier: '$$',
    interests: ['Coastal Hikes', 'Sailing & Boating', 'Photography', 'Seafood', 'Sunsets'],
    emergencyContactLinked: true,
    soloTripsCount: 15,
    safetyRating: 4.99,
    vouchedByCount: 28,
    currentDestination: 'Amalfi Coast, Italy',
    isStarred: false
  },
  {
    id: 'user_sofia',
    name: 'Sofia Morales',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    age: 26,
    gender: 'female',
    homeCity: 'Valencia',
    country: 'Spain',
    bio: 'Solo traveler & history enthusiast documenting coastal fortress walls and old town architecture. Traveling in Dubrovnik (Croatia) and Seville (Spain). Loves pairing up with other female solo travelers for tapas & rampart walks.',
    travelGoals: ['Museum mornings', 'Coffee tastings', 'Slow city strolls'],
    languages: ['Spanish', 'English', 'Croatian basics'],
    travelPace: 'Moderate Explorer',
    budgetTier: '$$',
    interests: ['Architecture', 'Photography', 'History', 'Local Markets', 'Street Food'],
    emergencyContactLinked: true,
    soloTripsCount: 13,
    safetyRating: 4.94,
    vouchedByCount: 21,
    currentDestination: 'Dubrovnik, Croatia',
    isStarred: true
  },
  {
    id: 'user_liam',
    name: 'Liam Murphy',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
    age: 30,
    gender: 'male',
    homeCity: 'Dublin',
    country: 'Ireland',
    bio: 'Trail runner & amateur geologist traveling solo in Southern Italy. Seeking a companion for the full week or for the cliffside trails and coastal dining.',
    travelGoals: ['Surf lessons', 'Beach bonfires', 'Motorbike loops'],
    languages: ['English', 'Conversational Italian'],
    travelPace: 'Brisk & Fast-Paced',
    budgetTier: '$$',
    interests: ['Trail Running', 'Coastal Hikes', 'Seafood', 'Photography', 'History'],
    emergencyContactLinked: true,
    soloTripsCount: 21,
    safetyRating: 4.97,
    vouchedByCount: 35,
    currentDestination: 'Amalfi Coast, Italy',
    isStarred: false
  },
  {
    id: 'user_amara',
    name: 'Amara Diallo',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    age: 27,
    gender: 'female',
    homeCity: 'Paris',
    country: 'France',
    bio: 'Urbanist & coffee roaster exploring Portugal. Solo traveling in Lisbon & Sintra. Open to traveling together for the whole itinerary or meeting up for palace day trips and Alfama Fado evenings.',
    travelGoals: ['Desert camp nights', 'Souk treasure hunts', 'Cooking class partner'],
    languages: ['French', 'English', 'Portuguese'],
    travelPace: 'Moderate Explorer',
    budgetTier: '$$',
    interests: ['Architecture', 'Cafes & Remote Work', 'Art Galleries', 'Scenic Drives', 'Fado'],
    emergencyContactLinked: true,
    soloTripsCount: 8,
    safetyRating: 4.89,
    vouchedByCount: 14,
    currentDestination: 'Lisbon, Portugal',
    isStarred: false
  }
];

export const INITIAL_TRIPS: TravelTrip[] = [
  {
    id: 'trip_kyoto_elena',
    travelerId: 'user_elena',
    destination: 'Kyoto, Japan',
    country: 'Japan',
    region: 'Kansai',
    coverImage: '/src/assets/images/destination_kyoto_bamboo_1792119350483.jpg',
    startDate: '2026-10-18',
    endDate: '2026-10-24',
    flexibilityDays: 1,
    tripScope: 'Flexible (Full or Part)',
    desiredPace: 'Moderate Explorer',
    budgetTier: '$$',
    interests: ['Photography', 'Architecture', 'Street Food', 'Day Hikes', 'Local Markets'],
    headline: 'Autumn in Kyoto: sunrise temples, bamboo groves & evening dining',
    description: 'Planning 6 days exploring Kyoto. Happy to travel together for the whole trip or team up for day excursions, sunrise photo walks at Fushimi Inari, and sharing banquet-style dinners.',
    plannedActivities: ['Dawn Fushimi Inari trail', 'Nishiki Market food crawl', 'Arashiyama north bamboo path', 'Pontocho alley dinner']
  },
  {
    id: 'trip_kyoto_kenji',
    travelerId: 'user_kenji',
    destination: 'Kyoto, Japan',
    country: 'Japan',
    region: 'Kansai',
    coverImage: '/src/assets/images/destination_kyoto_bamboo_1792119350483.jpg',
    startDate: '2026-10-19',
    endDate: '2026-10-23',
    flexibilityDays: 0,
    tripScope: 'Part of Trip',
    desiredPace: 'Moderate Explorer',
    budgetTier: '$$',
    interests: ['Photography', 'Hiking', 'Temple Architecture', 'Local Soba', 'Scenic Drives'],
    headline: 'Early morning temple shoots & Mount Hiei ridge hike',
    description: 'Visiting Kyoto for 4 days. Looking for a travel buddy to explore together for 1-2 days, split morning taxi fares to northern temples, and enjoy authentic soba meals.',
    plannedActivities: ['Mount Hiei ridge hike', 'Golden hour photo walk at Nanzen-ji', 'Hidden tea house in Uji']
  },
  {
    id: 'trip_oaxaca_maya',
    travelerId: 'user_maya',
    destination: 'Oaxaca, Mexico',
    country: 'Mexico',
    region: 'Oaxaca Valley',
    coverImage: '/src/assets/images/destination_oaxaca_market_1792119352389.jpg',
    startDate: '2026-10-20',
    endDate: '2026-10-27',
    flexibilityDays: 2,
    tripScope: 'Full Trip',
    desiredPace: 'Chill & Scenic',
    budgetTier: '$$',
    interests: ['Street Food', 'Cooking Classes', 'Markets', 'Mezcal', 'Artisan Textiles'],
    headline: 'Week-long Oaxaca culinary deep-dive & artisan village exploration',
    description: 'Solo food enthusiast looking for a fellow traveler to share the whole trip from start to finish, splitting meals, booking market cooking classes, and exploring weaving villages together.',
    plannedActivities: ['Central de Abastos market crawl', 'Teotitlán del Valle textile studio visit', 'Artisanal mezcal distillery tasting']
  },
  {
    id: 'trip_oaxaca_marcos',
    travelerId: 'user_marcos',
    destination: 'Oaxaca, Mexico',
    country: 'Mexico',
    region: 'Oaxaca Valley',
    coverImage: '/src/assets/images/destination_oaxaca_market_1792119352389.jpg',
    startDate: '2026-10-21',
    endDate: '2026-10-26',
    flexibilityDays: 1,
    tripScope: 'Part of Trip',
    desiredPace: 'Moderate Explorer',
    budgetTier: '$',
    interests: ['Archaeology', 'Day Hikes', 'Local Markets', 'Photography', 'Roadtrips'],
    headline: 'Hierve el Agua cliff springs & Monte Albán ruins road trip',
    description: 'Renting a car for rural ruins and natural springs outside Oaxaca City. Looking for 1-2 solo travelers to join for the 2-day road trip portion and share costs.',
    plannedActivities: ['Hierve el Agua cliff hike', 'Monte Albán archaeological site', 'Sunday Tlacolula indigenous market']
  },
  {
    id: 'trip_amalfi_clara',
    travelerId: 'user_clara',
    destination: 'Amalfi Coast, Italy',
    country: 'Italy',
    region: 'Campania',
    coverImage: '/src/assets/images/destination_amalfi_boat_1792119352021.jpg',
    startDate: '2026-10-22',
    endDate: '2026-10-28',
    flexibilityDays: 1,
    tripScope: 'Flexible (Full or Part)',
    desiredPace: 'Chill & Scenic',
    budgetTier: '$$$',
    interests: ['Sailing & Boating', 'Coastal Hikes', 'Seafood', 'Sketching', 'Sunsets'],
    headline: 'Coastal relaxation, Capri boat day & scenic clifftop villages',
    description: 'Spending a week along the coast. Open to traveling together for the entire itinerary or teaming up specifically for a private vintage wooden boat charter to Capri and sea grottos.',
    plannedActivities: ['Private skipper boat to Capri caves', 'Limoncello tasting in Ravello', 'Sunset aperitivo in Praiano']
  },
  {
    id: 'trip_amalfi_liam',
    travelerId: 'user_liam',
    destination: 'Amalfi Coast, Italy',
    country: 'Italy',
    region: 'Campania',
    coverImage: '/src/assets/images/destination_amalfi_boat_1792119352021.jpg',
    startDate: '2026-10-23',
    endDate: '2026-10-29',
    flexibilityDays: 0,
    tripScope: 'Part of Trip',
    desiredPace: 'Brisk & Fast-Paced',
    budgetTier: '$$',
    interests: ['Trail Running', 'Coastal Hikes', 'Seafood', 'Photography', 'History'],
    headline: 'Path of the Gods high cliff trek & Positano exploration',
    description: 'Looking for a hiking partner to tackle the 8km Sentiero degli Dei high cliff trail from Bomerano down to Nocelle, and celebrate with lunch afterwards.',
    plannedActivities: ['Sentiero degli Dei cliff traverse', 'Fjord of Furore beach swim', 'Positano coastal trail']
  }
];

export const INITIAL_ITINERARIES: TravelItinerary[] = [
  {
    id: 'itin_kyoto_1',
    travelerId: 'user_elena',
    destination: 'Kyoto, Japan',
    country: 'Japan',
    startDate: '2026-10-18',
    endDate: '2026-10-24',
    companionPurpose: ['Split Taxi to Temples', 'Dawn Photography Walk', 'Shared Obanzai Dinner'],
    notes: 'Prioritizing early mornings before tour buses, local soba restaurants, and scenic nature paths.',
    days: [
      {
        dayNumber: 1,
        date: '2026-10-18',
        title: 'Arrival & Gion Dusk Atmosphere',
        morningActivity: 'Check in at Machiya townhouse in Higashiyama, rest from flight.',
        afternoonActivity: 'Specialty pour-over coffee at % Arabica, walk through Yasaka Pagoda slope.',
        eveningActivity: 'Solo walk through Shirakawa canal; meet companion for dinner.',
        companionGoal: 'Open for dinner companion to share multi-course dishes in Pontocho'
      },
      {
        dayNumber: 2,
        date: '2026-10-19',
        title: 'Dawn Fushimi Inari & Uji Green Tea',
        morningActivity: '06:00 AM Dawn hike up Fushimi Inari mountain trails through torii gates.',
        afternoonActivity: 'Train to Uji, visit Byodoin Phoenix Hall and authentic matcha house.',
        eveningActivity: 'Casual ramen at Kyoto Station ramen alley; evening photo edit.',
        companionGoal: 'Companion for dawn hike photos and shared tea tasting'
      },
      {
        dayNumber: 3,
        date: '2026-10-20',
        title: 'Northern Sagano & Hidden Stone Sculptures',
        morningActivity: 'Share taxi up to Otagi Nenbutsu-ji to see 1,200 moss-covered stone arhats.',
        afternoonActivity: 'Walk down preserved Saga-Toriimoto street; explore bamboo groves.',
        eveningActivity: 'Traditional hot bath (sento) and quiet solo reading time.',
        companionGoal: 'Split taxi fare ~¥5,400 to Northern Arashiyama'
      },
      {
        dayNumber: 4,
        date: '2026-10-21',
        title: 'Philosopher\'s Path & Craft Markets',
        morningActivity: 'Morning stroll along the stone path by the canal from Ginkaku-ji.',
        afternoonActivity: 'Explore antique shops, pottery studios, and Nishiki Food Market.',
        eveningActivity: 'Sunset over Kamogawa River banks with local craft beer.',
        companionGoal: 'Companion for food market sampling crawl'
      }
    ],
    travelGuide: {
      travelerNationality: 'Germany',
      destinationCity: 'Kyoto',
      destinationCountry: 'Japan',
      visaRequirements: 'German citizens enjoy Visa-Free entry for temporary tourism stays up to 90 days. Passport must be valid for the duration of stay. Complete Visit Japan Web for digital customs QR clearance.',
      specificCurrency: {
        code: 'JPY',
        name: 'Japanese Yen',
        symbol: '¥',
        rateBenchmark: '1 USD ≈ ¥152.00 | 1 EUR ≈ ¥165.50',
        cardAcceptance: 'Credit cards and digital IC cards (Suica/Pasmo) accepted at stations, chain stores, and convenience stores. However, ¥10,000–¥20,000 cash is essential for historic shrines, temple entrance fees, bus coin boxes, and traditional soba shops.',
        tippingRules: 'Strictly zero tipping. Leaving extra money on the counter causes confusion, and staff may chase you down to return it. Polite thanks ("Gochisousama deshita") is the proper appreciation.'
      },
      weatherOutlook: {
        cityName: 'Kyoto City (Basin microclimate)',
        seasonPeriod: 'Mid-to-Late October (Autumn Transition)',
        temperatureRange: '13°C – 22°C (55°F – 72°F)',
        daytimeAvg: '20°C (Comfortable & sunny)',
        nighttimeAvg: '13°C (Crisp & brisk chill)',
        rainProbability: '18% chance of light showers (mostly dry and crisp)',
        conditions: 'Clear autumn skies, vibrant early golden foliage, calm basin air with noticeable morning/dusk chill.',
        daylightSummary: 'Sunrise 06:05 AM · Sunset 05:18 PM (approx. 11 hours daylight).',
        clothingAdvice: 'Pack breathable light layers for daytime walking, paired with a packable down vest or warm fleece jacket for dawn temple walks (06:00 AM) and evening canal strolls.'
      },
      recommendedToBring: [
        'Slip-on comfortable walking shoes (frequent shoe removal required at shrines, ryokans, and tatami dining)',
        'Compact packable down jacket or windbreaker for brisk early morning temple shoots',
        'Dedicated Japanese Yen coin pouch (essential for heavy 100/500 yen coins at transit and vending)',
        'Pocket WiFi or local travel eSIM for offline Google Maps navigation in historic alleys',
        'Type A two-prong ungrounded plug adapter (100V compatibility)'
      ],
      arrivalRulesAndApps: {
        connectivityAdvice: 'Set up an eSIM (e.g. Ubigi or Airalo) or pick up a pocket WiFi at Kansai/Narita Airport. Download Google Maps offline areas for Kyoto city center.',
        recommendedApps: [
          { name: 'Visit Japan Web', purpose: 'Digital immigration & customs declarations QR codes before arrival' },
          { name: 'Suica / Pasmo (Apple Wallet)', purpose: 'Tap-to-pay on subways, city buses, and vending machines' },
          { name: 'Japan Travel by NAVITIME', purpose: 'Transit route planner with JR Pass filtering & platform numbers' }
        ],
        entryRegulations: [
          'Complete Visit Japan Web declaration online 24-48 hours before landing for fast immigration QR clearance.',
          'Strict customs: zero tolerance for certain cold/allergy medications containing pseudoephedrine or codeine without yakkan shoumei certificate.',
          'Keep your physical passport with you at all times; Japanese law requires foreigners to carry ID.'
        ]
      },
      culturalNorms: [
        'Strictly avoid walking while eating street food; finish snacks near the vendor stall where disposal bins are provided.',
        'Silence mobile phones (Manner Mode) on trains and subways; speaking loudly or taking voice calls on public transit is taboo.',
        'Escalator etiquette in Kansai (Kyoto/Osaka): stand on the right side and walk on the left.'
      ],
      basicGreetings: [
        { phrase: 'Konnichiwa (こんにちは)', translation: 'Hello / Good afternoon', phonetic: 'kohn-nee-chee-wah' },
        { phrase: 'Arigatou gozaimasu (ありがとうございます)', translation: 'Thank you very much (polite)', phonetic: 'ah-ree-gah-toh goh-zahy-mahs' },
        { phrase: 'Sumimasen (すみません)', translation: 'Excuse me / Sorry', phonetic: 'soo-mee-mah-sen' },
        { phrase: 'Kore o kudasai (これをください)', translation: 'This one please (pointing)', phonetic: 'koh-reh oh koo-dah-sahy' }
      ],
      culturalShocks: [
        {
          title: 'Total Lack of Public Trash Cans',
          description: 'You will notice virtually zero public garbage bins on streets, a legacy of safety policies. Solo travelers must carry a small bag to hold their trash until returning to their hotel.',
          tip: 'Always slip a small plastic tote bag into your daypack for personal waste.'
        },
        {
          title: 'Pin-Drop Silence on Public Transit',
          description: 'Even packed morning Kyoto commuter trains and city buses are whisper-quiet. Commuters avoid telephone calls and headphone leakage.',
          tip: 'Switch phone to Manner Mode and refrain from talking on the phone while riding.'
        },
        {
          title: 'Tattoo Restrictions at Onsens',
          description: 'Traditional public baths and onsens frequently restrict guests with visible tattoos due to historic associations.',
          tip: 'Look for tattoo-friendly sentos (like Funaoka Onsen in Kyoto) or book private kashikiri baths.'
        }
      ],
      soloSafetyAdvisories: [
        'Japan is consistently ranked among the safest countries in the world for solo female travelers.',
        'When meeting travel companions for activities, meet outside major station ticket gates or prominent public landmarks.',
        'Emergency numbers: 110 for Police, 119 for Fire/Ambulance, #9110 for non-emergency police consultation.'
      ]
    }
  },
  {
    id: 'itin_spain_1',
    travelerId: 'user_elena',
    destination: 'Madrid & Seville, Spain',
    country: 'Spain',
    startDate: '2026-11-10',
    endDate: '2026-11-17',
    companionPurpose: ['Full Trip Companion', 'Split Rental Car to White Villages', 'Tapas Crawl Partner'],
    notes: 'Exploring Andalusian architecture, flamenco culture, and sharing tapas so we can try everything on the menu.',
    days: [
      {
        dayNumber: 1,
        date: '2026-11-10',
        title: 'Madrid Art Golden Triangle',
        morningActivity: 'Prado Museum morning entry to see Velázquez and Goya masterworks.',
        afternoonActivity: 'Walk through El Retiro Park and the glass palace.',
        eveningActivity: 'Tapas tasting crawl around La Latina and Mercado de San Miguel.',
        companionGoal: 'Companion to share 4-5 tapas dishes and vermouth'
      },
      {
        dayNumber: 2,
        date: '2026-11-11',
        title: 'High-Speed AVE Train to Seville',
        morningActivity: '09:00 AM high-speed train to Seville Santa Justa station.',
        afternoonActivity: 'Check in at historic Santa Cruz quarter hotel, explore Plaza de España.',
        eveningActivity: 'Sunset view from Las Setas rooftop wooden walkway.',
        companionGoal: 'Full trip companion exploring historic Seville'
      },
      {
        dayNumber: 3,
        date: '2026-11-12',
        title: 'White Villages (Pueblos Blancos) Road Trip',
        morningActivity: 'Pick up shared rental car and drive to Zahara de la Sierra and Ronda gorge.',
        afternoonActivity: 'Hike down to the base of Puente Nuevo bridge in Ronda.',
        eveningActivity: 'Drive back to Seville; celebratory dinner and local wine.',
        companionGoal: 'Split car rental and fuel 50/50'
      }
    ],
    travelGuide: {
      travelerNationality: 'Germany',
      destinationCity: 'Madrid & Seville',
      destinationCountry: 'Spain',
      visaRequirements: 'As an EU citizen (Germany), you enjoy Freedom of Movement with zero visa requirements; enter with a valid Personalausweis (National ID card) or Passport.',
      specificCurrency: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        rateBenchmark: '1 EUR ≈ 1.09 USD | 1 EUR ≈ 0.86 GBP',
        cardAcceptance: 'Universal contactless (Apple Pay, Google Pay, Visa/Mastercard) accepted virtually everywhere, including metro turnstiles and market stalls. Keep €15-20 cash for small church donations or remote village cafes.',
        tippingRules: 'Service charge is included by law. Rounding up to the nearest Euro on a tapas bill or leaving €1–€2 for attentive table service is normal, but high percentage tipping is not customary.'
      },
      weatherOutlook: {
        cityName: 'Seville & Madrid (Continental to Mediterranean)',
        seasonPeriod: 'Mid-November (Late Autumn)',
        temperatureRange: '10°C – 21°C (50°F – 70°F)',
        daytimeAvg: '19°C in Seville, 15°C in Madrid (Sun-drenched afternoons)',
        nighttimeAvg: '9°C (Chilly late evenings)',
        rainProbability: '22% chance of autumn rain showers',
        conditions: 'Bright sunny Andalusian afternoons with dry crisp evenings; Madrid is noticeably cooler than Seville.',
        daylightSummary: 'Sunrise 07:55 AM · Sunset 06:12 PM (approx. 10.5 hours daylight).',
        clothingAdvice: 'Wear smart layers: t-shirts or light blouses during sunny afternoons, transitioning to a tailored wool coat or denim jacket for 10:00 PM tapas dining.'
      },
      recommendedToBring: [
        'Light breathable layers (t-shirts for warm afternoons, cardigan/jacket for evenings)',
        'Sturdy broken-in walking shoes for cobblestones and castle steps',
        'Crossbody anti-theft bag with secure zippers for crowded plazas',
        'Type C/F European two-pin power adapter with multi-device USB ports',
        'Sunscreen and sunglasses for bright Andalusian daytime glare'
      ],
      arrivalRulesAndApps: {
        connectivityAdvice: 'EU Roaming applies automatically at zero extra cost on your German mobile plan. High-speed 5G is widespread across Spanish cities and Renfe trains.',
        recommendedApps: [
          { name: 'Renfe Cercanías / Renfe Viajeros', purpose: 'Digital train tickets and live track departures' },
          { name: 'Citymapper / Google Maps', purpose: 'Metro and pedestrian navigation in Madrid and Seville' },
          { name: 'TheFork (ElTenedor)', purpose: 'Reserve tables at popular tapas bars with occasional discounts' }
        ],
        entryRegulations: [
          'No border control within Schengen area.',
          'Metro de Madrid: buy a Multi Card at airport machines or tap contactless at turnstiles.',
          'Store car luggage strictly out of sight in rental car trunks when parked in white villages.'
        ]
      },
      culturalNorms: [
        'Dining times: Lunch is typically 2:00 PM – 4:00 PM, and dinner is late (rarely before 8:30 PM or 9:00 PM).',
        'Greet shopkeepers and cafe staff with "¡Hola!" or "Buenos días" upon entering.',
        'Tapas culture: ordering a drink often comes with a small complimentary bite (olives, chips, or tortilla bite).'
      ],
      basicGreetings: [
        { phrase: '¡Hola! (Hola)', translation: 'Hello / Hi', phonetic: 'OH-lah' },
        { phrase: 'Muchas gracias', translation: 'Thank you very much', phonetic: 'MOO-chahs GRAH-syahs' },
        { phrase: 'Por favor', translation: 'Please', phonetic: 'pohr fah-VOHR' },
        { phrase: 'La cuenta, por favor', translation: 'The bill / check, please', phonetic: 'lah KWEN-tah pohr fah-VOHR' }
      ],
      culturalShocks: [
        {
          title: 'Late Night Dining Schedule',
          description: 'Arriving at a restaurant at 7:00 PM for dinner usually finds empty kitchens. Most locals sit down for dinner between 9:30 PM and 10:30 PM.',
          tip: 'Adopt the local rhythm: have a late afternoon merienda (snack or coffee) around 5:30 PM to tide you over.'
        },
        {
          title: 'Afternoon Siesta Shop Closures',
          description: 'Independent boutiques and artisan shops outside major malls close between 2:00 PM and 5:00 PM in southern Spain before reopening until 8:30 PM.',
          tip: 'Plan museum visits and leisurely lunches during the early afternoon lull.'
        },
        {
          title: 'Pickpocketing in Crowded Plazas',
          description: 'Distraction techniques (asking for directions, dropped rosemary sprigs) occur in tourist choke-points like Puerta del Sol and Gran Vía.',
          tip: 'Wear crossbody bags in front and keep phones off outdoor cafe tables.'
        }
      ],
      soloSafetyAdvisories: [
        'Spain is very safe for solo travelers with bustling streets well into the night.',
        'Keep emergency number 112 saved (multilingual English, German, French dispatch).',
        'Meet travel companions in well-lit public plazas like Plaza Mayor or Plaza de España.'
      ]
    }
  }
];

export const INITIAL_SOLO_EXPENSES: SoloPersonalExpense[] = [
  {
    id: 'solo_exp_1',
    destination: 'Kyoto, Japan',
    title: 'Return Flights (Berlin BER to Osaka KIX)',
    category: 'Flights & Rail',
    amount: 860,
    currency: 'USD',
    date: '2026-10-01',
    note: 'Lufthansa / ANA economy booked 6 weeks in advance'
  },
  {
    id: 'solo_exp_2',
    destination: 'Kyoto, Japan',
    title: 'Higashiyama Boutique Ryokan (5 nights)',
    category: 'Lodging / Hotel',
    amount: 540,
    currency: 'USD',
    date: '2026-10-05',
    note: 'Traditional tatami room with garden view'
  },
  {
    id: 'solo_exp_3',
    destination: 'Kyoto, Japan',
    title: 'JR Kansai-Hiroshima Rail Pass (5 days)',
    category: 'Local Transit',
    amount: 110,
    currency: 'USD',
    date: '2026-10-10',
    note: 'Unlimited Shinkansen between Osaka, Kyoto & Hiroshima'
  },
  {
    id: 'solo_exp_4',
    destination: 'Kyoto, Japan',
    title: 'Pocket WiFi 5G Rental (Ninja WiFi)',
    category: 'Gear & Misc',
    amount: 45,
    currency: 'USD',
    date: '2026-10-12',
    note: 'Pick up at Kansai terminal 1'
  },
  {
    id: 'solo_exp_5',
    destination: 'Kyoto, Japan',
    title: 'Estimated Daily Food, Cafes & Matcha Budget',
    category: 'Daily Food & Cafes',
    amount: 280,
    currency: 'USD',
    date: '2026-10-18',
    note: 'Est. $40/day across 7 days'
  }
];

export const INITIAL_ACTIVITIES: TravelActivity[] = [
  {
    id: 'act_kyoto_inari',
    destination: 'Kyoto, Japan',
    title: 'Dawn Fushimi Inari Summit & Secret Bamboo Forest Walk',
    category: 'Adventure',
    date: '2026-10-20',
    time: '06:00 AM',
    locationName: 'Fushimi Inari Taisha (Southern Torii Path)',
    meetPointPublic: 'JR Inari Station Exit - Directly in front of the main stone lantern',
    hostId: 'user_kenji',
    participantIds: ['user_kenji', 'user_elena'],
    maxCapacity: 4,
    estimatedCostTotal: 0,
    currency: 'JPY',
    costSplitNote: 'Free entry shrine trail. Optional morning matcha & soba stop (~¥1,200/person self-pay).',
    description: 'Beat the heavy crowds! We meet at 6:00 AM at the JR station, walk up through the upper torii gates to the peaceful bamboo ridge, and grab fresh hot matcha dango after descent.',
    status: 'open'
  },
  {
    id: 'act_kyoto_taxi_ride',
    destination: 'Kyoto, Japan',
    title: 'Shared Taxi to Northern Arashiyama Hidden Temples',
    category: 'Transport & Roadtrip',
    date: '2026-10-21',
    time: '08:30 AM',
    locationName: 'Otagi Nenbutsu-ji & Sagano',
    meetPointPublic: 'JR Saga-Arashiyama Station North Exit Taxi Stand',
    hostId: 'user_elena',
    participantIds: ['user_elena', 'user_kenji'],
    maxCapacity: 3,
    estimatedCostTotal: 5400,
    currency: 'JPY',
    costSplitNote: 'Total cab fare ~¥5,400 split equally (~¥1,800/person).',
    description: 'Otagi Nenbutsu-ji has 1,200 whimsical moss-covered stone arhat statues. It is a 45-min uphill walk or a quick 10-minute taxi ride. Let’s share the cab and hike back down through the quiet bamboo groves!',
    status: 'open'
  },
  {
    id: 'act_oaxaca_hierve',
    destination: 'Oaxaca, Mexico',
    title: 'Hierve el Agua Petrified Springs & Mezcal Road Trip',
    category: 'Transport & Roadtrip',
    date: '2026-10-23',
    time: '07:30 AM',
    locationName: 'San Isidro Roaguía & Santiago Matatlán',
    meetPointPublic: 'Oaxaca Zócalo Gazebo (Plaza de la Constitución)',
    hostId: 'user_marcos',
    participantIds: ['user_marcos', 'user_maya'],
    maxCapacity: 4,
    estimatedCostTotal: 1800,
    currency: 'MXN',
    costSplitNote: 'Car rental + tolls + gas: $1,800 MXN total (~$450 MXN / $25 USD per person).',
    description: 'Avoid rigid tour buses. We will drive early to Hierve el Agua cliff-edge mineral infinity pools for a swim before mid-day heat, followed by an artisanal copper-pot mezcal tasting in Matatlán on the drive back.',
    status: 'open'
  },
  {
    id: 'act_amalfi_boat',
    destination: 'Amalfi Coast, Italy',
    title: 'Private Gozzo Boat Charter to Capri & Hidden Sea Caves',
    category: 'Culture & Sights',
    date: '2026-10-25',
    time: '09:00 AM',
    locationName: 'Amalfi Marina Grande Pier 3',
    meetPointPublic: 'Amalfi Port Harbor Master Office (Capitaneria di Porto) by Pier 3',
    hostId: 'user_clara',
    participantIds: ['user_clara', 'user_liam'],
    maxCapacity: 4,
    estimatedCostTotal: 640,
    currency: 'EUR',
    costSplitNote: '€640 total for private skipper boat, fuel, towels, and prosecco. Split 4 ways = €160 each.',
    description: 'A private classic wooden boat trip around the Faraglioni rock formations, White Grotto, Green Grotto, and swimming stop in crystal turquoise bays. Way more relaxing and authentic than packed ferry catamarans.',
    status: 'open'
  }
];

export const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp_1',
    activityId: 'act_kyoto_taxi_ride',
    destination: 'Kyoto, Japan',
    title: 'Northern Sagano Temple Jumbo Taxi',
    payerId: 'user_elena',
    amount: 5400,
    currency: 'JPY',
    splitBetweenIds: ['user_elena', 'user_kenji'],
    category: 'Transport',
    date: '2026-10-21',
    settled: false,
    receiptNote: 'Shared taxi from JR Saga-Arashiyama to Otagi Nenbutsu-ji'
  },
  {
    id: 'exp_2',
    activityId: 'act_oaxaca_hierve',
    destination: 'Oaxaca, Mexico',
    title: 'SUV Rental + Mitla Highway Tolls',
    payerId: 'user_marcos',
    amount: 1800,
    currency: 'MXN',
    splitBetweenIds: ['user_marcos', 'user_maya'],
    category: 'Rental & Fuel',
    date: '2026-10-23',
    settled: false,
    receiptNote: 'Avis Oaxaca downtown rental + 2 toll booths'
  },
  {
    id: 'exp_3',
    activityId: 'act_amalfi_boat',
    destination: 'Amalfi Coast, Italy',
    title: 'Gozzo Boat Charter Deposit',
    payerId: 'user_clara',
    amount: 320,
    currency: 'EUR',
    splitBetweenIds: ['user_clara', 'user_liam'],
    category: 'Tour / Guide',
    date: '2026-10-22',
    settled: false,
    receiptNote: '50% advance booking deposit with Amalfi Marine Tours'
  }
];

export const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  act_kyoto_inari: [
    {
      id: 'msg_1',
      threadId: 'act_kyoto_inari',
      senderId: 'user_kenji',
      text: 'Hey Elena! Thrilled to travel together for the Fushimi Inari dawn hike. 6:00 AM might sound early, but between 6 and 7:30 AM is pure magic before crowds arrive.',
      timestamp: 'Yesterday at 4:15 PM'
    },
    {
      id: 'msg_2',
      threadId: 'act_kyoto_inari',
      senderId: 'user_elena',
      text: 'Hey Kenji! Perfect timing for photography. I have my 35mm lens ready. Meeting right by the stone lantern outside JR Inari station?',
      timestamp: 'Yesterday at 4:32 PM'
    },
    {
      id: 'msg_3',
      threadId: 'act_kyoto_inari',
      senderId: 'user_kenji',
      text: 'Exactly! It is right outside the exit turnstile. Also, I know a little teahouse halfway up the mountain that opens early for tea and sweet tofu pockets.',
      timestamp: 'Yesterday at 4:38 PM'
    }
  ],
  act_kyoto_taxi_ride: [
    {
      id: 'msg_4',
      threadId: 'act_kyoto_taxi_ride',
      senderId: 'user_elena',
      text: 'Hi Kenji! Created this activity for sharing the cab up to Otagi Nenbutsu-ji so we save time before hiking back through Saga-Toriimoto street.',
      timestamp: 'Today at 09:10 AM'
    },
    {
      id: 'msg_5',
      threadId: 'act_kyoto_taxi_ride',
      senderId: 'user_kenji',
      text: 'Awesome idea! I joined. Splitting the cab makes total sense. We can meet at the Saga-Arashiyama north taxi loop.',
      timestamp: 'Today at 10:05 AM'
    }
  ],
  user_kenji: [
    {
      id: 'msg_dm_1',
      threadId: 'user_kenji',
      senderId: 'user_kenji',
      text: 'Hey Elena! Saw your Kyoto itinerary. I am also planning sunrise shoots at Nanzen-ji and Fushimi Inari. Would love to join forces for part of the trip!',
      timestamp: 'Yesterday at 3:10 PM'
    },
    {
      id: 'msg_dm_2',
      threadId: 'user_kenji',
      senderId: 'user_elena',
      text: 'Hey Kenji! That aligns perfectly with my Day 2 and Day 3 schedules. Let\'s coordinate and split the morning cab fares too.',
      timestamp: 'Yesterday at 3:45 PM'
    }
  ],
  user_clara: [
    {
      id: 'msg_dm_3',
      threadId: 'user_clara',
      senderId: 'user_clara',
      text: 'Hi Elena! Saw that you starred my profile for Italy. If your dates ever align with the Amalfi Coast or Spain, definitely reach out!',
      timestamp: '2 days ago'
    }
  ],
  act_oaxaca_hierve: [
    {
      id: 'msg_6',
      threadId: 'act_oaxaca_hierve',
      senderId: 'user_marcos',
      text: 'Hola Maya! I booked the compact SUV for Friday morning. Leaving early from the Zócalo ensures we get the natural cliff pools with no tour buses.',
      timestamp: 'Today at 11:20 AM'
    },
    {
      id: 'msg_7',
      threadId: 'act_oaxaca_hierve',
      senderId: 'user_maya',
      text: 'Brilliant Marcos! I will bring water and snacks from the 20 de Noviembre bakery for the road trip.',
      timestamp: 'Today at 11:45 AM'
    }
  ],
  act_amalfi_boat: [
    {
      id: 'msg_8',
      threadId: 'act_amalfi_boat',
      senderId: 'user_clara',
      text: 'Ciao Liam! Put down the boat deposit. Skipper says sea forecast for Saturday is calm glass water with 24°C!',
      timestamp: '2 days ago'
    },
    {
      id: 'msg_9',
      threadId: 'act_amalfi_boat',
      senderId: 'user_liam',
      text: 'Sounds unbeatable Clara! I will bring along my snorkeling mask and a few bottles of chilled local Falanghina.',
      timestamp: 'Yesterday at 2:00 PM'
    }
  ]
};

export const INITIAL_SAFETY_CHECKIN: SafeCheckinRecord = {
  emergencyContacts: [
    {
      id: 'em_1',
      name: 'Markus Rostova',
      relationship: 'Brother',
      countryCode: '+49',
      phone: '170 555 4912'
    },
    {
      id: 'em_2',
      name: 'Helga Rostova',
      relationship: 'Mother',
      countryCode: '+49',
      phone: '30 8921 4401'
    }
  ],
  activeDestination: 'Kyoto, Japan',
  lastCheckinTime: '2026-10-15 18:30 JST (Nominal)',
  shareLiveStatus: true,
  safePledgeSigned: true
};
