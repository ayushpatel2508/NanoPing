import { describe, it, expect } from '@jest/globals';
import { isValidUrl, normalizeUrl } from './url.js';

describe('URL Utils', () => {
  describe('isValidUrl', () => {
    it('should return true for valid http/https URLs', () => {
      expect(isValidUrl('http://google.com')).toBe(true);
      expect(isValidUrl('https://example.org/path')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('google.com')).toBe(false); // No protocol
      expect(isValidUrl('ftp://server.com')).toBe(false); // Wrong protocol
      expect(isValidUrl('not-a-url')).toBe(false);
    });
  });

  describe('normalizeUrl', () => {
    it('should add http if protocol is missing', () => {
      expect(normalizeUrl('google.com')).toBe('http://google.com');
    });

    it('should remove trailing slash for root domains', () => {
      expect(normalizeUrl('https://google.com/')).toBe('https://google.com');
    });

    it('should handle paths correctly', () => {
      expect(normalizeUrl('https://google.com/search?q=test')).toBe('https://google.com/search');
    });
  });
});
