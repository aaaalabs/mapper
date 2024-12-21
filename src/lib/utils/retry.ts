interface RetryOptions {
  retries: number;
  minTimeout: number;
  maxTimeout: number;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise that resolves with the function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, minTimeout, maxTimeout, onRetry } = options;
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        Math.max(
          minTimeout * Math.pow(2, attempt - 1),
          minTimeout
        ),
        maxTimeout
      );
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
