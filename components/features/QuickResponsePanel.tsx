import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FeaturePanel, TextInput, ActionButton, ResultCard } from '../ui';

export const QuickResponsePanel: React.FC = () => {
    const [prompt, setPrompt] = useState('What is the speed of light?');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-flash-lite-latest',
                contents: prompt,
            });
            setResult(response.text);
        } catch (e: any) {
            setError(`Generation failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FeaturePanel title="Quick Response" description="Get low-latency answers for fast tasks using the Gemini Flash Lite model.">
             <div className="flex space-x-2">
                <TextInput
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask a quick question..."
                />
                <ActionButton onClick={handleGenerate} isLoading={isLoading} className="w-auto px-6">
                    Get Answer
                </ActionButton>
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {result && <ResultCard title="Response">{result}</ResultCard>}
        </FeaturePanel>
    );
};
