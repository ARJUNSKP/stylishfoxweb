import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductCatalog from "@/components/ProductCatalog";
import FloatingIcons from "@/components/FloatingIcons";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";
import { fetchProducts } from "@/utils/api";

export default async function Home() {
  const products = await fetchProducts();

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Loader />
      <TopBanner />
      <Header />
      <Hero />
      <ProductCatalog initialProducts={products} />
      <Footer />
      <FloatingIcons />
    </div>
  );
}
