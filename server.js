import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFile = path.join(__dirname, 'server_log.txt');

// Initialize / clear log file
fs.writeFileSync(logFile, `Server started at ${new Date().toISOString()}\n__dirname is: ${__dirname}\n`);

function logMsg(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

const app = express();
const PORT = 3000;

// Request logger
app.use((req, res, next) => {
  logMsg(`[Request] ${req.method} ${req.url}`);
  next();
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// For all other routes, serve index.html
app.get('*', (req, res) => {
  logMsg(`[Fallback fallback to index.html for ${req.url}]`);
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  logMsg(`Server running on port ${PORT}`);
});


