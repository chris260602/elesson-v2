'use client';

import { useState } from 'react';

export default function BreakClient() {
  const [shouldBreak, setShouldBreak] = useState(false);

  if (shouldBreak) {
    // This throws an error immediately when true
    throw new Error("Oh no! The robot dropped the puzzle piece!");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-2xl font-bold">Danger Zone</h1>
      
      <button
        onClick={() => setShouldBreak(true)}
        className="rounded-xl bg-red-500 px-6 py-3 font-bold text-white hover:bg-red-600"
      >
        💥 Break Everything
      </button>
      
      <p className="mt-4 text-slate-500">
        (Clicking this will trigger error.tsx)
      </p>
    </div>
  );
}