import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64 } from '../../utils/mediaUtils';
import { FeaturePanel, FileInput, TextArea, ActionButton, ResultCard } from '../ui';

export const ImageEditingPanel: React.FC = () => {
    const [prompt, setPrompt] = useState('Add a small, friendly robot sitting on the grass.');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (file: File) => {
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        setResultImage(null);
    };

    const handleEdit = async () => {
        if (!image || !prompt.trim()) {
            setError('Please provide an image and an editing prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const base64Image = await fileToBase64(image);
            const imagePart = { inlineData: { mimeType: image.type, data: base64Image } };
            const textPart = { text: prompt };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: { responseModalities: [Modality.IMAGE] }
            });

            const imageResponsePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imageResponsePart?.inlineData) {
                const base64EditedImage = imageResponsePart.inlineData.data;
                const mimeType = imageResponsePart.inlineData.mimeType;
                setResultImage(`data:${mimeType};base64,${base64EditedImage}`);
            } else {
                throw new Error("The model did not return an image.");
            }
        } catch (e: any) {
            setError(`Image editing failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <FeaturePanel title="Image Editing" description="Upload an image and use a text prompt to edit it.">
            <FileInput onFileChange={handleFileChange} accept="image/*" />
            {imagePreview && <img src={imagePreview} alt="Original Preview" className="mx-auto rounded-lg max-h-64 border border-white/10" />}
            <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the edit you want to make..."
                rows={3}
            />
            <ActionButton onClick={handleEdit} isLoading={isLoading}>
                Edit Image
            </ActionButton>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {resultImage && (
                <ResultCard title="Edited Image">
                    <img src={resultImage} alt="Edited by AI" className="mx-auto rounded-lg border border-white/10" />
                     <a href={resultImage} download="edited-image.png" className="block text-center mt-4 text-gemini-blue-light hover:underline">Download Edited Image</a>
                </ResultCard>
            )}
        </FeaturePanel>
    );
};
