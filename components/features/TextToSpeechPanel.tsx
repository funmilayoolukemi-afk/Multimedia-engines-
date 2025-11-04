import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decode, decodeAudioData } from '../../utils/mediaUtils';
import { FeaturePanel, TextArea, Select, ActionButton } from '../ui';

export const TextToSpeechPanel: React.FC = () => {
    const [text, setText] = useState('Hello! Welcome to the Gemini Multimedia Suite.');
    const [voice, setVoice] = useState('Kore');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    
    const handleSpeak = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
            } else {
                throw new Error("No audio data received.");
            }
        } catch (e: any) {
            setError(`TTS failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FeaturePanel title="Text-to-Speech" description="Convert text into natural-sounding speech with a selection of voices.">
            <TextArea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to speak..."
                rows={5}
            />
            <div className="flex items-center space-x-4">
                <label htmlFor="voice-select" className="font-bold text-white">Voice:</label>
                <Select id="voice-select" value={voice} onChange={(e) => setVoice(e.target.value)}>
                    {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map(v => <option key={v} value={v}>{v}</option>)}
                </Select>
            </div>
            <ActionButton onClick={handleSpeak} isLoading={isLoading}>
                Speak
            </ActionButton>
            {error && <p className="text-red-500 text-center">{error}</p>}
        </FeaturePanel>
    );
};
