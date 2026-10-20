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
} from 'lucide-react';
import { Product } from '@/data/products';
import { fetchAdminUsers } from '@/utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface InvoiceLineItem {
  id: string;
  productId: string;
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
}

export default function InvoiceModal({
  isOpen,
  onClose,
  products = [],
  token = '',
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
  const [productName, setProductName] = useState('');
  const [productOriginalPrice, setProductOriginalPrice] = useState<number>(0);
  const [productSellingPrice, setProductSellingPrice] = useState<number>(0);
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [productSize, setProductSize] = useState<string>('');
  const [productColor, setProductColor] = useState<string>('');
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);

  // -------------------------------------------------------------
  // Invoice Items List & Logo
  // -------------------------------------------------------------
  const [invoiceItems, setInvoiceItems] = useState<InvoiceLineItem[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
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
          const img = new window.Image();
          img.onload = () => {
            try {
              const targetW = 500;
              const targetH = Math.round(targetW * (img.naturalHeight / img.naturalWidth));
              const canvas = document.createElement('canvas');
              canvas.width = targetW;
              canvas.height = targetH;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, targetW, targetH);
                if (isSubscribed) setLogoDataUrl(canvas.toDataURL('image/png'));
              } else if (isSubscribed) {
                setLogoDataUrl(rawDataUrl);
              }
            } catch {
              if (isSubscribed) setLogoDataUrl(rawDataUrl);
            }
          };
          img.onerror = () => {
            if (isSubscribed) setLogoDataUrl(rawDataUrl);
          };
          img.src = rawDataUrl;
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

  // Initialize Invoice defaults when opened
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setInvoiceDate(today);
      const randomId = Math.floor(100000 + Math.random() * 900000);
      setInvoiceNumber(`SF-INV-${randomId}`);
      loadUsers();
    }
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

  // When a product is selected from dropdown
  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    if (!productId) {
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

    // Resolve prices
    const orig = found.originalPrice || Math.round((found.price || 1299) * 1.4);
    const selling = found.sellingPrice || found.price || 1299;

    setProductOriginalPrice(orig);
    setProductSellingPrice(selling);
    setProductQuantity(1);

    // Sizes
    const sizes = Array.isArray(found.sizes) && found.sizes.length > 0 ? found.sizes : ['Standard'];
    setAvailableSizes(sizes);
    setProductSize(sizes[0] || 'Standard');

    // Colors
    const colors =
      Array.isArray(found.colors) && found.colors.length > 0
        ? found.colors.map((c) => c.name)
        : ['Standard'];
    setAvailableColors(colors);
    setProductColor(colors[0] || 'Standard');
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
      doc.rect(0, 0, pageWidth, 42, 'F');

      // Accent line
      doc.setFillColor(250, 204, 21); // yellow-400 (#facc15)
      doc.rect(0, 42, pageWidth, 2.5, 'F');

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

      // Title/Tagline, Email, and Website Domain URL placed at the bottom of the logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(226, 232, 240); // slate-200
      doc.text('MODERN STREETWEAR AESTHETIC', margin, 29);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text('support@stylefox.com  |  www.stylefox.com', margin, 35);

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
      let currentY = 50;
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
              background: #09090b;
              padding: 6px 14px;
              border-radius: 8px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .brand-logo-box img {
              height: 40px;
              width: auto;
              max-width: 140px;
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
              background: #0f172a;
              color: #ffffff;
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
                <img src="${logoDataUrl || '/logo.png'}" alt="StyleFox Logo" />
              </div>
              <div class="brand-meta">
                <div class="brand-tagline">MODERN STREETWEAR AESTHETIC</div>
                <div class="brand-contact">support@stylefox.com &bull; www.stylefox.com</div>
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
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
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
                Select customer, auto-fill address, add products, print, and save PDF with customer
                name.
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
              {/* User Select Dropdown */}
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Select User from System <span className="text-[#fef08a]">*</span>
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => handleSelectUser(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#fef08a] cursor-pointer"
                >
                  <option value="">-- Choose User (Auto-fills Address &amp; Info) --</option>
                  {usersList.map((u) => {
                    const addrCount = Array.isArray(u.address) ? u.address.length : u.address ? 1 : 0;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email || u.phoneNumber || 'User'} ({addrCount} addr)
                      </option>
                    );
                  })}
                </select>
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
              {/* Product Dropdown */}
              <div className="lg:col-span-4 sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Select Product <span className="text-[#fef08a]">*</span>
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#fef08a] cursor-pointer"
                >
                  <option value="">-- Choose Product from Catalog --</option>
                  {products.map((p) => {
                    const sp = p.sellingPrice || p.price || 1299;
                    const orig = p.originalPrice || Math.round(sp * 1.4);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{sp} / MRP ₹{orig})
                      </option>
                    );
                  })}
                </select>
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
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                    Invoice Number
                  </label>
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

            {/* Print Option */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={invoiceItems.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#fef08a]" />
              <span>Print Invoice</span>
            </button>

            {/* Save PDF Option (With User's Name as Filename) */}
            <button
              type="button"
              onClick={handleSavePDF}
              disabled={invoiceItems.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#fef08a] hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-black transition-all shadow-xl shadow-yellow-900/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Save PDF ({customerName.trim() ? customerName.trim() : 'User'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
