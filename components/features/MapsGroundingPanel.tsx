import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { FeaturePanel, TextInput, ActionButton, ResultCard } from '../ui';

export const MapsGroundingPanel: React.FC = () => {
    const [query, setQuery] = useState('Are there any good coffee shops near me?');
    const [result, setResult] = useState<GenerateContentResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: query,
                    config: { 
                        tools: [{ googleMaps: {} }],
                        toolConfig: { retrievalConfig: { latLng: { latitude, longitude } } }
                    },
                });
                setResult(response);
            } catch (e: any) {
                setError(`Search failed: ${e.message}`);
            } finally {
                setIsLoading(false);
            }
        }, (geoError) => {
            setError(`Geolocation error: ${geoError.message}. Please grant location permission.`);
            setIsLoading(false);
        });
    };
    
    return (
        <FeaturePanel title="Maps Grounding" description="Ask location-based questions. Your browser will ask for location permission to provide relevant results grounded in Google Maps.">
             <div className="flex space-x-2">
                <TextInput
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a location-based question..."
                />
                <ActionButton onClick={handleSearch} isLoading={isLoading} className="w-auto px-6">
                    Search
                </ActionButton>
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {result && (
                 <ResultCard title="Grounded Response">
                    <p>{result.text}</p>
                 </ResultCard>
            )}
        </FeaturePanel>
    );
};
