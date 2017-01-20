import 'source-map-support/register'; // enable sourcemaps in node
import * as soundworks from 'soundworks/server';
import PlayerExperience from './PlayerExperience';
import defaultConfig from './config/default';

import midiConfig from '../../data/midi-config';

// application services
import Midi from './services/Midi';

let config = null;

switch(process.env.ENV) {
  default:
    config = defaultConfig;
    break;
}

// configure express environment ('production' enables cache systems)
process.env.NODE_ENV = config.env;

soundworks.server.init(config);
soundworks.server.setClientConfigDefinition((clientType, config, httpRequest) => {
  return {
    clientType: clientType,
    env: config.env,
    appName: config.appName,
    websockets: config.websockets,
    version: config.version,
    defaultType: config.defaultClient,
    assetsDomain: config.assetsDomain,
  };
});


// order of the winners: pink should loose last (piano), etc...
const winnersOrder = ['pink', 'red', 'blue', 'yellow'];

// ----------------------------------------------------
// configure sharedParameters
// ----------------------------------------------------

const sharedParams = soundworks.server.require('shared-params');

// controle state of the application
sharedParams.addEnum('state', 'State', ['wait', 'compass', 'balloonsCover', 'killTheBalloons', 'intermezzo', 'avoidTheRain', 'scores', 'end'], 'wait');

// balloon cover state controls
sharedParams.addNumber('balloonCover:number', 'balloonCover:number', 0, 500, 1, 0);
sharedParams.addEnum('balloonCover:toggleBackground', 'balloonCover:toggleBackground', ['hide', 'show'], 'hide');
sharedParams.addEnum('balloonCover:explode', 'balloonCover:explode', ['blue', 'pink', 'yellow', 'red']);

// kill the balloons state controls
sharedParams.addEnum('killTheBalloons:start', 'killTheBalloons:start', ['stop', 'start'], 'stop');
sharedParams.addNumber('killTheBalloons:spawnInterval', 'killTheBalloons:spawnInterval', 0, 1, 0.001, 1);

// avoid the rain state controls
sharedParams.addEnum('avoidTheRain:start', 'avoidTheRain:start', ['stop', 'start'], 'stop');
sharedParams.addNumber('avoidTheRain:balloonRadius', 'avoidTheRain:balloonRadius', 40, 200, 1, 40);
sharedParams.addEnum('avoidTheRain:toggleRain', 'avoidTheRain:toggleRain', ['stop', 'start'], 'stop');
sharedParams.addNumber('avoidTheRain:spawnInterval', 'avoidTheRain:spawnInterval', 0, 1, 0.001, 1);

// score state
sharedParams.addText('score:status', 'score:status', 'pending', 'controller');

sharedParams.addEnum('score:showGlobalScore', 'score:showGlobalScore', ['hide', 'show'], 'hide');
sharedParams.addNumber('score:blue:transfertRatio', 'score:blue:transfertRatio', 0, 1, 0.01, 0);
sharedParams.addNumber('score:yellow:transfertRatio', 'score:yellow:transfertRatio', 0, 1, 0.01, 0);
sharedParams.addNumber('score:pink:transfertRatio', 'score:pink:transfertRatio', 0, 1, 0.01, 0);
sharedParams.addNumber('score:red:transfertRatio', 'score:red:transfertRatio', 0, 1, 0.01, 0);
sharedParams.addEnum('score:explode', 'score:explode', ['none', 'blue', 'pink', 'yellow', 'red'], 'none');


// ----------------------------------------------------
// run application
// ----------------------------------------------------

const experience = new PlayerExperience('player', midiConfig, winnersOrder);
const controller = new soundworks.BasicSharedController('controller');

soundworks.server.start();
