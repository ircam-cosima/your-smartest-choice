import { BasicSharedController } from 'soundworks/client';

class ControllerExperience extends BasicSharedController {
  constructor() {
    super();

    this.setGuiOptions('state', { type: 'buttons' });

    // balloon cover
    this.setGuiOptions('balloonCover:number', {
      type: 'slider',
      size: 'large',
    });

    this.setGuiOptions('balloonCover:displayBackground', { type: 'buttons' });
    this.setGuiOptions('balloonCover:toggleBackground', { type: 'buttons' });
    this.setGuiOptions('balloonCover:explode', { type: 'buttons' });

    // kill the balloons
    this.setGuiOptions('killTheBalloons:start', { type: 'buttons' });
    this.setGuiOptions('killTheBalloons:samplesSet', { type: 'buttons' });

    this.setGuiOptions('killTheBalloons:spawnInterval', {
      type: 'slider',
      size: 'large',
    });

    // avoid the rain
    this.setGuiOptions('avoidTheRain:start', { type: 'buttons' });

    this.setGuiOptions('avoidTheRain:balloonRadius', {
      type: 'slider',
      size: 'large',
    });

    this.setGuiOptions('avoidTheRain:toggleRain', { type: 'buttons' });

    this.setGuiOptions('avoidTheRain:spawnInterval', {
      type: 'slider',
      size: 'large',
    });

    // scores
    this.setGuiOptions('score:showGlobalScore', { type: 'buttons' });

    this.setGuiOptions('score:blue:transfertRatio', {
      type: 'slider',
      size: 'large',
    });

    this.setGuiOptions('score:yellow:transfertRatio', {
      type: 'slider',
      size: 'large',
    });

    this.setGuiOptions('score:pink:transfertRatio', {
      type: 'slider',
      size: 'large',
    });

    this.setGuiOptions('score:red:transfertRatio', {
      type: 'slider',
      size: 'large',
    });

    this.setGuiOptions('score:explode', { type: 'buttons' });
  }
}

export default ControllerExperience;
