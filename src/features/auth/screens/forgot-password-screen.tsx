import { useState } from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { TextField } from "@/components/text-field";
import { APP_MESSAGES } from "@/constants/app";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { authService } from "@/services/auth/auth.service";
import type { AuthStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await authService.sendPasswordResetAsync(email);
      setSuccessMessage(APP_MESSAGES.passwordResetSent);
    } catch (error) {
      setErrorMessage(authService.mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password."
      description="Use Firebase Auth email recovery to regain access without affecting offline cache on this device."
    >
      <View className="gap-4">
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
        />
      </View>

      {errorMessage ? <AppText tone="danger">{errorMessage}</AppText> : null}
      {successMessage ? <AppText tone="success">{successMessage}</AppText> : null}

      <View className="gap-3">
        <AppButton
          label="Send reset email"
          onPress={() => void handleReset()}
          loading={loading}
          disabled={!email.trim()}
        />
        <AppButton label="Back" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    </AuthShell>
  );
};
