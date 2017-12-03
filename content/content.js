(function(global) {

// if the panel has already been inserted, just stop execution
if (global.xpathPanelInserted) {
  console.debug('xpath panel has been injected, toggling it')
  global.togglePanel('xpal-panel');
  return;
} else {
  console.debug('xpath panel not injected, continuing the execution')
  global.xpathPanelInserted = true;
}

/**
 * toggles the panel
 */
function togglePanel(id) {
    let panel = document.getElementById(id);
    if (panel.style.display == 'none') {
        console.debug('showing panel')
        panel.style.display = 'block';
    } else {
        console.debug('hidding panel')
        panel.style.display = 'none';
    }
}

global.togglePanel = togglePanel


// the panel html template.
//
// it's not that I like to write divs, just don't want to mess up with the
// page's original styles.
let panelTemplate = `
<div class="xpal-panel" id="xpal-panel">
    <div id="xpal-title-bar">
        <div id="xpal-title">XPal - drag here to move</div>
        <div id="xpal-title-control">
          <a id="xpal-minimize-button" title="minimize" class="xpal-title-bar-button" @click="minimizeXpathPanel">_</a>
          <a id="xpal-close-button" title="close" class="xpal-title-bar-button" @click="closeXpathPanel">x</a>
        </div>
    </div>
    <div id="xpal-main">
      <div>
          <a class="xpath-button" id="inspect-button" @click="toggleInspect">{{ inspectButton }}</a>
          <a class="xpath-button" id="clear-style-button" @click="clearAll">Clear Style</a>
          <a class="xpath-button" id="delete-all-button" @click="clearXpaths">Delete All</a>
      </div>
      <div id="table-panel">
          <table id="xpath-table">
              <tr>
                  <th>XPath</th><th>Matches</th><th>Test</th><th>Verify</th><th>Delete</th>
              <tr v-for="(result, index) in xpaths">
                  <td class="xpath-expression">
                    {{result.elementXpath}}
                  </td>
                  <td class="xpath-match-count">
                    {{result.matchCount}}
                  </td>
                  <td>
                    <a class="xpath-button" @click="setTestXpath(result.elementXpath)">Test</a>
                  </td>
                  <td>
                    <a class="xpath-button" @click="verifyXpath(result.elementXpath)">Verify</a>
                  </td>
                  <td><a class="xpath-button" href="#" @click="deleteXpath(index)">delete</a></td>
              </tr>
          </table>
      </div>
      <div id="xpath-tester">
          <div>XPath Test</div>
          <textarea placeholder="input your xpath here to test" v-model="xpathTesting"></textarea>
          <div>
              <a class="xpath-button" @click="addBack(xpathTesting)">Add To Table</a>
          </div>
          <div id="xpal-value">The result({{xpathValue.length}}):
            <ol>
            <li v-for="val in xpathValue">
              {{ val }}
            </li>
            </ol>
          </div>
      </div>
    </div>
</div>
`

document.body.insertAdjacentHTML('beforeend', panelTemplate)

let inspecting = false;

let vm = new Vue({
    el: '.xpal-panel',
    data: {
        inspectButton: "Start Inspect",
        xpaths: [],
        xpathTesting: null
    },
    computed: {
        xpathValue: function () {
          try {
            let value = X.stringify(this.xpathTesting)
            this.verifyXpath(this.xpathTesting)
            return value;
          } catch (e) {
            return ['not valid expression'];
          }
        }
    },
    methods: {
        addBack: function(xpath) {
          let matchCount = X.selectElements(xpath).length;
          this.xpaths.unshift({elementXpath: xpath, matchCount});
        },
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
                //el.classList.remove('xpath-verify-selected');
                el.removeAttribute("data-xpal");
            }
            this.clearAll();
            let flag = true;
            xpath = X.removePostfix(xpath)
            for (let el of X.selectElements(xpath)) {
                if (flag)
                  el.scrollIntoView()
                flag = false;
                //el.classList.add('xpath-verify-selected');
                el.setAttribute("data-xpal", "xpath-verify-selected");
            }
        },
        deleteXpath: function(index) {
          this.xpaths.splice(index, 1);
        },
        clearAll: function() {
            for (let el of document.getElementsByTagName('*')) {
                //el.classList.remove('xpath-verify-selected');
                //el.classList.remove('xpath-selected');
                //el.classList.remove('xpath-inspecting');
                el.removeAttribute("data-xpal");
            }
        },
        closeXpathPanel: function() {
          togglePanel('xpal-panel')
        },
        minimizeXpathPanel: function() {
          togglePanel('xpal-main')
        },
        setTestXpath: function(xpath) {
          this.xpathTesting = xpath;
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
        //prev.classList.remove('xpath-inspecting');
        prev.removeAttribute('data-xpal');
        prev.removeEventListener('click', prevListener);
        prev = null;
    }
    if (event.currentTarget) {
        prev = event.currentTarget;
        prevListener = listenOnce(event.currentTarget, 'click', clickHandler);
        //prev.classList.add('xpath-inspecting');
        prev.setAttribute('data-xpal', 'xpath-inspecting');
    }
    event.stopPropagation();
};

/**
 * update xpath result
 */
function clickHandler(event) {
    //event.currentTarget.classList.remove('xpath-inspecting');
    event.currentTarget.removeAttribute('data-xpal');
    for (let elementXpath of X.findPossibleXpaths(event.currentTarget)) {
        try {
          let matchCount = X.selectElements(elementXpath).length;
          vm.xpaths.unshift({elementXpath, matchCount});
        } catch (e) {
          console.warn(`${elementXpath} is not valid`);
        }
    }
    //event.currentTarget.classList.add('xpath-selected');
    event.currentTarget.setAttribute('data-xpal', 'xpath-selected')
    stopInspect();
    inspecting = false;
    vm.inspectButton = "Start Inspect";
    event.stopImmediatePropagation();
    event.preventDefault();
}

function startInspect() {
    for (let el of document.getElementsByTagName('*')) {
        //el.classList.remove('xpath-selected');
        //el.classList.remove('xpath-verify-selected');
        el.removeAttribute('data-xpal');
    }
    for (let el of document.getElementsByTagName('*')) {
        el.addEventListener('mouseover', inspectHandler);
    }
    let panel = document.getElementById('xpal-panel');
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

/******************************************************************************
 * Drag and Drop of Xpath Generator Panel
 *****************************************************************************/


/**
 * make element dragable by its element
 */
function makeDragable(dragHandle, dragTarget) {
  let dragObj = null; //object to be moved
  let xOffset = 0; //used to prevent dragged object jumping to mouse location
  let yOffset = 0;

  document.querySelector(dragHandle).addEventListener("mousedown", startDrag, true);
  document.querySelector(dragHandle).addEventListener("touchstart", startDrag, true);

  /*sets offset parameters and starts listening for mouse-move*/
  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    dragObj = document.querySelector(dragTarget);
    dragObj.style.position = "fixed";
    let rect = dragObj.getBoundingClientRect();

    if (e.type=="mousedown") {
      xOffset = e.clientX - rect.left; //clientX and getBoundingClientRect() both use viewable area adjusted when scrolling aka 'viewport'
      yOffset = e.clientY - rect.top;
      window.addEventListener('mousemove', dragObject, true);
    } else if(e.type=="touchstart") {
      xOffset = e.targetTouches[0].clientX - rect.left;
      yOffset = e.targetTouches[0].clientY - rect.top;
      window.addEventListener('touchmove', dragObject, true);
    }
  }

  /*Drag object*/
  function dragObject(e) {
    e.preventDefault();
    e.stopPropagation();

    if(dragObj == null) {
      return; // if there is no object being dragged then do nothing
    } else if(e.type=="mousemove") {
      dragObj.style.left = e.clientX-xOffset +"px"; // adjust location of dragged object so doesn't jump to mouse position
      dragObj.style.top = e.clientY-yOffset +"px";
      dragObj.style.right = 'auto';
    } else if(e.type=="touchmove") {
      dragObj.style.left = e.targetTouches[0].clientX-xOffset +"px"; // adjust location of dragged object so doesn't jump to mouse position
      dragObj.style.top = e.targetTouches[0].clientY-yOffset +"px";
    }
  }

  /*End dragging*/
  document.onmouseup = function(e) {
    if (dragObj) {
      dragObj = null;
      window.removeEventListener('mousemove', dragObject, true);
      window.removeEventListener('touchmove', dragObject, true);
    }
  }
}

makeDragable('#xpal-title-bar', '#xpal-panel')

})(window);

/* this code should be in the content script */
/*
chrome.runtime.onMessage.addListener((message, sender, sendMessage) => {
    togglePanel();
    console.log('toggleing panel');
})
*/
