import React, { useState, FC, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    MessageSquareText, X, Trash2, Search, Sparkles,
    Users, ShoppingBag, ThumbsUp, RefreshCw, ChevronDown,
    Clock, Inbox, MessageSquare, Eye, Copy, Package, Info, Star
} from 'lucide-react';
import { useConversation, Conversation, Interaction, InteractionType } from '../context/ConversationContext';
import { products } from '../data';

/* ── helpers ─────────────────────────────────────────── */

function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${hours}:${mins}, ${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(ms / 1000);
    if (sec < 60) return 'Just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr / 24);
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
}

/* ── date divider ────────────────────────────────────── */

const DateDivider: FC<{ date: string }> = ({ date }) => (
    <div className="flex items-center gap-3 py-3">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{date}</span>
        <div className="flex-1 h-px bg-white/8" />
    </div>
);

/* ── chat feed (all conversations as one thread) ───── */

const ChatFeed: FC<{ conversations: Conversation[]; onProductClick?: (title: string) => void }> = ({ conversations, onProductClick }) => {
    // Reverse so oldest is on top (chat order)
    const sortedConvs = [...conversations].reverse();

    // Group by date for dividers
    let lastDate = '';

    return (
        <div className="space-y-1 pt-2 pb-2">
            {sortedConvs.map((conv) => {
                const convDate = new Date(conv.startedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                const showDate = convDate !== lastDate;
                lastDate = convDate;

                const searchInteraction = conv.interactions.find(i => i.type === 'ai_search' || i.type === 'regular_search');
                const isAI = conv.interactions[0]?.type === 'ai_search';

                // Partition interactions into rounds separated by refine_restart
                const rounds: typeof conv.interactions[][] = []; // Changed type to array of arrays
                let currentRound: typeof conv.interactions[0][] = [];
                conv.interactions.forEach(i => {
                    if (i.type === 'refine_restart') {
                        if (currentRound.length > 0) rounds.push(currentRound);
                        currentRound = [];
                    } else {
                        currentRound.push(i);
                    }
                });
                if (currentRound.length > 0) rounds.push(currentRound);

                return (
                    <React.Fragment key={conv.id}>
                        {showDate && <DateDivider date={convDate} />}

                        {/* User search bubble — right aligned (shown ONCE per conversation) */}
                        {searchInteraction && (
                            <div className="mb-3">
                                <div className="flex justify-end">
                                    <div className="bg-[#4b5261] text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-[80%]">
                                        <p className="text-[15px] font-medium">{searchInteraction.value}</p>
                                    </div>
                                </div>
                                <p className="text-right text-[10px] text-gray-500 mt-1 pr-1 italic">
                                    {formatTimestamp(searchInteraction.timestamp)}
                                </p>
                            </div>
                        )}

                        {/* Map over each refine round */}
                        {rounds.map((round, roundIdx) => {
                            const purposeInteraction = round.find(i => i.type === 'purpose_selected');
                            const recipientInteraction = round.find(i => i.type === 'recipient_selected');
                            const recommendationInteractions = round.filter(i => i.type === 'recommendation_shown');
                            const hasAddedToCart = round.some(i => i.type === 'add_to_cart');
                            const hasPrefs = purposeInteraction || recipientInteraction;

                            if (recommendationInteractions.length === 0 && !hasPrefs) return null;

                            return (
                                <React.Fragment key={`${conv.id}-round-${roundIdx}`}>
                                    {roundIdx > 0 && (
                                        <div className="flex items-center gap-3 py-3 mb-2">
                                            <div className="flex-1 h-px bg-white/8" />
                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Refined</span>
                                            <div className="flex-1 h-px bg-white/8" />
                                        </div>
                                    )}

                                    {/* AI recommendation cards — left aligned */}
                                    {recommendationInteractions.map((recInteraction, idx) => {
                                        const product = products.find(p => p.title === recInteraction.value);
                                        if (!product) return null;
                                        return (
                                            <div key={recInteraction.id} className="mb-3">
                                                <div className="flex gap-2.5 items-start">
                                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0 mt-1">
                                                        <Sparkles size={14} className="text-white" />
                                                    </div>
                                                    <div className="flex-1 bg-[#4b5261] rounded-2xl rounded-tl-sm overflow-hidden max-w-[85%]">
                                                        {/* Reasoning */}
                                                        <div className="px-4 pt-3.5 pb-2.5">
                                                            <p className="text-gray-200 text-[13px] italic leading-relaxed">
                                                                {isAI && hasPrefs
                                                                    ? `Based on your preference for ${purposeInteraction?.value?.toLowerCase() || 'quality'}${recipientInteraction ? `, selected for ${recipientInteraction.value.toLowerCase()}` : ''}.`
                                                                    : `Here's what we recommend for "${conv.searchQuery}".`
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="mx-4 h-px bg-white/10" />
                                                        {/* Product */}
                                                        <div
                                                            className="p-3.5 flex items-center gap-3.5 cursor-pointer hover:bg-white/10 transition-colors"
                                                            onClick={() => {
                                                                if (onProductClick && product) {
                                                                    onProductClick(product.title);
                                                                }
                                                            }}
                                                        >
                                                            <div className="w-16 h-16 bg-white rounded-xl p-1 shrink-0">
                                                                <img src={product.image} alt={product.title} className="w-full h-full object-contain" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-white font-semibold text-[14px] leading-snug line-clamp-2">{product.title}</h4>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <span className="text-gray-400 text-xs">Black</span>
                                                                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                                                    <span className="text-gray-400 text-xs">4.8 (2,847)</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Info + preferences row (same line) */}
                                    {recommendationInteractions.length > 0 && (
                                        <InfoPreferencesRow
                                            purpose={purposeInteraction?.value}
                                            recipient={recipientInteraction?.value}
                                            timestamp={recommendationInteractions[recommendationInteractions.length - 1]?.timestamp || searchInteraction?.timestamp}
                                            showPrefs={!!hasPrefs}
                                            showInfo={hasAddedToCart}
                                            productTitle={recommendationInteractions[recommendationInteractions.length - 1]?.value}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </React.Fragment>
                );
            })}

        </div>
    );
};

/* ── info + preferences row (same line) ─────────────── */

const InfoPreferencesRow: FC<{ purpose?: string; recipient?: string; timestamp?: string; showPrefs: boolean; showInfo: boolean; productTitle?: string }> = ({ purpose, recipient, timestamp, showPrefs, showInfo, productTitle }) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [prefsOpen, setPrefsOpen] = useState(false);
    return (
        <div className="mb-3">
            {/* Single row with both buttons */}
            <div className="flex items-center gap-2.5">
                {/* (i) button */}
                {showInfo && (
                    <button
                        onClick={() => setInfoOpen(o => !o)}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all ${infoOpen ? 'border-gray-300 bg-white/5' : 'border-gray-500 hover:border-gray-300'}`}
                    >
                        <span className="text-gray-400 text-[13px] font-serif italic leading-none">i</span>
                    </button>
                )}

                {/* View preferences pill */}
                {showPrefs && (
                    <button
                        onClick={() => setPrefsOpen(o => !o)}
                        className="bg-[#4b5261] text-gray-200 rounded-full px-3.5 py-1.5 text-[13px] font-medium flex items-center gap-1.5 cursor-pointer hover:bg-[#555d6d] transition-colors"
                    >
                        view preferences
                        <ChevronDown size={13} className={`transition-transform duration-200 ${prefsOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}

                {timestamp && (
                    <span className="text-[10px] text-gray-500 italic ml-auto">{formatTimestamp(timestamp)}</span>
                )}
            </div>

            {/* Expandable: brand message */}
            <AnimatePresence>
                {infoOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 bg-[#4b5261]/60 rounded-2xl px-4 py-3.5 border border-white/5">
                            <p className="text-gray-300 text-[13px] leading-relaxed italic">
                                {productTitle
                                    ? `Every detail of the ${productTitle} is designed to leave a lasting impression. You scrolled past options and stopped at this particular piece. Something felt right. That feeling? We built our entire brand around it.`
                                    : `You scrolled past options and stopped at us. Something felt right. That feeling? We built our entire brand around it, just for you.`
                                }
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Expandable: preferences */}
            <AnimatePresence>
                {prefsOpen && showPrefs && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 bg-[#3a3f4d] rounded-xl p-3 space-y-2 border border-white/5">
                            {purpose && (
                                <div className="flex items-center gap-2">
                                    <ShoppingBag size={12} className="text-amber-400" />
                                    <span className="text-gray-400 text-xs">Purpose:</span>
                                    <span className="text-gray-200 text-xs font-medium">{purpose}</span>
                                </div>
                            )}
                            {recipient && (
                                <div className="flex items-center gap-2">
                                    <Users size={12} className="text-emerald-400" />
                                    <span className="text-gray-400 text-xs">Recipient:</span>
                                    <span className="text-gray-200 text-xs font-medium">{recipient}</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ── main FAB + panel ───────────────────────────────── */

interface ConversationFABProps {
    isPopupMinimized?: boolean;
    onRestorePopup?: () => void;
    onLuckyPick?: (product: typeof products[0]) => void;
    onProductClick?: (title: string) => void;
    hideOnMobile?: boolean;
}

export default function ConversationFAB({ onLuckyPick, isPopupMinimized, onRestorePopup, onProductClick, hideOnMobile }: ConversationFABProps) {
    const { conversations, clearHistory } = useConversation();
    const [activeView, setActiveView] = useState<'none' | 'history' | 'recommended'>('none');
    const [confirmClear, setConfirmClear] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isOpen = activeView !== 'none';

    // Scroll to bottom when opening history
    useEffect(() => {
        if (activeView === 'history' && scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 150);
        }
    }, [activeView, conversations]);

    const handlePointerDown = () => {
        pressTimer.current = setTimeout(() => {
            setShowOptions(true);
        }, 500);
    };

    const handlePointerUp = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!showOptions) {
            // If popup is minimized, restore it instead of toggling the panel
            if (isPopupMinimized && onRestorePopup) {
                onRestorePopup();
                return;
            }
            if (isOpen) {
                setActiveView('none');
            } else {
                setActiveView('history');
            }
        }
    };

    // Derived data
    const recommendedTitles = Array.from(new Set(
        conversations.flatMap(c =>
            c.interactions.filter(i => i.type === 'recommendation_shown').map(i => i.value)
        )
    ));
    const recommendedProducts = products.filter(p => recommendedTitles.includes(p.title));

    const handleLuckyClick = () => {
        const pool = recommendedProducts.length > 0 ? products.filter(p => !recommendedTitles.includes(p.title)) : products;
        const randomPick = (pool.length > 0 ? pool : products)[Math.floor(Math.random() * (pool.length || products.length))];
        setShowOptions(false);
        setActiveView('none');
        if (onLuckyPick) {
            onLuckyPick(randomPick);
        }
    };

    useEffect(() => {
        const handleClickOutside = () => setShowOptions(false);
        if (showOptions) {
            const t = setTimeout(() => document.addEventListener('click', handleClickOutside), 10);
            return () => {
                clearTimeout(t);
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [showOptions]);

    const handleClear = () => {
        if (confirmClear) {
            clearHistory();
            setConfirmClear(false);
        } else {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 3000);
        }
    };

    const handleOpenView = (view: 'history' | 'recommended' | 'lucky') => {
        setActiveView(view);
        setShowOptions(false);
    };

    return (
        <>
            {/* ── FAB button ── */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onClick={handleClick}
                className={`fixed bottom-6 right-6 z-[55] w-14 h-14 rounded-full text-white shadow-2xl items-center justify-center cursor-pointer ring-2 ring-white/10 transition-colors duration-300 md:flex ${hideOnMobile && !isOpen ? 'hidden' : 'flex'} ${showOptions ? 'bg-black' : 'bg-[#233267]'}`}
                title="Conversation History"
            >
                {isOpen ? <X size={22} /> : showOptions ? <Sparkles size={24} /> : (
                    <img
                        src="https://www.submarinepens.com/cdn/shop/files/submarine_logo_6.png?v=1765368251&width=330"
                        alt="Submarine Pens"
                        className="h-7 w-auto object-contain brightness-0 invert"
                        referrerPolicy="no-referrer"
                    />
                )}
                {!isOpen && !showOptions && conversations.length > 0 && !isPopupMinimized && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-lg">
                        {conversations.length > 99 ? '99+' : conversations.length}
                    </span>
                )}
                {isPopupMinimized && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500" />
                    </span>
                )}
            </motion.button>

            {/* ── floating options menu (long-press) ── */}
            <AnimatePresence>
                {showOptions && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="fixed bottom-[1.65rem] right-[5.5rem] z-[55] bg-white h-[3.25rem] px-5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex items-center gap-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); handleOpenView('history'); }}
                            className="text-gray-600 hover:text-black hover:scale-110 transition-all cursor-pointer">
                            <MessageSquare size={22} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleOpenView('recommended'); }}
                            className="text-gray-600 hover:text-black hover:scale-110 transition-all cursor-pointer">
                            <Eye size={24} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleLuckyClick(); }}
                            className="text-gray-600 hover:text-black hover:scale-110 transition-all relative mt-1 cursor-pointer">
                            <Copy size={22} strokeWidth={2.5} />
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-gray-700 rounded-full border-[2.5px] border-white" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── full-height panel ── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]"
                            onClick={() => { setActiveView('none'); setConfirmClear(false); }}
                        />

                        {/* panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="fixed top-4 bottom-4 right-4 z-[60] w-[420px] bg-[#3e4451] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Back button */}
                            <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">

                                {/* Clear button */}
                                {activeView === 'history' && conversations.length > 0 && (
                                    <button
                                        onClick={handleClear}
                                        className={`ml-auto p-2 rounded-lg transition-all text-sm flex items-center gap-1.5 cursor-pointer ${confirmClear
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                        title="Clear all"
                                    >
                                        <Trash2 size={14} />
                                        {confirmClear && <span className="text-xs">Confirm?</span>}
                                    </button>
                                )}

                                {/* Close button - always top right */}
                                <button
                                    onClick={() => { setActiveView('none'); setConfirmClear(false); }}
                                    className="ml-auto p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* ── Handle bar ── */}
                            <div className="flex justify-center py-1 shrink-0">
                                <div className="w-10 h-1 rounded-full bg-gray-500/50" />
                            </div>

                            {/* ── Content ── */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">

                                {/* HISTORY VIEW */}
                                {activeView === 'history' && (
                                    conversations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center px-8 opacity-60">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <Inbox size={28} className="text-gray-500" />
                                            </div>
                                            <p className="text-gray-400 font-medium mb-1">No interactions yet</p>
                                            <p className="text-gray-500 text-sm leading-relaxed">
                                                Try searching with the AI button to see your activity here.
                                            </p>
                                        </div>
                                    ) : (
                                        <ChatFeed
                                            conversations={conversations}
                                            onProductClick={(title) => {
                                                setActiveView('none');
                                                if (onProductClick) onProductClick(title);
                                            }}
                                        />
                                    )
                                )}

                                {/* RECOMMENDED VIEW */}
                                {activeView === 'recommended' && (
                                    recommendedProducts.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center px-8 opacity-60">
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <Eye size={28} className="text-gray-500" />
                                            </div>
                                            <p className="text-gray-400 font-medium mb-1">No recommendations yet</p>
                                            <p className="text-gray-500 text-sm leading-relaxed">
                                                Use our AI assistant to get personalized suggestions.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 auto-rows-max pt-2">
                                            {recommendedProducts.map(product => (
                                                <div key={product.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col group hover:border-white/20 transition-all cursor-pointer">
                                                    <div className="aspect-square bg-white relative overflow-hidden flex items-center justify-center">
                                                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={product.title} />
                                                    </div>
                                                    <div className="p-3">
                                                        <h3 className="line-clamp-2 text-sm text-gray-200 font-medium leading-snug">{product.title}</h3>
                                                        <p className="text-[#7b8ec9] text-sm mt-1.5 font-bold">₹{product.price.toLocaleString('en-IN')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                            </div>

                            {/* ── Bottom toolbar (always visible) ── */}
                            <div className="shrink-0 flex justify-center pb-5 pt-3">
                                <div className="bg-[#5a6070] h-[3rem] px-6 rounded-full flex items-center gap-7 shadow-lg border border-white/5">
                                    <button
                                        onClick={() => handleOpenView('history')}
                                        className={`transition-all cursor-pointer ${activeView === 'history' ? 'text-red-400 scale-110' : 'text-gray-300 hover:text-white hover:scale-110'}`}>
                                        <MessageSquare size={21} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => handleOpenView('recommended')}
                                        className={`transition-all cursor-pointer ${activeView === 'recommended' ? 'text-red-400 scale-110' : 'text-gray-300 hover:text-white hover:scale-110'}`}>
                                        <Eye size={23} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={handleLuckyClick}
                                        className="transition-all relative cursor-pointer text-gray-300 hover:text-white hover:scale-110">
                                        <Copy size={21} strokeWidth={2.5} />
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gray-800 rounded-full border-2 border-[#5a6070]" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
