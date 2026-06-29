import { useState, useEffect } from "react";
import { 
  Bot, 
  Sparkles, 
  Plus, 
  Mic, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  Calendar, 
  Tag, 
  ArrowRight, 
  Lock, 
  Check, 
  Clock, 
  Volume2, 
  Zap, 
  Award, 
  Flame, 
  AlertCircle,
  HelpCircle,
  Loader2,
  ListTodo,
  TrendingUp,
  Sliders,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import FocusTimer from "./components/FocusTimer";
import AICoachChat from "./components/AICoachChat";
import TaskForm from "./components/TaskForm";
import AnalyticsCharts from "./components/AnalyticsCharts";
import { Task, Habit, Goal, SystemNotification, ChatMessage, UserSettings, AppState } from "./types";

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Core App State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    name: "Kishan Kumar",
    email: "kishankumar21817@gmail.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    sleepHoursStart: "23:00",
    sleepHoursEnd: "07:00",
    focusSessionDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    syncGoogleCalendar: true,
    theme: "dark"
  });

  // Navigation and UI controls
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeAgentName, setActiveAgentName] = useState<string | undefined>(undefined);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isSavingTask, setIsSavingTask] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // AI Chat states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Pomodoro/Statistics state
  const [focusStreak, setFocusStreak] = useState(0);

  // Load app state from Server DB on startup
  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const state: AppState = await res.json();
        setTasks(state.tasks || []);
        setHabits(state.habits || []);
        setGoals(state.goals || []);
        setNotifications(state.notifications || []);
        if (state.settings) setSettings(state.settings);
      }
    } catch (err) {
      console.error("Failed to load initial server state:", err);
    }
  };

  // Synchronize state changes back to server
  const syncStateWithServer = async (
    updatedTasks: Task[],
    updatedHabits: Habit[],
    updatedGoals: Goal[],
    updatedNotifications: SystemNotification[],
    updatedSettings: UserSettings
  ) => {
    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: updatedTasks,
          habits: updatedHabits,
          goals: updatedGoals,
          notifications: updatedNotifications,
          settings: updatedSettings
        })
      });
    } catch (err) {
      console.error("Failed to sync state with database server:", err);
    }
  };

  // Calculate dynamic productivity index score (0 - 100)
  const calculateProductivityScore = () => {
    if (tasks.length === 0) return 75;
    const completed = tasks.filter(t => t.completed).length;
    const completionWeight = tasks.length > 0 ? (completed / tasks.length) * 50 : 0;
    
    const highPriorityTasks = tasks.filter(t => t.priority === "high");
    const completedHigh = highPriorityTasks.filter(t => t.completed).length;
    const highWeight = highPriorityTasks.length > 0 ? (completedHigh / highPriorityTasks.length) * 20 : 15;
    
    const habitStreakWeight = Math.min(15, habits.reduce((acc, h) => acc + h.streak, 0) * 1.5);
    const focusWeight = Math.min(15, focusStreak * 5);
    
    return Math.round(completionWeight + highWeight + habitStreakWeight + focusWeight);
  };

  // Simulated Google Login Auth
  const handleGoogleLogin = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsAuthenticating(false);
      // Trigger Welcome Notification
      const welcomeAlert: SystemNotification = {
        id: `welcome_${Date.now()}`,
        type: "motivation",
        title: "DeadlineAI Core Synchronized",
        message: `Welcome back, Kishan. Google Workspace and Calendar pipelines mapped successfully. Multi-Agent reasoning ready.`,
        timestamp: new Date().toISOString(),
        read: false
      };
      const updatedNotifications = [welcomeAlert, ...notifications];
      setNotifications(updatedNotifications);
      syncStateWithServer(tasks, habits, goals, updatedNotifications, settings);
    }, 1500);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Manage Tasks: Save / Create / Edit
  const handleSaveTask = async (taskData: Omit<Task, "id">, runAIAgent: boolean) => {
    setIsSavingTask(true);
    
    let finalTask: Task = {
      id: editingTask ? editingTask.id : `task_${Date.now()}`,
      ...taskData
    };

    if (runAIAgent) {
      setActiveAgentName("Task Analyzer (Agent 1)");
      try {
        const res = await fetch("/api/agent/analyze-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData)
        });
        if (res.ok) {
          const aiAnalysis = await res.json();
          finalTask = {
            ...finalTask,
            estimatedDuration: aiAnalysis.estimatedDuration,
            complexity: aiAnalysis.complexity,
            difficulty: aiAnalysis.difficulty,
            riskScore: aiAnalysis.riskScore,
            riskExplanation: aiAnalysis.riskExplanation,
            executionStrategy: aiAnalysis.executionStrategy,
            // Merge generated subtasks
            subtasks: aiAnalysis.subtasks ? aiAnalysis.subtasks.map((st: any, i: number) => ({
              id: `sub_${Date.now()}_${i}`,
              title: st.title,
              completed: false,
              estimatedMinutes: st.estimatedMinutes
            })) : finalTask.subtasks
          };
          
          // Generate a custom proactive reminder from Agent 5
          setActiveAgentName("Reminder Agent (Agent 5)");
          const remRes = await fetch("/api/agent/generate-reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: finalTask, settings })
          });
          if (remRes.ok) {
            const aiReminder = await remRes.json();
            const newNotif: SystemNotification = {
              id: `notif_${Date.now()}`,
              type: finalTask.riskScore && finalTask.riskScore > 50 ? "risk" : "alert",
              title: aiReminder.title || "Intelligent Warning",
              message: aiReminder.message || "Proactive task risk evaluated.",
              timestamp: new Date().toISOString(),
              read: false
            };
            setNotifications(prev => [newNotif, ...prev]);
          }
        }
      } catch (err) {
        console.error("AI analysis failed, executing fallback storage.", err);
      } finally {
        setActiveAgentName(undefined);
      }
    }

    let updatedTasks: Task[];
    if (editingTask) {
      updatedTasks = tasks.map(t => t.id === editingTask.id ? finalTask : t);
    } else {
      updatedTasks = [finalTask, ...tasks];
    }

    setTasks(updatedTasks);
    setIsSavingTask(false);
    setShowTaskForm(false);
    setEditingTask(undefined);
    syncStateWithServer(updatedTasks, habits, goals, notifications, settings);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    syncStateWithServer(updated, habits, goals, notifications, settings);
  };

  const handleToggleTaskCompleted = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
          // Clear risk scores on completion
          riskScore: completed ? 0 : t.riskScore,
          riskExplanation: completed ? "Task completed successfully!" : t.riskExplanation
        };
      }
      return t;
    });
    setTasks(updated);
    syncStateWithServer(updated, habits, goals, notifications, settings);
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const updatedSub = t.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);
        const allCompleted = updatedSub.length > 0 && updatedSub.every(s => s.completed);
        return {
          ...t,
          subtasks: updatedSub,
          completed: allCompleted ? true : t.completed,
          completedAt: allCompleted ? new Date().toISOString() : t.completedAt
        };
      }
      return t;
    });
    setTasks(updated);
    syncStateWithServer(updated, habits, goals, notifications, settings);
  };

  // Voice command assistant triggering (e.g. "Create assignment...")
  const handleVoiceCommand = async (commandText: string) => {
    setActiveAgentName("Voice Assistant (Natural Language Parser)");
    try {
      const res = await fetch("/api/agent/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: commandText, settings })
      });
      if (res.ok) {
        const taskData = await res.json();
        // Automatically save task with full analyzer support
        await handleSaveTask(taskData, true);
        alert(`🎙️ Voice parsing complete! Added task: "${taskData.title}" with proactive subtasks.`);
      }
    } catch (err) {
      console.error("Voice parsing error:", err);
    } finally {
      setActiveAgentName(undefined);
    }
  };

  const triggerVoiceInterface = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Dictating fallback task.");
      handleVoiceCommand("Complete mathematics assignment due tomorrow evening");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => alert("🎙️ Listening... Say something like: 'Create chemistry project due tomorrow evening'");
    recognition.onerror = () => alert("Voice capturing timed out. Try speaking again.");
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      handleVoiceCommand(text);
    };
    recognition.start();
  };

  // Run Global Agent 4 Risk Re-evaluation
  const triggerRiskReevaluation = async () => {
    setActiveAgentName("Risk Prediction Agent (Agent 4)");
    try {
      const res = await fetch("/api/agent/predict-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, habits })
      });
      if (res.ok) {
        const riskReport = await res.json();
        
        // Push a critical risk briefing notification
        const riskAlert: SystemNotification = {
          id: `risk_${Date.now()}`,
          type: "risk",
          title: `Drift Risk Forecast: ${riskReport.riskLevel.toUpperCase()}`,
          message: riskReport.analysis,
          timestamp: new Date().toISOString(),
          read: false
        };
        const updatedNotifs = [riskAlert, ...notifications];
        setNotifications(updatedNotifs);
        syncStateWithServer(tasks, habits, goals, updatedNotifs, settings);
        
        // Change to dashboard and alert
        setActiveTab("dashboard");
        alert(`🚨 Risk Assessment Complete:\nPredicted missed deadlines: ${riskReport.predictedOverduePercentage}%\nAdvice: ${riskReport.analysis}`);
      }
    } catch (err) {
      console.error("Risk assessment failed:", err);
    } finally {
      setActiveAgentName(undefined);
    }
  };

  // Trigger Scheduling Agent (Agent 3) optimization
  const triggerScheduleOptimization = async () => {
    setActiveAgentName("Scheduling Agent (Agent 3)");
    try {
      const res = await fetch("/api/agent/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks, settings })
      });
      if (res.ok) {
        const scheduleResult = await res.json();
        const mapping = scheduleResult.schedule || {};
        
        const updatedTasks = tasks.map(t => {
          if (mapping[t.id]) {
            return { ...t, scheduledTime: mapping[t.id] };
          }
          return t;
        });

        const schedNotif: SystemNotification = {
          id: `sched_${Date.now()}`,
          type: "brief",
          title: "Schedule Optimized Successfully",
          message: "Agent 3 adjusted your starting timers to avoid conflict loops, integrating break windows.",
          timestamp: new Date().toISOString(),
          read: false
        };

        const updatedNotifs = [schedNotif, ...notifications];
        setTasks(updatedTasks);
        setNotifications(updatedNotifs);
        syncStateWithServer(updatedTasks, habits, goals, updatedNotifs, settings);
        alert("🗓️ Your schedule has been mathematically optimized. Tasks are mapped to non-conflicting times on the Calendar tab!");
      }
    } catch (err) {
      console.error("Schedule generation failed:", err);
    } finally {
      setActiveAgentName(undefined);
    }
  };

  // Chat agent callback
  const handleSendChatMessage = async (msgContent: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: msgContent,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory,
          userContext: {
            tasks: tasks.map(t => ({ title: t.title, deadline: t.deadline, completed: t.completed, risk: t.riskScore })),
            goals: goals.map(g => ({ title: g.title, progress: g.progress })),
            settings
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const coachMsg: ChatMessage = {
          id: `coach_${Date.now()}`,
          role: "model",
          content: data.text,
          timestamp: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, coachMsg]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Habits management
  const handleCompleteHabit = (habitId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const completedToday = h.history[todayStr] === true;
        const newHistory = { ...h.history, [todayStr]: !completedToday };
        const newStreak = !completedToday ? h.streak + 1 : Math.max(0, h.streak - 1);
        return {
          ...h,
          history: newHistory,
          streak: newStreak,
          lastCompleted: !completedToday ? new Date().toISOString() : h.lastCompleted
        };
      }
      return h;
    });
    setHabits(updated);
    syncStateWithServer(tasks, updated, goals, notifications, settings);
  };

  // Pomodoro Focus Log Complete
  const handleFocusTimerComplete = (minutes: number) => {
    setFocusStreak(prev => prev + 1);
    // Push completed focus block notification
    const focusNotif: SystemNotification = {
      id: `focus_${Date.now()}`,
      type: "motivation",
      title: "Focus Milestones Logged",
      message: `You completed a ${minutes}-minute focus segment! 15 AQ points injected to your productivity score.`,
      timestamp: new Date().toISOString(),
      read: false
    };
    const updatedNotifs = [focusNotif, ...notifications];
    setNotifications(updatedNotifs);
    syncStateWithServer(tasks, habits, goals, updatedNotifs, settings);
  };

  // Settings update
  const handleSaveSettings = (updatedSettings: UserSettings) => {
    setSettings(updatedSettings);
    syncStateWithServer(tasks, habits, goals, notifications, updatedSettings);
    alert("💾 Settings configuration cached on local disk.");
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-[#0A0A0B] text-[#E2E2E2] font-sans flex overflow-hidden">
      
      {/* 1. LANDING PAGE / LOGIN WALL */}
      {!isAuthenticated ? (
        <main id="landing-main" className="w-full min-h-screen relative overflow-y-auto flex flex-col justify-between py-12 px-6 bg-[#0A0A0B]">
          {/* Subtle elegant background ambient glow */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

          {/* Nav Header */}
          <header className="max-w-7xl mx-auto w-full flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                <Zap className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-display font-semibold text-lg text-white">DeadlineAI</span>
            </div>
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" /> Google Authentication
                </>
              )}
            </button>
          </header>

          {/* Hero Section */}
          <section className="max-w-4xl mx-auto text-center my-16 z-10 space-y-6">
            <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white tracking-tight leading-none">
              Finish Work. <br />
              <span className="text-indigo-400 italic font-serif">
                Stop Managing To-Do Lists.
              </span>
            </h1>
            <p className="text-sm md:text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
              DeadlineAI is the autonomous, multi-agent productivity teammate that actively parses instructions, builds execution blueprints, schedules break intervals, and predicts missed deadlines before they occur.
            </p>

            <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl cursor-pointer shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all"
              >
                Launch Companion <ArrowRight className="w-4 h-4" />
              </button>
              
              <a
                href="#features-section"
                className="px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm rounded-xl flex items-center justify-center transition-colors"
              >
                Explore Agent Core
              </a>
            </div>
          </section>

          {/* Core Features Grid */}
          <section id="features-section" className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 my-12 z-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Bot className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <h3 className="font-display font-semibold text-base text-white mb-2">Multi-Agent Assembly</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                9 specialized autonomous agents running collaboratively on Gemini Flash to plan, analyze, forecast, and schedule workload dependencies without user prompt overhead.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Activity className="w-4.5 h-4.5 text-purple-400" />
              </div>
              <h3 className="font-display font-semibold text-base text-white mb-2">Predictive Risk Forecasters</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Our Risk Prediction Agent compares remaining milestone volumes with past concentration indices to map exact delivery failure risks and draft immediate catch-up protocols.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Mic className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <h3 className="font-display font-semibold text-base text-white mb-2">Conversational Voice Parser</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Simply say "Chemistry reports due tomorrow morning." Our NLP parser structures the task scope, breaks down subtasks, and updates Google Calendar automatically.
              </p>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="max-w-3xl mx-auto w-full z-10 border-t border-slate-900/60 pt-16">
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-200">How is this different from a simple task manager?</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  To-do lists are passive. DeadlineAI is proactive. Instead of reminding you of a deadline, our agents reason through the complexity of tasks, formulate subtask structures, insert them directly into open schedule windows, and actively warn you of potential failures based on behavioral trends.
                </p>
              </div>
              <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl">
                <h4 className="text-sm font-semibold text-slate-200">What Google Cloud architectures are mapped?</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The application is fully prepared for serverless deployment on Google Cloud Run, backed by Gemini models, Firestore collections structures, and Google Calendar syncing parameters.
                </p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="max-w-7xl mx-auto w-full text-center border-t border-slate-900/80 pt-8 mt-12 z-10 text-xs text-slate-500">
            Deadline 2026
          </footer>
        </main>
      ) : (
        
        // 2. MAIN APPLICATION WORKSPACE (AUTHENTICATED)
        <>
          {/* Navigation Sidebar */}
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            settings={settings} 
            activeAgentName={activeAgentName}
            logout={handleLogout}
          />

          {/* Dashboard Canvas */}
          <main id="app-workspace" className="flex-1 h-screen overflow-y-auto bg-[#0A0A0B] p-8 space-y-6">
            
            {/* HEADER METRICS BAR */}
            <div id="header-metrics" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
              <div>
                <h2 className="font-display font-semibold text-xl text-white tracking-tight mt-1">
                  Productivity Dashboard
                </h2>
              </div>
              
              {/* Quick Actions Panel */}
              <div id="header-actions" className="flex flex-wrap gap-2.5">
                <button
                  onClick={triggerVoiceInterface}
                  className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                  title="Speak to add task"
                >
                  <Mic className="w-3.5 h-3.5 text-indigo-400" /> Voice Input
                </button>
                <button
                  onClick={triggerRiskReevaluation}
                  className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-[#FF453A] rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#FF453A]" /> Run Risk Assessment
                </button>
                <button
                  onClick={triggerScheduleOptimization}
                  className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-400 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" /> Optimize Schedule
                </button>
                <button
                  onClick={() => {
                    setEditingTask(undefined);
                    setShowTaskForm(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Compose Task
                </button>
              </div>
            </div>

            {/* DYNAMIC VIEWPORTS ROUTER */}
            <div id="tab-viewport-container" className="space-y-6">
              
              {/* === VIEW 1: DASHBOARD === */}
              {activeTab === "dashboard" && (
                <div id="dashboard-tab-grid" className="space-y-6">
                  {/* Proactive Agent Motivation banner */}
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 relative overflow-hidden flex justify-between items-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex gap-3.5 items-center">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Proactive Coach Motivation</span>
                        <p className="text-xs text-white/80 mt-1 max-w-2xl font-medium leading-relaxed">
                          "Your cognitive concentration values represent an 18% spike between 09:00 - 11:30. Ensure you lock your focus cycles into 'Vibe2Ship Hackathon Project' before the afternoon drift window."
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SVG Charts Widget */}
                  <AnalyticsCharts 
                    tasks={tasks} 
                    habits={habits} 
                    productivityScore={calculateProductivityScore()} 
                  />

                  {/* Main splits: Scheduled Plan vs Focus/Habits */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Today's Timeline Schedule */}
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
                      <div className="flex justify-between items-center">
                        <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-400" /> Today's Scheduled Plan
                        </h3>
                        <button 
                          onClick={() => setActiveTab("calendar")} 
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
                        >
                          View Full Map <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Active Scheduled items list */}
                      <div className="space-y-3">
                        {tasks.filter(t => !t.completed).length === 0 ? (
                          <div className="text-center py-10 bg-white/5 rounded-xl border border-dashed border-white/10">
                            <Check className="w-6 h-6 text-indigo-400 mx-auto mb-2 opacity-60" />
                            <p className="text-xs text-white/40">All scheduled tasks completed. Outstanding focus today!</p>
                          </div>
                        ) : (
                          tasks.filter(t => !t.completed).map((task) => (
                            <div 
                              key={task.id} 
                              className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:border-white/20 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                  {task.scheduledTime || "11:00"}
                                </span>
                                <div>
                                  <h4 className="text-xs font-semibold text-white">{task.title}</h4>
                                  <span className="text-[10px] text-white/40 block mt-0.5 font-medium">{task.category} &bull; {task.estimatedDuration || 45} mins</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleToggleTaskCompleted(task.id)}
                                className="p-1.5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-white/40 hover:text-emerald-400 rounded-lg cursor-pointer transition-all"
                                title="Mark Complete"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right widgets column */}
                    <div className="space-y-6">
                      {/* Pomodoro module */}
                      <FocusTimer onFocusComplete={handleFocusTimerComplete} initialMinutes={settings.focusSessionDuration} />

                      {/* Habit status Tracker */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
                        <div className="flex justify-between items-center">
                          <h4 className="font-display font-semibold text-xs text-white uppercase tracking-widest">Consistency Habits</h4>
                          <span className="text-[10px] text-white/40 font-mono font-bold uppercase">Streak Focus</span>
                        </div>
                        <div className="space-y-3">
                          {habits.map((habit) => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const completedToday = habit.history[todayStr] === true;
                            return (
                              <div key={habit.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl">
                                <div>
                                  <span className="text-xs font-semibold text-white block">{habit.name}</span>
                                  <span className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-amber-500" /> {habit.streak} day streak
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleCompleteHabit(habit.id)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                                    completedToday 
                                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                                      : "bg-white/5 border-white/10 hover:border-white/20 text-white/30"
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === VIEW 2: TASK HUB === */}
              {activeTab === "tasks" && (
                <div id="tasks-tab-viewport" className="space-y-5">
                  {/* Filter and search headers */}
                  <div className="glass-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                    <input
                      type="text"
                      placeholder="Search active prompts, tags, classes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-80 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                    />

                    <div className="flex gap-2 w-full md:w-auto">
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Priorities</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>

                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none"
                      >
                        <option value="all">All Categories</option>
                        <option value="Work">Corporate Work</option>
                        <option value="Academics">Academics</option>
                        <option value="Career">Career Planning</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Wellness">Wellness</option>
                        <option value="Personal">Personal</option>
                      </select>
                    </div>
                  </div>

                  {/* Tasks Grid List */}
                  <div className="space-y-4">
                    {tasks
                      .filter((t) => {
                        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
                        const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
                        const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
                        return matchesSearch && matchesPriority && matchesCategory;
                      })
                      .map((task) => (
                        <div 
                          key={task.id} 
                          className={`glass-card p-5 border relative overflow-hidden transition-all duration-300 ${
                            task.completed 
                              ? "bg-slate-950/10 border-slate-900/60 opacity-60" 
                              : "border-slate-800/80 hover:border-slate-700/60"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex gap-4">
                              {/* Custom checkbox */}
                              <button
                                onClick={() => handleToggleTaskCompleted(task.id)}
                                className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                                  task.completed 
                                    ? "bg-indigo-600 border-indigo-500 text-white" 
                                    : "border-slate-700 hover:border-indigo-500"
                                }`}
                              >
                                {task.completed && <Check className="w-3.5 h-3.5" />}
                              </button>

                              <div>
                                <h3 className={`text-sm font-semibold text-white ${task.completed ? "line-through text-slate-500" : ""}`}>
                                  {task.title}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                                
                                {/* Tags metadata row */}
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                    {task.category}
                                  </span>
                                  {task.priority === "high" && (
                                    <span className="text-[10px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/25 font-bold uppercase">
                                      High Alert
                                    </span>
                                  )}
                                  {task.tags.map((tag, i) => (
                                    <span key={i} className="text-[10px] font-mono text-slate-500">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Deadline, risk score indicators */}
                            <div className="text-right flex flex-col items-end gap-1.5">
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {task.deadline}
                              </span>
                              {!task.completed && task.riskScore !== undefined && (
                                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                                  task.riskScore > 60 
                                    ? "bg-red-500/10 border-red-500/25 text-red-400 animate-pulse" 
                                    : task.riskScore > 30 
                                      ? "bg-amber-500/10 border-amber-500/25 text-amber-400" 
                                      : "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                }`}>
                                  Risk Index: {task.riskScore}%
                                </span>
                              )}
                              
                              <div className="flex gap-1.5 mt-2">
                                <button
                                  onClick={() => {
                                    setEditingTask(task);
                                    setShowTaskForm(true);
                                  }}
                                  className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-[10px] font-semibold cursor-pointer"
                                >
                                  Modify
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="px-2 py-1 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-400 hover:text-red-300 rounded-lg text-[10px] font-semibold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* AI Blueprints Subtasks checklist drawer */}
                          {task.subtasks.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-slate-900/60 bg-slate-950/20 p-4 rounded-xl space-y-2.5">
                              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                                <Bot className="w-3.5 h-3.5 text-indigo-400" /> Granular Milestone Blueprints
                              </span>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {task.subtasks.map((st) => (
                                  <div 
                                    key={st.id} 
                                    className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-900/60"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <button
                                        onClick={() => handleToggleSubtask(task.id, st.id)}
                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                          st.completed 
                                            ? "bg-indigo-600 border-indigo-500 text-white" 
                                            : "border-slate-800 hover:border-indigo-500"
                                        }`}
                                      >
                                        {st.completed && <Check className="w-2.5 h-2.5" />}
                                      </button>
                                      <span className={`text-xs ${st.completed ? "line-through text-slate-500" : "text-slate-300"}`}>
                                        {st.title}
                                      </span>
                                    </div>
                                    {st.estimatedMinutes && (
                                      <span className="text-[9px] font-mono text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded">
                                        {st.estimatedMinutes}m
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* AI Execution advice */}
                              {task.executionStrategy && (
                                <div className="mt-4 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                                  <p className="text-[10px] font-mono text-slate-400">
                                    <strong className="text-indigo-400 font-semibold">Execution Strategy</strong>: {task.executionStrategy}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* === VIEW 3: INTELLICALENDAR === */}
              {activeTab === "calendar" && (
                <div id="calendar-tab-viewport" className="glass-card p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-display font-semibold text-lg text-white">IntelliCalendar Grid Mapping</h3>
                      <p className="text-xs text-slate-400 mt-1">Multi-Agent scheduling optimizer (Agent 3) schedules tasks inside fluid, non-conflicting hours.</p>
                    </div>
                    <button
                      onClick={triggerScheduleOptimization}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-semibold rounded-xl cursor-pointer shadow flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-Optimize Plan
                    </button>
                  </div>

                  {/* Calendar schedule timeline view */}
                  <div className="space-y-2">
                    {["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM", "08:00 PM"].map((hour, i) => {
                      // Find tasks scheduled at similar hour segments
                      const hourNum = parseInt(hour.substring(0, 2));
                      const isPm = hour.includes("PM");
                      const hour24 = isPm && hourNum !== 12 ? hourNum + 12 : !isPm && hourNum === 12 ? 0 : hourNum;
                      
                      const matchedTask = tasks.find(t => {
                        if (!t.scheduledTime) return false;
                        const tHour = parseInt(t.scheduledTime.split(":")[0]);
                        return Math.abs(tHour - hour24) <= 1;
                      });

                      return (
                        <div key={i} className="flex gap-4 p-4 bg-slate-950/20 border border-slate-900 rounded-xl hover:bg-slate-950/30 transition-colors">
                          <span className="w-20 text-xs font-mono font-bold text-slate-500 shrink-0 py-1">{hour}</span>
                          
                          <div className="flex-1">
                            {matchedTask ? (
                              <div className="p-3.5 rounded-xl border border-indigo-500/10 bg-indigo-500/5 flex justify-between items-center">
                                <div>
                                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/15">
                                    {matchedTask.scheduledTime}
                                  </span>
                                  <h4 className="text-xs font-bold text-white mt-2">{matchedTask.title}</h4>
                                  <span className="text-[10px] text-slate-400 mt-0.5 block">{matchedTask.category} &bull; Expected Duration: {matchedTask.estimatedDuration || 45} mins</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                                  Lock focus slot
                                </span>
                              </div>
                            ) : (
                              <div className="h-full border border-dashed border-slate-900/60 rounded-xl flex items-center justify-center p-3 text-slate-600 text-[11px] italic">
                                Break window / Workspace flow
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* === VIEW 4: IMPACT GOALS === */}
              {activeTab === "goals" && (
                <div id="goals-tab-viewport" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-display font-semibold text-lg text-white">Impact Goals & Deliverables</h3>
                      <p className="text-xs text-slate-400 mt-1">Track high-growth indicators of career application and hackathon deployments.</p>
                    </div>
                  </div>

                  {/* Bento grids for Goals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map((goal) => (
                      <div key={goal.id} className="glass-card p-5 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/15 uppercase font-bold tracking-wider">
                              {goal.category}
                            </span>
                            <h4 className="font-display font-bold text-sm text-slate-200 mt-2.5">{goal.title}</h4>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-900">
                            By {goal.targetDate}
                          </span>
                        </div>

                        {/* Progress slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">Impact Completed</span>
                            <span className="text-white font-bold">{goal.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${goal.progress}%` }}
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Subgoals checklist */}
                        <div className="space-y-2 pt-2 border-t border-slate-900/60">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold block mb-2">Milestone Indicators</span>
                          {goal.subGoals.map((sub, i) => (
                            <div key={i} className="flex gap-2.5 items-center text-xs p-2 bg-slate-950/30 border border-slate-900/50 rounded-lg">
                              <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="text-slate-300">{sub}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* === VIEW 5: AI COACH & CHAT === */}
              {activeTab === "coach" && (
                <div id="coach-tab-viewport" className="h-[75vh]">
                  <AICoachChat 
                    chatHistory={chatHistory} 
                    onSendMessage={handleSendChatMessage} 
                    isChatLoading={isChatLoading} 
                    userContext={{ tasks, habits }}
                    onClearHistory={() => setChatHistory([])}
                  />
                </div>
              )}

              {/* === VIEW 6: REPORTS === */}
              {activeTab === "reports" && (
                <div id="reports-tab-viewport" className="glass-card p-6 space-y-6">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-white">Daily & Weekly Active Coaching Reports</h3>
                    <p className="text-xs text-slate-400 mt-1">Study planners and habit coach diagnostics formulated by Agent 7 and Agent 8.</p>
                  </div>

                  {/* Summary of Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 text-center space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Objectives Established</span>
                      <p className="text-2xl font-bold text-white">{tasks.length}</p>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 text-center space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Objectives Completed</span>
                      <p className="text-2xl font-bold text-emerald-400">{tasks.filter(t => t.completed).length}</p>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 text-center space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Focus Streak (Blocks)</span>
                      <p className="text-2xl font-bold text-indigo-400">{focusStreak}</p>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 text-center space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Productivity AQ</span>
                      <p className="text-2xl font-bold text-pink-400">{calculateProductivityScore()}</p>
                    </div>
                  </div>

                  {/* Study Plan Template details generated by Study Planner (Agent 8) */}
                  <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-4">
                    <div className="flex gap-2 items-center">
                      <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <h4 className="font-display font-semibold text-sm text-slate-200">Study Planner Diagnostics (Agent 8)</h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      Weekly consistency rating sits at 84% based on active habit history. Mock test parameters and revision schedules are generated for high-priority tasks. To retain 95% retention indices on corporate hackathon modules:
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="flex gap-2.5 items-center p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-slate-300"><strong>Mock Test Schedule</strong>: Establish a 45-minute self-mock simulation block tomorrow at 11:00 AM.</span>
                      </div>
                      <div className="flex gap-2.5 items-center p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-slate-300"><strong>Active Recall Loop</strong>: Engage in spacing loops on Friday after finishing the initial demo pitch documentation.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === VIEW 7: SETTINGS === */}
              {activeTab === "settings" && (
                <div id="settings-tab-viewport" className="glass-card p-6 space-y-6 max-w-2xl">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-white">System Settings</h3>
                    <p className="text-xs text-slate-400 mt-1">Configure sleep cycles, working hours boundaries, and external Google APIs pipelines.</p>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveSettings(settings);
                  }} className="space-y-4 text-xs">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">User Display Name</label>
                        <input
                          type="text"
                          value={settings.name}
                          onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">User Verified Email</label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">Working Hours Core Start</label>
                        <input
                          type="text"
                          value={settings.workingHoursStart}
                          onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">Working Hours Core End</label>
                        <input
                          type="text"
                          value={settings.workingHoursEnd}
                          onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">Target Sleep Hours Start</label>
                        <input
                          type="text"
                          value={settings.sleepHoursStart}
                          onChange={(e) => setSettings({ ...settings, sleepHoursStart: e.target.value })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">Target Sleep Hours End</label>
                        <input
                          type="text"
                          value={settings.sleepHoursEnd}
                          onChange={(e) => setSettings({ ...settings, sleepHoursEnd: e.target.value })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">Focus Session Mins</label>
                        <input
                          type="number"
                          value={settings.focusSessionDuration}
                          onChange={(e) => setSettings({ ...settings, focusSessionDuration: parseInt(e.target.value) })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">Short Break Mins</label>
                        <input
                          type="number"
                          value={settings.shortBreakDuration}
                          onChange={(e) => setSettings({ ...settings, shortBreakDuration: parseInt(e.target.value) })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-400">Long Break Mins</label>
                        <input
                          type="number"
                          value={settings.longBreakDuration}
                          onChange={(e) => setSettings({ ...settings, longBreakDuration: parseInt(e.target.value) })}
                          className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-200 block">Synchronize Google Calendar API</span>
                        <span className="text-[10px] text-slate-500">Automatically push, edit, and delete scheduled blocks into Google Calendar.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.syncGoogleCalendar}
                          onChange={(e) => setSettings({ ...settings, syncGoogleCalendar: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-medium rounded-xl cursor-pointer shadow-md"
                    >
                      Save Parameters
                    </button>
                  </form>
                </div>
              )}
              
            </div>
          </main>
        </>
      )}

      {/* RENDER COMPOSER MODAL */}
      {showTaskForm && (
        <TaskForm 
          task={editingTask} 
          onSave={handleSaveTask} 
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(undefined);
          }} 
          isSaving={isSavingTask}
        />
      )}

    </div>
  );
}
