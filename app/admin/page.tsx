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
  setAdminVariantPublish,
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
  images: string[];
}

const emptySubscribe = () => () => {};

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
  const [activeModal, setActiveModal] = useState<'NONE' | 'ADD_PRODUCT' | 'EDIT_VARIANT' | 'CATEGORY' | 'COLORS' | 'SIZE' | 'INVOICE'>('NONE');

  // Backend metadata lists
  const [rawCategories, setRawCategories] = useState<{ id: string; name: string; slug: string; description?: string }[]>([]);
  const [rawColors, setRawColors] = useState<{ id: string; name: string; hexCode: string }[]>([]);
  const [rawSizes, setRawSizes] = useState<{ id: string; name: string; code: string; sortOrder?: number }[]>([]);

  // Submitting state & feedback message
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSizeId, setDeletingSizeId] = useState<string | null>(null);
  const [deletingColorId, setDeletingColorId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stagedVariants, setStagedVariants] = useState<StagedVariant[]>([]);

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
    // Part 2: Variant Details
    editingVariantId: string;
    colorId: string;
    sizeId: string;
    price: string;
    sellingPrice: string;
    stock: string;
    images: string[];
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
    editingVariantId: '',
    colorId: '',
    sizeId: '',
    price: '',
    sellingPrice: '',
    stock: '',
    images: [],
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
    images: string[];
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
    images: [],
    imageInput: '',
    isPublished: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
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

  // Load categories, colors, sizes metadata
  const loadMetadata = async () => {
    try {
      const [cats, cols, szs] = await Promise.all([
        fetchAdminCategories(),
        fetchAdminColors(),
        fetchAdminSizes(),
      ]);
      if (Array.isArray(cats)) setRawCategories(cats);
      if (Array.isArray(cols)) setRawColors(cols);
      if (Array.isArray(szs)) setRawSizes(szs);
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
    setProductForm({
      selectedProductId: '',
      name: '',
      tagline: '',
      description: '',
      categoryId: '',
      features: [],
      featureInput: '',
      editingVariantId: '',
      colorId: '',
      sizeId: '',
      price: '',
      sellingPrice: '',
      stock: '',
      images: [],
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
      images: variantImages,
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
    setVariantForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Dedicated Variant Update: Updates ONLY this variant and stock
  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    if (!variantForm.price || isNaN(parseFloat(variantForm.price))) {
      setModalFeedback({ type: 'error', text: 'Please enter a valid regular price.' });
      return;
    }

    setIsSubmitting(true);
    setModalFeedback(null);

    try {
      const finalImages = [...variantForm.images];
      if (variantForm.imageInput.trim() && !finalImages.includes(variantForm.imageInput.trim())) {
        finalImages.push(variantForm.imageInput.trim());
      }

      const payload: any = {
        price: parseFloat(variantForm.price) || 0,
        sellingPrice: variantForm.sellingPrice ? parseFloat(variantForm.sellingPrice) : undefined,
        stock: parseInt(variantForm.stock, 10) || 0,
        colorId: variantForm.colorId || undefined,
        sizeId: variantForm.sizeId || undefined,
        images: finalImages,
        isPublished: variantForm.isPublished,
      };

      if (variantForm.variantId) {
        const res = await updateAdminVariant(authToken, variantForm.variantId, payload);
        if (!res.ok) {
          throw new Error(res.data?.message || 'Failed to update variant');
        }
      } else {
        const res = await addAdminVariant(authToken, variantForm.productId, payload);
        if (!res.ok) {
          throw new Error(res.data?.message || 'Failed to create variant');
        }
      }

      setModalFeedback({
        type: 'success',
        text: `Variant for "${variantForm.productName}" updated successfully!`,
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
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Stage a variant into the bottom table & clear Part 2 inputs
  const handleAddVariantToStaging = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!productForm.price || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
      setModalFeedback({ type: 'error', text: 'Please enter a valid Price (₹) for this variant.' });
      return;
    }

    const col = rawColors.find((c) => c.id === productForm.colorId);
    const sz = rawSizes.find((s) => s.id === productForm.sizeId);

    const finalImages = [...productForm.images];
    if (productForm.imageInput.trim() && !finalImages.includes(productForm.imageInput.trim())) {
      finalImages.push(productForm.imageInput.trim());
    }

    const newVariant: StagedVariant = {
      id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      colorId: productForm.colorId || undefined,
      colorName: col?.name,
      colorHex: col?.hexCode,
      sizeId: productForm.sizeId || undefined,
      sizeCode: sz?.code,
      sizeName: sz?.name,
      price: parseFloat(productForm.price) || 0,
      sellingPrice: productForm.sellingPrice ? parseFloat(productForm.sellingPrice) : undefined,
      stock: parseInt(productForm.stock, 10) || 0,
      images: finalImages,
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
      imageInput: '',
    }));

    setModalFeedback({
      type: 'success',
      text: `Variant added to table (${sz?.code || 'Free Size'}${col?.name ? ` • ${col.name}` : ''}). Add another or save product below.`,
    });
    setTimeout(() => {
      setModalFeedback(null);
    }, 2500);
  };

  const handleRemoveStagedVariant = (id: string) => {
    setStagedVariants((prev) => prev.filter((v) => v.id !== id));
  };

  // Action handlers: Save Product and all variants
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      setModalFeedback({ type: 'error', text: 'Product name is required' });
      return;
    }
    const authToken = getAuthToken();
    if (!authToken) {
      setModalFeedback({ type: 'error', text: 'Admin token missing. Please sign in again.' });
      return;
    }

    // Auto-include any entered feature that wasn't explicitly added via button
    const finalFeatures = [...productForm.features];
    if (productForm.featureInput.trim() && !finalFeatures.includes(productForm.featureInput.trim())) {
      finalFeatures.push(productForm.featureInput.trim());
    }

    // Check variants: if user has pending variant inputs in Part 2 and no variants staged yet, auto-stage it
    let variantsToSubmit = [...stagedVariants];
    if (variantsToSubmit.length === 0 && productForm.price) {
      const col = rawColors.find((c) => c.id === productForm.colorId);
      const sz = rawSizes.find((s) => s.id === productForm.sizeId);
      const finalImages = [...productForm.images];
      if (productForm.imageInput.trim() && !finalImages.includes(productForm.imageInput.trim())) {
        finalImages.push(productForm.imageInput.trim());
      }
      variantsToSubmit.push({
        id: 'auto-1',
        colorId: productForm.colorId || undefined,
        colorName: col?.name,
        colorHex: col?.hexCode,
        sizeId: productForm.sizeId || undefined,
        sizeCode: sz?.code,
        sizeName: sz?.name,
        price: parseFloat(productForm.price) || 0,
        sellingPrice: productForm.sellingPrice ? parseFloat(productForm.sellingPrice) : undefined,
        stock: parseInt(productForm.stock, 10) || 0,
        images: finalImages,
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
        });

        // 2. If editing a specific variant, update its details
        if (productForm.editingVariantId) {
          const finalImages = [...productForm.images];
          if (productForm.imageInput.trim() && !finalImages.includes(productForm.imageInput.trim())) {
            finalImages.push(productForm.imageInput.trim());
          }

          await updateAdminVariant(authToken, productForm.editingVariantId, {
            colorId: productForm.colorId || null,
            sizeId: productForm.sizeId || null,
            price: parseFloat(productForm.price) || 0,
            sellingPrice: productForm.sellingPrice ? parseFloat(productForm.sellingPrice) : undefined,
            stock: parseInt(productForm.stock, 10) || 0,
            images: finalImages,
          });
        }

        // 3. Add any newly staged variants to this product
        let addedCount = 0;
        for (const v of variantsToSubmit) {
          if (v.id.startsWith('new-') || (!productForm.editingVariantId && !productForm.isEditing)) {
            const vRes = await addAdminVariant(authToken, prodId, {
              colorId: v.colorId,
              sizeId: v.sizeId,
              price: v.price,
              sellingPrice: v.sellingPrice,
              stock: v.stock,
              images: v.images,
            });
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

      // Creating a new product with all its variants
      const res = await createAdminProduct(authToken, {
        name: productForm.name.trim(),
        tagline: productForm.tagline.trim() || undefined,
        description: productForm.description.trim() || undefined,
        features: finalFeatures.length > 0 ? finalFeatures : undefined,
        categoryId: productForm.categoryId || undefined,
        variants: variantsToSubmit.map((v) => ({
          colorId: v.colorId,
          sizeId: v.sizeId,
          price: v.price,
          sellingPrice: v.sellingPrice,
          stock: v.stock,
          images: v.images,
        })),
      });

      if (res.ok) {
        setModalFeedback({ type: 'success', text: `Product saved successfully with ${variantsToSubmit.length} variant(s)!` });
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
      const slug =
        categoryForm.slug.trim() ||
        categoryForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const res = await createAdminCategory(authToken, {
        name: categoryForm.name.trim(),
        slug,
        description: categoryForm.description.trim() || undefined,
      });

      if (res.ok) {
        setModalFeedback({ type: 'success', text: 'Category created successfully!' });
        await loadMetadata();
        await loadAdminProducts();
        setCategoryForm({ name: '', slug: '', description: '' });
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
        p.colors?.[0]?.images?.[0] ||
        p.images?.[0] ||
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

          const vImg =
            v.images && v.images.length > 0
              ? v.images[0]
              : col?.images && col.images.length > 0
              ? col.images[0]
              : fallbackImg;

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
          isOutOfStock: pStock <= 0,
          isPublished: true,
          sku: '',
          image: fallbackImg,
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#fef08a] cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="IN_STOCK">In Stock Only</option>
                <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                <option value="ARCHIVED">Archived Only</option>
              </select>

              {/* Category Filter */}
              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#fef08a] cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                  className={`p-2 rounded-lg border text-zinc-400 hover:text-white transition-all cursor-pointer ${
                    isMenuOpen
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
                        setActiveModal('INVOICE');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-200 hover:text-black hover:bg-[#fef08a] transition-colors text-left cursor-pointer group border-t border-zinc-800/80 pt-2"
                    >
                      <FileText className="w-4 h-4 text-[#fef08a] group-hover:text-black" />
                      <span>Invoice</span>
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
                              <Image
                                src={row.image}
                                alt={row.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-white uppercase truncate max-w-xs md:max-w-sm group-hover:text-[#fef08a] transition-colors">
                                {row.name}
                              </span>
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
                            <span className="text-zinc-500 text-xs">Standard</span>
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

                        {/* 8. Actions: Edit Button + View storefront */}
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
          <div className={`bg-zinc-950 border border-zinc-800 rounded-2xl w-full ${activeModal === 'ADD_PRODUCT' ? 'max-w-2xl' : activeModal === 'EDIT_VARIANT' ? 'max-w-xl' : 'max-w-lg'} p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150 text-white max-h-[90vh] overflow-y-auto`}>
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
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    {activeModal === 'ADD_PRODUCT' && (productForm.isEditing ? 'Edit Product & Variant' : 'Add New Product')}
                    {activeModal === 'EDIT_VARIANT' && `Edit Variant — ${variantForm.productName || 'Product'}`}
                    {activeModal === 'CATEGORY' && 'Category Management'}
                    {activeModal === 'COLORS' && 'Color Palette Management'}
                    {activeModal === 'SIZE' && 'Size Scale Management'}
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
                className={`mb-4 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  modalFeedback.type === 'success'
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
                      {productForm.selectedProductId ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold">
                          <Check className="w-3 h-3" /> Auto-filled from Existing Product
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500">
                          Select dropdown to auto-fill or enter custom name
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      {/* Multifunctional Dropdown Selector */}
                      <div className="sm:col-span-5">
                        <select
                          value={productForm.selectedProductId}
                          onChange={(e) => handleSelectExistingProduct(e.target.value)}
                          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#fef08a] cursor-pointer"
                        >
                          <option value="">⚡ Select Existing Product to Auto-fill...</option>
                          {products.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name} {p.categoryName ? `(${p.categoryName})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Multifunctional Entering Field */}
                      <div className="sm:col-span-7">
                        <input
                          type="text"
                          required
                          list="existing-products-datalist"
                          placeholder="Or enter / edit product name..."
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
                          className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                        />
                        <datalist id="existing-products-datalist">
                          {products.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.categoryName || 'StyleFox Catalog'}
                            </option>
                          ))}
                        </datalist>
                      </div>
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
                        <button
                          type="button"
                          onClick={() => {
                            resetFormState();
                          }}
                          className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 border border-zinc-700/60 text-[10px] font-bold transition-colors cursor-pointer shrink-0 ml-2"
                        >
                          {productForm.isEditing ? 'Cancel Edit' : 'Clear & New Product'}
                        </button>
                      </div>
                    )}

                    <p className="text-[10px] text-zinc-500">
                      Selecting an existing product automatically populates all Part 1 specifications (Tagline, Category, Description, Features).
                    </p>
                  </div>

                  {/* Tagline & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Tagline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pure Combed Heavyweight Cotton Regular Fit"
                        value={productForm.tagline}
                        onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Category Selection
                      </label>
                      <select
                        value={productForm.categoryId}
                        onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#fef08a] cursor-pointer"
                      >
                        <option value="">Select a category (Optional)</option>
                        {rawCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
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
                        Features (Array)
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
                        Color Variant Dropdown
                      </label>
                      <select
                        value={productForm.colorId}
                        onChange={(e) => setProductForm({ ...productForm, colorId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#fef08a] cursor-pointer"
                      >
                        <option value="">Select Color (Optional)</option>
                        {rawColors.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.name} ({col.hexCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Size Variant Dropdown
                      </label>
                      <select
                        value={productForm.sizeId}
                        onChange={(e) => setProductForm({ ...productForm, sizeId: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#fef08a] cursor-pointer"
                      >
                        <option value="">Select Size (Optional)</option>
                        {rawSizes.map((sz) => (
                          <option key={sz.id} value={sz.id}>
                            {sz.code} - {sz.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Regular Price, Selling Price, Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                        Price (₹)
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
                        <span>Selling Price (₹)</span>
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
                        Stock Units
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
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                        Images (Array)
                      </label>
                      <span className="text-[10px] text-zinc-500">
                        {productForm.images.length} image{productForm.images.length === 1 ? '' : 's'} added
                      </span>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-... (Press Enter to add)"
                        value={productForm.imageInput}
                        onChange={(e) => setProductForm({ ...productForm, imageInput: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImage();
                          }
                        }}
                        className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 transition-colors cursor-pointer shrink-0"
                      >
                        + Add Image
                      </button>
                    </div>

                    {/* Image Previews Grid */}
                    {productForm.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2 bg-zinc-950/70 border border-zinc-800 rounded-xl max-h-48 overflow-y-auto mb-2">
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
                            <span className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300">
                              #{idx + 1}
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
                                    <span className="text-zinc-500 font-sans text-xs">Standard</span>
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

                {/* Submit button: Save or Update Product */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 text-black font-extrabold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-yellow-500/10"
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
                        : `Save Product ${stagedVariants.length > 0 ? `(${stagedVariants.length} Variant${stagedVariants.length > 1 ? 's' : ''})` : ''}`}
                    </span>
                  )}
                </button>
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
                        <Image
                          src={variantForm.productImage}
                          alt={variantForm.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
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
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        variantForm.isPublished
                          ? 'bg-emerald-500/15 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            variantForm.isPublished ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              variantForm.isPublished ? 'text-white' : 'text-zinc-300'
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
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        !variantForm.isPublished
                          ? 'bg-amber-500/15 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            !variantForm.isPublished ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          <Archive className="w-4 h-4" />
                        </div>
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              !variantForm.isPublished ? 'text-white' : 'text-zinc-300'
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        variantForm.isPublished
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
                      Variant Color
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg border border-zinc-700 shrink-0 shadow-inner"
                        style={{
                          backgroundColor:
                            rawColors.find((c) => c.id === variantForm.colorId)?.hexCode || '#18181b',
                        }}
                      />
                      <select
                        value={variantForm.colorId}
                        onChange={(e) =>
                          setVariantForm((prev) => ({ ...prev, colorId: e.target.value }))
                        }
                        className="flex-1 bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#fef08a] cursor-pointer"
                      >
                        <option value="">No Color / Default</option>
                        {rawColors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.hexCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                      Variant Size Scale
                    </label>
                    <select
                      value={variantForm.sizeId}
                      onChange={(e) =>
                        setVariantForm((prev) => ({ ...prev, sizeId: e.target.value }))
                      }
                      className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#fef08a] cursor-pointer"
                    >
                      <option value="">Free Size / None</option>
                      {rawSizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} {s.name !== s.code ? `(${s.name})` : ''}
                        </option>
                      ))}
                    </select>
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
                        Selling Price (₹)
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

                {/* Variant Images Array */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Variant Images ({variantForm.images.length})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={variantForm.imageInput}
                      onChange={(e) =>
                        setVariantForm((prev) => ({ ...prev, imageInput: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVariantFormImage();
                        }
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#fef08a]"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariantFormImage}
                      className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                    >
                      Add Image
                    </button>
                  </div>

                  {/* Previews */}
                  {variantForm.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-3 p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80 max-h-36 overflow-y-auto">
                      {variantForm.images.map((img, idx) => (
                        <div
                          key={`var-img-${idx}`}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 group bg-zinc-900 shrink-0"
                        >
                          <Image
                            src={img}
                            alt={`Variant ${idx + 1}`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantFormImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded bg-black/80 text-white hover:bg-red-600 transition-colors opacity-90 group-hover:opacity-100 cursor-pointer"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form Action Footer */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900 mt-2">
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
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                        setCategoryForm({ ...categoryForm, name, slug });
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      placeholder="winter-outerwear"
                      value={categoryForm.slug}
                      onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-[#fef08a]"
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
          </div>
        </div>
      )}

      {/* Invoice Generator Modal */}
      <InvoiceModal
        isOpen={activeModal === 'INVOICE'}
        onClose={() => setActiveModal('NONE')}
        products={products}
        token={getAuthToken()}
      />
    </div>
  );
}
