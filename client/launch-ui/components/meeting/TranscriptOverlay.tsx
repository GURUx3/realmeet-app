import { memo } from "react";

interface TranscriptOverlayProps {
    text: string;
}

function TranscriptOverlayComponent({ text }: TranscriptOverlayProps) {
    if (!text) return null;

    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-lg w-full px-4 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-center shadow-2xl border border-white/10 animate-in slide-in-from-bottom-4 fade-in duration-300">
                <p className="text-sm font-medium leading-relaxed font-mono opacity-90">
                    "{text}"
                </p>
            </div>
        </div>
    );
}

export const TranscriptOverlay = memo(TranscriptOverlayComponent);
