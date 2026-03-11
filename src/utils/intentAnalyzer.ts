import { products, Product } from '../data';

export interface IntentResult {
    /** Whether the user's query has enough information to skip preference questions */
    isComplete: boolean;
    /** Matched products based on intent analysis */
    matchedProducts: Product[];
    /** Extracted purpose if present (e.g. "gifting", "everyday", "collecting") */
    purpose?: string;
    /** Extracted recipient if present (e.g. "child", "teen", "adult") */
    recipient?: string;
    /** Short explanation of why we classified the intent this way */
    reasoning: string;
}

// Keywords that signal the user knows exactly what they want (specific product)
const SPECIFIC_PRODUCT_SIGNALS = [
    'pen stand', 'pen drive', 'roller pen', 'ball pen', 'combo',
    'neptune', 'jupiter', 'saturn', 'earth', 'pluto', 'venus', 'mars',
    'nasa pen stand', 'astronaut', 'rocket', 'kids pen',
];

// Keywords that indicate purpose
const PURPOSE_SIGNALS: Record<string, string[]> = {
    'Gifting': ['gift', 'gifting', 'present', 'birthday', 'anniversary', 'surprise', 'for someone', 'buy for'],
    'Everyday writing': ['everyday', 'daily', 'writing', 'office', 'school', 'work', 'notes', 'journal', 'study'],
    'Collecting / Space enthusiast': ['collect', 'collector', 'space', 'nasa', 'astronaut', 'rocket', 'cosmos', 'universe', 'fan', 'enthusiast', 'memorabilia'],
};

// Keywords that indicate recipient
const RECIPIENT_SIGNALS: Record<string, string[]> = {
    'Child': ['kid', 'kids', 'child', 'children', 'son', 'daughter', 'young', 'little', 'boy', 'girl', 'toddler'],
    'Teen': ['teen', 'teenager', 'student', 'school', 'college', 'young adult'],
    'Adult': ['adult', 'professional', 'colleague', 'boss', 'husband', 'wife', 'friend', 'dad', 'mom', 'father', 'mother', 'man', 'woman', 'office'],
};

// Price range signals
const PRICE_SIGNALS: Record<string, [number, number]> = {
    'cheap': [0, 400],
    'affordable': [0, 500],
    'budget': [0, 400],
    'premium': [700, Infinity],
    'expensive': [700, Infinity],
    'luxury': [1000, Infinity],
    'mid range': [400, 800],
    'mid-range': [400, 800],
};

function matchProducts(query: string): Product[] {
    const q = query.toLowerCase();

    // Direct product name match
    const exactMatches = products.filter(p =>
        p.title.toLowerCase().includes(q) || q.includes(p.title.toLowerCase())
    );
    if (exactMatches.length > 0) return exactMatches;

    // Keyword-based matching
    const scored = products.map(product => {
        let score = 0;
        const title = product.title.toLowerCase();

        // Check title word overlap  
        const queryWords = q.split(/\s+/);
        for (const word of queryWords) {
            if (word.length > 2 && title.includes(word)) score += 3;
        }

        // Category matching
        if (q.includes('stand') && title.includes('stand')) score += 5;
        if (q.includes('roller') && title.includes('roller')) score += 5;
        if (q.includes('ball pen') && title.includes('ball pen')) score += 5;
        if ((q.includes('kid') || q.includes('child')) && title.includes('kids')) score += 4;
        if (q.includes('combo') && title.includes('combo')) score += 5;
        if (q.includes('pen drive') && title.includes('pen drive')) score += 5;

        // Space/NASA theme matching for vague space queries
        if ((q.includes('space') || q.includes('nasa') || q.includes('astronaut') || q.includes('rocket')) &&
            (title.includes('nasa') || title.includes('space') || title.includes('rocket'))) {
            score += 3;
        }

        // Price range matching
        for (const [keyword, [min, max]] of Object.entries(PRICE_SIGNALS)) {
            if (q.includes(keyword) && product.price >= min && product.price <= max) {
                score += 2;
            }
        }

        return { product, score };
    });

    const filtered = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    if (filtered.length > 0) {
        return filtered.slice(0, 3).map(s => s.product);
    }

    // Fallback: return top products
    return products.slice(0, 2);
}

function extractPurpose(query: string): string | undefined {
    const q = query.toLowerCase();
    for (const [purpose, keywords] of Object.entries(PURPOSE_SIGNALS)) {
        if (keywords.some(kw => q.includes(kw))) return purpose;
    }
    return undefined;
}

function extractRecipient(query: string): string | undefined {
    const q = query.toLowerCase();
    for (const [recipient, keywords] of Object.entries(RECIPIENT_SIGNALS)) {
        if (keywords.some(kw => q.includes(kw))) return recipient;
    }
    return undefined;
}

/**
 * Analyze the search query to determine if the intent is clear enough
 * to skip preference questions and directly show recommendations.
 */
export function analyzeIntent(query: string): IntentResult {
    const q = query.trim().toLowerCase();
    const purpose = extractPurpose(q);
    const recipient = extractRecipient(q);
    const matchedProducts = matchProducts(q);

    // Calculate a "completeness" score
    let completenessScore = 0;
    let reasoning = '';

    // 1. Does the query mention a specific product by name?
    const hasSpecificProduct = SPECIFIC_PRODUCT_SIGNALS.some(signal => q.includes(signal));
    if (hasSpecificProduct) {
        completenessScore += 3;
        reasoning = 'Query mentions a specific product type.';
    }

    // 2. Does it have a purpose?
    if (purpose) {
        completenessScore += 1;
        reasoning += ` Purpose detected: ${purpose}.`;
    }

    // 3. Does it have a recipient?
    if (recipient) {
        completenessScore += 1;
        reasoning += ` Recipient detected: ${recipient}.`;
    }

    // 4. Is the query very specific (has multiple descriptive words)?
    const meaningfulWords = q.split(/\s+/).filter(w => w.length > 2 && !['the', 'for', 'and', 'pen', 'pens', 'with'].includes(w));
    if (meaningfulWords.length >= 3) {
        completenessScore += 1;
        reasoning += ' Query is descriptive enough.';
    }

    // Intent is "complete" (skip questions) if score >= 3 OR the query directly mentions a specific product
    const isComplete = completenessScore >= 3;

    if (!reasoning) {
        reasoning = 'Query is too general — need more preferences to recommend.';
    }

    return {
        isComplete,
        matchedProducts,
        purpose,
        recipient,
        reasoning: reasoning.trim(),
    };
}
