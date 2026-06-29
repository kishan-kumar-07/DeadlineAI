import { useState, useEffect, FormEvent } from "react";
import { X, Plus, Trash2, Bot, Sparkles, Loader2, Calendar, Tag, AlertTriangle, Mic } from "lucide-react";
import { Task, SubTask } from "../types";

interface TaskFormProps {
  task?: Task; // If editing
  onSave: (taskData: Omit<Task, "id">, runAIAgent: boolean) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

export default function TaskForm({ task, onSave, onClose, isSaving }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("Work");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  const [subtasks, setSubtasks] = useState<Omit<SubTask, "id">[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  
  const [runAIAgents, setRunAIAgents] = useState(true);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDeadline(task.deadline);
      setPriority(task.priority);
      setCategory(task.category);
      setTags(task.tags);
      setSubtasks(task.subtasks.map(({ title, completed, estimatedMinutes }) => ({ title, completed, estimatedMinutes })));
      setRunAIAgents(false); // Default to false if just editing
    } else {
      // Create mode default deadline: tomorrow
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDeadline(tomorrow);
    }
  }, [task]);

  const addTag = () => {
    if (!tagsInput.trim()) return;
    if (!tags.includes(tagsInput.trim())) {
      setTags([...tags, tagsInput.trim()]);
    }
    setTagsInput("");
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle("");
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setDescription((prev) => (prev ? prev + " " + text : text));
    };

    recognition.start();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData: Omit<Task, "id"> = {
      title,
      description,
      deadline,
      priority,
      category,
      tags,
      completed: task ? task.completed : false,
      subtasks: subtasks.map((st, i) => ({ id: `st_${Date.now()}_${i}`, ...st })),
      attachments: task ? task.attachments : [],
      
      // Keep old AI stats unless we overwrite them
      estimatedDuration: task?.estimatedDuration,
      complexity: task?.complexity,
      difficulty: task?.difficulty,
      riskScore: task?.riskScore,
      riskExplanation: task?.riskExplanation,
      executionStrategy: task?.executionStrategy,
      scheduledTime: task?.scheduledTime,
      completedAt: task?.completedAt
    };

    await onSave(taskData, runAIAgents);
  };

  return (
    <div id="task-form-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div id="task-form-panel" className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative border border-slate-800 flex flex-col justify-between">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Heading */}
        <div className="mb-6">
          <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
            {task ? "Modify Actionable Task" : "Compose Intelligent Task"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            DeadlineAI's Multi-Agent architecture automatically designs schedule execution plans upon task initialization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400">Task Heading *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Chemistry Lab Report"
              className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none"
            />
          </div>

          {/* Description & Speech input */}
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-400 flex justify-between items-center">
              <span>Detailed Objective / Prompt Context</span>
              <button
                type="button"
                onClick={handleSpeechInput}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all cursor-pointer ${
                  isListening 
                    ? "bg-red-500/20 border-red-500/30 text-red-400" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic className="w-3 h-3" /> {isListening ? "Listening..." : "Dictate Prompt"}
              </button>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Elaborate details, links, key deliverables, and specific scoring requirements..."
              rows={3}
              className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none resize-none"
            />
          </div>

          {/* Row: Deadline, Priority, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Deadline Date
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Impact Priority</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-850 rounded-xl">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`text-center py-1.5 rounded-lg text-xs font-medium capitalize cursor-pointer transition-all ${
                      priority === p
                        ? p === "high"
                          ? "bg-red-500/10 border border-red-500/30 text-red-400"
                          : p === "medium"
                            ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                            : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Class/Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none"
              >
                <option value="Work">Corporate Work</option>
                <option value="Academics">Academics / School</option>
                <option value="Career">Career Planning</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Wellness">Wellness & Habits</option>
                <option value="Personal">Personal Errands</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" /> Context Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Press add tag..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500/20 text-indigo-400 text-xs font-medium rounded-xl cursor-pointer hover:bg-slate-850 transition-colors"
              >
                Add Tag
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] bg-slate-900 border border-slate-800/80 text-slate-300 font-mono"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="text-slate-500 hover:text-red-400"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Subtask Constructor */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-900">
            <label className="text-xs font-semibold text-slate-300 block mb-3">
              Subtask Deliverables (Required milestones)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="e.g. Read Chapter 3 introduction and summarize"
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="p-2.5 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl hover:bg-slate-850 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {subtasks.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {subtasks.map((st, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-900 rounded-lg text-xs"
                  >
                    <span className="text-slate-300">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(index)}
                      className="text-slate-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 italic block mt-1">
                No custom milestones added. Toggle "Consult AI Agent" to automatically generate a plan.
              </span>
            )}
          </div>

          {/* Toggle: Autonomous AI Core Engagement */}
          <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center justify-between">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Engage DeadlineAI Planning Core
                </span>
                <span className="text-[10px] text-slate-400">
                  Activates Agent 1 (Task Analyzer) & Agent 2 (Planning Agent) to estimate duration, complexity, risk score and synthesize granular subtask milestones on save.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={runAIAgents}
                onChange={(e) => setRunAIAgents(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
            </label>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-medium cursor-pointer text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 rounded-xl text-xs font-medium cursor-pointer text-white flex items-center gap-2 shadow-lg shadow-indigo-500/15"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Consolidating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-white/15" /> Establish Objective
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
