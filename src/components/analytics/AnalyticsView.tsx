import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Sector,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, IndianRupee, Award, ArrowUpRight, BarChart2, Wallet, Layers } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { computeAnalytics, CategorySpendingData, BalanceTrendPoint } from '../../lib/services/analyticsService';
import { renderCategoryIcon } from '../../lib/utils/iconMap';

export const AnalyticsView: React.FC = () => {
  const { transactions, categories } = useFinance();
  const { formatCurrency, formatDate, resolvedTheme } = useTheme();

  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  const analytics = useMemo(() => {
    return computeAnalytics(transactions, categories);
  }, [transactions, categories]);

  const totalCategorySpending = useMemo(() => {
    return analytics.categoryDistribution.reduce((acc, cat) => acc + cat.amount, 0);
  }, [analytics.categoryDistribution]);

  const activeCategory = activePieIndex !== null ? analytics.categoryDistribution[activePieIndex] : null;

  const latestBalance = useMemo(() => {
    if (analytics.balanceTrend.length === 0) return 0;
    return analytics.balanceTrend[analytics.balanceTrend.length - 1].balance;
  }, [analytics.balanceTrend]);

  const balanceStats = useMemo(() => {
    if (analytics.balanceTrend.length === 0) return { min: 0, max: 0, offset: 1, hasNegative: false };
    const vals = analytics.balanceTrend.map((d) => d.balance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const hasNegative = min < 0;
    const offset = max <= 0 ? 0 : min >= 0 ? 1 : max / (max - min);
    return { min, max, offset, hasNegative };
  }, [analytics.balanceTrend]);

  const yDomain = useMemo(() => {
    if (analytics.balanceTrend.length === 0) return ['auto', 'auto'];
    const vals = analytics.balanceTrend.map((d) => d.balance);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (min === max) {
      if (min === 0) return [-500, 500];
      if (min > 0) return [0, Math.ceil(min * 1.3)];
      return [Math.floor(min * 1.3), 0];
    }
    const padding = (max - min) * 0.12;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [analytics.balanceTrend]);

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisTextColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs font-mono">
          <p className="font-semibold text-white mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="flex items-center gap-2">
              <span className="capitalize">{entry.name}:</span>
              <span className="font-bold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const categoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategorySpendingData;
      return (
        <div className="p-2.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl text-xs font-mono">
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-semibold text-white">{item.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span>Amount:</span>
            <span className="font-bold text-white tabular-nums">{formatCurrency(item.amount)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-400 text-[11px] mt-0.5">
            <span>Allocation:</span>
            <span className="text-cyan-400 font-semibold">{item.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const balanceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as BalanceTrendPoint;
      if (!dataPoint) return null;
      const isIncome = dataPoint.type === 'income';
      const isPositive = dataPoint.balance >= 0;

      return (
        <div className="p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-xl shadow-2xl text-xs font-mono min-w-[210px]">
          <div className="flex items-center justify-between gap-3 text-slate-400 mb-2 pb-1.5 border-b border-slate-800">
            <span className="text-[11px] font-sans font-medium text-slate-400">Date</span>
            <span className="font-semibold text-white">
              {formatDate(dataPoint.date)}
              {dataPoint.time ? ` · ${dataPoint.time}` : ''}
            </span>
          </div>

          <div className="mb-2">
            <span className="text-[10px] text-slate-500 font-sans uppercase tracking-wider block mb-0.5">
              Description
            </span>
            <p className="text-white font-medium font-sans truncate text-xs">
              {dataPoint.description}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 py-1 border-t border-slate-800/80">
            <span className="text-slate-400 font-sans">Transaction:</span>
            <span className={`font-semibold tabular-nums ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isIncome ? '+' : '-'}{formatCurrency(dataPoint.amount)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-slate-800/80">
            <span className="text-slate-400 font-sans font-medium">Cumulative Balance:</span>
            <span className={`font-bold tabular-nums text-sm ${isPositive ? 'text-cyan-400' : 'text-rose-400'}`}>
              {formatCurrency(dataPoint.balance)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderActiveDonutShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={isDark ? '#090d16' : '#ffffff'}
          strokeWidth={2}
          cornerRadius={analytics.categoryDistribution.length > 1 ? 4 : 0}
        />
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Financial Analytics</h1>
        <p className="text-xs text-slate-400 mt-1">
          Deep telemetry and historical trend breakdown computed from Supabase records
        </p>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Average Daily Spend */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Avg. Daily Outflow</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {formatCurrency(analytics.averageDailySpending)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all logged operational days</p>
        </div>

        {/* Highest Expense */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Largest Single Expense</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums truncate">
            {analytics.highestExpense ? formatCurrency(analytics.highestExpense.amount) : formatCurrency(0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {analytics.highestExpense
              ? `${analytics.highestExpense.description} (${analytics.highestExpense.categoryName})`
              : 'No expenses recorded yet'}
          </p>
        </div>

        {/* Top Spending Category */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Leading Cost Center</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white truncate">
            {analytics.highestCategory ? analytics.highestCategory.name : 'N/A'}
          </div>
          <p className="text-[11px] text-cyan-400 font-mono mt-1">
            {analytics.highestCategory
              ? `${formatCurrency(analytics.highestCategory.amount)} (${analytics.highestCategory.percentage}% of spend)`
              : 'Add expenses to evaluate'}
          </p>
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Monthly Spending & Income Trend */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Monthly Cash Flow Trend</h3>
            <p className="text-xs text-slate-400">Income vs. Expense volume comparison</p>
          </div>

          <div className="h-64 w-full">
            {analytics.monthlyTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Awaiting multiple months of transactions...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" stroke={axisTextColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisTextColor} fontSize={11} tickLine={false} tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                  <Tooltip content={customTooltip} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 2. Category Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Category Distribution</h3>
              <p className="text-xs text-slate-400">Proportional expense allocation</p>
            </div>
            {analytics.categoryDistribution.length > 0 && (
              <span className="text-[11px] font-mono text-cyan-400 px-2.5 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-medium">
                {analytics.categoryDistribution.length} Categor{analytics.categoryDistribution.length === 1 ? 'y' : 'ies'}
              </span>
            )}
          </div>

          <div className="relative h-64 w-full flex items-center justify-center">
            {analytics.categoryDistribution.length === 0 ? (
              <div className="text-xs text-slate-500 flex flex-col items-center gap-2">
                <Layers className="w-8 h-8 text-slate-600 opacity-40" />
                <span>No categorized expenses recorded yet</span>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryDistribution}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={92}
                      paddingAngle={analytics.categoryDistribution.length > 1 ? 3 : 0}
                      {...({
                        activeIndex: activePieIndex !== null ? activePieIndex : undefined,
                        activeShape: renderActiveDonutShape,
                      } as any)}
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                      isAnimationActive={true}
                      animationDuration={850}
                      animationEasing="ease-out"
                    >
                      {analytics.categoryDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#090d16"
                          strokeWidth={2}
                          className="transition-all duration-200 cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={categoryTooltip} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center px-4">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 truncate max-w-[125px] transition-colors">
                    {activeCategory ? activeCategory.name : 'Total Spending'}
                  </span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-white tracking-tight tabular-nums mt-0.5">
                    {formatCurrency(activeCategory ? activeCategory.amount : totalCategorySpending)}
                  </span>
                  <span className="text-[10px] font-medium font-mono text-cyan-400 mt-0.5">
                    {activeCategory
                      ? `${activeCategory.percentage}% of expenses`
                      : `${analytics.categoryDistribution.length} Categor${analytics.categoryDistribution.length === 1 ? 'y' : 'ies'}`}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Clean Legend with Name + Percentage and Amount on Hover */}
          {analytics.categoryDistribution.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
              {analytics.categoryDistribution.map((cat, idx) => {
                const isActive = activePieIndex === idx;
                return (
                  <div
                    key={cat.name}
                    onMouseEnter={() => setActivePieIndex(idx)}
                    onMouseLeave={() => setActivePieIndex(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? 'bg-slate-800/90 border border-slate-700 shadow-sm'
                        : 'hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-slate-300 truncate font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                      <span className="text-slate-400 font-medium">{cat.percentage}%</span>
                      {isActive && (
                        <span className="text-cyan-400 font-semibold text-[10px] hidden sm:inline">
                          ({formatCurrency(cat.amount)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Cumulative Balance Trend */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Cumulative Balance Trend</h3>
              <p className="text-xs text-slate-400">Net equity progression across transaction sequence</p>
            </div>
            {analytics.balanceTrend.length > 0 && (
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Latest Net Balance
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
                      latestBalance >= 0 ? 'text-white' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(latestBalance)}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                      latestBalance >= 0
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {latestBalance >= 0 ? 'Surplus' : 'Deficit'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            {analytics.balanceTrend.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-2">
                <Wallet className="w-8 h-8 text-slate-600 opacity-40" />
                <span>No transaction data recorded yet</span>
                <p className="text-[11px] text-slate-600">
                  Add transactions to visualize your cumulative equity trajectory.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.balanceTrend}
                  margin={{ top: 12, right: 15, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="balanceSplitGradient" x1="0" y1="0" x2="0" y2="1">
                      {balanceStats.hasNegative && balanceStats.max > 0 ? (
                        <>
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                          <stop offset={`${balanceStats.offset * 100}%`} stopColor="#06b6d4" stopOpacity={0.05} />
                          <stop offset={`${balanceStats.offset * 100}%`} stopColor="#f43f5e" stopOpacity={0.05} />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.45} />
                        </>
                      ) : balanceStats.hasNegative ? (
                        <>
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.02} />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </>
                      )}
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke={axisTextColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: gridColor }}
                    tickFormatter={(d) => formatDate(d)}
                    padding={analytics.balanceTrend.length === 1 ? { left: 80, right: 80 } : { left: 12, right: 12 }}
                  />
                  <YAxis
                    stroke={axisTextColor}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={yDomain}
                    tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                  />
                  <Tooltip content={balanceTooltip} />
                  {balanceStats.hasNegative && (
                    <ReferenceLine
                      y={0}
                      stroke="#64748b"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                      label={{
                        value: '₹0 Baseline',
                        fill: '#94a3b8',
                        fontSize: 10,
                        position: 'insideBottomRight',
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Cumulative Balance"
                    stroke={
                      balanceStats.hasNegative && balanceStats.max <= 0
                        ? '#f43f5e'
                        : '#06b6d4'
                    }
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#balanceSplitGradient)"
                    dot={{
                      r: analytics.balanceTrend.length === 1 ? 6 : 3.5,
                      fill: balanceStats.hasNegative && balanceStats.max <= 0 ? '#f43f5e' : '#06b6d4',
                      stroke: '#0f172a',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: balanceStats.hasNegative && balanceStats.max <= 0 ? '#f43f5e' : '#06b6d4',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    isAnimationActive={true}
                    animationDuration={850}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 4. Category breakdown table */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Category Velocity Breakdown</h3>
            <p className="text-xs text-slate-400">Ranked by total spending</p>
          </div>

          <div className="overflow-y-auto max-h-64 divide-y divide-slate-800/60 pr-1">
            {analytics.categoryDistribution.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No expense entries available
              </div>
            ) : (
              analytics.categoryDistribution.map((cat, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-slate-200 font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono tabular-nums">
                    <span className="text-slate-400">{cat.percentage}%</span>
                    <span className="text-white font-semibold">{formatCurrency(cat.amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
