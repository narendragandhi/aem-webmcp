/**
 * Image Tagger Tests
 */

const COMMON_LABELS = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'bench', 'bird', 'cat',
    'dog', 'horse', 'sheep', 'cow', 'elephant', 'zebra', 'giraffe',
    'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot',
    'pizza', 'donut', 'cake', 'chair', 'couch', 'bed', 'dining table',
    'tv', 'laptop', 'mouse', 'keyboard', 'cell phone', 'book', 'clock'
];

// Mock classification function
function mockClassify(numTags = 5) {
    const shuffled = [...COMMON_LABELS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numTags).map(label => ({
        name: label,
        confidence: Math.random() * 0.3 + 0.7
    })).sort((a, b) => b.confidence - a.confidence);
}

function processImageResults(results, maxResults = 10) {
    return results
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxResults)
        .map(r => ({
            name: r.name,
            confidence: (r.confidence * 100).toFixed(1) + '%'
        }));
}

function filterByConfidence(results, minConfidence = 0.5) {
    return results.filter(r => r.confidence >= minConfidence);
}

function searchByTag(results, tag) {
    return results.filter(r => 
        r.name.toLowerCase().includes(tag.toLowerCase())
    );
}

describe('Image Tagger', () => {
    
    test('mockClassify returns correct number of results', () => {
        const results = mockClassify(5);
        expect(results.length).toBe(5);
    });

    test('mockClassify returns results with name and confidence', () => {
        const results = mockClassify(3);
        results.forEach(r => {
            expect(r.name).toBeDefined();
            expect(r.confidence).toBeDefined();
            expect(typeof r.confidence).toBe('number');
        });
    });

    test('mockClassify confidence is between 0.7 and 1.0', () => {
        const results = mockClassify(10);
        results.forEach(r => {
            expect(r.confidence).toBeGreaterThanOrEqual(0.7);
            expect(r.confidence).toBeLessThanOrEqual(1.0);
        });
    });

    test('processImageResults sorts by confidence', () => {
        const results = mockClassify(10);
        const processed = processImageResults(results);
        
        for (let i = 0; i < processed.length - 1; i++) {
            const curr = parseFloat(processed[i].confidence);
            const next = parseFloat(processed[i + 1].confidence);
            expect(curr).toBeGreaterThanOrEqual(next);
        }
    });

    test('processImageResults limits results', () => {
        const results = mockClassify(20);
        const processed = processImageResults(results, 5);
        expect(processed.length).toBe(5);
    });

    test('filterByConfidence filters correctly', () => {
        const results = [
            { name: 'person', confidence: 0.9 },
            { name: 'car', confidence: 0.6 },
            { name: 'dog', confidence: 0.4 },
            { name: 'cat', confidence: 0.8 }
        ];
        const filtered = filterByConfidence(results, 0.5);
        expect(filtered.length).toBe(3);
    });

    test('filterByConfidence returns empty for all below threshold', () => {
        const results = [
            { name: 'a', confidence: 0.3 },
            { name: 'b', confidence: 0.2 }
        ];
        const filtered = filterByConfidence(results, 0.5);
        expect(filtered.length).toBe(0);
    });

    test('searchByTag finds matches', () => {
        const results = [
            { name: 'person', confidence: 0.9 },
            { name: 'car', confidence: 0.8 },
            { name: 'person walking', confidence: 0.7 }
        ];
        const matches = searchByTag(results, 'person');
        expect(matches.length).toBe(2);
    });

    test('searchByTag is case insensitive', () => {
        const results = [
            { name: 'PERSON', confidence: 0.9 },
            { name: 'car', confidence: 0.8 }
        ];
        const matches = searchByTag(results, 'Person');
        expect(matches.length).toBe(1);
    });

    test('searchByTag returns empty for no matches', () => {
        const results = [
            { name: 'person', confidence: 0.9 },
            { name: 'car', confidence: 0.8 }
        ];
        const matches = searchByTag(results, 'xyz123');
        expect(matches.length).toBe(0);
    });
});

describe('Label Database', () => {
    
    test('COMMON_LABELS is not empty', () => {
        expect(COMMON_LABELS.length).toBeGreaterThan(0);
    });

    test('COMMON_LABELS contains expected categories', () => {
        expect(COMMON_LABELS).toContain('person');
        expect(COMMON_LABELS).toContain('car');
        expect(COMMON_LABELS).toContain('dog');
        expect(COMMON_LABELS).toContain('laptop');
        expect(COMMON_LABELS).toContain('pizza');
    });

    test('COMMON_LABELS has no duplicates', () => {
        const unique = new Set(COMMON_LABELS);
        expect(unique.size).toBe(COMMON_LABELS.length);
    });

    test('COMMON_LABELS are all lowercase', () => {
        COMMON_LABELS.forEach(label => {
            expect(label).toBe(label.toLowerCase());
        });
    });
});
