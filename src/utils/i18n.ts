export type AppLanguage = 'en' | 'es' | 'zh' | 'ja' | 'fr' | 'de';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    explore: 'Explore Trips',
    itinerary: 'Itinerary',
    matcher: 'Find Companions',
    messages: 'Messages',
    activities: 'Shared Activities',
    costs: 'Trip Cost',
    map: 'Location Map',
    stories: 'Stories & Tips',
    profile: 'My Profile',
    settings: 'Settings',
    sosHelp: 'SOS Help',
    soloGroupTravel: 'Solo Group Travel',
    searchCompanions: 'Search travel companions...',
    durationOfStay: 'Duration of Stay',
    days: 'Days',
    nights: 'Nights',
    openToPublic: 'Open to Public (Adjust in Settings)',
    companionGoals: 'Companionship Goals (optional)',
    travelPlanning: 'Travel Planning',
    addAnotherDay: 'Add Another Day',
    totalBudget: 'Total Budget',
    totalSoloSpent: 'Total Solo Spent',
    budgetRemaining: 'Budget Remaining',
    shareProfile: 'Share Your Profile',
    emergencyContacts: 'Emergency Contacts',
    relationshipToTraveler: 'Relationship to Traveler (optional)',
    firstName: 'First Name',
    middleName: 'Middle Name (optional)',
    lastName: 'Last Name',
    noMoreUpcomingTrips: 'No more upcoming trips :((',
    interactiveMeetups: 'Solo Travelers Meeting Up Worldwide',
    interactiveMeetupsSubtitle: 'Real moments of solo wanderers connecting for shared journeys, food crawls, and adventures. Tap any memory to view their story.'
  },
  es: {
    explore: 'Explorar Viajes',
    itinerary: 'Itinerario',
    matcher: 'Compañeros',
    messages: 'Mensajes',
    activities: 'Actividades',
    costs: 'Costos del Viaje',
    map: 'Mapa de Ubicación',
    stories: 'Historias y Consejos',
    profile: 'Mi Perfil',
    settings: 'Ajustes',
    sosHelp: 'Ayuda SOS',
    soloGroupTravel: 'Viajes Solo en Grupo',
    searchCompanions: 'Buscar compañeros de viaje...',
    durationOfStay: 'Duración de la estancia',
    days: 'Días',
    nights: 'Noches',
    openToPublic: 'Abierto al Público (Cambiar en Ajustes)',
    companionGoals: 'Objetivos de compañerismo (opcional)',
    travelPlanning: 'Planificación de Viaje',
    addAnotherDay: 'Añadir Otro Día',
    totalBudget: 'Presupuesto Total',
    totalSoloSpent: 'Gasto Individual Total',
    budgetRemaining: 'Presupuesto Restante',
    shareProfile: 'Compartir Tu Perfil',
    emergencyContacts: 'Contactos de Emergencia',
    relationshipToTraveler: 'Relación con el Viajero (opcional)',
    firstName: 'Nombre',
    middleName: 'Segundo Nombre (opcional)',
    lastName: 'Apellido',
    noMoreUpcomingTrips: 'No hay más viajes próximos :((',
    interactiveMeetups: 'Viajeros Solitarios Conectando en el Mundo',
    interactiveMeetupsSubtitle: 'Momentos reales de viajeros que se unen para aventuras compartidas.'
  },
  fr: {
    explore: 'Explorer Voyages',
    itinerary: 'Itinéraire',
    matcher: 'Compagnons',
    messages: 'Messages',
    activities: 'Activités Partagées',
    costs: 'Frais de Voyage',
    map: 'Carte et Lieux',
    stories: 'Récits et Conseils',
    profile: 'Mon Profil',
    settings: 'Paramètres',
    sosHelp: 'Aide SOS',
    soloGroupTravel: 'Voyage Solo en Groupe',
    searchCompanions: 'Chercher des compagnons de voyage...',
    durationOfStay: 'Durée du Séjour',
    days: 'Jours',
    nights: 'Nuits',
    openToPublic: 'Ouvert au Public (Modifier dans Paramètres)',
    companionGoals: 'Objectifs de compagnonnage (optionnel)',
    travelPlanning: 'Planification de Voyage',
    addAnotherDay: 'Ajouter un Jour',
    totalBudget: 'Budget Total',
    totalSoloSpent: 'Dépenses Solo',
    budgetRemaining: 'Budget Restant',
    shareProfile: 'Partager Votre Profil',
    emergencyContacts: 'Contacts d\'Urgence',
    relationshipToTraveler: 'Relation avec le voyageur (optionnel)',
    firstName: 'Prénom',
    middleName: 'Deuxième prénom (optionnel)',
    lastName: 'Nom',
    noMoreUpcomingTrips: 'Plus de voyages à venir :((',
    interactiveMeetups: 'Voyageurs Solitaires Réunis dans le Monde',
    interactiveMeetupsSubtitle: 'Moments authentiques de voyageurs se rencontrant pour des aventures partagées.'
  },
  de: {
    explore: 'Reisen Entdecken',
    itinerary: 'Reiseplan',
    matcher: 'Reisepartner',
    messages: 'Nachrichten',
    activities: 'Aktivitäten',
    costs: 'Reisekosten',
    map: 'Standortkarte',
    stories: 'Geschichten & Tipps',
    profile: 'Mein Profil',
    settings: 'Einstellungen',
    sosHelp: 'SOS Hilfe',
    soloGroupTravel: 'Solo-Gruppenreisen',
    searchCompanions: 'Reisebegleiter suchen...',
    durationOfStay: 'Aufenthaltsdauer',
    days: 'Tage',
    nights: 'Nächte',
    openToPublic: 'Öffentlich sichtbar (in Einstellungen ändern)',
    companionGoals: 'Begleiter-Ziele (optional)',
    travelPlanning: 'Reiseplanung',
    addAnotherDay: 'Weiteren Tag Hinzufügen',
    totalBudget: 'Gesamtbudget',
    totalSoloSpent: 'Solo Ausgaben',
    budgetRemaining: 'Verbleibendes Budget',
    shareProfile: 'Profil Teilen',
    emergencyContacts: 'Notfallkontakte',
    relationshipToTraveler: 'Beziehung zum Reisenden (optional)',
    firstName: 'Vorname',
    middleName: 'Zweiter Vorname (optional)',
    lastName: 'Nachname',
    noMoreUpcomingTrips: 'Keine weiteren bevorstehenden Reisen :((',
    interactiveMeetups: 'Alleinreisende Treffen Sich Weltweit',
    interactiveMeetupsSubtitle: 'Echte Momente von Alleinreisenden für gemeinsame Abenteuer.'
  },
  ja: {
    explore: '旅を探す',
    itinerary: '旅程',
    matcher: '旅仲間を探す',
    messages: 'メッセージ',
    activities: '共同アクティビティ',
    costs: '旅費・割り勘',
    map: '位置マップ',
    stories: '旅行記・ヒント',
    profile: 'マイプロフィール',
    settings: '設定',
    sosHelp: 'SOS救護',
    soloGroupTravel: 'ソロ旅・グループ合流',
    searchCompanions: '旅仲間を検索...',
    durationOfStay: '滞在期間',
    days: '日間',
    nights: '泊',
    openToPublic: '一般公開中（設定で変更可能）',
    companionGoals: '同行の目的（任意）',
    travelPlanning: '旅行計画',
    addAnotherDay: '日程を追加',
    totalBudget: '合計予算',
    totalSoloSpent: '個人支出合計',
    budgetRemaining: '予算残高',
    shareProfile: 'プロフィールを共有',
    emergencyContacts: '緊急連絡先',
    relationshipToTraveler: '旅行者との関係（任意）',
    firstName: '名',
    middleName: 'ミドルネーム（任意）',
    lastName: '姓',
    noMoreUpcomingTrips: '今後の予定はありません :((',
    interactiveMeetups: '世界中で出会う一人旅の仲間たち',
    interactiveMeetupsSubtitle: '一人旅同士が合流して一緒に食事や散策を楽しむ瞬間。'
  },
  zh: {
    explore: '探索行程',
    itinerary: '旅行计划',
    matcher: '寻找同伴',
    messages: '消息',
    activities: '共同活动',
    costs: '旅行费用',
    map: '定位足迹',
    stories: '攻略与手记',
    profile: '个人主页',
    settings: '应用设置',
    sosHelp: '紧急SOS',
    soloGroupTravel: '独自旅行搭子平台',
    searchCompanions: '搜索旅行搭子...',
    durationOfStay: '停留时长',
    days: '天',
    nights: '晚',
    openToPublic: '公开可见（可在设置中更改）',
    companionGoals: '同行目标（选填）',
    travelPlanning: '旅行规划',
    addAnotherDay: '增加一天',
    totalBudget: '总预算',
    totalSoloSpent: '个人已支出',
    budgetRemaining: '剩余预算',
    shareProfile: '分享个人主页',
    emergencyContacts: '紧急联系人',
    relationshipToTraveler: '与旅行者关系（选填）',
    firstName: '名',
    middleName: '中间名（选填）',
    lastName: '姓',
    noMoreUpcomingTrips: '暂无更多行程 :((',
    interactiveMeetups: '全球独自旅行者结伴瞬间',
    interactiveMeetupsSubtitle: '独自旅行者在世界各地相遇、拼车、探索美食的真实互动。'
  }
};

export function getTranslation(key: string, lang?: string): string {
  const currentLang = (lang || localStorage.getItem('wanderlust_app_lang') || 'en') as AppLanguage;
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
}

export function playAudioAlert() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pleasant dual chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.warn('Web Audio playback error:', e);
  }
}
