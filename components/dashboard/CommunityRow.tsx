'use client';

import type { CommunityPerformance } from '@/types';

interface CommunityRowProps {
  community: CommunityPerformance;
  maxLoads: number;
  maxClicks: number;
}

export function CommunityRow({ community, maxLoads, maxClicks }: CommunityRowProps) {
  const loadWidth = (community.mapLoads / maxLoads) * 100;
  const clickWidth = community.lotClicks > 0 ? (community.lotClicks / maxClicks) * 100 : 0;

  return (
    <div className="grid grid-cols-12 gap-4 py-4 items-center border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-lg">
      <div className="col-span-4">
        <div className="font-medium text-slate-800">{community.name}</div>
        <div className="text-xs text-slate-400 font-mono">{community.path}</div>
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700"
              style={{ width: `${loadWidth}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700 w-12 text-right">
            {community.mapLoads}
          </span>
        </div>
      </div>
      <div className="col-span-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-lime-400 to-lime-500 rounded-full transition-all duration-700"
              style={{ width: `${clickWidth}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700 w-12 text-right">
            {community.lotClicks}
          </span>
        </div>
      </div>
      <div className="col-span-2 text-right">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            community.ctr >= 100
              ? 'bg-emerald-100 text-emerald-700'
              : community.ctr > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {community.ctr.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
