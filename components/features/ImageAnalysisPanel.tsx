import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { fileToBase64 } from '../../utils/mediaUtils';
import { FeaturePanel, FileInput, TextArea, ActionButton, ResultCard } from '../ui';

export const ImageAnalysisPanel: React.FC = () => {
    const [prompt, setPrompt] = useState('What do you see in this image?');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (file: File) => {
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleAnalyze = async () => {
        if (!image || !prompt.trim()) {
            setError('Please provide an image and a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const base64Image = await fileToBase64(image);
            const imagePart = { inlineData: { mimeType: image.type, data: base64Image } };
            const textPart = { text: prompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            });
            setResult(response.text);
        } catch (e: any) {
            setError(`Analysis failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <FeaturePanel title="Image Analysis" description="Upload an image and ask Gemini questions about it.">
            <FileInput onFileChange={handleFileChange} accept="image/*" />
            {imagePreview && <img src={imagePreview} alt="Preview" className="mx-auto rounded-lg max-h-64 border border-white/10" />}
            <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask a question about the image..."
                rows={3}
            />
            <ActionButton onClick={handleAnalyze} isLoading={isLoading}>
                Analyze Image
            </ActionButton>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {result && <ResultCard title="Analysis Result">{result}</ResultCard>}
        </FeaturePanel>
    );
};
