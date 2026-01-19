'use client';

import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  accent = false 
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px] ${
        accent
          ? 'gradient-header text-white card-shadow-lg'
          : 'bg-white border border-slate-200 card-shadow'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${accent ? 'bg-lime-400/20' : 'bg-teal-500/10'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-lime-400' : 'text-teal-500'}`} />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold ${
              isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold mb-1 ${accent ? 'text-white' : 'text-slate-800'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className={`text-sm ${accent ? 'text-slate-300' : 'text-slate-500'}`}>{title}</div>
      {changeLabel && (
        <div className={`text-xs mt-2 ${accent ? 'text-slate-400' : 'text-slate-400'}`}>
          {changeLabel}
        </div>
      )}
    </div>
  );
}
