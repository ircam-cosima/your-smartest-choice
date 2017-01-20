import { Experience } from 'soundworks/server';

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType, midiConfig, winnersOrder) {
    super(clientType);

    this.checkin = this.require('checkin');
    this.sharedConfig = this.require('shared-config');
    this.sharedParams = this.require('shared-params');

    this.midi = this.require('midi', midiConfig);

    // small model for global score
    this.globalScore = {
      realResults: { red: 0, blue: 0, pink: 0, yellow: 0 },
      fakeResults: {},
      nbrProcessed: 0,
      winnersOrder: winnersOrder,
    };

    this.broadcastedGlobalScore = false;
    this.broadcastGlobalScoreTimeout = null;
  }

  start() {
    this.midi.addListener('NOTE_ON', (pitch, velocity, msg) => {
      this.broadcast('player', null, 'note:on', pitch);
    });

    this.midi.addListener('NOTE_OFF', (pitch, velocity, msg) => {
      this.broadcast('player', null, 'note:off', pitch);
    });
  }

  enter(client) {
    super.enter(client);
    // ...

    this.receive(client, 'player:score', this._onPlayerScore(client));
  }

  exit(client) {
    super.exit(client);
    // ...
  }

  // process scores from the 2 games
  _onPlayerScore(client) {
    return (playerScore) => {
      const realResults = this.globalScore.realResults;

      this.sharedParams.update('score:status', 'process');

      for (let color in playerScore)
        realResults[color] += playerScore[color];

      // just make sure that something realisitc will be broadcasted at some point
      if (this.globalScore.nbrProcessed === 0) {
        this.broadcastGlobalScoreTimeout = setTimeout(() => {
          this._broadcastGlobalScore();
        }, 2000);
      }

      this.globalScore.nbrProcessed += 1;

      if (this.globalScore.nbrProcessed >= this.clients.length) {
        // cancel the "big fail" timeout
        clearTimeout(this.broadcastGlobalScoreTimeout);
        this._broadcastGlobalScore();
      }
    }
  }

  _broadcastGlobalScore() {
    // make sure we broadcast only once...
    if (this.broadcastedGlobalScore === false) {
      const { realResults, winnersOrder, fakeResults } = this.globalScore;
      // order real rsults by descending order
      const results = Object.values(realResults);
      results.sort((a, b) => b - a);
      // recreate fake results from real results
      winnersOrder.forEach((color, index) => fakeResults[color] = results[index]);

      this.broadcast('player', null, 'global:score', this.globalScore);
      this.sharedParams.update('score:status', 'broadcasted');

      // flag as done
      // this.broadcastedGlobalScore = true;
    }
  }
}
