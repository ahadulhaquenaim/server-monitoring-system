import client from 'prom-client';
import responseTime from 'response-time';
import { createLogger } from 'winston';
import LokiTransport from 'winston-loki';
import dotenv from 'dotenv';

dotenv.config();

// ==================== LOGGER SETUP ====================
const logger = createLogger({
  transports: [
    new LokiTransport({
      host: `http://${process.env.MY_HOST}:3100`,
      labels: { job: 'node-app' }
    })
  ]
});

// ==================== PROMETHEUS METRICS SETUP ====================
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({register: client.register});

const reqResTime = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2.5, 5, 10]
});

const totalreq = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
});

// ==================== METRICS MIDDLEWARE ====================
const metricsMiddleware = responseTime((req, res, time) => {
  totalreq.inc();
  reqResTime.labels(req.method, req.path, res.statusCode).observe(time / 1000);
});

export {
  logger,
  metricsMiddleware,
  client
};
