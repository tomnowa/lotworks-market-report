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
  mapLoadsChange?: number;
  lotClicksChange?: number;
}

export interface CommunityPerformance {
  name: string;
  path: string;
  mapLoads: number;
  lotClicks: number;
  ctr: number;
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

export interface Insight {
  type: 'trending' | 'hot' | 'opportunity';
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
  insights: Insight[];
}
