# k6 Load Testing

## Project Structure

```
k6/
├── env.sh           # Auto-detects nodes from forge.toml
├── load-test.js     # Steady-state (warmup + constant rate)
├── ramp-up.js       # Find saturation point
├── spike.js         # Resilience test
├── per-node.js      # Direct per-node (bypass LB)
├── run-steady.sh
├── run-ramp.sh
├── run-spike.sh
└── run-per-node.sh
```

## Running

```bash
./k6/run-steady.sh              # 200 req/s for 2m
./k6/run-steady.sh 1000 5m      # 1000 req/s for 5m
./k6/run-steady.sh 1000 5m 45s  # Custom warmup
```

## Script Template

```javascript
import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const latency = new Trend('request_latency', true);

const nodes = (() => {
    const envNodes = __ENV.FORGE_NODES;
    if (envNodes) return envNodes.split(',').map(n => n.trim());
    const count = parseInt(__ENV.FORGE_NODE_COUNT || '5');
    const basePort = parseInt(__ENV.FORGE_BASE_PORT || '8070');
    return Array.from({length: count}, (_, i) => `http://localhost:${basePort + i}`);
})();

// Pin VU to node for HTTP keep-alive reuse
function vuNodeUrl(path) {
    return `${nodes[(__VU - 1) % nodes.length]}${path}`;
}

const headers = {'Content-Type': 'application/json'};

export const options = {
    scenarios: {
        warmup: {
            executor: 'ramping-arrival-rate',
            startRate: 20, timeUnit: '1s',
            stages: [{ duration: '30s', target: 200 }],
            preAllocatedVUs: 300, maxVUs: 3500,
            exec: 'mainScenario',
        },
        steady: {
            executor: 'constant-arrival-rate',
            rate: 200, timeUnit: '1s',
            duration: '2m', startTime: '30s',
            preAllocatedVUs: 300, maxVUs: 3500,
            exec: 'mainScenario',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<1000', 'p(99)<2000'],
        errors: ['rate<0.01'],
    },
};

export function mainScenario() {
    const url = vuNodeUrl('/api/v1/your-endpoint');
    const payload = JSON.stringify({ /* request body */ });
    const res = http.post(url, payload, { headers });
    latency.add(res.timings.duration);
    errorRate.add(!check(res, { 'status 200': (r) => r.status === 200 }));
}
```

## Key Patterns

- `vuNodeUrl()` — pins each VU to a node via round-robin for HTTP keep-alive
- `env.sh` — auto-detects node count and ports from `forge.toml`
- Warmup → steady-state → cooldown progression
- Custom metrics per operation type (separate Trend per endpoint)
