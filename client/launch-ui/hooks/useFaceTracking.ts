
import { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * Optimized Face Tracking Hook
 * Directly updates the overlay element's transform to avoid React render cycles.
 */
export function useFaceTracking(
    videoRef: React.RefObject<HTMLVideoElement | null>,
    overlayRef: React.RefObject<HTMLDivElement | null>
) {
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const requestRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);

    useEffect(() => {
        const initLandmarker = async () => {
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
            );
            faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                    delegate: "GPU"
                },
                outputFaceBlendshapes: false,
                runningMode: "VIDEO",
                numFaces: 1
            });
            detectFace();
        };

        initLandmarker();

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    const detectFace = () => {
        requestRef.current = requestAnimationFrame(detectFace);

        if (!faceLandmarkerRef.current || !videoRef.current || !overlayRef.current) {
            return;
        }

        const video = videoRef.current;
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            const now = performance.now();
            // Limit to ~30-60fps if needed, but for "ultra fast" let's run unlocked unless it lags
            const startTimeMs = now;

            const results = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                // Get coordinates for the forehead (approx landmark 10)
                const forehead = results.faceLandmarks[0][10];

                // Convert normalized coordinates to percentage
                const x = forehead.x * 100;
                const y = forehead.y * 100;

                // Direct DOM update for performance
                overlayRef.current.style.display = 'flex';
                // Using transform: translate3d for GPU acceleration
                // We set left/top to 0 and use translate to position relative to container
                overlayRef.current.style.left = `${x}%`;
                overlayRef.current.style.top = `${y - 15}%`; // -15% offset
            } else {
                // Hide if lost? Or keep last position
                // overlayRef.current.style.display = 'none';
            }
        }
    };
}
