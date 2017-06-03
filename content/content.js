const inserted_panel = `
    <div id="xpath-generator-panel">
        <div>
            <p class="xpath-button" id="inspect-button">Start Inspect</p>
            <p class="xpath-button" id="verify-one-button">Verify One</p>
            <p class="xpath-button" id="verify-many-button">Verify Many</p>
        </div>
        <div>
            <ul class="xpath-list">
                <li>Select One Element <span id="one2one-match-count"></span></li>
                <li><span class="xpath-label">Element<span>: <span id="select-one-element-xpath" class="xpath-value">null</span></li>
                <li><span class="xpath-label">Text<span>: <span id="select-one-text-xpath" class="xpath-value">null</span></li>
                <li><span class="xpath-label">Link<span>: <span id="select-one-link-xpath" class="xpath-value">null</span></li>
                <li><span class="xpath-label">Image<span>: <span id="select-one-image-xpath" class="xpath-value">null</span></li>
            </ul>
            <ul class="xpath-list">
                <li>Select Many Element <span id="one2many-match-count"></span></li>
                <li><span class="xpath-label">Element<span>: <span id="select-many-element-xpath" class="xpath-value">null</span></li>
                <li><span class="xpath-label">Text<span>: <span id="select-many-text-xpath" class="xpath-value">null</span></li>
                <li><span class="xpath-label">Link<span>: <span id="select-many-link-xpath" class="xpath-value">null</span></li>
                <li><span class="xpath-label">Image<span>: <span id="select-many-image-xpath" class="xpath-value">null</span></li>
            </ul>
        </div>
    </div>
`

document.body.insertAdjacentHTML('beforeend', inserted_panel)

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

let inspecting = false;
let inspectButton = document.getElementById('inspect-button');
let one2OneXpath = null;
let one2ManyXpath = null;

function clickHandler(event) {
    event.currentTarget.classList.remove('xpath-inspecting');
    one2OneXpath = X.findOne2OneXpath(event.currentTarget);
    document.getElementById('select-one-element-xpath').textContent = one2OneXpath;
    document.getElementById('select-one-text-xpath').textContent = one2OneXpath + '/text()';
    document.getElementById('select-one-link-xpath').textContent = one2OneXpath + '/@href';
    document.getElementById('select-one-image-xpath').textContent = one2OneXpath + '/@src';
    document.getElementById('one2one-match-count').textContent = 'matches: ' + X.$(one2OneXpath).length;
    one2ManyXpath = X.findOne2ManyXpath(event.currentTarget);
    document.getElementById('select-many-element-xpath').textContent = one2ManyXpath;
    document.getElementById('select-many-text-xpath').textContent = one2ManyXpath + '/text()';
    document.getElementById('select-many-link-xpath').textContent = one2ManyXpath + '/@href';
    document.getElementById('select-many-image-xpath').textContent = one2ManyXpath + '/@src';
    document.getElementById('one2many-match-count').textContent = 'matches: ' + X.$(one2ManyXpath).length;
    event.currentTarget.classList.add('xpath-selected');
    stopInspect();
    inspecting = false;
    event.stopImmediatePropagation();
    inspectButton.textContent = "Start Inspect";
    event.preventDefault();
}

inspectButton.addEventListener('click', (event) => {
    if (inspecting) {
        inspectButton.textContent = "Start Inspect";
        stopInspect();
        inspecting = false;
    } else {
        inspectButton.textContent = "Stop Inspect";
        startInspect();
        inspecting = true;
    }
});

function startInspect() {
    for (let el of document.getElementsByTagName('*')) {
        el.classList.remove('xpath-selected');
        el.classList.remove('xpath-verify-selected');
    }
    for (let el of document.getElementsByTagName('*')) {
        el.addEventListener('mouseover', inspectHandler);
    }
    let panel = document.getElementById('xpath-generator-panel');
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

document.getElementById('verify-one-button').addEventListener('click', (event) => {
    if (!one2OneXpath) {
        return;
    }
    for (let el of document.getElementsByTagName('*')) {
        el.classList.remove('xpath-verify-selected');
    }

    for (let el of X.$(one2OneXpath)) {
        el.classList.add('xpath-verify-selected');
    }

})

document.getElementById('verify-many-button').addEventListener('click', (event) => {
    if (!one2ManyXpath) {
        return;
    }
    for (let el of document.getElementsByTagName('*')) {
        el.classList.remove('xpath-verify-selected');
    }

    for (let el of X.$(one2ManyXpath)) {
        el.classList.add('xpath-verify-selected');
    }
})
