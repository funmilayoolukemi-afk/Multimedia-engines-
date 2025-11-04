import React, { useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createPcmBlob } from '../../utils/mediaUtils';
import { FeaturePanel, ActionButton } from '../ui';

export const LiveConversationPanel: React.FC = () => {
    const [isLive, setIsLive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sessionPromise = useRef<Promise<any> | null>(null);
    const audioContexts = useRef<{input: AudioContext, output: AudioContext} | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    const startConversation = async () => {
        setError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError('Your browser does not support audio input.');
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContexts.current = { input: inputAudioContext, output: outputAudioContext };

            let nextStartTime = 0;

            sessionPromise.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            sessionPromise.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && audioContexts.current) {
                            nextStartTime = Math.max(nextStartTime, audioContexts.current.output.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContexts.current.output, 24000, 1);
                            const source = audioContexts.current.output.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContexts.current.output.destination);
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                        }
                    },
                    onerror: (e: any) => setError(`Connection error: ${e.message}`),
                    onclose: () => console.log('Connection closed.'),
                },
                config: { responseModalities: [Modality.AUDIO] }
            });

            setIsLive(true);
        } catch (e: any) {
            setError(`Failed to start conversation: ${e.message}`);
        }
    };

    const stopConversation = () => {
        sessionPromise.current?.then(session => session.close());
        sessionPromise.current = null;
        
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;

        audioContexts.current?.input.close();
        audioContexts.current?.output.close();
        audioContexts.current = null;
        
        setIsLive(false);
    };

    return (
        <FeaturePanel title="Live Conversation" description="Speak directly with Gemini in a real-time, low-latency voice conversation.">
            <div className="text-center">
                {!isLive ? (
                    <ActionButton onClick={startConversation}>Start Conversation</ActionButton>
                ) : (
                    <ActionButton onClick={stopConversation} className="bg-red-600 hover:bg-red-700">Stop Conversation</ActionButton>
                )}
                {isLive && <p className="mt-4 text-green-400 animate-pulse font-semibold">● Live Conversation Active</p>}
            </div>
             {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </FeaturePanel>
    );
};
