const APP_PREFIX = "[AegisFlow]";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitize = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitize(entry));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitize(entry)]),
    );
  }

  return value;
};

const emit = (
  level: "log" | "warn" | "error",
  scope: string,
  message: string,
  data?: unknown,
) => {
  if (!__DEV__) {
    return;
  }

  const label = `${APP_PREFIX} [${scope}] ${message}`;

  if (typeof data === "undefined") {
    console[level](label);
    return;
  }

  console[level](label, sanitize(data));
};

export const debugLogger = {
  log(scope: string, message: string, data?: unknown) {
    emit("log", scope, message, data);
  },
  warn(scope: string, message: string, data?: unknown) {
    emit("warn", scope, message, data);
  },
  error(scope: string, message: string, data?: unknown) {
    emit("error", scope, message, data);
  },
};
