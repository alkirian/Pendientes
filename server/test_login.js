const https = require('https');

const data = JSON.stringify({
  email: 'backdoor@test.com',
  password: 'password123'
});

const options = {
  hostname: 'ekgnhwlqvcdcqkzjkyhw.supabase.co',
  path: '/auth/v1/token?grant_type=password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZ25od2xxdmNkY3FrempreWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjcxNzQsImV4cCI6MjA4MDY0MzE3NH0.4JbFcGgVDhbbLZd2DaM2KiIEF59JlRsoyb1qIKUekWA'
  }
};

const req = https.request(options, (res) => {
  console.log(`LOGIN STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (d) => {
    body += d;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
        const responseData = JSON.parse(body);
        const token = responseData.access_token;
        console.log('Got Token.');
        
        // Fetch Projects
        const projectOptions = {
            hostname: 'ekgnhwlqvcdcqkzjkyhw.supabase.co',
            path: '/rest/v1/projects?select=*',
            method: 'GET',
            headers: {
                'apikey': options.headers.apikey,
                'Authorization': `Bearer ${token}`
            }
        };
        
        const projReq = https.request(projectOptions, (pRes) => {
            console.log(`PROJECTS STATUS: ${pRes.statusCode}`);
            let pBody = '';
            pRes.on('data', (d) => pBody += d);
            pRes.on('end', () => console.log('PROJECTS:', pBody));
        });
        projReq.end();

        // Fetch Tasks (My Tasks)
        const taskOptions = {
            hostname: 'ekgnhwlqvcdcqkzjkyhw.supabase.co',
            path: '/rest/v1/tasks?select=*',
            method: 'GET',
            headers: {
                'apikey': options.headers.apikey,
                'Authorization': `Bearer ${token}`
            }
        };

        const taskReq = https.request(taskOptions, (tRes) => {
            console.log(`TASKS STATUS: ${tRes.statusCode}`);
            let tBody = '';
            tRes.on('data', (d) => tBody += d);
            tRes.on('end', () => console.log('TASKS:', tBody));
        });
        taskReq.end();

    } else {
        console.log('Login Failed:', body);
    }
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
