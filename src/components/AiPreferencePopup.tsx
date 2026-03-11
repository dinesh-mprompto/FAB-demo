import { X, ChevronDown, Pen, PenTool, Pencil, Feather, Highlighter, Sparkles, Check, ChevronLeft, ChevronRight, ShoppingCart, Star, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { products } from '../data';
import { useConversation } from '../context/ConversationContext';
import { IntentResult } from '../utils/intentAnalyzer';

interface AiPreferencePopupProps {
  onClose: () => void;
  onMinimize?: () => void;
  searchQuery?: string;
  intent?: IntentResult | null;
}

const ICONS = [Pen, PenTool, Pencil, Feather, Highlighter, Check];
const CHECK_ICON_INDEX = ICONS.length - 1;

const PURPOSE_OPTIONS = ['Everyday writing', 'Gifting', 'Collecting / Space enthusiast'];
const RECIPIENT_OPTIONS = ['Child', 'Teen', 'Adult'];

export default function AiPreferencePopup({ onClose, onMinimize, searchQuery, intent }: AiPreferencePopupProps) {
  // If intent says the query is specific enough, skip questions
  const isDirectSearch = intent?.isComplete ?? false;
  const [step, setStep] = useState(isDirectSearch ? 4 : 1);
  const [answers, setAnswers] = useState({
    purpose: intent?.purpose || '',
    recipient: intent?.recipient || ''
  });
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [isCelebrating, setIsCelebrating] = useState(false);



  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recommendationRef = useRef<HTMLDivElement>(null);
  const { addInteraction, endConversation, startConversation } = useConversation();

  const handleRestart = () => {
    // Record current preferences before ending conversation
    if (answers.purpose) {
      addInteraction('purpose_selected', 'Purpose', answers.purpose);
    }
    if (answers.recipient) {
      addInteraction('recipient_selected', 'Recipient', answers.recipient);
    }
    addInteraction('refine_restart', 'Refined Search', `Refined from: ${answers.purpose || 'N/A'} / ${answers.recipient || 'N/A'}`);

    // Keep it in the same conversation! Just reset UI state
    setAnswers({ purpose: '', recipient: '' });
    setStep(1);
  };

  // Auto-scroll to recommendation when entering step 4
  useEffect(() => {
    if (step === 4) {
      // Log recommendation
      const recProduct = recommendedProducts[currentProductIndex];
      if (recProduct) {
        addInteraction('recommendation_shown', 'Recommendation', recProduct.title);
      }

      if (!isDirectSearch && recommendationRef.current) {
        setTimeout(() => {
          recommendationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [step]);

  // Slot machine state
  const [reels, setReels] = useState([0, 1, 2]);
  const [isSpinning, setIsSpinning] = useState([false, false, false]);

  // Recommendation state
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  // Drag slider state
  const dragX = useMotionValue(0);
  const fillWidth = useTransform(dragX, [0, 260], ["52px", "312px"]);

  useEffect(() => {
    dragX.set(0);
  }, [currentProductIndex, step, dragX]);

  // Use intent-matched products or fallback to simple title match
  const getRecommendedProducts = () => {
    let result = [];
    // Use products from the intent analyzer
    if (intent?.matchedProducts && intent.matchedProducts.length > 0) {
      result = intent.matchedProducts;
    } else {
      // Fallback: keyword-based matching
      const query = searchQuery?.toLowerCase() || '';
      const matched = products.filter(p =>
        p.title.toLowerCase().includes(query) || query.includes(p.title.toLowerCase())
      );
      if (matched.length > 0) {
        result = matched;
      } else {
        result = products.slice(0, 3);
      }
    }

    // Show maximum 3 products
    return result.slice(0, 3);
  };

  const recommendedProducts = getRecommendedProducts();

  useEffect(() => {
    if (step === 3) {
      // Start spinning all reels
      setIsSpinning([true, true, true]);

      const spinIntervals: NodeJS.Timeout[] = [];

      // Create spin intervals for each reel
      [0, 1, 2].forEach((reelIndex) => {
        const interval = setInterval(() => {
          setReels(prev => {
            const newReels = [...prev];
            // Cycle through all icons except the check mark during spin
            const nextIconIndex = (newReels[reelIndex] + 1) % (ICONS.length - 1);
            newReels[reelIndex] = nextIconIndex;
            return newReels;
          });
        }, 100);
        spinIntervals.push(interval);
      });

      // Stop reels one by one
      const stopTimeouts = [2000, 3000, 4000].map((delay, index) => {
        return setTimeout(() => {
          clearInterval(spinIntervals[index]);

          // Force landing on the Check icon
          setReels(prev => {
            const newReels = [...prev];
            newReels[index] = CHECK_ICON_INDEX;
            return newReels;
          });

          setIsSpinning(prev => {
            const newSpinning = [...prev];
            newSpinning[index] = false;
            return newSpinning;
          });

          // Auto transition to step 4 after the last reel stops
          if (index === 2) {
            setTimeout(() => setStep(4), 1000);
          }
        }, delay);
      });

      return () => {
        spinIntervals.forEach(clearInterval);
        stopTimeouts.forEach(clearTimeout);
      };
    }
  }, [step]);

  const handleOptionSelect = (option: string) => {
    if (step === 1) {
      addInteraction('purpose_selected', 'Purpose', option);
      setAnswers(prev => ({ ...prev, purpose: option }));
      setStep(2);
    } else if (step === 2) {
      addInteraction('recipient_selected', 'Recipient', option);
      setAnswers(prev => ({ ...prev, recipient: option }));
      setStep(3);
    }
  };

  const nextProduct = () => {
    setCurrentProductIndex((prev) => (prev + 1) % recommendedProducts.length);
  };

  const prevProduct = () => {
    setCurrentProductIndex((prev) => (prev - 1 + recommendedProducts.length) % recommendedProducts.length);
  };

  const handleAddToCart = () => {
    const currentTitle = recommendedProducts[currentProductIndex].title;
    if (!addedItems[currentTitle]) {
      addInteraction('add_to_cart', 'Added to Cart', currentTitle);
      setAddedItems(prev => ({ ...prev, [currentTitle]: true }));
      setIsCelebrating(true);

      // Haptic feedback if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }

      // Close the popup after a longer delay to let the celebration glow play out
      setTimeout(() => {
        setIsCelebrating(false);
        onClose();
      }, 1200);
    }
  };

  const currentOptions = step === 1
    ? ['Everyday writing', 'Gifting', 'Collecting / Space enthusiast']
    : ['Child', 'Teen', 'Adult'];

  const currentTitle = step === 1
    ? "What are you buying this for?"
    : step === 2
      ? "Who is it for?"
      : step === 3
        ? "Finding your perfect match..."
        : isDirectSearch
          ? "Found this Just for You"
          : "TOP PICK";

  const getProductReasoning = (product: typeof products[0]) => {
    if (isDirectSearch && intent?.reasoning) return intent.reasoning;

    const title = product.title.toLowerCase();
    const purpose = answers.purpose.toLowerCase();
    const recipient = answers.recipient.toLowerCase();

    if (title.includes('roller')) {
      if (purpose.includes('gift')) return `A premium roller pen that makes a thoughtful gift for a ${recipient}.`;
      if (purpose.includes('everyday')) return `Effortless ink flow makes this perfect for everyday writing.`;
      return `A smooth writing experience, selected for ${recipient}.`;
    }

    if (title.includes('ball')) {
      if (purpose.includes('everyday')) return `Durable and reliable - the perfect daily driver for a ${recipient}.`;
      return `Classic design and reliability, ideal for ${purpose}.`;
    }

    if (title.includes('stand')) {
      if (purpose.includes('collect')) return `A detailed collectible that any space enthusiast would love.`;
      return `Adds a touch of space exploration to any desk.`;
    }

    if (title.includes('nasa') || title.includes('space')) {
      if (recipient.includes('child') || recipient.includes('teen')) return `Spark their curiosity with this space-themed writing instrument.`;
      return `Celebrating space exploration - a unique choice for ${purpose}.`;
    }

    return `Based on your preference for ${purpose} and ${recipient}.`;
  };

  const getReview = (product: typeof products[0]) => {
    const title = product.title.toLowerCase();

    if (title.includes('stand')) {
      return {
        text: "Looks amazing on my desk! The detail is incredible.",
        author: "Alex P."
      };
    }
    if (title.includes('kids')) {
      return {
        text: "My kids absolutely love these! Great quality.",
        author: "Sarah M."
      };
    }
    if (title.includes('roller')) {
      return {
        text: "The ink flow is perfect. Best roller pen I've owned.",
        author: "David K."
      };
    }
    if (title.includes('ball')) {
      return {
        text: "Writes smoothly and feels great in hand!",
        author: "James T."
      };
    }

    const defaultReviews = [
      { text: "A beautiful piece of engineering. Highly recommend.", author: "Robert L." },
      { text: "Exceeded my expectations. The finish is stunning.", author: "Emily W." },
      { text: "The balance and weight are perfect. A joy to write with.", author: "Michael R." }
    ];

    return defaultReviews[product.id % defaultReviews.length];
  };

  const review = getReview(recommendedProducts[currentProductIndex]);



  return (
    <>
      <div
        className="fixed inset-0 backdrop-blur-sm z-40 transition-all duration-700 ease-in-out bg-black/20"
        onClick={onClose}
      />

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div
          ref={scrollContainerRef}
          className={`bg-[#3e4451] rounded-2xl p-5 text-white relative max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent transition-all duration-300 ${isCelebrating
              ? 'animate-[blink-glow_0.6s_ease-in-out_2] shadow-2xl border border-indigo-400'
              : 'shadow-2xl border border-gray-600/50'
            }`}
        >
          {/* Header / Progress */}
          <div className="flex justify-between items-start mb-4 sticky top-0 bg-[#3e4451] z-20 pb-2 border-b border-white/5">
            <div className="p-0.5 w-7 h-7 rounded-full border border-gray-400/50 flex items-center justify-center">
              <span className="text-gray-300 text-[13px] font-serif italic leading-none">i</span>
            </div>

            {step < 4 && (
              <div className="flex gap-2 flex-1 mx-12 mt-1.5">
                <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-white' : 'bg-gray-500/50'}`}></div>
                <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-white' : 'bg-gray-500/50'}`}></div>
                <div className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-white' : 'bg-gray-500/50'}`}></div>
              </div>
            )}

            {step === 4 && (
              <div className="flex gap-1 h-1 w-12 mx-auto mt-1.5">
                {recommendedProducts.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-full flex-1 rounded-full transition-colors duration-300 ${idx === currentProductIndex ? 'bg-white' : 'bg-gray-500/50'}`}
                  />
                ))}
              </div>
            )}

            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Title */}
          {!(step === 4 && !isDirectSearch) && (
            <h3 className={`text-lg font-bold text-center mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-300 ${step === 4 ? 'uppercase' : ''}`} key={step}>
              {currentTitle}
            </h3>
          )}

          {/* Content */}
          {step < 3 ? (
            <div className={`grid gap-3 mb-8 ${step === 1 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {(step === 1 ? PURPOSE_OPTIONS : RECIPIENT_OPTIONS).map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  className="py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 bg-transparent border border-gray-500 text-white hover:border-gray-300 hover:bg-white/5 active:bg-white/10"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : step === 3 ? (
            <div className="mb-8">
              <div className="flex justify-center gap-4 mb-6">
                {reels.map((iconIndex, i) => {
                  const Icon = ICONS[iconIndex];
                  const isCheck = iconIndex === CHECK_ICON_INDEX;
                  return (
                    <div key={i} className="w-20 h-24 bg-gray-800/50 rounded-lg border border-gray-600 flex items-center justify-center relative overflow-hidden shadow-inner">
                      <div className={`transition-all duration-100 ${isSpinning[i] ? 'scale-110 opacity-80' : 'scale-100 opacity-100'}`}>
                        <Icon size={40} className={isCheck ? "text-green-400" : "text-white"} />
                      </div>
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Step 4: Recommendation
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
              {!isDirectSearch && (
                <div className="mb-8 relative py-2">
                  <div className="space-y-6 opacity-50 pointer-events-none">
                    {/* Question 1 History */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">What are you buying this for?</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {PURPOSE_OPTIONS.map((option) => {
                          const isSelected = option === answers.purpose;
                          return (
                            <div
                              key={option}
                              className={`py-2 px-3 rounded-lg text-xs font-medium text-center border transition-colors ${isSelected
                                ? 'bg-gray-400 text-gray-900 border-gray-400 font-bold'
                                : 'bg-transparent border-gray-600 text-gray-500'
                                }`}
                            >
                              {option}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Question 2 History */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-3">Who is it for?</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {RECIPIENT_OPTIONS.map((option) => {
                          const isSelected = option === answers.recipient;
                          return (
                            <div
                              key={option}
                              className={`py-2 px-3 rounded-lg text-xs font-medium text-center border transition-colors ${isSelected
                                ? 'bg-gray-400 text-gray-900 border-gray-400 font-bold'
                                : 'bg-transparent border-gray-600 text-gray-500'
                                }`}
                            >
                              {option}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Refine Button Overlay - Centered */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <button
                      onClick={handleRestart}
                      className="flex items-center gap-2 bg-[#4b5563] hover:bg-[#374151] text-white px-5 py-2.5 rounded-lg shadow-xl transition-all hover:scale-105 active:scale-95 text-sm font-bold border border-gray-500"
                    >
                      <RefreshCw size={16} />
                      Refine
                    </button>
                  </div>
                </div>
              )}

              {!isDirectSearch && (
                <h3 className="text-lg font-bold text-center mb-6 tracking-tight uppercase animate-in fade-in slide-in-from-bottom-2 duration-300">
                  TOP PICK
                </h3>
              )}

              <div ref={recommendationRef} className="bg-white/10 rounded-xl p-4 mb-6 relative">
                {/* Navigation Arrows */}
                <button
                  onClick={prevProduct}
                  className="absolute left-[-12px] top-1/2 -translate-y-1/2 bg-[#3e4451] rounded-full p-1.5 shadow-lg border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 z-10"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextProduct}
                  className="absolute right-[-12px] top-1/2 -translate-y-1/2 bg-[#3e4451] rounded-full p-1.5 shadow-lg border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 z-10"
                >
                  <ChevronRight size={20} />
                </button>

                <p className="text-center text-gray-300 text-sm italic mb-4 px-4">
                  {getProductReasoning(recommendedProducts[currentProductIndex])}
                </p>

                <div className="bg-white/5 rounded-lg p-3 mb-4 border border-white/10">
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-white rounded-lg p-1 flex-shrink-0">
                      <img
                        src={recommendedProducts[currentProductIndex].image}
                        alt={recommendedProducts[currentProductIndex].title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{recommendedProducts[currentProductIndex].title}</h4>
                      <p className="text-gray-400 text-sm mb-1">Black</p>
                      <div className="flex items-center gap-1 mb-1">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-300">4.8 (2,847)</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                      <span className="font-bold text-lg">${recommendedProducts[currentProductIndex].price}</span>
                    </div>
                  </div>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-1.5 mb-2">
                  {recommendedProducts.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-2 rounded-full transition-colors ${idx === currentProductIndex ? 'bg-gray-300' : 'bg-gray-600'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10 text-center">
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-300 italic text-sm mb-2">"{review.text}"</p>
                <p className="text-gray-400 text-xs">{review.author}</p>
              </div>

              <div className="flex justify-center mb-6">
                <button className="bg-white/10 hover:bg-white/20 text-gray-300 px-6 py-2 rounded-full text-sm font-medium transition-colors">
                  Before You Buy
                </button>
              </div>

              {/* Swipe to Add to Cart */}
              <div
                className="relative w-full max-w-sm mx-auto h-14 bg-white/5 rounded-full overflow-hidden flex items-center border border-white/10 mb-4"
                ref={(node) => {
                  if (node) {
                    node.dataset.bounds = "true";
                  }
                }}
              >
                {addedItems[recommendedProducts[currentProductIndex].title] ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 bg-black/80 flex items-center justify-center font-medium text-white gap-2 pointer-events-none select-none z-0 border border-white/10 rounded-full"
                  >
                    <Check size={18} className="text-white" /> Added to Cart
                  </motion.div>
                ) : (
                  <>
                    <div className="absolute w-full text-center text-sm font-medium text-gray-400 pointer-events-none select-none z-0 pl-4 flex items-center justify-center">
                      <span className="bg-gradient-to-r from-gray-500 via-white to-gray-500 bg-[length:200%_auto] animate-[shimmer_2s_linear_infinite] bg-clip-text text-transparent">
                        Slide to add to cart
                      </span>
                      <div className="flex ml-2 opacity-50">
                        <ChevronRight size={16} className="animate-[pulse_1.5s_infinite]" />
                        <ChevronRight size={16} className="-ml-2 animate-[pulse_1.5s_0.2s_infinite]" />
                        <ChevronRight size={16} className="-ml-2 animate-[pulse_1.5s_0.4s_infinite]" />
                      </div>
                    </div>
                    {/* The trailing black background that matches the thumb's movement */}
                    <motion.div
                      className="absolute left-1 top-1 bottom-1 bg-black/80 rounded-full z-0 pointer-events-none border border-white/5"
                      style={{ width: fillWidth }}
                    />
                    <motion.div
                      key={recommendedProducts[currentProductIndex].title}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center cursor-grabbable active:cursor-grabbing z-10 shadow-lg relative left-1 text-black"
                      style={{ x: dragX }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 260 }}
                      dragElastic={0.05}
                      dragSnapToOrigin
                      onDragEnd={(e, info) => {
                        if (info.offset.x > 130) {
                          handleAddToCart();
                        }
                      }}
                    >
                      <ShoppingCart size={18} />
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-white/5 flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-1 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <div className="flex-1" />
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                title="Minimize"
              >
                <ChevronDown size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
