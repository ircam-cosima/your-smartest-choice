import { Experience } from 'soundworks/server';


const keyboardOffset = 11;
const bpm = 100;

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType, midiConfig, winnersOrder) {
    super(clientType);

    this.checkin = this.require('checkin');
    this.sharedConfig = this.require('shared-config');
    this.sharedParams = this.require('shared-params');
    this.sync = this.require('sync');

    this.midi = this.require('midi', midiConfig);

    this.currentState = null;

    // small model for global score
    this.globalScore = {
      realResults: { red: 0, blue: 0, pink: 0, yellow: 0 },
      fakeResults: {},
      nbrProcessed: 0,
      winnersOrder: winnersOrder,
      total: 0,
    };

    this.broadcastGlobalScoreTimeout = null;
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
    this.receive(client, 'player:score', this._onPlayerScore(client));
  }

  exit(client) {
    super.exit(client);
  }

  // process scores from the 2 games
  _onPlayerScore(client) {
    return (playerScore) => {
      const realResults = this.globalScore.realResults;
      let sum = 0;

      this.sharedParams.update('score:status', 'process');

      for (let color in playerScore) {
        realResults[color] += playerScore[color];
        sum += playerScore[color];
      }

      // just make sure that something realisitc will be broadcasted at some point
      if (this.globalScore.nbrProcessed === 0) {
        this.broadcastGlobalScoreTimeout = setTimeout(() => {
          this._broadcastGlobalScore();
        }, 2000);
      }

      this.globalScore.nbrProcessed += 1;
      this.globalScore.total += sum;

      if (this.globalScore.nbrProcessed >= this.clients.length) {
        // cancel the "big fail" timeout
        clearTimeout(this.broadcastGlobalScoreTimeout);
        this._broadcastGlobalScore();
      }
    }
  }

  _broadcastGlobalScore() {
    // make sure we broadcast only once...
    const { realResults, winnersOrder, fakeResults } = this.globalScore;
    // order real rsults by descending order
    const results = Object.values(realResults);
    results.sort((a, b) => b - a);
    // recreate fake results from real results
    winnersOrder.forEach((color, index) => fakeResults[color] = results[index]);

    this.broadcast('player', null, 'global:score', this.globalScore);
    this.sharedParams.update('score:status', 'broadcasted');
  }
}
