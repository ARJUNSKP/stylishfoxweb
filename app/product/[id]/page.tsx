import React from 'react';
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
  params: Promise<PageParams> | PageParams;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
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
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id) : '';
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

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id ? decodeURIComponent(resolvedParams.id) : '';
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(product.id || id, 4);

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <TopBanner />
      <Header />
      <main className="flex-1">
        <ProductDetailClient product={product} initialRelatedProducts={relatedProducts} />
      </main>
      <Footer />
      <FloatingIcons />
    </div>
  );
}
