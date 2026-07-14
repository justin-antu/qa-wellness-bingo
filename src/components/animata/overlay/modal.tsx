import { CircleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function Modal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          onClick={onCancel}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center overflow-y-auto bg-ink/30 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: "spring", bounce: 0.25 } }}
            exit={{ scale: 0.85, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm cursor-default rounded-2xl border-2 border-border bg-white p-6 shadow-2xl"
          >
            <div className="flex flex-col gap-3">
              <CircleAlert className={cn("mx-auto", danger ? "text-danger" : "text-teal")} size={40} />
              <h3 className="text-center text-xl font-bold text-ink">{title}</h3>
              <p className="mb-1 text-center text-sm text-ink-light">{description}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={onCancel}
                  className="w-full rounded-full border-2 border-border py-2 font-bold text-ink-light transition-colors hover:bg-cream"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={cn(
                    "w-full rounded-full py-2 font-bold text-white transition-opacity hover:opacity-90",
                    danger ? "bg-danger" : "bg-teal",
                  )}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
