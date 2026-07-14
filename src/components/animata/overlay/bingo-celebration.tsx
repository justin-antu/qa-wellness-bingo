import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const CONFETTI_COLORS = ["#5f9ea0", "#3f7577", "#f5c451", "#faf6ee"];

function burstConfetti() {
  confetti({ particleCount: 70, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: CONFETTI_COLORS });
  confetti({ particleCount: 70, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: CONFETTI_COLORS });
  confetti({ particleCount: 50, spread: 100, origin: { x: 0.5, y: 0.4 }, colors: CONFETTI_COLORS });
}

interface BingoCelebrationProps {
  /** Bump this to a new (non-zero) value each time a celebration should fire. */
  celebrationKey: number;
  label: string;
}

export default function BingoCelebration({ celebrationKey, label }: BingoCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!celebrationKey) return;
    setVisible(true);
    burstConfetti();
    const timer = setTimeout(() => setVisible(false), 2400);
    return () => clearTimeout(timer);
  }, [celebrationKey]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
            className="rounded-3xl border-4 border-teal bg-white px-10 py-6 text-center shadow-2xl"
          >
            <p className="font-caveat text-5xl font-bold text-teal-dark">{label}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
