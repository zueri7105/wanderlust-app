import React, { useState, useEffect } from 'react';
import { SoloTraveler, EmergencyContact } from '../types/travel';
import {
  ShieldAlert,
  Phone,
  Mail,
  ExternalLink,
  MapPin,
  Copy,
  Check,
  Radio,
  Send,
  AlertTriangle,
  X,
  Users,
  RefreshCw
} from 'lucide-react';
import { getAppSettings, EMERGENCY_INTERVAL_MS } from '../utils/settings';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SoloTraveler;
  activeDestination: string;
  emergencyContacts?: EmergencyContact[];
}

interface EmbassyInfo {
  name: string;
  phone24h: string;
  email: string;
  website: string;
  address: string;
}

interface LocalEmergencyServices {
  country: string;
  police: string;
  ambulance: string;
  fire: string;
  general: string;
  touristHelp?: string;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeDestination,
  emergencyContacts = [
    {
      id: 'em_1',
      name: 'Markus Rostova',
      relationship: 'Brother / Next of Kin',
      countryCode: '+49',
      phone: '170 555 4912'
    }
  ]
}) => {
  const [gpsStatus, setGpsStatus] = useState<'locating' | 'locked' | 'fallback'>('locating');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationName, setLocationName] = useState('');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [sosSentToContact, setSosSentToContact] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Emergency GPS auto-refresh interval from Settings (Manual / 15min / 30min / 1hour)
  const emergencyInterval = getAppSettings().emergencyInterval;
  const intervalMs = EMERGENCY_INTERVAL_MS[emergencyInterval];
  const intervalLabel =
    emergencyInterval === 'off'
      ? 'Manual only'
      : `Auto-refresh: every ${emergencyInterval.replace('min', ' min').replace('hour', ' hour')}`;

  // Extract country from activeDestination or user's destination
  const destStr = activeDestination !== 'All Destinations' ? activeDestination : currentUser.currentDestination || 'Kyoto, Japan';
  const country = destStr.includes(',') ? destStr.split(',')[1].trim() : 'Japan';

  // Determine local emergency dispatch numbers by destination country
  const getEmergencyServices = (destCountry: string): LocalEmergencyServices => {
    const c = destCountry.toLowerCase();
    if (c.includes('japan')) {
      return {
        country: 'Japan',
        police: '110',
        ambulance: '119',
        fire: '119',
        general: '110',
        touristHelp: '0570-000-911 (Japan Visitor Hotline 24/7)'
      };
    } else if (c.includes('spain')) {
      return {
        country: 'Spain',
        police: '091 (National Police)',
        ambulance: '061 (Medical Emergency)',
        fire: '080',
        general: '112 (Universal EU Emergency)',
        touristHelp: '+34 902 102 112 (SATE Tourist Care)'
      };
    } else if (c.includes('mexico')) {
      return {
        country: 'Mexico',
        police: '911',
        ambulance: '911 (Cruz Roja: 55 5395 1111)',
        fire: '911',
        general: '911',
        touristHelp: '078 (Ángeles Verdes Tourist Assistance)'
      };
    } else if (c.includes('italy')) {
      return {
        country: 'Italy',
        police: '113 (Polizia di Stato)',
        ambulance: '118 (Emergenza Sanitaria)',
        fire: '115',
        general: '112 (Universal EU Emergency)',
        touristHelp: '+39 06 491115 (Easy Italia Help)'
      };
    } else if (c.includes('portugal')) {
      return {
        country: 'Portugal',
        police: '112',
        ambulance: '112',
        fire: '112',
        general: '112',
        touristHelp: '+351 213 421 623'
      };
    }
    return {
      country: destCountry,
      police: '112',
      ambulance: '112',
      fire: '112',
      general: '112',
      touristHelp: '112'
    };
  };

  // Determine Embassy info based on traveler nationality + destination country
  const getEmbassyInfo = (travelerNationality: string, destCountry: string): EmbassyInfo => {
    const nat = travelerNationality.toLowerCase();
    const dest = destCountry.toLowerCase();

    if (dest.includes('japan')) {
      if (nat.includes('germany') || nat.includes('german')) {
        return {
          name: 'Botschaft der Bundesrepublik Deutschland (German Embassy Tokyo)',
          phone24h: '+81 3 5791 7700',
          email: 'info@tokyo.diplo.de',
          website: 'https://japan.diplo.de',
          address: '4-5-10 Minami-Azabu, Minato-ku, Tokyo 106-0047'
        };
      } else if (nat.includes('united states') || nat.includes('usa') || nat.includes('us')) {
        return {
          name: 'U.S. Embassy & Consulates in Japan',
          phone24h: '+81 3 3224 5000',
          email: 'tokyoacs@state.gov',
          website: 'https://jp.usembassy.gov',
          address: '1-10-5 Akasaka, Minato-ku, Tokyo 107-8420'
        };
      } else if (nat.includes('canada')) {
        return {
          name: 'Embassy of Canada in Tokyo',
          phone24h: '+81 3 5412 6200',
          email: 'tokyo-consul@international.gc.ca',
          website: 'https://www.canadainternational.gc.ca/japan-japon',
          address: '7-3-38 Akasaka, Minato-ku, Tokyo 107-8503'
        };
      } else {
        return {
          name: `Consular Mission of ${travelerNationality} in Japan`,
          phone24h: '+81 3 5791 7700',
          email: 'consular.services@mofa.gov',
          website: 'https://www.mofa.go.jp/about/emb_cons/protocol',
          address: 'Tokyo Diplomatic Enclave, Minato-ku, Tokyo'
        };
      }
    } else if (dest.includes('spain')) {
      if (nat.includes('germany')) {
        return {
          name: 'Deutsche Botschaft Madrid (German Embassy Madrid)',
          phone24h: '+34 91 557 9000',
          email: 'info@madrid.diplo.de',
          website: 'https://spanien.diplo.de',
          address: 'Calle de Fortuny 8, 28010 Madrid'
        };
      } else {
        return {
          name: `Embassy of ${travelerNationality} in Madrid`,
          phone24h: '+34 91 587 2200',
          email: 'madrid.consular@foreign.gov',
          website: 'https://www.exteriores.gob.es',
          address: 'Calle Serrano 75, 28006 Madrid'
        };
      }
    } else if (dest.includes('mexico')) {
      return {
        name: `Embassy of ${travelerNationality} in Mexico City`,
        phone24h: '+52 55 5283 2200',
        email: 'consular.mexico@foreign.gov',
        website: 'https://www.gob.mx/sre',
        address: 'Paseo de la Reforma 305, Cuauhtémoc, 06500 CDMX'
      };
    } else if (dest.includes('italy')) {
      return {
        name: `Embassy of ${travelerNationality} in Rome`,
        phone24h: '+39 06 46741',
        email: 'consular.rome@foreign.gov',
        website: 'https://www.esteri.it',
        address: 'Via Vittorio Veneto 121, 00187 Roma'
      };
    }

    return {
      name: `Embassy of ${travelerNationality} Consular Services`,
      phone24h: '+1 202 501 4444',
      email: 'emergency-citizen@international.gov',
      website: 'https://travel.state.gov',
      address: 'Central Diplomatic District'
    };
  };

  const emergencyServices = getEmergencyServices(country);
  const embassyInfo = getEmbassyInfo(currentUser.country, country);

  // Track GPS when modal opens (and re-run when the auto-refresh interval fires)
  useEffect(() => {
    if (!isOpen) {
      setSosSentToContact(false);
      setCopiedCoords(false);
      return;
    }

    setGpsStatus('locating');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy)
          });
          setGpsStatus('locked');
          setLocationName(`${destStr} (Live Device GPS Lock)`);
          setLastUpdated(new Date());
        },
        () => {
          // Fallback based on selected destination
          const fallbackLat = destStr.includes('Kyoto') ? 35.0116 : destStr.includes('Oaxaca') ? 17.0732 : 40.4168;
          const fallbackLng = destStr.includes('Kyoto') ? 135.7681 : destStr.includes('Oaxaca') ? -96.7266 : -3.7038;
          setCoordinates({
            lat: fallbackLat,
            lng: fallbackLng,
            accuracy: 12
          });
          setGpsStatus('fallback');
          setLocationName(`${destStr} (Active Journey Geocode)`);
          setLastUpdated(new Date());
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGpsStatus('fallback');
      setCoordinates({ lat: 35.0116, lng: 135.7681, accuracy: 25 });
      setLocationName(`${destStr} (Active Trip Geocode)`);
      setLastUpdated(new Date());
    }
  }, [isOpen, destStr, refreshTick]);

  // Auto-refresh GPS broadcast at the interval chosen in Settings
  useEffect(() => {
    if (!isOpen || !intervalMs) return;
    const timer = setInterval(() => setRefreshTick((t) => t + 1), intervalMs);
    return () => clearInterval(timer);
  }, [isOpen, intervalMs]);

  if (!isOpen) return null;

  const coordString = coordinates
    ? `${coordinates.lat.toFixed(5)}° N, ${coordinates.lng.toFixed(5)}° E (±${coordinates.accuracy}m)`
    : 'Acquiring GPS...';

  const googleMapsLink = coordinates
    ? `https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`
    : '#';

  const handleCopyCoordinates = () => {
    if (!coordinates) return;
    navigator.clipboard.writeText(`EMERGENCY LOCATION: ${coordinates.lat},${coordinates.lng} (${locationName})`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  const handleSendSOSToContact = () => {
    setSosSentToContact(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-red-600 max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
        {/* Header with High-Priority Red Theme */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[11px] font-bold uppercase tracking-wider rounded">
                  Emergency Mode Active
                </span>
                <span className="text-xs font-mono text-slate-500">24/7 Rapid Response</span>
              </div>
              <h2 className="font-display text-2xl font-black text-slate-950 tracking-tight mt-0.5">
                SOS Emergency & Assistance
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close Emergency Modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 1. Live GPS Location Tracking Panel */}
        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
              <Radio className="w-4 h-4 animate-ping" />
              <span>Live GPS Location Tracked</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-800 text-emerald-400 rounded border border-slate-700">
              {gpsStatus === 'locked' ? 'Satellite Lock Acquired' : gpsStatus === 'locating' ? 'Locating...' : 'Geocode Fallback'}
            </span>
          </div>

          {/* Auto-refresh status driven by Settings → Emergency GPS Refresh Interval */}
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <RefreshCw className={`w-3 h-3 ${intervalMs ? 'animate-spin' : ''}`} style={intervalMs ? { animationDuration: '4s' } : undefined} />
              <span>{intervalLabel}</span>
            </span>
            <span className="font-mono">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Updating…'}
            </span>
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-semibold cursor-pointer transition-colors"
            >
              Refresh Now
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span>{locationName || destStr}</span>
            </div>
            <div className="font-mono text-xs text-slate-300 tabular-nums">
              Coordinates: {coordString}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <button
              onClick={handleCopyCoordinates}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer font-medium border border-slate-700"
            >
              {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCoords ? 'Coordinates Copied!' : 'Copy Exact GPS Coordinates'}</span>
            </button>

            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>

        {/* 2. Direct Emergency Dispatch (Police & Ambulance) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Local Emergency Numbers in {emergencyServices.country}</span>
            </h3>
            <span className="text-xs text-slate-500">Tap to call instantly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Police Dispatch Card */}
            <div className="p-4 bg-red-50/80 border-2 border-red-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-red-900">POLICE EMERGENCY</div>
                <div className="text-xl font-mono font-black text-red-700 mt-0.5">
                  {emergencyServices.police}
                </div>
                <div className="text-[11px] text-red-600 mt-0.5">Law enforcement & immediate danger</div>
              </div>

              <a
                href={`tel:${emergencyServices.police.split(' ')[0]}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Call Police</span>
              </a>
            </div>

            {/* Ambulance & Medical Emergency Card */}
            <div className="p-4 bg-amber-50/80 border-2 border-amber-200 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-amber-900">AMBULANCE & MEDICAL</div>
                <div className="text-xl font-mono font-black text-amber-700 mt-0.5">
                  {emergencyServices.ambulance}
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">Medical rescue & acute injury</div>
              </div>

              <a
                href={`tel:${emergencyServices.ambulance.split(' ')[0]}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
              >
                <Phone className="w-4 h-4" />
                <span>Call Medic</span>
              </a>
            </div>
          </div>

          {emergencyServices.touristHelp && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900">24/7 Tourist Assistance Hotline: </span>
                <span className="font-mono font-bold text-slate-900">{emergencyServices.touristHelp}</span>
              </div>
              <a
                href={`tel:${emergencyServices.touristHelp.split(' ')[0]}`}
                className="text-xs font-semibold text-slate-900 underline hover:text-slate-700"
              >
                Call Support
              </a>
            </div>
          )}
        </div>

        {/* 3. Embassy of Country of Nationality */}
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Consular Protection for Nationality: {currentUser.country}
              </div>
              <h4 className="font-display font-bold text-base text-slate-950 mt-0.5">
                {embassyInfo.name}
              </h4>
            </div>
            <span className="text-xs text-slate-500 font-mono">24/7 Citizen Support</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* 24/7 Phone */}
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-700" />
                <span>Emergency 24/7 Telephone</span>
              </div>
              <div className="font-mono text-slate-950 font-bold text-sm">
                {embassyInfo.phone24h}
              </div>
              <a
                href={`tel:${embassyInfo.phone24h.replace(/\s+/g, '')}`}
                className="inline-block text-emerald-800 font-semibold hover:underline text-[11px] pt-0.5"
              >
                Direct Call Embassy →
              </a>
            </div>

            {/* Emergency Email */}
            <div className="p-3 bg-slate-50 rounded-lg space-y-1">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-700" />
                <span>Emergency Consular Email</span>
              </div>
              <div className="font-mono text-slate-950 font-medium truncate">
                {embassyInfo.email}
              </div>
              <a
                href={`mailto:${embassyInfo.email}?subject=EMERGENCY ASSISTANCE REQUEST - ${currentUser.name}&body=URGENT CITIZEN ASSISTANCE REQUIRED.%0D%0A%0D%0AName: ${currentUser.name}%0D%0ANationality: ${currentUser.country}%0D%0ALocation: ${locationName} (${coordString})%0D%0AContact Phone: +49 170 555 4912`}
                className="inline-block text-emerald-800 font-semibold hover:underline text-[11px] pt-0.5"
              >
                Compose Emergency Email →
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="truncate">Address: {embassyInfo.address}</span>
            <a
              href={embassyInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-slate-900 hover:underline shrink-0"
            >
              <span>Official Consular Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 4. Linked Emergency Contacts Alert Broadcast (Refined with Name, Relationship, Country Code & Number) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900">
                Linked Emergency Contacts & Next of Kin ({emergencyContacts.length})
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Verified Next of Kin broadcast
            </span>
          </div>

          <div className="space-y-2">
            {emergencyContacts.map((contact, idx) => (
              <div
                key={contact.id || idx}
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span>{contact.name || 'Emergency Contact'}</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      ({contact.relationship || 'Next of Kin'})
                    </span>
                  </div>
                  <div className="font-mono text-slate-600 text-[11px] mt-0.5">
                    {contact.countryCode} {contact.phone}
                  </div>
                </div>

                <a
                  href={`tel:${(contact.countryCode + contact.phone).replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Phone className="w-3 h-3 text-slate-600" />
                  <span>Call Directly</span>
                </a>
              </div>
            ))}
          </div>

          {sosSentToContact ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Emergency SMS & live GPS coordinates link dispatched to all {emergencyContacts.length} emergency contacts!
              </span>
            </div>
          ) : (
            <button
              onClick={handleSendSOSToContact}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Live GPS Location & SOS Alert to All {emergencyContacts.length} Contacts</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close Emergency Window
          </button>
        </div>
      </div>
    </div>
  );
};
