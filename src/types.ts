export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
}

export interface TaskAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  tags: string[];
  completed: boolean;
  subtasks: SubTask[];
  attachments: TaskAttachment[];
  
  // AI Agent generated fields
  estimatedDuration?: number; // in minutes
  complexity?: 'easy' | 'medium' | 'hard';
  difficulty?: 'low' | 'medium' | 'high';
  riskScore?: number; // 0 to 100
  riskExplanation?: string;
  executionStrategy?: string;
  scheduledTime?: string; // HH:MM format
  completedAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  history: Record<string, boolean>; // date (YYYY-MM-DD) -> completed
  lastCompleted?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  category: string;
  progress: number; // 0 to 100
  completed: boolean;
  subGoals: string[];
}

export interface SystemNotification {
  id: string;
  type: 'brief' | 'alert' | 'motivation' | 'risk';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface UserSettings {
  name: string;
  email: string;
  avatar: string;
  workingHoursStart: string; // "09:00"
  workingHoursEnd: string; // "17:00"
  sleepHoursStart: string; // "23:00"
  sleepHoursEnd: string; // "07:00"
  focusSessionDuration: number; // in minutes (default 25)
  shortBreakDuration: number; // in minutes (default 5)
  longBreakDuration: number; // in minutes (default 15)
  syncGoogleCalendar: boolean;
  theme: 'dark' | 'light';
}

export interface AppState {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  notifications: SystemNotification[];
  settings: UserSettings;
}
