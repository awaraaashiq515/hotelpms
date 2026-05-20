/**
 * Retry wrapper for Gemini API calls with exponential backoff.
 * Handles transient 503 "Service Unavailable" errors from high demand.
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2 seconds initial delay

export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      const isRetryable =
        error?.status === 503 ||
        error?.status === 429 ||
        error?.message?.includes('503') ||
        error?.message?.includes('429') ||
        error?.message?.includes('high demand') ||
        error?.message?.includes('Resource has been exhausted') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `[Gemini Retry] Attempt ${attempt + 1}/${maxRetries} failed (${error?.status || 'unknown'}). Retrying in ${delay / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Extracts a user-friendly error message from Gemini API errors.
 */
export function getGeminiErrorMessage(error: any): string {
  if (error?.status === 503 || error?.message?.includes('503')) {
    return 'The AI service is currently experiencing high demand. Please try again in a few moments.';
  }
  if (error?.status === 429 || error?.message?.includes('429')) {
    return 'AI rate limit reached. Please wait a moment before trying again.';
  }
  if (error?.status === 400 || error?.message?.includes('400')) {
    return 'The image could not be processed. Please try a clearer image.';
  }
  if (error?.message?.includes('API_KEY')) {
    return 'AI API key is invalid or expired. Please check your settings.';
  }
  return error?.message || 'An unexpected AI error occurred. Please try again.';
}
