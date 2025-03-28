const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

const path = 'messages.txt';
const port = 8888;

const CD = 60e3;

let cooldown = {};
let messages = [];
let lid = Math.random();
getmessages();

const svr = http.createServer(async (req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  let un = username(req.socket.remoteAddress + req.headers['user-agent']);
  let body = [];
  if (req.method == 'POST') {
    await new Promise((y, n) => {
      req.on('data', x => {
        body.push(x);
      });
      req.on('end', () => {
        body = Buffer.concat(body);
        y();
      });
      req.on('close', n);
      req.on('error', n);
      setTimeout(n, 10e3);
    })
  }
  let url = req.url;
  if (url == '/send' && req.method == 'POST') {
    if (cooldown[un] && Date.now() - cooldown[un] < CD) {
      console.log(un, 'cooldown reached');
      return res.writeHead(429, '429 Too Many Requests').end('429 Too Many Requests');
    }
    body = un + ': ' + body.toString().replace('\n', '');
    console.log(un, 'sent', body);
    messages.push(body);
    cooldown[un] = Date.now();
    lid = Math.random();
    res.writeHead(200).end('true');
  } else if (url == '/get' && req.method == 'POST') {
    let cd = Date.now() - cooldown[un] < CD;
    if (body == lid && !cd) return res.writeHead(200).end();
    if (body != lid && !cd) console.log(un, 'got messages');
    res.writeHead(200).end((lid + cd ? 1 : 0) + ',' + un + '\n' + messages.slice(-50).join('\n') + 
      (cd ? 
        '\nCooldown reached, ' + 
          Math.floor((CD - Date.now() + cooldown[un]) / 1e3) + ' seconds left' : ''));
  } else {
    console.log(un, 'tried', req.url);
    res.writeHead(404, '404 Not Found').end('404 Not Found');
  }
});

svr.listen(port, () => {
  console.log('Server listening on port', port);
});

function getmessages() {
  try {
    fs.accessSync(path);
  } catch (e) {
    fs.writeFileSync(path, '', 'utf8');
    console.error('Created message file');
  }
  messages = fs.readFileSync(path, 'utf8').split('\n');
  console.log('Got messages');
}

function setmessages() {
  fs.writeFileSync(path, messages.join('\n'), 'utf8');
  console.log('Saved messages');
}

process.on('uncaughtException', e => console.error(e));
process.on('unhandledRejection', e => console.error(e));
process.on('SIGINT', () => { setmessages(); process.exit(0) });
process.on('beforeExit', setmessages);
setInterval(setmessages, 36e5);

function username(ip) {
  let h = crypto.createHash('sha256', {});
  h.update(ip);
  h = h.digest('base64');
  return h.slice(0, 4).replaceAll('/', '_').replaceAll('+', '-');
}