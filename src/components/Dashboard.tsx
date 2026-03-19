import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calendar, 
  Users, 
  Layers, 
  Users2, 
  Info, 
  ChevronDown, 
  Filter,
  RefreshCw,
  Search,
  MoreHorizontal,
  Clock,
  Layout,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  startOfYesterday, 
  endOfYesterday,
  isWithinInterval,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  subMonths
} from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type PeriodOption = 'current_month' | 'last_month' | 'last_7_days' | 'last_30_days' | 'last_60_days' | 'custom';

interface Filters {
  period: PeriodOption;
  customRange: { start: Date; end: Date };
  requesters: string[];
  assigned: string[];
  pipelines: string[];
  teams: string[];
  refreshInterval: number; // in minutes, 0 means off
  visibleCharts: string[];
}

// --- Mock Data ---

const REQUESTERS = ['João Silva', 'Maria Santos', 'Pedro Alves', 'Ana Costa', 'Lucas Pereira'];
const ASSIGNED = ['Ana Silva', 'Bruno Costa', 'Carlos Oliveira', 'Daniela Souza', 'Eduardo Lima'];
const PIPELINES = ['Atendimento', 'Faturamento', 'Logística', 'Suporte Técnico', 'Vendas'];
const TEAMS = ['Alpha', 'Beta', 'Gamma', 'Delta'];

const generateMockData = (filters: Filters) => {
  const now = new Date();
  let start: Date;
  let end: Date = endOfDay(now);

  switch (filters.period) {
    case 'current_month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    case 'last_7_days':
      start = startOfDay(subDays(now, 6));
      break;
    case 'last_30_days':
      start = startOfDay(subDays(now, 29));
      break;
    case 'last_60_days':
      start = startOfDay(subDays(now, 59));
      break;
    case 'custom':
      start = filters.customRange.start;
      end = filters.customRange.end;
      break;
    default:
      start = subDays(now, 7);
  }

  const days = eachDayOfInterval({ start, end });
  
  const dailyData = days.map(day => ({
    date: format(day, 'dd/MM'),
    fullDate: format(day, 'yyyy-MM-dd'),
    tokens: Math.floor(Math.random() * 500000) + 50000,
    pages: Math.floor(Math.random() * 2000) + 200,
    executions: Math.floor(Math.random() * 200) + 20,
    consumption: Math.floor(Math.random() * 1000) + 100,
    documents: Math.floor(Math.random() * 500) + 50,
    notifications: Math.floor(Math.random() * 1000) + 100,
    whatsapp: Math.floor(Math.random() * 400),
    email: Math.floor(Math.random() * 300),
    sms: Math.floor(Math.random() * 200),
    others: Math.floor(Math.random() * 100),
  }));

  const agents = ['GPT-4o', 'Claude 3.5', 'Gemini 1.5', 'Llama 3.1'];
  const agentsData = agents.map(name => ({
    name,
    value: Math.floor(Math.random() * 5000) + 500
  })).sort((a, b) => b.value - a.value);

  const assignedRanking = ASSIGNED.map(name => ({
    name,
    value: Math.floor(Math.random() * 1000) + 100
  })).sort((a, b) => b.value - a.value);

  const requestersRanking = REQUESTERS.map(name => ({
    name,
    value: Math.floor(Math.random() * 2000) + 200
  })).sort((a, b) => b.value - a.value);

  return {
    daily: dailyData,
    agents: agentsData,
    assigned: assignedRanking,
    requesters: requestersRanking
  };
};

// --- Components ---

const FilterButton = ({ 
  label, 
  icon: Icon, 
  active, 
  onClick,
  count
}: { 
  label: string; 
  icon: any; 
  active?: boolean; 
  onClick?: () => void;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
      active 
        ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300" 
        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
    )}
  >
    <Icon size={16} className={active ? "text-indigo-500" : "text-slate-400"} />
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-indigo-100 text-indigo-600 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
        {count}
      </span>
    )}
    <ChevronDown size={14} className="ml-1 opacity-50" />
  </button>
);

const Card = ({ 
  title, 
  info, 
  children, 
  className,
  summary,
  change,
  colorClass,
  legend
}: { 
  title: string; 
  info: string; 
  children: React.ReactNode; 
  className?: string;
  summary?: string;
  change?: string;
  colorClass?: string;
  legend?: React.ReactNode;
}) => (
  <div className={cn("bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col", className)}>
    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">{title}</h3>
        <div className="group relative">
          <Info size={14} className="text-slate-400 cursor-help hover:text-indigo-500 transition-colors" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {info}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800" />
          </div>
        </div>
      </div>
      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <MoreHorizontal size={16} />
      </button>
    </div>
    {(summary || change) && (
      <div className="px-4 pt-4 flex items-end justify-between">
        {summary && (
          <div>
            <h4 className={cn("text-2xl font-bold leading-tight", colorClass)}>{summary}</h4>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total do Período</p>
          </div>
        )}
        {change && (
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-1",
            change.startsWith('+') ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
          )}>
            {change}
          </span>
        )}
      </div>
    )}
    <div className="p-4 flex-grow">
      {children}
    </div>
    {legend && (
      <div className="px-4 py-2 border-t border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20">
        {legend}
      </div>
    )}
  </div>
);

const MultiSelectDropdown = ({ 
  options, 
  selected, 
  onChange, 
  isOpen, 
  onClose 
}: { 
  options: string[]; 
  selected: string[]; 
  onChange: (val: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
      {options.map(option => (
        <label 
          key={option} 
          className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <input 
            type="checkbox" 
            checked={selected.includes(option)}
            onChange={() => onChange(option)}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">{option}</span>
        </label>
      ))}
    </div>
  );
};

const ALL_CHARTS = [
  { id: 'tokens', title: 'Tokens', color: 'text-indigo-600', change: '+12%' },
  { id: 'pages', title: 'Páginas', color: 'text-emerald-600', change: '+5%' },
  { id: 'documents', title: 'Documentos', color: 'text-rose-600', change: '+15%' },
  { id: 'wtc', title: 'WTC', color: 'text-blue-600', change: '+8%' },
  { id: 'executions', title: 'Automações', color: 'text-amber-600', change: '-2%' },
  { id: 'notifications', title: 'Notificações', color: 'text-violet-600', change: '+20%' },
  { id: 'agents', title: 'Agentes IA', color: 'text-cyan-600', change: '+18%' },
  { id: 'assigned', title: 'Top Atribuídos', color: 'text-orange-600', change: '+5%' },
  { id: 'requesters', title: 'Top Solicitantes', color: 'text-fuchsia-600', change: '+2%' },
];

export default function Dashboard() {
  const [filters, setFilters] = useState<Filters>({
    period: 'last_7_days',
    customRange: { start: startOfDay(subDays(new Date(), 7)), end: endOfDay(new Date()) },
    requesters: [],
    assigned: [],
    pipelines: [],
    teams: [],
    refreshInterval: 0,
    visibleCharts: ALL_CHARTS.map(c => c.id)
  });

  const [chartOrder, setChartOrder] = useState<string[]>(ALL_CHARTS.map(c => c.id));
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call delay
    setTimeout(() => {
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }, 1500);
  };

  // Auto-refresh logic
  React.useEffect(() => {
    if (filters.refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      setLastRefresh(new Date());
      console.log('Auto-refreshing dashboard data...');
    }, filters.refreshInterval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [filters.refreshInterval]);

  const data = useMemo(() => generateMockData(filters), [filters, lastRefresh]);

  const totals = useMemo(() => {
    const sum = (key: string) => data.daily.reduce((acc, curr) => acc + (curr[key as keyof typeof curr] as number), 0);
    
    const formatValue = (val: number) => {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
      return val.toString();
    };

    return {
      tokens: formatValue(sum('tokens')),
      pages: formatValue(sum('pages')),
      executions: formatValue(sum('executions')),
      consumption: formatValue(sum('consumption')),
      documents: formatValue(sum('documents')),
      notifications: formatValue(sum('notifications')),
      agents: formatValue(data.agents.reduce((acc, curr) => acc + curr.value, 0)),
      assigned: data.assigned.length.toString(),
      requesters: data.requesters.length.toString(),
      wtc: formatValue(sum('consumption')),
    };
  }, [data]);

  const refreshOptions = [
    { label: 'Desativado', value: 0 },
    { label: '1 min', value: 1 },
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hora', value: 60 },
    { label: '2 horas', value: 120 },
    { label: '4 horas', value: 240 },
    { label: '6 horas', value: 360 },
    { label: '8 horas', value: 480 },
    { label: '12 horas', value: 720 },
  ];

  const toggleFilter = (type: keyof Filters, value: string) => {
    setFilters(prev => {
      const current = prev[type] as string[];
      const next = current.includes(value) 
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [type]: next };
    });
  };

  const periodLabels: Record<PeriodOption, string> = {
    current_month: 'Mês Atual',
    last_month: 'Mês Passado',
    last_7_days: 'Últimos 7 Dias',
    last_30_days: 'Últimos 30 Dias',
    last_60_days: 'Últimos 60 Dias',
    custom: 'Personalizado'
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-2 md:p-4 font-sans transition-colors duration-300 flex flex-col">
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full mb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Dashboard de Indicadores</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Análise de consumo e gestão de serviços.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
              Atualizado: {format(lastRefresh, 'HH:mm:ss')}
            </span>
            <button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all cursor-pointer",
                isRefreshing 
                  ? "bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-400" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
              )}
            >
              <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
              <span>{isRefreshing ? "Atualizando..." : "Atualizar Dados"}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-slate-400 mr-1">
            <Filter size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Filtros</span>
          </div>

          {/* Period Filter */}
          <div className="relative">
            <FilterButton 
              label={periodLabels[filters.period]} 
              icon={Calendar} 
              active={filters.period !== 'last_7_days'}
              onClick={() => setOpenDropdown(openDropdown === 'period' ? null : 'period')}
            />
            {openDropdown === 'period' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 py-1">
                {(Object.keys(periodLabels) as PeriodOption[]).map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setFilters(f => ({ ...f, period: opt }));
                      if (opt !== 'custom') setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                      filters.period === opt ? "text-indigo-600 font-semibold bg-indigo-50/50 dark:bg-indigo-900/20" : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {periodLabels[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Date Inputs */}
          {filters.period === 'custom' && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5">
              <input 
                type="date" 
                value={format(filters.customRange.start, 'yyyy-MM-dd')}
                onChange={(e) => setFilters(f => ({ ...f, customRange: { ...f.customRange, start: new Date(e.target.value) } }))}
                className="text-[10px] bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-400 p-0"
              />
              <span className="text-slate-300">|</span>
              <input 
                type="date" 
                value={format(filters.customRange.end, 'yyyy-MM-dd')}
                onChange={(e) => setFilters(f => ({ ...f, customRange: { ...f.customRange, end: new Date(e.target.value) } }))}
                className="text-[10px] bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-400 p-0"
              />
            </div>
          )}

          {/* Requester Filter */}
          <div className="relative">
            <FilterButton 
              label="Solicitante" 
              icon={Users} 
              count={filters.requesters.length}
              onClick={() => setOpenDropdown(openDropdown === 'requesters' ? null : 'requesters')}
            />
            <MultiSelectDropdown 
              options={REQUESTERS} 
              selected={filters.requesters} 
              onChange={(val) => toggleFilter('requesters', val)}
              isOpen={openDropdown === 'requesters'}
              onClose={() => setOpenDropdown(null)}
            />
          </div>

          {/* Assigned Filter */}
          <div className="relative">
            <FilterButton 
              label="Atribuído" 
              icon={Users} 
              count={filters.assigned.length}
              onClick={() => setOpenDropdown(openDropdown === 'assigned' ? null : 'assigned')}
            />
            <MultiSelectDropdown 
              options={ASSIGNED} 
              selected={filters.assigned} 
              onChange={(val) => toggleFilter('assigned', val)}
              isOpen={openDropdown === 'assigned'}
              onClose={() => setOpenDropdown(null)}
            />
          </div>

          {/* Pipeline Filter */}
          <div className="relative">
            <FilterButton 
              label="Esteira" 
              icon={Layers} 
              count={filters.pipelines.length}
              onClick={() => setOpenDropdown(openDropdown === 'pipelines' ? null : 'pipelines')}
            />
            <MultiSelectDropdown 
              options={PIPELINES} 
              selected={filters.pipelines} 
              onChange={(val) => toggleFilter('pipelines', val)}
              isOpen={openDropdown === 'pipelines'}
              onClose={() => setOpenDropdown(null)}
            />
          </div>

          {/* Team Filter */}
          <div className="relative">
            <FilterButton 
              label="Time" 
              icon={Users2} 
              count={filters.teams.length}
              onClick={() => setOpenDropdown(openDropdown === 'teams' ? null : 'teams')}
            />
            <MultiSelectDropdown 
              options={TEAMS} 
              selected={filters.teams} 
              onChange={(val) => toggleFilter('teams', val)}
              isOpen={openDropdown === 'teams'}
              onClose={() => setOpenDropdown(null)}
            />
          </div>

          {/* Refresh Timer Filter */}
          <div className="relative">
            <FilterButton 
              label={filters.refreshInterval === 0 ? "Auto-Refresh" : refreshOptions.find(o => o.value === filters.refreshInterval)?.label || "Auto-Refresh"} 
              icon={Clock} 
              active={filters.refreshInterval > 0}
              onClick={() => setOpenDropdown(openDropdown === 'refresh' ? null : 'refresh')}
            />
            {openDropdown === 'refresh' && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto">
                {refreshOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilters(f => ({ ...f, refreshInterval: opt.value }));
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                      filters.refreshInterval === opt.value ? "text-indigo-600 font-semibold bg-indigo-50/50 dark:bg-indigo-900/20" : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Charts Visibility Filter */}
          <div className="relative">
            <FilterButton 
              label="Gráficos" 
              icon={Layout} 
              count={filters.visibleCharts.length}
              onClick={() => setOpenDropdown(openDropdown === 'charts' ? null : 'charts')}
            />
            <MultiSelectDropdown 
              options={ALL_CHARTS.map(c => c.title)} 
              selected={ALL_CHARTS.filter(c => filters.visibleCharts.includes(c.id)).map(c => c.title)} 
              onChange={(title) => {
                const id = ALL_CHARTS.find(c => c.title === title)?.id;
                if (id) {
                  setFilters(prev => {
                    const next = prev.visibleCharts.includes(id)
                      ? prev.visibleCharts.filter(v => v !== id)
                      : [...prev.visibleCharts, id];
                    return { ...prev, visibleCharts: next };
                  });
                }
              }}
              isOpen={openDropdown === 'charts'}
              onClose={() => setOpenDropdown(null)}
            />
          </div>

          {/* Clear Filters */}
          {(filters.requesters.length > 0 || filters.assigned.length > 0 || filters.pipelines.length > 0 || filters.teams.length > 0 || filters.period !== 'last_7_days' || filters.refreshInterval > 0 || filters.visibleCharts.length !== ALL_CHARTS.length) && (
            <button 
              onClick={() => {
                setFilters({
                  period: 'last_7_days',
                  customRange: { start: startOfDay(subDays(new Date(), 7)), end: endOfDay(new Date()) },
                  requesters: [],
                  assigned: [],
                  pipelines: [],
                  teams: [],
                  refreshInterval: 0,
                  visibleCharts: ALL_CHARTS.map(c => c.id)
                });
                setChartOrder(ALL_CHARTS.map(c => c.id));
              }}
              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 ml-auto px-2"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className={cn("flex-grow transition-opacity duration-500", isRefreshing && "opacity-40 pointer-events-none")}>
        <Reorder.Group 
          axis="y" 
          values={chartOrder} 
          onReorder={setChartOrder}
          className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 h-full overflow-hidden"
        >
        <AnimatePresence mode="popLayout">
          {chartOrder.filter(id => filters.visibleCharts.includes(id)).map((chartId) => (
            <Reorder.Item 
              key={chartId} 
              value={chartId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              {chartId === 'tokens' && (
                <Card 
                  title="Tokens" 
                  info="Quantidade total de tokens de IA consumidos por dia."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.tokens}
                  change={ALL_CHARTS.find(c => c.id === 'tokens')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'tokens')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Tokens</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px', padding: '6px' }} />
                        <Bar dataKey="tokens" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {chartId === 'pages' && (
                <Card 
                  title="Páginas" 
                  info="Volume de páginas de documentos processadas diariamente."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.pages}
                  change={ALL_CHARTS.find(c => c.id === 'pages')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'pages')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Páginas</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px' }} />
                        <Area type="monotone" dataKey="pages" stroke="#10b981" fillOpacity={1} fill="url(#colorPages)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {chartId === 'documents' && (
                <Card 
                  title="Documentos" 
                  info="Quantidade diária de documentos processados."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.documents}
                  change={ALL_CHARTS.find(c => c.id === 'documents')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'documents')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Docs</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px' }} />
                        <Bar dataKey="documents" fill="#e11d48" radius={[2, 2, 0, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {chartId === 'executions' && (
                <Card 
                  title="Automações" 
                  info="Total de execuções de esteiras concluídas."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.executions}
                  change={ALL_CHARTS.find(c => c.id === 'executions')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'executions')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Execuções</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px' }} />
                        <Bar dataKey="executions" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {chartId === 'notifications' && (
                <Card 
                  title="Notificações" 
                  info="Notificações enviadas por canal (WhatsApp, Email, SMS, etc)."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.notifications}
                  change={ALL_CHARTS.find(c => c.id === 'notifications')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'notifications')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Notific.</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px' }} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '8px', paddingTop: '5px' }} />
                        <Bar dataKey="whatsapp" name="Zap" stackId="a" fill="#25d366" />
                        <Bar dataKey="email" name="Email" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="sms" name="SMS" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="others" name="Outros" stackId="a" fill="#94a3b8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {chartId === 'agents' && (
                <Card 
                  title="Agentes IA" 
                  info="Volume de processamento por agente de IA."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.agents}
                  change={ALL_CHARTS.find(c => c.id === 'agents')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'agents')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Agentes</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.agents} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} width={60} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px' }} />
                        <Bar dataKey="value" fill="#06b6d4" radius={[0, 2, 2, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {chartId === 'assigned' && (
                <Card 
                  title="Top Atribuídos" 
                  info="Usuários que mais utilizam a plataforma."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.assigned}
                  change={ALL_CHARTS.find(c => c.id === 'assigned')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'assigned')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Atribuídos</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.assigned} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} width={60} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px' }} />
                        <Bar dataKey="value" fill="#f97316" radius={[0, 2, 2, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {chartId === 'requesters' && (
                <Card 
                  title="Top Solicitantes" 
                  info="Solicitantes que mais utilizam a plataforma."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.requesters}
                  change={ALL_CHARTS.find(c => c.id === 'requesters')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'requesters')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Solicitantes</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.requesters} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} width={60} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px' }} />
                        <Bar dataKey="value" fill="#d946ef" radius={[0, 2, 2, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {chartId === 'wtc' && (
                <Card 
                  title="WTC" 
                  info="Métrica unificada de consumo computacional."
                  className="flex flex-col h-full relative group/card"
                  summary={totals.wtc}
                  change={ALL_CHARTS.find(c => c.id === 'wtc')?.change}
                  colorClass={ALL_CHARTS.find(c => c.id === 'wtc')?.color}
                  legend={
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">WTC</span>
                    </div>
                  }
                >
                  <div className="absolute top-3 right-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} className="text-slate-300" />
                  </div>
                  <div className="h-[120px] lg:h-[calc(28vh-60px)] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} dy={5} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '9px' }} />
                        <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2, fill: '#3b82f6', strokeWidth: 1, stroke: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto w-full mt-3 flex items-center justify-end text-[8px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-200 dark:border-slate-800 pt-2">
        <div className="flex items-center gap-2">
          <span>Dashboard v2.1.0</span>
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span>© 2026 Service Management</span>
        </div>
      </div>
    </div>
  );
}
