import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMonitorStore } from './useMonitorStore';

// Mock the API modules
vi.mock('../api/monitors', () => ({
  monitorApi: {
    getMonitors: vi.fn(),
    createMonitor: vi.fn(),
    deleteMonitor: vi.fn(),
  },
}));

vi.mock('../api/dashboard', () => ({
  dashboardApi: {
    getSummaryStats: vi.fn(),
    getGlobalChecks: vi.fn(),
    getGlobalStats: vi.fn(),
    getGlobalIncidents: vi.fn(),
  },
}));

describe('useMonitorStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useMonitorStore.setState({
      monitors: [],
      summaryStats: null,
      globalChecks: [],
      globalStats: [],
      globalIncidents: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial state', () => {
    const state = useMonitorStore.getState();
    expect(state.monitors).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('updateMonitorStatus should correctly update monitor status and summary stats', () => {
    const monitorId = '123';
    useMonitorStore.setState({
      monitors: [
        { id: monitorId, name: 'Test', last_status: 'up', is_active: true }
      ],
      summaryStats: {
        monitors_up: '1',
        monitors_down: '0'
      }
    });

    const { updateMonitorStatus } = useMonitorStore.getState();
    
    // Status change from up to down
    updateMonitorStatus({ monitorId, last_status: 'down', consecutive_failures: 3 });

    const state = useMonitorStore.getState();
    expect(state.monitors[0].last_status).toBe('down');
    expect(state.summaryStats.monitors_up).toBe('0');
    expect(state.summaryStats.monitors_down).toBe('1');
  });

  it('addGlobalCheck should add a check and limit the list to 50', () => {
    const { addGlobalCheck } = useMonitorStore.getState();
    
    // Add 55 checks
    for (let i = 0; i < 55; i++) {
      addGlobalCheck({ id: i, status: 'up' });
    }

    const state = useMonitorStore.getState();
    expect(state.globalChecks.length).toBe(50);
    expect(state.globalChecks[0].id).toBe(54); // Last added is first (unshift)
  });
});
