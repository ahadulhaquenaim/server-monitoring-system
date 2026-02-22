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
// Clear the registry to avoid duplicate metric registration
client.register.clear();

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
  labelNames: ['method', 'route', 'status_code']
});

// ==================== METRICS MIDDLEWARE ====================
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Capture the original end function
  const originalEnd = res.end;
  
  // Override the end function
  res.end = function(...args) {
    // Calculate duration
    const duration = (Date.now() - start) / 1000; // in seconds
    
    const method = req.method;
    const route = req.path;
    const statusCode = res.statusCode;
    
    console.log(`Recording metrics: ${method} ${route} ${statusCode} - ${duration}s`);
    
    // Record metrics
    totalreq.labels(method, route, statusCode).inc();
    reqResTime.labels(method, route, statusCode).observe(duration);
    
    // Log the request
    logger.info(`${method} ${route} ${statusCode} - ${(duration * 1000).toFixed(2)}ms`);
    
    // Call the original end function
    originalEnd.apply(res, args);
  };
  
  next();
};

export {
  logger,
  metricsMiddleware,
  client
};
