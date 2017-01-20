// import client side soundworks and player experience
import * as soundworks from 'soundworks/client';
import PlayerExperience from './PlayerExperience.js';
import viewTemplates from '../shared/viewTemplates';
import viewContent from '../shared/viewContent';

// application services
import GroupFilter from '../shared/services/GroupFilter';
import ImageManager from '../shared/services/ImageManager';
// player specific
// import PlatformAlt from '.services/PlatformAlt'; // override platform to add renderer


// launch application when document is fully loaded
window.addEventListener('load', () => {
  // initialize the client with configuration received
  // from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const config = window.soundworksConfig;
  soundworks.client.init(config.clientType, config);
  soundworks.client.setViewContentDefinitions(viewContent);
  soundworks.client.setViewTemplateDefinitions(viewTemplates);

  // create client side (player) experience
  const { assetsDomain, sharedSynthConfig } = config;
  const experience = new PlayerExperience(assetsDomain, sharedSynthConfig);

  // start the client
  soundworks.client.start();
});
