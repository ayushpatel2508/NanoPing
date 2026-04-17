import { describe, it, expect } from '@jest/globals';
import { getAlertDecision } from './alertLogic.js';

describe('getAlertDecision', () => {
  it('should return START_INCIDENT only when status is down and threshold is reached', () => {
    // Exactly threshold
    expect(getAlertDecision('down', 3, 3)).toBe('START_INCIDENT');
    expect(getAlertDecision('down', 1, 1)).toBe('START_INCIDENT');
    
    // Below threshold
    expect(getAlertDecision('down', 2, 3)).toBe('NONE');
    
    // Above threshold (already alerted)
    expect(getAlertDecision('down', 4, 3)).toBe('NONE');
  });

  it('should return RESOLVE_INCIDENT when status is up', () => {
    expect(getAlertDecision('up', 0, 3)).toBe('RESOLVE_INCIDENT');
    
    // Even if it was failing before, if it's up, we try to resolve
    expect(getAlertDecision('up', 5, 3)).toBe('RESOLVE_INCIDENT');
  });

  it('should return NONE when status is down but threshold is not met', () => {
    expect(getAlertDecision('down', 1, 3)).toBe('NONE');
    expect(getAlertDecision('down', 0, 3)).toBe('NONE');
  });

  it('should handle different alert thresholds correctly', () => {
    expect(getAlertDecision('down', 5, 5)).toBe('START_INCIDENT');
    expect(getAlertDecision('down', 4, 5)).toBe('NONE');
    expect(getAlertDecision('down', 6, 5)).toBe('NONE');
  });
});
