/**
 * Redirect Server for LearnJoy
 * 
 * This is an optional Node.js server that provides dynamic redirect
 * to the current ngrok URL. Run this on a separate always-on server
 * (like a free Render/Railway/Fly.io instance) so users always have
 * a stable URL to access.
 * 
 * Usage: node redirect-server.js
 * Or with custom port: PORT=8080 node redirect-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const URL_FILE = path.join(__dirname, 'current-ngrok-url.txt');
const HISTORY_FILE = path.join(__dirname, 'ngrok-url-history.json');

// Read current ngrok URL
function getCurrentUrl() {
    try {
        if (fs.existsSync(URL_FILE)) {
            return fs.readFileSync(URL_FILE, 'utf8').trim();
        }
    } catch (err) {
        console.error('Error reading URL file:', err);
    }
    return null;
}

// Read URL history
function getHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading history file:', err);
    }
    return [];
}

// Update current URL (API endpoint)
function updateUrl(newUrl) {
    try {
        fs.writeFileSync(URL_FILE, newUrl);
        
        // Update history
        const history = getHistory();
        const entry = {
            url: newUrl,
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        };
        history.push(entry);
        
        // Keep last 10 entries
        const trimmedHistory = history.slice(-10);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(trimmedHistory, null, 2));
        
        return true;
    } catch (err) {
        console.error('Error updating URL:', err);
        return false;
    }
}

// Generate redirect HTML
function getRedirectHtml(url) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=${url}">
    <title>Redirecting to LearnJoy...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container { text-align: center; padding: 2rem; }
        .spinner {
            width: 50px; height: 50px;
            border: 5px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        a { color: white; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Redirecting to LearnJoy...</h2>
        <p>If not redirected, <a href="${url}">click here</a></p>
    </div>
    <script>window.location.href = "${url}";</script>
</body>
</html>`;
}

// Error page when no URL is available
function getErrorHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="30">
    <title>LearnJoy - Service Starting...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
        }
        .container { text-align: center; padding: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🚀 LearnJoy is starting up...</h2>
        <p>The service is not available yet. This page will refresh automatically.</p>
        <p style="font-size: 0.8rem; opacity: 0.7;">Please wait a moment...</p>
    </div>
</body>
</html>`;
}

// Create HTTP server
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // API endpoint to get current URL
    if (url.pathname === '/api/url') {
        const currentUrl = getCurrentUrl();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: currentUrl, timestamp: new Date().toISOString() }));
        return;
    }
    
    // API endpoint to update URL (protected by simple key)
    if (url.pathname === '/api/update' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const key = process.env.UPDATE_KEY || 'learnjoy-secret';
                
                if (data.key !== key) {
                    res.writeHead(403, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid key' }));
                    return;
                }
                
                if (updateUrl(data.url)) {
                    console.log(`URL updated to: ${data.url}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, url: data.url }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to update URL' }));
                }
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }
    
    // API endpoint to get history
    if (url.pathname === '/api/history') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(getHistory()));
        return;
    }
    
    // Health check
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
    }
    
    // Main redirect
    const currentUrl = getCurrentUrl();
    
    if (currentUrl) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getRedirectHtml(currentUrl));
    } else {
        res.writeHead(503, { 'Content-Type': 'text/html' });
        res.end(getErrorHtml());
    }
});

server.listen(PORT, () => {
    console.log(`
=========================================
  LearnJoy Redirect Server
=========================================
  Running on port: ${PORT}
  
  Endpoints:
  - GET  /          → Redirect to current ngrok URL
  - GET  /api/url   → Get current URL as JSON
  - POST /api/update → Update URL (requires key)
  - GET  /api/history → Get URL history
  - GET  /health    → Health check
=========================================
`);
});
