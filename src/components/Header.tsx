import React, { useState } from 'react';
import { Search, ShoppingBag, User, Menu, Sparkles, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onAiSearch?: (query: string) => void;
}

export default function Header({ onSearch, onAiSearch }: HeaderProps) {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleAiSearch = () => {
    const query = searchQuery.trim().toLowerCase();
    if (onAiSearch) {
      onAiSearch(searchQuery);
    }
    setIsMobileSearchOpen(false);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
    setIsMobileSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Mobile Menu */}
          <div className="flex items-center lg:hidden">
            <button className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
              <Menu size={24} />
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center justify-center flex-1 lg:flex-none lg:justify-start">
            <a href="/" className="flex items-center gap-2">
              <img
                src="https://www.submarinepens.com/cdn/shop/files/submarine_logo_6.png?v=1765368251&width=330"
                alt="Submarine Pens"
                className="h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            <a href="#" className="text-sm font-medium text-gray-700 hover:text-[#233267]">Home</a>
            <a href="#" className="text-sm font-medium text-gray-700 hover:text-[#233267]">Collections</a>
            <a href="#" className="text-sm font-medium text-gray-700 hover:text-[#233267]">New Arrivals</a>
            <a href="#" className="text-sm font-medium text-gray-700 hover:text-[#233267]">About Us</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-1.5 transition-all duration-300 border border-transparent focus-within:border-[#233267] focus-within:bg-white focus-within:shadow-md">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or ask AI..."
                className="bg-transparent border-none outline-none text-sm ml-2 w-40 lg:w-60 placeholder:text-gray-400 text-gray-800"
              />
              <button
                onClick={handleAiSearch}
                className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all duration-300 cursor-pointer bg-gradient-to-r from-[#233267] to-[#435db5] text-white shadow-sm hover:opacity-90"
              >
                <Sparkles size={10} />
                AI
              </button>
              <button
                onClick={handleSearch}
                className="ml-2 text-gray-400 hover:text-[#233267] transition-colors"
              >
                <Search size={16} />
              </button>
            </div>

            <button
              className="p-2 text-gray-600 hover:text-[#233267] transition-colors md:hidden"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search size={20} />
            </button>
            <button className="p-2 text-gray-600 hover:text-[#233267] transition-colors hidden sm:block">
              <User size={20} />
            </button>
            <button className="p-2 text-gray-600 hover:text-[#233267] transition-colors relative">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute top-1 right-0.5 bg-[#233267] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isMobileSearchOpen && (
          <div className="absolute inset-0 bg-white z-[60] px-4 flex items-center justify-between border-b border-gray-100 md:hidden">
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 flex-1 transition-all duration-300 border border-transparent focus-within:border-[#233267] focus-within:bg-white focus-within:shadow-md">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search or ask AI..."
                autoFocus
                className="bg-transparent border-none outline-none text-sm ml-2 flex-1 placeholder:text-gray-400 text-gray-800"
              />
              <button
                onClick={handleAiSearch}
                className="ml-2 flex flex-shrink-0 items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all duration-300 cursor-pointer bg-gradient-to-r from-[#233267] to-[#435db5] text-white shadow-sm hover:opacity-90"
              >
                <Sparkles size={12} />
                AI Search
              </button>
            </div>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 ml-2 text-gray-600 hover:text-[#233267] transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
