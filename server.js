const express = require('express');
const client = require('prom-client'); // Prometheus client for metrics
const responseTime = require('response-time'); // Middleware to measure response time
const {createLogger,transports} = require('winston'); // Winston logging library
const LokiTransport = require('winston-loki'); // Loki transport for Winston

require('dotenv').config() // Load environment variables from .env file
const app = express();
const PORT = 3000;


const logger = createLogger({
  transports: [
    new LokiTransport({
      host: `http://${process.env.MY_HOST}:3100`, // Loki server URL from environment variable
      labels: { job: 'node-app' }
    })
  ]
});

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({register: client.register}); // Collect default metrics (CPU, memory, etc.)


const reqResTime = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2.5, 5, 10] // Define buckets for response time (in seconds)
});

const totalreq = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
})

// Middleware
app.use(express.json());

// Middleware to measure response time
app.use(responseTime((req, res, time) => {
    totalreq.inc()
    reqResTime.labels(req.method, req.path, res.statusCode).observe(time / 1000); // Convert ms to seconds
}));

// Metrics route
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to fetch metrics',
      error: error.message
    });
  }
});

// Route 1: Simple GET route
app.get('/health', (req, res) => {
    logger.info('Health check endpoint hit');
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Route 2: Error route (returns an error)
app.get('/error', (req, res) => {
        logger.error('Error endpoint hit');
  res.status(500).json({
    status: 'ERROR',
    message: 'This is a test error route',
    error: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// Route 3: Heavy task route (waits for 5 seconds)
app.get('/heavy-task', async (req, res) => {
    logger.info('Heavy task endpoint hit');
  try {
    // Simulate a heavy task by waiting 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    res.status(200).json({
      status: 'OK',
      message: 'Heavy task completed after 5 seconds',
      duration: '5000ms',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Heavy task failed',
      error: error.message
    });
  }
});

// 404 route handler
app.use((req, res) => {
  res.status(404).json({
    status: 'NOT_FOUND',
    message: 'Route not found',
    path: req.path
  });
});



// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📍 Available routes:`);
  console.log(`   - GET /health (simple health check)`);
  console.log(`   - GET /error (returns an error)`);
  console.log(`   - GET /heavy-task (5 second response time)`);
});


// short lived scripts how to fetch metrics and log data from loki and prometheus
