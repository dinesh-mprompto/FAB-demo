import { useState, useEffect } from 'react';
import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import HelpChoosePopup from './components/HelpChoosePopup';
import AiPreferencePopup from './components/AiPreferencePopup';
import ConversationFAB from './components/ConversationFAB';
import { products, Product } from './data';
import { useConversation } from './context/ConversationContext';
import { analyzeIntent, IntentResult } from './utils/intentAnalyzer';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [hasShownHelpPopup, setHasShownHelpPopup] = useState(false);
  const [showAiPopup, setShowAiPopup] = useState(false);
  const [isAiPopupMinimized, setIsAiPopupMinimized] = useState(false);
  const [intentResult, setIntentResult] = useState<IntentResult | null>(null);
  const [luckyProduct, setLuckyProduct] = useState<Product | null>(null);
  const { startConversation, addInteraction, endConversation } = useConversation();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      startConversation(query, 'regular_search');
      endConversation();
    }
    setSearchQuery(query);
    setIsSearching(!!query);
    // Reset popup state on new search
    setShowHelpPopup(false);
    setHasShownHelpPopup(false);
  };

  const handleAiSearch = (query: string) => {
    if (!query.trim()) return;

    // Analyze the intent of the query
    const result = analyzeIntent(query);

    startConversation(query, 'ai_search');
    setSearchQuery(query);
    setIsSearching(true);
    setIntentResult(result);
    setShowAiPopup(true);
  };

  const handleThumbsUp = () => {
    startConversation(searchQuery, 'ai_search');
    addInteraction('help_accepted', 'Help Accepted', 'User wants AI assistance');
    setShowHelpPopup(false);
    setShowAiPopup(true);
  };

  const handleAiPopupClose = () => {
    endConversation();
    setShowAiPopup(false);
    setIsAiPopupMinimized(false);
    setLuckyProduct(null);
  };

  const handleAiPopupMinimize = () => {
    setIsAiPopupMinimized(true);
  };

  const handleRestorePopup = () => {
    setIsAiPopupMinimized(false);
  };

  const handleLuckyPick = (product: Product) => {
    setLuckyProduct(product);
    setSearchQuery('I\'m Feeling Lucky');
    setIntentResult({
      isComplete: true,
      matchedProducts: [product],
      reasoning: 'A surprise pick just for you — based on your browsing and past interests.',
    });
    startConversation('I\'m Feeling Lucky', 'ai_search');
    addInteraction('recommendation_shown', 'Lucky Pick', product.title);
    endConversation();
    setShowAiPopup(true);
  };

  const handleProductClick = (title: string) => {
    const product = products.find(p => p.title === title);
    if (!product) return;

    setSearchQuery(title);
    setIntentResult({
      isComplete: true,
      matchedProducts: [product],
      reasoning: 'Revisiting from your history',
    });
    startConversation(title, 'ai_search');
    setIsAiPopupMinimized(false);
    setShowAiPopup(true);
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isComfortGripSearch = searchQuery.toLowerCase().includes('comfort grip pen');

  useEffect(() => {
    const handleScroll = () => {
      if (!isComfortGripSearch || hasShownHelpPopup) return;

      const scrollPercentage = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

      if (scrollPercentage > 0.5) {
        setShowHelpPopup(true);
        setHasShownHelpPopup(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isComfortGripSearch, hasShownHelpPopup]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <AnnouncementBar />
      <Header onSearch={handleSearch} onAiSearch={handleAiSearch} />

      <main>
        {isSearching ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h1 className="text-3xl font-bold text-[#111111] mb-8">
              Search Results for "{searchQuery}"
            </h1>

            {isComfortGripSearch ? (
              <div>
                <p className="text-gray-600 mb-8">50 pens found</p>
                {/* Mocking a larger grid for demo purposes since we don't actually have 50 pens */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
                  {/* Show existing products repeated to simulate more results, or just the existing ones if preferred. 
                      The prompt specifically asked for "50 pens found" text. 
                      I'll show the existing filtered products (which might be empty) 
                      PLUS some placeholders if needed, or just the text as requested. 
                      Let's just show the text and the available products that might match, 
                      or if none match, maybe show all products as a fallback "you might like".
                      
                      Actually, "comfort grip pen" likely won't match anything in my small dataset.
                      So I should probably show some products to make it look like a real result page.
                  */}
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                  {products.map((product) => (
                    <ProductCard key={`${product.id}-duplicate`} product={{ ...product, id: product.id + 10000 }} />
                  ))}
                  {products.map((product) => (
                    <ProductCard key={`${product.id}-duplicate-2`} product={{ ...product, id: product.id + 20000 }} />
                  ))}
                  {products.map((product) => (
                    <ProductCard key={`${product.id}-duplicate-3`} product={{ ...product, id: product.id + 30000 }} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-8">{filteredProducts.length} results found</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No products found. Try a different search term.</p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {/* Hero / Collection Header */}
            <div className="bg-[#f5f5f5] py-16 sm:py-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-[#111111] sm:text-5xl mb-4">
                  NASA Merchandise
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-gray-600">
                  Explore our unique collection of space-themed writing instruments.
                  From Jupiter to Pluto, hold the universe in your hand.
                </p>
              </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {showHelpPopup && <HelpChoosePopup onClose={() => setShowHelpPopup(false)} onThumbsUp={handleThumbsUp} />}
      {showAiPopup && !isAiPopupMinimized && <AiPreferencePopup onClose={handleAiPopupClose} onMinimize={handleAiPopupMinimize} searchQuery={searchQuery} intent={intentResult} />}

      <ConversationFAB
        onLuckyPick={handleLuckyPick}
        isPopupMinimized={showAiPopup && isAiPopupMinimized}
        onRestorePopup={handleRestorePopup}
        onProductClick={handleProductClick}
        hideOnMobile={showAiPopup && !isAiPopupMinimized}
      />

      {/* Footer */}
      <footer className="bg-[#111111] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">About Submarine</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Submarine Pens brings you premium writing instruments inspired by the cosmos.
              Crafted for those who dream beyond the stars.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Search</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border border-white/20 rounded px-4 py-2 text-sm w-full focus:outline-none focus:border-white"
              />
              <button className="bg-white text-black px-4 py-2 text-sm font-medium rounded hover:bg-gray-200 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/10 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Submarine Pens. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
