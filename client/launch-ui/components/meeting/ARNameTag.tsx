
import { useRef } from 'react';
import { useFaceTracking } from '@/hooks/useFaceTracking';
import { cn } from '@/lib/utils';

interface ARNameTagProps {
    name: string;
    role: string;
    activity?: string; // Kept in props for compatibility but not used or used minimally
    videoRef: React.RefObject<HTMLVideoElement | null>;
    className?: string;
}

export const ARNameTag = ({ name, role, videoRef, className }: ARNameTagProps) => {
    const overlayRef = useRef<HTMLDivElement>(null);

    // Pass overlayRef to hook for direct updates
    useFaceTracking(videoRef, overlayRef);

    return (
        <div
            ref={overlayRef}
            className={cn(
                "absolute z-20 pointer-events-none flex flex-col items-center will-change-transform hidden", // Hidden initially until tracked
                className
            )}
            style={{
                // Initial styles, will be overridden by hook
                transform: 'translate(-50%, -100%)'
            }}
        >
            {/* Minimalist Transparent Bar */}
            <div className="flex flex-col items-center">
                {/* No vertical line, floating directly */}

                <div className="relative overflow-hidden rounded-full border border-white/10 bg-black/20 backdrop-blur-sm px-6 py-2 min-w-[200px] text-center shadow-sm">
                    {/* Very subtle wide gradient */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent opacity-30" />

                    <div className="relative z-10 flex flex-row items-center justify-center gap-3">
                        <h3 className="text-base font-semibold text-white/90 leading-none tracking-tight shadow-black drop-shadow-sm whitespace-nowrap">
                            {name}
                        </h3>
                        <div className="h-3 w-px bg-white/20" />
                        <p className="text-sm font-medium text-blue-200/80 uppercase tracking-wide whitespace-nowrap">
                            {role}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
