export type AlertAction = 'START_INCIDENT' | 'RESOLVE_INCIDENT' | 'NONE';

/**
 * Determines what action should be taken based on a monitor's current status,
 * consecutive failure count, and its alert threshold.
 * 
 * @param status 'up' | 'down'
 * @param consecutiveFailures Current count of consecutive failures
 * @param alertThreshold The threshold set for the monitor
 * @returns AlertAction
 */
export const getAlertDecision = (
  status: string,
  consecutiveFailures: number,
  alertThreshold: number
): AlertAction => {
  if (status === "down" && consecutiveFailures === alertThreshold) {
    return 'START_INCIDENT';
  }
  
  if (status === "up") {
    return 'RESOLVE_INCIDENT';
  }
  
  return 'NONE';
};
