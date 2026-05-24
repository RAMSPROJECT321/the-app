import { useState } from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { TextField } from "@/components/text-field";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { authService } from "@/services/auth/auth.service";
import type { AuthStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export const RegisterScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await authService.signUpAsync(email, password);
    } catch (error) {
      setErrorMessage(authService.mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create a private, resilient workspace."
      description="Email/password auth scopes Firestore data to each user and restores it across restarts."
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
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Create a password"
        />
        <TextField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholder="Re-enter the password"
        />
      </View>

      {errorMessage ? <AppText tone="danger">{errorMessage}</AppText> : null}

      <View className="gap-3">
        <AppButton
          label="Create account"
          onPress={() => void handleCreateAccount()}
          loading={loading}
          disabled={!email.trim() || !password.trim() || !confirmPassword.trim()}
        />
        <AppButton
          label="Back to sign in"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </View>
    </AuthShell>
  );
};
