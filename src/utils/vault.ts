export const maskSecret = (value: string) => {
  if (!value) {
    return "Not set";
  }

  if (value.length <= 6) {
    return "•".repeat(value.length);
  }

  return `${"•".repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
};

export const buildVaultSecretKey = (userId: string, itemId: string) =>
  `${userId}:${itemId}`;
