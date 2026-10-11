import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-zinc-700 border-t-[#fef08a] rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
          Loading product...
        </p>
      </div>
    </div>
  );
}
