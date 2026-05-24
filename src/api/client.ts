import { APP_CONFIG, APP_MESSAGES } from "@/constants/app";
import type { ApiEnvelope, ApiErrorShape, ApiResponse } from "@/types/api";

export class ApiClientError extends Error implements ApiErrorShape {
  code: ApiErrorShape["code"];
  status?: number;

  constructor({ code, message, status }: ApiErrorShape) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

class ApiClient {
  private readonly timeoutMs = 12_000;

  async post<TPayload, TResponse>(
    endpoint: string,
    envelope: ApiEnvelope<TPayload>,
  ) {
    if (!APP_CONFIG.googleAppsScriptBaseUrl) {
      throw new ApiClientError({
        code: "not_configured",
        message: APP_MESSAGES.missingAppsScript,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(APP_CONFIG.googleAppsScriptBaseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint,
          ...envelope,
        }),
        signal: controller.signal,
      });

      const payload = (await response.json()) as ApiResponse<TResponse>;

      if (!response.ok || !payload.success) {
        throw new ApiClientError({
          code:
            payload.error?.code === "validation"
              ? "validation"
              : response.status === 401
                ? "unauthorized"
                : "server",
          message: payload.error?.message ?? "The API request failed.",
          status: response.status,
        });
      }

      return payload;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new ApiClientError({
        code: "network",
        message: "Unable to reach the API layer.",
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const apiClient = new ApiClient();
