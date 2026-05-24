import { useEffect, useState } from "react";

import { speechProvider } from "@/services/speech/expo-speech.provider";

export const useVoiceDictation = (active: boolean) => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const unsubscribe = speechProvider.subscribe({
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onResult: (result) => {
        setTranscript(result.transcript);
      },
      onError: (nextError) => {
        setError(nextError.message);
        setIsListening(false);
      },
    });

    return () => {
      unsubscribe();
      speechProvider.abort();
      setIsListening(false);
    };
  }, [active]);

  const startListeningAsync = async () => {
    setError(null);

    if (!speechProvider.isAvailable()) {
      setError("Speech recognition is unavailable in this build or on this device.");
      return;
    }

    const granted = await speechProvider.requestPermissionsAsync();

    if (!granted) {
      setError("Microphone or speech recognition permission was not granted.");
      return;
    }

    await speechProvider.start();
  };

  const stopListening = () => {
    speechProvider.stop();
  };

  const reset = () => {
    setTranscript("");
    setError(null);
  };

  return {
    transcript,
    setTranscript,
    isListening,
    error,
    startListeningAsync,
    stopListening,
    reset,
  };
};
