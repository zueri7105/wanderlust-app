/**
 * World city index — maps major cities to their country so free-text searches
 * like "barcelon" resolve to "Barcelona, Spain". Not rendered directly; it
 * powers the destination search boxes across the app.
 */

export interface CityEntry {
  city: string;
  country: string;
}

/** Major cities per country (capitals + top travel cities). */
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Japan: ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Sapporo', 'Nara', 'Fukuoka', 'Yokohama', 'Kanazawa', 'Nagoya', 'Kobe', 'Nikko', 'Hakone', 'Okinawa', 'Naha'],
  China: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Xi\'an', 'Hangzhou', 'Guilin', 'Chongqing', 'Suzhou', 'Nanjing', 'Kunming', 'Lhasa', 'Harbin', 'Qingdao', 'Xiamen', 'Hong Kong', 'Macau'],
  'South Korea': ['Seoul', 'Busan', 'Jeju', 'Incheon', 'Gyeongju', 'Daegu', 'Suwon', 'Jeonju'],
  Thailand: ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Pattaya', 'Ayutthaya', 'Chiang Rai', 'Koh Samui', 'Hua Hin', 'Pai', 'Sukhothai'],
  Vietnam: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hoi An', 'Hue', 'Nha Trang', 'Da Lat', 'Sapa', 'Ha Long', 'Phu Quoc', 'Can Tho'],
  Indonesia: ['Jakarta', 'Bali', 'Denpasar', 'Ubud', 'Yogyakarta', 'Surabaya', 'Bandung', 'Lombok', 'Seminyak', 'Canggu', 'Medan', 'Batam'],
  Malaysia: ['Kuala Lumpur', 'Penang', 'George Town', 'Langkawi', 'Malacca', 'Johor Bahru', 'Kota Kinabalu', 'Kuching', 'Ipoh', 'Cameron Highlands'],
  Singapore: ['Singapore'],
  Philippines: ['Manila', 'Cebu', 'Boracay', 'Palawan', 'El Nido', 'Bohol', 'Siargao', 'Davao', 'Baguio', 'Coron', 'Vigan'],
  India: ['New Delhi', 'Mumbai', 'Jaipur', 'Agra', 'Varanasi', 'Goa', 'Kerala', 'Kochi', 'Udaipur', 'Jodhpur', 'Rishikesh', 'Amritsar', 'Kolkata', 'Bangalore', 'Chennai', 'Hampi', 'Pushkar', 'Leh'],
  'Sri Lanka': ['Colombo', 'Kandy', 'Galle', 'Ella', 'Sigiriya', 'Nuwara Eliya', 'Mirissa', 'Trincomalee'],
  Nepal: ['Kathmandu', 'Pokhara', 'Bhaktapur', 'Chitwan', 'Lumbini'],
  Bhutan: ['Thimphu', 'Paro', 'Punakha'],
  Maldives: ['Malé', 'Maafushi', 'Hulhumalé'],
  Cambodia: ['Siem Reap', 'Phnom Penh', 'Sihanoukville', 'Battambang', 'Kampot'],
  Laos: ['Luang Prabang', 'Vientiane', 'Vang Vieng', 'Pakse'],
  Myanmar: ['Yangon', 'Bagan', 'Mandalay', 'Inle Lake', 'Ngapali'],
  Taiwan: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hualien', 'Jiufen'],
  Mongolia: ['Ulaanbaatar', 'Karakorum'],
  Kazakhstan: ['Almaty', 'Astana', 'Shymkent'],
  Uzbekistan: ['Tashkent', 'Samarkand', 'Bukhara', 'Khiva'],
  Kyrgyzstan: ['Bishkek', 'Osh', 'Karakol'],
  Tajikistan: ['Dushanbe', 'Khujand'],
  Turkmenistan: ['Ashgabat'],
  Georgia: ['Tbilisi', 'Batumi', 'Kutaisi', 'Kazbegi'],
  Armenia: ['Yerevan', 'Gyumri', 'Dilijan'],
  Azerbaijan: ['Baku', 'Gabala', 'Sheki'],
  Turkey: ['Istanbul', 'Cappadocia', 'Antalya', 'Izmir', 'Ankara', 'Bodrum', 'Pamukkale', 'Ephesus', 'Fethiye', 'Göreme', 'Konya'],
  Israel: ['Jerusalem', 'Tel Aviv', 'Haifa', 'Eilat', 'Nazareth', 'Dead Sea'],
  Jordan: ['Amman', 'Petra', 'Wadi Rum', 'Aqaba', 'Jerash'],
  Lebanon: ['Beirut', 'Byblos', 'Baalbek', 'Tyre'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Fujairah'],
  Qatar: ['Doha'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'AlUla', 'Mecca', 'Medina', 'Dammam'],
  Oman: ['Muscat', 'Salalah', 'Nizwa'],
  Bahrain: ['Manama'],
  Kuwait: ['Kuwait City'],
  Iran: ['Tehran', 'Isfahan', 'Shiraz', 'Yazd', 'Tabriz'],
  Iraq: ['Baghdad', 'Erbil'],
  // Europe
  'United Kingdom': ['London', 'Edinburgh', 'Manchester', 'Liverpool', 'Bath', 'Oxford', 'Cambridge', 'York', 'Brighton', 'Bristol', 'Glasgow', 'Cardiff', 'Belfast', 'Inverness', 'Lake District', 'Cornwall'],
  Ireland: ['Dublin', 'Galway', 'Cork', 'Killarney', 'Limerick', 'Kilkenny', 'Dingle', 'Belfast'],
  France: ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux', 'Strasbourg', 'Cannes', 'Annecy', 'Toulouse', 'Montpellier', 'Chamonix', 'Avignon', 'Colmar', 'Biarritz', 'Versailles'],
  Spain: ['Madrid', 'Barcelona', 'Seville', 'Valencia', 'Granada', 'Bilbao', 'San Sebastián', 'Málaga', 'Palma de Mallorca', 'Ibiza', 'Córdoba', 'Toledo', 'Salamanca', 'Santiago de Compostela', 'Tenerife', 'Zaragoza', 'Cadiz', 'Girona'],
  Portugal: ['Lisbon', 'Porto', 'Faro', 'Sintra', 'Lagos', 'Coimbra', 'Madeira', 'Funchal', 'Évora', 'Braga', 'Albufeira', 'Azores'],
  Italy: ['Rome', 'Venice', 'Florence', 'Milan', 'Naples', 'Amalfi Coast', 'Positano', 'Cinque Terre', 'Tuscany', 'Siena', 'Bologna', 'Verona', 'Turin', 'Sicily', 'Palermo', 'Catania', 'Sardinia', 'Alghero', 'Puglia', 'Bari', 'Lake Como', 'Genoa', 'Ravello', 'Capri'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Dresden', 'Heidelberg', 'Nuremberg', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Rothenburg', 'Freiburg'],
  Netherlands: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Maastricht', 'Delft', 'Haarlem', 'Giethoorn'],
  Belgium: ['Brussels', 'Bruges', 'Ghent', 'Antwerp', 'Leuven'],
  Luxembourg: ['Luxembourg City'],
  Switzerland: ['Zurich', 'Geneva', 'Lucerne', 'Interlaken', 'Zermatt', 'Bern', 'Basel', 'Lausanne', 'Grindelwald', 'Montreux', 'Lugano', 'St. Moritz'],
  Austria: ['Vienna', 'Salzburg', 'Innsbruck', 'Hallstatt', 'Graz', 'Linz'],
  'Czech Republic': ['Prague', 'Český Krumlov', 'Brno', 'Karlovy Vary', 'Olomouc'],
  Hungary: ['Budapest', 'Debrecen', 'Szeged', 'Pécs', 'Eger'],
  Poland: ['Warsaw', 'Kraków', 'Gdańsk', 'Wrocław', 'Zakopane', 'Poznań', 'Toruń'],
  Croatia: ['Dubrovnik', 'Split', 'Zagreb', 'Hvar', 'Rovinj', 'Zadar', 'Plitvice', 'Korčula', 'Pula'],
  Greece: ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu', 'Thessaloniki', 'Naxos', 'Paros', 'Milos', 'Meteora', 'Delphi', 'Zakynthos'],
  Slovenia: ['Ljubljana', 'Lake Bled', 'Piran', 'Bohinj'],
  Slovakia: ['Bratislava', 'Košice', 'High Tatras'],
  Serbia: ['Belgrade', 'Novi Sad', 'Niš'],
  'Bosnia and Herzegovina': ['Sarajevo', 'Mostar'],
  Montenegro: ['Kotor', 'Budva', 'Podgorica', 'Durmitor'],
  'North Macedonia': ['Skopje', 'Ohrid'],
  Albania: ['Tirana', 'Sarandë', 'Berat', 'Gjirokastër', 'Ksamil', 'Shkodër'],
  Bulgaria: ['Sofia', 'Plovdiv', 'Varna', 'Veliko Tarnovo', 'Bansko'],
  Romania: ['Bucharest', 'Brașov', 'Sibiu', 'Cluj-Napoca', 'Sighișoara', 'Timișoara'],
  Moldova: ['Chișinău'],
  Ukraine: ['Kyiv', 'Lviv', 'Odesa'],
  Belarus: ['Minsk'],
  Russia: ['Moscow', 'St. Petersburg', 'Kazan', 'Sochi'],
  Estonia: ['Tallinn', 'Tartu'],
  Latvia: ['Riga', 'Jūrmala'],
  Lithuania: ['Vilnius', 'Kaunas', 'Klaipėda'],
  Finland: ['Helsinki', 'Rovaniemi', 'Tampere', 'Turku', 'Oulu'],
  Sweden: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Kiruna'],
  Norway: ['Oslo', 'Bergen', 'Tromsø', 'Stavanger', 'Trondheim', 'Geiranger', 'Lofoten'],
  Denmark: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg'],
  Iceland: ['Reykjavik', 'Akureyri', 'Vík', 'Golden Circle'],
  Malta: ['Valletta', 'Mdina', 'Sliema', 'Gozo'],
  Cyprus: ['Nicosia', 'Limassol', 'Paphos', 'Larnaca', 'Ayia Napa'],
  // Americas
  'United States': ['New York', 'Los Angeles', 'San Francisco', 'Las Vegas', 'Miami', 'Chicago', 'Orlando', 'Honolulu', 'New Orleans', 'Washington DC', 'Boston', 'Seattle', 'San Diego', 'Austin', 'Nashville', 'Denver', 'Atlanta', 'Dallas', 'Houston', 'Phoenix', 'Philadelphia', 'Portland', 'Hilo', 'Maui', 'Kansas City', 'Sarasota', 'Asheville', 'Key West', 'Charleston', 'Savannah'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Quebec City', 'Calgary', 'Banff', 'Ottawa', 'Whistler', 'Victoria', 'Niagara Falls', 'Edmonton', 'Halifax'],
  Mexico: ['Mexico City', 'Cancún', 'Oaxaca', 'Playa del Carmen', 'Tulum', 'Guadalajara', 'Puerto Vallarta', 'Mérida', 'San Miguel de Allende', 'Los Cabos', 'Toluca', 'Puebla', 'Monterrey', 'Cozumel', 'Guanajuato'],
  Guatemala: ['Guatemala City', 'Antigua', 'Lake Atitlán', 'Flores'],
  Belize: ['Belize City', 'Caye Caulker', 'San Ignacio', 'Placencia'],
  'Costa Rica': ['San José', 'La Fortuna', 'Monteverde', 'Manuel Antonio', 'Tamarindo', 'Puerto Viejo'],
  Panama: ['Panama City', 'Bocas del Toro', 'Boquete', 'San Blas'],
  Cuba: ['Havana', 'Varadero', 'Trinidad', 'Viñales'],
  Jamaica: ['Kingston', 'Montego Bay', 'Negril', 'Ocho Rios'],
  'Dominican Republic': ['Santo Domingo', 'Punta Cana', 'Puerto Plata', 'Santiago'],
  'Puerto Rico': ['San Juan', 'Ponce', 'Rincon'],
  Bahamas: ['Nassau', 'Paradise Island', 'Exuma'],
  Barbados: ['Bridgetown'],
  'Trinidad and Tobago': ['Port of Spain'],
  'Sint Maarten': ['Philipsburg', 'Maho', 'Mullet Bay'],
  Aruba: ['Oranjestad', 'Palm Beach'],
  'Cayman Islands': ['George Town'],
  Brazil: ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Florianópolis', 'Foz do Iguaçu', 'Manaus', 'Recife', 'Búzios', 'Paraty', 'Belo Horizonte'],
  Argentina: ['Buenos Aires', 'Mendoza', 'Bariloche', 'Córdoba', 'Salta', 'Ushuaia', 'El Calafate', 'Iguazú'],
  Chile: ['Santiago', 'Valparaíso', 'San Pedro de Atacama', 'Patagonia', 'Puerto Natales', 'Easter Island', 'Viña del Mar'],
  Peru: ['Lima', 'Cusco', 'Machu Picchu', 'Arequipa', 'Iquitos', 'Puno', 'Huacachina'],
  Colombia: ['Bogotá', 'Medellín', 'Cartagena', 'Cali', 'Santa Marta', 'Salento', 'Guatapé'],
  Ecuador: ['Quito', 'Guayaquil', 'Cuenca', 'Galápagos', 'Baños', 'Otavalo'],
  Bolivia: ['La Paz', 'Sucre', 'Uyuni', 'Copacabana', 'Santa Cruz'],
  Uruguay: ['Montevideo', 'Punta del Este', 'Colonia del Sacramento'],
  Paraguay: ['Asunción'],
  Venezuela: ['Caracas', 'Margarita Island'],
  // Africa
  Morocco: ['Marrakech', 'Fez', 'Casablanca', 'Chefchaouen', 'Essaouira', 'Merzouga', 'Rabat', 'Tangier', 'Agadir', 'Tetouan'],
  Egypt: ['Cairo', 'Luxor', 'Aswan', 'Sharm El Sheikh', 'Hurghada', 'Alexandria', 'Giza', 'Dahab'],
  'South Africa': ['Cape Town', 'Johannesburg', 'Durban', 'Kruger National Park', 'Pretoria', 'Stellenbosch', 'Garden Route', 'Port Elizabeth'],
  Kenya: ['Nairobi', 'Mombasa', 'Masai Mara', 'Diani Beach', 'Nakuru', 'Lamu'],
  Tanzania: ['Zanzibar', 'Dar es Salaam', 'Arusha', 'Serengeti', 'Kilimanjaro', 'Stone Town'],
  Uganda: ['Kampala', 'Entebbe', 'Jinja'],
  Rwanda: ['Kigali'],
  Ethiopia: ['Addis Ababa', 'Lalibela', 'Gondar', 'Bahir Dar'],
  Namibia: ['Windhoek', 'Swakopmund', 'Sossusvlei', 'Etosha'],
  Botswana: ['Gaborone', 'Maun', 'Okavango Delta'],
  Zambia: ['Lusaka', 'Livingstone', 'Victoria Falls'],
  Zimbabwe: ['Harare', 'Victoria Falls', 'Bulawayo'],
  Ghana: ['Accra', 'Kumasi', 'Cape Coast'],
  Nigeria: ['Lagos', 'Abuja', 'Calabar'],
  Senegal: ['Dakar', 'Saint-Louis'],
  'Ivory Coast': ['Abidjan', 'Yamoussoukro'],
  Tunisia: ['Tunis', 'Sousse', 'Hammamet', 'Sidi Bou Said'],
  Algeria: ['Algiers', 'Oran'],
  Libya: ['Tripoli'],
  Mauritius: ['Port Louis', 'Grand Baie', 'Flic en Flac', 'Le Morne'],
  Seychelles: ['Victoria', 'Mahé', 'Praslin', 'La Digue'],
  Madagascar: ['Antananarivo', 'Nosy Be'],
  Mozambique: ['Maputo', 'Tofo', 'Bazaruto'],
  Malawi: ['Lilongwe', 'Lake Malawi'],
  Cameroon: ['Yaoundé', 'Douala'],
  'Democratic Republic of the Congo': ['Kinshasa', 'Goma'],
  'Republic of the Congo': ['Brazzaville'],
  Angola: ['Luanda'],
  'Sierra Leone': ['Freetown'],
  Liberia: ['Monrovia'],
  Guinea: ['Conakry'],
  Mali: ['Bamako', 'Timbuktu'],
  'Burkina Faso': ['Ouagadougou'],
  Niger: ['Niamey'],
  Chad: ['N\'Djamena'],
  Sudan: ['Khartoum'],
  Somalia: ['Mogadishu'],
  Eritrea: ['Asmara'],
  Djibouti: ['Djibouti City'],
  'Burundi': ['Bujumbura'],
  'Eswatini': ['Mbabane'],
  'Lesotho': ['Maseru'],
  'Gambia': ['Banjul'],
  'Guinea-Bissau': ['Bissau'],
  Togo: ['Lomé'],
  Benin: ['Cotonou', 'Ouidah'],
  Gabon: ['Libreville'],
  'Equatorial Guinea': ['Malabo'],
  'Central African Republic': ['Bangui'],
  'South Sudan': ['Juba'],
  Comoros: ['Moroni'],
  'Cape Verde': ['Praia', 'Sal', 'Mindelo'],
  'São Tomé and Príncipe': ['São Tomé'],
  // Oceania
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Cairns', 'Gold Coast', 'Adelaide', 'Hobart', 'Byron Bay', 'Uluru', 'Great Barrier Reef', 'Darwin', 'Canberra'],
  'New Zealand': ['Auckland', 'Queenstown', 'Wellington', 'Christchurch', 'Rotorua', 'Wanaka', 'Taupo', 'Milford Sound', 'Franz Josef', 'Nelson'],
  Fiji: ['Suva', 'Nadi', 'Denarau', 'Yasawa Islands'],
  'Papua New Guinea': ['Port Moresby'],
  'Solomon Islands': ['Honiara'],
  Vanuatu: ['Port Vila'],
  'New Caledonia': ['Nouméa'],
  'French Polynesia': ['Papeete', 'Bora Bora', 'Moorea', 'Tahiti'],
  Samoa: ['Apia'],
  Tonga: ['Nukuʻalofa'],
  'Cook Islands': ['Rarotonga'],
  Guam: ['Hagåtña'],
  Palau: ['Koror'],
  'Marshall Islands': ['Majuro'],
  Micronesia: ['Palikir'],
  Nauru: ['Yaren'],
  Kiribati: ['Tarawa'],
  Tuvalu: ['Funafuti'],
  'Timor-Leste': ['Dili'],
  Brunei: ['Bandar Seri Begawan'],
  Afghanistan: ['Kabul'],
  Pakistan: ['Islamabad', 'Lahore', 'Karachi', 'Hunza', 'Skardu'],
  Bangladesh: ['Dhaka', 'Cox\'s Bazar', 'Chittagong'],
  Yemen: ['Sana\'a'],
  Syria: ['Damascus'],
  Greenland: ['Nuuk', 'Ilulissat'],
  Monaco: ['Monte Carlo'],
  Andorra: ['Andorra la Vella'],
  Liechtenstein: ['Vaduz'],
  'San Marino': ['San Marino'],
  'Vatican City': ['Vatican City'],
  'Dominica': ['Roseau'],
  'Grenada': ['St. George\'s'],
  'Saint Lucia': ['Castries', 'Soufrière'],
  'Saint Vincent and the Grenadines': ['Kingstown'],
  'Antigua and Barbuda': ['Saint John\'s'],
  'Saint Kitts and Nevis': ['Basseterre'],
  Haiti: ['Port-au-Prince'],
  'El Salvador': ['San Salvador', 'El Tunco'],
  Honduras: ['Tegucigalpa', 'Roatán', 'Utila'],
  Nicaragua: ['Managua', 'Granada', 'León', 'San Juan del Sur'],
  Guyana: ['Georgetown'],
  Suriname: ['Paramaribo'],
  'Mauritania': ['Nouakchott'],
  'Zambia ': []
};

/** Flat list of all city entries. */
export const CITY_INDEX: CityEntry[] = Object.entries(CITIES_BY_COUNTRY).flatMap(
  ([country, cities]) => cities.map((city) => ({ city, country }))
);

/** Normalize text for search: lowercase + strip diacritics + collapse spaces. */
export const normalizePlace = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[''`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Search cities by free text with typo tolerance.
 * Matches when the query is a prefix/substring of a city (after normalizing)
 * or when it differs by one character (insertion/deletion/substitution).
 */
export function searchCities(query: string, limit = 6): CityEntry[] {
  const q = normalizePlace(query);
  if (q.length < 2) return [];
  const scored: Array<{ e: CityEntry; score: number }> = [];
  for (const e of CITY_INDEX) {
    const cn = normalizePlace(e.city);
    let score = -1;
    if (cn === q) score = 0;
    else if (cn.startsWith(q)) score = 1;
    else if (cn.includes(q)) score = 2;
    else if (q.length >= 4 && editDistanceAtMostOne(cn, q)) score = 3;
    else {
      // country match is weaker — handled by country lists; skip here
      const countryN = normalizePlace(e.country);
      if (countryN === q) score = 4;
    }
    if (score >= 0) scored.push({ e, score });
  }
  scored.sort((a, b) => a.score - b.score || a.e.city.length - b.e.city.length);
  const seen = new Set<string>();
  const out: CityEntry[] = [];
  for (const { e } of scored) {
    const key = `${e.city}|${e.country}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

/** True when the two strings differ by at most one edit. */
function editDistanceAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    edits++;
    if (edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  if (i < a.length || j < b.length) edits++;
  return edits <= 1;
}
