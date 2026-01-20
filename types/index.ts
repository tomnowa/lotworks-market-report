// Report data types

export interface Organization {
  name: string;
  clientId: string;
}

export interface DateRange {
  start: string;
  end: string;
  label: string;
}

export interface Summary {
  totalMapLoads: number;
  totalLotClicks: number;
  clickThroughRate: number;
  topCommunity: string;
  avgTimeOnMap?: string;
  mapLoadsChange?: number;
  lotClicksChange?: number;
  avgTimeChange?: number;
  clickRateChange?: number;
}

export interface CommunityPerformance {
  name: string;
  path: string;
  mapLoads: number;
  lotClicks: number;
  ctr: number;
  engagementRate?: number;
  bounceRate?: number;
  avgSessionDuration?: string;
  eventsPerSession?: number;
}

export interface TopLot {
  rank: number;
  lot: string;
  community: string;
  clicks: number;
  share: number;
}

export interface ViewOverTime {
  date: string;
  total: number;
  [community: string]: number | string;
}

export interface DayOfWeekData {
  day: string;
  clicks: number;
  dayIndex: number;
}

export interface DeviceData {
  device: string;
  users: number;
  percentage: number;
}

export interface CountryData {
  country: string;
  users: number;
  percentage: number;
}

export interface CityData {
  city: string;
  country: string;
  lat: number;
  lng: number;
  users: number;
  percentage: number;
}

export interface BrowserData {
  browser: string;
  users: number;
  percentage: number;
}

export interface OperatingSystemData {
  os: string;
  users: number;
  percentage: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  percentage: number;
}

export interface Insight {
  type: 'trending' | 'hot' | 'opportunity' | 'warning';
  title: string;
  description: string;
}

export interface MarketReport {
  organization: Organization;
  dateRange: DateRange;
  summary: Summary;
  communityPerformance: CommunityPerformance[];
  topLots: TopLot[];
  viewsOverTime: ViewOverTime[];
  clicksByDayOfWeek: DayOfWeekData[];
  deviceBreakdown: DeviceData[];
  countryBreakdown: CountryData[];
  cityBreakdown: CityData[];
  browserBreakdown: BrowserData[];
  osBreakdown: OperatingSystemData[];
  trafficSources: TrafficSource[];
  insights: Insight[];
}

export interface ClientOption {
  name: string;
  id: string;
}
