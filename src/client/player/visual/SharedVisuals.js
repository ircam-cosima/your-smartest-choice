import { Renderer } from 'soundworks/client';

const config = [
  {
    midiKey: 60,
    type: 'glitch',
    group: 'blue',
    // color: '??',
  }, {
    midiKey: 61,
    type: 'glitch',
    group: 'blue',
    // color: '??',
  },
];

class SharedVisual {
  constructor(config, view, groupFilter) {
    this.groupFilter = groupFilter;
    this.pitchConfigMap = new Map();

    for (let i = 0, l = config.length; i < l; i++) {
      const conf = config[i];
      this.pitchConfigMap.set(conf.midiKey, conf);
    }
  }

  trigger(pitch) {
    const config = this.pitchConfigMap.get(pitch);

    if (config) {
      const group = config.group;

      if (this.groupFilter.test(group) || group === 'all') {
        const type = config.type;

        switch(type) {
          case 'glitch':
            this.triggerGlitch(config);
            break;
        }
      }
    }
  }

  stop(pitch) {

  }

  update(dt) {

  }

  render(ctx) {

  }
}
