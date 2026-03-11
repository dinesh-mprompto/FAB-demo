
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const messages = [
  "EVERY ORDER SUPPORTS SMILE FOUNDATION “SHE CAN FLY” INITIATIVE",
  "FREE SHIPPING ON PREPAID ORDER ABOVE ₹599/- 🚚",
  "10% OFF ON ORDER ABOVE 699/-"
];

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrentIndex((prev) => (prev + 1) % messages.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);

  return (
    <div className="bg-[#233267] text-white relative overflow-hidden h-10 flex items-center justify-center">
      <button onClick={prev} className="absolute left-4 p-1 hover:bg-white/10 rounded-full transition-colors z-10">
        <ChevronLeft size={14} />
      </button>
      
      <div className="w-full max-w-2xl mx-auto text-center px-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-medium tracking-wide uppercase"
          >
            {messages[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <button onClick={next} className="absolute right-4 p-1 hover:bg-white/10 rounded-full transition-colors z-10">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
