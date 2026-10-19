/**
 * Emergency & police phone numbers for every country — used in the Solo
 * Safety Advisories panel of each itinerary's travel guide.
 */

export interface EmergencyNumbers {
  /** Single nationwide emergency number when one exists */
  general?: string;
  police: string;
  ambulance: string;
  fire?: string;
}

const E = (police: string, ambulance: string, general?: string, fire?: string): EmergencyNumbers => ({
  police,
  ambulance,
  ...(general ? { general } : {}),
  ...(fire ? { fire } : {})
});

const EU = E('112', '112', '112');

export const EMERGENCY_NUMBERS: Record<string, EmergencyNumbers> = {
  // Europe (112 across the EU)
  Austria: EU, Belgium: EU, Bulgaria: EU, Croatia: EU, Cyprus: EU, 'Czech Republic': EU,
  Denmark: EU, Estonia: EU, Finland: EU, France: E('17', '15', '112', '18'), Germany: E('110', '112', '112'),
  Greece: E('100', '166', '112', '199'), Hungary: E('107', '104', '112', '105'), Ireland: E('999', '999', '112'),
  Italy: E('113', '118', '112', '115'), Latvia: E('110', '113', '112'), Lithuania: EU, Luxembourg: E('113', '112', '112'),
  Malta: EU, Netherlands: EU, Poland: E('997', '999', '112', '998'), Portugal: EU, Romania: EU, Slovakia: E('158', '155', '112'),
  Slovenia: E('113', '112', '112'), Spain: E('091', '061', '112'), Sweden: EU,
  'United Kingdom': E('999', '999', '999 / 112'),
  Switzerland: E('117', '144', undefined, '118'),
  Norway: E('112', '113', undefined, '110'),
  Iceland: E('112', '112', '112'),
  Albania: E('129', '127', '112'), Andorra: EU, Belarus: E('102', '103'),
  'Bosnia and Herzegovina': E('122', '124', undefined, '123'),
  Kosovo: EU, Liechtenstein: E('117', '144', '112'), Moldova: E('902', '903', '112'),
  Monaco: E('17', '15', '112'), Montenegro: E('122', '124', '112'), 'North Macedonia': E('192', '194', '112'),
  Russia: E('102', '103', '112'), 'San Marino': E('113', '118', '112'), Serbia: E('192', '194', '112'),
  Ukraine: E('102', '103', '112'), 'Vatican City': E('113', '118', '112'),
  // Asia
  Japan: E('110', '119'),
  China: E('110', '120', undefined, '119'),
  'Hong Kong': E('999', '999', '999'), Macau: E('999', '999', '999'), Taiwan: E('110', '119'),
  'South Korea': E('112', '119'), Mongolia: E('102', '103'),
  'North Korea': E('119', '119'),
  Brunei: E('993', '991'), Cambodia: E('117', '119'), Indonesia: E('110', '118 / 119', '112'),
  Laos: E('191', '195'), Malaysia: E('999', '999', '999'), Myanmar: E('199', '192'),
  Philippines: E('911', '911', '911'), Singapore: E('999', '995'),
  Thailand: E('191', '1669', '911 (tourist 1155)'), 'Timor-Leste': E('112', '110'),
  Vietnam: E('113', '115'),
  Afghanistan: E('119', '102'), Bangladesh: E('999', '999', '999'), Bhutan: E('113', '112'),
  India: E('100', '102 / 108', '112'), Maldives: E('119', '102'), Nepal: E('100', '102'),
  Pakistan: E('15', '115', '1122 (rescue)'), 'Sri Lanka': E('119', '110', '118 / 119'),
  Kazakhstan: E('102', '103', '112'), Kyrgyzstan: E('102', '103', '112'), Tajikistan: E('102', '103'),
  Turkmenistan: E('102', '103'), Uzbekistan: E('102', '103'),
  Armenia: E('102', '103', '112'), Azerbaijan: E('102', '103'), Georgia: E('112', '112', '112'),
  Bahrain: E('999', '999', '999'), Iran: E('110', '115'), Iraq: E('104', '122'),
  Israel: E('100', '101'), Jordan: E('911', '911', '911'), Kuwait: E('112', '112', '112'),
  Lebanon: E('112', '140'), Oman: E('9999', '9999'), Qatar: E('999', '999', '999'),
  'Saudi Arabia': E('999', '997', '911 (Makkah/Riyadh/Eastern)'), Syria: E('112', '110'),
  Turkey: E('155', '112', '112'), 'United Arab Emirates': E('999', '998'), Yemen: E('199', '191'),
  // Africa
  Algeria: E('17', '14'), Angola: E('113', '112'), Benin: E('117', '112'), Botswana: E('999', '997'),
  'Burkina Faso': E('17', '112'), Burundi: E('117', '112'), 'Cape Verde': E('132', '130'),
  Cameroon: E('117', '119'), 'Central African Republic': E('117', '1220'), Chad: E('17', '2251-4242'),
  Comoros: E('17', '772-03-73'), 'Democratic Republic of the Congo': E('112', '112'),
  'Republic of the Congo': E('117', '112'), Djibouti: E('17', '19'), Egypt: E('122', '123'),
  'Equatorial Guinea': E('114', '115'), Eritrea: E('113', '114'), Eswatini: E('999', '977'),
  Ethiopia: E('911', '907', '911'), Gabon: E('1730', '1300'), Gambia: E('117', '116'),
  Ghana: E('191', '193', '112'), Guinea: E('117', '442-020'), 'Guinea-Bissau': E('121', '119'),
  'Ivory Coast': E('111', '185'), Kenya: E('999', '999', '999 / 112'), Lesotho: E('123', '121'),
  Liberia: E('911', '911', '911'), Libya: E('1515', '1515'), Madagascar: E('117', '124'),
  Malawi: E('997', '998'), Mali: E('17', '15'), Mauritania: E('117', '118'),
  Mauritius: E('999', '114', '112'), Morocco: E('19', '15'), Mozambique: E('119', '117'),
  Namibia: E('10111', '911 (towns)'), Niger: E('17', '15'), Nigeria: E('112', '112', '112'),
  Rwanda: E('112', '912'), 'São Tomé and Príncipe': E('222-22-22', '112'),
  Senegal: E('17', '18'), Seychelles: E('999', '999', '999'), 'Sierra Leone': E('019', '999'),
  Somalia: E('888', '999'), 'South Africa': E('10111', '10177', '112 (mobile)'),
  'South Sudan': E('777', '777'), Sudan: E('999', '999'), Tanzania: E('112', '114', '999'),
  Togo: E('117', '8200-43-43'), Tunisia: E('197', '190'), Uganda: E('999', '911', '112'),
  Zambia: E('999', '991'), Zimbabwe: E('995', '994'),
  // Americas
  'United States': E('911', '911', '911'), Canada: E('911', '911', '911'),
  Mexico: E('911', '911', '911'), Guatemala: E('110', '128'), Belize: E('911', '911', '911'),
  'El Salvador': E('911', '132'), Honduras: E('911', '195'), Nicaragua: E('118', '128'),
  'Costa Rica': E('911', '911', '911'), Panama: E('911', '911', '911'),
  Cuba: E('106', '104'), 'Dominican Republic': E('911', '911', '911'), Haiti: E('114', '116'),
  Jamaica: E('119', '110'), 'Trinidad and Tobago': E('999', '990'),
  Bahamas: E('911', '911', '911'), Barbados: E('211', '511'),
  'Antigua and Barbuda': E('911', '911', '911'), Dominica: E('999', '999', '999'),
  Grenada: E('911', '911', '911'), 'Saint Kitts and Nevis': E('911', '911', '911'),
  'Saint Lucia': E('999', '911'), 'Saint Vincent and the Grenadines': E('999', '999', '999'),
  'Puerto Rico': E('911', '911', '911'), Aruba: E('100', '911'),
  'Sint Maarten': E('911', '912'), 'Cayman Islands': E('911', '911', '911'),
  Argentina: E('101', '107', '911'), Bolivia: E('110', '118'), Brazil: E('190', '192'),
  Chile: E('133', '131'), Colombia: E('123', '123', '123'), Ecuador: E('911', '911', '911'),
  Guyana: E('911', '913'), Paraguay: E('911', '911', '911'), Peru: E('105', '116'),
  Suriname: E('115', '113'), Uruguay: E('911', '911', '911'), Venezuela: E('911', '911', '911'),
  // Oceania
  Australia: E('000', '000', '000'), Fiji: E('911', '911', '911'), Kiribati: E('192', '194'),
  'Marshall Islands': E('911', '625-6911'), Micronesia: E('911', '911'), Nauru: E('110', '111'),
  'New Zealand': E('111', '111', '111'), Palau: E('911', '911', '911'),
  'Papua New Guinea': E('112', '111'), Samoa: E('999', '996'), 'Solomon Islands': E('999', '111'),
  Tonga: E('922', '933'), Tuvalu: E('911', '911'), Vanuatu: E('112', '112', '112'),
  'New Caledonia': E('17', '15'), 'French Polynesia': E('17', '15'), Guam: E('911', '911', '911'),
  'Cook Islands': E('999', '998'),
  // Others
  Greenland: E('112', '112', '112'),
  'Timor-Leste ': E('112', '110')
};

/** Generic worldwide fallback. */
export const EMERGENCY_FALLBACK: EmergencyNumbers = {
  general: '112 (international GSM emergency)',
  police: '112 / local police',
  ambulance: '112 / local ambulance'
};

/** Look up emergency numbers by free destination text (city or country). */
export function emergencyNumbersFor(destinationText: string): { country: string; numbers: EmergencyNumbers } {
  const t = (destinationText || '').toLowerCase();
  let best: string | null = null;
  for (const name of Object.keys(EMERGENCY_NUMBERS)) {
    const n = name.trim().toLowerCase();
    if (t.includes(n)) { best = name.trim(); break; }
  }
  if (!best) {
    // try city index indirectly: check whether any known country appears inside a city alias
    for (const name of Object.keys(EMERGENCY_NUMBERS)) {
      const n = name.trim().toLowerCase();
      if (n.includes(t) && t.length > 3) { best = name.trim(); break; }
    }
  }
  return {
    country: best || destinationText,
    numbers: best ? EMERGENCY_NUMBERS[best] : EMERGENCY_FALLBACK
  };
}
