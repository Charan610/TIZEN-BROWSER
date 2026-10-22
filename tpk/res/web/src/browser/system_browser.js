/** Open real websites using the TV's installed browser, outside iframe restrictions. */
(function(global) {
  'use strict';

  var SystemBrowser = {
    open: function(url, callback) {
      var parsed;
      try {
        parsed = new URL(url);
        if (!/^https?:$/.test(parsed.protocol)) throw new Error('Only HTTP and HTTPS addresses can be opened.');
      } catch (error) {
        callback(new Error('Enter a valid web address or search phrase.'));
        return;
      }
      var api = global.tizen;
      if (!api || !api.application || typeof api.application.launchAppControl !== 'function' ||
          typeof api.ApplicationControl !== 'function') {
        callback(new Error('Samsung Internet can only be opened on a supported Samsung TV.'));
        return;
      }
      try {
        var control = new api.ApplicationControl('http://tizen.org/appcontrol/operation/view', parsed.href);
        // Let Tizen resolve the browser instead of hard-coding a model-specific app ID.
        api.application.launchAppControl(control, null, function() {
          callback(null);
        }, function(error) {
          callback(new Error('Samsung Internet could not open this address. ' +
            (error.name || 'LaunchError') + ': ' + (error.message || 'Try again or open Internet from the TV Apps screen.')));
        });
      } catch (error) {
        callback(new Error('Samsung Internet could not be opened: ' + error.message));
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SystemBrowser;
  else global.SystemBrowser = SystemBrowser;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
