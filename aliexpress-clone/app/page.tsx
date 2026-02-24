import ModernHeader from './components/common/ModernHeader';
import HeroBanner from './components/common/HeroBanner';
import CategoryNav from './components/common/CategoryNav';
import BenefitsSection from './components/common/BenefitsSection';
import FlashSaleSection from './components/buyer/FlashSaleSection';
import PromotionalBanners from './components/buyer/PromotionalBanners';
import FeaturedProducts from './components/buyer/FeaturedProducts';
import Footer from './components/common/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <ModernHeader />
      
      <main>
        {/* Hero Banner Section - Carousel */}
        <section className="bg-white">
          <div className="container mx-auto px-4">
            <HeroBanner />
          </div>
        </section>

        {/* Category Navigation Bar */}
        <CategoryNav />

        {/* Benefits Section */}
        <BenefitsSection />

        {/* Flash Deals Section */}
        <FlashSaleSection />

        {/* Promotional Banners */}
        <section className="bg-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <PromotionalBanners />
          </div>
        </section>

        {/* Featured Products Section */}
        <FeaturedProducts />
      </main>

      <Footer />
    </div>
  );
}
