import 'source-map-support/register'; // enable sourcemaps in node
import * as soundworks from 'soundworks/server';
import PlayerExperience from './PlayerExperience';

import defaultConfig from './config/default';
import productionConfig from './config/production';

import midiConfig from '../../data/midi-config';

// application services
import Midi from './services/Midi';

let config = null;

switch(process.env.ENV) {
  case 'production':
    config = productionConfig;
    break;
  default: // @todo - don't forget to uncomment that
    config = defaultConfig;
    // config = productionConfig;
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

// globals
sharedParams.addEnum('global:state', 'State', ['wait', 'compass', 'balloonsCover', 'killTheBalloons', 'intermezzo', 'avoidTheRain', 'scores', 'end'], 'wait');
sharedParams.addNumber('global:volume', 'Volume', 0, 1, 0.001, 1);

sharedParams.addEnum('global:shared-visual', 'Shared Visual - Add', ['none', 'gif:explodingBalloon', 'gif:flyingBalloons'], 'none');

sharedParams.addEnum('balloonCover:explode', 'BalloonCover - explode', ['none', 'blue', 'pink', 'yellow', 'red'], 'none');
// kill the balloons state controls
sharedParams.addNumber('killTheBalloons:spawnInterval', 'KillTheBalloons - spawnInterval', 0, 10, 0.001, 0.15);
sharedParams.addNumber('killTheBalloons:sizeDiversity', 'KillTheBalloons - sizeDiversity', 0, 1, 0.001, 0);
sharedParams.addEnum('killTheBalloons:samplesSet', 'KillTheBalloons - samplesSet', [0, 1, 2, 3, 4], 0);

// avoid the rain state controls
sharedParams.addEnum('avoidTheRain:harmony', 'AvoidTheRain - harmony', [
  'M15:0', 'M15:1', 'M15:2', 'M15:3',
  'M16:0', 'M16:1', 'M16:2', 'M16:3',
  'M17:0', 'M17:1', 'M17:2', 'M17:3',
  'M18:0', 'M18:1', 'M18:2', 'M18:3',
], 'M15:0');

sharedParams.addEnum('avoidTheRain:toggleRain', 'AvoidTheRain - toggleRain', ['stop', 'start'], 'stop');
sharedParams.addNumber('avoidTheRain:sineVolume', 'AvoidTheRain - sineVolume', 0, 1, 0.01, 1);
sharedParams.addNumber('avoidTheRain:balloonRadius', 'AvoidTheRain - balloonRadius', 40, 200, 1, 40);
sharedParams.addNumber('avoidTheRain:spawnInterval', 'AvoidTheRain - spawnInterval', 0, 1, 0.001, 1);

// score state
sharedParams.addText('score:status', 'Score - status', 'pending', 'controller');

sharedParams.addEnum('score:showGlobalScore', 'Score - showGlobalScore', ['hide', 'show'], 'hide');
sharedParams.addNumber('score:blue:transfertRatio', 'Score - Blue - transfertRatio', 0, 1, 0.01, 0);
sharedParams.addNumber('score:yellow:transfertRatio', 'Score - Yellow - transfertRatio', 0, 1, 0.01, 0);
sharedParams.addNumber('score:pink:transfertRatio', 'Score - Pink - transfertRatio', 0, 1, 0.01, 0);
sharedParams.addNumber('score:red:transfertRatio', 'Score - Red - transfertRatio', 0, 1, 0.01, 0);
sharedParams.addEnum('score:explode', 'Score - Explode', ['none', 'blue', 'pink', 'yellow', 'red'], 'none');


// ----------------------------------------------------
// run application
// ----------------------------------------------------

const experience = new PlayerExperience('player', midiConfig, winnersOrder);
const controller = new soundworks.BasicSharedController('controller');

soundworks.server.start();
