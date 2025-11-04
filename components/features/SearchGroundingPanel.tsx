import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { FeaturePanel, TextInput, ActionButton, ResultCard } from '../ui';

export const SearchGroundingPanel: React.FC = () => {
    const [query, setQuery] = useState('Who won the latest major F1 race?');
    const [result, setResult] = useState<GenerateContentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: query,
                config: { tools: [{ googleSearch: {} }] },
            });
            setResult(response);
        } catch (e: any) {
            setError(`Search failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <FeaturePanel title="Search Grounding" description="Ask questions about recent events. Gemini will use Google Search to provide up-to-date answers and cite its sources.">
            <div className="flex space-x-2">
                <TextInput
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question..."
                />
                <ActionButton onClick={handleSearch} isLoading={isLoading} className="w-auto px-6">
                    Search
                </ActionButton>
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {result && (
                <ResultCard title="Grounded Response">
                    <p>{result.text}</p>
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="font-bold text-white">Sources:</h4>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            {result.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk, i) => (
                                'web' in chunk && <li key={i}><a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-gemini-blue-light hover:underline">{chunk.web.title}</a></li>
                            ))}
                        </ul>
                    </div>
                </ResultCard>
            )}
        </FeaturePanel>
    );
};
