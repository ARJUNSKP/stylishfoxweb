'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { Product, getAllProducts } from '@/data/products';
import FilterBar from './FilterBar';
import ProductGrid from './ProductGrid';
import { fetchProducts } from '@/utils/api';

interface ProductCatalogProps {
  initialProducts?: Product[];
}

function matchesCategory(product: Product, category: string): boolean {
  if (!category || category === 'All') return true;
  const cat = category.toLowerCase();
  const prodCat = (product.categoryId || '').toLowerCase();
  const prodName = product.name.toLowerCase();

  if (cat.includes("men's") || cat === 'men') {
    return prodCat.includes('men') || prodName.includes('men');
  }
  if (cat.includes("women's") || cat === 'women') {
    return prodCat.includes('women') || prodName.includes('women') || prodName.includes('ladies') || prodName.includes('top');
  }
  if (cat.includes('footwear') || cat.includes('sneaker')) {
    return prodCat.includes('footwear') || prodName.includes('sneaker') || prodName.includes('shoes');
  }
  if (cat.includes('accessories')) {
    return prodCat.includes('accessories') || prodName.includes('bag') || prodName.includes('beanie') || prodName.includes('belt') || prodName.includes('cap');
  }
  if (cat.includes('t-shirt') || cat.includes('tee')) {
    return prodName.includes('tee') || prodName.includes('t-shirt');
  }
  if (cat.includes('shirt')) {
    return prodName.includes('shirt') || prodName.includes('flannel');
  }
  if (cat.includes('hoodie')) {
    return prodName.includes('hoodie') || prodName.includes('crewneck');
  }
  if (cat.includes('jacket')) {
    return prodName.includes('jacket') || prodName.includes('vest') || prodName.includes('puffer');
  }
  if (cat.includes('pants') || cat.includes('cargo')) {
    return prodName.includes('pants') || prodName.includes('cargo') || prodName.includes('jeans') || prodName.includes('trousers');
  }
  return true;
}

function matchesSearch(product: Product, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);
  const name = product.name.toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const category = (product.categoryId || '').toLowerCase();

  return words.every(
    (word) => name.includes(word) || desc.includes(word) || category.includes(word)
  );
}

function sortProducts(items: Product[], sort: string): Product[] {
  const sorted = [...items];
  switch (sort) {
    case 'PRICE: LOW TO HIGH':
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    case 'PRICE: HIGH TO LOW':
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    case 'ASCENDING (A-Z)':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'DESCENDING (Z-A)':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'POPULARITY':
    default:
      return sorted;
  }
}

export default function ProductCatalog({ initialProducts }: ProductCatalogProps) {
  const [allProducts, setAllProducts] = useState<Product[]>(() =>
    initialProducts && initialProducts.length > 0 ? initialProducts : getAllProducts()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState('POPULARITY');

  // Fetch updated catalog on mount
  useEffect(() => {
    fetchProducts().then((data) => {
      if (data && data.length > 0) {
        setAllProducts(data);
      }
    });
  }, []);

  // Compute filtered & sorted products
  const displayedProducts = useMemo(() => {
    let result = allProducts;

    if (searchQuery.trim()) {
      result = result.filter((p) => matchesSearch(p, searchQuery));
    }

    if (selectedCategory) {
      result = result.filter((p) => matchesCategory(p, selectedCategory));
    }

    return sortProducts(result, selectedSort);
  }, [allProducts, searchQuery, selectedCategory, selectedSort]);

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <div className="w-full bg-black text-white flex flex-col">
      {/* Centered Search Product Name Bar */}
      <section className="w-full bg-black pt-8 pb-6 px-4 border-b border-zinc-900 flex flex-col items-center justify-center">
        <div className="w-full max-w-xl mx-auto flex flex-col items-center">
          {/* Subtitle */}
          <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest text-[#fef08a] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Streetwear Collection</span>
          </div>

          {/* Centered Search Input Box */}
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#fef08a] transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name (e.g. Acid Wash, Cargo, Hoodie)..."
              className="w-full bg-zinc-950/90 border border-zinc-800 rounded-full pl-12 pr-11 py-3.5 text-sm md:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a] focus:ring-2 focus:ring-[#fef08a]/20 transition-all shadow-2xl backdrop-blur-md"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Clear search query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Result Counter or Trending Tags */}
          <div className="w-full flex items-center justify-between flex-wrap gap-2 mt-3 px-2 text-xs">
            {searchQuery ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-zinc-400">
                  Showing <strong className="text-white">{displayedProducts.length}</strong>{' '}
                  {displayedProducts.length === 1 ? 'product' : 'products'} matching &ldquo;
                  <span className="text-[#fef08a] font-semibold">{searchQuery}</span>&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#fef08a] hover:underline font-semibold ml-auto cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap text-zinc-500 w-full justify-center">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
                  Trending:
                </span>
                {['Acid Wash', 'Boxy Hoodie', 'Cargo', 'Denim', 'Sneakers', 'Flannel'].map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearchQuery(tag)}
                      className="px-2.5 py-0.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-[#fef08a]/50 text-zinc-300 hover:text-[#fef08a] text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Filter & Sort Bar */}
      <FilterBar
        selectedFilter={selectedCategory}
        onSelectFilter={setSelectedCategory}
        selectedSort={selectedSort}
        onSelectSort={setSelectedSort}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
      />

      {/* Products Grid or Empty State */}
      {displayedProducts.length > 0 ? (
        <ProductGrid products={displayedProducts} />
      ) : (
        <div className="w-full py-20 px-4 text-center flex flex-col items-center justify-center bg-black">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-[#fef08a]">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black uppercase text-white tracking-wider mb-2">
            No products found
          </h3>
          <p className="text-zinc-400 text-sm max-w-md mb-6 leading-relaxed">
            We couldn&apos;t find any styles matching{' '}
            {searchQuery ? (
              <>
                &ldquo;<span className="text-[#fef08a] font-semibold">{searchQuery}</span>&rdquo;
              </>
            ) : (
              'the selected filters'
            )}
            . Try another keyword or browse our full streetwear catalog.
          </p>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-6 py-2.5 bg-[#fef08a] text-black font-extrabold text-xs uppercase tracking-wider rounded-full hover:bg-yellow-300 transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          >
            Reset Filters & View All
          </button>
        </div>
      )}
    </div>
  );
}
