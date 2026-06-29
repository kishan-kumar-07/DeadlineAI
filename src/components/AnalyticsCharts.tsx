import { TrendingUp, Flame, Award, Calendar, ChevronRight } from "lucide-react";

interface AnalyticsChartsProps {
  tasks: any[];
  habits: any[];
  productivityScore: number;
}

export default function AnalyticsCharts({ tasks, habits, productivityScore }: AnalyticsChartsProps) {
  // 1. Completion stats
  const completedTasks = tasks.filter((t) => t.completed);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // 2. Category distributions
  const categories = ["Work", "Academics", "Career", "Hackathon", "Wellness", "Personal"];
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = tasks.filter((t) => t.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

  // 3. Simple Weekly Completion Mock (Mon-Sun)
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const tasksCompletedByDay = [3, 5, 2, 6, completedTasks.length + 1, completedTasks.length, completedTasks.length + 2];
  const maxDayCount = Math.max(...tasksCompletedByDay, 1);

  return (
    <div id="analytics-charts-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* 1. PRODUCTIVITY SCORE CIRCULAR GAUGE */}
      <div id="productivity-gauge-card" className="glass-card p-5 flex flex-col items-center justify-between h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-full flex items-center justify-between mb-4">
          <h4 className="font-display font-semibold text-sm text-slate-200">Productivity Index</h4>
          <TrendingUp className="w-4 h-4 text-indigo-400" />
        </div>

        {/* Circular gauge */}
        <div className="relative flex items-center justify-center my-4">
          <svg className="w-36 h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="54"
              stroke="#0f172a"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="72"
              cy="72"
              r="54"
              stroke="url(#gaugeGradient)"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * (1 - productivityScore / 100)}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-display font-bold text-white tracking-tight">{productivityScore}</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">AQ Rating</span>
          </div>
        </div>

        <div className="w-full text-center mt-3 p-2 bg-slate-950/40 rounded-xl border border-slate-900/60">
          <span className="text-[11px] text-slate-400 block leading-relaxed">
            {productivityScore >= 80 
              ? "🎯 Peak focus zone. Risk profile minimized."
              : productivityScore >= 50
                ? "⚡ High active consistency. Maintain focus blocks."
                : "⚠️ Drift warning. Trigger recovery schedulers."}
          </span>
        </div>
      </div>

      {/* 2. WEEKLY WORKLOAD COMPLETED (GLOWING BAR CHART) */}
      <div id="weekly-workload-card" className="glass-card p-5 flex flex-col justify-between h-full relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-full flex items-center justify-between mb-5">
          <h4 className="font-display font-semibold text-sm text-slate-200">Completed Workloads</h4>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Weekly View</span>
        </div>

        {/* Vector SVG bar chart */}
        <div className="flex items-end justify-between h-32 w-full px-2 gap-2 mt-2">
          {daysOfWeek.map((day, idx) => {
            const val = tasksCompletedByDay[idx];
            const pct = (val / maxDayCount) * 100;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 group">
                {/* Floating tooltips */}
                <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {val}
                </span>
                
                {/* Glass glowing bar */}
                <div className="w-full bg-slate-950 rounded-md h-24 flex items-end overflow-hidden border border-slate-900/50">
                  <div 
                    style={{ height: `${pct}%` }}
                    className="w-full bg-gradient-to-t from-indigo-600 via-purple-500 to-indigo-400 rounded-t-sm transition-all duration-1000 group-hover:brightness-110 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-2">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CATEGORY DISTRIBUTION DONUT MATRIX */}
      <div id="category-distribution-card" className="glass-card p-5 flex flex-col justify-between h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-full flex items-center justify-between mb-4">
          <h4 className="font-display font-semibold text-sm text-slate-200">Goal Alignment</h4>
          <Award className="w-4 h-4 text-indigo-400" />
        </div>

        {/* List of alignment percentages */}
        <div className="space-y-3 my-2 flex-1 flex flex-col justify-center">
          {categories.slice(0, 4).map((cat, idx) => {
            const count = categoryCounts[cat] || 0;
            const percentage = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
            
            const barColors = [
              "bg-indigo-500",
              "bg-purple-500",
              "bg-pink-500",
              "bg-emerald-500"
            ];

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{cat}</span>
                  <span className="font-mono text-slate-300 font-bold">{percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                  <div 
                    style={{ width: `${percentage}%` }}
                    className={`h-full ${barColors[idx]} rounded-full transition-all duration-1000`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
