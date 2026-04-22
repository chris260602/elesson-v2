'use client';

import { motion } from 'framer-motion';

export default function LoadingPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-sky-50 dark:bg-gray-700">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-white dark:bg-gray-700 p-12 shadow-xl shadow-sky-100/50">
        
        {/* Bouncing Dots Animation */}
        <div className="flex gap-4">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="h-6 w-6 rounded-full bg-primary"
              animate={{
                y: ["0%", "-100%", "0%"],
                scale: [1, 0.8, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.15,
              }}
            />
          ))}
        </div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-slate-700"
        >
          Getting things ready...
        </motion.h2>
        
        <p className="text-slate-400 font-medium">Hold on tight!</p>
      </div>
    </div>
  );
}