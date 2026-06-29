import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Bot, User, Sparkles, Volume2, Mic, CheckCircle, RotateCcw } from "lucide-react";
import { ChatMessage } from "../types";

interface AICoachChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (content: string) => void;
  isChatLoading: boolean;
  userContext: any;
  onClearHistory?: () => void;
}

export default function AICoachChat({ chatHistory, onSendMessage, isChatLoading, userContext, onClearHistory }: AICoachChatProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechActive, setSpeechActive] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isChatLoading]);

  const handleSend = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;
    onSendMessage(inputMessage);
    setInputMessage("");
  };

  // Speak suggestion out loud using browser SpeechSynthesis
  const speakText = (text: string, msgId: string) => {
    if ("speechSynthesis" in window) {
      if (speechActive === msgId) {
        window.speechSynthesis.cancel();
        setSpeechActive(null);
        return;
      }
      
      window.speechSynthesis.cancel();
      // Clean markdown tags out of speech for clean audio
      const cleanText = text.replace(/[*#`_\-]/g, "").substring(0, 300);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setSpeechActive(null);
      utterance.onerror = () => setSpeechActive(null);
      
      // Try to find a nice premium English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural") || v.lang.startsWith("en-"));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      setSpeechActive(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Speech synthesis is not supported on this browser.");
    }
  };

  // Speech Recognition (Web Speech API)
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please open in a new tab or use Chrome.");
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
    recognition.onerror = (err: any) => {
      console.error(err);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
    };

    recognition.start();
  };

  // Smart Pre-filled coaching prompts (Macros)
  const promptsMacros = [
    { label: "Analyze Schedule", text: "Please review my tasks and optimize my working schedule for today." },
    { label: "Create Revision Plan", text: "Draft a 5-day study & revision strategy for my highest priority task." },
    { label: "Create Prep Checklist", text: "Help me prepare for my upcoming deadline: generate a preparation checklist." },
    { label: "Motivation Brief", text: "Analyze my pending risk profiles and give me a high-impact morning motivation briefing." },
  ];

  // Helper to render basic markdown strings with formatting (bold, lists, code)
  const renderFormattedMessage = (text: string) => {
    return text.split("\n").map((line, idx) => {
      let formattedLine = line;
      
      // Handle H3 headers (### Header)
      if (formattedLine.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-display font-semibold text-sm text-indigo-400 mt-3 mb-1.5">
            {formattedLine.replace("### ", "")}
          </h4>
        );
      }
      
      // Handle H2 headers (## Header)
      if (formattedLine.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-display font-bold text-base text-white mt-4 mb-2">
            {formattedLine.replace("## ", "")}
          </h3>
        );
      }

      // Handle lists starting with * or -
      if (formattedLine.trim().startsWith("* ") || formattedLine.trim().startsWith("- ")) {
        const cleanContent = formattedLine.trim().replace(/^[*+\-]\s+/, "");
        return (
          <li key={idx} className="list-disc ml-4 text-xs text-slate-300 my-1 leading-relaxed">
            {parseBoldText(cleanContent)}
          </li>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(formattedLine.trim())) {
        const cleanContent = formattedLine.trim().replace(/^\d+\.\s+/, "");
        return (
          <li key={idx} className="list-decimal ml-4 text-xs text-slate-300 my-1 leading-relaxed">
            {parseBoldText(cleanContent)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-300 my-1.5 leading-relaxed">
          {parseBoldText(formattedLine)}
        </p>
      );
    });
  };

  // Helper to render bold strings (**text**) inside messages
  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-indigo-300">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="ai-coach-chat" className="glass-card flex flex-col h-full overflow-hidden relative border border-indigo-500/10">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="p-4 border-b border-slate-900/60 bg-slate-950/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/20">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-200">DeadlineAI Coach</h3>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Reasoning Agent
            </span>
          </div>
        </div>
        {onClearHistory && (
          <button 
            onClick={onClearHistory}
            className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Reset Chat Session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <h4 className="font-display font-semibold text-sm text-slate-200 mb-1">
              Welcome, I am DeadlineAI Coach
            </h4>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
              I don't just remind you. I study your workloads, anticipate risks, write plan blueprints, and optimize schedules. Ask me anything or select a task macro!
            </p>
            
            {/* Quick Actions / Macros */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {promptsMacros.map((macro, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(macro.text)}
                  className="p-2.5 rounded-xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900/40 text-left transition-all cursor-pointer group hover:border-indigo-500/20"
                >
                  <p className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    {macro.label}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {macro.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role !== "user" && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
                
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 border relative group ${
                  msg.role === "user"
                    ? "bg-indigo-600/15 border-indigo-500/20 text-indigo-100 rounded-tr-none"
                    : "bg-slate-950/60 border-slate-900/80 rounded-tl-none text-slate-200"
                }`}>
                  {/* Speech Trigger Button on Coach responses */}
                  {msg.role !== "user" && (
                    <button
                      onClick={() => speakText(msg.content, msg.id)}
                      className={`absolute -right-7 bottom-1.5 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                        speechActive === msg.id ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
                      }`}
                      title={speechActive === msg.id ? "Stop Speech" : "Speak Aloud"}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${speechActive === msg.id ? "animate-pulse" : ""}`} />
                    </button>
                  )}
                  
                  {msg.role === "user" ? (
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderFormattedMessage(msg.content)}
                    </div>
                  )}
                  
                  <span className="text-[9px] text-slate-500 mt-1 block text-right font-mono select-none">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isChatLoading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center border border-indigo-500/20 animate-pulse">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-slate-950/40 border border-slate-900 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1 items-center py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-900/60 bg-slate-950/40 flex gap-2">
        <button
          type="button"
          onClick={startListening}
          className={`p-3 rounded-xl transition-all border cursor-pointer shrink-0 ${
            isListening 
              ? "bg-red-500/20 border-red-500/30 text-red-400 animate-pulse" 
              : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
          title={isListening ? "Listening... click to stop" : "Voice Input"}
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={isListening ? "Listening..." : "Ask DeadlineAI to write a strategy..."}
          className="flex-1 bg-slate-900/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
          disabled={isChatLoading}
        />

        <button
          type="submit"
          className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl cursor-pointer hover:opacity-95 shadow-md shadow-indigo-500/10 shrink-0 transition-all flex items-center justify-center"
          disabled={!inputMessage.trim() || isChatLoading}
        >
          <Send className="w-4 h-4 fill-white/10" />
        </button>
      </form>
    </div>
  );
}
