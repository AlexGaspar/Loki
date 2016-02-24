var IFRAME_ID = 'SLDSKDAKDSQK';
var IFRAME_WINDOW = 'qsldkqskl';
var IFRAME_WRAPPER_NAME = '__bar-iframe--wrapper';
var IFRAME_WRAPPER_ID = '__bar-wrapper';
var IFRAME_NAME = '__bar-iframe';
var IFRAME_STORAGE = '__bar.display';


var URLS = [
  { url: 'http://www.google.be', label: 'Google' },
  { url: 'http://www.yahoo.com', label: 'Yahoo' },
  { url: 'http://127.0.0.1', label: 'Facebook' },
  { url: 'http://www.coteclair.com', label: 'Cote Clair' },
  { url: 'http://www.teatower.com', label: 'Tea Tower' }
];

var __bar = {
  // html: require('./html/popup.html'),
  html: '', 
  iframe: {
    wrapper: null,
    css: '[[<css>]]',
  },
  getURLs: function () {
    if(__bar.urls) {
      return __bar.URLs;
    }

    __bar.urls = __bar.removeSelfFromURLS(URLS);

    return __bar.urls;
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

  renderTemplate: function(template, options) {
    return template.replace(/\[\[(\w*?)\]\]/g, function(match, p1, offset, string) {
      return (typeof options[p1] !== 'undefined') ? options[p1] : '';
    });
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
    var iframe = __bar.generateNode(
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
    return __bar.getElementByTagName(tagName).removeChild(el);
  },

  appendNodeToTag: function (tagName, el) {
    return __bar.getElementByTagName(tagName).appendChild(el);
  },

  insertCSS: function (css) {
    var head  = document.head || __bar.getElementByTagName('head');
    var style = document.createElement('style');
    style.type = "text/css";

    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  },

  hostnameFromUrl: function(url) {
    return url.replace(/.*?:\/\//g, '');
  },

  /**
   * /!\ this will modify array
   * Return randomly a value from a given array, and remove it from the array
   * @param  {Array}       array
   * @return {{Object}}
   */
  getAndremoveRandomlyFromArray: function (array) {
    var index = Math.floor(Math.random()*array.length);

    return array.splice(index, 1)[0];
  },

  /**
   * Bar Logic
   */
  main: function () {
    if(__bar.readStorage(IFRAME_STORAGE) !== false) {
      __bar.insertCSS(__bar.iframe.css);
      __bar.insertBar();
    }
  },

  closeHandler: function () {
    __bar.removeNodeFromTag('body', __bar.iframe.wrapper);
    __bar.resetContent()
    __bar.writeStorage(IFRAME_STORAGE, false);
  },

  /*
   * These two will break if the site is already setting maring on <html>
   * it also won't work on absolutes elements
   */
  resetContent: function () {
    __bar.getElementByTagName('html').style.marginTop = '0';
  },
  pushContent: function () {
    __bar.getElementByTagName('html').style.marginTop = '50px';
  },

  removeSelfFromURLS: function(urls) {
    var urls = urls;
    var currentWebsite = window.location.hostname;
    var selfId = null;

    for(var i=0, max=urls.length; i< max; i++) {
      if (currentWebsite == __bar.hostnameFromUrl(urls[i].url)) {
        selfId = i;
      }
    }

    if (selfId) {
      urls.splice(selfId, 1);
    }

    return urls;
  },

  /*
   * Since tag are hard coded
   * limit won't work until we use a proper template engine
   * or generate the html before rendering
   */
  getRandomURLs: function (limit) {
    var res = {urls: []};
    var urls = __bar.getURLs();
    var limit = limit || 3;

    if (limit > urls.length) {
      limit = urls.length;
    }

    for(var i=0; i < limit; i++) {
      var site = __bar.getAndremoveRandomlyFromArray(urls);

      res.urls.push({
        url: site.url,
        label: site.label
      });
    }

    return res;
  },

  insertBar: function () {
    var iframe;
    var iframeWrapper = __bar.generateNode(
      'div',
       { 'id': IFRAME_WRAPPER_ID,
         'className': IFRAME_WRAPPER_NAME }
    );

    var loadListener = function () {
      var iframeContent = window[IFRAME_WINDOW] = iframe.contentWindow;

      var fdIframe = iframeContent.document.open();
      fdIframe.write(Mustache.render(__bar.html, __bar.getRandomURLs(4)));
      // fdIframe.write(__bar.renderTemplate(__bar.html, __bar.getRandomURLs()));
      fdIframe.close();

      // Make some space for the bar
      __bar.pushContent();

      iframe.style.display = "block";
      iframe.removeEventListener('load', loadListener);
    };

    iframe = __bar.generateIframe(IFRAME_NAME, 'about:blank', loadListener);

    __bar.iframe.wrapper = iframeWrapper;
    iframeWrapper.appendChild(iframe);

    __bar.appendNodeToTag('body', iframeWrapper);
  }
};

// Init the shit
__bar.main();
