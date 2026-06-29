import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Sparkles, Trophy, Zap } from "lucide-react";

interface TaskCelebrationProps {
  taskTitle: string | null;
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
  emoji?: string;
}

const COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EF4444", // Red
];

const EMOJIS = ["🎉", "✨", "🚀", "🔥", "🏆", "🌟", "👏", "🎯", "⚡"];

export default function TaskCelebration({ taskTitle, onComplete }: TaskCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!taskTitle) return;

    // Generate confetti particles
    const newParticles: Particle[] = Array.from({ length: 60 }).map((_, i) => {
      const isEmoji = Math.random() > 0.6;
      return {
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 12 + 6,
        angle: Math.random() * 360,
        velocity: Math.random() * 15 + 10,
        emoji: isEmoji ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : undefined,
      };
    });

    setParticles(newParticles);

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => clearTimeout(timer);
  }, [taskTitle, onComplete]);

  if (!taskTitle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Backdrop vignette overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
      />

      {/* Confetti Explosion Particles */}
      <AnimatePresence>
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const distance = p.velocity * 30; // distance multiplier
          const targetX = Math.cos(rad) * distance;
          const targetY = Math.sin(rad) * distance + 150; // gravity effect downward

          return (
            <motion.div
              key={p.id}
              initial={{
                x: "50vw",
                y: "50vh",
                scale: 0.1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: `calc(50vw + ${targetX}px)`,
                y: `calc(50vh + ${targetY}px)`,
                scale: [1, 1.2, 0.8, 0],
                opacity: [1, 1, 0.7, 0],
                rotate: p.angle * 4,
              }}
              transition={{
                duration: 2.2,
                ease: "easeOut",
              }}
              className="absolute select-none"
              style={{
                color: p.color,
                fontSize: p.emoji ? `${p.size + 14}px` : undefined,
              }}
            >
              {p.emoji ? (
                p.emoji
              ) : (
                <div
                  className="rounded-full shadow-lg"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Central Celebratory Banner */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: -50 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
        className="relative bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center pointer-events-auto backdrop-blur-xl flex flex-col items-center gap-4"
      >
        {/* Animated Ring & Icons */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing glow behind */}
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute w-20 h-20 bg-indigo-500/20 rounded-full blur-xl"
          />

          <motion.div
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 relative z-10"
          >
            <Check className="w-8 h-8 text-white stroke-[3px]" />
          </motion.div>

          {/* Floating tiny sparks */}
          <motion.div
            animate={{ y: [-5, 5, -5], x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-1 -right-1 text-amber-400"
          >
            <Sparkles className="w-5 h-5 fill-amber-400" />
          </motion.div>

          <motion.div
            animate={{ y: [4, -4, 4], x: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="absolute -bottom-2 -left-2 text-indigo-400"
          >
            <Zap className="w-5 h-5 fill-indigo-500/30" />
          </motion.div>
        </div>

        {/* Text Area */}
        <div className="space-y-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-1"
          >
            <Trophy className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
            Task Completed!
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg font-semibold text-white tracking-tight leading-tight px-2"
          >
            {taskTitle}
          </motion.h3>
        </div>

        {/* Reward Pill */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-500/5"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>+15 XP Earned</span>
          <span className="text-slate-400 font-normal">|</span>
          <span className="text-amber-400">🔥 Streak Kept!</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
