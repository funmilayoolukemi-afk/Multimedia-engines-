import React, { useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage } from '@google/genai';
import { createPcmBlob } from '../../utils/mediaUtils';
import { FeaturePanel, ActionButton, ResultCard } from '../ui';

export const AudioTranscriptionPanel: React.FC = () => {
    const [isLive, setIsLive] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const sessionPromise = useRef<Promise<any> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    const startTranscription = async () => {
        setError(null);
        setTranscript('');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Your browser does not support audio input.');
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = audioContext.createMediaStreamSource(stream);
                        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromise.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(audioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const text = message.serverContent?.inputTranscription?.text;
                        if (text) {
                            setTranscript(prev => prev + text);
                        }
                    },
                    onerror: (e: any) => setError(`Connection error: ${e.message}`),
                    onclose: () => console.log('Transcription connection closed.'),
                },
                config: { inputAudioTranscription: {} } // Enable input transcription
            });

            setIsLive(true);
        } catch (e: any) {
            setError(`Failed to start transcription: ${e.message}`);
        }
    };

    const stopTranscription = () => {
        sessionPromise.current?.then(session => session.close());
        sessionPromise.current = null;
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        audioContextRef.current?.close();
        audioContextRef.current = null;
        setIsLive(false);
    };

    return (
        <FeaturePanel title="Audio Transcription" description="Speak into your microphone and receive a real-time transcription of your voice.">
            <div className="text-center">
                {!isLive ? (
                    <ActionButton onClick={startTranscription}>Start Recording</ActionButton>
                ) : (
                    <ActionButton onClick={stopTranscription} className="bg-red-600 hover:bg-red-700">Stop Recording</ActionButton>
                )}
                 {isLive && <p className="mt-4 text-green-400 animate-pulse font-semibold">● Recording...</p>}
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            {transcript && <ResultCard title="Transcript">{transcript}</ResultCard>}
        </FeaturePanel>
    );
};
