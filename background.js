// add click action for the button on the right of the address bar
chrome.browserAction.onClicked.addListener((tab) => { // jshint ignore: line
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // let's see a call back hell
      chrome.tabs.executeScript(null, {file: 'lib/utils.js'}, function() {
        chrome.tabs.executeScript(null, {file: 'lib/xpath.js'}, function() {
          chrome.tabs.executeScript(null, {file: 'lib/vue.js'}, function() {
            chrome.tabs.executeScript(null, {file: 'content/content.js'})
            console.log('browser button pressed, inserting panel');
          })
        })
      })
      /*
      chrome.tabs.sendMessage(tabs[0].id, {action: "toggle"}, function(response) {
          console.log('panel toggled');
      });
      */
    });
});

