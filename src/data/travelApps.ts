/**
 * Country-specific travel app recommendations — the apps locals and travelers
 * actually use in each country (ride-hailing, transit, maps, trains, payment),
 * not generic "download a transport app" advice.
 */

export interface TravelApp {
  name: string;
  purpose: string;
}

const A = (name: string, purpose: string): TravelApp => ({ name, purpose });

/** Universal apps included for every destination. */
const UNIVERSAL: TravelApp[] = [
  A('Google Maps', 'Offline maps, walking routes & transit schedules — download the area offline before you land'),
  A('Wise', 'Spend & withdraw at the real exchange rate with a multi-currency card')
];

/** Region/country-specific app packs. */
const APP_PACKS: Array<{ match: string[]; apps: TravelApp[] }> = [
  {
    match: ['japan', 'tokyo', 'kyoto', 'osaka', 'hiroshima', 'sapporo', 'nara', 'fukuoka', 'kanazawa', 'hakone', 'nikko', 'okinawa'],
    apps: [
      A('Suica / Pasmo (Mobile IC)', 'Tap-to-pay for all trains, metros & konbini — add it to Apple/Google Wallet before flying'),
      A('Japan Travel by NAVITIME', 'Exact train platform, transfer & JR-Pass route planning'),
      A('GO / S.RIDE', 'The taxi apps Japanese locals actually use (Uber has limited coverage)'),
      A('PayPay', 'QR payments accepted almost everywhere, from ramen stalls to temples')
    ]
  },
  {
    match: ['china', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu', 'xi\'an', 'hangzhou', 'chongqing', 'guilin'],
    apps: [
      A('Alipay (Tour Pass)', 'Link your foreign card — without it, many shops & metros cannot accept payment'),
      A('WeChat', 'Messaging, mini-programs & payments; essential for daily life in China'),
      A('Amap (Gaode Maps)', 'The accurate local map app — Google Maps is unreliable/blocked in China'),
      A('Trip.com', 'Book high-speed trains & domestic flights in English'),
      A('A reliable VPN (e.g. LetsVPN/Astrill)', 'Install BEFORE arrival to reach Google, WhatsApp & Instagram')
    ]
  },
  {
    match: ['south korea', 'korea', 'seoul', 'busan', 'jeju', 'incheon', 'gyeongju'],
    apps: [
      A('Naver Map', 'The map Koreans use — far more accurate than Google Maps in Korea'),
      A('Kakao T', 'Taxis & designated drivers nationwide; works with foreign cards'),
      A('Korail', 'KTX bullet-train booking & schedules'),
      A('Papago', 'Korean translation with camera mode for menus & signs')
    ]
  },
  {
    match: ['thailand', 'bangkok', 'chiang mai', 'phuket', 'krabi', 'pattaya', 'koh samui', 'pai'],
    apps: [
      A('Grab', 'Rides, food delivery & upfront prices — the SEA super-app'),
      A('Bolt', 'Usually cheaper than Grab for scooters & cars in Thai cities'),
      A('12Go', 'Ferries, night trains & buses between islands and cities'),
      A('BTS Skytrain / Bangkok MRT', 'Official metro maps & stored-value top-ups')
    ]
  },
  {
    match: ['vietnam', 'hanoi', 'ho chi minh', 'da nang', 'hoi an', 'hue', 'nha trang', 'sapa'],
    apps: [
      A('Grab', 'Bikes & cars with upfront pricing everywhere in Vietnam'),
      A('Be', 'Local ride-hailing alternative, often cheaper for scooters'),
      A('Vexere', 'Intercity sleeper buses & trains in English')
    ]
  },
  {
    match: ['indonesia', 'bali', 'jakarta', 'ubud', 'yogyakarta', 'lombok', 'canggu', 'seminyak', 'denpasar'],
    apps: [
      A('Gojek', 'Scooter rides, food & payments — the local essential'),
      A('Grab', 'Cars & scooters where Gojek coverage is thin'),
      A('Traveloka', 'Domestic flights, ferries & intercity trains'),
      A('12Go', 'Fast boats between Bali, Nusa Penida & the Gilis')
    ]
  },
  {
    match: ['malaysia', 'kuala lumpur', 'penang', 'langkawi', 'malacca', 'george town'],
    apps: [
      A('Grab', 'Rides & food across Malaysia with upfront pricing'),
      A('Touch \'n Go eWallet', 'Tolls, transit & QR payments like a local'),
      A('KTMB', 'ETS intercity train booking (KL–Penang–Ipoh)')
    ]
  },
  {
    match: ['singapore'],
    apps: [
      A('Grab', 'Rides & food; the default super-app in Singapore'),
      A('SimplyGo / EZ-Link', 'Tap your bank card or phone on all MRT & buses'),
      A('SG Buses / Citymapper', 'Real-time bus arrivals & MRT routing')
    ]
  },
  {
    match: ['philippines', 'manila', 'cebu', 'boracay', 'palawan', 'el nido', 'bohol', 'siargao'],
    apps: [
      A('Grab', 'Cars & taxis in Manila, Cebu & Davao'),
      A('Angkas', 'Motorbike taxis that beat Manila traffic'),
      A('12Go / Bookaway', 'Ferries between islands ( Cebu–Bohol–Palawan )')
    ]
  },
  {
    match: ['india', 'delhi', 'mumbai', 'jaipur', 'agra', 'goa', 'kerala', 'varanasi', 'udaipur', 'bangalore', 'kochi'],
    apps: [
      A('Uber / Ola', 'Ride-hailing in every Indian city — agree the fare in-app, never off-app'),
      A('IRCTC Rail Connect', 'Official train booking; register with your passport'),
      A('PhonePe / Google Pay (UPI)', 'QR payments accepted even at street stalls (needs Indian SIM)'),
      A('Rome2Rio', 'Piece together trains, buses & flights for long routes')
    ]
  },
  {
    match: ['sri lanka', 'colombo', 'kandy', 'galle', 'ella'],
    apps: [
      A('PickMe', 'The Sri Lankan ride-hailing app — tuk-tuks & cars with metered fares'),
      A('12Go', 'Scenic hill-country train seats (Kandy–Ella) sell out — book ahead')
    ]
  },
  {
    match: ['nepal', 'kathmandu', 'pokhara'],
    apps: [
      A('Pathao / InDrive', 'Motorbike & car rides in Kathmandu & Pokhara'),
      A('Maps.me', 'Offline trekking maps for Annapurna & Everest regions')
    ]
  },
  {
    match: ['united kingdom', 'london', 'edinburgh', 'manchester', 'liverpool', 'bath', 'oxford', 'york', 'brighton', 'glasgow'],
    apps: [
      A('Trainline', 'All UK rail tickets & live platform info in one place'),
      A('Citymapper', 'The best London transit router (Tube, bus, Overground)'),
      A('TfL Go', 'Official London Underground status & step-free routing'),
      A('Uber / Bolt / FreeNow', 'Ride-hailing in every UK city')
    ]
  },
  {
    match: ['ireland', 'dublin', 'galway', 'cork', 'killarney'],
    apps: [
      A('Free Now', 'Ireland\'s main taxi app'),
      A('TFI Live', 'Official bus, tram (Luas) & rail real-time departures'),
      A('Irish Rail', 'Intercity train booking (Dublin–Cork–Galway)')
    ]
  },
  {
    match: ['france', 'paris', 'nice', 'lyon', 'marseille', 'bordeaux', 'strasbourg', 'cannes'],
    apps: [
      A('SNCF Connect', 'TGV & regional train booking — the official French rail app'),
      A('Citymapper', 'Paris Metro, RER & bus routing with exits'),
      A('Bonjour RATP', 'Official Paris transit app with Navigo top-ups'),
      A('Uber / Bolt', 'Ride-hailing across French cities')
    ]
  },
  {
    match: ['spain', 'madrid', 'barcelona', 'seville', 'valencia', 'granada', 'bilbao', 'malaga', 'mallorca', 'palma'],
    apps: [
      A('Renfe', 'AVE high-speed & regional trains, official Spanish rail'),
      A('Omio', 'Compare Renfe vs. buses (ALSA) vs. budget flights in English'),
      A('Cabify / Uber / Bolt', 'Ride-hailing in Spanish cities'),
      A('Moovit', 'Metro & bus routing for Madrid & Barcelona')
    ]
  },
  {
    match: ['portugal', 'lisbon', 'porto', 'faro', 'sintra', 'lagos', 'madeira'],
    apps: [
      A('CP – Comboios de Portugal', 'Official train tickets (Lisbon–Porto–Algarve)'),
      A('Bolt / Uber', 'Cheap & ubiquitous rides in Lisbon & Porto'),
      A('Carris / Metropolitano', 'Lisbon tram & metro live times')
    ]
  },
  {
    match: ['italy', 'rome', 'venice', 'florence', 'milan', 'naples', 'amalfi', 'positano', 'cinque terre', 'sicily', 'bologna', 'verona'],
    apps: [
      A('Trenitalia', 'Official rail: Frecciarossa high-speed & regional trains'),
      A('Italo Treno', 'Private high-speed rail competitor — often cheaper'),
      A('Free Now / Uber', 'Licensed taxis in Rome & Milan (street hailing is fine too)'),
      A('Omio', 'Ferries to Capri, Sicily & the Amalfi Coast plus trains in one app')
    ]
  },
  {
    match: ['germany', 'berlin', 'munich', 'hamburg', 'frankfurt', 'cologne', 'dresden'],
    apps: [
      A('DB Navigator', 'Deutsche Bahn official app — every train, platform & delay'),
      A('BVG / MVV', 'City transit tickets for Berlin (BVG) & Munich (MVV) on your phone'),
      A('FlixBus / FlixTrain', 'Budget intercity travel booked in English'),
      A('Free Now / Uber', 'Ride-hailing in German cities')
    ]
  },
  {
    match: ['netherlands', 'amsterdam', 'rotterdam', 'utrecht', 'the hague'],
    apps: [
      A('NS (Nederlandse Spoorwegen)', 'Dutch rail planner & e-tickets'),
      A('9292', 'Door-to-door transit routing across the Netherlands'),
      A('GVB', 'Amsterdam tram, metro & ferry tickets')
    ]
  },
  {
    match: ['switzerland', 'zurich', 'geneva', 'lucerne', 'interlaken', 'zermatt', 'bern', 'grindelwald'],
    apps: [
      A('SBB Mobile', 'Swiss rail, cable cars & boats — the single most useful app in Switzerland'),
      A('Half Fare / Swiss Travel Pass (in SBB)', 'Load your pass for 50% off mountain railways'),
      A('MeteoSwiss', 'Hyper-local alpine weather you can actually trust')
    ]
  },
  {
    match: ['austria', 'vienna', 'salzburg', 'innsbruck', 'hallstatt'],
    apps: [
      A('ÖBB (Austrian Federal Railways)', 'Railjet tickets & seat reservations'),
      A('WienMobil', 'Vienna U-Bahn, tram & citybike in one app'),
      A('Westbahn', 'Private Vienna–Salzburg trains, often discounted')
    ]
  },
  {
    match: ['czech', 'prague', 'cesky krumlov', 'brno'],
    apps: [
      A('IDOS', 'Czech trains & buses planner (English available)'),
      A('PID Lítačka', 'Prague metro/tram tickets on your phone'),
      A('RegioJet', 'Comfortable budget trains & buses to Vienna/Budapest')
    ]
  },
  {
    match: ['hungary', 'budapest'],
    apps: [
      A('BudapestGO', 'Official metro, tram & bus tickets + route planner'),
      A('MÁV-START', 'Hungarian rail tickets'),
      A('Bolt', 'The reliable taxi app in Budapest — avoid street taxis')
    ]
  },
  {
    match: ['poland', 'warsaw', 'krakow', 'gdansk', 'wroclaw'],
    apps: [
      A('PKP Intercity', 'Polish rail tickets (EIP fast trains)'),
      A('Jakdojade', 'City transit planner locals swear by'),
      A('Bolt / Uber / Free Now', 'Cheap rides in every Polish city')
    ]
  },
  {
    match: ['croatia', 'dubrovnik', 'split', 'zagreb', 'hvar', 'zadar'],
    apps: [
      A('Jadrolinija', 'Official ferry schedules & tickets for the islands'),
      A('FlixBus / GetByBus', 'Coastal buses (Dubrovnik–Split–Zagreb)'),
      A('Uber / Bolt', 'Available in Dubrovnik, Split & Zagreb')
    ]
  },
  {
    match: ['greece', 'athens', 'santorini', 'mykonos', 'crete', 'rhodes', 'naxos', 'paros'],
    apps: [
      A('Ferryhopper', 'Compare & book every Greek island ferry in English'),
      A('Free Now / Uber (taxi)', 'Athens taxi apps — island rides are scarce, pre-book'),
      A('OASA / Athens Metro', 'Athens transit routing & tickets')
    ]
  },
  {
    match: ['turkey', 'istanbul', 'cappadocia', 'antalya', 'izmir', 'bodrum'],
    apps: [
      A('BiTaksi / Uber', 'Metered taxis in Istanbul — always use the app, never negotiate'),
      A('Istanbulkart (app)', 'Top up the transit card for metro, tram & ferries'),
      A('obilet / FlixBus', 'Intercity buses — Turkey\'s main long-distance mode'),
      A('Turkish Airlines / Pegasus', 'Cheap domestic hops (Istanbul–Cappadocia)')
    ]
  },
  {
    match: ['morocco', 'marrakech', 'fez', 'casablanca', 'chefchaouen', 'essaouira', 'rabat', 'tangier'],
    apps: [
      A('ONCF', 'Moroccan rail — Al Boraq high-speed (Tangier–Casablanca) & classic lines'),
      A('CTM / Supratours', 'The reputable intercity bus companies (book on their sites/apps)'),
      A('InDrive / Roby', 'Ride-hailing in Casablanca & Marrakech; elsewhere use petit taxis with the meter')
    ]
  },
  {
    match: ['egypt', 'cairo', 'luxor', 'aswan', 'sharm', 'hurghada', 'giza'],
    apps: [
      A('Uber / Careem / InDrive', 'Fixed-price rides in Cairo — avoid unmetered taxis'),
      A('Egyptian National Railways', 'Sleeper trains Cairo–Luxor–Aswan (book Watania sleeping cars)'),
      A('Talabat', 'Food delivery everywhere')
    ]
  },
  {
    match: ['united arab emirates', 'dubai', 'abu dhabi', 'sharjah'],
    apps: [
      A('Careem', 'The UAE super-app: rides, food & bikes'),
      A('RTA Dubai / nol', 'Metro, tram & bus times + nol card top-ups'),
      A('Uber', 'Widely available with upfront pricing')
    ]
  },
  {
    match: ['qatar', 'doha'],
    apps: [A('Uber / Karwa', 'Official taxis & ride-hailing in Doha'), A('Doha Metro & Lusail Tram', 'Official metro journey planner & tickets')]
  },
  {
    match: ['saudi', 'riyadh', 'jeddah', 'alula'],
    apps: [A('Uber / Careem', 'Ride-hailing in Saudi cities'), A('Haramain Railway', 'High-speed train Jeddah–Makkah–Madinah')]
  },
  {
    match: ['jordan', 'amman', 'petra', 'wadi rum', 'aqaba'],
    apps: [A('Uber / Careem', 'Fixed-price rides in Amman'), A('JETT Bus', 'Tourist buses Amman–Petra–Aqaba')]
  },
  {
    match: ['israel', 'tel aviv', 'jerusalem', 'haifa', 'eilat'],
    apps: [A('Gett', 'Israel\'s taxi app'), A('Moovit', 'National transit routing incl. buses & light rail'), A('Rav-Kav Online', 'Transit card top-ups')]
  },
  {
    match: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'cairns'],
    apps: [
      A('Uber / DiDi', 'Ride-hailing in all Australian cities'),
      A('Opal Travel / myki', 'Sydney (Opal) & Melbourne (myki) transit cards & planning'),
      A('TripView', 'Sydney train & ferry real-time departures')
    ]
  },
  {
    match: ['new zealand', 'auckland', 'queenstown', 'wellington', 'christchurch', 'rotorua'],
    apps: [
      A('InterCity', 'National bus network & flexible passes'),
      A('AT Mobile / Metlink / MetroInfo', 'Auckland, Wellington & Christchurch transit'),
      A('Uber / Ola', 'Ride-hailing in the main centres'),
      A('CamperMate', 'Campsites, dump stations & road-trip essentials')
    ]
  },
  {
    match: ['united states', 'usa', 'new york', 'los angeles', 'san francisco', 'las vegas', 'miami', 'chicago', 'orlando', 'hawaii', 'honolulu', 'seattle', 'boston', 'washington', 'austin', 'nashville'],
    apps: [
      A('Uber / Lyft', 'The two ride-hailing apps covering every US city'),
      A('Transit / Citymapper', 'Real-time subway & bus arrivals in NYC, SF, Chicago & DC'),
      A('Amtrak', 'Coast-to-coast & Northeast Corridor rail booking'),
      A('Turo / rental apps', 'Essential outside the big transit cities')
    ]
  },
  {
    match: ['canada', 'toronto', 'vancouver', 'montreal', 'quebec', 'calgary', 'banff'],
    apps: [
      A('Uber / Lyft', 'Ride-hailing in Canadian cities'),
      A('VIA Rail', 'Intercity trains (Toronto–Montréal–Québec)'),
      A('Transit App', 'TTC, TransLink & STM real-time departures')
    ]
  },
  {
    match: ['mexico', 'mexico city', 'cancun', 'oaxaca', 'playa del carmen', 'tulum', 'guadalajara', 'merida'],
    apps: [
      A('Uber / DiDi / InDrive', 'Fixed-price rides in Mexican cities'),
      A('ADO (app/site)', 'First-class long-distance buses (CDMX–Oaxaca–Mérida)'),
      A('Metro CDMX / Mi Pasaje', 'Mexico City metro & metrobus maps')
    ]
  },
  {
    match: ['brazil', 'rio de janeiro', 'sao paulo', 'salvador', 'florianopolis'],
    apps: [
      A('Uber / 99', 'Ride-hailing everywhere — 99 is the local favourite'),
      A('Moovit', 'Metro & bus routing in Rio & São Paulo'),
      A('Buser / ClickBus', 'Long-distance bus booking')
    ]
  },
  {
    match: ['argentina', 'buenos aires', 'mendoza', 'bariloche', 'cordoba'],
    apps: [
      A('SUBE (app)', 'Load the transit card for buses & Subte'),
      A('Uber / Cabify / DiDi', 'Ride-hailing in Buenos Aires'),
      A('Plataforma 10', 'Long-distance bus tickets nationwide')
    ]
  },
  {
    match: ['chile', 'santiago', 'valparaiso', 'atacama'],
    apps: [A('Uber / Cabify / DiDi', 'Ride-hailing in Santiago'), A('Recorrido.cl', 'Compare & book long-distance buses'), A('Red / bip!', 'Santiago metro & bus info')]
  },
  {
    match: ['peru', 'lima', 'cusco', 'machu picchu', 'arequipa'],
    apps: [
      A('PeruRail / Inca Rail', 'The only trains to Machu Picchu — book weeks ahead'),
      A('Uber / InDrive / Cabify', 'Rides in Lima & Cusco'),
      A('Cruz del Sur / RedBus', 'Intercity bus booking')
    ]
  },
  {
    match: ['colombia', 'bogota', 'medellin', 'cartagena', 'cali'],
    apps: [A('Uber / DiDi / Cabify', 'Ride-hailing in Colombian cities'), A('Metro de Medellín', 'Medellín metro & metrocable maps'), A('RedBus / PinBus', 'Intercity buses')]
  },
  {
    match: ['south africa', 'cape town', 'johannesburg', 'durban', 'kruger'],
    apps: [
      A('Uber / Bolt', 'The safe way to move around South African cities'),
      A('MyCiTi (Cape Town)', 'Cape Town\'s rapid bus network'),
      A('SANParks', 'Kruger & national park bookings and gate times')
    ]
  },
  {
    match: ['kenya', 'nairobi', 'mombasa', 'masai mara'],
    apps: [
      A('Uber / Bolt / Little', 'Ride-hailing in Nairobi & Mombasa'),
      A('M-Pesa', 'Mobile money used for EVERYTHING in Kenya — set it up on arrival'),
      A('SafariBookings', 'Compare Masai Mara safari operators')
    ]
  },
  {
    match: ['tanzania', 'zanzibar', 'dar es salaam', 'arusha', 'serengeti', 'kilimanjaro'],
    apps: [A('Uber / Bolt (Dar & Zanzibar)', 'Ride-hailing where available'), A('Azam Marine / Zan Fast Ferries', 'Dar–Zanzibar ferry booking')]
  },
  {
    match: ['iceland', 'reykjavik'],
    apps: [A('Straeto', 'Reykjavík city buses'), A('Vedur.is / 112 Iceland', 'Weather + the official safety app for road trips'), A('Parka / EasyPark', 'Pay parking at waterfalls & trailheads')]
  },
  {
    match: ['norway', 'oslo', 'bergen', 'tromso'],
    apps: [A('Vy', 'Norwegian trains & buses'), A('Entur', 'The national journey planner — trains, ferries, buses'), A('Ruter', 'Oslo transit tickets')]
  },
  {
    match: ['sweden', 'stockholm', 'gothenburg', 'malmo'],
    apps: [A('SJ', 'Swedish high-speed & regional trains'), A('SL', 'Stockholm metro, tram & ferry tickets'), A('Resrobot', 'National journey planner')]
  },
  {
    match: ['finland', 'helsinki', 'rovaniemi'],
    apps: [A('VR Matkalla', 'Finnish rail incl. the Santa Claus night train'), A('HSL', 'Helsinki tram, metro & ferry tickets')]
  },
  {
    match: ['denmark', 'copenhagen', 'aarhus'],
    apps: [A('DSB', 'Danish rail tickets & the orange ticket discounts'), A('DOT / Rejseplanen', 'Copenhagen metro, bus & harbour ferry planner')]
  },
  {
    match: ['belgium', 'brussels', 'bruges', 'ghent', 'antwerp'],
    apps: [A('SNCB/NMBS', 'Belgian rail — half-hourly trains link every city'), A('De Lijn / STIB-MIVB', 'Flanders buses & Brussels metro/tram')]
  },
  {
    match: ['luxembourg'],
    apps: [A('CFL', 'Luxembourg rail — all public transport nationwide is free, app for times')]
  },
  {
    match: ['slovenia', 'ljubljana', 'bled'],
    apps: [A('Slovenske železnice', 'Slovenian rail times'), A('Arriva / Nomago', 'Buses to Lake Bled & Bohinj')]
  },
  {
    match: ['slovakia', 'bratislava'],
    apps: [A('IDS BK', 'Bratislava transit tickets'), A('RegioJet / ZSSK', 'Trains to Vienna & the High Tatras')]
  },
  {
    match: ['serbia', 'belgrade'],
    apps: [A('CarGo / Yandex', 'Belgrade ride-hailing (Uber does not operate)'), A('Srbijavoz', 'Serbian rail incl. the Belgrade–Bar line')]
  },
  {
    match: ['albania', 'tirana', 'sarande', 'ksamil'],
    apps: [A('Gjirafa Travel / travel.al', 'Furgon & intercity bus schedules'), A('Speed Taxi / VrapOn', 'Tirana taxi apps')]
  },
  {
    match: ['montenegro', 'kotor', 'budva'],
    apps: [A('Red Taxi / Tesla Taxi', 'Podgorica & coast taxi apps'), A('Blue Line / local ferries', 'Bay of Kotor ferry times')]
  },
  {
    match: ['bosnia', 'sarajevo', 'mostar'],
    apps: [A('MojTaxi', 'Sarajevo taxi app'), A('Centrotrans / FlixBus', 'Intercity buses Sarajevo–Mostar')]
  },
  {
    match: ['romania', 'bucharest', 'brasov', 'sibiu', 'cluj'],
    apps: [A('CFR Călători', 'Romanian rail tickets'), A('Bolt / Uber', 'Cheap rides in Bucharest & Cluj'), A('24pay / STB', 'Bucharest transit tickets')]
  },
  {
    match: ['bulgaria', 'sofia', 'plovdiv', 'varna'],
    apps: [A('BDZ', 'Bulgarian rail times'), A('TaxiMe / Yellow!', 'Sofia taxi apps — avoid street hails')]
  },
  {
    match: ['estonia', 'tallinn'],
    apps: [A('Bolt', 'Born in Tallinn — the default ride app'), A('Pilet.ee', 'Tallinn transit mobile tickets')]
  },
  {
    match: ['latvia', 'riga'],
    apps: [A('Bolt', 'Ride-hailing in Riga'), A('Rīgas satiksme', 'Tram & bus tickets'), A('1188.lv', 'Intercity bus planner')]
  },
  {
    match: ['lithuania', 'vilnius', 'kaunas'],
    apps: [A('Bolt', 'Ride-hailing in Vilnius'), A('Trafi / m.Ticket', 'Vilnius transit tickets')]
  },
  {
    match: ['malta', 'valletta'],
    apps: [A('Bolt / eCabs / Uber', 'Malta ride-hailing'), A('Tallinja', 'Public bus routes & ferry times')]
  },
  {
    match: ['cyprus', 'nicosia', 'limassol', 'paphos', 'larnaca'],
    apps: [A('Bolt', 'Ride-hailing in Cyprus'), A('Cyprus Bus / Intercity', 'Bus schedules between towns')]
  },
  {
    match: ['georgia', 'tbilisi', 'batumi'],
    apps: [A('Bolt', 'Cheap rides in Tbilisi & Batumi'), A('Tkt.GE / Railway.ge', 'Georgian rail tickets incl. Tbilisi–Batumi'), A('Tbilisi Transport', 'Metro & bus card top-ups')]
  },
  {
    match: ['armenia', 'yerevan'],
    apps: [A('Yandex Go / GG', 'Yerevan ride-hailing'), A('South Caucasus Railway', 'Yerevan–Gyumri trains')]
  },
  {
    match: ['azerbaijan', 'baku'],
    apps: [A('Bolt / Uber', 'Baku ride-hailing'), A('BakuCard / Baku Metro', 'Metro & bus top-ups')]
  },
  {
    match: ['uzbekistan', 'tashkent', 'samarkand', 'bukhara'],
    apps: [A('Yandex Go', 'Ride-hailing in Tashkent & Samarkand'), A('Uzbekistan Railways (e-ticket)', 'Afrosiyob high-speed train booking')]
  },
  {
    match: ['kazakhstan', 'almaty', 'astana'],
    apps: [A('Yandex Go / InDrive', 'Ride-hailing nationwide'), A('Kazakhstan Railways (bilet.railways.kz)', 'Train tickets')]
  },
  {
    match: ['cambodia', 'siem reap', 'phnom penh'],
    apps: [A('Grab / PassApp', 'Tuk-tuks & cars with fixed fares'), A('12Go / BookMeBus', 'Buses & ferries nationwide')]
  },
  {
    match: ['laos', 'luang prabang', 'vientiane', 'vang vieng'],
    apps: [A('Loca', 'Laos\' ride-hailing app'), A('LCR Ticket', 'Laos–China Railway booking (Vientiane–Luang Prabang)')]
  },
  {
    match: ['myanmar', 'yangon', 'bagan', 'mandalay'],
    apps: [A('Grab', 'Ride-hailing in Yangon & Mandalay'), A('12Go', 'Buses & boats (Bagan–Inle)')]
  },
  {
    match: ['taiwan', 'taipei', 'kaohsiung', 'tainan', 'hualien'],
    apps: [A('Taiwan High Speed Rail (T Express)', 'HSR tickets with early-bird discounts'), A('TRA / Bus+', 'Local trains & city buses'), A('Uber / LINE Taxi', 'Ride-hailing in Taiwanese cities'), A('EasyCard (iPASS)', 'Tap on all transit & convenience stores')]
  },
  {
    match: ['hong kong'],
    apps: [A('Octopus', 'The tap card for MTR, buses, ferries & shops — add to your phone wallet'), A('MTR Mobile', 'Metro routing & first/last train times'), A('Uber / HKTaxi', 'Ride-hailing across the city')]
  },
  {
    match: ['mongolia', 'ulaanbaatar'],
    apps: [A('UB Cab', 'Ulaanbaatar taxi booking'), A('Tapatrip / UBTZ', 'Trans-Mongolian rail tickets')]
  },
  {
    match: ['maldives', 'male'],
    apps: [A('MTCC / RTL Ferry', 'Public ferries between local islands'), A('Ooredoo / Dhiraagu', 'SIM & eSIM data — resort Wi-Fi is pricey')]
  },
  {
    match: ['costa rica', 'san jose', 'la fortuna', 'monteverde', 'tamarindo'],
    apps: [A('Uber / Didi', 'Rides in San José & tourist towns'), A('12Go / Bookaway', 'Shuttle vans between beach & cloud-forest towns')]
  },
  {
    match: ['panama', 'panama city', 'bocas'],
    apps: [A('Uber / InDrive', 'Ride-hailing in Panama City'), A('Metro de Panamá / MiBus', 'Metro & bus card info')]
  },
  {
    match: ['cuba', 'havana', 'varadero', 'trinidad'],
    apps: [A('La Nave / Sube', 'Cuban ride-hailing (cash payment)'), A('Viazul', 'Tourist bus network booking'), A('Maps.me', 'Offline maps — mobile data is scarce')]
  },
  {
    match: ['jamaica', 'kingston', 'montego bay'],
    apps: [A('Knutsford Express', 'Comfortable intercity coaches'), A('Uber (Kingston)', 'Ride-hailing in the capital')]
  },
  {
    match: ['ecuador', 'quito', 'guayaquil', 'cuenca', 'galapagos'],
    apps: [A('Uber / Cabify', 'Rides in Quito & Guayaquil'), A('Metropolitan Touring / local ferries', 'Galápagos inter-island boats')]
  },
  {
    match: ['bolivia', 'la paz', 'uyuni', 'sucre'],
    apps: [A('Todo Turismo / Tickets Bolivia', 'Tourist night buses (La Paz–Uyuni)'), A('InDrive', 'Ride-hailing in La Paz')]
  },
  {
    match: ['uruguay', 'montevideo', 'punta del este'],
    apps: [A('Uber / Cabify', 'Ride-hailing in Montevideo'), A('COT / Copsa', 'Intercity buses')]
  },
  {
    match: ['ghana', 'accra', 'kumasi'],
    apps: [A('Uber / Bolt / Yango', 'Ride-hailing in Accra'), A('STC / VIP Jeoun', 'Intercity coaches')]
  },
  {
    match: ['nigeria', 'lagos', 'abuja'],
    apps: [A('Uber / Bolt', 'Ride-hailing in Lagos & Abuja — always ride via app'), A('GIG Mobility / God is Good', 'Intercity coach booking')]
  },
  {
    match: ['senegal', 'dakar'],
    apps: [A('Yango / Heetch', 'Ride-hailing in Dakar'), A('Dem Dikk / TER', 'City buses & the Dakar–Diamniadio train')]
  },
  {
    match: ['tunisia', 'tunis', 'sousse', 'hammamet'],
    apps: [A('Bolt', 'Ride-hailing in Tunis'), A('SNCFT', 'Tunis–Sousse–Sfax trains')]
  },
  {
    match: ['namibia', 'windhoek', 'swakopmund'],
    apps: [A('Intercape / Shuttle Namibia', 'Intercity shuttles — distances are huge'), A('LEO / Windhoek cabs', 'City taxis (pre-book by phone/app)')]
  },
  {
    match: ['rwanda', 'kigali'],
    apps: [A('Yego / Move (Volkswagen)', 'Kigali moto & car hailing'), A('Ritco / Volcano Express', 'Intercity buses')]
  },
  {
    match: ['uganda', 'kampala', 'entebbe', 'jinja'],
    apps: [A('SafeBoda', 'Kampala\'s trusted boda-boda (moto) app with helmets'), A('Uber / Bolt', 'Cars in Kampala & Entebbe')]
  },
  {
    match: ['ethiopia', 'addis ababa'],
    apps: [A('RIDE / Feres', 'Addis Ababa ride-hailing'), A('Ethiopian Airlines', 'Domestic hops (Lalibela, Gondar) are far faster than roads')]
  },
  {
    match: ['mauritius', 'port louis'],
    apps: [A('Yugo / taxi apps', 'Island ride-hailing'), A('MBC / bus schedules', 'Public buses cover the island')]
  },
  {
    match: ['seychelles', 'mahe', 'praslin'],
    apps: [A('Cat Cocos', 'Mahé–Praslin–La Digue ferries'), A('SPTC', 'Mahé public buses')]
  },
  {
    match: ['zambia', 'lusaka', 'livingstone'],
    apps: [A('Ulendo / Yango', 'Ride-hailing in Lusaka'), A('Mazhandu / Intercape', 'Lusaka–Livingstone coaches')]
  },
  {
    match: ['zimbabwe', 'harare', 'victoria falls'],
    apps: [A('InDrive / Vaya', 'Ride-hailing in Harare'), A('Zupco / private shuttles', 'Intercity transfers')]
  },
  {
    match: ['fiji', 'suva', 'nadi'],
    apps: [A('Awesome Adventures / South Sea Cruises', 'Yasawa & Mamanuca island boats'), A('Fiji Airways / Fiji Link', 'Inter-island flights')]
  },
  {
    match: ['new caledonia', 'noumea'],
    apps: [A('Karui / Taneo', 'Nouméa buses'), A('Betico', 'Ferry to the Isle of Pines')]
  },
  {
    match: ['french polynesia', 'tahiti', 'bora bora', 'moorea', 'papeete'],
    apps: [A('Aremiti / Terevau', 'Tahiti–Moorea ferries'), A('Air Tahiti', 'Inter-island flights (multi-island pass)')]
  }
];

/**
 * Recommended travel apps for a destination text (city or country).
 * Country-specific pack first, then universal apps — always concrete names.
 */
export function travelAppsFor(destinationText: string, limit = 5): TravelApp[] {
  const t = (destinationText || '').toLowerCase();
  for (const pack of APP_PACKS) {
    if (pack.match.some((m) => t.includes(m))) {
      return [...pack.apps, ...UNIVERSAL].slice(0, Math.max(limit, pack.apps.length));
    }
  }
  // Generic international pack (still concrete, never vague)
  return [
    A('Google Maps', 'Offline maps — download your destination area before arrival'),
    A('Rome2Rio', 'Shows every plane/train/bus/ferry option between two points with prices'),
    A('Uber / Bolt / Grab (whichever operates locally)', 'App-based rides give fixed prices & a GPS trail — search which one serves your destination before landing'),
    A('Wise', 'Multi-currency card at the real exchange rate'),
    A('GetYourGuide / Klook', 'Rated day tours & skip-the-line tickets with free cancellation')
  ].slice(0, limit);
}
