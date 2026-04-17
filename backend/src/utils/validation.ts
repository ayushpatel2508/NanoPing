/**
 * Validates if the given string is a valid HTTP or HTTPS URL.
 * @param urlString The string to validate
 * @returns boolean
 */
export const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
};
