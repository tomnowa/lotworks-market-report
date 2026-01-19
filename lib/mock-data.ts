import type { MarketReport } from '@/types';

export const MOCK_REPORT: MarketReport = {
  organization: {
    name: "Coastal Bend Lots",
    clientId: "coastal-bend-lots"
  },
  dateRange: {
    start: "Dec 21, 2025",
    end: "Jan 17, 2026",
    label: "Last 28 days"
  },
  summary: {
    totalMapLoads: 653,
    totalLotClicks: 996,
    clickThroughRate: 152.5,
    topCommunity: "Gemini",
    mapLoadsChange: 12.4,
    lotClicksChange: 8.7,
  },
  viewsOverTime: [
    { date: "Dec 21", total: 18, gemini: 8, kingsLanding: 5, villageAtKingsCrossing: 3 },
    { date: "Dec 23", total: 25, gemini: 12, kingsLanding: 7, villageAtKingsCrossing: 4 },
    { date: "Dec 25", total: 5, gemini: 2, kingsLanding: 1, villageAtKingsCrossing: 1 },
    { date: "Dec 27", total: 22, gemini: 10, kingsLanding: 6, villageAtKingsCrossing: 4 },
    { date: "Dec 29", total: 32, gemini: 14, kingsLanding: 9, villageAtKingsCrossing: 5 },
    { date: "Dec 31", total: 18, gemini: 8, kingsLanding: 5, villageAtKingsCrossing: 3 },
    { date: "Jan 02", total: 20, gemini: 9, kingsLanding: 6, villageAtKingsCrossing: 3 },
    { date: "Jan 04", total: 35, gemini: 16, kingsLanding: 10, villageAtKingsCrossing: 5 },
    { date: "Jan 06", total: 28, gemini: 12, kingsLanding: 8, villageAtKingsCrossing: 5 },
    { date: "Jan 08", total: 18, gemini: 8, kingsLanding: 5, villageAtKingsCrossing: 3 },
    { date: "Jan 10", total: 32, gemini: 14, kingsLanding: 9, villageAtKingsCrossing: 5 },
    { date: "Jan 12", total: 38, gemini: 17, kingsLanding: 11, villageAtKingsCrossing: 6 },
    { date: "Jan 14", total: 22, gemini: 10, kingsLanding: 6, villageAtKingsCrossing: 4 },
    { date: "Jan 16", total: 42, gemini: 19, kingsLanding: 12, villageAtKingsCrossing: 6 },
    { date: "Jan 17", total: 58, gemini: 26, kingsLanding: 17, villageAtKingsCrossing: 9 },
  ],
  communityPerformance: [
    { name: "Gemini", mapLoads: 279, lotClicks: 667, ctr: 239.1, path: "/maps/gemini" },
    { name: "Kings Landing", mapLoads: 178, lotClicks: 224, ctr: 125.8, path: "/maps/kingslanding" },
    { name: "Village at Kings Crossing", mapLoads: 90, lotClicks: 97, ctr: 107.8, path: "/maps/villagekingscrossing" },
    { name: "Starlight Estates", mapLoads: 39, lotClicks: 0, ctr: 0, path: "/maps/starlightestates" },
    { name: "Royal Oak", mapLoads: 34, lotClicks: 0, ctr: 0, path: "/maps/royaloak" },
    { name: "David Estates", mapLoads: 33, lotClicks: 8, ctr: 24.2, path: "/maps/davidestates" },
  ],
  topLots: [
    { rank: 1, lot: "Lot 12, Block 5, Phase 1", community: "Gemini", clicks: 79, share: 7.93 },
    { rank: 2, lot: "Lot 16, Block 2, Phase 1", community: "Gemini", clicks: 39, share: 3.92 },
    { rank: 3, lot: "Lot 5, Block 5, Phase 1", community: "Gemini", clicks: 39, share: 3.92 },
    { rank: 4, lot: "Lot 9, Block 4, Phase 1", community: "Gemini", clicks: 36, share: 3.61 },
    { rank: 5, lot: "Lot 12, Block 2, Phase 1", community: "Gemini", clicks: 35, share: 3.51 },
    { rank: 6, lot: "Lot 1, Block 4, Phase 1", community: "Gemini", clicks: 31, share: 3.11 },
    { rank: 7, lot: "Lot 10, Block 4, Phase 1", community: "Gemini", clicks: 31, share: 3.11 },
    { rank: 8, lot: "Lot 47, Block 4, Phase 9", community: "Kings Landing", clicks: 31, share: 3.11 },
    { rank: 9, lot: "Lot 15, Block 4, Phase 1", community: "Gemini", clicks: 29, share: 2.91 },
    { rank: 10, lot: "Lot 1, Block 2, Phase 1", community: "Gemini", clicks: 28, share: 2.81 },
  ],
  insights: [
    { 
      type: "trending", 
      title: "Gemini is surging", 
      description: "Map loads increased 45% in the last 7 days compared to the previous period." 
    },
    { 
      type: "hot", 
      title: "Lot 12, Block 5 is hot", 
      description: "This lot received 2x more clicks than the average, suggesting strong buyer interest." 
    },
    { 
      type: "opportunity", 
      title: "Kings Landing underperforming", 
      description: "High map loads but lower click-through rate. Consider updating lot information or pricing." 
    },
  ]
};

export const MOCK_CLIENTS = [
  "Coastal Bend Lots",
  "Sunrise Communities",
  "Heritage Homes",
  "Valley View Development",
];
