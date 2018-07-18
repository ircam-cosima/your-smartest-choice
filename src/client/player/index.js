// import client side soundworks and player experience
import * as soundworks from 'soundworks/client';
import PlayerExperience from './PlayerExperience.js';
import viewTemplates from '../shared/viewTemplates';
import viewContent from '../shared/viewContent';

// application services
import GroupFilter from '../shared/services/GroupFilter';
import ImageManager from '../shared/services/ImageManager';
import serviceViews from '../shared/serviceViews';
// player specific
// import PlatformAlt from '.services/PlatformAlt'; // override platform to add renderer


// launch application when document is fully loaded
window.addEventListener('load', () => {
  document.body.classList.remove('loading');

  const config = Object.assign({ appContainer: '#container' }, window.soundworksConfig);
  soundworks.client.init(config.clientType, config);

  soundworks.client.setServiceInstanciationHook((id, instance) => {
    if (serviceViews.has(id))
      instance.view = serviceViews.get(id, config);
  });

  // create client side (player) experience
  const { assetsDomain, sharedSynthConfig } = config;
  const experience = new PlayerExperience(assetsDomain, sharedSynthConfig);

  // start the client
  soundworks.client.start();
});
