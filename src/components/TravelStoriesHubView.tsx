import React, { useState } from 'react';
import { getTranslation } from '../utils/i18n';
import { KnowledgeArticle, KnowledgeArticleCategory, SoloTraveler } from '../types/travel';
import {
  BookOpen,
  Search,
  Plus,
  ThumbsUp,
  Clock,
  MapPin,
  Tag,
  Share2,
  X,
  Sparkles,
  Shield,
  Heart,
  Check,
  Heading2,
  Pilcrow,
  Trash2,
  EyeOff,
  Eye,
  Compass
} from 'lucide-react';
import { TRENDING_DESTINATIONS } from '../data/trendingDestinations';
import kyotoImg from '../assets/images/destination_kyoto_bamboo_1792119350483.jpg';
import oaxacaImg from '../assets/images/destination_oaxaca_market_1792119352389.jpg';
import amalfiImg from '../assets/images/destination_amalfi_boat_1792119352021.jpg';
import exploreImg from '../assets/images/solo_travelers_explore_1792127184490.jpg';
import diningImg from '../assets/images/solo_travelers_dining_1792127167887.jpg';
import heroCompanionsImg from '../assets/images/hero_travel_companions_1792119350242.jpg';

const TRENDING_IMAGES: Record<string, string> = {
  kyoto: kyotoImg,
  explore: exploreImg,
  amalfi: amalfiImg,
  oaxaca: oaxacaImg,
  dining: diningImg,
  stories: heroCompanionsImg
};

/** A story content block: paragraph or subheading. Subheadings persist as "## text". */
interface StoryBlock {
  type: 'p' | 'h2';
  text: string;
}

export const INITIAL_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'art_china_digital',
    title: 'Surviving & Thriving in China: Great Firewall, Alipay & Amap Guide',
    category: 'Transit & Digital Hacks',
    destination: 'China',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    authorCity: 'Berlin, Germany',
    date: '2026-10-10',
    readTime: '5 min read',
    summary: 'A complete practical survival guide for solo travelers in China: why Google Maps fails, how to use Amap and Alipay with foreign cards, and VPN vs roaming eSIM comparisons.',
    tags: ['Cashless', 'Amap', 'Alipay', 'VPN / eSIM', 'China Travel'],
    likesCount: 142,
    content: [
      'Digital Payments: Cash is essentially dead in modern China. Before you board your flight, download the international version of Alipay, verify your identity using your passport scan, and bind your Visa or Mastercard. You will use it for metro turnstiles, street baozi stalls, and restaurant bills.',
      'Navigation Reality: Google Maps is heavily offset (shifted by several hundred meters) and blocked without a VPN. Download Amap (高德地图) or use Apple Maps. Apple Maps functions smoothly in English and provides live bus/subway transfer gates.',
      'Firewall & Connectivity: Local Wi-Fi blocks WhatsApp, Google, Instagram, and Gmail. The most reliable solution is an international travel eSIM (such as Airalo, Nomad, or Holafly) before landing, which routes through Hong Kong or Singapore and natively bypasses restrictions without needing a separate VPN.'
    ]
  },
  {
    id: 'art_japan_manners',
    title: 'Silence on Trains, Coin Pouches & Trash Bags: Japanese Cultural Shocks',
    category: 'Culture & Traditions',
    destination: 'Japan',
    authorName: 'Kenji Sato',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    authorCity: 'Tokyo, Japan',
    date: '2026-10-05',
    readTime: '4 min read',
    summary: 'Essential unspoken rules in Kyoto and Tokyo: Manner Mode on trains, eating while walking, why there are no trash cans, and the sacred coin pouch.',
    tags: ['Etiquette', 'Kyoto', 'Transit Manners', 'Cultural Shocks'],
    likesCount: 198,
    content: [
      'Zero Trash Cans: Following 1995 safety regulations, public street garbage bins were removed. Solo travelers must carry a small plastic bag in their backpack to collect personal trash until returning to their hotel or convenience store.',
      'Street Snacking Taboo: In historic quarters like Gion and Arashiyama, walking while eating is considered impolite. Enjoy your matcha soft-serve or dango directly beside the vendor stall where disposal bins are provided.',
      'Manner Mode on Trains: Speaking loudly or answering phone calls on subways and Shinkansen is strictly avoided. Keep devices on silent mode and use headphones with zero audio leakage.'
    ]
  },
  {
    id: 'art_dubrovnik_walls',
    title: 'Tackling the Polished Limestone & Fortress Walls of Dubrovnik',
    category: 'Hidden Gems',
    destination: 'Croatia',
    authorName: 'Sofia Morales',
    authorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    authorCity: 'Valencia, Spain',
    date: '2026-09-28',
    readTime: '4 min read',
    summary: 'How to avoid the cruise crowds, save on the Dubrovnik Pass, handle slippery ancient stone alleys, and find secluded sea swimming ladders.',
    tags: ['Old Town', 'Dubrovnik Pass', 'Adriatic', 'Photography'],
    likesCount: 115,
    content: [
      'Limestone is Slippery as Ice: Centuries of foot traffic have polished the main Stradun stones. Never wear worn-down flip-flops or smooth leather shoes. Wear rubber sneakers with high friction.',
      'Dubrovnik Pass: Buying the 1-Day Dubrovnik Pass online costs €35 (the exact same price as the City Walls ticket alone), but includes access to the Rector\'s Palace, Maritime Museum, and 24 hours of free city buses.',
      'Buža Bar Secret Swimming: Tucked through a hole in the seaward city walls, Buža bar has stone ladders plunging directly into deep crystal-clear Adriatic water. Bring your swim attire inside your daypack!'
    ]
  },
  {
    id: 'art_female_solo_safety',
    title: 'Solo Female Travel Safety Blueprint: Meeting Companions with Confidence',
    category: 'Solo Female Safety',
    destination: 'Global',
    authorName: 'Sarah Jenkins',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    authorCity: 'Melbourne, Australia',
    date: '2026-09-20',
    readTime: '6 min read',
    summary: 'Actionable safety protocols for women travelling independently: safe public rendezvous, verifying traveller profiles, setting boundaries, and trusting your intuition.',
    tags: ['Safety First', 'Female Travellers', 'Verification', 'Vouching'],
    likesCount: 264,
    content: [
      'Public Daytime Meeting Points: When meeting travel companions from the app for the first time, always pick open, well-lit cafes or landmark transit hubs (e.g. Kyoto Tower exit, Stradun Onofrio Fountain). Avoid remote spots for first meetings.',
      'Shared Itinerary Privacy: Keep your exact accommodation room number private. WanderLust lets you share general destination dates and activities while keeping lodging confidential.',
      'Emergency Contact Pings: Set an automatic daily ping or check-in time with your emergency contact. If you join a remote hike, inform your contact about your planned return time.'
    ]
  },
  {
    id: 'art_oaxaca_mezcal_food',
    title: 'Oaxaca Gastronomy Deep Dive: Mole Negro, Pasillo de Humo & Mezcal Etiquette',
    category: 'Local Dining Etiquette',
    destination: 'Mexico',
    authorName: 'Maya Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    authorCity: 'Vancouver, Canada',
    date: '2026-09-15',
    readTime: '5 min read',
    summary: 'A guide to navigating Oaxaca’s smoke aisle, understanding traditional clay pot mezcal sipping, and polite Spanish dining phrases.',
    tags: ['Street Food', 'Mezcal', 'Oaxaca', 'Tasting'],
    likesCount: 173,
    content: [
      'How to Eat at Pasillo de Humo: In Mercado 20 de Noviembre, walk into the smoke alley, select your thinly sliced tasajo or cecina, and the grill master cooks it on embers. Buy a basket of warm tortillas from women walking by, fresh avocado, and lime.',
      'Sip, Never Shoot Mezcal: Mezcal is an artisanal spirit meant to be "besado" (kissed gently), never downed like a shot. Traditional mezcalerías serve it with orange slices and sal de gusano (agave worm salt).',
      'The Magic Word: "¡Provecho!" Whenever you walk past someone eating in a restaurant or leave a communal table, say "Provecho" (Enjoy your meal). It is an essential courtesy that immediately wins smiles.'
    ]
  }
];

const STORY_CATEGORIES: KnowledgeArticleCategory[] = [
  'Culture & Traditions',
  'Solo Female Safety',
  'Local Dining Etiquette',
  'Transit & Digital Hacks',
  'Hidden Gems',
  'Budget & Money Hacks',
  'Visas & Border Crossings',
  'Accommodation Hacks',
  'Adventure & Outdoors',
  'Food & Street Eats',
  'Nightlife & Social Scene',
  'Photography & Content',
  'Health & Wellbeing',
  'Meeting People & Companions',
  'Packing & Gear'
];

const CATEGORIES = ['All Articles', ...STORY_CATEGORIES] as const;

interface TravelStoriesHubViewProps {
  currentUser: SoloTraveler;
  onGoToDestination?: (dest: string) => void;
  /** Hide the hero + trending photo row (when embedded inside another page, e.g. Explore → Tips) */
  hideHero?: boolean;
}

export const TravelStoriesHubView: React.FC<TravelStoriesHubViewProps> = ({
  currentUser,
  onGoToDestination,
  hideHero
}) => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>(() => {
    const saved = localStorage.getItem('wanderlust_knowledge_articles');
    return saved ? JSON.parse(saved) : INITIAL_ARTICLES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Articles');
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});
  // Hidden story posts (this device) — user can hide anyone's story from their own feed
  const [hiddenArticles, setHiddenArticles] = useState<string[]>(() => {
    const saved = localStorage.getItem('wanderlust_hidden_articles');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleHideArticle = (id: string) => {
    const updated = [...hiddenArticles, id];
    setHiddenArticles(updated);
    localStorage.setItem('wanderlust_hidden_articles', JSON.stringify(updated));
    if (activeArticle?.id === id) setActiveArticle(null);
  };

  // Unhide — restore a previously hidden story to the feed
  const handleUnhideArticle = (id: string) => {
    const updated = hiddenArticles.filter((a) => a !== id);
    setHiddenArticles(updated);
    localStorage.setItem('wanderlust_hidden_articles', JSON.stringify(updated));
  };

  // Delete story post — only the author's own stories can be deleted
  const handleDeleteArticle = (id: string) => {
    const updated = articles.filter((a) => a.id !== id);
    setArticles(updated);
    localStorage.setItem('wanderlust_knowledge_articles', JSON.stringify(updated));
    if (activeArticle?.id === id) setActiveArticle(null);
  };
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(null);

  // Form state for writing a new article
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeArticle['category']>('Culture & Traditions');
  const [newDestination, setNewDestination] = useState('Japan');
  const [newSummary, setNewSummary] = useState('');
  // New stories start with one subheading + one paragraph ready to fill in
  const [newBlocks, setNewBlocks] = useState<StoryBlock[]>([
    { type: 'h2', text: '' },
    { type: 'p', text: '' }
  ]);
  const [newTags, setNewTags] = useState('Culture, Solo Tips, Travel Advice');

  const updateBlock = (idx: number, text: string) =>
    setNewBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, text } : b)));
  const addBlock = (type: StoryBlock['type']) =>
    setNewBlocks((prev) => [...prev, { type, text: '' }]);
  const removeBlock = (idx: number) =>
    setNewBlocks((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleToggleLike = (articleId: string) => {
    setLikedArticles((prev) => {
      const isLiked = !prev[articleId];
      setArticles((artList) =>
        artList.map((a) =>
          a.id === articleId ? { ...a, likesCount: a.likesCount + (isLiked ? 1 : -1) } : a
        )
      );
      return { ...prev, [articleId]: isLiked };
    });
  };

  const handlePublishArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const content = newBlocks
      .filter((b) => b.text.trim())
      .map((b) => (b.type === 'h2' ? `## ${b.text.trim()}` : b.text.trim()));
    if (content.length === 0) return;

    const created: KnowledgeArticle = {
      id: `art_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      destination: newDestination.trim(),
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorCity: `${currentUser.homeCity}, ${currentUser.country}`,
      date: new Date().toISOString().split('T')[0],
      readTime: '3 min read',
      summary: newSummary.trim(),
      content,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      likesCount: 1,
      isUserCustom: true
    };

    const updated = [created, ...articles];
    setArticles(updated);
    localStorage.setItem('wanderlust_knowledge_articles', JSON.stringify(updated));

    setIsWriteModalOpen(false);
    setNewTitle('');
    setNewSummary('');
    setNewBlocks([
      { type: 'h2', text: '' },
      { type: 'p', text: '' }
    ]);
  };

  // Filter articles (hidden posts are removed from the feed unless viewing the Hidden tab)
  const filteredArticles = articles.filter((art) => {
    if (selectedCategory === 'Hidden Posts') return hiddenArticles.includes(art.id);
    if (hiddenArticles.includes(art.id)) return false;
    if (selectedCategory !== 'All Articles' && art.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = art.title.toLowerCase().includes(q);
      const matchSummary = art.summary.toLowerCase().includes(q);
      const matchDest = art.destination.toLowerCase().includes(q);
      const matchTags = art.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchDest && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Pi-Travel-style hero (逛一逛) */}
      {!hideHero && (
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 sm:-mt-10 px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-10 bg-gradient-to-b from-stone-200/60 via-stone-100/40 to-transparent dark:from-stone-900/60 dark:via-stone-950/20">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
            {getTranslation('inspirationHeroTitle')}
          </h1>
          <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400">
            {getTranslation('inspirationHeroSub')}
          </p>
        </div>

        {/* Trending destination photo cards */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 max-w-6xl mx-auto">
          {TRENDING_DESTINATIONS.map((d, idx) => (
            <button
              key={d.name}
              type="button"
              onClick={() => onGoToDestination && onGoToDestination(d.name)}
              className={`group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-lg transition-all text-left cursor-pointer ${
                idx % 2 === 1 ? 'lg:transtone-y-5' : ''
              }`}
            >
              <img
                src={TRENDING_IMAGES[d.imageKey] || exploreImg}
                alt={d.name}
                className="w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3">
                <div className="text-[13px] font-bold text-white leading-snug drop-shadow">
                  {d.name}
                </div>
                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/20 backdrop-blur-sm text-[10px] font-semibold text-white">
                  <Compass className="w-3 h-3" />
                  <span>{d.trendNote}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Header — minimal */}
      <div className="pb-6 border-b border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400 flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Field Notes
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-950 dark:text-stone-50 tracking-tight">
            {getTranslation('storiesTitle')}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 max-w-2xl">
            {getTranslation('storiesSub')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWriteModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:brightness-105 transition-colors shadow-sm cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{getTranslation('writeStory')}</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Search Input on Top as requested */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -transtone-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation('searchArticles')}
            className="w-full pl-9 pr-8 py-2 text-xs border border-stone-300 dark:border-stone-700 rounded-lg bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -transtone-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat, idx) => (
            <React.Fragment key={cat}>
              {idx === 1 && (
                /* Hidden Posts tab — pinned right behind "All Articles" so it's always easy to find */
                <button
                  type="button"
                  onClick={() => setSelectedCategory('Hidden Posts')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer font-medium inline-flex items-center gap-1.5 ${
                    selectedCategory === 'Hidden Posts'
                      ? 'bg-gradient-to-r from-stone-600 to-stone-800 text-white font-semibold shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                  title="Posts you hid from your feed"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Hidden</span>
                  <span className="font-mono text-[10px] opacity-80">({hiddenArticles.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer font-medium ${
                  selectedCategory === cat
                    ? 'bg-stone-900 dark:bg-stone-100 dark:text-stone-900 text-white font-semibold shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto mb-2" />
          <h3 className="font-semibold text-stone-800 dark:text-stone-200">No matching articles found</h3>
          <p className="text-xs text-stone-500 mt-1">Try another search keyword or clear the category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((art) => {
            const isLiked = !!likedArticles[art.id];
            return (
              <div
                key={art.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Category & Destination Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border border-violet-300/60 dark:border-violet-800">
                      {art.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      <span>{art.destination}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setActiveArticle(art)}
                    className="font-display font-bold text-base text-stone-950 dark:text-stone-50 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors leading-snug"
                  >
                    {art.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
                    {art.summary}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {art.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Author Info & Actions */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={art.authorAvatar}
                      alt={art.authorName}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-semibold text-stone-800 dark:text-stone-200 block text-[11px] truncate">
                        {art.authorName}
                      </span>
                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{art.readTime}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(art.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                        isLiked
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-semibold'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span className="font-mono text-[11px]">{art.likesCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveArticle(art)}
                      className="px-2.5 py-1 text-xs font-semibold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-md cursor-pointer"
                    >
                      {getTranslation('readArticle')}
                    </button>

                    {/* Hide / Unhide post (anyone can manage their own feed) */}
                    {selectedCategory === 'Hidden Posts' ? (
                      <button
                        type="button"
                        onClick={() => handleUnhideArticle(art.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                        title="Restore this post to your feed"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Unhide</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleHideArticle(art.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
                        title="Hide this post (find it again under the Hidden tab)"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete post (only your own stories) */}
                    {art.isUserCustom && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete your story "${art.title}"? This cannot be undone.`)) {
                            handleDeleteArticle(art.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors cursor-pointer"
                        title="Delete your post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Article Detail Reading Modal */}
      {activeArticle && (
        <div className="wl-modal-overlay">
          <div className="wl-modal-card max-w-2xl p-6 sm:p-7 relative space-y-5 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950/50 text-violet-800 dark:text-violet-300 border border-violet-300/60">
                {activeArticle.category}
              </span>
              <span className="text-xs text-stone-500 flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{activeArticle.destination}</span>
              </span>
            </div>

            {/* Title */}
            <h2 className="font-display font-bold text-2xl text-stone-950 dark:text-stone-50 leading-tight">
              {activeArticle.title}
            </h2>

            {/* Author bar */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={activeArticle.authorAvatar}
                  alt={activeArticle.authorName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <div>
                  <div className="font-bold text-stone-900 dark:text-stone-100">
                    {activeArticle.authorName}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    {activeArticle.authorCity} · {activeArticle.date}
                  </div>
                </div>
              </div>

              <span className="font-mono text-stone-400 text-xs">
                {activeArticle.readTime}
              </span>
            </div>

            {/* Article Content */}
            <div className="space-y-4 text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              <p className="font-medium text-stone-900 dark:text-stone-100 italic bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-700">
                {activeArticle.summary}
              </p>

              {activeArticle.content.map((para, idx) => {
                // Explicit subheading block (written via the story editor)
                if (para.startsWith('## ')) {
                  return (
                    <h3
                      key={idx}
                      className="font-display text-base font-bold text-stone-950 dark:text-stone-50 pt-3 flex items-center gap-2"
                    >
                      <span className="w-1 h-4 rounded-full bg-stone-950 dark:bg-violet-400 shrink-0" />
                      {para.slice(3)}
                    </h3>
                  );
                }
                // Auto-detect "Lead-in: rest of paragraph" style for existing stories
                const lead = para.match(/^([^:]{3,60}):\s+([\s\S]+)$/);
                if (lead && !lead[1].includes('.') && !lead[1].includes('!')) {
                  return (
                    <div key={idx}>
                      <h3 className="font-display text-base font-bold text-stone-950 dark:text-stone-50 flex items-center gap-2 mb-1">
                        <span className="w-1 h-4 rounded-full bg-stone-950 dark:bg-violet-400 shrink-0" />
                        {lead[1]}
                      </h3>
                      <p>{lead[2]}</p>
                    </div>
                  );
                }
                return <p key={idx}>{para}</p>;
              })}
            </div>

            {/* Tags */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap gap-1.5">
              {activeArticle.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-md"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleToggleLike(activeArticle.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  likedArticles[activeArticle.id]
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${likedArticles[activeArticle.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{activeArticle.likesCount} Appreciations</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:brightness-105 cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write New Story / Tip Modal */}
      {isWriteModalOpen && (
        <div className="wl-modal-overlay">
          <div className="wl-modal-card max-w-xl p-6 sm:p-7 relative">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="wl-modal-eyebrow">WanderLust Studio</div>
                <h3 className="wl-modal-title mt-1.5">
                  Publish a Travel Story or Cultural Tip
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1.5">
                  Share local etiquette, dining recommendations, digital survival tips, or safety advice with fellow solo travelers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteModalOpen(false)}
                className="wl-modal-close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishArticle} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Article Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navigating Paris Metro or Best Night Markets in Taipei"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    {STORY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Destination / Country
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Japan, Italy, China, Mexico"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Summary / Key Takeaway (2-3 sentences)
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summarize the core lesson, rule, or recommendation..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              {/* Block editor: unlimited paragraphs & subheadings */}
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Story Content — add as many paragraphs & subheadings as you like
                </label>
                <div className="space-y-2.5">
                  {newBlocks.map((block, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-2.5 space-y-2 ${
                        block.type === 'h2'
                          ? 'border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20'
                          : 'border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                            block.type === 'h2'
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-stone-500 dark:text-stone-400'
                          }`}
                        >
                          {block.type === 'h2' ? (
                            <Heading2 className="w-3.5 h-3.5" />
                          ) : (
                            <Pilcrow className="w-3.5 h-3.5" />
                          )}
                          {block.type === 'h2' ? 'Subheading' : `Paragraph ${newBlocks.slice(0, idx + 1).filter((b) => b.type === 'p').length}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeBlock(idx)}
                          disabled={newBlocks.length === 1}
                          className="p-1 text-stone-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Remove block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {block.type === 'h2' ? (
                        <input
                          type="text"
                          placeholder="Subheading, e.g. Where to Eat Like a Local"
                          value={block.text}
                          onChange={(e) => updateBlock(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-orange-200 dark:border-orange-900 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      ) : (
                        <textarea
                          rows={3}
                          placeholder="Share the context, what happened, and step-by-step guidance..."
                          value={block.text}
                          onChange={(e) => updateBlock(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900 resize-y"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => addBlock('p')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
                  >
                    <Pilcrow className="w-3.5 h-3.5" />
                    Add paragraph
                  </button>
                  <button
                    type="button"
                    onClick={() => addBlock('h2')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                    Add subheading
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tags (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Budget, Cafes, Offline Maps, Safety"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:brightness-105 cursor-pointer shadow-xs"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
