import * as LocalAuthentication from "expo-local-authentication";

export const biometricService = {
  async isAvailableAsync() {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);

    return hasHardware && isEnrolled;
  },
  async authenticateAsync(reason = "Unlock your secure vault") {
    const available = await this.isAvailableAsync();

    if (!available) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
      fallbackLabel: "Use device passcode",
    });

    return result.success;
  },
};
