import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryNav from "@/components/CategoryNav";
import FilterBar from "@/components/FilterBar";
import ProductGrid from "@/components/ProductGrid";
import FloatingIcons from "@/components/FloatingIcons";
import Loader from "@/components/Loader";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Loader />
      <TopBanner />
      <Header />
      <Hero />
      {/* <CategoryNav /> */}
      <FilterBar />
      <ProductGrid />
      <Footer />
      <FloatingIcons />
    </div>
  );
}
