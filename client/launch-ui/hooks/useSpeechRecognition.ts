import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionProps {
    onResult: (text: string, isFinal: boolean) => void;
    onError?: (error: any) => void;
}

export function useSpeechRecognition({ onResult, onError }: UseSpeechRecognitionProps) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const isActiveRef = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    setIsListening(true);
                    isActiveRef.current = true;
                };

                recognition.onend = () => {
                    setIsListening(false);
                    // Auto-restart if it was supposed to be active
                    if (isActiveRef.current) {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.log("Failed to restart recognition", e);
                        }
                    }
                };

                recognition.onresult = (event: any) => {
                    let interimTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        const transcript = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            onResult(transcript.trim(), true);
                        } else {
                            interimTranscript += transcript;
                            // Optionally send interim? For now we focus on final for accumulation
                        }
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error("Speech recognition error", event.error);
                    if (onError) onError(event.error);
                    if (event.error === 'not-allowed') {
                        isActiveRef.current = false;
                    }
                };

                recognitionRef.current = recognition;
            }
        }
    }, [onResult, onError]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isActiveRef.current) {
            try {
                recognitionRef.current.start();
                isActiveRef.current = true;
            } catch (e) {
                console.error("Start failed", e);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            isActiveRef.current = false;
            recognitionRef.current.stop();
        }
    }, []);

    return {
        isListening,
        startListening,
        stopListening,
        hasSupport: typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    };
}
