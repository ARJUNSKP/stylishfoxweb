import { Product, ProductColor, productsData } from '@/data/products';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

/**
 * Transforms backend API product format into the frontend Product interface
 */
export function transformBackendProduct(
  raw: any,
  index: number = 0,
  options?: { onlyPublished?: boolean }
): Product {
  const onlyPublished = options?.onlyPublished ?? true;
  const rawVariants = Array.isArray(raw.variants) ? raw.variants : [];

  // On client side, only consider published variants (isPublished !== false)
  const variants = onlyPublished
    ? rawVariants.filter((v: any) => v.isPublished !== false)
    : rawVariants;

  // Group colors from active variants
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

  // Sizes from active variants or default list
  const sizes =
    sizeSet.size > 0 ? Array.from(sizeSet) : ['S', 'M', 'L', 'XL', 'XXL'];

  // Calculate price (find lowest active variant price, or product price, or fallback)
  let price = 1299;
  let sellingPrice: number | undefined = undefined;
  if (variants.length > 0) {
    const validPrices = variants
      .map((v: any) => parseFloat(v.price))
      .filter((p: number) => !isNaN(p) && p > 0);
    if (validPrices.length > 0) {
      price = Math.min(...validPrices);
    }

    const validSellingPrices = variants
      .map((v: any) => parseFloat(v.sellingPrice ?? v.selling_price))
      .filter((p: number) => !isNaN(p) && p > 0);
    if (validSellingPrices.length > 0) {
      sellingPrice = Math.min(...validSellingPrices);
    }
  } else if (raw.price && !isNaN(parseFloat(raw.price))) {
    price = parseFloat(raw.price);
  }

  if (sellingPrice === undefined && (raw.sellingPrice !== undefined || raw.selling_price !== undefined)) {
    const sp = parseFloat(raw.sellingPrice ?? raw.selling_price);
    if (!isNaN(sp) && sp > 0) {
      sellingPrice = sp;
    }
  }

  const originalPrice = raw.originalPrice
    ? parseFloat(raw.originalPrice)
    : Math.round(price * 1.4);

  // Calculate total stock across active variants
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

  const categoryObj =
    typeof raw.categoryId === 'object' && raw.categoryId !== null
      ? raw.categoryId
      : typeof raw.category === 'object' && raw.category !== null
      ? raw.category
      : null;

  const categoryName =
    categoryObj?.categoryName ||
    categoryObj?.name ||
    (typeof raw.categoryId === 'string' ? raw.categoryId : null);

  return {
    id: raw.id || index + 1,
    slug: raw.slug,
    name: raw.name || 'StyleFox Apparel',
    tagline: raw.tagline || 'Modern Streetwear Aesthetic',
    price,
    sellingPrice,
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
    category: categoryObj,
    categoryName,
    stock,
    isOutOfStock,
  };
}

/**
 * In-flight promise cache to deduplicate concurrent requests for the same URL
 */
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Short in-memory cache to prevent redundant re-fetching of identical resources
 */
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

/**
 * Clears in-memory API cache and in-flight requests so subsequent calls fetch fresh data
 */
export function clearApiCache() {
  apiCache.clear();
  inFlightRequests.clear();
}

/**
 * Fetch all products from Backend API with fallback to static mock data.
 * When called on the client side (default), only products with published variants are returned.
 */
export async function fetchProducts(options?: {
  categoryId?: string;
  search?: string;
  limit?: number;
  includeUnpublished?: boolean;
  bypassCache?: boolean;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  if (options?.categoryId) query.set('categoryId', options.categoryId);
  if (options?.search) query.set('search', options.search);
  query.set('limit', String(options?.limit || 50));
  if (!options?.includeUnpublished) {
    query.set('publishedOnly', 'true');
  }

  const url = `${API_BASE_URL}/products?${query.toString()}`;

  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    if (options?.bypassCache) {
      apiCache.delete(url);
      inFlightRequests.delete(url);
    } else {
      // 1. Check in-memory cache to avoid duplicate network roundtrips on client
      const cached = apiCache.get(url);
      if (cached && performance.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }

      // 2. Return active in-flight request if already fetching the exact same URL
      if (inFlightRequests.has(url)) {
        return inFlightRequests.get(url)!;
      }
    }
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        cache: options?.bypassCache ? 'no-store' : undefined,
        next: options?.bypassCache ? { revalidate: 0 } : { revalidate: 30 },
      });

      if (!res.ok) {
        console.warn(`[StyleFoxweb] Products API returned status ${res.status}`);
        return productsData;
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const onlyPublished = !options?.includeUnpublished;
        const transformed = json.data
          .map((item: any, idx: number) =>
            transformBackendProduct(item, idx, { onlyPublished })
          )
          .filter((p: Product) => {
            if (!onlyPublished) return true;
            // On client side, filter out products that have no published variants
            return p.variants && p.variants.length > 0;
          });

        if (isBrowser) {
          apiCache.set(url, { data: transformed, timestamp: performance.now() });
        }
        return transformed;
      }

      return productsData;
    } catch (error) {
      console.warn('[StyleFoxweb] Could not connect to Backend API, using local productsData:', error);
      return productsData;
    } finally {
      if (isBrowser) {
        inFlightRequests.delete(url);
      }
    }
  })();

  if (isBrowser) {
    inFlightRequests.set(url, fetchPromise);
  }
  return fetchPromise;
}

/**
 * Fetch a single product by ID or Slug from Backend API with fallback
 */
export async function fetchProductById(
  idOrSlug: string | number,
  options?: { includeUnpublished?: boolean }
): Promise<Product | null> {
  const onlyPublished = !options?.includeUnpublished;
  const publishedParam = onlyPublished ? '?publishedOnly=true' : '';

  try {
    const res = await fetch(`${API_BASE_URL}/products/${idOrSlug}${publishedParam}`, {
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const prod = transformBackendProduct(json.data, 0, { onlyPublished });
        if (onlyPublished && prod.variants && prod.variants.length === 0) {
          return null;
        }
        return prod;
      }
    }

    // Try slug endpoint if id endpoint was 404
    const slugRes = await fetch(`${API_BASE_URL}/products/slug/${idOrSlug}${publishedParam}`, {
      next: { revalidate: 30 },
    });

    if (slugRes.ok) {
      const json = await slugRes.json();
      if (json.success && json.data) {
        const prod = transformBackendProduct(json.data, 0, { onlyPublished });
        if (onlyPublished && prod.variants && prod.variants.length === 0) {
          return null;
        }
        return prod;
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
    const res = await fetch(`${API_BASE_URL}/products/${idOrSlug}/related?limit=${limit}&publishedOnly=true`, {
      next: { revalidate: 30 },
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data
          .map((item: any, idx: number) =>
            transformBackendProduct(item, idx, { onlyPublished: true })
          )
          .filter((p: Product) => p.variants && p.variants.length > 0);
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
 * In-flight promise cache to deduplicate concurrent requests for user profile
 */
const userProfileInFlight = new Map<string, Promise<any>>();

/**
 * In-memory cache for user profile to prevent redundant roundtrips
 */
const userProfileCache = new Map<string, { data: any; timestamp: number }>();
const USER_CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

export function cacheUserProfile(token: string, userData: any) {
  if (!token || !userData) return;
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  userProfileCache.set(token, {
    data: { ok: true, status: 200, data: { success: true, data: userData } },
    timestamp: now,
  });
}

export function invalidateUserProfileCache(token?: string) {
  if (token) {
    userProfileCache.delete(token);
    userProfileInFlight.delete(token);
  } else {
    userProfileCache.clear();
    userProfileInFlight.clear();
  }
}

/**
 * Fetch authenticated user profile & addresses from Backend API
 */
export async function fetchUserProfile(token: string, forceFresh: boolean = false) {
  if (!token) {
    return { ok: false, status: 401, data: { success: false, message: 'No auth token provided' } };
  }

  const now = typeof performance !== 'undefined' ? performance.now() : 0;

  if (!forceFresh) {
    // 1. Check in-memory cache to prevent redundant backend roundtrips
    const cached = userProfileCache.get(token);
    if (cached && now - cached.timestamp < USER_CACHE_TTL_MS) {
      return cached.data;
    }

    // 2. Return active in-flight request if already fetching for this token
    if (userProfileInFlight.has(token)) {
      return userProfileInFlight.get(token)!;
    }
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      const result = { ok: res.ok, status: res.status, data };
      if (res.ok && data?.success) {
        const setNow = typeof performance !== 'undefined' ? performance.now() : 0;
        userProfileCache.set(token, { data: result, timestamp: setNow });
      }
      return result;
    } catch (err: any) {
      return {
        ok: false,
        status: 500,
        data: { success: false, message: err.message || 'Network connection failed' },
      };
    } finally {
      userProfileInFlight.delete(token);
    }
  })();

  userProfileInFlight.set(token, fetchPromise);
  return fetchPromise;
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
    if (res.ok) {
      invalidateUserProfileCache(token);
    }
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
    if (res.ok) {
      invalidateUserProfileCache(token);
    }
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
    if (res.ok) {
      invalidateUserProfileCache(token);
    }
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
    if (res.ok) {
      invalidateUserProfileCache(token);
    }
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
 * Fetch all categories from backend
 */
export async function fetchAdminCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Create a new category
 */
export async function createAdminCategory(
  token: string,
  data: { name: string; slug: string; description?: string }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Fetch all colors from backend
 */
export async function fetchAdminColors() {
  try {
    const res = await fetch(`${API_BASE_URL}/colors`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Create a new color
 */
export async function createAdminColor(
  token: string,
  data: { name: string; hexCode: string }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/colors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Fetch all sizes from backend
 */
export async function fetchAdminSizes() {
  try {
    const res = await fetch(`${API_BASE_URL}/sizes`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Create a new size
 */
export async function createAdminSize(
  token: string,
  data: { name: string; code: string; sortOrder?: number }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/sizes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Create a new product with variant
 */
export async function createAdminProduct(
  token: string,
  data: {
    name: string;
    slug?: string;
    tagline?: string;
    description?: string;
    features?: string[];
    categoryId?: string;
    price?: number | string;
    sellingPrice?: number | string;
    stock?: number;
    sku?: string;
    images?: string[];
    colorId?: string;
    sizeId?: string;
    variants?: Array<{
      price?: number | string;
      sellingPrice?: number | string;
      stock?: number;
      sku?: string;
      colorId?: string;
      sizeId?: string;
      images?: string[];
    }>;
  }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Add a single variant to an existing product
 */
export async function addAdminVariant(
  token: string,
  productId: string,
  variant: {
    price?: number | string;
    sellingPrice?: number | string;
    stock?: number;
    colorId?: string;
    sizeId?: string;
    images?: string[];
    sku?: string;
  }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/variants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(variant),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Update existing product details
 */
export async function updateAdminProduct(
  token: string,
  productId: string,
  data: {
    name?: string;
    tagline?: string;
    description?: string;
    categoryId?: string;
    features?: string[];
  }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Update existing product variant details (price, sellingPrice, stock, colorId, sizeId, images, isPublished)
 */
export async function updateAdminVariant(
  token: string,
  variantId: string,
  data: {
    price?: number | string;
    sellingPrice?: number | string;
    stock?: number;
    colorId?: string | null;
    sizeId?: string | null;
    images?: string[];
    sku?: string;
    isPublished?: boolean;
    published?: boolean;
  }
) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/variants/${variantId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Toggle or set variant published / archive status
 */
export async function setAdminVariantPublish(
  token: string,
  variantId: string,
  isPublished: boolean
) {
  try {
    const res = await fetch(`${API_BASE_URL}/products/variants/${variantId}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isPublished }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Delete a size by id
 */
export async function deleteAdminSize(token: string, id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/sizes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Delete a color by id
 */
export async function deleteAdminColor(token: string, id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/colors/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Delete a category by id (fails if assigned to any products)
 */
export async function deleteAdminCategory(token: string, id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data: json };
  } catch (err: any) {
    return { ok: false, status: 500, data: { message: err.message || 'Network error' } };
  }
}

/**
 * Fetch all users (Admin only)
 */
export async function fetchAdminUsers(token: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/users/admin/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch {
    return [];
  }
}



