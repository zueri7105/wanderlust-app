export type SupportedLanguage = 'en' | 'es' | 'zh' | 'ja' | 'fr' | 'de';

export interface Translations {
  explore: string;
  itinerary: string;
  companions: string;
  messages: string;
  activities: string;
  tripCost: string;
  travelMap: string;
  storiesHub: string;
  profile: string;
  settings: string;
  sosHelp: string;
  search: string;
  femaleOnly: string;
  popularDestinations: string;
  upcomingTrips: string;
  noUpcomingTrips: string;
  planNewTrip: string;
  saveChanges: string;
  cancel: string;
  addDay: string;
  travelPlanning: string;
  durationOfStay: string;
  confirmedBuddy: string;
  shareProfile: string;
  editBudget: string;
  totalBudget: string;
  budgetRemaining: string;
  soloSpent: string;
  addMemory: string;
  leaveReview: string;
  emergencyContacts: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    explore: 'Explore Trips',
    itinerary: 'Itinerary',
    companions: 'Find Companions',
    messages: 'Messages',
    activities: 'Shared Activities',
    tripCost: 'Trip Cost',
    travelMap: 'Travel Map',
    storiesHub: 'Stories & Tips',
    profile: 'My Profile',
    settings: 'Settings',
    sosHelp: 'SOS Help',
    search: 'Search',
    femaleOnly: 'Female Companions Only Filter',
    popularDestinations: 'Popular Solo Destinations',
    upcomingTrips: 'Your Upcoming Trips',
    noUpcomingTrips: 'No more upcoming trips :((',
    planNewTrip: 'Plan New Itinerary',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    addDay: 'Add Another Day',
    travelPlanning: 'Travel Planning',
    durationOfStay: 'Duration of Stay',
    confirmedBuddy: 'Confirmed Travel Buddy',
    shareProfile: 'Share your profile',
    editBudget: 'Edit Budget',
    totalBudget: 'Total Target Budget',
    budgetRemaining: 'Budget Remaining',
    soloSpent: 'Solo Spent',
    addMemory: 'Add Travel Memory',
    leaveReview: 'Rate & Review Companion',
    emergencyContacts: 'Emergency Contacts'
  },
  es: {
    explore: 'Explorar Viajes',
    itinerary: 'Itinerario',
    companions: 'Compañeros',
    messages: 'Mensajes',
    activities: 'Actividades',
    tripCost: 'Costos del Viaje',
    travelMap: 'Mapa de Viaje',
    storiesHub: 'Historias y Consejos',
    profile: 'Mi Perfil',
    settings: 'Ajustes',
    sosHelp: 'Ayuda SOS',
    search: 'Buscar',
    femaleOnly: 'Filtro Solo Compañeras',
    popularDestinations: 'Destinos Populares',
    upcomingTrips: 'Tus Próximos Viajes',
    noUpcomingTrips: 'No hay más viajes próximos :((',
    planNewTrip: 'Planificar Itinerario',
    saveChanges: 'Guardar Cambios',
    cancel: 'Cancelar',
    addDay: 'Añadir Otro Día',
    travelPlanning: 'Planificación del Viaje',
    durationOfStay: 'Duración de la Estancia',
    confirmedBuddy: 'Compañero Confirmado',
    shareProfile: 'Compartir tu perfil',
    editBudget: 'Editar Presupuesto',
    totalBudget: 'Presupuesto Total',
    budgetRemaining: 'Presupuesto Restante',
    soloSpent: 'Gasto Individual',
    addMemory: 'Añadir Recuerdo',
    leaveReview: 'Calificar Compañero',
    emergencyContacts: 'Contactos de Emergencia'
  },
  zh: {
    explore: '探索旅行',
    itinerary: '行程规划',
    companions: '寻找旅伴',
    messages: '消息沟通',
    activities: '拼团活动',
    tripCost: '费用预算',
    travelMap: '旅行地图',
    storiesHub: '攻略与见闻',
    profile: '个人主页',
    settings: '设置中心',
    sosHelp: '紧急求助 SOS',
    search: '搜索',
    femaleOnly: '仅限女性旅伴筛选',
    popularDestinations: '热门目的地',
    upcomingTrips: '你的近期行程',
    noUpcomingTrips: '暂无更多近期行程 :((',
    planNewTrip: '制定新行程',
    saveChanges: '保存更改',
    cancel: '取消',
    addDay: '添加另一天',
    travelPlanning: '行程制定',
    durationOfStay: '停留天数',
    confirmedBuddy: '已确认结伴旅伴',
    shareProfile: '分享你的个人主页',
    editBudget: '修改总预算',
    totalBudget: '总目标预算',
    budgetRemaining: '剩余可用预算',
    soloSpent: '个人已支出',
    addMemory: '记录旅行足迹',
    leaveReview: '评价旅伴',
    emergencyContacts: '紧急联系人'
  },
  ja: {
    explore: '旅行を探す',
    itinerary: '旅程プラン',
    companions: '旅仲間を探す',
    messages: 'メッセージ',
    activities: '共同アクティビティ',
    tripCost: '旅費・割り勘',
    travelMap: 'トラベルマップ',
    storiesHub: '体験談＆コツ',
    profile: 'プロフィール',
    settings: '設定',
    sosHelp: '緊急SOS',
    search: '検索',
    femaleOnly: '女性同伴者のみフィルター',
    popularDestinations: '人気の目的地',
    upcomingTrips: '今後の旅行計画',
    noUpcomingTrips: '今後の旅行予定はありません :((',
    planNewTrip: '新規旅程を作成',
    saveChanges: '変更を保存',
    cancel: 'キャンセル',
    addDay: '日数を追加',
    travelPlanning: '旅程プランニング',
    durationOfStay: '滞在日数',
    confirmedBuddy: '確定した旅仲間',
    shareProfile: 'プロフィールを共有',
    editBudget: '予算を編集',
    totalBudget: '総予算目標',
    budgetRemaining: '残りの予算',
    soloSpent: '個人支出合計',
    addMemory: '思い出を記録',
    leaveReview: '旅仲間を評価',
    emergencyContacts: '緊急連絡先'
  },
  fr: {
    explore: 'Explorer',
    itinerary: 'Itinéraire',
    companions: 'Compagnons',
    messages: 'Messages',
    activities: 'Activités',
    tripCost: 'Budget & Frais',
    travelMap: 'Carte de Voyage',
    storiesHub: 'Récits & Astuces',
    profile: 'Mon Profil',
    settings: 'Paramètres',
    sosHelp: 'Aide SOS',
    search: 'Rechercher',
    femaleOnly: 'Filtre Compagnes Uniquement',
    popularDestinations: 'Destinations Populaires',
    upcomingTrips: 'Vos Prochains Voyages',
    noUpcomingTrips: 'Plus de voyages à venir :((',
    planNewTrip: 'Planifier un Itinéraire',
    saveChanges: 'Enregistrer',
    cancel: 'Annuler',
    addDay: 'Ajouter un Jour',
    travelPlanning: 'Planification du Voyage',
    durationOfStay: 'Durée du Séjour',
    confirmedBuddy: 'Compagnon Confirmé',
    shareProfile: 'Partager votre profil',
    editBudget: 'Modifier le Budget',
    totalBudget: 'Budget Total Ciblé',
    budgetRemaining: 'Budget Restant',
    soloSpent: 'Dépenses Solo',
    addMemory: 'Ajouter un Souvenir',
    leaveReview: 'Évaluer le Compagnon',
    emergencyContacts: 'Contacts d\'Urgence'
  },
  de: {
    explore: 'Reisen Entdecken',
    itinerary: 'Reiseplan',
    companions: 'Reisepartner',
    messages: 'Nachrichten',
    activities: 'Aktivitäten',
    tripCost: 'Reisekosten',
    travelMap: 'Reisekarte',
    storiesHub: 'Reiseberichte & Tipps',
    profile: 'Mein Profil',
    settings: 'Einstellungen',
    sosHelp: 'SOS Notruf',
    search: 'Suchen',
    femaleOnly: 'Nur Weibliche Begleiterinnen Filter',
    popularDestinations: 'Beliebte Reiseziele',
    upcomingTrips: 'Deine Anstehenden Reisen',
    noUpcomingTrips: 'Keine weiteren Reisen anstehend :((',
    planNewTrip: 'Neuen Reiseplan Erstellen',
    saveChanges: 'Speichern',
    cancel: 'Abbrechen',
    addDay: 'Weiteren Tag Hinzufügen',
    travelPlanning: 'Reiseplanung',
    durationOfStay: 'Aufenthaltsdauer',
    confirmedBuddy: 'Bestätigter Reisepartner',
    shareProfile: 'Dein Profil teilen',
    editBudget: 'Budget Bearbeiten',
    totalBudget: 'Gesamtzielbudget',
    budgetRemaining: 'Verbleibendes Budget',
    soloSpent: 'Solo Ausgaben',
    addMemory: 'Reiseerinnerung Hinzufügen',
    leaveReview: 'Reisepartner Bewerten',
    emergencyContacts: 'Notfallkontakte'
  }
};

export function convertTemperature(celsiusStr: string, unitSystem: 'metric' | 'imperial'): string {
  if (unitSystem === 'metric') return celsiusStr;
  // Convert numbers found in string to Fahrenheit
  return celsiusStr.replace(/(\d+)\s*°?C/g, (_, num) => {
    const c = parseInt(num, 10);
    const f = Math.round((c * 9) / 5 + 32);
    return `${f}°F`;
  });
}

// Web Audio API chime generator for sound feedback
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    // AudioContext might be blocked until user gesture, ignore safely
  }
}
