export interface SpeechResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechError {
  code: string;
  message: string;
}

export interface SpeechProviderListeners {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (result: SpeechResult) => void;
  onError?: (error: SpeechError) => void;
}

export interface SpeechProvider {
  isAvailable(): boolean;
  requestPermissionsAsync(): Promise<boolean>;
  start(): Promise<void>;
  stop(): void;
  abort(): void;
  subscribe(listeners: SpeechProviderListeners): () => void;
}
