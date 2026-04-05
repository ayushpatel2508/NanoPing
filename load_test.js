import { Trend, Rate } from 'k6/metrics';
import http from 'k6/http';
import { check, sleep } from 'k6';

// Custom metrics to track specific API performance
let dashboardSummaryTrend = new Trend('api_dashboard_summary');
let globalStatsTrend = new Trend('api_global_stats');
let errorRate = new Rate('error_rate');

// Configuration: Target the backend API directly for meaningful load testing
const BASE_URL = __ENV.API_URL || 'https://nano-ping.vercel.app/api'; 

export let options = {
    stages: [
        { duration: '30s', target: 20 },   // Ramp up to 20 users
        { duration: '1m', target: 20 },    // Stay at 20 users
        { duration: '15s', target: 0 },    // Ramp down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<2000'], // 95% of requests < 2s
        'api_dashboard_summary': ['avg<800'], // Summary should be fast
        'error_rate': ['rate<0.05'],         // Max 5% error rate
    },
};

export default function () {
    // 1. AUTHENTICATION: Get a token first
    // In a real load test, you'd use a pool of test users.
    let loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email: 'test@example.com',
        password: 'testpass123'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

    let token = loginRes.json('token');

    check(loginRes, {
        'login successful': (r) => r.status === 200,
    });

    if (loginRes.status !== 200) {
        errorRate.add(1);
        return;
    }
    errorRate.add(0);

    const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    // 2. DASHBOARD LOAD: Simulate the frontend loading the main dashboard
    // The frontend hits multiple endpoints in parallel or sequence.
    
    // Call 1: Summary Statistics
    let summaryRes = http.get(`${BASE_URL}/dashboard/summary`, { headers: authHeaders });
    dashboardSummaryTrend.add(summaryRes.timings.duration);
    check(summaryRes, { 'summary status is 200': (r) => r.status === 200 });

    // Call 2: Global Uptime Stats
    let globalStatsRes = http.get(`${BASE_URL}/dashboard/global-stats`, { headers: authHeaders });
    globalStatsTrend.add(globalStatsRes.timings.duration);
    check(globalStatsRes, { 'global stats status is 200': (r) => r.status === 200 });

    // Call 3: Detailed Monitor Stats
    let allMonitorStatsRes = http.get(`${BASE_URL}/dashboard/all-monitor-stats`, { headers: authHeaders });
    check(allMonitorStatsRes, { 'all monitor stats status is 200': (r) => r.status === 200 });

    // 3. EXPLORATION: Occasionally check a specific monitor's logs
    // We pick one monitor ID if the previous call returned any
    let monitors = allMonitorStatsRes.json('data') || [];
    if (monitors.length > 0) {
        let firstMonitorId = monitors[0].id;
        let checksRes = http.get(`${BASE_URL}/dashboard/${firstMonitorId}/checks?limit=20`, { headers: authHeaders });
        check(checksRes, { 'monitor checks status is 200': (r) => r.status === 200 });
    }

    // Realistic user think time (browsing the dashboard and charts)
    sleep(Math.random() * 3 + 2); // 2-5 seconds
}
