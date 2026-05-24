import { Mic, Sparkles } from "lucide-react-native";
import { Modal, Pressable, View } from "react-native";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { Card } from "@/components/card";
import { TextField } from "@/components/text-field";
import { useVoiceDictation } from "@/features/voice/hooks/use-voice-dictation";

interface VoiceCaptureSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (transcript: string) => void;
}

export const VoiceCaptureSheet = ({
  visible,
  onClose,
  onApply,
}: VoiceCaptureSheetProps) => {
  const {
    transcript,
    setTranscript,
    isListening,
    error,
    startListeningAsync,
    stopListening,
    reset,
  } = useVoiceDictation(visible);

  const handleApply = () => {
    const cleaned = transcript.trim();

    if (!cleaned) {
      return;
    }

    onApply(cleaned);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal animationType="slide" presentationStyle="overFullScreen" transparent visible={visible}>
      <Pressable className="flex-1 bg-overlay/45" onPress={handleClose}>
        <View className="mt-auto px-4 pb-6">
          <Pressable onPress={() => undefined}>
            <Card className="gap-5 rounded-[32px] px-5 py-6">
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1 gap-2">
                  <View className="flex-row items-center gap-2">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft">
                      <Sparkles color="#3778FF" size={18} strokeWidth={2.2} />
                    </View>
                    <AppText variant="title">Voice capture</AppText>
                  </View>
                  <AppText tone="secondary">
                    Speak naturally, review the transcript, then edit before saving.
                  </AppText>
                </View>
              </View>

              <View className="flex-row items-center justify-between rounded-3xl bg-background-muted px-4 py-4">
                  <View className="flex-row items-center gap-3">
                  <Mic color="#3778FF" size={18} strokeWidth={2.2} />
                  <AppText variant="bodyStrong">
                    {isListening ? "Listening…" : "Ready to capture"}
                  </AppText>
                </View>
                <AppButton
                  label={isListening ? "Stop" : "Start"}
                  onPress={() =>
                    isListening ? stopListening() : void startListeningAsync()
                  }
                  icon={Mic}
                  variant={isListening ? "secondary" : "primary"}
                  className="min-h-11 px-4"
                />
              </View>

              <TextField
                label="Transcript"
                multiline
                value={transcript}
                onChangeText={setTranscript}
                placeholder="Your transcription will appear here."
                hint={error ?? "You can edit the text before committing it."}
              />

              <View className="flex-row gap-3">
                <AppButton
                  label="Cancel"
                  onPress={handleClose}
                  variant="secondary"
                  className="flex-1"
                />
                <AppButton label="Use transcript" onPress={handleApply} className="flex-1" />
              </View>
            </Card>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};
