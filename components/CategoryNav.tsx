import React from 'react';

export default function CategoryNav() {
  const categories = ['VIEW ALL', 'SHIRTS', 'T-SHIRTS', 'TROUSERS', 'JEANS'];
  
  return (
    <div className="w-full bg-black border-b border-gray-800 py-4 overflow-x-auto">
      <div className="flex items-center justify-center gap-8 min-w-max px-4">
        {categories.map((cat, index) => (
          <button
            key={cat}
            className={`text-sm font-bold tracking-wider ${
              index === 0 
                ? 'text-white border-b-2 border-[#fef08a] pb-1' 
                : 'text-gray-400 hover:text-white transition-colors'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
