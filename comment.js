// const url = "http://localhost:8888/";
let un = null;

const $ = (x, y = document) => y.querySelector(x);
const $$ = (x, y = document) => y.querySelectorAll(x);
function html(a, ...c) {
  let d = document.createElement('x');
  let b = c.map(x => {
    d.innerText = x;
    return d.innerHTML;
  });
  return a.reduce((x, y, i) => x + y + (b[i] || ''), '');
}

let lid = null;
let cd = 0;

addEventListener('DOMContentLoaded', () => {
  $('#message').onkeypress = event => {
    if (event.key == 'Enter') {
      let value = $('#message').value;
      $('#message').value = '';
      if (!value) return;
      $('#comments').innerHTML = html`${un}: ${value}<br>` + $('#comments').innerHTML;
      api('send', value).then(getmsg);
    }
  };

  getmsg();
});

function api(loc, value) {
  let method = value ? 'POST' : 'GET';

  return fetch(url + loc, {
    method,
    body: value
  }).then(e => e.text()).catch(e => { console.error(e); return null });
}

function getmsg() {
  if (document.visibilityState == 'hidden') return;
  $('#comments').placeholder = 'Loading comments...';
  api('get', lid + '').then(a => {
    $('#comments').placeholder = '';
    if (!a) return;
    a = a.split('\n');
    un = a.shift();
    lid = un.match(/.*?(?=\,)/)?.[0] || null;
    un = un.replace(lid + ',', '');
    $('#comments').innerHTML = a.reverse().map(x => html`${x}`).join('<br>');
  });
}

setInterval(getmsg, 5e3);

//i forgor 💀