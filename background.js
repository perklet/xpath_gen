// add click action for the button on the right of the address bar
chrome.browserAction.onClicked.addListener((tab) => { // jshint ignore: line
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggle"}, function(response) {
            console.log('panel toggled');
        });
    });
});

