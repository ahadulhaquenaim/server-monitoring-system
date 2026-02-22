# Node.js Monitoring Stack with Grafana, Prometheus, and Loki

Complete observability stack for Node.js applications with automatic dashboard provisioning.

## 📊 Features

### Two Auto-Provisioned Dashboards:

1. **Node.js Application Dashboard**
   - HTTP Request Rate (requests/second)
   - Total Requests counter
   - Error Rate gauge (5xx errors)
   - Average Response Time by route
   - HTTP Status Code distribution
   - Response Time Percentiles (p50, p95, p99)
   - Requests by endpoint
   - Endpoint statistics table

2. **Application Logs Dashboard**
   - Live application logs stream
   - Log volume over time
   - Total logs counter
   - Error count
   - Filtered error logs
   - Error rate over time
   - HTTP request logs
   - Log distribution

## 🚀 Quick Start

### 1. Start the Stack

```bash
docker-compose up -d
```

Wait for all services to start (~30 seconds).

### 2. Access Services

- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin`
- **Prometheus**: http://localhost:9090
- **Node.js App**: http://localhost:3000
- **Loki**: http://localhost:3100

### 3. View Dashboards

Dashboards are automatically loaded! Go to:
- http://localhost:3001/d/nodejs-dashboard (Node.js Dashboard)
- http://localhost:3001/d/logs-dashboard (Logs Dashboard)

Or navigate: Grafana → Dashboards → Browse

### 4. Generate Test Traffic

Run the traffic generation script to populate your dashboards with data:

```bash
./generate-traffic.sh
```

This will:
- Hit various endpoints (health, error, heavy-task, 404s)
- Generate metrics for Prometheus
- Create log entries in Loki
- Provide data for all dashboard panels

## 📁 Project Structure

```
.
├── docker-compose.yml                    # Services orchestration
├── Dockerfile                            # Node.js app container
├── server.js                            # Express server
├── middleware.js                        # Metrics & logging middleware
├── router.js                            # API routes
├── prometheus-config.yml                # Prometheus scrape config
├── promtail-config.yml                  # Promtail log collection
├── loki-config.yaml/                    # Loki configuration
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasources.yml         # Auto-config Prometheus & Loki
│   │   └── dashboards/
│   │       └── dashboards.yml          # Dashboard provider config
│   └── dashboards/
│       ├── nodejs-dashboard.json       # Node.js metrics dashboard
│       └── logs-dashboard.json         # Logs dashboard
└── generate-traffic.sh                  # Traffic generation script
```

## 🔧 API Endpoints

- `GET /health` - Health check (returns 200)
- `GET /error` - Test error endpoint (returns 500)
- `GET /heavy-task` - Slow endpoint (5 second delay)
- `GET /metrics` - Prometheus metrics endpoint

## 📈 Metrics Collected

### HTTP Metrics:
- `http_requests_total` - Counter of total HTTP requests (labels: method, route, status_code)
- `http_request_duration_seconds` - Histogram of request duration (labels: method, route, status_code)

### Default Node.js Metrics:
- Memory usage
- CPU usage
- Event loop lag
- And more...

## 📝 Log Collection

Logs are sent to Loki with:
- **Job Label**: `node-app`
- **Format**: JSON structured logs
- **Includes**: HTTP method, path, status code, response time

## 🛠️ Configuration

### Environment Variables (.env)

```env
PORT=3000
MY_HOST=loki
```

### Grafana Credentials

Default credentials (change in docker-compose.yml):
- Username: `admin`
- Password: `admin`

## 🔍 Troubleshooting

### No data in dashboards?

1. **Generate traffic**:
   ```bash
   ./generate-traffic.sh
   ```

2. **Check services are running**:
   ```bash
   docker-compose ps
   ```
   All services should be "Up"

3. **Verify Prometheus is scraping**:
   - Go to http://localhost:9090/targets
   - "node-app:3000" should be UP

4. **Check Loki is receiving logs**:
   ```bash
   curl -G -s "http://localhost:3100/loki/api/v1/query" --data-urlencode 'query={job="node-app"}' | jq
   ```

5. **Restart the stack**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Dashboards not appearing?

1. Check Grafana logs:
   ```bash
   docker-compose logs grafana
   ```

2. Verify volume mounts:
   ```bash
   docker-compose exec grafana ls -la /etc/grafana/provisioning/dashboards
   docker-compose exec grafana ls -la /etc/grafana/dashboards
   ```

## 📊 Dashboard Panels Explained

### Node.js Dashboard:

1. **HTTP Request Rate** - Real-time requests per second by endpoint
2. **Total Requests** - Aggregate request count (last 5 min)
3. **Error Rate** - Percentage of 5xx errors
4. **Average Response Time** - Mean response time per route
5. **Status Code Distribution** - Pie chart of HTTP status codes
6. **Response Time Percentiles** - p50, p95, p99 latencies
7. **Requests by Endpoint** - Bar chart showing traffic per route
8. **Endpoint Statistics** - Table with detailed endpoint metrics

### Logs Dashboard:

1. **Live Application Logs** - Real-time log stream
2. **Log Volume** - Logs per minute over time
3. **Total Logs** - Count of logs (last 5 min)
4. **Errors** - Count of error logs (last 5 min)
5. **Error Logs** - Filtered view of error messages
6. **Error Rate** - Error frequency over time
7. **HTTP Request Logs** - Filtered HTTP access logs
8. **Log Distribution** - Pie chart of log sources

## 🔄 Update Dashboards

Dashboards are editable in Grafana UI. Changes are saved in Grafana's database.

To persist changes:
1. Edit dashboard in Grafana
2. Click Share → Export → Save to file
3. Replace the JSON file in `grafana/dashboards/`

## 🧹 Cleanup

Stop and remove all containers and volumes:

```bash
docker-compose down -v
```

## 📚 Technologies

- **Node.js** - Application runtime
- **Express** - Web framework
- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Loki** - Log aggregation
- **Promtail** - Log shipping agent
- **Docker** - Containerization

## 🎯 Next Steps

- Add authentication to your API
- Set up alerting rules in Grafana
- Add custom metrics for business logic
- Configure log rotation
- Set up persistent storage for production
- Add SSL/TLS termination
- Configure backup strategies

## 📖 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [prom-client (Node.js)](https://github.com/siimon/prom-client)

---

**Note**: This is a development setup. For production, ensure proper security, persistence, and backup configurations.
