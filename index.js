var request = require('superagent');

var IFRAME_ID = 'SLDSKDAKDSQK';
var IFRAME_WINDOW = 'qsldkqskl';
var IFRAME_WRAPPER_NAME = '__DB_POPUP-iframe--wrapper';
var IFRAME_WRAPPER_ID = '__DB_POPUP-wrapper';
var IFRAME_NAME = '__DB_POPUP-iframe';
var IFRAME_STORAGE = '__DB_POPUP.display';

var API_HOSTNAME = 'http://192.168.99.100:3001/api/v1';


var DUMMY_DATA = {
        sites: [{
          name: 'coucou',
          catchPhrase: 'Get it'
        }, {
          name: 'webmaster',
          catchPhrase: 'Coupon 5'
        }]
};


var URLS = [
  { url: 'http://www.google.be', label: 'Google' },
  { url: 'http://www.yahoo.com', label: 'Yahoo' },
  { url: 'http://127.0.0.1', label: 'Facebook' },
  { url: 'http://www.coteclair.com', label: 'Cote Clair' },
  { url: 'http://www.teatower.com', label: 'Tea Tower' }
];

var __exitpage = {
  html: require("./html/popup.handlebars"),
  iframe: {
    wrapper: null
  },

  /**
   * Utils
   */
  readStorage: function (c_name) {
    if (typeof window.localStorage !== "undefined") {
        return JSON.parse(window.localStorage.getItem(c_name));
    } else {
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
    }
  },

  writeStorage: function (name, value, expireDays) {
    if (typeof window.localStorage !== "undefined") {
        if (expireDays < 0) window.localStorage.removeItem(name);
        else window.localStorage.setItem(name, JSON.stringify(value));
    } else {
        var expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + expireDays);

        var cookieValue = escape(JSON.stringify(value)) + ((expireDays === null) ? "" : "; expires=" + expireDate.toUTCString());
        document.cookie = name + "=" + cookieValue;
    }
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
        'scrolling': 'no' }
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

  /**
   * Popup Logic
   */
  main: function () {
    if(__exitpage.readStorage(IFRAME_STORAGE) !== false) {
      require('./css/iframe.css');

      request
        .get(API_HOSTNAME + '/sites')
        .end(function(err, res) {
          if (err) { return console.log('something went wrong...', err);}
          __exitpage.insertPopup(res.body);      
        });
      
    }
  },

  closeHandler: function () {
    __exitpage.removeNodeFromTag('body', __exitpage.iframe.wrapper);
    __exitpage.resetContent()
    __exitpage.writeStorage(IFRAME_STORAGE, false);
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

      var fdIframe = iframeContent.document.open();
      // Replace the object by data from the API
      fdIframe.write(__exitpage.html({sites: sites}));
      fdIframe.close();

      iframe.style.display = "block";
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
