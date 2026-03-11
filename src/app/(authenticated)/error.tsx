'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Puzzle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-red-50 p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex max-w-md flex-col items-center text-center rounded-3xl bg-white p-10 shadow-xl shadow-red-100"
      >
        {/* Icon Container */}
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-400">
           <Puzzle size={48} className="rotate-12" />
        </div>

        {/* Playful Text */}
        <h2 className="mb-2 text-3xl font-black text-slate-800 tracking-tight">
          Whoopsie!
        </h2>
        <p className="mb-8 text-lg text-slate-500 font-medium leading-relaxed">
          Looks like we lost a puzzle piece. Don&apos;t worry, we can try to put it back together!
        </p>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => reset()}
          className="cursor-pointer group flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition-colors"
        >
          <RotateCcw size={20} className="group-hover:animate-spin" />
          Try Again
        </motion.button>

        {/* Technical (Hidden for kids, useful for devs) */}
        <div className="mt-8 text-xs text-slate-300">
          Error Code: {error.digest || 'Unknown'}
        </div>
      </motion.div>
    </div>
  );
}