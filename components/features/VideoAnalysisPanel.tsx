import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { fileToBase64 } from '../../utils/mediaUtils';
import { FeaturePanel, FileInput, TextArea, ActionButton, ResultCard } from '../ui';

export const VideoAnalysisPanel: React.FC = () => {
    const [video, setVideo] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('Describe what is happening in this sequence of frames from a video.');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('');

    const handleFileChange = (file: File) => {
        setVideo(file);
    };

    const handleAnalyzeVideo = async () => {
        if (!video || !prompt) {
            setError('Please upload a video and enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult('');
        setStatus('Extracting frames from video...');

        try {
            const frames = await extractFramesFromVideo(video, 5); // Extract 5 frames
            setStatus('Frames extracted. Analyzing with Gemini...');
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const imageParts = await Promise.all(frames.map(async (frame) => {
                const base64Frame = await fileToBase64(frame);
                return { inlineData: { mimeType: frame.type, data: base64Frame } };
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: { parts: [{ text: prompt }, ...imageParts] },
            });
            
            setResult(response.text);

        } catch (e: any) {
            setError(`Video analysis failed: ${e.message}`);
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    };
    
    // Helper function to extract frames from a video file
    const extractFramesFromVideo = (videoFile: File, frameCount: number): Promise<File[]> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const frames: File[] = [];
            
            video.src = URL.createObjectURL(videoFile);
            video.muted = true;

            video.onloadedmetadata = async () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const duration = video.duration;
                const interval = duration / frameCount;

                for (let i = 0; i < frameCount; i++) {
                    video.currentTime = i * interval;
                    await new Promise(r => video.onseeked = r);
                    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg');
                    const blob = await (await fetch(dataUrl)).blob();
                    frames.push(new File([blob], `frame_${i}.jpg`, { type: 'image/jpeg' }));
                }
                URL.revokeObjectURL(video.src);
                resolve(frames);
            };
            video.onerror = (e) => {
                URL.revokeObjectURL(video.src);
                reject(new Error('Failed to load video file.'));
            }
        });
    };

    return (
        <FeaturePanel title="Video Analysis" description="Upload a short video to extract and analyze key frames using Gemini 2.5 Pro.">
            <FileInput onFileChange={handleFileChange} accept="video/*" />
            {video && <p className="text-center text-sm">Selected: {video.name}</p>}
            <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should I look for in the video?"
                rows={3}
            />
            <ActionButton onClick={handleAnalyzeVideo} isLoading={isLoading}>
                Analyze Video
            </ActionButton>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {isLoading && <p className="text-center text-gemini-grey-light">{status}</p>}
            {result && <ResultCard title="Video Analysis Result">{result}</ResultCard>}
        </FeaturePanel>
    );
};
