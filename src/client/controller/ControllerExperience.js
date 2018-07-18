import { Experience, View } from 'soundworks/client';
import SharedParamsComponent from './SharedParamsComponent';
import LogComponent from './LogComponent';

const template = `
  <div id="shared-params"></div>
  <div id="log"></div>
`;

class ControllerExperience extends Experience {
  constructor(options = {}) {
    super();

    this.sharedParams = this.require('shared-params');
    this.sharedParamsComponent = new SharedParamsComponent(this, this.sharedParams);
    this.logComponent = new LogComponent(this);

    this.setGuiOptions('numPlayers', { readonly: true });

    this.setGuiOptions('global:state', { type: 'buttons' });
    this.setGuiOptions('global:volume', { type: 'slider', size: 'large' });
    this.setGuiOptions('global:shared-visual', { type: 'buttons' });

    // compass
    this.setGuiOptions('compass:instructions', { type: 'buttons' });

    // balloon cover
    this.setGuiOptions('balloonCover:explode', { type: 'buttons' });

    // kill the balloons
    this.setGuiOptions('killTheBalloons:spawnInterval', { type: 'slider', size: 'large', });
    this.setGuiOptions('killTheBalloons:sizeDiversity', { type: 'slider', size: 'large', });
    this.setGuiOptions('killTheBalloons:samplesSet', { type: 'buttons' });
    this.setGuiOptions('killTheBalloons:showText', { type: 'buttons' });
    this.setGuiOptions('killTheBalloons:clickColorText', { type: 'buttons' });

    // avoid the rain
    this.setGuiOptions('avoidTheRain:balloonRadius', { type: 'slider', size: 'large' });
    this.setGuiOptions('avoidTheRain:sineVolume', { type: 'slider', size: 'large' });
    this.setGuiOptions('avoidTheRain:toggleRain', { type: 'buttons' });
    this.setGuiOptions('avoidTheRain:spawnInterval', { type: 'slider', size: 'large' });
    this.setGuiOptions('avoidTheRain:showText', { type: 'buttons' });
    this.setGuiOptions('avoidTheRain:goToText', { type: 'buttons' });

    // scores
    this.setGuiOptions('score:showGlobalScore', { type: 'buttons' });
    this.setGuiOptions('score:blue:transfertRatio', { type: 'slider', size: 'large' });
    this.setGuiOptions('score:yellow:transfertRatio', { type: 'slider', size: 'large' });
    this.setGuiOptions('score:pink:transfertRatio', { type: 'slider', size: 'large' });
    this.setGuiOptions('score:red:transfertRatio', { type: 'slider', size: 'large' });

    this.setGuiOptions('score:explode', { type: 'buttons' });

    if (options.auth)
      this.auth = this.require('auth');
  }

  start() {
    super.start();

    this.view = new View(template, {}, {}, { id: 'controller' });

    this.show().then(() => {
      this.sharedParamsComponent.enter();
      this.logComponent.enter();

      this.receive('log', (type, ...args) => {
        switch (type) {
          case 'error':
            this.logComponent.error(...args);
            break;
        }
      });

    });
  }

  setGuiOptions(name, options) {
    this.sharedParamsComponent.setGuiOptions(name, options);
  }
}

export default ControllerExperience;
