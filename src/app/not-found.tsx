'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex max-w-md flex-col items-center text-center rounded-3xl bg-white p-12 shadow-xl shadow-violet-100"
      >
        {/* Animated Icon Container */}
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-primary/50 text-primary">
          <motion.div
            animate={{
              rotate: [0, -20, 20, 0], // Tilting left and right
              scale: [1, 1.1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              repeatDelay: 1
            }}
          >
            <Search size={56} strokeWidth={2.5} />
          </motion.div>
        </div>

        {/* Big 404 Text */}
        <h1 className="mb-2 text-5xl font-black text-primary">
          404
        </h1>

        {/* Playful Copy */}
        <h2 className="mb-4 text-2xl font-bold text-slate-700">
          Hmm, it&apos;s not here...
        </h2>
        
        <p className="mb-8 text-lg text-slate-500 font-medium leading-relaxed">
          We looked under the bed and behind the sofa, but we can&apos;t find that page anywhere!
        </p>

        {/* Go Home Button */}
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer group flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg shadow-violet-200 transition-all"
          >
            <Home size={20} />
            Let&apos;s Go Home
          </motion.button>
        </Link>
      </motion.div>

      {/* Footer Decoration */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-sm font-medium text-primary"
      >
        (Maybe the dog ate it?)
      </motion.div>
    </div>
  );
}