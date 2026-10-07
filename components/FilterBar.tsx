"use client";
import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';

export default function FilterBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState("POPULARITY");
  
  const filterOptions = ["T-Shirt", "Shirt", "Custom T-Shirt", "Ladies Top"];
  const sortOptions = ["POPULARITY", "ASCENDING (A-Z)", "DESCENDING (Z-A)", "PRICE: LOW TO HIGH", "PRICE: HIGH TO LOW"];

  const handleSelect = (opt: string) => {
    setSelectedFilter(opt);
    setIsOpen(false); // Close filter dropdown
  };

  const handleSortSelect = (opt: string) => {
    setSelectedSort(opt);
    setIsSortOpen(false); // Close sort dropdown
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFilter(null);
  };

  return (
    <div className="relative w-full bg-black border-b border-gray-800 text-sm font-semibold text-gray-300 sticky top-[81px] z-40">
      <div className="flex items-center justify-between w-full px-4 md:px-8 py-4">
        
        {/* Left Side: Filter Button & Pill */}
        <div className="flex items-center gap-4 flex-wrap">
          <button 
            onClick={() => {
              setIsOpen(!isOpen);
              if (isSortOpen) setIsSortOpen(false);
            }}
            className={`flex items-center gap-2 transition-colors ${isOpen ? 'text-white' : 'hover:text-white'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {isOpen ? 'HIDE FILTERS' : 'SHOW FILTERS'}
          </button>

          {/* Selected Filter Pill */}
          {selectedFilter && (
            <div className="flex items-center gap-2 bg-gray-900 px-3 py-1 rounded-full border border-gray-700 text-xs">
              <span className="text-[#fef08a]">{selectedFilter}</span>
              <button onClick={clearFilter} className="hover:text-white transition-colors" aria-label="Clear filter">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        
        {/* Right Side: Sort Button & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsSortOpen(!isSortOpen);
              if (isOpen) setIsOpen(false);
            }}
            className={`flex items-center gap-2 transition-colors ${isSortOpen ? 'text-white' : 'hover:text-white'}`}
          >
            SORT BY <span className="font-bold text-[#fef08a]">{selectedSort}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180 text-[#fef08a]' : ''}`} />
          </button>
          
          {/* Sort Dropdown */}
          {isSortOpen && (
            <div className="absolute top-[calc(100%+1.5rem)] right-0 w-[240px] bg-gray-900 border border-gray-800 p-4 shadow-2xl z-50">
              <div className="flex flex-col gap-3">
                {sortOptions.map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => handleSortSelect(opt)}
                    className={`text-right w-full transition-colors py-2 text-xs md:text-sm ${selectedSort === opt ? 'text-[#fef08a] font-bold' : 'text-gray-400 hover:text-white'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full md:w-[320px] bg-gray-900 border-b md:border-r md:border-gray-800 p-6 shadow-2xl z-50 text-center">
          <h3 className="text-white mb-4 font-bold tracking-wider">FILTER BY CATEGORY</h3>
          <div className="flex flex-col gap-4">
            {filterOptions.map((opt) => (
              <button 
                key={opt}
                onClick={() => handleSelect(opt)}
                className={`w-full transition-colors group py-1 ${selectedFilter === opt ? 'text-[#fef08a]' : 'text-gray-400 hover:text-[#fef08a]'}`}
              >
                <span className={`transition-transform inline-block font-medium ${selectedFilter === opt ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
