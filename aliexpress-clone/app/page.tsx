import Header from './components/common/Header';
import HeroBanner from './components/common/HeroBanner';
import CategoryNav from './components/common/CategoryNav';
import ProductGrid from './components/common/ProductGrid';
import Footer from './components/common/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Banner Section */}
        <section className="container mx-auto px-4 py-6">
          <HeroBanner />
        </section>

        {/* Category Navigation */}
        <CategoryNav />

        {/* Flash Deals Section */}
        <section className="bg-gradient-to-r from-red-50 to-orange-50 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                ⚡ Flash Deals
              </h2>
              <div className="flex items-center gap-2 text-orange-600 font-medium">
                <span>Ends in:</span>
                <span className="bg-orange-600 text-white px-3 py-1 rounded">
                  12:34:56
                </span>
              </div>
            </div>
            <ProductGrid
              title=""
              columns={4}
            />
          </div>
        </section>

        {/* Popular Products */}
        <ProductGrid title="Popular Products" />

        {/* New Arrivals */}
        <section className="bg-white py-8">
          <ProductGrid title="New Arrivals" columns={5} />
        </section>

        {/* Trending Now */}
        <section className="bg-gray-50 py-8">
          <ProductGrid title="Trending Now" columns={6} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
