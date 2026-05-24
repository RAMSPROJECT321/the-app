import { useState } from "react";
import { Pressable, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton } from "@/components/app-button";
import { AppText } from "@/components/app-text";
import { ErrorState } from "@/components/error-state";
import { TextField } from "@/components/text-field";
import { APP_MESSAGES, hasFirebaseConfig } from "@/constants/app";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { authService } from "@/services/auth/auth.service";
import type { AuthStackParamList } from "@/types/navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      await authService.signInAsync(email, password);
    } catch (error) {
      setErrorMessage(authService.mapAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Your workspace, synced and secure."
      description="Sign in to restore tasks, vault metadata, offline cache, and attachment sync."
    >
      {!hasFirebaseConfig ? (
        <ErrorState
          title="Firebase not configured"
          description={APP_MESSAGES.missingFirebaseConfig}
        />
      ) : null}

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
          placeholder="Enter your password"
        />
      </View>

      {errorMessage ? <AppText tone="danger">{errorMessage}</AppText> : null}

      <View className="gap-3">
        <AppButton
          label="Sign in"
          onPress={() => void handleSignIn()}
          loading={loading}
          disabled={!email.trim() || !password.trim()}
        />
        <AppButton
          label="Create an account"
          onPress={() => navigation.navigate("Register")}
          variant="secondary"
        />
      </View>

      <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
        <AppText tone="secondary">Forgot your password?</AppText>
      </Pressable>
    </AuthShell>
  );
};
