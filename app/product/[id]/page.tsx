import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchProductById, fetchProducts, fetchRelatedProducts } from '@/utils/api';
import ProductDetailClient from '@/components/ProductDetailClient';
import TopBanner from '@/components/TopBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingIcons from '@/components/FloatingIcons';
import type { Metadata } from 'next';

type PageParams = {
  id: string;
};

type Props = {
  params: Promise<PageParams>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateStaticParams() {
  const products = await fetchProducts();
  const paramsList: { id: string }[] = [];
  for (const p of products) {
    paramsList.push({ id: p.id.toString() });
    if (p.slug && p.slug !== p.id.toString()) {
      paramsList.push({ id: p.slug });
    }
  }
  return paramsList;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    return {
      title: 'Product Not Found | Stylish Fox',
    };
  }

  return {
    title: `${product.name} | Stylish Fox`,
    description: product.description,
  };
}

// Dynamic content component wrapped inside Suspense for instant shell streaming
async function ProductDetailContent({
  paramsPromise,
}: {
  paramsPromise: Promise<PageParams>;
}) {
  const { id } = await paramsPromise;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(product.id || id, 4);

  return (
    <ProductDetailClient
      product={product}
      initialRelatedProducts={relatedProducts}
    />
  );
}

// Skeleton displayed while streaming dynamic product data
function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-4 w-32 bg-zinc-800 rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 aspect-[3/4] bg-zinc-900 rounded-xl border border-zinc-800/80" />
        <div className="lg:col-span-5 space-y-5">
          <div className="h-8 w-3/4 bg-zinc-800 rounded" />
          <div className="h-6 w-1/3 bg-zinc-800 rounded" />
          <div className="h-10 w-1/2 bg-zinc-900 rounded" />
          <div className="h-24 w-full bg-zinc-900 rounded" />
          <div className="h-14 w-full bg-zinc-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailPage({ params }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <TopBanner />
      <Header />
      <main className="flex-1">
        <Suspense fallback={<ProductDetailSkeleton />}>
          <ProductDetailContent paramsPromise={params} />
        </Suspense>
      </main>
      <Footer />
      <FloatingIcons />
    </div>
  );
}
