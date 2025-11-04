import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BrainIcon } from '../IconComponents';
import { FeaturePanel, TextArea, ActionButton, ResultCard } from '../ui';

export const ComplexReasoningPanel: React.FC = () => {
    const [prompt, setPrompt] = useState('Explain the theory of relativity as if you were explaining it to a 10-year-old, using a simple analogy involving a train and a ball.');
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
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: {
                    thinkingConfig: { thinkingBudget: 32768 }
                }
            });
            setResult(response.text);
        } catch (e: any) {
            setError(`Generation failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FeaturePanel title="Complex Reasoning" description="Tackle complex problems with Gemini 2.5 Pro, enhanced with Thinking Mode for deeper analysis.">
            <div className="flex items-center justify-center gap-2 text-sm text-gemini-blue-light bg-gemini-blue-dark/20 px-3 py-1.5 rounded-full mb-4">
                <BrainIcon className="w-5 h-5"/>
                <span>Thinking Mode Enabled (Max Budget)</span>
            </div>
            <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a complex prompt..."
                rows={6}
            />
            <ActionButton onClick={handleGenerate} isLoading={isLoading}>
                Generate Response
            </ActionButton>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {result && <ResultCard title="Generated Response">{result}</ResultCard>}
        </FeaturePanel>
    );
};
