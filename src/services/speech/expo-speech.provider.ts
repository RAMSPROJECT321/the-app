import { Platform } from "react-native";

import { APP_CONFIG } from "@/constants/app";
import type {
  SpeechProvider,
  SpeechProviderListeners,
} from "@/services/speech/speech.types";
import { debugLogger } from "@/utils/debug";

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

type ExpoSpeechRecognitionModuleType =
  typeof import("expo-speech-recognition").ExpoSpeechRecognitionModule;

let speechModule: ExpoSpeechRecognitionModuleType | null = null;
let speechModuleLoadFailed = false;
const androidSpeechServicePriority = [
  "com.google.android.tts",
  "com.google.android.googlequicksearchbox",
  "com.google.android.as",
] as const;

const getSpeechModule = () => {
  if (speechModuleLoadFailed) {
    return null;
  }

  if (speechModule) {
    return speechModule;
  }

  try {
    const speechPackage = require("expo-speech-recognition") as typeof import("expo-speech-recognition");
    speechModule = speechPackage.ExpoSpeechRecognitionModule;
    return speechModule;
  } catch (error) {
    speechModuleLoadFailed = true;
    console.warn("Voice recognition module is unavailable in this build.", error);
    return null;
  }
};

const supportsOnDeviceRecognitionAsync = async (
  module: ExpoSpeechRecognitionModuleType,
) => {
  if (Platform.OS === "ios") {
    return true;
  }

  try {
    const supportedLocales = await module.getSupportedLocales({});
    return supportedLocales.installedLocales.includes(APP_CONFIG.defaultLocale);
  } catch (error) {
    debugLogger.warn("voice", "unable to inspect installed speech locales", {
      error,
    });
    return false;
  }
};

const getInstalledLocalesForServiceAsync = async (
  module: ExpoSpeechRecognitionModuleType,
  androidRecognitionServicePackage?: string,
) => {
  try {
    const supportedLocales = await module.getSupportedLocales(
      androidRecognitionServicePackage
        ? {
            androidRecognitionServicePackage,
          }
        : {},
    );

    return supportedLocales.installedLocales;
  } catch (error) {
    debugLogger.warn("voice", "unable to inspect installed speech locales", {
      androidRecognitionServicePackage,
      error,
    });
    return [];
  }
};

const resolveAndroidRecognitionServiceAsync = async (
  module: ExpoSpeechRecognitionModuleType,
) => {
  const availableServices =
    typeof module.getSpeechRecognitionServices === "function"
      ? module.getSpeechRecognitionServices()
      : [];
  const defaultService =
    typeof module.getDefaultRecognitionService === "function"
      ? module.getDefaultRecognitionService()?.packageName
      : undefined;
  const orderedServices = Array.from(
    new Set(
      [defaultService, ...androidSpeechServicePriority].filter(
        (service): service is string => Boolean(service),
      ),
    ),
  ).filter((service) =>
    availableServices.length ? availableServices.includes(service) : true,
  );

  for (const service of orderedServices) {
    const installedLocales = await getInstalledLocalesForServiceAsync(module, service);

    if (installedLocales.includes(APP_CONFIG.defaultLocale)) {
      return {
        availableServices,
        defaultService,
        requiresOnDeviceRecognition: true,
        servicePackage: service,
      };
    }
  }

  return {
    availableServices,
    defaultService,
    requiresOnDeviceRecognition: false,
    servicePackage: defaultService ?? orderedServices[0],
  };
};

class ExpoSpeechProvider implements SpeechProvider {
  isAvailable() {
    const module = getSpeechModule();

    if (!module) {
      return false;
    }

    return module.isRecognitionAvailable();
  }

  async requestPermissionsAsync() {
    const module = getSpeechModule();

    if (!module) {
      return false;
    }

    const result = await module.requestPermissionsAsync();
    return result.granted;
  }

  async start() {
    const module = getSpeechModule();

    if (!module) {
      return;
    }

    if (Platform.OS === "ios") {
      const requiresOnDeviceRecognition = await supportsOnDeviceRecognitionAsync(module);
      debugLogger.log("voice", "starting speech recognition", {
        locale: APP_CONFIG.defaultLocale,
        platform: Platform.OS,
        requiresOnDeviceRecognition,
      });

      module.start({
        lang: APP_CONFIG.defaultLocale,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition,
        addsPunctuation: true,
        maxAlternatives: 1,
      });
      return;
    }

    const {
      availableServices,
      defaultService,
      requiresOnDeviceRecognition,
      servicePackage,
    } = await resolveAndroidRecognitionServiceAsync(module);

    debugLogger.log("voice", "starting speech recognition", {
      locale: APP_CONFIG.defaultLocale,
      platform: Platform.OS,
      requiresOnDeviceRecognition,
      defaultService,
      availableServices,
      servicePackage,
    });

    module.start({
      lang: APP_CONFIG.defaultLocale,
      interimResults: true,
      continuous: false,
      requiresOnDeviceRecognition,
      addsPunctuation: requiresOnDeviceRecognition,
      maxAlternatives: 1,
      androidRecognitionServicePackage: servicePackage,
    });
  }

  stop() {
    getSpeechModule()?.stop();
  }

  abort() {
    getSpeechModule()?.abort();
  }

  subscribe(listeners: SpeechProviderListeners) {
    const module = getSpeechModule();

    if (!module) {
      return () => undefined;
    }

    const subscriptions = [
      listeners.onStart
        ? module.addListener("start", listeners.onStart)
        : null,
      listeners.onEnd
        ? module.addListener("end", listeners.onEnd)
        : null,
      listeners.onResult
        ? module.addListener("result", (event: SpeechResultEvent) => {
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
        ? module.addListener("error", (event: SpeechErrorEvent) => {
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
