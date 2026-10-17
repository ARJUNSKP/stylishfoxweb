import React from 'react';
import { notFound } from 'next/navigation';
import { fetchProductById, fetchProducts, fetchRelatedProducts } from '@/utils/api';
import ProductDetailClient from '@/components/ProductDetailClient';
import TopBanner from '@/components/TopBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingIcons from '@/components/FloatingIcons';


type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const products = await fetchProducts();
  return products.map((p) => ({
    id: p.id.toString(),
  }));
}

export async function generateMetadata({ params }: Props) {
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

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(id, 4);

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
