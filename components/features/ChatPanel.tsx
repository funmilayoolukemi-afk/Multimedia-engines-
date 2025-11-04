import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { FeaturePanel, TextInput, ActionButton, ThinkingIndicator } from '../ui';
import { MicIcon } from '../IconComponents';

const CHAT_HISTORY_KEY = 'gemini_chat_history';

// Helper to load history from localStorage
const loadHistoryFromStorage = (): { role: string; parts: { text: string }[] }[] => {
    try {
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
        console.error("Failed to load chat history from localStorage", error);
        localStorage.removeItem(CHAT_HISTORY_KEY); // Clear corrupted data
        return [];
    }
};

export const ChatPanel: React.FC = () => {
    const [history, setHistory] = useState(loadHistoryFromStorage);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const chatInstance = useRef<Chat | null>(null);
    const chatHistoryRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    // Initialize Gemini Chat and Speech Recognition on component mount
    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            // Pass the loaded history to the chat instance to maintain context from the previous session
            chatInstance.current = ai.chats.create({ model: 'gemini-2.5-flash', history: history });
        } catch (e: any) {
            setError(`Failed to initialize Gemini: ${e.message}`);
        }
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setMessage(prev => prev + transcript);
            };
            recognitionRef.current.onerror = (event: any) => {
                let errorMessage = `Speech recognition error: ${event.error}`;
                if (event.error === 'not-allowed') {
                    errorMessage = "Microphone access denied. Please allow microphone permissions in your browser settings to use this feature.";
                } else if (event.error === 'no-speech') {
                    errorMessage = "No speech was detected. Please try again.";
                }
                setError(errorMessage);
                setIsListening(false);
            };
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Scroll to bottom of chat history when new messages are added
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [history]);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error("Failed to save chat history to localStorage", error);
        }
    }, [history]);
    
    const handleMicClick = () => {
        if (!recognitionRef.current) {
            setError("Speech recognition is not supported by your browser. Please type your message instead.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setError(null); // Clear previous errors before starting
            recognitionRef.current.start();
        }
    };

    const sendMessage = async () => {
        if (!message.trim() || !chatInstance.current) {
            if (!message.trim()) {
                setError("Cannot send an empty message.");
            }
            return;
        }
        
        const userMessageText = message;
        setMessage('');
        setIsLoading(true);
        setError(null);
        
        setHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessageText }] }]);

        try {
            const response = await chatInstance.current.sendMessage(userMessageText);
            const modelResponse = { role: 'model', parts: [{ text: response.text }] };
            setHistory(prev => [...prev, modelResponse]);
        } catch (e: any) {
            setError(`Failed to send message: ${e.message}`);
            // Revert the user's message from history on error
            setHistory(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearChat = () => {
        setHistory([]);
        // The useEffect for history will automatically update localStorage
        // Re-initialize the chat instance for a fresh context
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            chatInstance.current = ai.chats.create({ model: 'gemini-2.5-flash' });
            setError(null);
        } catch (e: any) {
            setError(`Failed to re-initialize Gemini: ${e.message}`);
        }
    };

    return (
        <FeaturePanel title="Chat" description="Have a conversation with Gemini. Your chat history is saved locally for your convenience.">
            <div className="flex justify-end -mb-4">
                <button
                    onClick={handleClearChat}
                    className="text-sm text-gemini-grey-light hover:text-white hover:underline transition-colors px-2 py-1"
                    aria-label="Clear chat history"
                >
                    Clear Chat
                </button>
            </div>
            <div ref={chatHistoryRef} className="h-96 overflow-y-auto p-4 bg-gemini-grey-darker rounded-lg space-y-4 border border-white/10">
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-prose p-3 rounded-lg ${msg.role === 'user' ? 'bg-gemini-blue-dark text-white' : 'bg-gemini-grey text-white'}`}>
                            <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-prose p-3 rounded-lg bg-gemini-grey text-white">
                           <ThinkingIndicator />
                        </div>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="flex items-center space-x-2">
                <TextInput
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && message.trim() && sendMessage()}
                    placeholder="Type your message or use the mic..."
                    disabled={isLoading}
                    aria-label="Chat input"
                />
                 <button 
                    onClick={handleMicClick}
                    className={`p-3 rounded-lg border border-gemini-grey transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gemini-grey-dark hover:bg-gemini-grey'}`}
                    disabled={isLoading}
                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                >
                    <MicIcon className="w-6 h-6 text-white" />
                </button>
                <ActionButton onClick={sendMessage} isLoading={isLoading} disabled={isLoading || !message.trim()} className="w-auto px-6">
                    Send
                </ActionButton>
            </div>
        </FeaturePanel>
    );
};