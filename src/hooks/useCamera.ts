import { useCallback, useEffect, useRef, useState } from "react";

type UseCameraOptions = {
  autoStart?: boolean;
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
};

type UseCameraResult = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isLoading: boolean;
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
};

export function useCamera(options: UseCameraOptions = {}): UseCameraResult {
  const {
    autoStart = false,
    width = 1280,
    height = 720,
    facingMode = "user",
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode,
        },
        audio: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setIsActive(true);
    } catch (err) {
      console.error(err);
      setError("Kon de camera niet starten.");
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [width, height, facingMode]);

  useEffect(() => {
    if (autoStart) {
      void startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [autoStart, startCamera, stopCamera]);

  return {
    videoRef,
    stream,
    isLoading,
    isActive,
    error,
    startCamera,
    stopCamera,
  };
}
