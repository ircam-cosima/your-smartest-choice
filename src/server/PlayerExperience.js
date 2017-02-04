import { Experience } from 'soundworks/server';

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType, midiConfig, winnersResults) {
    super(clientType);

    this.checkin = this.require('checkin');
    this.sharedConfig = this.require('shared-config');
    this.sharedParams = this.require('shared-params');
    this.sync = this.require('sync');

    this.midi = this.require('midi', midiConfig);

    this.winnersResults = winnersResults;
    this.currentState = null;
  }

  start() {
    const keyboardOffset = this.sharedConfig.get('keyboardOffset');
    const BPM = this.sharedConfig.get('BPM');
    const beatDuration = 60 / BPM;

    this.midi.addListener('NOTE_ON', (pitch, velocity, msg) => {
      this.broadcast('player', null, 'note:on', pitch - keyboardOffset);
      console.log('NOTE_ON: ' + (pitch - keyboardOffset));
    });

    this.midi.addListener('NOTE_OFF', (pitch, velocity, msg) => {
      this.broadcast('player', null, 'note:off', pitch - keyboardOffset);
    });

    // defer state change to next beat
    this.sharedParams.addParamListener('global:state', (value) => {
      const syncTime =  this.sync.getSyncTime();
      const triggerAt = syncTime + beatDuration;
      this.currentState = value;

      this.broadcast('player', null, 'global:state', triggerAt, value);
    });
  }

  enter(client) {
    super.enter(client);

    this.send(client, 'global:state', null, this.currentState);

    // everything is faked now
    this.receive(client, 'player:score', () => {
      this.send(client, 'global:score', this.winnersResults);
    });
  }

  exit(client) {
    super.exit(client);
  }
}
