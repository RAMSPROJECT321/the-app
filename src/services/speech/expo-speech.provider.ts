import { ExpoSpeechRecognitionModule } from "expo-speech-recognition";

import { APP_CONFIG } from "@/constants/app";
import type {
  SpeechProvider,
  SpeechProviderListeners,
} from "@/services/speech/speech.types";

type SpeechResultEvent = {
  isFinal: boolean;
  results: Array<{
    transcript: string;
    confidence: number;
  }>;
};

type SpeechErrorEvent = {
  error: string;
  message: string;
};

class ExpoSpeechProvider implements SpeechProvider {
  isAvailable() {
    return ExpoSpeechRecognitionModule.isRecognitionAvailable();
  }

  async requestPermissionsAsync() {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    return result.granted;
  }

  async start() {
    ExpoSpeechRecognitionModule.start({
      lang: APP_CONFIG.defaultLocale,
      interimResults: true,
      continuous: false,
      requiresOnDeviceRecognition: true,
      addsPunctuation: true,
      maxAlternatives: 1,
    });
  }

  stop() {
    ExpoSpeechRecognitionModule.stop();
  }

  abort() {
    ExpoSpeechRecognitionModule.abort();
  }

  subscribe(listeners: SpeechProviderListeners) {
    const subscriptions = [
      listeners.onStart
        ? ExpoSpeechRecognitionModule.addListener("start", listeners.onStart)
        : null,
      listeners.onEnd
        ? ExpoSpeechRecognitionModule.addListener("end", listeners.onEnd)
        : null,
      listeners.onResult
        ? ExpoSpeechRecognitionModule.addListener("result", (event: SpeechResultEvent) => {
            const topResult = event.results[0];

            if (!topResult) {
              return;
            }

            listeners.onResult?.({
              transcript: topResult.transcript,
              confidence: topResult.confidence,
              isFinal: event.isFinal,
            });
          })
        : null,
      listeners.onError
        ? ExpoSpeechRecognitionModule.addListener("error", (event: SpeechErrorEvent) => {
            listeners.onError?.({
              code: event.error,
              message: event.message,
            });
          })
        : null,
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription?.remove());
    };
  }
}

export const speechProvider = new ExpoSpeechProvider();
