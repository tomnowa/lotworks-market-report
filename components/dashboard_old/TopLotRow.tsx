'use client';

import type { TopLot } from '@/types';

interface TopLotRowProps {
  lot: TopLot;
  maxClicks: number;
}

export function TopLotRow({ lot, maxClicks }: TopLotRowProps) {
  const intensity = lot.clicks / maxClicks;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
          lot.rank <= 3
            ? 'bg-gradient-to-br from-lime-400 to-lime-500 text-slate-800'
            : 'bg-slate-100 text-slate-600'
        }`}
      >
        {lot.rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 truncate">{lot.lot}</div>
        <div className="text-xs text-slate-400">{lot.community}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-slate-800">{lot.clicks}</div>
        <div className="text-xs text-slate-400">{lot.share}%</div>
      </div>
      <div className="w-20">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
            style={{ width: `${intensity * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
