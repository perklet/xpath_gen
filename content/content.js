(function(global) {


// if the panel has alread been inserted, just stop execution
if (global.xpathPanelInserted) {
  global.togglePanel();
  return;
} else {
  global.xpathPanelInserted = true;
}

/**
 * toggles the panel
 */
function togglePanel() {
    let panel = document.getElementById('xpath-generator');
    if (panel.style.display == 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
    }
}

global.togglePanel = togglePanel


// the panel html template
let panelTemplate = `
<div id="xpath-generator">
    <div>
        <b>XPath Generator</b>
        <i id="move-tip">drag blank area to move</i>
    </div>
    <div>
        <p class="xpath-button" id="inspect-button" @click="toggleInspect">{{ inspectButton }}</p>
        <p class="xpath-button" @click="clearXpaths">Clear Xpaths</p>
        <p class="xpath-button" @click="clearAll">Clear All</p>
    </div>
    <div>
        <table class="xpath-table">
            <tr>
                <th>XPath</th><th>Matches</th><th>Verify</th>
            <tr v-for="xpath in xpaths">
                <td class="xpath-expression">{{xpath.xpath}}</td>
                <td class="xpath-match-count">{{xpath.matchCount}}</td>
                <td><p class="xpath-match-count xpath-button" @click="verifyXpath(xpath.xpath)">Verify</p></td>
            </tr>
        </table>
    </div>
    <hr/>
    <div>
        Manually Input Test
    </div>
    <div id="xpath-tester">
        <input type="text" placeholder="input your xpath here to test" name="xpath-tester-input" v-model="xpathTesting" />
        <input type="button" value="Test XPath" name="xpath-tester-button" @click="verifyXpath(xpathTesting)" />
    </div>
</div>
`

document.body.insertAdjacentHTML('beforeend', panelTemplate)

let inspecting = false;

let vm = new Vue({
    el: '#xpath-generator',
    data: {
        inspectButton: "Start Inspect",
        xpaths: [],
        xpathTesting: null
    },
    methods: {
        toggleInspect: function() {
            if (inspecting) {
                this.inspectButton = "Start Inspect";
                stopInspect();
                window.inspecting = false;
            } else {
                this.inspectButton = "Stop Inspect";
                startInspect();
                window.inspecting = true;
            }
        },
        clearXpaths: function() {
            this.xpaths = [];
        },
        verifyXpath: function(xpath) {
            for (let el of document.getElementsByTagName('*')) {
                el.classList.remove('xpath-verify-selected');
            }
            for (let el of X.$(xpath)) {
                el.classList.add('xpath-verify-selected');
            }
        },
        clearAll: function() {
            this.xpaths = [];
            for (let el of document.getElementsByTagName('*')) {
                el.classList.remove('xpath-verify-selected');
                el.classList.remove('xpath-selected');
                el.classList.remove('xpath-inspecting');
            }
        }
    }
});


/**
 * add a listener that will only be called once
 * @param  {HTMLElement}  node       node to listen event on
 * @param  {string}       type       event type e.g. click
 * @param  {Function}     listener   listener callback
 * @param  {Boolean}      useCapture whether to use capture
 * @return {Function}                the wrapped function, which can be used to cancel the listener
 */
function listenOnce(node, type, listener, useCapture=false) {
    let wrapper = (event) => {
        node.removeEventListener(type, wrapper, useCapture);
        return listener(event);
    };

    node.addEventListener(type, wrapper, useCapture);
    return wrapper;
};

let prev = null;
let prevListener = null;

function inspectHandler(event) {
    if (prev) {
        prev.classList.remove('xpath-inspecting');
        prev.removeEventListener('click', prevListener);
        prev = null;
    }
    if (event.currentTarget) {
        prev = event.currentTarget;
        prevListener = listenOnce(event.currentTarget, 'click', clickHandler);
        prev.classList.add('xpath-inspecting');
    }
    event.stopPropagation();
};

/**
 * update xpath result
 */
function clickHandler(event) {
    event.currentTarget.classList.remove('xpath-inspecting');
    for (let xpath of X.findAllXpaths(event.currentTarget)) {
        let matchCount = X.$(xpath).length;
        vm.xpaths.push({xpath: xpath, matchCount: matchCount})
    }
    event.currentTarget.classList.add('xpath-selected');
    stopInspect();
    inspecting = false;
    vm.inspectButton = "Start Inspect";
    event.stopImmediatePropagation();
    event.preventDefault();
}

function startInspect() {
    for (let el of document.getElementsByTagName('*')) {
        el.classList.remove('xpath-selected');
        el.classList.remove('xpath-verify-selected');
    }
    for (let el of document.getElementsByTagName('*')) {
        el.addEventListener('mouseover', inspectHandler);
    }
    let panel = document.getElementById('xpath-generator');
    for (let el of panel.getElementsByTagName('*')) {
        el.removeEventListener('mouseover', inspectHandler);
    }
    panel.removeEventListener('mouseover', inspectHandler);
}

function stopInspect() {
    for (let el of document.getElementsByTagName('*')) {
        el.removeEventListener('mouseover', inspectHandler);
    }
}

/*********************************************************************************
 * Drag and Drop of Xpath Generator Panel
 ********************************************************************************/

function dragStart(event) {
    let style = window.getComputedStyle(event.target, null);
    event.dataTransfer.setData("text/plain",
        (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY));
}

function dragOver(event) {
    event.preventDefault();
}

function drop(event) {
    let offset = event.dataTransfer.getData("text/plain").split(',');
    let panel = document.getElementById('xpath-generator');
    panel.style.left = (event.clientX + parseInt(offset[0],10)) + 'px';
    panel.style.top = (event.clientY + parseInt(offset[1],10)) + 'px';
    panel.style.bottom = panel.style.right = 'auto';
    event.preventDefault();
}

let panel = document.getElementById('xpath-generator');
panel.addEventListener('dragstart', dragStart, false);
document.addEventListener('dragover', dragOver, false);
document.addEventListener('drop', drop, false);
})(window);

/* this code should be in the content script */
/*
chrome.runtime.onMessage.addListener((message, sender, sendMessage) => {
    togglePanel();
    console.log('toggleing panel');
})
*/
