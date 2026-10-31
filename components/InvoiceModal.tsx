'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  User as UserIcon,
  ShoppingBag,
  Percent,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Calendar,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Loader2,
  Check,
  RotateCcw,
  Search,
  ChevronDown,
} from 'lucide-react';
import { Product } from '@/data/products';
import {
  fetchAdminUsers,
  recordAdminInvoiceSale,
  fetchNextInvoiceNumber,
  resetInvoiceCounterApi,
} from '@/utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceLineItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  size?: string;
  color?: string;
  originalPrice: number;
  sellingPrice: number;
  quantity: number;
  discountAmount: number; // per unit: originalPrice - sellingPrice
  totalAmount: number; // sellingPrice * quantity
  totalDiscount: number; // discountAmount * quantity
}

interface UserAddressData {
  tag?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postalCode?: string;
  isDefault?: boolean;
}

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  address?: any;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  token?: string;
  onSaleSaved?: () => Promise<void> | void;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  products = [],
  token = '',
  onSaleSaved,
}: InvoiceModalProps) {
  // -------------------------------------------------------------
  // Users state & loading
  // -------------------------------------------------------------
  const [usersList, setUsersList] = useState<AdminUserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSavedAddresses, setUserSavedAddresses] = useState<
    { label: string; text: string; raw: any; isActive: boolean }[]
  >([]);

  // -------------------------------------------------------------
  // Customer & Invoice Details
  // -------------------------------------------------------------
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [notes, setNotes] = useState(
    'Thank you for shopping with StyleFox! Goods can be exchanged or returned within 7 days in original condition with tags intact.'
  );

  // -------------------------------------------------------------
  // Product Selector State
  // -------------------------------------------------------------
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [productName, setProductName] = useState('');
  const [productOriginalPrice, setProductOriginalPrice] = useState<number>(0);
  const [productSellingPrice, setProductSellingPrice] = useState<number>(0);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productSize, setProductSize] = useState<string>('');
  const [productColor, setProductColor] = useState<string>('');
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  // -------------------------------------------------------------
  // Invoice Items List, Logo, and Save State
  // -------------------------------------------------------------
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [isSavingSale, setIsSavingSale] = useState(false);
  const [isSaleSaved, setIsSaleSaved] = useState(false);
  const [isResettingCounter, setIsResettingCounter] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  // Search & custom dropdown states for User and Product selection
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Filtered users based on userSearchQuery
  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return usersList;
    return usersList.filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phoneNumber || u.whatsappNumber || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [usersList, userSearchQuery]);

  // Filtered products based on productSearchQuery
  const filteredProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const id = String(p.id || '').toLowerCase();
      const categoryStr =
        typeof p.category === 'string'
          ? p.category
          : p.category?.name || p.category?.categoryName || p.categoryName || '';
      return (
        name.includes(q) ||
        id.includes(q) ||
        categoryStr.toLowerCase().includes(q)
      );
    });
  }, [products, productSearchQuery]);

  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  // Pre-load logo as base64 Data URL for PDF & Print embedding
  useEffect(() => {
    let isSubscribed = true;
    const fetchLogo = async () => {
      try {
        const res = await fetch('/logo.png');
        if (!res.ok) return;
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!isSubscribed || typeof reader.result !== 'string') return;
          const rawDataUrl = reader.result;

          // Downscale huge 11000px image to manageable ~600px width for fast rendering in PDF and Print
          try {
            const img = new window.Image();
            img.onload = () => {
              try {
                const targetW = 600;
                const targetH = Math.max(1, Math.round(targetW * (img.naturalHeight / (img.naturalWidth || 1))));
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, targetW, targetH);
                  const optimizedDataUrl = canvas.toDataURL('image/png');
                  if (isSubscribed) setLogoDataUrl(optimizedDataUrl);
                  return;
                }
              } catch {}
              if (isSubscribed) setLogoDataUrl(rawDataUrl);
            };
            img.onerror = () => {
              if (isSubscribed) setLogoDataUrl(rawDataUrl);
            };
            img.src = rawDataUrl;
          } catch {
            if (isSubscribed) setLogoDataUrl(rawDataUrl);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn('Could not load logo for invoice:', err);
      }
    };

    fetchLogo();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Company Details for Invoice
  const companyInfo = {
    name: 'Stylish Fox',
    tagline: 'MODERN STREETWEAR AESTHETIC',
    addressLine1: 'Mattakkara, Kottayam',
    addressLine2: 'Kerala 686564, India',
    fullAddress: 'Stylish Fox, Mattakkara, Kottayam, Kerala 686564, India',
    email: 'Stylishfoxofficial@gmail.com',
    phone: '+91 7012067285',
    website: 'www.stylishfox.in',
  };

  // Helper: Prepare form for a new invoice (resets products and fetches next sequential number)
  const handleNewInvoice = async (keepCustomer = false) => {
    const today = new Date().toISOString().split('T')[0];
    setInvoiceDate(today);
    setIsSaleSaved(false);
    setInvoiceItems([]);
    setSelectedProductId('');
    setSelectedVariantId('');
    setProductName('');
    setProductOriginalPrice(0);
    setProductSellingPrice(0);
    setProductQuantity(1);
    setProductSize('');
    setProductColor('');

    setProductSearchQuery('');
    setIsProductDropdownOpen(false);

    if (!keepCustomer) {
      setSelectedUserId('');
      setUserSearchQuery('');
      setIsUserDropdownOpen(false);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerAddress('');
      setUserSavedAddresses([]);
    }

    const effectiveToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');

    try {
      const nextInv = await fetchNextInvoiceNumber(effectiveToken);
      setInvoiceNumber(nextInv || 'SF-INV-00001');
      showToast('success', `Created new blank invoice: ${nextInv || 'SF-INV-00001'}`);
    } catch {
      setInvoiceNumber('SF-INV-00001');
    }
  };

  // Helper: Reset counter completely back to SF-INV-00001
  const handleResetCounter = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset the invoice counter to SF-INV-00001? This will restart numbering from SF-INV-00001 for future invoices.'
      )
    ) {
      return;
    }

    const effectiveToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
    if (!effectiveToken) {
      showToast('error', 'Admin authorization token missing. Please sign in again.');
      return;
    }

    setIsResettingCounter(true);
    try {
      const nextNum = await resetInvoiceCounterApi(effectiveToken);
      setInvoiceNumber(nextNum || 'SF-INV-00001');
      setIsSaleSaved(false);
      showToast('success', 'Invoice counter reset to SF-INV-00001');
      if (onSaleSaved) {
        await onSaleSaved();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reset invoice counter');
    } finally {
      setIsResettingCounter(false);
    }
  };

  // Initialize Invoice defaults when opened
  useEffect(() => {
    let isCancelled = false;
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setInvoiceDate(today);
      setIsSaleSaved(false);

      const effectiveToken =
        token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');

      // Load next sequential invoice number starting at SF-INV-00001
      fetchNextInvoiceNumber(effectiveToken).then((nextInv) => {
        if (!isCancelled) {
          setInvoiceNumber(nextInv || 'SF-INV-00001');
        }
      });

      loadUsers();
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  // Load all users for the dropdown
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const effectiveToken =
        token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
      const data = await fetchAdminUsers(effectiveToken);
      if (Array.isArray(data) && data.length > 0) {
        setUsersList(data);
      }
    } catch (err) {
      console.warn('Could not load users for invoice:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Helper: Format address object into string
  const formatAddressObject = (raw: any): string => {
    if (!raw) return '';
    if (typeof raw === 'string') return raw.trim();

    const addr = raw.address || raw;
    if (typeof addr === 'string') return addr.trim();

    const parts = [
      addr.street || addr.addressLine1 || '',
      addr.addressLine2 || '',
      addr.city || '',
      addr.state || '',
      addr.pincode || addr.postalCode ? `PIN: ${addr.pincode || addr.postalCode}` : '',
    ].filter(Boolean);

    return parts.join(', ');
  };

  // When a user is selected from dropdown
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    if (!userId) {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setCustomerAddress('');
      setUserSavedAddresses([]);
      return;
    }

    const foundUser = usersList.find((u) => u.id === userId);
    if (!foundUser) return;

    setCustomerName(foundUser.name || '');
    setCustomerEmail(foundUser.email || '');
    setCustomerPhone(foundUser.phoneNumber || foundUser.whatsappNumber || '');

    // Process user addresses
    const rawAddressList = Array.isArray(foundUser.address)
      ? foundUser.address
      : foundUser.address
      ? [foundUser.address]
      : [];

    const formattedAddresses = rawAddressList
      .map((entry: any, idx: number) => {
        const text = formatAddressObject(entry);
        const tag = entry?.address?.tag || entry?.tag || `Address ${idx + 1}`;
        const isActive = entry?.ActiveAddress === true || entry?.isDefault === true || idx === 0;
        return {
          label: `${tag}${entry?.ActiveAddress ? ' (Active)' : ''}`,
          text,
          raw: entry,
          isActive,
        };
      })
      .filter((item) => item.text.length > 0);

    setUserSavedAddresses(formattedAddresses);

    // Pick active address or first address
    const activeOne = formattedAddresses.find((a) => a.isActive) || formattedAddresses[0];
    if (activeOne) {
      setCustomerAddress(activeOne.text);
      // Auto-fill phone from address if user has none
      const addrPhone =
        activeOne.raw?.address?.phone || activeOne.raw?.phone || activeOne.raw?.address?.phoneNumber;
      if (!foundUser.phoneNumber && addrPhone) {
        setCustomerPhone(addrPhone);
      }
    } else {
      setCustomerAddress('');
    }

    showToast('success', `Customer details & address auto-filled for ${foundUser.name}`);
  };

  // Helper to find matching variant in product
  const findMatchingVariant = (
    prod: Product | undefined,
    colorName?: string,
    sizeName?: string
  ) => {
    if (!prod || !Array.isArray(prod.variants) || prod.variants.length === 0) return null;
    const cTarget = (colorName || '').toLowerCase().trim();
    const sTarget = (sizeName || '').toLowerCase().trim();

    // 1. Exact match on both color and size
    const exact = prod.variants.find((v: any) => {
      const vColor = (v.color?.name || v.colorName || '').toLowerCase().trim();
      const vSize = (v.size?.code || v.size?.name || v.sizeCode || '').toLowerCase().trim();
      const matchC = !cTarget || cTarget === 'standard' || !vColor || vColor === 'standard' || vColor === cTarget;
      const matchS = !sTarget || sTarget === 'standard' || !vSize || vSize === 'standard' || vSize === sTarget;
      return matchC && matchS;
    });
    if (exact) return exact;

    // 2. Match on color only
    const colorMatch = prod.variants.find((v: any) => {
      const vColor = (v.color?.name || v.colorName || '').toLowerCase().trim();
      return vColor && vColor === cTarget;
    });
    if (colorMatch) return colorMatch;

    return prod.variants[0] || null;
  };

  // When a product is selected from dropdown
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    if (!productId) {
      setSelectedVariantId('');
      setProductName('');
      setProductOriginalPrice(0);
      setProductSellingPrice(0);
      setProductQuantity(1);
      setProductSize('');
      setProductColor('');
      setAvailableSizes([]);
      setAvailableColors([]);
      return;
    }

    const found = products.find((p) => String(p.id) === String(productId));
    if (!found) return;

    setProductName(found.name || 'Product');

    // Sizes
    const sizes = Array.isArray(found.sizes) && found.sizes.length > 0 ? found.sizes : ['Standard'];
    setAvailableSizes(sizes);
    const initialSize = sizes[0] || 'Standard';
    setProductSize(initialSize);

    // Colors
    const colors =
      Array.isArray(found.colors) && found.colors.length > 0
        ? found.colors.map((c) => c.name)
        : ['Standard'];
    setAvailableColors(colors);
    const initialColor = colors[0] || 'Standard';
    setProductColor(initialColor);

    // Match variant to resolve accurate pricing
    const matchedVariant = findMatchingVariant(found, initialColor, initialSize);
    if (matchedVariant) {
      setSelectedVariantId(matchedVariant.id || '');
      const vPrice = parseFloat(matchedVariant.price);
      const vSelling = parseFloat(matchedVariant.sellingPrice ?? matchedVariant.selling_price);

      const resolvedOrig = !isNaN(vPrice) && vPrice > 0 ? vPrice : found.originalPrice || 1999;
      const resolvedSell = !isNaN(vSelling) && vSelling > 0 ? vSelling : (!isNaN(vPrice) && vPrice > 0 ? vPrice : found.sellingPrice || found.price || 1299);

      setProductOriginalPrice(resolvedOrig);
      setProductSellingPrice(resolvedSell);
    } else {
      setSelectedVariantId('');
      const orig = found.originalPrice || Math.round((found.price || 1299) * 1.4);
      const selling = found.sellingPrice || found.price || 1299;
      setProductOriginalPrice(orig);
      setProductSellingPrice(selling);
    }

    setProductQuantity(1);
  };

  // Auto-calculated discount for selected item
  const selectedUnitDiscount = Math.max(0, productOriginalPrice - productSellingPrice);
  const selectedDiscountPct =
    productOriginalPrice > 0
      ? Math.round(((productOriginalPrice - productSellingPrice) / productOriginalPrice) * 100)
      : 0;

  // Add product to invoice items table
  const handleAddItem = () => {
    if (!productName.trim()) {
      showToast('error', 'Please select a product first.');
      return;
    }
    if (productQuantity < 1) {
      showToast('error', 'Quantity must be at least 1.');
      return;
    }

    // Resolve variant ID if not set
    const foundProd = products.find((p) => String(p.id) === String(selectedProductId));
    const matchedV = findMatchingVariant(foundProd, productColor, productSize);
    const variantIdToSave = selectedVariantId || matchedV?.id || '';

    // Check if same product with same size & color already in table
    const existingIndex = invoiceItems.findIndex(
      (item) =>
        item.productId === selectedProductId &&
        item.size === productSize &&
        item.color === productColor
    );

    if (existingIndex >= 0) {
      // Update existing item quantity
      setInvoiceItems((prev) => {
        const next = [...prev];
        const existing = next[existingIndex];
        const newQty = existing.quantity + productQuantity;
        next[existingIndex] = {
          ...existing,
          variantId: existing.variantId || variantIdToSave,
          quantity: newQty,
          totalAmount: existing.sellingPrice * newQty,
          totalDiscount: existing.discountAmount * newQty,
        };
        return next;
      });
      showToast(
        'success',
        `Increased quantity for "${productName}" (${productSize || ''}) to ${
          invoiceItems[existingIndex].quantity + productQuantity
        }`
      );
    } else {
      // Add new row
      const newItem: InvoiceLineItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: selectedProductId,
        variantId: variantIdToSave,
        name: productName,
        size: productSize,
        color: productColor,
        originalPrice: productOriginalPrice,
        sellingPrice: productSellingPrice,
        quantity: productQuantity,
        discountAmount: selectedUnitDiscount,
        totalAmount: productSellingPrice * productQuantity,
        totalDiscount: selectedUnitDiscount * productQuantity,
      };

      setInvoiceItems((prev) => [...prev, newItem]);
      showToast('success', `Added "${productName}" to invoice`);
    }

    // Reset selector
    setSelectedProductId('');
    setSelectedVariantId('');
    setProductName('');
    setProductOriginalPrice(0);
    setProductSellingPrice(0);
    setProductQuantity(1);
    setProductSize('');
    setProductColor('');
    setAvailableSizes([]);
    setAvailableColors([]);
  };

  // Modify row quantity in table
  const handleUpdateItemQuantity = (itemId: string, newQty: number) => {
    if (newQty < 1) {
      handleRemoveItem(itemId);
      return;
    }
    setInvoiceItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQty,
            totalAmount: item.sellingPrice * newQty,
            totalDiscount: item.discountAmount * newQty,
          };
        }
        return item;
      })
    );
  };

  // Remove row from table
  const handleRemoveItem = (itemId: string) => {
    setInvoiceItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // -------------------------------------------------------------
  // Invoice Totals Calculation
  // -------------------------------------------------------------
  const totalMRP = useMemo(() => {
    return invoiceItems.reduce((acc, item) => acc + item.originalPrice * item.quantity, 0);
  }, [invoiceItems]);

  const totalDiscount = useMemo(() => {
    return invoiceItems.reduce((acc, item) => acc + item.totalDiscount, 0);
  }, [invoiceItems]);

  const subtotal = useMemo(() => {
    return invoiceItems.reduce((acc, item) => acc + item.totalAmount, 0);
  }, [invoiceItems]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + (shippingFee || 0));
  }, [subtotal, shippingFee]);

  const totalSavingsPct = totalMRP > 0 ? Math.round((totalDiscount / totalMRP) * 100) : 0;

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 3500);
  };

  // -------------------------------------------------------------
  // Save Invoice & Deduct Variant Stock in DB (sales_details & product_variants)
  // -------------------------------------------------------------
  const handleSaveInvoiceToDb = async () => {
    if (invoiceItems.length === 0) {
      showToast('error', 'Please add at least one product before saving.');
      return;
    }
    if (!customerName.trim()) {
      showToast('error', 'Please enter or select a customer name.');
      return;
    }

    const effectiveToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');
    if (!effectiveToken) {
      showToast('error', 'Admin authorization token missing. Please sign in again.');
      return;
    }

    setIsSavingSale(true);
    try {
      const payload = {
        invoiceNumber,
        userId: selectedUserId || null,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        customerPhone: customerPhone.trim() || null,
        customerAddress: customerAddress.trim() || null,
        paymentMethod,
        paymentStatus,
        notes: notes.trim() || null,
        items: invoiceItems.map((item) => ({
          productId: item.productId || null,
          variantId: item.variantId || null,
          productName: item.name,
          size: item.size || null,
          color: item.color || null,
          quantity: item.quantity,
          originalPrice: item.originalPrice,
          sellingPrice: item.sellingPrice,
          discountAmount: item.discountAmount,
          totalAmount: item.totalAmount,
        })),
      };

      const res = await recordAdminInvoiceSale(effectiveToken, payload);
      if (res.ok) {
        setIsSaleSaved(true);
        showToast('success', 'Invoice sale recorded to sales_details & product variant stock reduced!');
        if (onSaleSaved) {
          await onSaleSaved();
        }
      } else {
        showToast('error', res.data?.message || 'Failed to record invoice sale in database.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error occurred while saving invoice sale.');
    } finally {
      setIsSavingSale(false);
    }
  };

  // -------------------------------------------------------------
  // Generate & Download PDF with jsPDF (Saved with User's Name)
  // -------------------------------------------------------------
  const handleSavePDF = () => {
    if (invoiceItems.length === 0) {
      showToast('error', 'Please add at least one product before saving.');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
      const margin = 14;

      // 1. Header Bar
      doc.setFillColor(15, 23, 42); // slate-900 (#0f172a)
      doc.rect(0, 0, pageWidth, 48, 'F');

      // Accent line
      doc.setFillColor(250, 204, 21); // yellow-400 (#facc15)
      doc.rect(0, 48, pageWidth, 2.5, 'F');

      // Brand Logo
      if (logoDataUrl) {
        try {
          const logoW = 38;
          const logoH = 17.5;
          doc.addImage(logoDataUrl, 'PNG', margin, 5.5, logoW, logoH);
        } catch (err) {
          console.warn('Could not add logo to PDF:', err);
        }
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text('STYLEFOX', margin, 17);
      }

      // Title/Tagline, Company Address, Email & Website placed on the left header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240); // slate-200
      doc.text(companyInfo.tagline, margin, 27);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(`${companyInfo.name} - ${companyInfo.addressLine1}, ${companyInfo.addressLine2}`, margin, 33);
      doc.text(`${companyInfo.email}  |  ${companyInfo.phone}  |  ${companyInfo.website}`, margin, 39);

      // Invoice Label & Meta (Right Aligned)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(254, 240, 138); // yellow-200
      doc.text('INVOICE', pageWidth - margin, 17, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(241, 245, 249);
      doc.text(`Invoice No: ${invoiceNumber}`, pageWidth - margin, 25, { align: 'right' });
      doc.text(`Date: ${invoiceDate}`, pageWidth - margin, 31, { align: 'right' });

      // 2. Info Boxes (Customer & Invoice meta)
      let currentY = 56;
      const boxHeight = 36;
      const colWidth = (pageWidth - margin * 2 - 8) / 2;

      // Left Box: Billed To (Customer)
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY, colWidth, boxHeight, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, colWidth, boxHeight, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('BILLED TO (CUSTOMER):', margin + 4, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(customerName || 'Walk-in Customer', margin + 4, currentY + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      let addrY = currentY + 17;
      if (customerPhone) {
        doc.text(`Phone: ${customerPhone}`, margin + 4, addrY);
        addrY += 4;
      }
      if (customerEmail) {
        doc.text(`Email: ${customerEmail}`, margin + 4, addrY);
        addrY += 4;
      }
      if (customerAddress) {
        const splitAddr = doc.splitTextToSize(`Address: ${customerAddress}`, colWidth - 8);
        doc.text(splitAddr.slice(0, 2), margin + 4, addrY);
      }

      // Right Box: Payment & Dispatch Details
      const rightX = margin + colWidth + 8;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(rightX, currentY, colWidth, boxHeight, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(rightX, currentY, colWidth, boxHeight, 2, 2, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('PAYMENT & ORDER DETAILS:', rightX + 4, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Payment Mode: ${paymentMethod}`, rightX + 4, currentY + 13);
      doc.text(`Payment Status: ${paymentStatus}`, rightX + 4, currentY + 19);
      doc.text(`Place of Supply: India`, rightX + 4, currentY + 25);
      doc.text(`Currency: INR (Rs.)`, rightX + 4, currentY + 31);

      currentY += boxHeight + 8;

      // 3. Line Items Table with AutoTable
      const tableRows = invoiceItems.map((item, idx) => {
        const specs = [item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : '']
          .filter(Boolean)
          .join(', ');

        return [
          String(idx + 1),
          specs ? `${item.name}\n${specs}` : item.name,
          `Rs. ${item.originalPrice.toLocaleString('en-IN')}`,
          `Rs. ${item.sellingPrice.toLocaleString('en-IN')}`,
          String(item.quantity),
          item.discountAmount > 0
            ? `Rs. ${(item.discountAmount * item.quantity).toLocaleString('en-IN')}`
            : 'Rs. 0',
          `Rs. ${item.totalAmount.toLocaleString('en-IN')}`,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['#', 'Item Description', 'MRP', 'Selling Price', 'Qty', 'Discount', 'Total Amount']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85],
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 'auto', halign: 'left' },
          2: { cellWidth: 24, halign: 'right' },
          3: { cellWidth: 26, halign: 'right' },
          4: { cellWidth: 14, halign: 'center' },
          5: { cellWidth: 24, halign: 'right' },
          6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      // 4. Summary & Notes (Bottom)
      const summaryWidth = 85;
      const summaryX = pageWidth - margin - summaryWidth;

      // Summary Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(summaryX, finalY, summaryWidth, 42, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(summaryX, finalY, summaryWidth, 42, 2, 2, 'S');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Gross Amount (MRP):', summaryX + 4, finalY + 8);
      doc.setTextColor(30, 41, 59);
      doc.text(`Rs. ${totalMRP.toLocaleString('en-IN')}`, pageWidth - margin - 4, finalY + 8, {
        align: 'right',
      });

      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text('Total Discount:', summaryX + 4, finalY + 16);
      doc.text(`- Rs. ${totalDiscount.toLocaleString('en-IN')}`, pageWidth - margin - 4, finalY + 16, {
        align: 'right',
      });

      doc.setTextColor(100, 116, 139);
      doc.text('Delivery & Shipping:', summaryX + 4, finalY + 24);
      doc.setTextColor(30, 41, 59);
      doc.text(
        shippingFee > 0 ? `Rs. ${shippingFee.toLocaleString('en-IN')}` : 'FREE',
        pageWidth - margin - 4,
        finalY + 24,
        { align: 'right' }
      );

      // Divider line
      doc.setDrawColor(203, 213, 225);
      doc.line(summaryX + 4, finalY + 28, pageWidth - margin - 4, finalY + 28);

      // Total Amount
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Total Amount:', summaryX + 4, finalY + 36);
      doc.text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, pageWidth - margin - 4, finalY + 36, {
        align: 'right',
      });

      // Notes block on the left
      if (notes) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('NOTES & TERMS:', margin, finalY + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const splitNotes = doc.splitTextToSize(notes, summaryX - margin - 8);
        doc.text(splitNotes, margin, finalY + 14);
      }

      // 5. Footer Line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, 280, pageWidth - margin, 280);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('This is a computer generated invoice and requires no physical signature.', margin, 285);
      doc.text('StyleFox Apparel — Wear Your Boldness.', pageWidth - margin, 285, { align: 'right' });

      // Clean, sanitized customer name for filename
      const sanitizedUserName = (customerName || 'Customer')
        .trim()
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .replace(/\s+/g, '_');

      const fileName = `${sanitizedUserName}_Invoice_${invoiceNumber}.pdf`;

      // Trigger instant download directly to user's computer
      doc.save(fileName);
      showToast('success', `Invoice PDF saved as "${fileName}"`);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast('error', 'Failed to generate invoice PDF.');
    }
  };

  // -------------------------------------------------------------
  // Print Invoice Dialog
  // -------------------------------------------------------------
  const handlePrint = () => {
    if (invoiceItems.length === 0) {
      showToast('error', 'Please add at least one product before printing.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=950');
    if (!printWindow) {
      alert('Please allow popups in your browser to print the invoice.');
      return;
    }

    const itemsHtml = invoiceItems
      .map((item, idx) => {
        const specs = [item.size ? `Size: ${item.size}` : '', item.color ? `Color: ${item.color}` : '']
          .filter(Boolean)
          .join(', ');

        return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>
            <strong>${item.name}</strong>
            ${specs ? `<div style="color: #64748b; font-size: 11px;">${specs}</div>` : ''}
          </td>
          <td style="text-align: right;">Rs. ${item.originalPrice.toLocaleString('en-IN')}</td>
          <td style="text-align: right;">Rs. ${item.sellingPrice.toLocaleString('en-IN')}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right; color: #16a34a;">Rs. ${(
            item.discountAmount * item.quantity
          ).toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-weight: bold;">Rs. ${item.totalAmount.toLocaleString(
            'en-IN'
          )}</td>
        </tr>
      `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${customerName || 'Customer'} - Invoice ${invoiceNumber}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 24px;
              font-size: 13px;
              line-height: 1.5;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .brand-logo-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #09090b !important; }
              th { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #0f172a !important; color: #ffffff !important; }
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #eab308;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .brand-wrap {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 6px;
            }
            .brand-logo-box {
              background-color: #09090b !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              padding: 8px 16px;
              border-radius: 8px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .brand-logo-box img {
              height: 44px;
              width: auto;
              max-width: 160px;
              object-fit: contain;
              display: block;
            }
            .brand-meta {
              display: flex;
              flex-direction: column;
              gap: 2px;
            }
            .brand-tagline {
              font-size: 10px;
              font-weight: 700;
              color: #334155;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            .brand-address {
              font-size: 11px;
              color: #475569;
            }
            .brand-contact {
              font-size: 11px;
              color: #64748b;
            }
            .invoice-meta {
              text-align: right;
            }
            .invoice-meta h2 {
              margin: 0;
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
            }
            .meta-line {
              font-size: 12px;
              color: #475569;
              margin-top: 3px;
            }
            .meta-line strong {
              color: #0f172a;
            }
            .grid-boxes {
              display: flex;
              gap: 20px;
              margin-bottom: 24px;
            }
            .box {
              flex: 1;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 14px;
              background: #f8fafc;
            }
            .box-title {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .box-name {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .box-line {
              font-size: 12px;
              color: #475569;
              margin-top: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th {
              background-color: #0f172a !important;
              color: #ffffff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              text-align: left;
              padding: 10px 12px;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 12px;
            }
            tr:nth-child(even) td {
              background: #f8fafc;
            }
            .summary-section {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              margin-bottom: 30px;
            }
            .notes {
              flex: 1;
              font-size: 11px;
              color: #64748b;
            }
            .summary-table {
              width: 300px;
              border-collapse: collapse;
            }
            .summary-table td {
              padding: 6px 8px;
              border: none;
              font-size: 12px;
            }
            .summary-table .total-row td {
              border-top: 2px solid #0f172a;
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
              padding-top: 10px;
            }
            .footer {
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
              font-size: 10px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div class="brand-wrap">
              <div class="brand-logo-box">
                <img id="invoiceLogo" src="${logoDataUrl || (typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png')}" alt="StyleFox" />
              </div>
              <div class="brand-meta">
                <div class="brand-tagline">${companyInfo.tagline}</div>
                <div class="brand-address"><strong>${companyInfo.name}</strong> &bull; ${companyInfo.addressLine1}, ${companyInfo.addressLine2}</div>
                <div class="brand-contact">${companyInfo.email} &bull; ${companyInfo.phone} &bull; ${companyInfo.website}</div>
              </div>
            </div>
            <div class="invoice-meta">
              <h2>INVOICE</h2>
              <div class="meta-line"><strong>Invoice No:</strong> ${invoiceNumber}</div>
              <div class="meta-line"><strong>Date:</strong> ${invoiceDate}</div>
              <div class="meta-line"><strong>Status:</strong> ${paymentStatus}</div>
            </div>
          </div>

          <div class="grid-boxes">
            <div class="box">
              <div class="box-title">Billed To (Customer)</div>
              <div class="box-name">${customerName || 'Walk-in Customer'}</div>
              ${customerPhone ? `<div class="box-line">Phone: ${customerPhone}</div>` : ''}
              ${customerEmail ? `<div class="box-line">Email: ${customerEmail}</div>` : ''}
              ${customerAddress ? `<div class="box-line">Address: ${customerAddress}</div>` : ''}
            </div>

            <div class="box">
              <div class="box-title">Order & Payment Details</div>
              <div class="box-line"><strong>Payment Mode:</strong> ${paymentMethod}</div>
              <div class="box-line"><strong>Payment Status:</strong> ${paymentStatus}</div>
              <div class="box-line"><strong>Place of Supply:</strong> India</div>
              <div class="box-line"><strong>Currency:</strong> INR (Rs.)</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>Item Description</th>
                <th style="text-align: right;">MRP</th>
                <th style="text-align: right;">Selling Price</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Discount</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="notes">
              <strong>Notes & Terms:</strong>
              <p style="margin: 4px 0 0;">${notes}</p>
            </div>

            <table class="summary-table">
              <tr>
                <td style="color: #64748b;">Gross Amount (MRP):</td>
                <td style="text-align: right;">Rs. ${totalMRP.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="color: #16a34a; font-weight: 600;">Total Discount:</td>
                <td style="text-align: right; color: #16a34a; font-weight: 600;">- Rs. ${totalDiscount.toLocaleString(
                  'en-IN'
                )}</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Shipping & Delivery:</td>
                <td style="text-align: right;">${
                  shippingFee > 0 ? `Rs. ${shippingFee.toLocaleString('en-IN')}` : 'FREE'
                }</td>
              </tr>
              <tr class="total-row">
                <td>Total Amount:</td>
                <td style="text-align: right;">Rs. ${grandTotal.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <span>This is a computer generated invoice and requires no physical signature.</span>
            <span>StyleFox Apparel &bull; Wear Your Boldness</span>
          </div>

          <script>
            // Ensure image is fully loaded before triggering print dialog
            const img = document.getElementById('invoiceLogo');
            function doPrint() {
              window.focus();
              window.print();
            }
            if (img && !img.complete) {
              img.onload = () => setTimeout(doPrint, 250);
              img.onerror = () => setTimeout(doPrint, 250);
            } else {
              setTimeout(doPrint, 300);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-5xl shadow-2xl relative my-6 text-white max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-950/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="relative h-11 px-3 flex items-center justify-center bg-black/80 border border-zinc-800 rounded-xl shadow-inner">
              <img
                src="/logo.png"
                alt="StyleFox Logo"
                className="h-7 w-auto object-contain max-w-[120px]"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>Generate Customer Invoice</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Billing
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {companyInfo.name} &bull; {companyInfo.addressLine1}, {companyInfo.addressLine2} &bull; {companyInfo.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-red-950/40 border-red-800/60 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Body - Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Customer Selection & Address Auto-fill */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <UserIcon className="w-4 h-4 text-[#fef08a]" />
                <span>1. Select User &amp; Customer Information</span>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="text-[11px] text-zinc-400 hover:text-[#fef08a] flex items-center gap-1 transition-colors cursor-pointer"
                title="Reload users from backend"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                <span>Refresh Users</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* User Select Dropdown with Search */}
              <div className="lg:col-span-2 relative" ref={userDropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Select User from System <span className="text-[#fef08a]">*</span>
                  </label>
                  {selectedUserId && (
                    <button
                      type="button"
                      onClick={() => handleSelectUser('')}
                      className="text-[10px] text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Dropdown trigger button */}
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                  className={`w-full bg-zinc-950 border ${
                    isUserDropdownOpen ? 'border-[#fef08a]' : 'border-zinc-800'
                  } rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between transition-colors focus:outline-none`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <UserIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    {selectedUserId ? (
                      (() => {
                        const u = usersList.find((usr) => usr.id === selectedUserId);
                        return u ? (
                          <span className="text-white font-medium truncate">
                            {u.name} <span className="text-zinc-500">({u.email || u.phoneNumber || 'User'})</span>
                          </span>
                        ) : (
                          <span className="text-zinc-400">Selected User</span>
                        );
                      })()
                    ) : (
                      <span className="text-zinc-500">Search or choose a user...</span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ${
                      isUserDropdownOpen ? 'rotate-180 text-[#fef08a]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
                    {/* Search Input Bar */}
                    <div className="p-2 border-b border-zinc-800 bg-zinc-950/80 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search by name, email, or phone..."
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                      {userSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setUserSearchQuery('')}
                          className="text-[10px] text-zinc-400 hover:text-white px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Options list */}
                    <div className="max-h-56 overflow-y-auto divide-y divide-zinc-800/40">
                      {filteredUsers.length === 0 ? (
                        <div className="px-3.5 py-4 text-center text-xs text-zinc-500">
                          No users found matching &quot;{userSearchQuery}&quot;
                        </div>
                      ) : (
                        filteredUsers.map((u) => {
                          const addrCount = Array.isArray(u.address)
                            ? u.address.length
                            : u.address
                            ? 1
                            : 0;
                          const isSelected = u.id === selectedUserId;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                handleSelectUser(u.id);
                                setIsUserDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 hover:bg-zinc-800/70 transition-colors cursor-pointer ${
                                isSelected ? 'bg-[#fef08a]/10 text-[#fef08a]' : 'text-zinc-200'
                              }`}
                            >
                              <div className="truncate">
                                <p className="font-semibold text-white truncate">{u.name}</p>
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {u.email || 'No email'} {u.phoneNumber ? `• ${u.phoneNumber}` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700/50">
                                  {addrCount} addr
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#fef08a]" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Customer Name <span className="text-zinc-500">(Used in PDF filename)</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#fef08a]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#fef08a]"
                />
              </div>

              {/* Email */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#fef08a]"
                />
              </div>

              {/* Auto-filled Address */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Delivery Address <span className="text-[#fef08a]">(Auto-filled)</span>
                  </label>
                  {userSavedAddresses.length > 1 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-zinc-500">Addresses:</span>
                      {userSavedAddresses.map((addr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCustomerAddress(addr.text)}
                          className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            customerAddress === addr.text
                              ? 'bg-[#fef08a] text-black font-bold'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {addr.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Street, City, State, Pincode"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#fef08a] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product Selection & Pricing Auto-fill */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 mb-4">
              <ShoppingBag className="w-4 h-4 text-[#fef08a]" />
              <span>2. Select Product &amp; Auto-populate Price / Discount</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
              {/* Product Dropdown with Search */}
              <div className="lg:col-span-4 sm:col-span-2 relative" ref={productDropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-zinc-400">
                    Select Product <span className="text-[#fef08a]">*</span>
                  </label>
                  {selectedProductId && (
                    <button
                      type="button"
                      onClick={() => handleSelectProduct('')}
                      className="text-[10px] text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                  className={`w-full bg-zinc-950 border ${
                    isProductDropdownOpen ? 'border-[#fef08a]' : 'border-zinc-800'
                  } rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between transition-colors focus:outline-none`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <ShoppingBag className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    {selectedProductId ? (
                      (() => {
                        const p = products.find((prod) => String(prod.id) === String(selectedProductId));
                        if (!p) return <span className="text-zinc-400">{productName || 'Selected Product'}</span>;
                        const sp = p.sellingPrice || p.price || 1299;
                        return (
                          <span className="text-white font-medium truncate">
                            {p.name} <span className="text-[#fef08a] font-bold">₹{sp}</span>
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-zinc-500">Search or choose product...</span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ${
                      isProductDropdownOpen ? 'rotate-180 text-[#fef08a]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isProductDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
                    {/* Search Input Bar */}
                    <div className="p-2 border-b border-zinc-800 bg-zinc-950/80 flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <input
                        type="text"
                        autoFocus
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        placeholder="Search product by title, category, id..."
                        className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                      {productSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setProductSearchQuery('')}
                          className="text-[10px] text-zinc-400 hover:text-white px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Options list */}
                    <div className="max-h-60 overflow-y-auto divide-y divide-zinc-800/40">
                      {filteredProducts.length === 0 ? (
                        <div className="px-3.5 py-4 text-center text-xs text-zinc-500">
                          No products found matching &quot;{productSearchQuery}&quot;
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const sp = p.sellingPrice || p.price || 1299;
                          const orig = p.originalPrice || Math.round(sp * 1.4);
                          const isSelected = String(p.id) === String(selectedProductId);
                          const imgUrl = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;

                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                handleSelectProduct(String(p.id));
                                setIsProductDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between gap-2.5 hover:bg-zinc-800/70 transition-colors cursor-pointer ${
                                isSelected ? 'bg-[#fef08a]/10 text-[#fef08a]' : 'text-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={p.name}
                                    className="w-8 h-8 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-700/50"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0 border border-zinc-700/50 text-[10px]">
                                    SF
                                  </div>
                                )}
                                <div className="truncate">
                                  <p className="font-semibold text-white truncate">{p.name}</p>
                                  <p className="text-[10px] text-zinc-400 truncate">
                                    {(typeof p.category === 'string'
                                      ? p.category
                                      : p.category?.name || p.categoryName) || 'Product'}{' '}
                                    {p.colors?.length ? `• ${p.colors.length} col` : ''}{' '}
                                    {p.sizes?.length ? `• ${p.sizes.join('/')}` : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <span className="font-bold text-[#fef08a] block text-xs">₹{sp}</span>
                                  <span className="text-[10px] text-zinc-500 line-through">₹{orig}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#fef08a]" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Original Price / MRP */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  MRP (Orig. Price)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={productOriginalPrice || ''}
                    onChange={(e) => setProductOriginalPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-7 pr-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-[#fef08a]"
                  />
                </div>
              </div>

              {/* Selling Price */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Selling Price <span className="text-[#fef08a]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={productSellingPrice || ''}
                    onChange={(e) => setProductSellingPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-7 pr-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-[#fef08a]"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Quantity
                </label>
                <div className="flex items-center border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setProductQuantity((q) => Math.max(1, q - 1))}
                    className="px-2.5 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-transparent text-center text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setProductQuantity((q) => q + 1)}
                    className="px-2.5 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Add Button */}
              <div className="lg:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!productName.trim()}
                  className="w-full flex items-center justify-center gap-1.5 bg-[#fef08a] hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Table</span>
                </button>
              </div>
            </div>

            {/* Auto-calculated Details Preview for Selected Product */}
            {productName && (
              <div className="mt-3.5 pt-3.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-zinc-400">
                    Selected:{' '}
                    <strong className="text-white font-semibold">{productName}</strong>
                  </span>

                  {/* Size Selector */}
                  {availableSizes.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500 text-[11px]">Size:</span>
                      <select
                        value={productSize}
                        onChange={(e) => setProductSize(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none"
                      >
                        {availableSizes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Color Selector */}
                  {availableColors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-500 text-[11px]">Color:</span>
                      <select
                        value={productColor}
                        onChange={(e) => setProductColor(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-300 focus:outline-none"
                      >
                        {availableColors.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Discount Badge */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[11px]">
                    <Percent className="w-3 h-3" />
                    <span>
                      Discount: ₹{selectedUnitDiscount} off ({selectedDiscountPct}%)
                    </span>
                  </div>
                  <span className="text-zinc-400">
                    Item Total:{' '}
                    <strong className="text-white font-bold">
                      ₹{(productSellingPrice * productQuantity).toLocaleString('en-IN')}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Added Products Table (Multiple Products) */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <FileText className="w-4 h-4 text-[#fef08a]" />
                <span>3. Invoice Items Table</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  {invoiceItems.length} product{invoiceItems.length === 1 ? '' : 's'}
                </span>
              </div>
              {invoiceItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInvoiceItems([])}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All Items</span>
                </button>
              )}
            </div>

            {invoiceItems.length === 0 ? (
              <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                <p className="font-semibold text-zinc-400">No products added to table yet</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Select a product above, configure price / discount / qty, and click &quot;Add to
                  Table&quot;.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-800/90">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3.5 text-center w-10">#</th>
                      <th className="py-3 px-3.5">Product Name &amp; Specs</th>
                      <th className="py-3 px-3.5 text-right">MRP (Orig)</th>
                      <th className="py-3 px-3.5 text-right">Selling Price</th>
                      <th className="py-3 px-3.5 text-center w-28">Quantity</th>
                      <th className="py-3 px-3.5 text-right">Discount</th>
                      <th className="py-3 px-3.5 text-right">Total</th>
                      <th className="py-3 px-3 text-center w-12">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                    {invoiceItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-3 px-3.5 text-center text-zinc-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-white">{item.name}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.size && item.color && <span>&bull;</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right text-zinc-500 line-through">
                          ₹{item.originalPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 text-right font-bold text-white">
                          ₹{item.sellingPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <div className="inline-flex items-center border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                              className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 text-xs font-bold text-white min-w-7 text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right text-emerald-400 font-medium">
                          ₹{item.totalDiscount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-white">
                          ₹{item.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Remove item"
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

          {/* Section 4: Invoice Meta & Financial Summary ("bottom side also show total amount total discount amount other details") */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Other Details (Invoice #, Date, Payment Mode, Status, Notes) */}
            <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <CreditCard className="w-4 h-4 text-[#fef08a]" />
                <span>4. Invoice Metadata &amp; Order Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Invoice Number
                    </label>
                    <button
                      type="button"
                      onClick={handleResetCounter}
                      disabled={isResettingCounter}
                      className="text-[10px] text-zinc-400 hover:text-[#fef08a] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Reset invoice counter back to SF-INV-00001"
                    >
                      <RotateCcw className={`w-3 h-3 ${isResettingCounter ? 'animate-spin text-[#fef08a]' : ''}`} />
                      <span>Reset to SF-INV-00001</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#fef08a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#fef08a] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#fef08a] cursor-pointer"
                  >
                    <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                    <option value="UPI / QR Code">UPI / QR Code (GPay, PhonePe)</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Prepaid Online">Prepaid Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                    Payment Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('PAID')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        paymentStatus === 'PAID'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      PAID
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('PENDING')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                        paymentStatus === 'PENDING'
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white'
                      }`}
                    >
                      PENDING
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Terms &amp; Custom Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-[#fef08a] resize-none"
                />
              </div>
            </div>

            {/* Right: Financial Breakdown (Total Amount, Total Discount, Gross) */}
            <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 mb-4">
                  <Percent className="w-4 h-4 text-[#fef08a]" />
                  <span>5. Billing Summary</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Gross Total (MRP) */}
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Total MRP (Gross Amount):</span>
                    <span className="font-semibold text-zinc-300">
                      ₹{totalMRP.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Total Discount Amount */}
                  <div className="flex items-center justify-between text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                    <span className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5" />
                      <span>Total Discount Amount:</span>
                    </span>
                    <span>
                      - ₹{totalDiscount.toLocaleString('en-IN')} ({totalSavingsPct}% OFF)
                    </span>
                  </div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Subtotal (Net Selling):</span>
                    <span className="font-semibold text-white">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Shipping &amp; Delivery:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-zinc-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-16 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-0.5 text-right text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Amount Box */}
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Total Amount (Grand Total)
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">
                      You Saved ₹{totalDiscount.toLocaleString('en-IN')} on this order
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#fef08a]">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Action Bar (Print & Save PDF Options) */}
        <div className="border-t border-zinc-800/80 px-6 py-4 bg-zinc-950/90 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-0 z-10 backdrop-blur-md">
          <div className="text-xs text-zinc-400">
            {customerName ? (
              <span>
                Target file:{' '}
                <strong className="text-zinc-200">
                  {customerName.trim().replace(/\s+/g, '_')}_Invoice_{invoiceNumber}.pdf
                </strong>
              </span>
            ) : (
              <span>Select or enter customer name for automatic PDF filename</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            {/* 1. Save Invoice Button (Adds to sales_details & Reduces Variant Stock) */}
            <button
              type="button"
              onClick={handleSaveInvoiceToDb}
              disabled={invoiceItems.length === 0 || isSavingSale || isSaleSaved}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-xl cursor-pointer ${
                isSaleSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-900/30 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {isSavingSale ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Saving Sale...</span>
                </>
              ) : isSaleSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Invoice</span>
                </>
              )}
            </button>

            {/* 2. Print Option (Displays once invoice is saved) */}
            {isSaleSaved && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={invoiceItems.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all shadow-md cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <Printer className="w-4 h-4 text-[#fef08a]" />
                <span>Print Invoice</span>
              </button>
            )}

            {/* 3. Save PDF Option (Displays once invoice is saved) */}
            {isSaleSaved && (
              <button
                type="button"
                onClick={handleSavePDF}
                disabled={invoiceItems.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-black transition-all shadow-xl shadow-yellow-900/20 cursor-pointer animate-in fade-in zoom-in-95 duration-150"
              >
                <Download className="w-4 h-4" />
                <span>Save PDF</span>
              </button>
            )}

            {/* 4. Clear button to create new invoice */}
            {isSaleSaved && (
              <button
                type="button"
                onClick={() => handleNewInvoice(false)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold transition-all shadow-md cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                title="Clear current invoice and start a new one"
              >
                <RotateCcw className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                <span>New Invoice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
