/*jslint browser: true, plusplus: true, vars: true, indent: 2 */
(function () {
  'use strict';

  var loadIndieConfig = (function () {
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

      configTimeout = setTimeout(handleConfig, 2000);
    };
  }());

  var loadingClassRegexp = /(^|\s)indieconfig-loading(\s|$)/;

  var doTheAction = function (indieConfig) {
    var href, action, anchors;

    this.className = this.className.replace(loadingClassRegexp, ' ');

    action = this.getAttribute('do');

    if ((action === 'reply' || action === 'post') && indieConfig.reply) {
      href = indieConfig.reply;
    }

    if (!href) {
      anchors = this.getElementsByTagName('a');
      if (anchors[0]) {
        href = anchors[0].href;
      }
    }

    if (href) {
      window.location = href.replace('{url}', encodeURIComponent(this.with || window.location.href));
    }
  };

  var handleTheAction = function (e) {
    e.preventDefault();

    if (!loadingClassRegexp.test(this.className)) {
      this.className += ' indieconfig-loading';
      loadIndieConfig(doTheAction.bind(this));
    }
  };

  window.addEventListener('DOMContentLoaded', function () {
    var actions = document.querySelectorAll('indie-action'),
      i,
      length = actions.length;

    for (i = 0; i < length; i++) {
      actions[i].addEventListener('click', handleTheAction);
    }
  });
}());
