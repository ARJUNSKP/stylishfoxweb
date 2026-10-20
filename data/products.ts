export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface ProductCategory {
  categoryId?: string;
  categoryName?: string;
  id?: string;
  name?: string;
  slug?: string;
}

export interface Product {
  id: number | string;
  slug?: string;
  name: string;
  tagline: string;
  price: number;
  sellingPrice?: number;
  originalPrice: number;
  isNew?: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  features: string[];
  colors: ProductColor[];
  sizes: string[];
  images?: string[];
  variants?: any[];
  categoryId?: string | ProductCategory | any | null;
  category?: ProductCategory | null;
  categoryName?: string | null;
  stock?: number;
  isOutOfStock?: boolean;
}

export const productsData: Product[] = [
  // {
  //   id: 1,
  //   name: 'ESSENTIAL BLACK TEE',
  //   tagline: 'Pure Combed Heavyweight Cotton Regular Fit',
  //   price: 1299,
  //   originalPrice: 1999,
  //   isNew: true,
  //   rating: 4.8,
  //   reviewCount: 142,
  //   description: 'Crafted from 240 GSM ultra-combed matte cotton, the Essential Black Tee delivers an effortless drape with a structured silhouette. Designed for everyday luxury and engineered to hold its deep obsidian tint through countless wash cycles.',
  //   features: [
  //     '100% Ultra-combed compact cotton',
  //     '240 GSM heavy jersey fabric',
  //     'Reinforced double-ribbed crew neckline',
  //     'Pre-shrunk to prevent dimensional distortion',
  //     'Silicon-washed for buttery hand-feel'
  //   ],
  //   sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  //   colors: [
  //     {
  //       name: 'Obsidian Black',
  //       hex: '#0d0d0d',
  //       images: [
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     },
  //     {
  //       name: 'Chalk White',
  //       hex: '#f5f5f5',
  //       images: [
  //         'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1622445268047-920f01be61c1?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     },
  //     {
  //       name: 'Desert Khaki',
  //       hex: '#c2b280',
  //       images: [
  //         'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     }
  //   ]
  // },
  // {
  //   id: 2,
  //   name: 'PREMIUM OVERSIZED BLACK T-SHIRT',
  //   tagline: 'Signature Boxy Cut Drop-Shoulder Streetwear',
  //   price: 1599,
  //   originalPrice: 2299,
  //   isNew: true,
  //   rating: 4.9,
  //   reviewCount: 218,
  //   description: 'An iconic urban wardrobe staple engineered with exaggerated drop shoulders and wide boxy sleeves. Balanced proportions grant structured fullness without feeling bulky.',
  //   features: [
  //     '280 GSM premium terry cotton blend',
  //     'Subtle relaxed drop shoulders',
  //     'Wide seamless collar design',
  //     'Reinforced seams for enhanced longevity',
  //     'Breathable double knit structure'
  //   ],
  //   sizes: ['S', 'M', 'L', 'XL'],
  //   colors: [
  //     {
  //       name: 'Charcoal Black',
  //       hex: '#171717',
  //       images: [
  //         'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     },
  //     {
  //       name: 'Muted Taupe',
  //       hex: '#8d7b68',
  //       images: [
  //         'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1622445268047-920f01be61c1?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     },
  //     {
  //       name: 'Cloud White',
  //       hex: '#fafafa',
  //       images: [
  //         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     }
  //   ]
  // },
  // {
  //   id: 3,
  //   name: 'VINTAGE WASH BLACK TEE',
  //   tagline: 'Acid Mineral Washed Distressed Raw Aesthetic',
  //   price: 1399,
  //   originalPrice: 1899,
  //   isNew: false,
  //   rating: 4.7,
  //   reviewCount: 95,
  //   description: 'Each piece undergoes a bespoke mineral stone-wash treatment, producing an authentic retro fade and uniquely variegated surface texture. Soft-to-touch with broken-in comfort from day one.',
  //   features: [
  //     'Individually hand-treated acid wash finish',
  //     '220 GSM heavyweight combed yarn',
  //     'Raw vintage-look collar trim',
  //     'Breathable and moisture-wicking weave',
  //     'Fade-resistant post-wash pigment retainment'
  //   ],
  //   sizes: ['M', 'L', 'XL', 'XXL'],
  //   colors: [
  //     {
  //       name: 'Washed Charcoal',
  //       hex: '#2b2b2b',
  //       images: [
  //         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     },
  //     {
  //       name: 'Faded Olive',
  //       hex: '#4a5340',
  //       images: [
  //         'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     }
  //   ]
  // },
  // {
  //   id: 4,
  //   name: 'HEAVYWEIGHT BLACK SHIRT',
  //   tagline: 'Structured 300 GSM Architectural Cut',
  //   price: 1699,
  //   originalPrice: 2499,
  //   isNew: false,
  //   rating: 4.9,
  //   reviewCount: 310,
  //   description: 'Constructed from substantial 300 GSM dense jersey. Retains sharp lines and a crisp profile even during high activity. Styled for minimalists who demand uncompromising quality.',
  //   features: [
  //     'Ultra dense 300 GSM compact combed cotton',
  //     'Tailored architectural boxy drape',
  //     'Double stitched hems & flatlock seams',
  //     'Thick 1.25" rib knit collar',
  //     'Designed in Tokyo, crafted for eternity'
  //   ],
  //   sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  //   colors: [
  //     {
  //       name: 'Midnight Black',
  //       hex: '#0a0a0a',
  //       images: [
  //         'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     },
  //     {
  //       name: 'Storm Grey',
  //       hex: '#3f3f46',
  //       images: [
  //         'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=1000',
  //         'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000'
  //       ]
  //     }
  //   ]
  // }
];

// Generate products array matching ProductGrid indices (40 products)
export const getAllProducts = (): (Product & { gridId: number })[] => {
  return Array.from({ length: 40 }).map((_, i) => {
    const base = productsData[i % productsData.length];
    return {
      ...base,
      id: i + 1,
      gridId: i + 1,
      isNew: i < 8 ? (i % 2 === 0) : false
    };
  });
};

export const getProductById = (id: number | string): (Product & { gridId?: number }) | null => {
  const all = getAllProducts();
  return (
    all.find((p) => String(p.id) === String(id) || (p.slug && p.slug === String(id))) ||
    productsData.find((p) => String(p.id) === String(id)) ||
    null
  );
};
