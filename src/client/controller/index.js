// import client side soundworks and player experience
import * as soundworks from 'soundworks/client';
import viewTemplates from '../shared/viewTemplates';
import viewContent from '../shared/viewContent';
import ControllerExperience from './ControllerExperience';

window.addEventListener('load', () => {
  const config = window.soundworksConfig;
  soundworks.client.init(config.clientType, config);
  soundworks.client.setViewContentDefinitions(viewContent);
  soundworks.client.setViewTemplateDefinitions(viewTemplates);

  const { assetsDomain, sharedSynthConfig } = config;
  const controller = new ControllerExperience();

  soundworks.client.start();
});
