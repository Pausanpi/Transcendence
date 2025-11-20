const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Forward all /api requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://backend:9000', // backend container name + port
  changeOrigin: true
}));

app.listen(8080, () => {
  console.log('API Gateway listening on port 8080');
});
