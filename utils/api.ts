import { Product, ProductColor, productsData } from '@/data/products';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Transforms backend API product format into the frontend Product interface
 */
export function transformBackendProduct(raw: any, index: number = 0): Product {
  const variants = Array.isArray(raw.variants) ? raw.variants : [];

  // Group colors from variants
  const colorMap = new Map<string, ProductColor>();
  const sizeSet = new Set<string>();

  for (const v of variants) {
    if (v.size?.code) sizeSet.add(v.size.code);
    else if (v.size?.name) sizeSet.add(v.size.name);

    const cName = v.color?.name || 'Standard';
    const cHex = v.color?.hexCode || '#0d0d0d';
    const vImages =
      Array.isArray(v.images) && v.images.length > 0
        ? v.images
        : Array.isArray(raw.images) && raw.images.length > 0
        ? raw.images
        : [
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
          ];

    if (!colorMap.has(cName)) {
      colorMap.set(cName, {
        name: cName,
        hex: cHex,
        images: vImages,
      });
    } else {
      // Merge unique images
      const existing = colorMap.get(cName)!;
      for (const img of vImages) {
        if (!existing.images.includes(img)) {
          existing.images.push(img);
        }
      }
    }
  }

  // Fallback colors if no variant colors
  let colors = Array.from(colorMap.values());
  if (colors.length === 0) {
    const rawImages =
      Array.isArray(raw.images) && raw.images.length > 0
        ? raw.images
        : [
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
          ];
    colors = [
      {
        name: 'Obsidian Black',
        hex: '#0d0d0d',
        images: rawImages,
      },
    ];
  }

  // Sizes from variants or default list
  const sizes =
    sizeSet.size > 0 ? Array.from(sizeSet) : ['S', 'M', 'L', 'XL', 'XXL'];

  // Calculate price (find lowest active variant price, or product price, or fallback)
  let price = 1299;
  if (variants.length > 0) {
    const validPrices = variants
      .map((v: any) => parseFloat(v.price))
      .filter((p: number) => !isNaN(p) && p > 0);
    if (validPrices.length > 0) {
      price = Math.min(...validPrices);
    }
  } else if (raw.price && !isNaN(parseFloat(raw.price))) {
    price = parseFloat(raw.price);
  }

  const originalPrice = raw.originalPrice
    ? parseFloat(raw.originalPrice)
    : Math.round(price * 1.4);

  // Calculate total stock across all variants
  let stock = 0;
  if (variants.length > 0) {
    stock = variants.reduce(
      (sum: number, v: any) =>
        sum + (typeof v.stock === 'number' ? v.stock : parseInt(v.stock, 10) || 0),
      0
    );
  } else if (typeof raw.stock === 'number') {
    stock = raw.stock;
  } else if (raw.stock !== undefined) {
    stock = parseInt(raw.stock, 10) || 0;
  } else {
    stock = 15;
  }

  const isOutOfStock = stock <= 0;

  return {
    id: raw.id || index + 1,
    slug: raw.slug,
    name: raw.name || 'StyleFox Apparel',
    tagline: raw.tagline || 'Modern Streetwear Aesthetic',
    price,
    originalPrice,
    isNew: raw.isNew ?? index < 4,
    rating: parseFloat(raw.rating || '4.8'),
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 120,
    description:
      raw.description ||
      'Engineered for structural drape and unmatched daily comfort.',
    features: Array.isArray(raw.features) ? raw.features : [],
    colors,
    sizes,
    images: Array.isArray(raw.images) ? raw.images : [],
    variants,
    categoryId: raw.categoryId || null,
    stock,
    isOutOfStock,
  };
}

/**
 * Fetch all products from Backend API with fallback to static mock data
 */
export async function fetchProducts(options?: {
  categoryId?: string;
  search?: string;
  limit?: number;
}): Promise<Product[]> {
  try {
    const query = new URLSearchParams();
    if (options?.categoryId) query.set('categoryId', options.categoryId);
    if (options?.search) query.set('search', options.search);
    query.set('limit', String(options?.limit || 50));

    const url = `${API_BASE_URL}/products?${query.toString()}`;
    const res = await fetch(url, {
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      console.warn(`[StyleFoxweb] Products API returned status ${res.status}`);
      return productsData;
    }

    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      return json.data.map((item: any, idx: number) =>
        transformBackendProduct(item, idx)
      );
    }

    return productsData;
  } catch (error) {
    console.warn('[StyleFoxweb] Could not connect to Backend API, using local productsData:', error);
    return productsData;
  }
}

/**
 * Fetch a single product by ID or Slug from Backend API with fallback
 */
export async function fetchProductById(idOrSlug: string | number): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${idOrSlug}`, {
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return transformBackendProduct(json.data);
      }
    }

    // Try slug endpoint if id endpoint was 404
    const slugRes = await fetch(`${API_BASE_URL}/products/slug/${idOrSlug}`, {
      next: { revalidate: 30 },
    });

    if (slugRes.ok) {
      const json = await slugRes.json();
      if (json.success && json.data) {
        return transformBackendProduct(json.data);
      }
    }
  } catch (err) {
    console.warn(`[StyleFoxweb] Error fetching product ${idOrSlug} from backend:`, err);
  }

  // Fallback to static mock data
  const exactMatch = productsData.find(
    (p) => String(p.id) === String(idOrSlug) || (p.slug && p.slug === String(idOrSlug))
  );
  if (exactMatch) return exactMatch;

  const numericId = typeof idOrSlug === 'number' ? idOrSlug : (/^\d+$/.test(String(idOrSlug)) ? parseInt(idOrSlug, 10) : NaN);
  if (!isNaN(numericId)) {
    const found = productsData.find((p) => p.id === numericId);
    if (found) return found;
  }

  const bySlugOrName = productsData.find(
    (p) =>
      p.name.toLowerCase().replace(/\s+/g, '-') ===
      String(idOrSlug).toLowerCase()
  );

  return bySlugOrName || null;
}

/**
 * Fetch related products for a product from Backend API with fallback
 */
export async function fetchRelatedProducts(
  idOrSlug: string | number,
  limit: number = 4
): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${idOrSlug}/related?limit=${limit}`, {
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((item: any, idx: number) =>
          transformBackendProduct(item, idx)
        );
      }
    }
  } catch (err) {
    console.warn(`[StyleFoxweb] Error fetching related products for ${idOrSlug}:`, err);
  }

  // Fallback to static products excluding current product
  return productsData
    .filter((p) => String(p.id) !== String(idOrSlug))
    .slice(0, limit);
}

/**
 * Log in user with email & password via Backend API
 */
export async function loginUser(input: { email: string; password: string }) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err.message || 'Network connection failed' },
    };
  }
}

/**
 * Register a new user via Backend API
 */
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err.message || 'Network connection failed' },
    };
  }
}

/**
 * Fetch authenticated user profile & addresses from Backend API
 */
export async function fetchUserProfile(token: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err.message || 'Network connection failed' },
    };
  }
}

/**
 * Update user profile details (name, phone, whatsapp, addresses) in user table via Backend API
 */
export async function updateUserProfile(
  token: string,
  payload: {
    name?: string;
    phoneNumber?: string | null;
    whatsappNumber?: string | null;
    avatarUrl?: string | null;
    address?: any[];
  }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err.message || 'Network connection failed' },
    };
  }
}

/**
 * Add a new address directly to the user's account in user table via Backend API
 */
export async function addUserAddress(
  token: string,
  payload: { address: any; ActiveAddress?: boolean }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err.message || 'Network connection failed' },
    };
  }
}

/**
 * Set active/default address for the user via Backend API
 */
export async function setActiveUserAddress(token: string, index: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/address/active`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ index }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err.message || 'Network connection failed' },
    };
  }
}

/**
 * Delete an address by index from the user table via Backend API
 */
export async function deleteUserAddress(token: string, index: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/address/${index}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      data: { success: false, message: err.message || 'Network connection failed' },
    };
  }
}
