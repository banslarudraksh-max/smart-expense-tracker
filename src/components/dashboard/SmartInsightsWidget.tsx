import React from 'react';
import { Lightbulb, AlertTriangle, TrendingUp, Info, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface SmartInsightsWidgetProps {
  onNavigateToTransactions?: () => void;
}

export const SmartInsightsWidget: React.FC<SmartInsightsWidgetProps> = ({ onNavigateToTransactions }) => {
  const { smartInsights } = useFinance();

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
      case 'tip':
        return <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Smart Insights</h3>
            <p className="text-xs text-slate-400">Rule-based analytical heuristics</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Real Data Scanned</span>
      </div>

      <div className="space-y-3 flex-1">
        {smartInsights.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-6 text-center text-xs text-slate-500">
            Scanning ledger for spending patterns and category velocity...
          </div>
        ) : (
          smartInsights.slice(0, 3).map((insight) => (
            <div
              key={insight.id}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/60 transition-colors flex items-start gap-3"
            >
              {getIcon(insight.type)}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{insight.title}</h4>
                  {insight.metric && (
                    <span className="text-[11px] font-mono font-medium text-cyan-400 shrink-0">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{insight.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>Prepared for continuous ledger monitoring</span>
        {onNavigateToTransactions && (
          <button
            onClick={onNavigateToTransactions}
            className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium"
          >
            <span>View Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
