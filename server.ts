import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// ESM fallback for local direct execution or bundler CJS execution
const getFilename = () => {
  try {
    return fileURLToPath(import.meta.url);
  } catch {
    return __filename;
  }
};
const getDirname = () => {
  try {
    return path.dirname(getFilename());
  } catch {
    return __dirname;
  }
};

const currentFilename = getFilename();
const currentDirname = getDirname();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client safely with API key
let ai: GoogleGenAI | null = null;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini client:", err);
  }
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined. AI features will degrade gracefully with high-fidelity local models.");
}

// Simple File Database Persistence
const DB_FILE = path.join(process.cwd(), "db.json");

const INITIAL_STATE = {
  tasks: [
    {
      id: "t1",
      title: "Vibe2Ship Hackathon Project Submission",
      description: "Submit full-stack prototype of DeadlineAI including the video demo, architecture diagrams, and fully functional codebase.",
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      priority: "high",
      category: "Hackathon",
      tags: ["AI", "Submission", "Google Cloud"],
      completed: false,
      subtasks: [
        { id: "s1_1", title: "Refine multi-agent server backend", completed: true, estimatedMinutes: 45 },
        { id: "s1_2", title: "Polish glassmorphic landing page and dashboard animations", completed: false, estimatedMinutes: 60 },
        { id: "s1_3", title: "Record 3-minute video presentation", completed: false, estimatedMinutes: 45 },
        { id: "s1_4", title: "Deploy backend to Google Cloud Run", completed: false, estimatedMinutes: 30 }
      ],
      attachments: [
        { id: "a1", name: "pitch_deck.pdf", size: "4.2 MB", type: "pdf", url: "#" }
      ],
      estimatedDuration: 180,
      complexity: "hard",
      difficulty: "high",
      riskScore: 75,
      riskExplanation: "The deadline is tomorrow. While 1 of 4 subtasks is complete, the remaining workload requires 135 minutes of active focus, which may clash with your evening sleep schedule.",
      executionStrategy: "Prioritize polishing the landing page before recording the demo. Run the Cloud Run deployment in parallel to save time.",
      scheduledTime: "10:30"
    },
    {
      id: "t2",
      title: "Weekly Career Planning Review",
      description: "Review internship applications, update resume, and connect with 3 senior engineers on LinkedIn.",
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      priority: "medium",
      category: "Career",
      tags: ["Networking", "Internship"],
      completed: false,
      subtasks: [
        { id: "s2_1", title: "Update GitHub portfolio showcase", completed: false, estimatedMinutes: 40 },
        { id: "s2_2", title: "Draft message drafts for senior engineers", completed: false, estimatedMinutes: 20 }
      ],
      estimatedDuration: 60,
      complexity: "easy",
      difficulty: "medium",
      riskScore: 15,
      riskExplanation: "Low risk. Plenty of buffer time is available before the deadline.",
      executionStrategy: "Handle this task during your non-peak focus hours in the afternoon to save creative energy.",
      scheduledTime: "14:15"
    },
    {
      id: "t3",
      title: "Daily Focus Preparation and Meditation",
      description: "Engage in 15 minutes of mindfulness and review Daily Schedule of work.",
      deadline: new Date().toISOString().split('T')[0], // Today
      priority: "low",
      category: "Wellness",
      tags: ["Mindfulness", "Morning Routine"],
      completed: true,
      subtasks: [],
      estimatedDuration: 15,
      complexity: "easy",
      difficulty: "low",
      riskScore: 0,
      riskExplanation: "Completed, outstanding consistency!",
      executionStrategy: "Best performed immediately after waking up for maximum neuro-cognitive focus.",
      scheduledTime: "08:15",
      completedAt: new Date().toISOString()
    }
  ],
  habits: [
    {
      id: "h1",
      name: "Focus Timer: 50 Mins/Day",
      category: "Productivity",
      frequency: "daily",
      streak: 5,
      history: {
        [new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: true,
        [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: true,
        [new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: true,
        [new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: true,
        [new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: true
      }
    },
    {
      id: "h2",
      name: "Sleep Sync: 8 Hours Sleep",
      category: "Wellness",
      frequency: "daily",
      streak: 3,
      history: {
        [new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: true,
        [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: true,
        [new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: true,
        [new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]: false
      }
    },
    {
      id: "h3",
      name: "Study Mode: 1 Revision Block",
      category: "Learning",
      frequency: "daily",
      streak: 0,
      history: {}
    }
  ],
  goals: [
    {
      id: "g1",
      title: "Secure a High-Growth Software Engineering Internship",
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: "Career",
      progress: 45,
      completed: false,
      subGoals: ["Resume polished with 3 major projects", "50 LeetCode problems solved", "Submit 25 applications"]
    },
    {
      id: "g2",
      title: "Deploy DeadlineAI Production Architecture",
      targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      category: "Hackathon",
      progress: 80,
      completed: false,
      subGoals: ["Vite + Express modular setup", "Proactive Multi-Agent Core", "Deploy client to Cloud Run"]
    }
  ],
  notifications: [
    {
      id: "n1",
      type: "brief",
      title: "Morning Briefing Ready",
      message: "You have 2 active tasks scheduled today. High-alert risk on 'Vibe2Ship Hackathon Project Submission'. Let's establish a 50-minute Focus block at 10:30 AM to mitigate drift.",
      timestamp: new Date().toISOString(),
      read: false
    },
    {
      id: "n2",
      type: "motivation",
      title: "Intelligent Peak Performance Advice",
      message: "Your focus concentration is 18% higher during the morning hours (09:00 - 11:30). Let's leverage this slot to tackle the complex Hackathon demo!",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false
    }
  ],
  settings: {
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
  }
};

// Ensure database file exists
function loadState() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_STATE, null, 2));
    return INITIAL_STATE;
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, resetting to initial state:", err);
    return INITIAL_STATE;
  }
}

function saveState(state: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

// API Routes
app.get("/api/state", (req, res) => {
  const state = loadState();
  res.json(state);
});

app.post("/api/state", (req, res) => {
  saveState(req.body);
  res.json({ status: "success" });
});

// Helper for Mock Gemini fallbacks
function generateMockAnalysis(title: string, description: string, deadline: string, priority: string) {
  const duration = priority === "high" ? 120 : 45;
  const deadlineDays = Math.max(1, Math.round((new Date(deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  const risk = Math.max(10, Math.min(95, Math.round(90 - (deadlineDays * 15) + (priority === "high" ? 25 : 0))));
  
  return {
    estimatedDuration: duration,
    complexity: priority === "high" ? "hard" : "easy",
    difficulty: priority === "high" ? "high" : "medium",
    riskScore: risk,
    riskExplanation: `Based on your deadline of ${deadline} (${deadlineDays} days from now), the task is estimated to require ${duration} minutes. Since you have a highly demanding schedule, procrastination presents a ${risk}% risk of breaching the target.`,
    executionStrategy: `Perform a dedicated ${Math.ceil(duration / 25)} session Pomodoro split. Start with the heavy documentation setup first, then do the creative edits.`,
    subtasks: [
      { title: `Initialize ${title} foundation`, estimatedMinutes: Math.round(duration * 0.3) },
      { title: `Execute core implementation parts`, estimatedMinutes: Math.round(duration * 0.5) },
      { title: `Verify output and perform code reviews`, estimatedMinutes: Math.round(duration * 0.2) }
    ]
  };
}

// Agent 1 & Agent 2: Task Analyzer & Planning Agent
app.post("/api/agent/analyze-task", async (req, res) => {
  const { title, description, deadline, priority, category } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!ai) {
    // Graceful degradation fallback
    console.log("No Gemini API key. Returning high-fidelity fallback analysis.");
    const fallback = generateMockAnalysis(title, description || "", deadline, priority || "medium");
    return res.json(fallback);
  }

  try {
    const prompt = `You are the core Task Analyzer (Agent 1) and Planning Agent (Agent 2) of DeadlineAI.
Analyze the following user task and output a structured JSON response specifying the estimated duration in minutes, complexity (easy, medium, hard), difficulty (low, medium, high), deadline risk score (0 to 100), a contextual risk explanation, a strategic action plan/execution strategy, and a list of actionable subtasks.

User Task Details:
- Title: ${title}
- Description: ${description || "No description provided"}
- Target Deadline: ${deadline}
- Priority: ${priority}
- Category: ${category || "General"}

Respond STRICTLY with a valid JSON object matching this schema:
{
  "estimatedDuration": number,
  "complexity": "easy" | "medium" | "hard",
  "difficulty": "low" | "medium" | "high",
  "riskScore": number,
  "riskExplanation": "string explaining the risk based on remaining time and user constraints",
  "executionStrategy": "string offering highly strategic advice on how to start and avoid procrastination",
  "subtasks": [
    { "title": "string subtask title", "estimatedMinutes": number }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedDuration: { type: Type.INTEGER, description: "Total duration in minutes" },
            complexity: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
            difficulty: { type: Type.STRING, enum: ["low", "medium", "high"] },
            riskScore: { type: Type.INTEGER, description: "Risk score from 0 (no risk) to 100 (extreme risk of failure)" },
            riskExplanation: { type: Type.STRING },
            executionStrategy: { type: Type.STRING, description: "How to complete this task effectively instead of postponing" },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ["title"]
              }
            }
          },
          required: ["estimatedDuration", "complexity", "difficulty", "riskScore", "riskExplanation", "executionStrategy", "subtasks"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Task Analyzer error:", error);
    // Fallback to avoid breaking
    const fallback = generateMockAnalysis(title, description || "", deadline, priority || "medium");
    res.json(fallback);
  }
});

// Agent 3: Scheduling Agent (Generates daily schedule)
app.post("/api/agent/generate-schedule", async (req, res) => {
  const { tasks, settings } = req.body;

  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Tasks array is required" });
  }

  const workingHours = `${settings?.workingHoursStart || "09:00"} to ${settings?.workingHoursEnd || "18:00"}`;
  const sleepHours = `${settings?.sleepHoursStart || "23:00"} to ${settings?.sleepHoursEnd || "07:00"}`;

  if (!ai) {
    // Local scheduling logic
    let currentHour = 9;
    let currentMinute = 0;
    const schedule: Record<string, string> = {};
    
    tasks.filter((t: any) => !t.completed).forEach((task: any, index: number) => {
      const timeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
      schedule[task.id] = timeStr;
      
      const duration = task.estimatedDuration || 60;
      currentMinute += duration;
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
      
      // Inject break
      currentMinute += 15;
      currentHour += Math.floor(currentMinute / 60);
      currentMinute = currentMinute % 60;
    });

    return res.json({ schedule });
  }

  try {
    const prompt = `You are the Scheduling Agent (Agent 3) for DeadlineAI.
Optimize and generate scheduled starting times (HH:MM format) for today's outstanding tasks.
User context:
- Core active hours: ${workingHours}
- Sleep window: ${sleepHours}
- Tasks to schedule: ${JSON.stringify(tasks.filter((t: any) => !t.completed).map((t: any) => ({ id: t.id, title: t.title, priority: t.priority, duration: t.estimatedDuration || 60 })))}

Return a structured JSON object associating task IDs to their ideal start times. Provide only the mapping under the key "schedule". Ensure times fall in the user's active window and avoid overlapping.

JSON Schema:
{
  "schedule": {
    "task_id_string": "HH:MM",
    ...
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.OBJECT,
              description: "Mapping of task ID to HH:MM start time"
            }
          },
          required: ["schedule"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err) {
    console.error("Gemini Scheduling Agent error:", err);
    res.status(500).json({ error: "Failed to generate schedule" });
  }
});

// Agent 4: Risk Prediction Agent (Analyzes deadlines and generates a recovery plan)
app.post("/api/agent/predict-risk", async (req, res) => {
  const { tasks, habits } = req.body;

  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Tasks array is required" });
  }

  if (!ai) {
    return res.json({
      predictedOverduePercentage: 25,
      riskLevel: "medium",
      analysis: "You have 1 major deadline due tomorrow. Your focus history shows great resilience, but you must keep distraction logs low to guarantee delivery.",
      recoveryPlan: [
        "Consolidate 'Hackathon Submission' into a single evening focus session.",
        "Postpone low-priority networking tasks to the weekend."
      ]
    });
  }

  try {
    const prompt = `You are the Risk Prediction Agent (Agent 4) of DeadlineAI.
Review the following active tasks and habits, predict the exact risk of user missing their upcoming deadlines, and provide a concrete recovery plan.

Tasks: ${JSON.stringify(tasks.map((t: any) => ({ title: t.title, deadline: t.deadline, priority: t.priority, completed: t.completed, subtasksCount: t.subtasks?.length })))}
Habits: ${JSON.stringify(habits.map((h: any) => ({ name: h.name, streak: h.streak })))}

Return a JSON object conforming strictly to this format:
{
  "predictedOverduePercentage": number (0 to 100),
  "riskLevel": "low" | "medium" | "high",
  "analysis": "detailed explanation of why the user is at risk or safe, citing specific deadlines",
  "recoveryPlan": [
    "step 1 of concrete recovery action",
    "step 2 of concrete recovery action",
    ...
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictedOverduePercentage: { type: Type.INTEGER },
            riskLevel: { type: Type.STRING, enum: ["low", "medium", "high"] },
            analysis: { type: Type.STRING },
            recoveryPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["predictedOverduePercentage", "riskLevel", "analysis", "recoveryPlan"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err) {
    console.error("Risk Agent error:", err);
    res.status(500).json({ error: "Failed to generate risk metrics" });
  }
});

// Agent 5: Reminder Agent (Contextual proactive alerts explaining why the user must act now)
app.post("/api/agent/generate-reminders", async (req, res) => {
  const { task, settings } = req.body;

  if (!task) {
    return res.status(400).json({ error: "Task is required" });
  }

  if (!ai) {
    return res.json({
      title: `⚡ Act Now: ${task.title}`,
      message: `Delaying this task means you will lose valuable evening rest. Completing the remaining subtasks now guarantees a clean transition into your target ${settings?.sleepHoursStart || "23:00"} sleep cycle.`,
      urgencyReason: "Completing this now saves your energy index by 15%."
    });
  }

  try {
    const prompt = `You are the Reminder Agent (Agent 5) of DeadlineAI.
Write a proactive, highly persuasive, intelligence-driven reminder warning for the user explaining exactly WHY they must start the following task IMMEDIATELY.
Never use generic reminders like 'Don't forget to work on this!'.
Instead, link the postponement of the task to concrete negative outcomes: e.g., missing their targeted sleep hour, creating compound stress, losing focus streaks, or compromising their active Goals.

Task: ${JSON.stringify(task)}
User Sleep/Work Schedule: Sleep starts at ${settings?.sleepHoursStart || "23:00"}.

JSON Schema output:
{
  "title": "Short catchy alert title",
  "message": "Highly motivating and analytical message explaining why starting NOW is vital",
  "urgencyReason": "One-liner warning about the immediate impact of a 1-hour delay"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            message: { type: Type.STRING },
            urgencyReason: { type: Type.STRING }
          },
          required: ["title", "message", "urgencyReason"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err) {
    console.error("Reminder Agent error:", err);
    res.status(500).json({ error: "Failed to generate intelligent reminders" });
  }
});

// Voice Input command processing
app.post("/api/agent/voice-command", async (req, res) => {
  const { command, settings } = req.body;

  if (!command) {
    return res.status(400).json({ error: "Command text is required" });
  }

  if (!ai) {
    // Mock created task based on text
    const dateStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return res.json({
      title: "Voice Added: " + command,
      description: "Auto-generated from voice directive: '" + command + "'",
      deadline: dateStr,
      priority: "high",
      category: "Academics",
      tags: ["Voice", "Auto-Created"],
      subtasks: [
        { title: "Review guidelines and materials", completed: false },
        { title: "Complete assignment drafting", completed: false },
        { title: "Review & upload final files", completed: false }
      ]
    });
  }

  try {
    const prompt = `You are the Voice Assistant Agent (DeadlineAI Core).
The user just dictated a voice productivity request: "${command}".
Parse the intent, extract key parameters, and generate a fully structured new Task JSON object.
Automatically estimate a reasonable priority, category (e.g. Wellness, Academics, Career, Work, Hackathon), tags, and break it down into 3-4 actionable subtasks.
If the text mentions a relative deadline (e.g., 'due tomorrow', 'due in 3 days'), convert it to an absolute ISO Date string (YYYY-MM-DD). Today's current local date is: ${new Date().toISOString().split('T')[0]}.

JSON Schema:
{
  "title": "Short descriptive task title",
  "description": "Elaborated description based on user voice intent",
  "deadline": "YYYY-MM-DD",
  "priority": "low" | "medium" | "high",
  "category": "string category name",
  "tags": ["string", "string"],
  "subtasks": [
    { "title": "subtask title", "completed": false, "estimatedMinutes": number }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            deadline: { type: Type.STRING, description: "Target date in YYYY-MM-DD format" },
            priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN },
                  estimatedMinutes: { type: Type.INTEGER }
                },
                required: ["title", "completed"]
              }
            }
          },
          required: ["title", "description", "deadline", "priority", "category", "tags", "subtasks"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (err) {
    console.error("Voice Agent error:", err);
    res.status(500).json({ error: "Failed to parse voice command" });
  }
});

// AI Coach Chat Endpoint (Agentic conversational tutor)
app.post("/api/chat", async (req, res) => {
  const { messages, userContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const systemInstruction = `You are DeadlineAI, the world's most proactive and intelligent productivity coach.
Your primary directive is to help users complete work instead of simply reminding them.
Analyze the user's tasks, goals, habits, and scheduling bottlenecks. Act as an active teammate who solves issues, offers detailed revision plans, drafts checklists, suggests immediate recoveries, and coordinates schedules.

User context for your awareness:
- Current state: ${JSON.stringify(userContext || {})}

Always think step-by-step. Be supportive, deeply analytical, and actionable. Avoid generic warnings. Give exact steps! Keep answers elegant, markdown-formatted, and visually distinct.`;

  if (!ai) {
    return res.json({
      text: "I am running in Offline High-Fidelity Coaching mode. Here's my suggestion based on your active state:\n\n1. **Focus Optimization**: To safeguard your sleep window, combine your 'Vibe2Ship Hackathon Project' tasks into 2 key Pomodoro cycles immediately.\n2. **Immediate Recovery**: Postpone low-impact tasks to free up 60 minutes of cognitive head space.\n\nLet me know if you would like me to draft a custom action plan!"
    });
  }

  try {
    const chatHistory = messages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    // Generate response using generateContent
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatHistory,
      config: {
        systemInstruction,
      }
    });

    res.json({ text: response.text });
  } catch (err) {
    console.error("AI Coach Chat error:", err);
    res.status(500).json({ error: "Failed to process chat response" });
  }
});

// Handle serving compiled React application
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DeadlineAI Express Server booted on port ${PORT}`);
  });
}

startServer();
