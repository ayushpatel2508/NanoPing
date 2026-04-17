import { describe, it, expect } from '@jest/globals';
import { isValidUrl } from './validation.js';

describe('isValidUrl', () => {
  it('should return true for valid https URLs', () => {
    expect(isValidUrl('https://google.com')).toBe(true);
    expect(isValidUrl('https://www.example.org/path?query=1')).toBe(true);
  });

  it('should return true for valid http URLs', () => {
    expect(isValidUrl('http://localhost:3000')).toBe(true);
    expect(isValidUrl('http://127.0.0.1')).toBe(true);
  });

  it('should return false for invalid protocols', () => {
    expect(isValidUrl('ftp://files.com')).toBe(false);
    expect(isValidUrl('ws://socket.com')).toBe(false);
    expect(isValidUrl('mailto:test@test.com')).toBe(false);
  });

  it('should return false for malformed URLs', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('http//missing-colon.com')).toBe(false);
    expect(isValidUrl('//missing-protocol.com')).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(isValidUrl('')).toBe(false);
  });
});
