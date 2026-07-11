const http = require('http');
// Use Marybe ID: 630f4624-c92a-4b83-a554-f371d0e2de4a
const data = JSON.stringify({
  locations: [
    { address: "Branch 1", map_url: "https://maps.app.goo.gl/WuNhfJ4LU9VPHE85A" },
    { address: "Branch 2", map_url: "" }
  ]
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/businesses/630f4624-c92a-4b83-a554-f371d0e2de4a',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
