import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

export type InteractionType =
    | 'ai_search'
    | 'regular_search'
    | 'purpose_selected'
    | 'recipient_selected'
    | 'recommendation_shown'
    | 'help_accepted'
    | 'refine_restart'
    | 'add_to_cart';

export interface Interaction {
    id: string;
    timestamp: string;
    type: InteractionType;
    label: string;
    value: string;
}

export interface Conversation {
    id: string;
    startedAt: string;
    searchQuery: string;
    interactions: Interaction[];
}

interface ConversationContextType {
    conversations: Conversation[];
    startConversation: (searchQuery: string, type?: InteractionType) => void;
    addInteraction: (type: InteractionType, label: string, value: string) => void;
    endConversation: () => void;
    clearHistory: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

const STORAGE_KEY = 'submarine_pens_conversations';

let idCounter = 0;
function genId() {
    return `${Date.now()}-${++idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ConversationProvider({ children }: { children: ReactNode }) {
    const [conversations, setConversations] = useState<Conversation[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const activeRef = useRef<Conversation | null>(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }, [conversations]);

    const startConversation = useCallback((searchQuery: string, type: InteractionType = 'ai_search') => {
        // End any existing active conversation first
        if (activeRef.current) {
            const finished = { ...activeRef.current };
            setConversations(prev => [finished, ...prev]);
        }

        activeRef.current = {
            id: genId(),
            startedAt: new Date().toISOString(),
            searchQuery,
            interactions: [{
                id: genId(),
                timestamp: new Date().toISOString(),
                type,
                label: type === 'ai_search' ? 'AI Search' : 'Search',
                value: searchQuery,
            }],
        };
    }, []);

    const addInteraction = useCallback((type: InteractionType, label: string, value: string) => {
        if (!activeRef.current) return;

        activeRef.current = {
            ...activeRef.current,
            interactions: [
                ...activeRef.current.interactions,
                {
                    id: genId(),
                    timestamp: new Date().toISOString(),
                    type,
                    label,
                    value,
                },
            ],
        };
    }, []);

    const endConversation = useCallback(() => {
        if (activeRef.current) {
            const finished = { ...activeRef.current };
            setConversations(prev => [finished, ...prev]);
            activeRef.current = null;
        }
    }, []);

    const clearHistory = useCallback(() => {
        setConversations([]);
        activeRef.current = null;
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return (
        <ConversationContext.Provider value={{
            conversations,
            startConversation,
            addInteraction,
            endConversation,
            clearHistory,
        }}>
            {children}
        </ConversationContext.Provider>
    );
}

export function useConversation() {
    const context = useContext(ConversationContext);
    if (context === undefined) {
        throw new Error('useConversation must be used within a ConversationProvider');
    }
    return context;
}
