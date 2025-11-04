import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FeaturePanel, TextArea, ActionButton, ResultCard } from '../ui';

export const SummarizationPanel: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSummarize = async () => {
        if (!inputText.trim()) {
            setError('Please enter some text to summarize.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSummary('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Summarize the following text:\n\n${inputText}`,
            });
            setSummary(response.text);
        } catch (e: any) {
            setError(`Failed to generate summary: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <FeaturePanel title="Summarization" description="Provide a block of text and Gemini will generate a concise summary.">
            <TextArea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste the text you want to summarize here..."
                rows={8}
                disabled={isLoading}
            />
            <ActionButton onClick={handleSummarize} isLoading={isLoading}>
                Summarize
            </ActionButton>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {summary && <ResultCard title="Summary">{summary}</ResultCard>}
        </FeaturePanel>
    );
};
