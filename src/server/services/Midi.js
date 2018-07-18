import { Service, serviceManager } from 'soundworks/server';
import jazz from 'jazz-midi';

const SERVICE_ID = 'service:midi';
const midi = new jazz.MIDI();

const NOTE_ON = 144;
const NOTE_OFF = 128;


class Midi extends Service {
  constructor() {
    super(SERVICE_ID);

    const defaults = {};

    this.configure(defaults);

    this.ports = new Map();
  }

  start() {
    for (let key in this.options) {
      const port = midi.MidiInOpen(this.options[key], this._onMessage(key));
      this.ports.set(key, port);

      console.log('----------------------------------------------------------');
      console.log(`Listening midi interface: ${key} (${this.options[key]})`);
      console.log('----------------------------------------------------------');
    }

    this.ready();
  }

  _onMessage(key) {
    return (t, msg) => {
      const [cmd, pitch, velocity] = msg;

      switch (cmd) {
        case NOTE_ON:
          this.emit('NOTE_ON', pitch, velocity, msg);
          break;
        case NOTE_OFF:
          this.emit('NOTE_OFF', pitch, velocity, msg);
          break;
      }
    };
  }
}

serviceManager.register(SERVICE_ID, Midi);

export default Midi;
