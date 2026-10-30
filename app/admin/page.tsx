'use client';

import React, { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Package,
  Layers,
  Search,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Boxes,
  MoreVertical,
  Plus,
  Palette,
  Ruler,
  X,
  Check,
  Loader2,
  Trash2,
  Pencil,
  ExternalLink,
  Eye,
  Archive,
  Lock,
  FileText,
  UploadCloud,
  Sliders,
  ImageIcon,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { useProfile } from '@/context/ProfileContext';
import InvoiceModal from '@/components/InvoiceModal';
import {
  fetchProducts,
  clearApiCache,
  fetchAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminColors,
  createAdminColor,
  deleteAdminColor,
  fetchAdminSizes,
  createAdminSize,
  deleteAdminSize,
  createAdminProduct,
  addAdminVariant,
  updateAdminProduct,
  updateAdminVariant,
  deleteAdminVariant,
  deleteAdminProduct,
  deleteAdminProductImage,
  deleteAdminVariantImage,
  deleteImageFromR2,
  setAdminVariantPublish,
  formatProductImageUrl,
  fetchCarousels,
  createAdminCarousel,
  activateAdminCarousel,
  deleteAdminCarousel,
  fetchStoreSettings,
  updateAdminStoreSettings,
  CarouselItem,
  API_BASE_URL,
} from '@/utils/api';
import { Product } from '@/data/products';

export interface VariantRowItem {
  rowId: string;
  product: Product;
  variant?: any;
  variantId?: string;
  name: string;
  tagline: string;
  categoryName: string;
  colorName?: string;
  colorHex?: string;
  sizeCode?: string;
  sizeName?: string;
  price: number;
  sellingPrice?: number;
  stock: number;
  displayType: number;
  isOutOfStock: boolean;
  isPublished: boolean;
  image: string;
  sku?: string;
}

interface StagedVariant {
  id: string;
  colorId?: string;
  colorName?: string;
  colorHex?: string;
  sizeId?: string;
  sizeCode?: string;
  sizeName?: string;
  price: number;
  sellingPrice?: number;
  stock: number;
  displayType?: number;
  images: string[];
  imageFiles?: File[];
}

interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  hexCode?: string;
  code?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Type to search...',
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        (opt.code && opt.code.toLowerCase().includes(q))
    );
  }, [options, query]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-left flex items-center justify-between gap-2 hover:border-zinc-700 focus:outline-none focus:border-[#fef08a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.hexCode && (
            <span
              className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0"
              style={{ backgroundColor: selectedOption.hexCode }}
            />
          )}
          {selectedOption?.code && (
            <span className="px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">
              {selectedOption.code}
            </span>
          )}
          <span className={`truncate ${selectedOption ? 'text-white' : 'text-zinc-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
              {selectedOption.sublabel}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown with top search box */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-2 z-[60] flex flex-col gap-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          {/* Top Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-7 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-zinc-500 text-[11px]">
                No matching results
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${isSelected
                        ? 'bg-[#fef08a] text-black font-bold'
                        : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {opt.hexCode && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0"
                          style={{ backgroundColor: opt.hexCode }}
                        />
                      )}
                      {opt.code && (
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isSelected ? 'bg-black/10 text-black' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>
                          {opt.code}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className={`text-[10px] ${isSelected ? 'text-black/70' : 'text-zinc-500'}`}>
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const emptySubscribe = () => () => { };

export default function AdminDashboardPage() {
  const { user, token, isAdmin, logout, openProfileOrAuth } = useProfile();
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'ARCHIVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Menu & Modal state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeModal, setActiveModal] = useState<
    'NONE' | 'ADD_PRODUCT' | 'EDIT_VARIANT' | 'CATEGORY' | 'COLORS' | 'SIZE' | 'CAROUSEL' | 'INVOICE' | 'SETTINGS'
  >('NONE');

  // Store Settings state
  const [settingsForm, setSettingsForm] = useState<{
    whatsappNumber: string;
    freeShippingThreshold: number | string;
    shippingFee: number | string;
    offerText: string;
  }>({
    whatsappNumber: '918086388058',
    freeShippingThreshold: 2000,
    shippingFee: 149,
    offerText: '',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Backend metadata lists
  const [rawCategories, setRawCategories] = useState<{ id: string; name: string; slug: string; description?: string }[]>([]);
  const [rawColors, setRawColors] = useState<{ id: string; name: string; hexCode: string }[]>([]);
  const [rawSizes, setRawSizes] = useState<{ id: string; name: string; code: string; sortOrder?: number }[]>([]);
  const [rawCarousels, setRawCarousels] = useState<CarouselItem[]>([]);

  // Carousel form state & controls
  const [carouselForm, setCarouselForm] = useState<{
    title: string;
    description: string;
    isActive: boolean;
    images: string[];
    imageFiles: File[];
  }>({
    title: '',
    description: '',
    isActive: true,
    images: [],
    imageFiles: [],
  });
  const [isAddingNewCarousel, setIsAddingNewCarousel] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [activatingCarouselId, setActivatingCarouselId] = useState<string | null>(null);
  const [deletingCarouselId, setDeletingCarouselId] = useState<string | null>(null);
  const carouselFileInputRef = useRef<HTMLInputElement>(null);

  // Submitting state & feedback message
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSizeId, setDeletingSizeId] = useState<string | null>(null);
  const [deletingColorId, setDeletingColorId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stagedVariants, setStagedVariants] = useState<StagedVariant[]>([]);

  // Cloudflare R2 image delete confirmation modal state
  const [imageToDelete, setImageToDelete] = useState<{
    url: string;
    index: number;
    type: 'productForm' | 'variantForm';
    productId?: string;
    variantId?: string;
  } | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Carousel delete confirmation modal state
  const [carouselToDelete, setCarouselToDelete] = useState<CarouselItem | null>(null);
  // Active carousel delete attempt warning modal state
  const [activeCarouselWarning, setActiveCarouselWarning] = useState<CarouselItem | null>(null);

  // Variant delete confirmation modal state
  const [variantToDelete, setVariantToDelete] = useState<{
    variantId: string;
    productName: string;
    colorName?: string;
    colorHex?: string;
    sizeCode?: string;
    price?: number;
    sellingPrice?: number;
    image?: string;
    isOnlyVariant?: boolean;
    productId?: string;
  } | null>(null);
  const [isDeletingVariant, setIsDeletingVariant] = useState(false);

  // Product delete confirmation modal state
  const [productToDelete, setProductToDelete] = useState<{
    productId: string;
    productName: string;
    categoryName?: string;
    variantCount?: number;
    image?: string;
  } | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Forms
  const [productForm, setProductForm] = useState<{
    // Part 1: Main Content
    selectedProductId: string;
    name: string;
    tagline: string;
    description: string;
    categoryId: string;
    features: string[];
    featureInput: string;
    displayType: number; // 0 = Normal, 1 = New, 2 = Cleared
    // Part 2: Variant Details
    editingVariantId: string;
    colorId: string;
    sizeId: string;
    price: string;
    sellingPrice: string;
    stock: string;
    images: string[];
    imageFiles: File[];
    imageInput: string;
    isEditing: boolean;
  }>({
    selectedProductId: '',
    name: '',
    tagline: '',
    description: '',
    categoryId: '',
    features: [],
    featureInput: '',
    displayType: 0,
    editingVariantId: '',
    colorId: '',
    sizeId: '',
    price: '',
    sellingPrice: '',
    stock: '',
    images: [],
    imageFiles: [],
    imageInput: '',
    isEditing: false,
  });

  // Dedicated Variant Edit Form (fills ONLY variant-specific data)
  const [variantForm, setVariantForm] = useState<{
    variantId: string;
    productId: string;
    productName: string;
    productTagline: string;
    categoryName: string;
    productImage: string;
    colorId: string;
    sizeId: string;
    price: string;
    sellingPrice: string;
    stock: string;
    sku: string;
    displayType: number; // 0 = Normal, 1 = New, 2 = Cleared
    images: string[];
    imageFiles: File[];
    imageInput: string;
    isPublished: boolean;
  }>({
    variantId: '',
    productId: '',
    productName: '',
    productTagline: '',
    categoryName: '',
    productImage: '',
    colorId: '',
    sizeId: '',
    price: '',
    sellingPrice: '',
    stock: '',
    sku: '',
    displayType: 0,
    images: [],
    imageFiles: [],
    imageInput: '',
    isPublished: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const [colorForm, setColorForm] = useState({
    name: '',
    hexCode: '#000000',
  });

  const [sizeForm, setSizeForm] = useState({
    name: '',
    code: '',
    sortOrder: 1,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Load products from backend API (Admin sees all variants including archived/unpublished)
  const loadAdminProducts = async () => {
    setIsLoading(true);
    try {
      clearApiCache();
      const data = await fetchProducts({ limit: 100, includeUnpublished: true, bypassCache: true });
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.warn('[AdminDashboard] Failed to fetch products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load categories, colors, sizes, carousels metadata
  const loadMetadata = async () => {
    try {
      const [cats, cols, szs, crs] = await Promise.all([
        fetchAdminCategories(),
        fetchAdminColors(),
        fetchAdminSizes(),
        fetchCarousels(),
      ]);
      if (Array.isArray(cats)) setRawCategories(cats);
      if (Array.isArray(cols)) setRawColors(cols);
      if (Array.isArray(szs)) setRawSizes(szs);
      if (Array.isArray(crs)) setRawCarousels(crs);
    } catch (e) {
      console.warn('Failed to load admin metadata:', e);
    }
  };

  useEffect(() => {
    loadAdminProducts();
    loadMetadata();
  }, []);

  // Click-outside listener for three-dots menu
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const getAuthToken = () => {
    return token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
  };

  // Auto-fill Part 1 fields from existing selected product
  const handleSelectExistingProduct = (productId: string) => {
    if (!productId) {
      setProductForm((prev) => ({
        ...prev,
        selectedProductId: '',
      }));
      return;
    }

    const found = products.find((p) => String(p.id) === String(productId));
    if (!found) return;

    let catId = '';
    if (typeof found.categoryId === 'string') {
      catId = found.categoryId;
    } else if (typeof found.categoryId === 'object' && found.categoryId !== null) {
      catId = (found.categoryId as any).id || (found.categoryId as any).categoryId || '';
    } else if (found.category?.id) {
      catId = String(found.category.id);
    }

    // Match against rawCategories if catId is not direct match
    if (!rawCategories.some((c) => c.id === catId)) {
      const targetName = (found.categoryName || found.category?.name || '').trim().toLowerCase();
      if (targetName) {
        const matched = rawCategories.find(
          (c) => c.name.toLowerCase() === targetName || c.slug.toLowerCase() === targetName
        );
        if (matched) {
          catId = matched.id;
        }
      }
    }

    // Auto-fill Part 1 field values
    setProductForm((prev) => ({
      ...prev,
      selectedProductId: String(found.id),
      name: found.name || '',
      tagline: found.tagline || '',
      description: found.description || '',
      categoryId: catId,
      features: Array.isArray(found.features) ? [...found.features] : [],
      featureInput: '',
      displayType: found.displayType !== undefined ? Number(found.displayType) : 0,
    }));

    setModalFeedback({
      type: 'success',
      text: `Auto-filled Part 1 for "${found.name}". Configure new variants in Part 2.`,
    });
    setTimeout(() => {
      setModalFeedback(null);
    }, 3500);
  };

  // Helper to reset product modal state
  const resetFormState = () => {
    // Revoke any local blob URLs to free memory
    for (const url of productForm.images) {
      if (url?.startsWith('blob:')) {
        try { URL.revokeObjectURL(url); } catch { }
      }
    }
    for (const v of stagedVariants) {
      if (v.images) {
        for (const url of v.images) {
          if (url?.startsWith('blob:')) {
            try { URL.revokeObjectURL(url); } catch { }
          }
        }
      }
    }
    setProductForm({
      selectedProductId: '',
      name: '',
      tagline: '',
      description: '',
      categoryId: '',
      features: [],
      featureInput: '',
      displayType: 0,
      editingVariantId: '',
      colorId: '',
      sizeId: '',
      price: '',
      sellingPrice: '',
      stock: '',
      images: [],
      imageFiles: [],
      imageInput: '',
      isEditing: false,
    });
    setStagedVariants([]);
    setModalFeedback(null);
  };

  // Dedicated Variant Modal Open: Fills ONLY variant-related data
  const handleEditVariant = (row: VariantRowItem) => {
    const p = row.product;
    const v = row.variant;

    // Resolve Color & Size ID for this variant
    const colorId =
      v?.colorId ||
      v?.color?.id ||
      (row.colorName ? rawColors.find((c) => c.name.toLowerCase() === row.colorName?.toLowerCase())?.id : '') ||
      '';
    const sizeId =
      v?.sizeId ||
      v?.size?.id ||
      (row.sizeCode ? rawSizes.find((s) => s.code.toLowerCase() === row.sizeCode?.toLowerCase())?.id : '') ||
      '';

    // Resolve images
    const variantImages =
      Array.isArray(v?.images) && v.images.length > 0
        ? [...v.images]
        : row.image
          ? [row.image]
          : [];

    setVariantForm({
      variantId: v?.id || row.variantId || '',
      productId: String(p.id),
      productName: p.name || row.name || 'Product',
      productTagline: p.tagline || row.tagline || 'Apparel Item',
      categoryName: row.categoryName || 'General',
      productImage: row.image || '',
      colorId,
      sizeId,
      price: row.price !== undefined && !isNaN(row.price) ? String(row.price) : '',
      sellingPrice: row.sellingPrice !== undefined && !isNaN(row.sellingPrice) ? String(row.sellingPrice) : '',
      stock: String(row.stock ?? 0),
      sku: row.sku || v?.sku || '',
      displayType: row.displayType !== undefined ? Number(row.displayType) : (v?.displayType !== undefined ? Number(v.displayType) : 0),
      images: variantImages,
      imageFiles: [],
      imageInput: '',
      isPublished: row.isPublished ?? true,
    });

    setModalFeedback(null);
    setActiveModal('EDIT_VARIANT');
  };

  // Dedicated variant images handlers
  const handleAddVariantFormImage = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const url = variantForm.imageInput.trim();
    if (!url) return;
    if (!variantForm.images.includes(url)) {
      setVariantForm((prev) => ({
        ...prev,
        images: [...prev.images, url],
        imageInput: '',
      }));
    } else {
      setVariantForm((prev) => ({ ...prev, imageInput: '' }));
    }
  };

  const handleRemoveVariantFormImage = (index: number) => {
    const targetUrl = variantForm.images[index];
    if (!targetUrl) return;

    // When updating a variant or if the image is an existing R2 asset, prompt confirmation
    if (variantForm.variantId || !targetUrl.startsWith('blob:')) {
      setImageToDelete({
        url: targetUrl,
        index,
        type: 'variantForm',
        productId: variantForm.productId || undefined,
        variantId: variantForm.variantId || undefined,
      });
      return;
    }

    // Local-only blob removal (before saving/uploading)
    try {
      URL.revokeObjectURL(targetUrl);
    } catch { }
    const blobIndex = variantForm.images.slice(0, index).filter((u) => u.startsWith('blob:')).length;
    setVariantForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imageFiles: prev.imageFiles.filter((_, i) => i !== blobIndex),
    }));
  };

  // Dedicated variant images handler for direct local file selection (5MB max)
  // Does NOT call upload API immediately — files are uploaded to R2 during save button click
  const handleModalVariantImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 5MB limit
    const MAX_MB = 5;
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setModalFeedback({
        type: 'error',
        text: `Image "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed size is ${MAX_MB} MB.`,
      });
      if (modalFileInputRef.current) modalFileInputRef.current.value = '';
      return;
    }

    if (file.type && !file.type.startsWith('image/')) {
      setModalFeedback({
        type: 'error',
        text: `File "${file.name}" is not a valid image. Only JPG, PNG, WEBP, or GIF are allowed.`,
      });
      if (modalFileInputRef.current) modalFileInputRef.current.value = '';
      return;
    }

    // Create local object URL for instant UI preview without network call
    const previewUrl = URL.createObjectURL(file);
    setVariantForm((prev) => ({
      ...prev,
      images: [...prev.images, previewUrl],
      imageFiles: [...prev.imageFiles, file],
    }));

    setModalFeedback({
      type: 'success',
      text: `Selected "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB). Will upload to Cloudflare R2 when you click Save.`,
    });
    setTimeout(() => {
      setModalFeedback(null);
    }, 3000);

    if (modalFileInputRef.current) modalFileInputRef.current.value = '';
  };

  // Dedicated Variant Update: Updates ONLY this variant and stock
  // Uploads image files to Cloudflare R2 on Save click via FormData
  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    if (!variantForm.colorId) {
      setModalFeedback({ type: 'error', text: 'Please select a Color for this variant. Color is required.' });
      return;
    }

    if (!variantForm.price || isNaN(parseFloat(variantForm.price)) || parseFloat(variantForm.price) <= 0) {
      setModalFeedback({ type: 'error', text: 'Please enter a valid Regular Price (₹) for this variant. Price is required.' });
      return;
    }

    if (!variantForm.sellingPrice || isNaN(parseFloat(variantForm.sellingPrice)) || parseFloat(variantForm.sellingPrice) <= 0) {
      setModalFeedback({ type: 'error', text: 'Please enter a valid Selling Price (₹) for this variant. Selling price is required.' });
      return;
    }

    if (parseFloat(variantForm.sellingPrice) > parseFloat(variantForm.price)) {
      setModalFeedback({ type: 'error', text: 'Selling Price cannot be greater than Regular Price.' });
      return;
    }

    if (!variantForm.stock || isNaN(parseInt(variantForm.stock, 10)) || parseInt(variantForm.stock, 10) < 0) {
      setModalFeedback({ type: 'error', text: 'Please enter valid Stock Units (0 or more). Stock is required.' });
      return;
    }

    const totalVariantImages = variantForm.images.length + variantForm.imageFiles.length;
    if (totalVariantImages === 0 && !variantForm.imageInput.trim()) {
      setModalFeedback({ type: 'error', text: 'Please add at least one Image for this variant. Image is required.' });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);

    try {
      // Build FormData to send variant fields and image files together to backend controller
      const varFormData = new FormData();
      varFormData.append('price', String(parseFloat(variantForm.price) || 0));
      if (variantForm.sellingPrice) {
        varFormData.append('sellingPrice', String(parseFloat(variantForm.sellingPrice)));
      }
      varFormData.append('stock', String(parseInt(variantForm.stock, 10) || 0));
      if (variantForm.colorId) varFormData.append('colorId', variantForm.colorId);
      if (variantForm.sizeId) varFormData.append('sizeId', variantForm.sizeId);
      if (variantForm.sku) varFormData.append('sku', variantForm.sku);
      varFormData.append('displayType', String(variantForm.displayType !== undefined ? Number(variantForm.displayType) : 0));
      varFormData.append('isPublished', String(variantForm.isPublished));

      // Append existing permanent URLs (filter out local blob: preview URLs)
      const existingUrls = variantForm.images.filter((img) => !img.startsWith('blob:'));
      if (
        variantForm.imageInput.trim() &&
        !variantForm.imageInput.trim().startsWith('blob:') &&
        !existingUrls.includes(variantForm.imageInput.trim())
      ) {
        existingUrls.push(variantForm.imageInput.trim());
      }
      existingUrls.forEach((img) => varFormData.append('existingImages', img));

      // Append image files so controller uploads them to Cloudflare R2 and saves URLs in product_variants
      if (variantForm.imageFiles && variantForm.imageFiles.length > 0) {
        variantForm.imageFiles.forEach((file) => varFormData.append('files', file));
      }

      if (variantForm.variantId) {
        const res = await updateAdminVariant(authToken, variantForm.variantId, varFormData);
        if (!res.ok) {
          throw new Error(res.data?.message || 'Failed to update variant');
        }
      } else {
        const res = await addAdminVariant(authToken, variantForm.productId, varFormData);
        if (!res.ok) {
          throw new Error(res.data?.message || 'Failed to create variant');
        }
      }

      // Cleanup local blob preview URLs
      for (const img of variantForm.images) {
        if (img?.startsWith('blob:')) {
          try { URL.revokeObjectURL(img); } catch { }
        }
      }

      setModalFeedback({
        type: 'success',
        text: `Variant for "${variantForm.productName}" updated and images saved to R2 successfully!`,
      });
      await loadAdminProducts();
      setTimeout(() => {
        setActiveModal('NONE');
        setModalFeedback(null);
      }, 1000);
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        text: err.message || 'Error updating variant. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate toggle for publish / archive
  const handleQuickTogglePublish = async () => {
    if (!variantForm.variantId) {
      setVariantForm((prev) => ({ ...prev, isPublished: !prev.isPublished }));
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) return;

    const nextState = !variantForm.isPublished;
    setIsSubmitting(true);
    try {
      const res = await setAdminVariantPublish(authToken, variantForm.variantId, nextState);
      if (res.ok) {
        setVariantForm((prev) => ({ ...prev, isPublished: nextState }));
        setModalFeedback({
          type: 'success',
          text: `Variant status set to ${nextState ? 'Published' : 'Archived'}!`,
        });
        await loadAdminProducts();
      } else {
        setModalFeedback({ type: 'error', text: res.data?.message || 'Failed to toggle status' });
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Error updating status' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Feature array handlers
  const handleAddFeature = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const feat = productForm.featureInput.trim();
    if (!feat) return;
    if (!productForm.features.includes(feat)) {
      setProductForm((prev) => ({
        ...prev,
        features: [...prev.features, feat],
        featureInput: '',
      }));
    } else {
      setProductForm((prev) => ({ ...prev, featureInput: '' }));
    }
  };

  const handleRemoveFeature = (indexToRemove: number) => {
    setProductForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Image array handlers for variant staging
  const handleAddImage = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const url = productForm.imageInput.trim();
    if (!url) return;
    if (!productForm.images.includes(url)) {
      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, url],
        imageInput: '',
      }));
    } else {
      setProductForm((prev) => ({ ...prev, imageInput: '' }));
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const targetUrl = productForm.images[indexToRemove];
    if (!targetUrl) return;

    // When updating a product/variant or if the image is an existing R2 asset, prompt confirmation
    if (
      productForm.isEditing ||
      productForm.selectedProductId ||
      productForm.editingVariantId ||
      !targetUrl.startsWith('blob:')
    ) {
      setImageToDelete({
        url: targetUrl,
        index: indexToRemove,
        type: 'productForm',
        productId: productForm.selectedProductId || undefined,
        variantId: productForm.editingVariantId || undefined,
      });
      return;
    }

    // Local-only blob removal (before saving/uploading)
    try {
      URL.revokeObjectURL(targetUrl);
    } catch { }
    const blobIndex = productForm.images.slice(0, indexToRemove).filter((u) => u.startsWith('blob:')).length;
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
      imageFiles: prev.imageFiles.filter((_, idx) => idx !== blobIndex),
    }));
  };

  // Called when user clicks "Yes, Delete from R2" in the confirmation modal
  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;
    const { url, index, type, productId, variantId } = imageToDelete;

    // If local preview blob, just discard it locally
    if (url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch { }
      if (type === 'productForm') {
        const blobIndex = productForm.images.slice(0, index).filter((u) => u.startsWith('blob:')).length;
        setProductForm((prev) => ({
          ...prev,
          images: prev.images.filter((_, idx) => idx !== index),
          imageFiles: prev.imageFiles.filter((_, idx) => idx !== blobIndex),
        }));
      } else {
        const blobIndex = variantForm.images.slice(0, index).filter((u) => u.startsWith('blob:')).length;
        setVariantForm((prev) => ({
          ...prev,
          images: prev.images.filter((_, idx) => idx !== index),
          imageFiles: prev.imageFiles.filter((_, idx) => idx !== blobIndex),
        }));
      }
      setImageToDelete(null);
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      setImageToDelete(null);
      return;
    }

    setIsDeletingImage(true);
    try {
      let isSuccess = false;
      let feedbackMsg = '';

      if (type === 'variantForm') {
        if (variantId) {
          const res = await deleteAdminVariantImage(authToken, variantId, url);
          if (res.ok) {
            isSuccess = true;
          } else {
            feedbackMsg = res.message || 'Failed to remove image from variant';
          }
        } else {
          const res = await deleteImageFromR2(authToken, url);
          if (res.ok) isSuccess = true;
          else feedbackMsg = res.message || 'Failed to delete file from Cloudflare R2';
        }

        setVariantForm((prev) => ({
          ...prev,
          images: prev.images.filter((_, i) => i !== index),
        }));
      } else {
        // type === 'productForm'
        if (variantId) {
          const res = await deleteAdminVariantImage(authToken, variantId, url);
          if (res.ok) isSuccess = true;
        } else if (productId) {
          const res = await deleteAdminProductImage(authToken, productId, url);
          if (res.ok) {
            isSuccess = true;
          } else {
            feedbackMsg = res.message || 'Failed to remove image from product';
          }
        } else {
          const res = await deleteImageFromR2(authToken, url);
          if (res.ok) isSuccess = true;
          else feedbackMsg = res.message || 'Failed to delete file from Cloudflare R2';
        }

        setProductForm((prev) => ({
          ...prev,
          images: prev.images.filter((_, idx) => idx !== index),
        }));
      }

      await loadAdminProducts();

      setModalFeedback({
        type: isSuccess ? 'success' : 'error',
        text: isSuccess
          ? 'Image deleted from Cloudflare R2 and removed successfully!'
          : feedbackMsg || 'Image removed from form',
      });
      setTimeout(() => {
        setModalFeedback(null);
      }, 3500);
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        text: err.message || 'Failed to delete image from Cloudflare R2',
      });
    } finally {
      setIsDeletingImage(false);
      setImageToDelete(null);
    }
  };

  // Direct file selection for variant image (5MB max)
  // Does NOT call upload API on select; file is uploaded to Cloudflare R2 when the user clicks Save Product
  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 5MB limit
    const MAX_MB = 5;
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      setModalFeedback({
        type: 'error',
        text: `Image "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed size is ${MAX_MB} MB.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.type && !file.type.startsWith('image/')) {
      setModalFeedback({
        type: 'error',
        text: `File "${file.name}" is not a valid image. Only JPG, PNG, WEBP, or GIF are allowed.`,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Create local object URL for instant preview without network call
    const previewUrl = URL.createObjectURL(file);
    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, previewUrl],
      imageFiles: [...prev.imageFiles, file],
    }));

    setModalFeedback({
      type: 'success',
      text: `Selected "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB). Will upload to Cloudflare R2 when you click Save.`,
    });
    setTimeout(() => {
      setModalFeedback(null);
    }, 3000);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };  // Stage a variant into the bottom table & clear Part 2 inputs
  const handleAddVariantToStaging = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!productForm.colorId) {
      setModalFeedback({ type: 'error', text: 'Please select a Color for this variant. Color is required.' });
      return;
    }
    if (!productForm.price || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
      setModalFeedback({ type: 'error', text: 'Please enter a valid Regular Price (₹) for this variant. Price is required.' });
      return;
    }
    if (!productForm.sellingPrice || isNaN(parseFloat(productForm.sellingPrice)) || parseFloat(productForm.sellingPrice) <= 0) {
      setModalFeedback({ type: 'error', text: 'Please enter a valid Selling Price (₹) for this variant. Selling price is required.' });
      return;
    }
    if (parseFloat(productForm.sellingPrice) > parseFloat(productForm.price)) {
      setModalFeedback({ type: 'error', text: 'Selling Price cannot be greater than Regular Price.' });
      return;
    }
    if (!productForm.stock || isNaN(parseInt(productForm.stock, 10)) || parseInt(productForm.stock, 10) < 0) {
      setModalFeedback({ type: 'error', text: 'Please enter valid Stock Units (0 or more) for this variant. Stock is required.' });
      return;
    }

    const finalImages = [...productForm.images];
    if (productForm.imageInput.trim() && !finalImages.includes(productForm.imageInput.trim())) {
      finalImages.push(productForm.imageInput.trim());
    }

    if (finalImages.length === 0 && productForm.imageFiles.length === 0) {
      setModalFeedback({ type: 'error', text: 'Please add at least one Image for this variant. Image is required.' });
      return;
    }

    const col = rawColors.find((c) => c.id === productForm.colorId);
    const sz = rawSizes.find((s) => s.id === productForm.sizeId);

    const newVariant: StagedVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      colorId: productForm.colorId || undefined,
      colorName: col?.name,
      colorHex: col?.hexCode,
      sizeId: productForm.sizeId || undefined,
      sizeCode: sz?.code,
      sizeName: sz?.name,
      price: parseFloat(productForm.price) || 0,
      sellingPrice: parseFloat(productForm.sellingPrice),
      stock: parseInt(productForm.stock, 10) || 0,
      images: finalImages,
      imageFiles: [...productForm.imageFiles],
    };

    setStagedVariants((prev) => [...prev, newVariant]);

    // Clear Part 2 inputs for next variant
    setProductForm((prev) => ({
      ...prev,
      colorId: '',
      sizeId: '',
      price: '',
      sellingPrice: '',
      stock: '',
      images: [],
      imageFiles: [],
      imageInput: '',
    }));

    setModalFeedback({
      type: 'success',
      text: `Variant added to table (${sz?.code || 'Free Size'}${col?.name ? ` • ${col.name}` : ''}). Add another or save product below.`,
    });
    setTimeout(() => {
      setModalFeedback(null);
    }, 4000);
  };

  const handleRemoveStagedVariant = (id: string) => {
    const target = stagedVariants.find((v) => v.id === id);
    if (target?.images) {
      for (const img of target.images) {
        if (img?.startsWith('blob:')) {
          try { URL.revokeObjectURL(img); } catch { }
        }
      }
    }
    setStagedVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // Action handlers: Save Product and all variants
  // Performs the product save API call where controller uploads image files to R2 and writes URLs to product_variants table
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      setModalFeedback({ type: 'error', text: 'Product name is required.' });
      return;
    }
    if (!productForm.tagline.trim()) {
      setModalFeedback({ type: 'error', text: 'Product tagline is required.' });
      return;
    }
    if (!productForm.categoryId) {
      setModalFeedback({ type: 'error', text: 'Please select a Category. Category is required.' });
      return;
    }
    if (!productForm.description.trim()) {
      setModalFeedback({ type: 'error', text: 'Product description is required.' });
      return;
    }

    // Auto-include any entered feature that wasn't explicitly added via button
    const finalFeatures = [...productForm.features];
    if (productForm.featureInput.trim() && !finalFeatures.includes(productForm.featureInput.trim())) {
      finalFeatures.push(productForm.featureInput.trim());
    }

    if (finalFeatures.length === 0) {
      setModalFeedback({ type: 'error', text: 'Please add at least one Feature for this product. Features are required.' });
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    // Check variants: if user has pending variant inputs in Part 2 and no variants staged yet, auto-stage it
    let variantsToSubmit = [...stagedVariants];
    if (variantsToSubmit.length === 0 && productForm.price) {
      if (!productForm.colorId) {
        setModalFeedback({ type: 'error', text: 'Please select a Color for this variant. Color is required.' });
        return;
      }
      if (!productForm.price || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
        setModalFeedback({ type: 'error', text: 'Please enter a valid Regular Price (₹) for this variant. Price is required.' });
        return;
      }
      if (!productForm.sellingPrice || isNaN(parseFloat(productForm.sellingPrice)) || parseFloat(productForm.sellingPrice) <= 0) {
        setModalFeedback({ type: 'error', text: 'Please enter a valid Selling Price (₹) for this variant. Selling price is required.' });
        return;
      }
      if (parseFloat(productForm.sellingPrice) > parseFloat(productForm.price)) {
        setModalFeedback({ type: 'error', text: 'Selling Price cannot be greater than Regular Price.' });
        return;
      }
      if (!productForm.stock || isNaN(parseInt(productForm.stock, 10)) || parseInt(productForm.stock, 10) < 0) {
        setModalFeedback({ type: 'error', text: 'Please enter valid Stock Units (0 or more) for this variant. Stock is required.' });
        return;
      }

      const finalImages = [...productForm.images];
      if (productForm.imageInput.trim() && !finalImages.includes(productForm.imageInput.trim())) {
        finalImages.push(productForm.imageInput.trim());
      }
      if (finalImages.length === 0 && productForm.imageFiles.length === 0) {
        setModalFeedback({ type: 'error', text: 'Please add at least one Image for this variant. Image is required.' });
        return;
      }

      const col = rawColors.find((c) => c.id === productForm.colorId);
      const sz = rawSizes.find((s) => s.id === productForm.sizeId);

      variantsToSubmit.push({
        id: 'auto-1',
        colorId: productForm.colorId || undefined,
        colorName: col?.name,
        colorHex: col?.hexCode,
        sizeId: productForm.sizeId || undefined,
        sizeCode: sz?.code,
        sizeName: sz?.name,
        price: parseFloat(productForm.price) || 0,
        sellingPrice: parseFloat(productForm.sellingPrice),
        stock: parseInt(productForm.stock, 10) || 0,
        images: finalImages,
        imageFiles: [...productForm.imageFiles],
      });
    }

    if (variantsToSubmit.length === 0) {
      setModalFeedback({
        type: 'error',
        text: 'Please configure at least one variant and click "+ Add Variant to Table" before saving.',
      });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);
    try {
      if (productForm.isEditing || productForm.selectedProductId) {
        const prodId = productForm.selectedProductId;

        // 1. Update Part 1 fields if user edited them
        await updateAdminProduct(authToken, prodId, {
          name: productForm.name.trim(),
          tagline: productForm.tagline.trim() || undefined,
          description: productForm.description.trim() || undefined,
          features: finalFeatures.length > 0 ? finalFeatures : undefined,
          categoryId: productForm.categoryId || undefined,
          displayType: productForm.displayType !== undefined ? Number(productForm.displayType) : 0,
        });

        // 2. If editing a specific variant, update its details with FormData (uploading image files to R2)
        if (productForm.editingVariantId) {
          const finalImages = [...productForm.images];
          if (productForm.imageInput.trim() && !finalImages.includes(productForm.imageInput.trim())) {
            finalImages.push(productForm.imageInput.trim());
          }

          const varFormData = new FormData();
          if (productForm.colorId) varFormData.append('colorId', productForm.colorId);
          if (productForm.sizeId) varFormData.append('sizeId', productForm.sizeId);
          varFormData.append('price', String(parseFloat(productForm.price) || 0));
          if (productForm.sellingPrice) {
            varFormData.append('sellingPrice', String(parseFloat(productForm.sellingPrice)));
          }
          varFormData.append('stock', String(parseInt(productForm.stock, 10) || 0));
          varFormData.append('displayType', String(productForm.displayType !== undefined ? Number(productForm.displayType) : 0));

          // Append existing permanent URLs (filter out local blob: URLs)
          finalImages
            .filter((img) => !img.startsWith('blob:'))
            .forEach((img) => varFormData.append('existingImages', img));

          // Append files to upload to R2
          if (productForm.imageFiles && productForm.imageFiles.length > 0) {
            productForm.imageFiles.forEach((f) => varFormData.append('files', f));
          }

          await updateAdminVariant(authToken, productForm.editingVariantId, varFormData);
        }

        // 3. Add any newly staged variants to this product with FormData
        let addedCount = 0;
        for (const v of variantsToSubmit) {
          if (v.id.startsWith('new-') || (!productForm.editingVariantId && !productForm.isEditing)) {
            const vFormData = new FormData();
            if (v.colorId) vFormData.append('colorId', v.colorId);
            if (v.sizeId) vFormData.append('sizeId', v.sizeId);
            vFormData.append('price', String(v.price));
            if (v.sellingPrice) vFormData.append('sellingPrice', String(v.sellingPrice));
            vFormData.append('stock', String(v.stock));
            vFormData.append('displayType', String(v.displayType !== undefined ? Number(v.displayType) : (productForm.displayType !== undefined ? Number(productForm.displayType) : 0)));
            vFormData.append('isPublished', 'false');

            // Append existing permanent URLs
            (v.images || [])
              .filter((img) => !img.startsWith('blob:'))
              .forEach((img) => vFormData.append('existingImages', img));

            // Append files to upload to R2
            if (v.imageFiles && v.imageFiles.length > 0) {
              v.imageFiles.forEach((f) => vFormData.append('files', f));
            }

            const vRes = await addAdminVariant(authToken, prodId, vFormData);
            if (vRes.ok) addedCount++;
          }
        }

        setModalFeedback({
          type: 'success',
          text: productForm.isEditing
            ? `Product "${productForm.name}" and variant updated successfully!`
            : `Product "${productForm.name}" updated and ${addedCount} variant(s) added successfully!`,
        });
        await loadAdminProducts();
        setTimeout(() => {
          setActiveModal('NONE');
          resetFormState();
        }, 1200);
        return;
      }

      // Creating a new product with all its variants via multipart FormData
      const prodFormData = new FormData();
      prodFormData.append('name', productForm.name.trim());
      if (productForm.tagline.trim()) prodFormData.append('tagline', productForm.tagline.trim());
      if (productForm.description.trim()) prodFormData.append('description', productForm.description.trim());
      if (productForm.categoryId) prodFormData.append('categoryId', productForm.categoryId);
      prodFormData.append('displayType', String(productForm.displayType !== undefined ? Number(productForm.displayType) : 0));
      if (finalFeatures.length > 0) {
        prodFormData.append('features', JSON.stringify(finalFeatures));
      }

      // Build clean variants payload (exclude local blob: URLs) - default to isPublished: false (Archived)
      const variantsPayload = variantsToSubmit.map((v) => ({
        colorId: v.colorId || undefined,
        sizeId: v.sizeId || undefined,
        price: v.price,
        sellingPrice: v.sellingPrice || undefined,
        stock: v.stock,
        displayType: v.displayType !== undefined ? Number(v.displayType) : (productForm.displayType !== undefined ? Number(productForm.displayType) : 0),
        images: (v.images || []).filter((img) => !img.startsWith('blob:')),
        isPublished: false,
      }));
      prodFormData.append('variants', JSON.stringify(variantsPayload));
      prodFormData.append('isPublished', 'false');

      // Append image files for each variant into FormData
      variantsToSubmit.forEach((v, idx) => {
        if (v.imageFiles && v.imageFiles.length > 0) {
          v.imageFiles.forEach((file) => {
            prodFormData.append(`variant_${idx}_images`, file);
            if (idx === 0) {
              prodFormData.append('files', file);
            }
          });
        }
      });

      const res = await createAdminProduct(authToken, prodFormData);

      if (res.ok) {
        setModalFeedback({
          type: 'success',
          text: `Product "${productForm.name}" saved successfully with ${variantsToSubmit.length} variant(s)! Images uploaded to R2.`,
        });
        await loadAdminProducts();
        setTimeout(() => {
          setActiveModal('NONE');
          resetFormState();
        }, 1200);
      } else {
        setModalFeedback({
          type: 'error',
          text: res.data?.message || 'Failed to create product',
        });
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Error creating product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setModalFeedback({ type: 'error', text: 'Category name is required' });
      return;
    }
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);
    try {
      const slug = categoryForm.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const res = await createAdminCategory(authToken, {
        name: categoryForm.name.trim(),
        slug,
        description: categoryForm.description.trim() || undefined,
      });

      if (res.ok) {
        setModalFeedback({ type: 'success', text: 'Category created successfully!' });
        await loadMetadata();
        await loadAdminProducts();
        setCategoryForm({ name: '', description: '' });
      } else {
        setModalFeedback({
          type: 'error',
          text: res.data?.message || 'Failed to create category',
        });
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Error creating category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorForm.name.trim() || !colorForm.hexCode.trim()) {
      setModalFeedback({ type: 'error', text: 'Color name and hex code are required' });
      return;
    }
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);
    try {
      const res = await createAdminColor(authToken, {
        name: colorForm.name.trim(),
        hexCode: colorForm.hexCode.trim(),
      });

      if (res.ok) {
        setModalFeedback({ type: 'success', text: 'Color added successfully!' });
        await loadMetadata();
        setColorForm({ name: '', hexCode: '#000000' });
      } else {
        setModalFeedback({
          type: 'error',
          text: res.data?.message || 'Failed to create color',
        });
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Error creating color' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sizeForm.name.trim() || !sizeForm.code.trim()) {
      setModalFeedback({ type: 'error', text: 'Size name and code are required' });
      return;
    }
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);
    try {
      const res = await createAdminSize(authToken, {
        name: sizeForm.name.trim(),
        code: sizeForm.code.trim().toUpperCase(),
        sortOrder: Number(sizeForm.sortOrder) || 0,
      });

      if (res.ok) {
        setModalFeedback({ type: 'success', text: 'Size added successfully!' });
        await loadMetadata();
        setSizeForm({ name: '', code: '', sortOrder: (rawSizes.length || 0) + 1 });
      } else {
        setModalFeedback({
          type: 'error',
          text: res.data?.message || 'Failed to create size',
        });
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Error creating size' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSize = async (id: string, label: string) => {
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    setDeletingSizeId(id);
    setModalFeedback(null);
    try {
      const res = await deleteAdminSize(authToken, id);
      if (res.ok) {
        setModalFeedback({ type: 'success', text: `Size ${label} deleted successfully!` });
        await loadMetadata();
      } else {
        setModalFeedback({
          type: 'error',
          text: res.data?.message || 'Failed to delete size: it is currently assigned to product variants.',
        });
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Error deleting size' });
    } finally {
      setDeletingSizeId(null);
    }
  };

  const handleDeleteColor = async (id: string, label: string) => {
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    setDeletingColorId(id);
    setModalFeedback(null);
    try {
      const res = await deleteAdminColor(authToken, id);
      if (res.ok) {
        setModalFeedback({ type: 'success', text: `Color ${label} deleted successfully!` });
        await loadMetadata();
      } else {
        setModalFeedback({
          type: 'error',
          text: res.data?.message || 'Failed to delete color: it is currently assigned to product variants.',
        });
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Error deleting color' });
    } finally {
      setDeletingColorId(null);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    setDeletingCategoryId(id);
    setModalFeedback(null);
    try {
      const res = await deleteAdminCategory(authToken, id);
      if (res.ok) {
        setModalFeedback({ type: 'success', text: `Category "${name}" deleted successfully!` });
        await loadMetadata();
        await loadAdminProducts();
      } else {
        setModalFeedback({
          type: 'error',
          text: res.data?.message || 'Failed to delete category: it is assigned to existing products.',
        });
      }
    } catch (err: any) {
      setModalFeedback({ type: 'error', text: err.message || 'Error deleting category' });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  // Carousel Handlers
  const handleCarouselFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    const validFiles: File[] = [];
    const previewUrls: string[] = [];

    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE) {
        setModalFeedback({
          type: 'error',
          text: `File "${f.name}" exceeds 5 MB limit (${(f.size / (1024 * 1024)).toFixed(2)} MB)`,
        });
        continue;
      }
      if (f.type && !f.type.startsWith('image/')) {
        setModalFeedback({
          type: 'error',
          text: `File "${f.name}" is not an image.`,
        });
        continue;
      }
      validFiles.push(f);
      previewUrls.push(URL.createObjectURL(f));
    }

    if (validFiles.length > 0) {
      setCarouselForm((prev) => ({
        ...prev,
        imageFiles: [...prev.imageFiles, ...validFiles],
        images: [...prev.images, ...previewUrls],
      }));
      setModalFeedback({
        type: 'success',
        text: `Added ${validFiles.length} image(s) to carousel. Ready to save!`,
      });
    }

    if (carouselFileInputRef.current) {
      carouselFileInputRef.current.value = '';
    }
  };

  const handleRemoveCarouselImage = (indexToRemove: number) => {
    setCarouselForm((prev) => {
      const removedUrl = prev.images[indexToRemove];
      if (removedUrl?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(removedUrl);
        } catch { }
      }
      const newImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      const newFiles = prev.imageFiles.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: newImages,
        imageFiles: newFiles,
      };
    });
    setPreviewSlideIndex(0);
  };

  const handleCreateCarousel = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    if (!carouselForm.title.trim()) {
      setModalFeedback({ type: 'error', text: 'Please enter a carousel title.' });
      return;
    }

    if (carouselForm.images.length === 0 && carouselForm.imageFiles.length === 0) {
      setModalFeedback({ type: 'error', text: 'Please upload at least 1 image for the carousel.' });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);

    try {
      // Retain existing valid URLs (excluding temporary blob preview URLs)
      const existingUrls = carouselForm.images.filter((img) => !img.startsWith('blob:'));

      const res = await createAdminCarousel(authToken, {
        title: carouselForm.title.trim(),
        description: carouselForm.description.trim(),
        isActive: carouselForm.isActive,
        images: existingUrls,
        files: carouselForm.imageFiles,
      });

      if (res.ok) {
        setModalFeedback({
          type: 'success',
          text: `Carousel "${carouselForm.title}" saved successfully to Cloudflare R2!`,
        });

        // Revoke temporary blobs
        carouselForm.images.forEach((img) => {
          if (img.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(img);
            } catch { }
          }
        });

        // Reset form
        setCarouselForm({
          title: '',
          description: '',
          isActive: true,
          images: [],
          imageFiles: [],
        });
        setIsAddingNewCarousel(false);
        setPreviewSlideIndex(0);

        // Refresh list
        const crs = await fetchCarousels();
        setRawCarousels(crs);
      } else {
        setModalFeedback({
          type: 'error',
          text: res.message || 'Failed to save carousel.',
        });
      }
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        text: err.message || 'Network error while creating carousel.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateCarousel = async (id: string, title: string) => {
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    setActivatingCarouselId(id);
    setModalFeedback(null);

    try {
      const res = await activateAdminCarousel(authToken, id);
      if (res.ok) {
        setModalFeedback({
          type: 'success',
          text: `Carousel "${title}" is now active on the storefront banner!`,
        });
        const crs = await fetchCarousels();
        setRawCarousels(crs);
      } else {
        setModalFeedback({
          type: 'error',
          text: res.message || 'Failed to activate carousel.',
        });
      }
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        text: err.message || 'Error activating carousel.',
      });
    } finally {
      setActivatingCarouselId(null);
    }
  };

  const handleRequestDeleteCarousel = (item: CarouselItem) => {
    if (item.isActive) {
      setActiveCarouselWarning(item);
      return;
    }
    setModalFeedback(null);
    setCarouselToDelete(item);
  };

  const handleConfirmDeleteCarousel = async () => {
    if (!carouselToDelete) return;
    const { id, title, isActive } = carouselToDelete;

    if (isActive) {
      setModalFeedback({
        type: 'error',
        text: 'Active carousel cannot be deleted. Please activate another carousel first.',
      });
      setCarouselToDelete(null);
      return;
    }

    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      setCarouselToDelete(null);
      return;
    }

    setDeletingCarouselId(id);
    setModalFeedback(null);

    try {
      const res = await deleteAdminCarousel(authToken, id);
      if (res.ok) {
        setModalFeedback({
          type: 'success',
          text: `Carousel "${title}" deleted successfully and images purged from R2!`,
        });
        const crs = await fetchCarousels();
        setRawCarousels(crs);
        setCarouselToDelete(null);
      } else {
        setModalFeedback({
          type: 'error',
          text: res.message || 'Failed to delete carousel.',
        });
      }
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        text: err.message || 'Error deleting carousel.',
      });
    } finally {
      setDeletingCarouselId(null);
    }
  };

  // Trigger confirmation modal for deleting a variant
  const handleRequestDeleteVariant = (row: VariantRowItem) => {
    if (!row.variantId) {
      setModalFeedback({ type: 'error', text: 'Variant ID is missing for this item.' });
      return;
    }
    const matchingProduct = products.find((p) => String(p.id) === String(row.product.id));
    const variantCount = matchingProduct?.variants?.length || 1;

    setVariantToDelete({
      variantId: row.variantId,
      productId: String(row.product.id),
      productName: row.name,
      colorName: row.colorName,
      colorHex: row.colorHex,
      sizeCode: row.sizeCode,
      price: row.price,
      sellingPrice: row.sellingPrice,
      image: row.image,
      isOnlyVariant: variantCount <= 1,
    });
  };

  // Perform variant deletion after confirmation
  const handleConfirmDeleteVariant = async () => {
    if (!variantToDelete) return;
    const { variantId, productName, isOnlyVariant, productId } = variantToDelete;
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      setVariantToDelete(null);
      return;
    }

    setIsDeletingVariant(true);
    try {
      const res = await deleteAdminVariant(authToken, variantId);
      if (res.ok) {
        // If this was the only variant, also clean up the product so catalog doesn't leave orphaned empty product
        if (isOnlyVariant && productId) {
          await deleteAdminProduct(authToken, productId).catch(() => { });
        }

        setModalFeedback({
          type: 'success',
          text: `Variant for "${productName}" deleted successfully and images removed from R2!`,
        });
        setVariantToDelete(null);
        if (activeModal === 'EDIT_VARIANT') {
          setActiveModal('NONE');
        }
        await loadAdminProducts();
      } else {
        setModalFeedback({
          type: 'error',
          text: res.message || 'Failed to delete variant.',
        });
      }
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        text: err.message || 'Error deleting variant.',
      });
    } finally {
      setIsDeletingVariant(false);
    }
  };

  // Trigger confirmation modal for deleting an entire product
  const handleRequestDeleteProduct = (product: Product) => {
    setProductToDelete({
      productId: String(product.id),
      productName: product.name,
      categoryName: product.categoryName || 'General',
      variantCount: product.variants?.length || 0,
      image: product.images?.[0] || product.colors?.[0]?.images?.[0],
    });
  };

  // Perform product deletion after confirmation
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { productId, productName } = productToDelete;
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      setProductToDelete(null);
      return;
    }

    setIsDeletingProduct(true);
    try {
      const res = await deleteAdminProduct(authToken, productId);
      if (res.ok) {
        setModalFeedback({
          type: 'success',
          text: `Product "${productName}" and all associated variants & images deleted successfully!`,
        });
        setProductToDelete(null);
        if (activeModal === 'ADD_PRODUCT' || activeModal === 'EDIT_VARIANT') {
          setActiveModal('NONE');
          resetFormState();
        }
        await loadAdminProducts();
      } else {
        setModalFeedback({
          type: 'error',
          text: res.message || 'Failed to delete product.',
        });
      }
    } catch (err: any) {
      setModalFeedback({
        type: 'error',
        text: err.message || 'Error deleting product.',
      });
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const authorized = isMounted && (isAdmin || user?.role?.toLowerCase() === 'admin');

  // Flatten products into variant-based rows for dashboard table
  const variantRows = useMemo(() => {
    const list: VariantRowItem[] = [];

    for (const p of products) {
      const pCategoryName =
        typeof p.categoryId === 'object' && p.categoryId !== null
          ? p.categoryId.categoryName || p.categoryId.name || 'General'
          : p.categoryName || p.categoryId || 'General';

      const fallbackImg =
        (p.colors?.[0]?.images?.[0] && formatProductImageUrl(p.colors[0].images[0])) ||
        (p.images?.[0] && formatProductImageUrl(p.images[0])) ||
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80';

      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any, vIdx: number) => {
          const col =
            rawColors.find((c) => c.id === (v.color?.id || v.colorId)) || v.color;
          const sz =
            rawSizes.find((s) => s.id === (v.size?.id || v.sizeId)) || v.size;

          const vPrice =
            v.price !== undefined && !isNaN(parseFloat(v.price))
              ? parseFloat(v.price)
              : p.price || 0;

          const vSellingPrice =
            v.sellingPrice !== undefined && v.sellingPrice !== null && !isNaN(parseFloat(v.sellingPrice))
              ? parseFloat(v.sellingPrice)
              : v.selling_price !== undefined && v.selling_price !== null && !isNaN(parseFloat(v.selling_price))
                ? parseFloat(v.selling_price)
                : undefined;

          const vStock =
            typeof v.stock === 'number'
              ? v.stock
              : parseInt(v.stock, 10) || 0;

          // Robustly parse variant images (array or JSON string)
          const vImages = Array.isArray(v.images)
            ? v.images
            : typeof v.images === 'string' && v.images.startsWith('[')
              ? (() => {
                try {
                  return JSON.parse(v.images);
                } catch {
                  return [];
                }
              })()
              : v.images
                ? [v.images]
                : [];

          const colImages = Array.isArray(col?.images)
            ? col.images
            : typeof col?.images === 'string' && col.images.startsWith('[')
              ? (() => {
                try {
                  return JSON.parse(col.images);
                } catch {
                  return [];
                }
              })()
              : col?.images
                ? [col.images]
                : [];

          const pImages = Array.isArray(p.images)
            ? p.images
            : typeof (p.images as any) === 'string' && (p.images as any).startsWith('[')
              ? (() => {
                try {
                  return JSON.parse(p.images as any);
                } catch {
                  return [];
                }
              })()
              : p.images
                ? [p.images]
                : [];

          const rawImg =
            (vImages.length > 0 && vImages[0]) ||
            (colImages.length > 0 && colImages[0]) ||
            (pImages.length > 0 && pImages[0]) ||
            fallbackImg;

          const vImg = formatProductImageUrl(rawImg);

          list.push({
            rowId: v.id || `${p.id}-${v.colorId || 'c'}-${v.sizeId || 's'}-${vIdx}`,
            product: p,
            variant: v,
            variantId: v.id,
            name: p.name,
            tagline: p.tagline || 'Streetwear Apparel',
            categoryName: pCategoryName,
            colorName: col?.name,
            colorHex: col?.hexCode,
            sizeCode: sz?.code || sz?.name,
            sizeName: sz?.name,
            price: vPrice,
            sellingPrice: vSellingPrice,
            stock: vStock,
            displayType: v.displayType !== undefined ? Number(v.displayType) : (p.displayType !== undefined ? Number(p.displayType) : 0),
            isOutOfStock: vStock <= 0,
            isPublished:
              v.isPublished !== undefined
                ? Boolean(v.isPublished)
                : v.published !== undefined
                  ? Boolean(v.published)
                  : true,
            sku: v.sku || '',
            image: vImg,
          });
        });
      } else {
        const pStock = p.stock !== undefined ? p.stock : 0;
        const pImages = Array.isArray(p.images)
          ? p.images
          : typeof (p.images as any) === 'string' && (p.images as any).startsWith('[')
            ? (() => {
              try {
                return JSON.parse(p.images as any);
              } catch {
                return [];
              }
            })()
            : p.images
              ? [p.images]
              : [];
        const rawImg = (pImages.length > 0 && pImages[0]) || fallbackImg;

        list.push({
          rowId: String(p.id),
          product: p,
          variant: null,
          variantId: undefined,
          name: p.name,
          tagline: p.tagline || 'Streetwear Apparel',
          categoryName: pCategoryName,
          colorName: p.colors?.[0]?.name,
          colorHex: p.colors?.[0]?.hex,
          sizeCode: p.sizes?.[0],
          price: p.price || 0,
          sellingPrice: p.sellingPrice,
          stock: pStock,
          displayType: p.displayType !== undefined ? Number(p.displayType) : 0,
          isOutOfStock: pStock <= 0,
          isPublished: true,
          sku: '',
          image: formatProductImageUrl(rawImg),
        });
      }
    }

    return list;
  }, [products, rawColors, rawSizes]);

  // Filtered variant rows based on search, status filter, and category filter
  const filteredVariantRows = useMemo(() => {
    return variantRows.filter((row) => {
      if (statusFilter === 'IN_STOCK' && (row.isOutOfStock || !row.isPublished)) return false;
      if (statusFilter === 'OUT_OF_STOCK' && (!row.isOutOfStock || !row.isPublished)) return false;
      if (statusFilter === 'ARCHIVED' && row.isPublished) return false;

      if (categoryFilter !== 'ALL') {
        if (!row.categoryName.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = row.name.toLowerCase().includes(q);
        const matchesDesc = (row.product.description || '').toLowerCase().includes(q);
        const matchesCat = row.categoryName.toLowerCase().includes(q);
        const matchesColor = (row.colorName || '').toLowerCase().includes(q);
        const matchesSize = (row.sizeCode || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesColor && !matchesSize) {
          return false;
        }
      }

      return true;
    });
  }, [variantRows, statusFilter, categoryFilter, searchQuery]);

  // Statistics calculated from variantRows
  const totalProducts = products.length;
  const totalVariants = variantRows.length;
  const inStockCount = variantRows.filter((r) => !r.isOutOfStock).length;
  const outOfStockCount = variantRows.filter((r) => r.isOutOfStock).length;
  const totalStockUnits = variantRows.reduce((sum, r) => sum + r.stock, 0);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const c =
        typeof p.categoryId === 'object' && p.categoryId !== null
          ? p.categoryId.categoryName || p.categoryId.name
          : p.categoryName || p.categoryId;
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [products]);

  // Access Control Screen for non-admins
  if (isMounted && !authorized) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-[#fef08a]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black uppercase tracking-wider text-white mb-2">
            Admin Access Required
          </h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            You must be authenticated with an administrator account (such as{' '}
            <strong className="text-[#fef08a]">admin@stylefox.com</strong>) to access this dashboard.
          </p>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={openProfileOrAuth}
              className="w-full py-3 bg-[#fef08a] text-black font-extrabold uppercase tracking-wider text-xs rounded-full hover:bg-yellow-300 transition-all shadow-lg cursor-pointer"
            >
              Sign In as Admin
            </button>
            <Link
              href="/"
              className="w-full py-3 bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold uppercase tracking-wider text-xs rounded-full hover:bg-zinc-800 hover:text-white transition-all text-center"
            >
              Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      {/* Top Admin Navigation Bar */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 md:px-8 lg:px-10 py-4 w-full">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Return to Storefront"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fef08a]/10 border border-[#fef08a]/30 flex items-center justify-center text-[#fef08a]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm md:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>StyleFox Admin Dashboard</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#fef08a] text-black">
                    PORTAL
                  </span>
                </h1>
                <p className="text-[11px] text-zinc-400 hidden sm:block">
                  Live inventory and catalog control system
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{user?.name || 'Administrator'}</span>
              <span className="text-[10px] text-zinc-400 font-mono">{user?.email || 'admin@stylefox.com'}</span>
            </div>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
            >
              <span>Storefront</span>
            </Link>

            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-full hover:bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Full width with padding only (no margins) */}
      <main className="w-full px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 flex-1 flex flex-col gap-6 sm:gap-8">
        {/* Metric Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
              <Package className="w-4 h-4 text-[#fef08a]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalProducts}</div>
            <span className="text-[11px] text-zinc-500 mt-1">Active in catalog database</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">In Stock</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">{inStockCount}</div>
            <span className="text-[11px] text-zinc-500 mt-1">Available for checkout</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Out of Stock</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-400">{outOfStockCount}</div>
            <span className="text-[11px] text-zinc-500 mt-1">Triggers WhatsApp Rebook</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Units</span>
              <Boxes className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalStockUnits}</div>
            <span className="text-[11px] text-zinc-500 mt-1">Units inventory sum</span>
          </div>
        </div>

        {/* Inventory Control Table Section */}
        <section className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 sm:p-6 flex flex-col gap-6 shadow-2xl">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>Product Catalog &amp; Variant Inventory</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400">
                  {filteredVariantRows.length} variant{filteredVariantRows.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time variant-level inventory, pricing, and stock status management.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter name, color, size, category..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                />
              </div>

              {/* Status Filter */}
              <SearchableSelect
                options={[
                  { value: 'ALL', label: 'All Status' },
                  { value: 'IN_STOCK', label: 'In Stock Only' },
                  { value: 'OUT_OF_STOCK', label: 'Out of Stock (0)' },
                  { value: 'ARCHIVED', label: 'Archived Only' },
                ]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                placeholder="All Status"
                searchPlaceholder="Search status..."
                className="w-36 sm:w-40"
              />

              {/* Category Filter */}
              {categories.length > 0 && (
                <SearchableSelect
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    ...categories.map((c) => ({
                      value: c,
                      label: c,
                    })),
                  ]}
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val)}
                  placeholder="All Categories"
                  searchPlaceholder="Search categories..."
                  className="w-40 sm:w-44"
                />
              )}

              {/* Reload Button */}
              <button
                type="button"
                onClick={loadAdminProducts}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh Product List"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Three Dots Menu Button */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className={`p-2 rounded-lg border text-zinc-400 hover:text-white transition-all cursor-pointer ${isMenuOpen
                      ? 'bg-[#fef08a] text-black border-[#fef08a]'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800'
                    }`}
                  title="Admin Actions"
                  id="admin-menu-dropdown-button"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        resetFormState();
                        setActiveModal('ADD_PRODUCT');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-black hover:bg-[#fef08a] transition-colors text-left cursor-pointer group"
                    >
                      <Plus className="w-4 h-4 text-zinc-400 group-hover:text-black" />
                      <span>Add Product</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setModalFeedback(null);
                        setActiveModal('CATEGORY');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-black hover:bg-[#fef08a] transition-colors text-left cursor-pointer group"
                    >
                      <Layers className="w-4 h-4 text-zinc-400 group-hover:text-black" />
                      <span>Category</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setModalFeedback(null);
                        setActiveModal('COLORS');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-black hover:bg-[#fef08a] transition-colors text-left cursor-pointer group"
                    >
                      <Palette className="w-4 h-4 text-zinc-400 group-hover:text-black" />
                      <span>Colors</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setModalFeedback(null);
                        setActiveModal('SIZE');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-black hover:bg-[#fef08a] transition-colors text-left cursor-pointer group"
                    >
                      <Ruler className="w-4 h-4 text-zinc-400 group-hover:text-black" />
                      <span>Size</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setModalFeedback(null);
                        setActiveModal('CAROUSEL');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-black hover:bg-[#fef08a] transition-colors text-left cursor-pointer group"
                    >
                      <Sliders className="w-4 h-4 text-zinc-400 group-hover:text-black" />
                      <span>Carousel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setModalFeedback(null);
                        setActiveModal('INVOICE');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-black hover:bg-[#fef08a] transition-colors text-left cursor-pointer group border-t border-zinc-800/80 pt-2"
                    >
                      <FileText className="w-4 h-4 text-[#fef08a] group-hover:text-black" />
                      <span>Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setIsMenuOpen(false);
                        setModalFeedback(null);
                        setActiveModal('SETTINGS');
                        setIsLoadingSettings(true);
                        try {
                          const data = await fetchStoreSettings();
                          if (data) {
                            setSettingsForm({
                              whatsappNumber: data.whatsappNumber || '918086388058',
                              freeShippingThreshold: data.freeShippingThreshold !== undefined ? data.freeShippingThreshold : 2000,
                              shippingFee: data.shippingFee !== undefined ? data.shippingFee : 149,
                              offerText: data.offerText !== undefined ? data.offerText : '',
                            });
                          }
                        } catch (err) {
                          console.error('Failed to load settings:', err);
                        } finally {
                          setIsLoadingSettings(false);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-black hover:bg-[#fef08a] transition-colors text-left cursor-pointer group border-t border-zinc-800/80 pt-2"
                    >
                      <Settings className="w-4 h-4 text-[#fef08a] group-hover:text-black" />
                      <span>Settings</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-900">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-900/60 border-b text-center border-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Color</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Price / Selling</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/80">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`skel-${idx}`} className="animate-pulse">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-zinc-900 rounded" />
                          <div className="h-4 w-40 bg-zinc-900 rounded" />
                        </div>
                      </td>
                      <td className="py-3 px-4"><div className="h-4 w-16 bg-zinc-900 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-12 bg-zinc-900 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-20 bg-zinc-900 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-20 bg-zinc-900 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-12 bg-zinc-900 rounded" /></td>
                      <td className="py-3 px-4"><div className="h-4 w-20 bg-zinc-900 rounded" /></td>
                      <td className="py-3 px-4 text-right"><div className="h-4 w-14 bg-zinc-900 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredVariantRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      No product variants matching current search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredVariantRows.map((row) => {
                    const hasDiscount = Boolean(
                      row.sellingPrice &&
                      row.price &&
                      row.sellingPrice < row.price
                    );
                    const discountPercent = hasDiscount
                      ? Math.round(((row.price - row.sellingPrice!) / row.price) * 100)
                      : 0;

                    return (
                      <tr
                        key={row.rowId}
                        className="hover:bg-zinc-900/40 transition-colors group"
                      >
                        {/* 1. Product info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-12 rounded bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800">
                              <img
                                src={formatProductImageUrl(row.image)}
                                alt={row.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (row.image && row.image.includes('.r2.cloudflarestorage.com/')) {
                                    const parts = row.image.split('.r2.cloudflarestorage.com/');
                                    if (parts[1]) {
                                      let key = parts[1].replace(/^\/+/, '');
                                      if (key.startsWith('stylishfox-images/')) {
                                        key = key.replace(/^stylishfox-images\//, '');
                                      }
                                      target.src = `${API_BASE_URL}/uploads/file/${key}`;
                                      return;
                                    }
                                  }
                                  target.src =
                                    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80';
                                }}
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white uppercase truncate max-w-xs md:max-w-sm group-hover:text-[#fef08a] transition-colors">
                                  {row.name}
                                </span>
                                {row.displayType === 2 ? (
                                  <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[9px] font-black uppercase tracking-wider">
                                    Clearing Stock
                                  </span>
                                ) : row.displayType === 1 ? (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-wider">
                                    New
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[9px] font-medium uppercase tracking-wider">
                                    Normal
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-zinc-500 truncate max-w-[140px] sm:max-w-xs">
                                  {row.tagline}
                                </span>
                                {row.sku && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
                                    SKU: {row.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Color */}
                        <td className="py-3 px-4">
                          {row.colorName ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-zinc-700 shrink-0 shadow-sm"
                                style={{ backgroundColor: row.colorHex || '#0d0d0d' }}
                              />
                              <span className="text-zinc-200 font-medium text-xs truncate max-w-[90px]">
                                {row.colorName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-xs">—</span>
                          )}
                        </td>

                        {/* 3. Size */}
                        <td className="py-3 px-4">
                          {row.sizeCode ? (
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono font-bold text-white text-xs">
                              {row.sizeCode}
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-xs">Free Size</span>
                          )}
                        </td>

                        {/* 4. Price / Selling Price */}
                        <td className="py-3 px-4 font-mono">
                          {hasDiscount ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-xs">
                                  ₹ {row.sellingPrice!.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-black text-[#fef08a] bg-[#fef08a]/10 border border-[#fef08a]/30 px-1.5 py-0.2 rounded font-sans tracking-tight">
                                  {discountPercent}% OFF
                                </span>
                              </div>
                              <span className="text-[11px] text-zinc-500 line-through">
                                ₹ {row.price ? row.price.toLocaleString() : '0'}
                              </span>
                            </div>
                          ) : row.sellingPrice ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-xs">
                                ₹ {row.sellingPrice.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                Regular: ₹ {row.price ? row.price.toLocaleString() : '0'}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-white text-xs">
                              ₹ {row.price ? row.price.toLocaleString() : '0'}
                            </span>
                          )}
                        </td>

                        {/* 5. Category */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-medium">
                            {row.categoryName}
                          </span>
                        </td>

                        {/* 6. Stock Units */}
                        <td className="py-3 px-4 font-mono font-bold text-center text-zinc-200">
                          {row.stock}
                        </td>

                        {/* 7. Status */}
                        <td className="py-3 px-4">
                          {!row.isPublished ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">
                              <Archive className="w-3 h-3 text-amber-400" />
                              Archived
                            </span>
                          ) : row.isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              Out of Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* 8. Actions: Edit Button + Delete Variant Button + View storefront */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditVariant(row)}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-[#fef08a] hover:text-black border border-zinc-800 text-zinc-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer group/btn shadow-sm"
                              title={`Edit ${row.name} variant`}
                            >
                              <Pencil className="w-3.5 h-3.5 text-zinc-400 group-hover/btn:text-black transition-colors" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRequestDeleteVariant(row)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-500/20 hover:text-red-400 border border-zinc-800 text-zinc-400 transition-colors cursor-pointer"
                              title={`Delete variant (${row.sizeCode || 'Free Size'}${row.colorName ? ` • ${row.colorName}` : ''})`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/product/${row.product.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                              title="Preview on Storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Management Modals */}
      {activeModal !== 'NONE' && activeModal !== 'INVOICE' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`bg-zinc-950 border border-zinc-800 rounded-2xl w-full ${activeModal === 'ADD_PRODUCT' ? 'max-w-2xl' : activeModal === 'EDIT_VARIANT' ? 'max-w-xl' : activeModal === 'CAROUSEL' ? 'max-w-3xl' : 'max-w-lg'} p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150 text-white max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                {activeModal === 'ADD_PRODUCT' && (
                  <div className="w-8 h-8 rounded-lg bg-[#fef08a]/10 border border-[#fef08a]/30 flex items-center justify-center text-[#fef08a]">
                    {productForm.isEditing ? (
                      <Pencil className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                )}
                {activeModal === 'EDIT_VARIANT' && (
                  <div className="w-8 h-8 rounded-lg bg-[#fef08a]/10 border border-[#fef08a]/30 flex items-center justify-center text-[#fef08a]">
                    <Boxes className="w-4 h-4" />
                  </div>
                )}
                {activeModal === 'CATEGORY' && (
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Layers className="w-4 h-4" />
                  </div>
                )}
                {activeModal === 'COLORS' && (
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Palette className="w-4 h-4" />
                  </div>
                )}
                {activeModal === 'SIZE' && (
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Ruler className="w-4 h-4" />
                  </div>
                )}
                {activeModal === 'CAROUSEL' && (
                  <div className="w-8 h-8 rounded-lg bg-[#fef08a]/10 border border-[#fef08a]/30 flex items-center justify-center text-[#fef08a]">
                    <Sliders className="w-4 h-4" />
                  </div>
                )}
                {activeModal === 'SETTINGS' && (
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#fef08a]">
                    <Settings className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {activeModal === 'ADD_PRODUCT' && (productForm.isEditing ? 'Edit Product & Variant' : 'Add New Product')}
                    {activeModal === 'EDIT_VARIANT' && `Edit Variant — ${variantForm.productName || 'Product'}`}
                    {activeModal === 'CATEGORY' && 'Category Management'}
                    {activeModal === 'COLORS' && 'Color Palette Management'}
                    {activeModal === 'SIZE' && 'Size Scale Management'}
                    {activeModal === 'CAROUSEL' && 'Store Banner Carousel Management'}
                    {activeModal === 'SETTINGS' && 'Store Settings & Operations'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {activeModal === 'ADD_PRODUCT' &&
                      (productForm.isEditing
                        ? `Update specifications and variant details for ${productForm.name || 'product'}`
                        : 'Create a new product item in the StyleFox catalog')}
                    {activeModal === 'EDIT_VARIANT' && 'Update stock, prices, publish status, and specs for this variant only'}
                    {activeModal === 'CATEGORY' && 'View and register product categories'}
                    {activeModal === 'COLORS' && 'Manage streetwear color codes & variants'}
                    {activeModal === 'SIZE' && 'Manage apparel size codes and order'}
                    {activeModal === 'CAROUSEL' && 'Manage storefront homepage banner sliders and R2 imagery'}
                    {activeModal === 'SETTINGS' && 'Configuration'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveModal('NONE');
                  resetFormState();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Notice */}
            {modalFeedback && (
              <div
                className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${modalFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
              >
                {modalFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{modalFeedback.text}</span>
              </div>
            )}

            {/* 1. ADD PRODUCT MODAL */}
            {activeModal === 'ADD_PRODUCT' && (
              <form onSubmit={handleAddProduct} className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto pr-1">
                {/* ======================================================== */}
                {/* PART 1: MAIN CONTENT */}
                {/* ======================================================== */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#fef08a] text-black text-[10px] font-black uppercase tracking-wider">
                        Part 1
                      </span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Main Content & Specifications
                      </h4>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Product Base</span>
                  </div>

                  {/* Product Name (Multifunctional: Dropdown Selector + Entering Field with Auto-fill) */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                        Product Name (Multifunctional: Dropdown &amp; Input) *
                      </label>
                    </div>

                    <div className="relative w-full">
                      <input
                        type="text"
                        required
                        list="existing-products-datalist"
                        placeholder="Enter product name or select from suggestions..."
                        value={productForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = products.find(
                            (p) => p.name.trim().toLowerCase() === val.trim().toLowerCase()
                          );
                          if (matched) {
                            handleSelectExistingProduct(String(matched.id));
                          } else {
                            setProductForm((prev) => ({
                              ...prev,
                              name: val,
                              selectedProductId: prev.isEditing ? prev.selectedProductId : '',
                            }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a] ${productForm.name || productForm.selectedProductId ? 'pr-9' : ''
                          }`}
                      />
                      {(productForm.name || productForm.selectedProductId) && (
                        <button
                          type="button"
                          onClick={() => resetFormState()}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Clear all data and start new product"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <datalist id="existing-products-datalist">
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.categoryName || 'StyleFox Catalog'}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    {/* Auto-filled / Editing Existing Product Information & Action */}
                    {productForm.selectedProductId && (
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px]">
                            {productForm.isEditing
                              ? <>Editing product <strong className="text-white underline">{productForm.name}</strong> and its variant specifications.</>
                              : <>Part 1 auto-filled for <strong className="text-white underline">{productForm.name}</strong>. Add new variants in Part 2 below.</>
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => {
                              resetFormState();
                            }}
                            className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 border border-zinc-700/60 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            {productForm.isEditing ? 'Cancel Edit' : 'Clear & New'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* <p className="text-[10px] text-zinc-500">
                      Selecting an existing product automatically populates all Part 1 specifications (Tagline, Category, Description, Features).
                    </p> */}
                  </div>

                  {/* Tagline & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Tagline <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pure Combed Heavyweight Cotton Regular Fit"
                        value={productForm.tagline}
                        onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Category Selection <span className="text-red-400">*</span>
                      </label>
                      <SearchableSelect
                        options={[
                          { value: '', label: 'Select a category (Required)' },
                          ...rawCategories.map((cat) => ({
                            value: cat.id,
                            label: cat.name,
                            sublabel: cat.slug,
                          })),
                        ]}
                        value={productForm.categoryId}
                        onChange={(val) => setProductForm({ ...productForm, categoryId: val })}
                        placeholder="Select a category (Required) *"
                        searchPlaceholder="Search categories..."
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter detailed garment composition, weave, fit, and craftsmanship..."
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a] resize-none"
                    />
                  </div>

                  {/* Features (Array) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                        Features (Array) <span className="text-red-400">*</span>
                      </label>
                      <span className="text-[10px] text-zinc-500">
                        {productForm.features.length} feature{productForm.features.length === 1 ? '' : 's'} added
                      </span>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="e.g. 100% Ultra-combed compact cotton (Press Enter to add)"
                        value={productForm.featureInput}
                        onChange={(e) => setProductForm({ ...productForm, featureInput: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                        className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 transition-colors cursor-pointer shrink-0"
                      >
                        + Add
                      </button>
                    </div>

                    {/* Features list tags */}
                    {productForm.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950/70 border border-zinc-800 rounded-xl max-h-32 overflow-y-auto">
                        {productForm.features.map((feat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/60 text-xs text-zinc-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fef08a]" />
                            <span className="line-clamp-1">{feat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(idx)}
                              className="text-zinc-400 hover:text-red-400 p-0.5 cursor-pointer ml-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ======================================================== */}
                {/* PART 2: VARIANT DETAILS */}
                {/* ======================================================== */}
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[#fef08a] text-[10px] font-black uppercase tracking-wider">
                        Part 2
                      </span>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Variant Details & Inventory
                      </h4>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {stagedVariants.length} variant{stagedVariants.length === 1 ? '' : 's'} configured
                    </span>
                  </div>

                  {/* Color & Size dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Color Variant Dropdown <span className="text-red-400">*</span>
                      </label>
                      <SearchableSelect
                        options={[
                          { value: '', label: 'Select Color (Required)' },
                          ...rawColors.map((col) => ({
                            value: col.id,
                            label: col.name,
                            sublabel: col.hexCode,
                            hexCode: col.hexCode,
                          })),
                        ]}
                        value={productForm.colorId}
                        onChange={(val) => setProductForm({ ...productForm, colorId: val })}
                        placeholder="Select Color (Required) *"
                        searchPlaceholder="Search colors..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Size Variant Dropdown
                      </label>
                      <SearchableSelect
                        options={[
                          { value: '', label: 'Select Size (Optional)' },
                          ...rawSizes.map((sz) => ({
                            value: sz.id,
                            label: sz.name,
                            code: sz.code,
                          })),
                        ]}
                        value={productForm.sizeId}
                        onChange={(val) => setProductForm({ ...productForm, sizeId: val })}
                        placeholder="Select Size (Optional)"
                        searchPlaceholder="Search sizes..."
                      />
                    </div>
                  </div>

                  {/* Regular Price, Selling Price, Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Price (₹) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="1899"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        <span>Selling Price (₹) <span className="text-red-400">*</span></span>
                        {productForm.price &&
                          productForm.sellingPrice &&
                          parseFloat(productForm.price) > parseFloat(productForm.sellingPrice) && (
                            <span className="text-[10px] font-black text-[#fef08a] bg-[#fef08a]/10 border border-[#fef08a]/30 px-1 py-0.2 rounded font-sans tracking-tight">
                              {Math.round(
                                ((parseFloat(productForm.price) - parseFloat(productForm.sellingPrice)) /
                                  parseFloat(productForm.price)) *
                                100
                              )}% OFF
                            </span>
                          )}
                      </label>
                      <input
                        type="number"
                        placeholder="1499"
                        value={productForm.sellingPrice}
                        onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Stock Units <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="50"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                      />
                    </div>
                  </div>

                  {/* Images (Array) */}
                  {/* Images (Direct Cloudflare R2 File Upload, Max 5MB) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                        <span>Variant Images <span className="text-red-400">*</span></span>
                        <span className="px-1.5 py-0.5 rounded bg-[#fef08a]/10 border border-[#fef08a]/30 text-[9px] font-mono text-[#fef08a]">
                          Cloudflare • Max 5 MB
                        </span>
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {productForm.images.length} image{productForm.images.length === 1 ? '' : 's'} added
                      </span>
                    </div>

                    {/* Direct File Selector & Dropzone */}
                    <div className="relative border-2 border-dashed border-zinc-800 hover:border-[#fef08a]/50 rounded-xl p-4 bg-zinc-950/60 transition-all text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleProductImageSelect}
                        className="hidden"
                        id="product-variant-file-input"
                      />

                      <label
                        htmlFor="product-variant-file-input"
                        className="flex flex-col items-center justify-center cursor-pointer group py-1"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-900 group-hover:bg-[#fef08a]/10 border border-zinc-800 group-hover:border-[#fef08a]/40 flex items-center justify-center mb-2 transition-colors shadow">
                          <UploadCloud className="w-5 h-5 text-zinc-400 group-hover:text-[#fef08a] transition-colors" />
                        </div>
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-[#fef08a] transition-colors">
                          Click to select image file from your device
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">
                          PNG, JPG, WEBP, or GIF • Strict 5 MB limit • Uploads to Cloudflare R2 when you click Save Product
                        </span>
                      </label>
                    </div>

                    {/* Image Previews Grid */}
                    {productForm.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2 bg-zinc-950/70 border border-zinc-800 rounded-xl max-h-48 overflow-y-auto mt-2.5">
                        {productForm.images.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="relative group rounded-lg overflow-hidden border border-zinc-800 aspect-square bg-zinc-900"
                          >
                            <img
                              src={imgUrl}
                              alt={`Variant Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (imgUrl.includes('.r2.cloudflarestorage.com/')) {
                                  const parts = imgUrl.split('.r2.cloudflarestorage.com/');
                                  if (parts[1]) {
                                    (e.currentTarget as HTMLImageElement).src = `${API_BASE_URL}/uploads/file/${parts[1]}`;
                                    return;
                                  }
                                }
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-500 cursor-pointer shadow"
                                title="Remove Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-[#fef08a] border border-[#fef08a]/20">
                              #{idx + 1} • {imgUrl.startsWith('blob:') ? 'Ready for R2' : 'R2'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Variant to Table Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-zinc-400">
                      Fill the variant specs above, then click to add it to the variants table.
                    </span>
                    <button
                      type="button"
                      onClick={handleAddVariantToStaging}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-[#fef08a] font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Variant to Table</span>
                    </button>
                  </div>

                  {/* Configured Variants Table at Bottom of Part 2 */}
                  <div className="mt-2 pt-3 border-t border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                          Configured Variants Table
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#fef08a]/10 border border-[#fef08a]/30 text-[10px] font-black text-[#fef08a]">
                          {stagedVariants.length} added
                        </span>
                      </div>
                      {stagedVariants.length > 0 && (
                        <span className="text-[10px] text-zinc-400">
                          Total Stock: {stagedVariants.reduce((sum, v) => sum + v.stock, 0)} units
                        </span>
                      )}
                    </div>

                    {stagedVariants.length === 0 ? (
                      <div className="text-center py-5 px-4 bg-zinc-950/60 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                        No variants added yet. Configure color, size, price, stock &amp; images above, then click <strong className="text-zinc-300">+ Add Variant to Table</strong>.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] uppercase font-bold text-zinc-400">
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Color</th>
                              <th className="py-2.5 px-3">Size</th>
                              <th className="py-2.5 px-3">Price</th>
                              <th className="py-2.5 px-3">Stock</th>
                              <th className="py-2.5 px-3">Images</th>
                              <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60 font-mono">
                            {stagedVariants.map((v, idx) => (
                              <tr key={v.id} className="hover:bg-zinc-900/40 transition-colors">
                                <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-3">
                                  {v.colorName ? (
                                    <div className="flex items-center gap-1.5 font-sans">
                                      <span
                                        className="w-3 h-3 rounded-full border border-zinc-700 shrink-0"
                                        style={{ backgroundColor: v.colorHex || '#0d0d0d' }}
                                      />
                                      <span className="text-white font-medium text-xs truncate max-w-[85px]">
                                        {v.colorName}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-500 font-sans text-xs">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {v.sizeCode ? (
                                    <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-bold text-white text-[11px]">
                                      {v.sizeCode}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 font-sans text-xs">Free Size</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {v.sellingPrice && v.sellingPrice < v.price ? (
                                    <div className="flex flex-col">
                                      <span className="font-bold text-[#fef08a] text-xs">
                                        ₹ {v.sellingPrice.toLocaleString()}
                                      </span>
                                      <span className="text-[10px] text-zinc-500 line-through">
                                        ₹ {v.price.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="font-bold text-white text-xs">
                                      ₹ {v.price.toLocaleString()}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-zinc-300">
                                  {v.stock} units
                                </td>
                                <td className="py-2.5 px-3">
                                  {v.images.length > 0 ? (
                                    <div className="flex items-center gap-1">
                                      <div className="w-6 h-6 rounded overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0">
                                        <img
                                          src={v.images[0]}
                                          alt="thumb"
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).src =
                                              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=100&q=80';
                                          }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-zinc-400 font-sans">
                                        {v.images.length} img
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-500 text-[10px] font-sans">0 images</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStagedVariant(v.id)}
                                    className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Delete Variant"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit button: Save or Update Product - enabled only when at least one variant is added */}
                {(() => {
                  const isSaveDisabled =
                    isSubmitting ||
                    (!productForm.isEditing && !productForm.editingVariantId && stagedVariants.length === 0);

                  return (
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="submit"
                        disabled={isSaveDisabled}
                        className="w-full py-3.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 text-black font-extrabold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/10"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{productForm.isEditing ? 'Updating Product & Variant...' : 'Saving Product & Variants...'}</span>
                          </>
                        ) : (
                          <span>
                            {productForm.isEditing
                              ? 'Update Product & Variant'
                              : stagedVariants.length === 0
                                ? 'Add Variant To Save'
                                : `Save Product (${stagedVariants.length} Variant${stagedVariants.length > 1 ? 's' : ''})`}
                          </span>
                        )}
                      </button>

                      {!productForm.isEditing && !productForm.editingVariantId && stagedVariants.length === 0 && (
                        <p className="text-[11px] text-zinc-500 text-center">
                          ⚠️ Fill Part 2 above and click <strong className="text-zinc-300">&quot;+ Add Variant to Table&quot;</strong> to enable Save Product.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </form>
            )}

            {/* 1.5. EDIT VARIANT MODAL (Variant-specific data & Stock only) */}
            {activeModal === 'EDIT_VARIANT' && (
              <form onSubmit={handleUpdateVariant} className="flex flex-col gap-5">
                {/* Parent Product Context Banner (Read-only reference) */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-14 rounded-lg bg-zinc-900 overflow-hidden shrink-0 border border-zinc-800">
                      {variantForm.productImage ? (
                        <img
                          src={formatProductImageUrl(variantForm.productImage)}
                          alt={variantForm.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
                          {variantForm.productName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] text-[#fef08a] font-medium shrink-0">
                          {variantForm.categoryName}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {variantForm.productTagline}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500 font-mono truncate">
                          ID: {variantForm.variantId || 'Unsaved'}
                        </span>
                        {variantForm.sku && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5 text-zinc-400" />
                            SKU: {variantForm.sku}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-[10px] font-semibold text-zinc-300 shrink-0">
                    Variant Level
                  </span>
                </div>

                {/* Visibility & Publication Status Selector (Publish / Archive Buttons) */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                    Visibility & Publication Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVariantForm((prev) => ({ ...prev, isPublished: true }))}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${variantForm.isPublished
                          ? 'bg-emerald-500/15 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${variantForm.isPublished ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                            }`}
                        >
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold ${variantForm.isPublished ? 'text-white' : 'text-zinc-300'
                              }`}
                          >
                            Published
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Active in storefront
                          </div>
                        </div>
                      </div>
                      {variantForm.isPublished && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setVariantForm((prev) => ({ ...prev, isPublished: false }))}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${!variantForm.isPublished
                          ? 'bg-amber-500/15 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${!variantForm.isPublished ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                            }`}
                        >
                          <Archive className="w-4 h-4" />
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold ${!variantForm.isPublished ? 'text-white' : 'text-zinc-300'
                              }`}
                          >
                            Archived
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Hidden from storefront
                          </div>
                        </div>
                      </div>
                      {!variantForm.isPublished && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Variant Display Classification (Normal 0 / New 1 / Cleared 2) */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <span>Variant Display Tag / Status</span>

                    </label>

                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVariantForm((prev) => ({ ...prev, displayType: 0 }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${(variantForm.displayType ?? 0) === 0
                          ? 'bg-zinc-800 border-zinc-500 text-white shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                    >
                      <span className="font-bold">Normal</span>

                    </button>

                    <button
                      type="button"
                      onClick={() => setVariantForm((prev) => ({ ...prev, displayType: 1 }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${(variantForm.displayType ?? 0) === 1
                          ? 'bg-amber-400/15 border-amber-400 text-amber-300 shadow-md shadow-amber-400/10'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-amber-400/40 hover:text-amber-200'
                        }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        New
                      </span>

                    </button>

                    <button
                      type="button"
                      onClick={() => setVariantForm((prev) => ({ ...prev, displayType: 2 }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${(variantForm.displayType ?? 0) === 2
                          ? 'bg-orange-500/15 border-orange-500 text-orange-300 shadow-md shadow-orange-500/10'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-orange-400/40 hover:text-orange-200'
                        }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                        Clearing Stock
                      </span>

                    </button>
                  </div>
                </div>

                {/* Instant Live Publish/Archive Toggle if variantId exists */}
                {variantForm.variantId && (
                  <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/40 border border-zinc-800/80 rounded-xl text-xs">
                    <span className="text-zinc-400 text-[11px]">
                      Live state in DB:{' '}
                      <span
                        className={
                          variantForm.isPublished ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                        }
                      >
                        {variantForm.isPublished ? 'Live on Store' : 'Archived / Hidden'}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleQuickTogglePublish}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${variantForm.isPublished
                          ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30'
                        }`}
                    >
                      {variantForm.isPublished ? (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archive Now</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Publish Now</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Color & Size Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Assigned Color <span className="text-red-400">*</span>
                    </label>
                    <SearchableSelect
                      options={[
                        { value: '', label: 'Select Color (Required)' },
                        ...rawColors.map((c) => ({
                          value: c.id,
                          label: c.name,
                          sublabel: c.hexCode,
                          hexCode: c.hexCode,
                        })),
                      ]}
                      value={variantForm.colorId}
                      onChange={(val) => setVariantForm((prev) => ({ ...prev, colorId: val }))}
                      placeholder="Select Color (Required) *"
                      searchPlaceholder="Search colors..."
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Variant Size Scale
                    </label>
                    <SearchableSelect
                      options={[
                        { value: '', label: 'Free Size / None' },
                        ...rawSizes.map((s) => ({
                          value: s.id,
                          label: s.name,
                          code: s.code,
                        })),
                      ]}
                      value={variantForm.sizeId}
                      onChange={(val) => setVariantForm((prev) => ({ ...prev, sizeId: val }))}
                      placeholder="Free Size / None"
                      searchPlaceholder="Search sizes..."
                    />
                  </div>
                </div>

                {/* Price & Selling Price with Live Percentage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Regular Price (₹) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={variantForm.price}
                        onChange={(e) =>
                          setVariantForm((prev) => ({ ...prev, price: e.target.value }))
                        }
                        placeholder="1999"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#fef08a]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Selling Price (₹) <span className="text-red-400">*</span>
                      </label>
                      {Boolean(
                        variantForm.sellingPrice &&
                        variantForm.price &&
                        parseFloat(variantForm.sellingPrice) < parseFloat(variantForm.price)
                      ) && (
                          <span className="text-[10px] font-black text-[#fef08a] bg-[#fef08a]/10 border border-[#fef08a]/30 px-1.5 py-0.2 rounded font-sans tracking-tight">
                            {Math.round(
                              ((parseFloat(variantForm.price) - parseFloat(variantForm.sellingPrice)) /
                                parseFloat(variantForm.price)) *
                              100
                            )}
                            % OFF
                          </span>
                        )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={variantForm.sellingPrice}
                        onChange={(e) =>
                          setVariantForm((prev) => ({ ...prev, sellingPrice: e.target.value }))
                        }
                        placeholder="e.g. 1499"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#fef08a]"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Quantity & SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Stock Quantity (Units) <span className="text-red-400">*</span>
                      </label>
                      {parseInt(variantForm.stock, 10) <= 0 ? (
                        <span className="text-[10px] font-bold text-red-400">Out of Stock</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400">In Stock</span>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={variantForm.stock}
                      onChange={(e) =>
                        setVariantForm((prev) => ({ ...prev, stock: e.target.value }))
                      }
                      placeholder="e.g. 50"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#fef08a]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        SKU Code
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-mono">
                        <Lock className="w-2.5 h-2.5 text-zinc-400" />
                        Not Editable
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={variantForm.sku || 'Auto-generated on creation'}
                        placeholder="Auto-generated on creation"
                        className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-lg pl-3 pr-8 py-2 text-xs text-zinc-400 font-mono cursor-not-allowed select-all focus:outline-none"
                      />
                      <div className="absolute right-3 top-2.5 text-zinc-500 pointer-events-none">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      SKU is a fixed inventory tracking code and is not editable.
                    </p>
                  </div>
                </div>

                {/* Variant Images (Direct File Upload to Cloudflare R2, max 5MB) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      <span>Variant Images <span className="text-red-400">*</span></span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 text-[9px] font-mono text-[#fef08a]">
                        Cloudflare  Max 5 MB
                      </span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {variantForm.images.length} image{variantForm.images.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* Direct File Selector Card */}
                  <div className="relative border-2 border-dashed border-zinc-800 hover:border-[#fef08a]/50 rounded-xl p-3 bg-zinc-950/60 transition-all text-center">
                    <input
                      ref={modalFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleModalVariantImageSelect}
                      className="hidden"
                      id="modal-variant-file-input"
                    />

                    <label
                      htmlFor="modal-variant-file-input"
                      className="flex flex-col items-center justify-center cursor-pointer group py-1"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-900 group-hover:bg-[#fef08a]/10 border border-zinc-800 group-hover:border-[#fef08a]/40 flex items-center justify-center mb-1.5 transition-colors shadow">
                        <UploadCloud className="w-4 h-4 text-zinc-400 group-hover:text-[#fef08a] transition-colors" />
                      </div>
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-[#fef08a] transition-colors">
                        Select Variant Image from device
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">
                        PNG, JPG, WEBP, or GIF (Max 5 MB) • Uploads to Cloudflare R2 when you click Save
                      </span>
                    </label>
                  </div>

                  {/* Previews */}
                  {variantForm.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-3 p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80 max-h-36 overflow-y-auto">
                      {variantForm.images.map((img, idx) => (
                        <div
                          key={`var-img-${idx}`}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 group bg-zinc-900 shrink-0"
                        >
                          <img
                            src={img}
                            alt={`Variant ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (img.includes('.r2.cloudflarestorage.com/')) {
                                const parts = img.split('.r2.cloudflarestorage.com/');
                                if (parts[1]) {
                                  (e.currentTarget as HTMLImageElement).src = `${API_BASE_URL}/uploads/file/${parts[1]}`;
                                  return;
                                }
                              }
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantFormImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded bg-black/80 text-white hover:bg-red-600 transition-colors opacity-90 group-hover:opacity-100 cursor-pointer"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-mono text-[#fef08a]">
                            #{idx + 1} {img.startsWith('blob:') ? '• Ready' : '• R2'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Action Footer */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-900 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal('NONE');
                      setModalFeedback(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-[#fef08a] text-black font-black text-xs uppercase tracking-wider hover:bg-yellow-300 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-lg shadow-[#fef08a]/10"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Variant & Stock...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Update Variant & Stock</span>
                        </>
                      )}
                    </button>
                  </div>
              </form>
            )}

            {/* 2. CATEGORY MODAL */}
            {activeModal === 'CATEGORY' && (
              <div className="flex flex-col gap-5">
                {/* Existing Categories List */}
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Active Categories ({rawCategories.length})
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                    {rawCategories.length === 0 ? (
                      <span className="text-xs text-zinc-500">No categories found</span>
                    ) : (
                      rawCategories.map((c) => (
                        <div
                          key={c.id}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-2 group hover:border-zinc-700 transition-colors"
                        >
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">/{c.slug}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            disabled={deletingCategoryId === c.id}
                            className="p-1 -mr-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ml-auto"
                            title={`Delete category ${c.name}`}
                          >
                            {deletingCategoryId === c.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Category Form */}
                <form onSubmit={handleAddCategory} className="border-t border-zinc-900 pt-4 flex flex-col gap-3.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Add New Category
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Winter Outerwear"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, name: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="Optional brief description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-1 w-full py-2.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 text-black font-extrabold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Adding Category...</span>
                      </>
                    ) : (
                      <span>Save Category</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 3. COLORS MODAL */}
            {activeModal === 'COLORS' && (
              <div className="flex flex-col gap-5">
                {/* Existing Colors Swatches */}
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Configured Colors ({rawColors.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                    {rawColors.length === 0 ? (
                      <span className="text-xs text-zinc-500 col-span-2">No colors loaded</span>
                    ) : (
                      rawColors.map((col) => (
                        <div
                          key={col.id}
                          className="px-2.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 group hover:border-zinc-700 transition-colors"
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-zinc-700 shrink-0"
                            style={{ backgroundColor: col.hexCode }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white truncate">{col.name}</span>
                            <span className="text-[10px] font-mono text-zinc-500">{col.hexCode}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteColor(col.id, col.name)}
                            disabled={deletingColorId === col.id}
                            className="p-1 -mr-0.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer ml-auto"
                            title={`Delete ${col.name}`}
                          >
                            {deletingColorId === col.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Color Form */}
                <form onSubmit={handleAddColor} className="border-t border-zinc-900 pt-4 flex flex-col gap-3.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Add New Color
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Color Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vintage Indigo"
                      value={colorForm.name}
                      onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Hex Code *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorForm.hexCode}
                        onChange={(e) => setColorForm({ ...colorForm, hexCode: e.target.value })}
                        className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        required
                        placeholder="#1a1a1a"
                        value={colorForm.hexCode}
                        onChange={(e) => setColorForm({ ...colorForm, hexCode: e.target.value })}
                        className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-1 w-full py-2.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 text-black font-extrabold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Color...</span>
                      </>
                    ) : (
                      <span>Save Color</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 4. SIZE MODAL */}
            {activeModal === 'SIZE' && (
              <div className="flex flex-col gap-5">
                {/* Existing Sizes Badges with Delete Option */}
                <div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Configured Sizes ({rawSizes.length})
                  </span>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                    {rawSizes.length === 0 ? (
                      <span className="text-xs text-zinc-500">No sizes configured</span>
                    ) : (
                      rawSizes.map((sz) => (
                        <div
                          key={sz.id}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2.5 text-xs group hover:border-zinc-700 transition-colors"
                        >
                          <span className="px-1.5 py-0.5 rounded bg-[#fef08a]/10 border border-[#fef08a]/30 text-[#fef08a] font-mono font-bold text-[10px]">
                            {sz.code}
                          </span>
                          <span className="text-zinc-200 font-medium">{sz.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSize(sz.id, `${sz.name} (${sz.code})`)}
                            disabled={deletingSizeId === sz.id}
                            className="p-1 -mr-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title={`Delete ${sz.name} (${sz.code})`}
                          >
                            {deletingSizeId === sz.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Size Form */}
                <form onSubmit={handleAddSize} className="border-t border-zinc-900 pt-4 flex flex-col gap-3.5">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Add New Size
                  </span>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Size Code * (Short)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 3XL"
                      value={sizeForm.code}
                      onChange={(e) => setSizeForm({ ...sizeForm, code: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white uppercase font-mono placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Triple Extra Large"
                      value={sizeForm.name}
                      onChange={(e) => setSizeForm({ ...sizeForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={sizeForm.sortOrder}
                      onChange={(e) => setSizeForm({ ...sizeForm, sortOrder: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-1 w-full py-2.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 text-black font-extrabold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Size...</span>
                      </>
                    ) : (
                      <span>Save Size</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 5. CAROUSEL MODAL (Store Banner Slider Management) */}
            {activeModal === 'CAROUSEL' && (
              <div className="flex flex-col gap-6">
                {/* Top Section: Header & "Add New Carousel" Button */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Existing Carousels ({rawCarousels.length})
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      The carousel highlighted in green is currently live on customer storefront.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewCarousel((prev) => !prev);
                      setModalFeedback(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isAddingNewCarousel ? (
                      <>
                        <X className="w-4 h-4" />
                        <span>Close Form</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add New Carousel</span>
                      </>
                    )}
                  </button>
                </div>

                {/* List of Existing Carousels */}
                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                  {rawCarousels.length === 0 ? (
                    <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800/80 rounded-2xl">
                      <Sliders className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400 font-medium">No custom carousels created yet.</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">Click &quot;Add New Carousel&quot; to upload high-resolution banner images to Cloudflare R2.</p>
                    </div>
                  ) : (
                    rawCarousels.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${c.isActive
                            ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                          }`}
                      >
                        {/* Left: Info & Thumbnails */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* First Image Thumbnail */}
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 relative shrink-0">
                            {c.images && c.images.length > 0 ? (
                              <img
                                src={formatProductImageUrl(c.images[0])}
                                alt={c.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono text-zinc-300">
                              {c.images?.length || 0}
                            </span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider truncate">
                                {c.title}
                              </h4>
                              {c.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Active Banner
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {c.description && (
                              <p className="text-[11px] text-zinc-400 truncate max-w-sm mt-0.5">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Actions (Activate, Delete) */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {!c.isActive && (
                            <button
                              type="button"
                              onClick={() => handleActivateCarousel(c.id, c.title)}
                              disabled={activatingCarouselId === c.id}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-emerald-500 hover:text-black border border-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Set as active store banner"
                            >
                              {activatingCarouselId === c.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Activate</span>
                            </button>
                          )}

                          {c.isActive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setModalFeedback(null);
                                setActiveCarouselWarning(c);
                              }}
                              className="p-2 rounded-xl bg-zinc-900 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/40 text-amber-400/80 hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1 group/lock"
                              title="Active carousel cannot be deleted. Click to view info."
                            >
                              <Lock className="w-3.5 h-3.5 group-hover/lock:scale-110 transition-transform" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRequestDeleteCarousel(c)}
                              disabled={deletingCarouselId === c.id}
                              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 hover:text-red-400 border border-zinc-700/80 text-zinc-400 transition-colors cursor-pointer"
                              title="Delete carousel"
                            >
                              {deletingCarouselId === c.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Create New Carousel Section */}
                {isAddingNewCarousel && (
                  <form
                    onSubmit={handleCreateCarousel}
                    className="border-t border-zinc-900 pt-5 flex flex-col gap-4 animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-[#fef08a]" />
                        <span>Add New Banner Carousel (Cloudflare R2)</span>
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={carouselForm.isActive}
                          onChange={(e) =>
                            setCarouselForm((prev) => ({ ...prev, isActive: e.target.checked }))
                          }
                          className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-[#fef08a] focus:ring-0 cursor-pointer accent-[#fef08a]"
                        />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                          Set as Active Banner
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                          Carousel Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Summer Streetwear 2026"
                          value={carouselForm.title}
                          onChange={(e) =>
                            setCarouselForm((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                          Subheading / Description (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Up to 40% off on all outerwear drop"
                          value={carouselForm.description}
                          onChange={(e) =>
                            setCarouselForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                        />
                      </div>
                    </div>

                    {/* LIVE INTERACTIVE CAROUSEL PREVIEW SESSION */}
                    {carouselForm.images.length > 0 && (
                      <div className="flex flex-col gap-2 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#fef08a] uppercase tracking-wider flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Live Carousel Preview ({previewSlideIndex + 1} / {carouselForm.images.length})</span>
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            Click thumbnails below or dots to switch slides
                          </span>
                        </div>

                        {/* Large Preview Container */}
                        <div className="relative w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                          <img
                            src={carouselForm.images[previewSlideIndex]}
                            alt="Carousel Preview"
                            className="w-full h-full object-cover transition-all duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
                            <span className="inline-block px-2 py-0.5 rounded bg-[#fef08a] text-black text-[9px] font-black uppercase tracking-wider w-fit mb-1">
                              Preview Banner
                            </span>
                            <h3 className="text-base font-black uppercase text-white drop-shadow">
                              {carouselForm.title || 'Your Carousel Title Here'}
                            </h3>
                            {carouselForm.description && (
                              <p className="text-[11px] text-zinc-300 drop-shadow line-clamp-1">
                                {carouselForm.description}
                              </p>
                            )}
                          </div>

                          {/* Dots */}
                          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                            {carouselForm.images.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={() => setPreviewSlideIndex(dotIdx)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${dotIdx === previewSlideIndex ? 'w-5 bg-[#fef08a]' : 'w-1.5 bg-white/40'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Thumbnail Strip with Delete Options */}
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {carouselForm.images.map((img, imgIdx) => (
                            <div
                              key={imgIdx}
                              onClick={() => setPreviewSlideIndex(imgIdx)}
                              className={`relative w-16 h-12 rounded-lg overflow-hidden border cursor-pointer shrink-0 transition-all ${imgIdx === previewSlideIndex
                                  ? 'border-[#fef08a] scale-105 shadow-md shadow-yellow-500/20'
                                  : 'border-zinc-700 opacity-70 hover:opacity-100'
                                }`}
                            >
                              <img
                                src={img}
                                alt={`Thumb ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCarouselImage(imgIdx);
                                }}
                                className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/80 text-white hover:bg-red-600 transition-colors"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Multiple Image Upload Box */}
                    <div>
                      <input
                        type="file"
                        ref={carouselFileInputRef}
                        onChange={handleCarouselFileChange}
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => carouselFileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-zinc-800 hover:border-[#fef08a] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-all bg-zinc-900/30 hover:bg-zinc-900/60 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#fef08a]">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Select Banner Images to Upload
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Multiple files supported • Max 5 MB each • Automatically saved to Cloudflare R2 (/carousels)
                        </span>
                      </button>
                    </div>

                    {/* Save Carousel Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || (carouselForm.images.length === 0 && carouselForm.imageFiles.length === 0)}
                      className="mt-2 w-full py-3 rounded-xl bg-[#fef08a] hover:bg-yellow-300 text-black font-extrabold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-yellow-500/10"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>Uploading &amp; Saving Carousel to R2...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-black" />
                          <span>Save Carousel &amp; Upload to R2</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* 6. SETTINGS MODAL (WhatsApp Enquiry & Shipping Threshold) */}
            {activeModal === 'SETTINGS' && (
              <div className="flex flex-col gap-6">
                {isLoadingSettings ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin text-[#fef08a]" />
                    <span className="text-xs">Loading store settings from database...</span>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSavingSettings(true);
                      setModalFeedback(null);
                      try {
                        const cleanWhatsapp = settingsForm.whatsappNumber.replace(/[^0-9]/g, '');
                        if (!cleanWhatsapp || cleanWhatsapp.length < 7) {
                          setModalFeedback({
                            type: 'error',
                            text: 'Please enter a valid WhatsApp phone number (with country code, e.g. 918086388058).',
                          });
                          setIsSavingSettings(false);
                          return;
                        }

                        const threshold = Number(settingsForm.freeShippingThreshold);
                        if (isNaN(threshold) || threshold < 0) {
                          setModalFeedback({
                            type: 'error',
                            text: 'Free shipping amount must be a non-negative number.',
                          });
                          setIsSavingSettings(false);
                          return;
                        }

                        if (!settingsForm.shippingFee && settingsForm.shippingFee !== 0) {
                          setModalFeedback({
                            type: 'error',
                            text: 'Standard shipping fee is required.',
                          });
                          setIsSavingSettings(false);
                          return;
                        }

                        const fee = Number(settingsForm.shippingFee);
                        if (isNaN(fee) || fee < 0) {
                          setModalFeedback({
                            type: 'error',
                            text: 'Standard shipping fee must be a valid non-negative number.',
                          });
                          setIsSavingSettings(false);
                          return;
                        }

                        const res = await updateAdminStoreSettings({
                          whatsappNumber: cleanWhatsapp,
                          freeShippingThreshold: threshold,
                          shippingFee: fee,
                          offerText: settingsForm.offerText?.trim(),
                        });

                        if (res.ok) {
                          setModalFeedback({
                            type: 'success',
                            text: 'Store settings successfully saved',
                          });
                          // Dispatch local storage / broadcast if any
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new Event('store_settings_updated'));
                          }
                          setTimeout(() => {
                            setActiveModal('NONE');
                            setModalFeedback(null);
                          }, 1200);
                        } else {
                          setModalFeedback({
                            type: 'error',
                            text: res.message || 'Failed to update store settings.',
                          });
                        }
                      } catch (err: any) {
                        setModalFeedback({
                          type: 'error',
                          text: err?.message || 'Unexpected error occurred while updating settings.',
                        });
                      } finally {
                        setIsSavingSettings(false);
                      }
                    }}
                    className="flex flex-col gap-5"
                  >
                    {/* Top Banner Offer Text Field (Optional - Hides banner when empty) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                          Top Banner Offer Text
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={settingsForm.offerText}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, offerText: e.target.value })
                          }
                          placeholder="e.g. offer banner"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-[#fef08a] focus:outline-none text-white text-xs font-medium transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5">
                        Optional announcement. If left blank or cleared, the top banner section will be completely hidden from the website UI.
                      </p>
                    </div>
                    {/* WhatsApp Enquiry Number Field */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                        WhatsApp Enquiry Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={settingsForm.whatsappNumber}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                          }
                          placeholder="e.g. 918086388058"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-[#fef08a] focus:outline-none text-white text-xs font-mono transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5">
                        Include country code without &quot;+&quot; or spaces (e.g., <strong>918086388058</strong>). Used for all customer WhatsApp queries &amp; rebook requests.
                      </p>
                    </div>

                    {/* Free Shipping Amount Threshold Field */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                        Free Shipping Amount (₹) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={settingsForm.freeShippingThreshold}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, freeShippingThreshold: e.target.value })
                          }
                          placeholder="2000"
                          className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-[#fef08a] focus:outline-none text-white text-xs font-mono transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5">
                        Orders equal to or exceeding this subtotal qualify for <strong>FREE express delivery</strong>. Subtotals below will incur shipping fee.
                      </p>
                    </div>

                    {/* Standard Shipping Fee Field */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                        Standard Shipping Fee (₹) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={settingsForm.shippingFee}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, shippingFee: e.target.value })
                          }
                          placeholder="149"
                          className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-[#fef08a] focus:outline-none text-white text-xs font-mono transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5">
                        Charged when cart subtotal is less than the free shipping threshold. Default is ₹149.
                      </p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900">
                      <button
                        type="button"
                        onClick={() => setActiveModal('NONE')}
                        disabled={isSavingSettings}
                        className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-6 py-2.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 text-black font-extrabold uppercase tracking-wider text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-yellow-500/10"
                      >
                        {isSavingSettings ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                            <span>Saving Settings...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-black" />
                            <span>Save Settings</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cloudflare R2 Image Deletion Confirmation Modal */}
      {imageToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-150">
            {/* Header with Alert Icon */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Delete Image from Cloudflare R2?
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  This image will be permanently deleted from Cloudflare R2 bucket storage and removed from this product variant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setImageToDelete(null)}
                disabled={isDeletingImage}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="my-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0 relative">
                <img
                  src={imageToDelete.url}
                  alt="Delete preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (imageToDelete.url.includes('.r2.cloudflarestorage.com/')) {
                      const parts = imageToDelete.url.split('.r2.cloudflarestorage.com/');
                      if (parts[1]) {
                        (e.currentTarget as HTMLImageElement).src = `${API_BASE_URL}/uploads/file/${parts[1]}`;
                        return;
                      }
                    }
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=400&q=80';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="inline-block px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase mb-1">
                  R2 Asset
                </span>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  {imageToDelete.url.startsWith('blob:')
                    ? 'Local Preview'
                    : imageToDelete.url.split('/').pop() || imageToDelete.url}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Action cannot be undone.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setImageToDelete(null)}
                disabled={isDeletingImage}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteImage}
                disabled={isDeletingImage}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/40 disabled:opacity-50"
              >
                {isDeletingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting from R2...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete from R2</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel Delete Warning & Confirmation Modal */}
      {carouselToDelete && (
        <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-150">
            {/* Header with Alert Warning Icon */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Delete Carousel from Cloudflare R2?
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  This carousel and all its images will be permanently deleted from Cloudflare R2 bucket storage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCarouselToDelete(null)}
                disabled={deletingCarouselId === carouselToDelete.id}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail and Details Preview */}
            <div className="my-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0 relative">
                {carouselToDelete.images && carouselToDelete.images.length > 0 ? (
                  <img
                    src={formatProductImageUrl(carouselToDelete.images[0])}
                    alt={carouselToDelete.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="inline-block px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase mb-1">
                  R2 ASSET
                </span>
                <p className="text-[11px] text-zinc-400 font-mono truncate">
                  {carouselToDelete.title} ({carouselToDelete.images?.length || 0} images)
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Action cannot be undone.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setCarouselToDelete(null)}
                disabled={deletingCarouselId === carouselToDelete.id}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCarousel}
                disabled={deletingCarouselId === carouselToDelete.id}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/40 disabled:opacity-50"
              >
                {deletingCarouselId === carouselToDelete.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>DELETING</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>YES, DELETE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variant Delete Warning & Confirmation Modal */}
      {variantToDelete && (
        <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-150">
            {/* Header with Alert Warning Icon */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Delete Variant from Inventory?
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  This variant and its associated image files will be permanently deleted from database and Cloudflare R2 bucket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVariantToDelete(null)}
                disabled={isDeletingVariant}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail and Details Preview */}
            <div className="my-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0 relative">
                {variantToDelete.image ? (
                  <img
                    src={formatProductImageUrl(variantToDelete.image)}
                    alt={variantToDelete.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Package className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-bold text-white truncate">
                  {variantToDelete.productName}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {variantToDelete.sizeCode && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] font-bold text-white">
                      Size: {variantToDelete.sizeCode}
                    </span>
                  )}
                  {variantToDelete.colorName ? (
                    <span className="flex items-center gap-1 text-[11px] text-zinc-300">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-zinc-600 shrink-0"
                        style={{ backgroundColor: variantToDelete.colorHex || '#0d0d0d' }}
                      />
                      {variantToDelete.colorName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500">No color</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="font-bold text-white">
                    ₹ {variantToDelete.sellingPrice ? variantToDelete.sellingPrice.toLocaleString() : variantToDelete.price?.toLocaleString()}
                  </span>
                  {variantToDelete.isOnlyVariant && (
                    <span className="text-[10px] text-amber-400 font-medium">
                      (Only variant - will remove product)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setVariantToDelete(null)}
                disabled={isDeletingVariant}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVariant}
                disabled={isDeletingVariant}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/40 disabled:opacity-50"
              >
                {isDeletingVariant ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>DELETING...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>YES, DELETE VARIANT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Delete Warning & Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white animate-in zoom-in-95 duration-150">
            {/* Header with Alert Warning Icon */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Delete Entire Product &amp; Variants?
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  This will permanently delete this product, all {productToDelete.variantCount || 0} variant(s), and purge all imagery from Cloudflare R2 bucket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail and Details Preview */}
            <div className="my-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 shrink-0 relative">
                {productToDelete.image ? (
                  <img
                    src={formatProductImageUrl(productToDelete.image)}
                    alt={productToDelete.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Package className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="inline-block px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[10px] font-bold uppercase mb-1">
                  ENTIRE PRODUCT
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {productToDelete.productName}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Category: {productToDelete.categoryName} • {productToDelete.variantCount} variant(s)
                </p>
                <p className="text-[10px] text-red-400/90 mt-1">
                  This action is irreversible.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-red-950/40 disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>DELETING...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>YES, DELETE PRODUCT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      <InvoiceModal
        isOpen={activeModal === 'INVOICE'}
        onClose={() => setActiveModal('NONE')}
        products={products}
        token={getAuthToken()}
        onSaleSaved={loadAdminProducts}
      />
    </div>
  );
}
