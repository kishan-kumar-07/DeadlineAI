import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Award, Flame, AlertCircle } from "lucide-react";

interface FocusTimerProps {
  onFocusComplete: (minutes: number) => void;
  initialMinutes?: number;
}

export default function FocusTimer({ onFocusComplete, initialMinutes = 25 }: FocusTimerProps) {
  const [sessionType, setSessionType] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const getSessionDuration = (type: typeof sessionType) => {
    switch (type) {
      case "focus": return initialMinutes * 60;
      case "shortBreak": return 5 * 60;
      case "longBreak": return 15 * 60;
    }
  };

  useEffect(() => {
    setSecondsLeft(getSessionDuration(sessionType));
    setIsActive(false);
  }, [sessionType, initialMinutes]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const handleSessionComplete = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (sessionType === "focus") {
      setCompletedSessions((prev) => prev + 1);
      onFocusComplete(initialMinutes);
      alert(`🎉 Exceptional effort! You have completed a ${initialMinutes}-minute focus block.`);
      setSessionType("shortBreak");
    } else {
      alert("🌴 Break completed! Ready to lock back into deep work?");
      setSessionType("focus");
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(getSessionDuration(sessionType));
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Circular progress calculations
  const totalDuration = getSessionDuration(sessionType);
  const percentage = totalDuration > 0 ? ((totalDuration - secondsLeft) / totalDuration) * 100 : 0;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div id="focus-timer-container" className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center relative overflow-hidden h-full shadow-lg">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Title */}
      <div className="w-full flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
          <Flame className="w-4.5 h-4.5 text-amber-500" /> Focus Engine
        </h3>
        <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          Streak: {completedSessions} Block{completedSessions !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5 mb-8 w-full">
        {(["focus", "shortBreak", "longBreak"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSessionType(type)}
            className={`flex-1 text-center py-2 px-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              sessionType === type
                ? "bg-white/10 border border-white/10 text-white shadow"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            {type === "focus" ? "Work Mode" : type === "shortBreak" ? "Short Break" : "Long Break"}
          </button>
        ))}
      </div>

      {/* Circular Timer Visual */}
      <div className="relative flex items-center justify-center mb-8">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Base trail */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="6"
            fill="transparent"
          />
          {/* Active indicator */}
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="#818cf8"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Floating countdown text inside the circle */}
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-mono font-bold tracking-tight text-white select-none">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono mt-1">
            {isActive ? "Deep Focus active" : "paused"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center mb-6">
        <button
          onClick={resetTimer}
          className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer text-white/40 hover:text-white"
          title="Reset Block"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-8 py-3.5 rounded-xl font-semibold shadow-lg transition-all cursor-pointer flex items-center gap-2 text-sm ${
            isActive
              ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/10"
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4 fill-white" /> Pause session
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> Start Block
            </>
          )}
        </button>
      </div>

      {/* Motivational Advice based on status */}
      <div className="w-full bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex gap-2.5 items-start">
        <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
        <div className="text-[11px] leading-relaxed text-white/60">
          {sessionType === "focus" ? (
            <span><strong>Coach Tip</strong>: Research shows 50-minute work segments followed by a 10-minute break optimize dopamine and maximize cognitive longevity. Avoid multi-tasking!</span>
          ) : (
            <span><strong>Coach Tip</strong>: Stand up, stretch, and focus your eyes on an object at least 20 feet away to relax visual strain and rebuild mental endurance.</span>
          )}
        </div>
      </div>
    </div>
  );
}
