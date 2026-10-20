'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, X, Sparkles, Loader2, ArrowUp, CheckCircle2 } from 'lucide-react';
import { Product, getAllProducts } from '@/data/products';
import FilterBar from './FilterBar';
import ProductGrid from './ProductGrid';
import { fetchProducts } from '@/utils/api';

interface ProductCatalogProps {
  initialProducts?: Product[];
}

function getProductCategoryString(product: Product): string {
  if (product.categoryName) return product.categoryName;
  if (typeof product.categoryId === 'object' && product.categoryId !== null) {
    return product.categoryId.categoryName || product.categoryId.name || product.categoryId.slug || '';
  }
  if (typeof product.category === 'object' && product.category !== null) {
    return product.category.categoryName || product.category.name || product.category.slug || '';
  }
  return typeof product.categoryId === 'string' ? product.categoryId : '';
}

function matchesCategory(product: Product, category: string): boolean {
  if (!category || category === 'All') return true;
  const cat = category.toLowerCase();
  const prodCat = getProductCategoryString(product).toLowerCase();
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
  const category = getProductCategoryString(product).toLowerCase();

  return words.every(
    (word) => name.includes(word) || desc.includes(word) || category.includes(word)
  );
}

function sortProducts(items: Product[], sort: string): Product[] {
  const sorted = [...items];
  const getEffectivePrice = (item: any) =>
    item.sellingPrice && item.price && item.sellingPrice < item.price
      ? item.sellingPrice
      : item.price || 0;

  switch (sort) {
    case 'PRICE: LOW TO HIGH':
      return sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    case 'PRICE: HIGH TO LOW':
      return sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
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

  // Infinite Scroll State
  const INITIAL_BATCH = 8;
  const BATCH_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  // Only fetch on client if initialProducts was not provided by SSR or is empty
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) return;

    fetchProducts({ limit: 100 }).then((data) => {
      if (data && data.length > 0) {
        setAllProducts(data);
      }
    });
  }, [initialProducts]);

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

  // Reset pagination count when search, category, or sort changes
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
    setIsLoadingMore(false);
  }, [searchQuery, selectedCategory, selectedSort]);

  const hasMore = visibleCount < displayedProducts.length;

  const paginatedProducts = useMemo(() => {
    return displayedProducts.slice(0, visibleCount);
  }, [displayedProducts, visibleCount]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, displayedProducts.length));
      setIsLoadingMore(false);
    }, 350);
  }, [hasMore, isLoadingMore, displayedProducts.length]);

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.05,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, loadMore]);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <>
          <ProductGrid products={paginatedProducts} />

          {/* Luxury Skeleton Cards while loading more */}
          {isLoadingMore && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 px-2 sm:px-4 md:px-8 py-2 bg-black">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex flex-col animate-pulse">
                  <div className="relative aspect-[3/4] bg-zinc-900 border border-zinc-800/80 mb-3 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/25 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                  </div>
                  <div className="h-3.5 bg-zinc-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-800/70 rounded w-1/3" />
                </div>
              ))}
            </div>
          )}

          {/* Infinite Scroll Sentinel and Trigger Area */}
          {hasMore && (
            <div
              ref={observerTargetRef}
              className="w-full py-8 flex flex-col items-center justify-center min-h-[70px]"
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs font-semibold tracking-wider uppercase shadow-xl backdrop-blur-md">
                  <Loader2 className="w-4 h-4 text-[#fef08a] animate-spin" />
                  <span>Loading more styles...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={loadMore}
                  className="text-xs uppercase tracking-widest text-zinc-500 hover:text-[#fef08a] font-semibold py-2 px-4 transition-colors cursor-pointer"
                >
                  Scroll down for more styles
                </button>
              )}
            </div>
          )}

          {/* End of Catalog State */}
          {!hasMore && (
            <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center border-t border-zinc-900/80 bg-gradient-to-b from-black to-zinc-950">
              <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#fef08a] mb-3 shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-300 mb-1">
                All {displayedProducts.length} Styles Loaded
              </p>
              <p className="text-zinc-500 text-xs max-w-sm mb-4">
                You have viewed our complete curated streetwear collection.
              </p>
              <button
                type="button"
                onClick={handleScrollToTop}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-[#fef08a]/50 text-xs font-bold text-zinc-300 hover:text-[#fef08a] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to Top</span>
              </button>
            </div>
          )}
        </>
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
