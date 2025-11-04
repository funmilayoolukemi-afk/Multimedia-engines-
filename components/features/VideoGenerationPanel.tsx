import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { fileToBase64 } from '../../utils/mediaUtils';
import ApiKeyDialog from '../ApiKeyDialog';
import { FeaturePanel, TextArea, FileInput, Select, ActionButton, ResultCard } from '../ui';

export const VideoGenerationPanel: React.FC = () => {
    const [prompt, setPrompt] = useState('A majestic lion wearing a crown, cinematic, 4k');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false);
    const [hasSelectedKey, setHasSelectedKey] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('16:9');

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const result = await window.aistudio.hasSelectedApiKey();
                setHasSelectedKey(result);
            }
        };
        checkKey();
    }, []);
    
    const handleFileChange = (file: File) => {
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        
        if (!hasSelectedKey) {
            setIsKeyDialogOpen(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessage('Initializing video generation...');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const request: any = {
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: { 
                    numberOfVideos: 1, 
                    resolution: '720p', 
                    aspectRatio: aspectRatio as any
                }
            };
            
            if (image) {
                const base64Image = await fileToBase64(image);
                request.image = { imageBytes: base64Image, mimeType: image.type };
            }

            let operation = await ai.models.generateVideos(request);
            
            setLoadingMessage('Video is generating. This can take several minutes. Polling for status...');
            
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation: operation });
                setLoadingMessage(`Still generating... Progress will update periodically.`);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                 setLoadingMessage('Fetching generated video...');
                 const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                 const blob = await response.blob();
                 const url = URL.createObjectURL(blob);
                 setVideoUrl(url);
            } else {
                throw new Error('Video generation finished, but no download link was found.');
            }
        } catch (e: any) {
            if (e.message.includes('Requested entity was not found')) {
                setError('API key error. Please select your API key again.');
                setHasSelectedKey(false);
            } else {
                 setError(`Video generation failed: ${e.message}`);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    return (
        <FeaturePanel title="Video Generation" description="Create short videos from text prompts using Veo. You can optionally provide an image to guide the generation.">
            <ApiKeyDialog 
                isOpen={isKeyDialogOpen} 
                onClose={() => setIsKeyDialogOpen(false)}
                onKeySelect={() => {
                    setHasSelectedKey(true);
                    setIsKeyDialogOpen(false);
                    handleGenerate();
                }}
            />
            <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                rows={4}
            />
            <FileInput onFileChange={handleFileChange} accept="image/*" id="video-image-upload" />
            {imagePreview && <img src={imagePreview} alt="Starting image preview" className="mx-auto rounded-lg max-h-48 border border-white/10" />}
             <div className="flex items-center space-x-4">
                <label htmlFor="video-aspect-ratio-select" className="font-bold text-white">Aspect Ratio:</label>
                <Select id="video-aspect-ratio-select" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                    {["16:9", "9:16"].map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </div>
            <ActionButton onClick={handleGenerate} isLoading={isLoading}>
                Generate Video
            </ActionButton>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {isLoading && <p className="text-center text-gemini-grey-light">{loadingMessage}</p>}
            {videoUrl && (
                 <ResultCard title="Generated Video">
                     <video src={videoUrl} controls autoPlay className="w-full rounded-lg"></video>
                 </ResultCard>
            )}
        </FeaturePanel>
    );
};
