import React from 'react';
import { Search, MapPin, Calendar, Compass, ShieldCheck, Users } from 'lucide-react';
import heroImage from '../assets/images/hero_travel_companions_1792119350242.jpg';

interface HeroBannerProps {
  selectedDestination: string;
  onDestinationChange: (dest: string) => void;
  selectedInterest: string;
  onInterestChange: (interest: string) => void;
  selectedScope: string;
  onScopeChange: (scope: string) => void;
  onSearchClick: () => void;
  onPostTripClick: () => void;
}

const POPULAR_DESTINATIONS = ['All Destinations', 'Kyoto, Japan', 'Oaxaca, Mexico', 'Amalfi Coast, Italy', 'Lisbon, Portugal', 'Madrid & Seville, Spain'];
const INTEREST_OPTIONS = [
  'All Interests',
  'Photography',
  'Day Hikes',
  'Street Food',
  'Architecture',
  'Roadtrips',
  'Sailing & Boating'
];
const SCOPE_OPTIONS = [
  'All Trips',
  'Full Trip',
  'Part of Trip',
  'Flexible (Full or Part)'
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  selectedDestination,
  onDestinationChange,
  selectedInterest,
  onInterestChange,
  selectedScope,
  onScopeChange,
  onSearchClick,
  onPostTripClick
}) => {
  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Editorial Copy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
              <span>Solo Travelers Connected</span>
              <span aria-hidden="true">·</span>
              <span>Full Trip or Part of Trip</span>
              <span aria-hidden="true">·</span>
              <span>Direct Match & Chat</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.15] text-balance">
              Find solo travelers to travel together.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Connect with fellow solo adventurers heading to the same destination. Whether you want a travel companion for the full journey or someone to share activities and split costs for part of the trip.
            </p>

            {/* Zero-Pill Proof Adjacency */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 font-medium border-t border-slate-100 pt-5">
              <div>
                <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">1,420+</span> Upcoming Solo Trips
              </div>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <div>
                <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">98.4%</span> Safe Meetup Rating
              </div>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <div>
                <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">$380</span> Avg Saved via Shared Transport
              </div>
            </div>

            {/* Interactive Search & Filter Bar with Explicit Search Button */}
            <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-xs font-semibold text-slate-800 mb-3 flex items-center justify-between">
                <span>Search Potential Travel Companions</span>
                <span className="text-[11px] text-slate-500 font-normal">Choose filters & search</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Destination Dropdown */}
                <div className="relative">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Destination
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedDestination}
                      onChange={(e) => onDestinationChange(e.target.value)}
                      className="w-full pl-9 pr-7 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
                    >
                      {POPULAR_DESTINATIONS.map((dest) => (
                        <option key={dest} value={dest}>
                          {dest}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Scope Filter */}
                <div className="relative">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Travel Scope
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedScope}
                      onChange={(e) => onScopeChange(e.target.value)}
                      className="w-full pl-9 pr-7 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
                    >
                      {SCOPE_OPTIONS.map((scope) => (
                        <option key={scope} value={scope}>
                          {scope}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Interest Filter */}
                <div className="relative">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Shared Interest
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={selectedInterest}
                      onChange={(e) => onInterestChange(e.target.value)}
                      className="w-full pl-9 pr-7 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none cursor-pointer"
                    >
                      {INTEREST_OPTIONS.map((int) => (
                        <option key={int} value={int}>
                          {int}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Explicit Search Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Ready to connect with potential travel buddies?
                </span>

                <button
                  onClick={onSearchClick}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Companions</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Photographic Anchor */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-md aspect-[16/10] sm:aspect-[4/3] bg-slate-100">
              <img
                src={heroImage}
                alt="Two solo travelers meeting at a scenic Mediterranean coastal cliff viewpoint"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-xs text-slate-200">
                  <span>Dubrovnik Coastal Exploration</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">Oct 19–24</span>
                </div>
                <p className="text-sm font-semibold text-white mt-0.5 leading-snug">
                  "Met up for a 3-day portion of the trip, split the coastal taxi and hikes!"
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
