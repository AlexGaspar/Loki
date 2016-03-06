var request = require('superagent');
var ouibounce = require('ouibounce');

var IFRAME_ID = 'SLDSKDAKDSQK';
var IFRAME_WINDOW = 'qsldkqskl';
var IFRAME_WRAPPER_NAME = '__DB_POPUP-iframe--wrapper';
var IFRAME_WRAPPER_ID = '__DB_POPUP-wrapper';
var IFRAME_NAME = '__DB_POPUP-iframe';
var IFRAME_STORAGE = '__DB_POPUP.already_seen';
var IFRAME_DATA_ID = 'ASOKDAKQDASLDK';

var DEBUG_COOKIES = '__DB_POPUP.debug';

var API_HOSTNAME = 'http://192.168.99.100:3001/graphql';
var IFRAME_DATA_HOSTNAME = 'http://example.org:8000';

var __exitpage = {
  visitorExternalData: null,
  html: require("./html/popup.handlebars"),
  iframe: {
    wrapper: null
  },

  /**
   * Utils
   */
   debug: function (string) {
     // Since we read it from a cookie it's a string
     if (__exitpage.readStorage(DEBUG_COOKIES)) {
       console.log(string);
     }
   },

  readStorage: function (c_name) {
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start === -1) {
        c_start = c_value.indexOf(c_name + "=");
    }

    if (c_start === -1) {
        c_value = null;
    } else {
        c_start = c_value.indexOf("=", c_start) + 1;

        var c_end = c_value.indexOf(";", c_start);
        if (c_end === -1) {
            c_end = c_value.length;
        }
        c_value = unescape(JSON.parse(c_value.substring(c_start,c_end)));
    }

    return c_value;
  },

  writeStorage: function (name, value, expireDays) {
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + expireDays);

    var cookieValue = escape(JSON.stringify(value)) + ((expireDays === null) ? "" : "; expires=" + expireDate.toUTCString());
    document.cookie = name + "=" + cookieValue;
  },

  generateNode: function (type, params) {
    var params = params || {};
    var node = document.createElement(type);

    Object.keys(params).forEach(function(key) {
      node[key] = params[key];
    });

    return node;
  },

  generateIframe: function (id, classes, src, loadListener) {
    var iframe = __exitpage.generateNode(
      'iframe',
      { 'src': src,
        'className': classes,
        'id': id,
        'frameBorder': 0,
        'scrolling': 'yes' }
    );

    // Hide the iframe until it's fully loaded
    iframe.style.display = 'none';

    if (loadListener) {
      iframe.addEventListener('load', loadListener);
    }

    return iframe;
  },

  getElementByTagName: function(tagName) {
    return document.getElementsByTagName(tagName)[0];
  },

  removeNodeFromTag: function (tagName, el) {
    return __exitpage.getElementByTagName(tagName).removeChild(el);
  },

  appendNodeToTag: function (tagName, el) {
    return __exitpage.getElementByTagName(tagName).appendChild(el);
  },

  hostnameFromUrl: function(url) {
    return url.replace(/.*?:\/\//g, '');
  },

  /*
   * Using iframe get data about the current visitor
   */
  getVisitorData: function() {
    var iframe;
    window.addEventListener("message", function (event) {
      __exitpage.visitorExternalData = event.data;
      // Remove iframe once we get the response.
      document.body.removeChild( document.getElementById(IFRAME_DATA_ID) )
    }, false);

    var iframe = __exitpage.generateIframe(IFRAME_DATA_ID, '', IFRAME_DATA_HOSTNAME, function () {
      iframe.style.display = 'none';
      iframe.contentWindow.postMessage('ping', IFRAME_DATA_HOSTNAME);
    });

    // We have to add the iframe to the dom in order for it to be loaded
    document.body.appendChild(iframe);
  },

  // Get browser language
  getLang: function () {
    return window.navigator.userLanguage || window.navigator.language;
  },

  // remove the last part of composed string (en-US, en-GB)
  getLangSimplified: function () {
    return __exitpage.getLang().split('-')[0];
  },

  // Collection of information we can get on the current visitor
  getVisitorInfo: function() {
    return {
      lang: __exitpage.getLang()
    }
  },

  // Returns ...
  getTexts: function () {
    return require('./translations/' + __exitpage.getLangSimplified());
  },

  /**
   * Popup Logic
   */
  closeHandler: function () {
    __exitpage.removeNodeFromTag('body', __exitpage.iframe.wrapper);
    __exitpage.writeStorage(IFRAME_STORAGE, true);
  },

  // Look into a way to require it directly from handlebar template
  injectCSS: function(iframeDocument) {
    var css = require("./css/loki.less").toString();
    var head = iframeDocument.getElementsByTagName('head')[0];

    var style = document.createElement("style")
    style.type = 'text/css';
    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  },

  // Insert the iframe into the dom
  insertPopup: function (sites) {
    if (sites.length === 0) {
      __exitpage.debug('No website to show');
      return;
    }
    __exitpage.debug('Loading iframe');

    var iframe;
    var iframeWrapper = __exitpage.generateNode(
      'div',
       { 'id': IFRAME_WRAPPER_ID,
         'className': IFRAME_WRAPPER_NAME }
    );

    var loadListener = function () {
      __exitpage.debug('Listener called');
      var iframeContent = window[IFRAME_WINDOW] = iframe.contentWindow;

      iframeContent.window.detroyIframe = __exitpage.closeHandler;

      var fdIframe = iframeContent.document.open();
      // Replace the object by data from the API
      fdIframe.write(__exitpage.html({sites: sites, texts: __exitpage.getTexts()}));
      fdIframe.close();

      // Inject CSS
      __exitpage.injectCSS(iframeContent.document);

      // Use Exit technologie to display it
      ouibounce(document.getElementById(IFRAME_ID), {
        cookieDomain: 'not-a-domain' // Hacky way to disable the popup check on ouibounce
      });

      iframe.removeEventListener('load', loadListener);
    };

    iframe = __exitpage.generateIframe(IFRAME_ID, IFRAME_NAME, 'about:blank', loadListener);

    __exitpage.iframe.wrapper = iframeWrapper;
    iframeWrapper.appendChild(iframe);

    __exitpage.appendNodeToTag('body', iframeWrapper);
  },

  main: function (siteId, regex) {
    if(__exitpage.readStorage(IFRAME_STORAGE) !== 'true' || __exitpage.readStorage(DEBUG_COOKIES)) {
      // Async Load data from iframe
      __exitpage.getVisitorData();
      require('./css/iframe.css');

      request
        .get(API_HOSTNAME)
        .query(__exitpage.getVisitorInfo())
        .query({query: '{ matchingSites(id: 1, language_code: "' + __exitpage.getLangSimplified() + '") { logo translations { description title button } } }'})
        .end(function (err, res) {
          if (err) { return __exitpage.debug('something went wrong...', err); }
          __exitpage.insertPopup(res.body.data.matchingSites);
        });
    }
  }
};

// Init the shizzle my nizzle
__exitpage.main(1, null);
