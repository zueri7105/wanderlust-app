import React, { useState } from 'react';
import { TravelTrip, SoloTraveler, TravelPace, BudgetTier, TripScope } from '../types/travel';

interface CreateTripModalProps {
  currentUser: SoloTraveler;
  isOpen: boolean;
  onClose: () => void;
  onSaveTrip: (trip: Omit<TravelTrip, 'id' | 'travelerId'>) => void;
}

const AVAILABLE_INTERESTS = [
  'Photography',
  'Day Hikes',
  'Street Food',
  'Architecture',
  'Local Markets',
  'Roadtrips',
  'Sailing & Boating',
  'Museums & Galleries',
  'Mezcal & Wine',
  'Cafes & Remote Work',
  'Trail Running'
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSaveTrip
}) => {
  if (!isOpen) return null;

  const [destination, setDestination] = useState('Kyoto, Japan');
  const [country, setCountry] = useState('Japan');
  const [region, setRegion] = useState('Kansai');
  const [startDate, setStartDate] = useState('2026-10-22');
  const [endDate, setEndDate] = useState('2026-10-28');
  const [flexibilityDays, setFlexibilityDays] = useState(1);
  const [tripScope, setTripScope] = useState<TripScope>('Flexible (Full or Part)');
  const [desiredPace, setDesiredPace] = useState<TravelPace>('Moderate Explorer');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('$$');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Photography',
    'Street Food',
    'Day Hikes'
  ]);
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [plannedActivities, setPlannedActivities] = useState('');

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((i) => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate || !headline) return;

    let coverImage = '/src/assets/images/destination_kyoto_bamboo_1792119350483.jpg';
    if (destination.toLowerCase().includes('oaxaca') || destination.toLowerCase().includes('mexico')) {
      coverImage = '/src/assets/images/destination_oaxaca_market_1792119352389.jpg';
    } else if (destination.toLowerCase().includes('amalfi') || destination.toLowerCase().includes('italy')) {
      coverImage = '/src/assets/images/destination_amalfi_boat_1792119352021.jpg';
    } else if (destination.toLowerCase().includes('lisbon') || destination.toLowerCase().includes('portugal')) {
      coverImage = '/src/assets/images/hero_travel_companions_1792119350242.jpg';
    }

    onSaveTrip({
      destination,
      country,
      region,
      coverImage,
      startDate,
      endDate,
      flexibilityDays: Number(flexibilityDays),
      tripScope,
      desiredPace,
      budgetTier,
      interests: selectedInterests,
      headline,
      description: description || `Solo traveler looking to connect with potential travel buddies for ${destination} (full or part of trip).`,
      plannedActivities: plannedActivities
        ? plannedActivities.split(',').map((s) => s.trim())
        : ['Scenic morning walk', 'Local food tasting']
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer"
        >
          ✕
        </button>

        <h3 className="font-display font-bold text-lg text-slate-950">
          Post Your Upcoming Trip
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Specify where and when you're traveling, and whether you want a companion for the whole trip or part of it.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Destination City & Country
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kyoto, Japan or Oaxaca, Mexico"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Travel Scope Selection: Key Feature */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="block font-semibold text-slate-800 mb-1">
              How do you wish to travel together?
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Choose your preference for finding a travel companion:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(['Full Trip', 'Part of Trip', 'Flexible (Full or Part)'] as TripScope[]).map((scope) => (
                <button
                  type="button"
                  key={scope}
                  onClick={() => setTripScope(scope)}
                  className={`p-2 rounded text-center transition-colors cursor-pointer text-xs ${
                    tripScope === scope
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Flexibility
              </label>
              <select
                value={flexibilityDays}
                onChange={(e) => setFlexibilityDays(Number(e.target.value))}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value={0}>Fixed Dates</option>
                <option value={1}>± 1 Day</option>
                <option value={2}>± 2 Days</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Travel Pace
              </label>
              <select
                value={desiredPace}
                onChange={(e) => setDesiredPace(e.target.value as TravelPace)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Chill & Scenic">Chill & Scenic</option>
                <option value="Moderate Explorer">Moderate</option>
                <option value="Brisk & Fast-Paced">Brisk</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Budget Tier
              </label>
              <select
                value={budgetTier}
                onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="$">$ (Backpacker)</option>
                <option value="$$">$$ (Moderate)</option>
                <option value="$$$">$$$ (Premium)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Headline
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Seeking travel partner for autumn temples, scenic drives & food crawls"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">
              Select Your Interests:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Planned Activities (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Sunrise photo walk, local market cooking class, scenic road trip"
              value={plannedActivities}
              onChange={(e) => setPlannedActivities(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Trip Details & Travel Style
            </label>
            <textarea
              rows={3}
              placeholder="Describe what kind of travel buddy you are looking for, shared interests, and your travel philosophy..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 cursor-pointer"
            >
              Post Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
