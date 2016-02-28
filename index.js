var request = require('superagent');
var ouibounce = require('ouibounce');

var IFRAME_ID = 'SLDSKDAKDSQK';
var IFRAME_WINDOW = 'qsldkqskl';
var IFRAME_WRAPPER_NAME = '__DB_POPUP-iframe--wrapper';
var IFRAME_WRAPPER_ID = '__DB_POPUP-wrapper';
var IFRAME_NAME = '__DB_POPUP-iframe';
var IFRAME_STORAGE = '__DB_POPUP.already_seen';

var API_HOSTNAME = 'http://192.168.99.100:3001/api/v1';

var __exitpage = {
  html: require("./html/popup.handlebars"),
  iframe: {
    wrapper: null
  },

  /**
   * Utils
   */
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

  generateIframe: function (classes, src, loadListener) {
    var iframe = __exitpage.generateNode(
      'iframe',
      { 'src': src,
        'className': classes,
        'id': IFRAME_ID,
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

  getVisitorInfo: function() {
    return {
      lang: window.navigator.userLanguage || window.navigator.language
    }
  }

  /**
   * Popup Logic
   */
  main: function () {
    if(__exitpage.readStorage(IFRAME_STORAGE) !== true) {
      require('./css/iframe.css');

      request
        .get(API_HOSTNAME + '/sites')
        .query(__exitpage.getVisitorInfo())
        .end(function(err, res) {
          if (err) { return console.log('something went wrong...', err);}
          __exitpage.insertPopup(res.body);    
          ouibounce(document.getElementById(IFRAME_ID), {
            cookieName: IFRAME_STORAGE
          });
        });
      
    }
  },

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

  insertPopup: function (sites) {
    var iframe;
    var iframeWrapper = __exitpage.generateNode(
      'div',
       { 'id': IFRAME_WRAPPER_ID,
         'className': IFRAME_WRAPPER_NAME }
    );

    var loadListener = function () {
      var iframeContent = window[IFRAME_WINDOW] = iframe.contentWindow;

      iframeContent.window.detroyIframe = __exitpage.closeHandler;

      var fdIframe = iframeContent.document.open();
      // Replace the object by data from the API
      fdIframe.write(__exitpage.html({sites: sites}));
      fdIframe.close();

      // Inject CSS
      __exitpage.injectCSS(iframeContent.document);

      iframe.removeEventListener('load', loadListener);
    };

    iframe = __exitpage.generateIframe(IFRAME_NAME, 'about:blank', loadListener);

    __exitpage.iframe.wrapper = iframeWrapper;
    iframeWrapper.appendChild(iframe);

    __exitpage.appendNodeToTag('body', iframeWrapper);
  }
};

// Init the shit
__exitpage.main();
