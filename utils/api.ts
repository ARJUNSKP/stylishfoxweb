import { Product, ProductColor, productsData } from '@/data/products';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

/**
 * Resolves any product image URL to a publicly accessible, renderable image URL.
 * Automatically translates Cloudflare R2 direct authenticated endpoints (which reject browser GET requests)
 * to the backend's public proxy endpoint: /api/v1/uploads/file/:folder/:fileName
 */
export function formatProductImageUrl(
  url?: string | null,
  fallback: string = 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  const trimmed = url.trim();

  // Local client-side preview blob or base64 data URLs
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Cloudflare R2 direct endpoint:
  // e.g. https://f06f6904431659b5d0b65af25ca48605.r2.cloudflarestorage.com/products/1792610613515-84506032.png
  // Needs to be routed through backend public streaming endpoint:
  // http://localhost:8001/api/v1/uploads/file/products/1792610613515-84506032.png
  if (trimmed.includes('.r2.cloudflarestorage.com/')) {
    const parts = trimmed.split('.r2.cloudflarestorage.com/');
    if (parts[1]) {
      let key = parts[1].replace(/^\/+/, '');
      if (key.startsWith('stylishfox-images/')) {
        key = key.replace(/^stylishfox-images\//, '');
      }
      return `${API_BASE_URL}/uploads/file/${key}`;
    }
  }

  // If already relative uploads route
  if (trimmed.startsWith('/api/v1/uploads/file/')) {
    const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    return `${origin}${trimmed}`;
  }
  if (trimmed.startsWith('/uploads/file/')) {
    return `${API_BASE_URL}${trimmed}`;
  }

  // If stored as pure key e.g. "products/1792610613515.png"
  if (
    trimmed.startsWith('products/') ||
    trimmed.startsWith('avatars/') ||
    trimmed.startsWith('categories/') ||
    trimmed.startsWith('banners/') ||
    trimmed.startsWith('carousels/')
  ) {
    return `${API_BASE_URL}/uploads/file/${trimmed}`;
  }

  return trimmed;
}

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

    if (v.color?.name) {
      const cName = v.color.name;
      const cHex = v.color.hexCode || '#0d0d0d';
      const rawVariantImages =
        Array.isArray(v.images) && v.images.length > 0
          ? v.images
          : Array.isArray(raw.images) && raw.images.length > 0
          ? raw.images
          : [
              'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
            ];

      const vImages = rawVariantImages.map((img: string) => formatProductImageUrl(img));

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
  }

  // Real configured colors; if no variant has a color assigned, colors will be empty
  let colors = Array.from(colorMap.values());

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
    images: Array.isArray(raw.images)
      ? raw.images.map((img: string) => formatProductImageUrl(img))
      : [],
    variants: variants.map((v: any) => ({
      ...v,
      images: Array.isArray(v.images)
        ? v.images.map((img: string) => formatProductImageUrl(img))
        : [],
    })),
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
 * Create a new product with variant (supports both FormData for file uploads and JSON)
 */
export async function createAdminProduct(
  token: string,
  data:
    | FormData
    | {
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
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: isFormData
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
      body: isFormData ? data : JSON.stringify(data),
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
 * Add a single variant to an existing product (supports both FormData for file uploads and JSON)
 */
export async function addAdminVariant(
  token: string,
  productId: string,
  variant:
    | FormData
    | {
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
    const isFormData = typeof FormData !== 'undefined' && variant instanceof FormData;
    const res = await fetch(`${API_BASE_URL}/products/${productId}/variants`, {
      method: 'POST',
      headers: isFormData
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
      body: isFormData ? variant : JSON.stringify(variant),
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
 * Update existing product variant details (supports both FormData for file uploads and JSON)
 */
export async function updateAdminVariant(
  token: string,
  variantId: string,
  data:
    | FormData
    | {
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
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const res = await fetch(`${API_BASE_URL}/products/variants/${variantId}`, {
      method: 'PUT',
      headers: isFormData
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
      body: isFormData ? data : JSON.stringify(data),
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

/**
 * Upload an image file directly to Cloudflare R2 via Backend API (multipart/form-data)
 * Enforces strict 5MB limit and image file type validation.
 * Returns the public R2 URL to be stored on PostgreSQL product_variants table.
 */
export async function uploadImageToR2(
  token: string,
  file: File,
  folder: string = 'products'
): Promise<{ ok: boolean; status: number; url?: string; key?: string; message?: string }> {
  const MAX_SIZE = 5 * 1024 * 1024; // 5 MB limit
  if (file.size > MAX_SIZE) {
    return {
      ok: false,
      status: 400,
      message: `File "${file.name}" exceeds the maximum 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select an image under 5 MB.`,
    };
  }

  if (file.type && !file.type.startsWith('image/')) {
    return {
      ok: false,
      status: 400,
      message: `File "${file.name}" is not a valid image format. Only image uploads are allowed.`,
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch(`${API_BASE_URL}/uploads/direct`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.success) {
      return {
        ok: false,
        status: res.status,
        message: json.message || 'Failed to upload image to Cloudflare R2',
      };
    }

    const item = Array.isArray(json.data) ? json.data[0] : json.data;
    const url = item?.url || '';
    const key = item?.key || '';

    return {
      ok: true,
      status: res.status,
      url,
      key,
      message: json.message || 'Image uploaded successfully to Cloudflare R2',
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error while uploading image to Cloudflare R2',
    };
  }
}

/**
 * Delete an image from a product and Cloudflare R2 (Admin only)
 */
export async function deleteAdminProductImage(
  token: string,
  productId: string,
  imageUrl: string
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/images`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageUrl }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'Image deleted successfully' : 'Failed to delete image'),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error deleting image',
    };
  }
}

/**
 * Delete an image from a specific variant and Cloudflare R2 (Admin only)
 */
export async function deleteAdminVariantImage(
  token: string,
  variantId: string,
  imageUrl: string
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/variants/${variantId}/images`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageUrl }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'Image deleted successfully' : 'Failed to delete image'),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error deleting variant image',
    };
  }
}

/**
 * Delete an entire variant and its assets from Cloudflare R2 (Admin only)
 */
export async function deleteAdminVariant(
  token: string,
  variantId: string
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/variants/${variantId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'Variant deleted successfully' : 'Failed to delete variant'),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error deleting variant',
    };
  }
}

/**
 * Delete an entire product, its variants, and all R2 assets (Admin only)
 */
export async function deleteAdminProduct(
  token: string,
  productId: string
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      clearApiCache();
    }
    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'Product deleted successfully' : 'Failed to delete product'),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error deleting product',
    };
  }
}

/**
 * Directly delete a file from Cloudflare R2 (Admin only)
 */
export async function deleteImageFromR2(
  token: string,
  keyOrUrl: string
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: keyOrUrl }),
    });
    const json = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'File purged from Cloudflare R2' : 'Failed to delete file from R2'),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error deleting file from R2',
    };
  }
}

export interface CarouselItem {
  id: string;
  title: string;
  description?: string | null;
  images: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all carousels (Admin or customer)
 */
export async function fetchCarousels(): Promise<CarouselItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/carousels`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.data) ? json.data : [];
  } catch {
    return [];
  }
}

let activeCarouselPromise: Promise<CarouselItem | null> | null = null;
let activeCarouselCached: { data: CarouselItem | null; timestamp: number } | null = null;
const ACTIVE_CAROUSEL_TTL = 30000; // 30 seconds cache

/**
 * Fetch the currently active carousel for customer Hero banner.
 * Uses request de-duplication and memory caching to prevent multiple concurrent calls.
 */
export async function fetchActiveCarousel(bypassCache = false): Promise<CarouselItem | null> {
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  if (!bypassCache && activeCarouselCached && (now - activeCarouselCached.timestamp < ACTIVE_CAROUSEL_TTL)) {
    return activeCarouselCached.data;
  }

  if (activeCarouselPromise) {
    return activeCarouselPromise;
  }

  activeCarouselPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/carousels/active`, {
        next: { revalidate: 10 },
      });
      const currentPerf = typeof performance !== 'undefined' ? performance.now() : 0;
      if (!res.ok) {
        activeCarouselCached = { data: null, timestamp: currentPerf };
        return null;
      }
      const json = await res.json();
      const result = json.data || null;
      activeCarouselCached = { data: result, timestamp: currentPerf };
      return result;
    } catch {
      return null;
    } finally {
      activeCarouselPromise = null;
    }
  })();

  return activeCarouselPromise;
}

/**
 * Create a new carousel with title, description, images array and/or files (Admin only)
 */
export async function createAdminCarousel(
  token: string,
  payload: {
    title: string;
    description?: string;
    isActive?: boolean;
    images?: string[];
    files?: File[];
  }
): Promise<{ ok: boolean; status: number; message?: string; data?: CarouselItem }> {
  try {
    const formData = new FormData();
    formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    formData.append('isActive', payload.isActive ? 'true' : 'false');

    if (payload.images && payload.images.length > 0) {
      for (const img of payload.images) {
        formData.append('images', img);
      }
    }

    if (payload.files && payload.files.length > 0) {
      for (const file of payload.files) {
        formData.append('files', file);
      }
    }

    const res = await fetch(`${API_BASE_URL}/carousels`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'Carousel saved successfully' : 'Failed to save carousel'),
      data: json.data,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error while creating carousel',
    };
  }
}

/**
 * Activate a carousel as the store banner (Admin only)
 */
export async function activateAdminCarousel(
  token: string,
  id: string
): Promise<{ ok: boolean; status: number; message?: string; data?: CarouselItem }> {
  try {
    const res = await fetch(`${API_BASE_URL}/carousels/${id}/activate`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'Carousel activated successfully' : 'Failed to activate carousel'),
      data: json.data,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error while activating carousel',
    };
  }
}

/**
 * Delete a carousel (Admin only)
 */
export async function deleteAdminCarousel(
  token: string,
  id: string
): Promise<{ ok: boolean; status: number; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/carousels/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'Carousel deleted successfully' : 'Failed to delete carousel'),
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error while deleting carousel',
    };
  }
}

export interface StoreSettingsData {
  whatsappNumber: string;
  freeShippingThreshold: number;
  shippingFee?: number;
  supportEmail?: string;
  [key: string]: any;
}

let cachedStoreSettings: StoreSettingsData | null = null;
let settingsFetchPromise: Promise<StoreSettingsData> | null = null;

/**
 * Fetch public store settings (WhatsApp number, free shipping threshold, etc.)
 * Uses in-memory caching and request deduplication to prevent repeated API calls.
 */
export async function fetchStoreSettings(forceRefresh = false): Promise<StoreSettingsData> {
  if (!forceRefresh && cachedStoreSettings) {
    return cachedStoreSettings;
  }
  if (!forceRefresh && settingsFetchPromise) {
    return settingsFetchPromise;
  }

  settingsFetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          cachedStoreSettings = json.data;
          return json.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch store settings:', err);
    } finally {
      settingsFetchPromise = null;
    }
    const fallback: StoreSettingsData = {
      whatsappNumber: '918086388058',
      freeShippingThreshold: 2000,
      shippingFee: 149,
    };
    cachedStoreSettings = fallback;
    return fallback;
  })();

  return settingsFetchPromise;
}

/**
 * Update store settings (no authentication token required)
 */
export async function updateAdminStoreSettings(
  data: Partial<StoreSettingsData>,
  token?: string
): Promise<{ ok: boolean; status: number; message?: string; data?: StoreSettingsData }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));

    if (res.ok && json.data) {
      cachedStoreSettings = {
        ...(cachedStoreSettings || {}),
        ...json.data,
      };
    }

    return {
      ok: res.ok,
      status: res.status,
      message: json.message || (res.ok ? 'Settings updated successfully' : 'Failed to update settings'),
      data: json.data,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 500,
      message: err.message || 'Network error while updating settings',
    };
  }
}
