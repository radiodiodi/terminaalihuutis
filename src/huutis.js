const blessed = require('blessed');
const WebSocket = require('ws');
const dateFormat = require('dateformat');
const os = require('os')

const args = process.argv.slice(2);
const nick = ((args.length > 0) ? args[0] : os.userInfo().username);

const ws = new WebSocket(
  'https://huutis.radiodiodi.fi/', 
  options={rejectUnauthorized:false}
);

ws.onmessage = evt => handleData(evt.data);
ws.onerror = evt => console.log(`Websocket error. Data: ${evt.data}`);
ws.onclose = () => setTimeout(this.connect, 1000);
 
const handleData = rawData => {
  const data = JSON.parse(rawData);
  if (data.initial) {
    initialBlast(data.initial);
  } else if (data.message) {
    addMessage(data.message);
  }
};

const initialBlast = initial => {
  initial.forEach((m) => addMessage(m));
  logi.add(`
    Terminaalihuutis
    https://radiodiodi.fi | 105,8Mhz
    https://github.com/radiodiodi/terminaalihuutis
    Choose nick by running: node huutis.js nick
    Quit by pressing Esc twice.
    `
  );
}

const addMessage = message => {
  const time = dateFormat(new Date(message.timestamp), 'HH:MM')
  const nick = '<{bold}' + message.name + '{/bold}>';
  const text = message.text;
  logi.add(time + ' ' + nick + ' ' + text)
}

const sendMessage = text => {
  ws.send(JSON.stringify({
    name: nick,
    text
  }));
}

const screen = blessed.screen({
  smartCSR: true,
  resizeTimeout: 1000
});

screen.title = 'Terminaalihuutis';

const layout = blessed.layout({
  parent: screen,
  width: '100%',
  height: '100%',
  style: {
    bg: 'white'
  }
});

const logi = blessed.log({
  parent: layout,
  width: '100%',
  height: '100%-2',
  shrink: true,
  tags: true,
  style: {
      bg: 'black'
  }
});

const statusBar = blessed.box({
  parent: layout,
  content: `Radiodiodi - 105,8 MHz | Nick: ${nick} | Quit: Esc + Esc`,
  width: '100%',
  height: 1,
  style: {
    bg: 'red'
  }
})

const field = blessed.textbox({
  parent: layout,
  height: 1,
  width: '100%',
  keys: true,
  inputOnFocus: true,  
  style: {
    bg: 'black'
  }
});

screen.key(['escape', 'C-c'], function(ch, key) {
  return process.exit(0);
});

screen.render();
field.focus()

field.on('submit', function(text) {
    if (!text || text.length === 0) {
      displayError("Oops! You forgot to include a message..");
    } else {
      sendMessage(text);
    }
    field.focus()
    field.clearValue()
});

const displayError = message => {
  text = "{red-fg}" + message + "{/}";
  logi.add(text)
};
