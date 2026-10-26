import { countryNameFor } from './countryInfo';

/**
 * Sales-tax (VAT / GST / consumption tax) knowledge for travel budgeting.
 *
 * Two things travellers actually need at the till:
 *  1. whether the price on the tag already includes tax (EU/UK/JP-style
 *     tax-inclusive pricing vs US/CA-style tax added at checkout), and
 *  2. the standard rate so a rough mental conversion is possible.
 *
 * Where visitors can claim the tax back on exported goods (VAT/GST refund),
 * `refund` carries a short how-to shown in the "Tax tips" popup.
 */

export interface TaxInfo {
  /** standard national rate, e.g. '21%' */
  rate: string;
  /** is tax normally already inside the displayed price? */
  included: boolean;
  /** VAT/GST refund guidance for tourists, or null when no scheme exists */
  refund: string | null;
}

const TAX_TABLE: Record<string, TaxInfo> = {
  // --- Europe (VAT, tax-inclusive shelf prices, tourist refund schemes) ---
  'Austria': { rate: '20%', included: true, refund: 'Non-EU visitors: ask for a tax-free form at participating shops (minimum ~€75 per receipt), get it stamped at customs when leaving the EU, then refund via the operator desk or app.' },
  'Belgium': { rate: '21%', included: true, refund: 'Non-EU visitors can reclaim VAT on goods exported within 3 months — ask shops for a tax-free form and stamp it at your last EU exit point.' },
  'Bulgaria': { rate: '20%', included: true, refund: 'Non-EU visitors: tax-free shopping forms from participating stores, customs stamp on EU exit.' },
  'Croatia': { rate: '25%', included: true, refund: 'Non-EU visitors: minimum ~€100 per receipt qualifies for a VAT refund — request the PDV-P form in-store and stamp it when leaving the EU.' },
  'Cyprus': { rate: '19%', included: true, refund: 'Non-EU visitors can reclaim VAT via tax-free forms stamped on departure.' },
  'Czechia': { rate: '21%', included: true, refund: 'Non-EU visitors: purchases over ~CZK 2,000 qualify — collect a tax-free form and stamp it at the airport.' },
  'Denmark': { rate: '25%', included: true, refund: 'Non-EU visitors: minimum DKK 300 per shop — ask for a refund form, stamp at customs on your final EU exit.' },
  'Estonia': { rate: '22%', included: true, refund: 'Non-EU visitors: minimum ~€38 per receipt, tax-free form stamped on EU exit.' },
  'Finland': { rate: '25.5%', included: true, refund: 'Non-EU visitors: minimum ~€40 per shop; refund offices sit in the departure hall at Helsinki Airport.' },
  'France': { rate: '20%', included: true, refund: 'Non-EU visitors spending over €100 in one store can claim ~12% back via PABLO kiosks at the airport — scan your détaxe form before check-in.' },
  'Germany': { rate: '19%', included: true, refund: 'Non-EU visitors: ask for a tax-free receipt (Global Blue/Planet), get a customs stamp on your last EU exit, refund by desk or app.' },
  'Greece': { rate: '24%', included: true, refund: 'Non-EU visitors: minimum ~€50 per shop — tax-free form plus customs stamp on departure from the EU.' },
  'Hungary': { rate: '27%', included: true, refund: 'Non-EU visitors: highest VAT in the EU — reclaim on purchases over ~HUF 74,000 with a tax-free form stamped at exit.' },
  'Ireland': { rate: '23%', included: true, refund: 'Non-EU visitors: ask for a tax-free voucher; validate at the refund desk in Dublin Airport before flying out of the EU.' },
  'Italy': { rate: '22%', included: true, refund: 'Non-EU visitors spending over €70 (≈€154.94 from 2024 rule changes may apply — ask in-store) get a tax-free form; use the OTELLO/customs kiosks at the airport.' },
  'Latvia': { rate: '21%', included: true, refund: 'Non-EU visitors: tax-free forms from participating shops, stamped on EU exit.' },
  'Lithuania': { rate: '21%', included: true, refund: 'Non-EU visitors: minimum ~€55 per receipt, stamped at customs on EU exit.' },
  'Luxembourg': { rate: '17%', included: true, refund: 'Lowest VAT in the EU; non-EU visitors can still reclaim on exported goods over ~€74.' },
  'Malta': { rate: '18%', included: true, refund: 'Non-EU visitors: tax-free form plus customs stamp when leaving the EU.' },
  'Netherlands': { rate: '21%', included: true, refund: 'Non-EU visitors: ask shops for a tax-free form and validate it at Schiphol customs before departure.' },
  'Poland': { rate: '23%', included: true, refund: 'Non-EU visitors: minimum ~PLN 200 per receipt — tax-free form stamped at your last EU exit.' },
  'Portugal': { rate: '23%', included: true, refund: 'Non-EU visitors: minimum ~€61.50 per shop; e-taxfree validation kiosks at Lisbon & Porto airports.' },
  'Romania': { rate: '19%', included: true, refund: 'Non-EU visitors: tax-free form plus customs stamp on EU exit.' },
  'Slovakia': { rate: '20%', included: true, refund: 'Non-EU visitors: tax-free forms stamped on departure from the EU.' },
  'Slovenia': { rate: '22%', included: true, refund: 'Non-EU visitors: minimum ~€50 per receipt, stamped on EU exit.' },
  'Spain': { rate: '21%', included: true, refund: 'Non-EU visitors: no minimum spend — ask for the DIVA tax-free form and validate it at airport kiosks before flying out of the EU.' },
  'Sweden': { rate: '25%', included: true, refund: 'Non-EU visitors: minimum SEK 200 per shop — Global Blue/Planet desks at Arlanda handle the refund.' },
  'Norway': { rate: '25%', included: true, refund: 'Not in the EU: non-residents get ~11–19% back via Global Blue — minimum NOK 315, stamp at the border/airport.' },
  'Iceland': { rate: '24%', included: true, refund: 'Non-residents reclaim VAT on goods over ISK 12,000 — stamp at Keflavík Airport before departure.' },
  'Switzerland': { rate: '8.1%', included: true, refund: 'Non-residents: minimum CHF 300 per shop — export validation at the border or airport customs.' },
  'United Kingdom': { rate: '20%', included: true, refund: 'No tourist VAT refund since 2021 — the price you see is the price you pay.' },
  'Turkey': { rate: '20%', included: true, refund: 'Non-residents reclaim VAT on exported goods — ask for a tax-free invoice and stamp it at Istanbul Airport customs.' },
  // --- Asia-Pacific ---
  'Japan': { rate: '10%', included: true, refund: 'Show your passport at tax-free counters (minimum ¥5,000 per store per day) — the 10% consumption tax is deducted instantly at the till. Consumables must leave Japan unopened.' },
  'South Korea': { rate: '10%', included: true, refund: 'Tax-free shops deduct the 10% VAT on the spot (passport needed); otherwise claim at airport kiosks for purchases over ₩30,000.' },
  'China': { rate: '13%', included: true, refund: 'Departure tax refund (~9–11%) at designated stores in major cities — passport required, goods leave unused.' },
  'Taiwan': { rate: '5%', included: true, refund: 'Foreign visitors reclaim the 5% VAT on purchases over NT$2,000 at TRS-designated stores — apply at the airport service counter.' },
  'Singapore': { rate: '9%', included: true, refund: 'Tourists reclaim the 9% GST on purchases over S$100 at participating shops — use the eTRS kiosk at Changi before check-in.' },
  'Thailand': { rate: '7%', included: true, refund: 'VAT refund for tourists: minimum ฿2,000 per store per day (฿5,000+ total) — get the PP10 form and stamp it at the airport VAT office BEFORE check-in.' },
  'Vietnam': { rate: '10%', included: true, refund: 'VAT refund available at major airports for foreign visitors on goods over ₫2,000,000 bought at designated shops.' },
  'Indonesia': { rate: '11%', included: true, refund: 'VAT refund for tourists at Bali/Jakarta airports on goods from registered "VAT Refund for Tourists" shops (minimum Rp 500,000).' },
  'Malaysia': { rate: '6% (service tax) / 0% GST on most goods', included: true, refund: null },
  'India': { rate: '0–28% GST (most goods 12–18%)', included: true, refund: null },
  'Australia': { rate: '10%', included: true, refund: 'Tourist Refund Scheme: spend A$300+ at one ABN within 60 days of departure and claim the 10% GST back at the airport TRS counter.' },
  'New Zealand': { rate: '15%', included: true, refund: 'No general tourist GST refund — retailers can zero-rate goods shipped directly overseas.' },
  // --- Americas ---
  'United States': { rate: '0–10.25% (state + local, varies by city)', included: false, refund: null },
  'Canada': { rate: '5–15% (GST/HST/PST by province)', included: false, refund: null },
  'Mexico': { rate: '16%', included: true, refund: null },
  'Brazil': { rate: '17–25% (ICMS, embedded)', included: true, refund: null },
  'Argentina': { rate: '21%', included: true, refund: 'Foreign tourists reclaim IVA on locally made goods over ARS thresholds via the customs office when departing — ask shops for the refund form.' },
  'Chile': { rate: '19%', included: true, refund: null },
  'Peru': { rate: '18%', included: true, refund: null },
  'Colombia': { rate: '19%', included: true, refund: 'Foreign tourists can reclaim IVA on Colombian handicrafts & goods bought at registered stores — claim at the DIAN office at Bogotá/Cartagena airports.' },
  // --- Middle East & Africa ---
  'United Arab Emirates': { rate: '5%', included: true, refund: 'Tourists reclaim the 5% VAT via Planet Payment kiosks at Dubai/Abu Dhabi airports — validate receipts before check-in.' },
  'Qatar': { rate: '0% (no VAT yet)', included: true, refund: null },
  'Saudi Arabia': { rate: '15%', included: true, refund: 'Tourist VAT refund rolling out via registered retailers — ask at departure terminals.' },
  'Israel': { rate: '18%', included: true, refund: 'Tourists are VAT-exempt on hotel stays & car hire (show foreign passport); goods refund via the Change Place desk at Ben Gurion for purchases over ₪400.' },
  'Jordan': { rate: '16%', included: true, refund: null },
  'Egypt': { rate: '14%', included: true, refund: null },
  'Morocco': { rate: '20%', included: true, refund: null },
  'Kenya': { rate: '16%', included: true, refund: null },
  'South Africa': { rate: '15%', included: true, refund: 'Foreign tourists reclaim the 15% VAT on exported goods over R250 — present at the VAT refund office at OR Tambo/Cape Town airports with the goods.' },
  'Mauritius': { rate: '15%', included: true, refund: null }
};

/** Tax facts for a destination country (by free-text). */
export function taxInfoFor(destText: string): TaxInfo | null {
  const name = countryNameFor(destText);
  if (!name) return null;
  return TAX_TABLE[name] || null;
}
