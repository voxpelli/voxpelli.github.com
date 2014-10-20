/*jslint browser: true, plusplus: true, vars: true, indent: 2 */
window.loadIndieConfig = (function () {
  'use strict';

  // Indie-Config Loading script
  // by Pelle Wessman, voxpelli.com
  // MIT-licensed
  // http://indiewebcamp.com/indie-config

  var config, configFrame, configTimeout,
    callbacks = [],
    handleConfig, parseConfig;

  handleConfig = function () {
    config = config || {};

    configFrame.parentNode.removeChild(configFrame);
    configFrame = undefined;

    window.removeEventListener('message', parseConfig);

    clearTimeout(configTimeout);

    while (callbacks[0]) {
      callbacks.shift()(config);
    }
  };

  parseConfig = function (message) {
    var correctSource = (configFrame && message.source === configFrame.contentWindow);

    if (correctSource && config === undefined) {
      try {
        config = JSON.parse(message.data);
      } catch (ignore) {}

      handleConfig();
    }
  };

  return function (callback) {
    if (config) {
      callback(config);
      return;
    }

    callbacks.push(callback);

    if (configFrame) {
      return;
    }

    configFrame = document.createElement('iframe');
    configFrame.src = 'web+action:load';
    document.getElementsByTagName('body')[0].appendChild(configFrame);
    configFrame.style.display = 'none';

    window.addEventListener('message', parseConfig);

    // If no config has been loaded in 2 seconds, abort
    configTimeout = setTimeout(handleConfig, 3000);
  };
}());
