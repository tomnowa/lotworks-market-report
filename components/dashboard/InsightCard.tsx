'use client';

import { TrendingUp, Target, Layers } from 'lucide-react';
import type { Insight } from '@/types';
import { TrendingUp, Flame, Lightbulb, AlertTriangle } from 'lucide-react';

const iconMap = {
  trending: TrendingUp,
  hot: Flame,
  opportunity: Lightbulb,
  warning: AlertTriangle,
};

const bgColors = {
  trending: 'bg-emerald-50 border-emerald-200',
  hot: 'bg-orange-50 border-orange-200',
  opportunity: 'bg-blue-50 border-blue-200',
};

const iconColors = {
  trending: 'text-emerald-600 bg-emerald-100',
  hot: 'text-orange-600 bg-orange-100',
  opportunity: 'text-blue-600 bg-blue-100',
};

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const Icon = iconMap[insight.type];

  return (
    <div
      className={`rounded-xl p-4 border ${bgColors[insight.type]} transition-all duration-300 hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconColors[insight.type]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-slate-800 mb-1">{insight.title}</div>
          <div className="text-sm text-slate-600">{insight.description}</div>
        </div>
      </div>
    </div>
  );
}
