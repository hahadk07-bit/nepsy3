/**
 * Helper functions for preventing duplicate result posting
 */

const POSTING_KEY_PREFIX = "postingResult:";
const POSTED_KEY_PREFIX = "resultPosted:";

/**
 * Check if a result is already being posted or has been posted for a specific child and test
 */
export function isResultAlreadyPosted(
  childId: number,
  testKey: string
): boolean {
  const postingKey = `${POSTING_KEY_PREFIX}${testKey}:${childId}`;
  const postedKey = `${POSTED_KEY_PREFIX}${testKey}:${childId}`;

  return (
    sessionStorage.getItem(postingKey) === "1" ||
    sessionStorage.getItem(postedKey) === "1"
  );
}

/**
 * Mark that a result is being posted for a specific child and test
 */
export function markResultPosting(childId: number, testKey: string): void {
  const postingKey = `${POSTING_KEY_PREFIX}${testKey}:${childId}`;
  sessionStorage.setItem(postingKey, "1");
}

/**
 * Mark that a result has been successfully posted for a specific child and test
 */
export function markResultPosted(childId: number, testKey: string): void {
  const postingKey = `${POSTING_KEY_PREFIX}${testKey}:${childId}`;
  const postedKey = `${POSTED_KEY_PREFIX}${testKey}:${childId}`;

  sessionStorage.removeItem(postingKey);
  sessionStorage.setItem(postedKey, "1");
}

/**
 * Clear all deduplication flags (used when starting a new test session)
 */
export function clearAllDeduplicationFlags(): void {
  Object.keys(sessionStorage).forEach((key) => {
    if (
      key.startsWith(POSTING_KEY_PREFIX) ||
      key.startsWith(POSTED_KEY_PREFIX)
    ) {
      sessionStorage.removeItem(key);
    }
  });
}
