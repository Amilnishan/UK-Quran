const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 8000;
const root = process.cwd();

function sniffMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const baseMap = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.m4a': 'audio/mp4',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.webm': 'video/webm'
  };

  try {
    const chunk = fs.readFileSync(filePath).subarray(0, 4);
    const signature = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join('').toLowerCase();
    if (signature === '4f676753') {
      return 'audio/ogg';
    }
    if (signature.startsWith('494433')) {
      return 'audio/mpeg';
    }
  } catch (error) {
    // ignore and fall back to extension matching
  }

  return baseMap[ext] || 'application/octet-stream';
}

http.createServer((req, res) => {
  const safeUrl = decodeURI(req.url).split('?')[0].split('#')[0];
  const safe = path.normalize(safeUrl).replace(/^([\.]{2}[\/\\])+/g, '');
  let filePath = path.join(root, safe);
  if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.statusCode = 404;
      res.end('404 Not Found');
      return;
    }
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      fs.stat(filePath, (e, s) => {
        if (e || !s.isFile()) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        res.setHeader('Content-Type', sniffMimeType(filePath));
        fs.createReadStream(filePath).pipe(res);
      });
      return;
    }

    res.setHeader('Content-Type', sniffMimeType(filePath));
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(port, () => console.log(`Server started on http://localhost:${port}`));
