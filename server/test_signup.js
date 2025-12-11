const https = require('https');

const data = JSON.stringify({
  email: 'antigravity_test@gmail.com',
  password: 'password123',
  data: { full_name: 'Node User' }
});

const options = {
  hostname: 'ekgnhwlqvcdcqkzjkyhw.supabase.co',
  path: '/auth/v1/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZ25od2xxdmNkY3FrempreWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjcxNzQsImV4cCI6MjA4MDY0MzE3NH0.4JbFcGgVDhbbLZd2DaM2KiIEF59JlRsoyb1qIKUekWA'
  }
};

const req = https.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => {
    body += d;
  });
  res.on('end', () => {
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
