(function () {
  'use strict';

  // Useful to convert non-arrays to arrays in addition to doing basic mapping
  var map = function (collection, callback) {
    var result = [];

    for (var i = 0, length = collection.length; i < length; i++) {
      result[i] = callback ? callback(collection[i], i) : collection[i];
    }

    return result;
  };

  var find = function (collection, callback) {
    var result;

    for (var i = 0, length = collection.length; i < length; i++) {
      result = callback(collection[i], i);
      if (result) { return result; }
    }
  };

  var isArray = function (value) {
    return Array.isArray(value);
  };

  var getKeys = function (obj) {
    var keys = [];

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }

    return keys;
  };

  var $ = function (selector, context) {
    return typeof selector === 'string' ? (context || document).querySelectorAll(selector) : selector;
  };

  var $$ = function (selector, context) {
    return isArray(selector) ? selector : map(typeof selector === 'string' ? $(selector, context) : selector);
  };

  var $one = function (selector, context) {
    return typeof selector === 'string' ? (context || document).querySelector(selector) : selector;
  };

  var ensureValue = function (process, callback, returnResult) {
    return function (value) {
      var args = map(arguments).slice(1);

      value = process(value);
      args.unshift(value);

      var result = callback.apply(this, args);

      return returnResult ? result : value;
    };
  };

  var ensureElement = function (callback, returnResult) {
    return ensureValue($one, callback, returnResult);
  };

  var addText = ensureElement(function (tag, text) {
    (text + '').split('\n').forEach(function (text, index) {
      if (index !== 0) { createChild(tag, 'br'); }
      appendChild(tag, document.createTextNode(text));
    });
  });

  var classRegExp = function (className) {
    return new RegExp('(^|\\s)' + className + '($|\\s)');
  };

  var hasClass = ensureElement(function (elem, className) {
    if (elem.className !== '') {
      return classRegExp(className).test(elem.className);
    }
    return false;
  }, true);

  var removeClass = ensureElement(function (elem, className) {
    if (elem.className !== '') {
      elem.className = elem.className.replace(classRegExp(className), ' ').trim();
    }
  });

  var addClass = ensureElement(function (elem, className) {
    className = [].concat(className);

    if (elem.className === '') {
      elem.className = className.join(' ');
    } else {
      find(className, function (value) {
        if (hasClass(elem, value)) { return; }
        elem.className += ' ' + value;
      });
    }
  });

  var toggleClass = ensureElement(function (elem, className) {
    if (hasClass(elem, className)) {
      removeClass(elem, className);
    } else {
      addClass(elem, className);
    }
  });

  var appendChild = ensureElement(function (elem, child) {
    elem.appendChild(child);
  });

  var setAttributes = ensureElement(function (elem, attributes) {
    find(getKeys(attributes), function (attribute) {
      if (attributes[attribute] !== undefined) {
        elem.setAttribute(attribute, attributes[attribute]);
      }
    });
  });

  var createElement = function (tag, className, text) {
    var newElem = document.createElement(tag);

    if (className) {
      if (typeof className === 'object' && !isArray(className)) {
        setAttributes(newElem, className);
      } else {
        addClass(newElem, className);
      }
    }

    if (text) {
      addText(newElem, text);
    }

    return newElem;
  };

  var createChild = function (elem, tag, className, text) {
    var child = createElement(tag, className, text);
    appendChild(elem, child);
    return child;
  };

  var closestByClass = function (elem, className) {
    while (elem.parentNode) {
      elem = elem.parentNode;
      if (hasClass(elem, className)) {
        return elem;
      }
    }
  };

  var removeElement = function (elem) {
    elem.parentNode.removeChild(elem);
  };

  var emptyElement = function (elem) {
    while (elem.childNodes[0]) {
      removeElement(elem.childNodes[0]);
    }
  };

  // Main code

  var configTable = document.getElementById('indie-config-box');

  var setupTable = function () {
    emptyElement(configTable);

    var tr = createChild(configTable, 'tr');
    createChild(tr, 'th', '', 'Config key');
    createChild(tr, 'th', '', 'Endpoint');

    var settings;
    try {
      settings = JSON.parse(window.localStorage.getItem('indie-config'));
    } catch (e) {}

    if (!settings) {
      settings = [
        { key: 'reply', value: 'https://quill.p3k.io/new?reply={url}' }
      ];
    }

    find(settings, function (value) {
      var tr = createChild(configTable, 'tr');
      createChild(createChild(tr, 'td'), 'input', {
        value: value.key,
      });
      createChild(createChild(tr, 'td'), 'input', {
        value: value.value,
      });
    });

    var tr = createChild(configTable, 'tr');
    createChild(createChild(tr, 'td'), 'input', {
      placeholder: 'reply'
    });
    createChild(createChild(tr, 'td'), 'input', {
      placeholder: 'https://quill.p3k.io/new?reply={url}'
    });
  };

  setupTable();

  createChild(configTable.parentNode, 'button', { type: 'button', class: 'btn' }, 'Add row').addEventListener('click', function () {
    var tr = createChild(configTable, 'tr');
    createChild(createChild(tr, 'td'), 'input');
    createChild(createChild(tr, 'td'), 'input');
  });
  createChild(configTable.parentNode, 'button', { type: 'button', class: 'btn' }, 'Save').addEventListener('click', function () {
    var values = map($$('tr', configTable), function (row) {
      var inputs = $$('input', row);
      if (!inputs[0]) { return {}; }
      return {
        key: inputs[0].value,
        value: inputs[1].value
      };
    }).filter(function (value) {
      return value.key && value.value;
    });

    window.localStorage.setItem('indie-config', JSON.stringify(values));
    setupTable();
  });
}());
