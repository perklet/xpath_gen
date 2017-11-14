/**
 * object for xpath manipulation
 *
 * @author Yifei Kong
 * @date Sep 22, 2016
 */
(function(global) {
global.X = {

    /**
     * selecting elements by xpath
     * @param {string} path, xpath selector
     * @param {HTMLElement} top, top element as base
     * @return {Array} always return a array
     */
    $(path, top=document) {

        let result = document.evaluate(path, top, null, XPathResult.ANY_TYPE, null);
        switch(result.resultType) {
            case XPathResult.NUMBER_TYPE:
                return [result.numberValue];
            case XPathResult.STRING_TYPE:
                return [result.stringValue];
            case XPathResult.BOOLEAN_TYPE:
                return [result.booleanValue];
            case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
            let orderedResult = document.evaluate(path, top, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                let resultNodes = [];
                for (let i=0 ; i < orderedResult.snapshotLength; i++){
                    resultNodes.push( orderedResult.snapshotItem(i) );
                }
                return resultNodes;
            default:
                return [];
        }
    },

    /**
     * get root element of a list of HTMLElement
     * @param  {HTMLElement} root     the lca must be a decedent of this element
     * @param  {Array} elements       find root of these elements
     * @return {HTMLElement}          the lowest common ancestor
     */
    _lowestCommonAncestor(root, elements) {
        if (elements.length > 2) {
            let firstHalf = elements.slice(0, elements.length / 2);
            let secondHalf = elements.slice(elements.length / 2, elements.length);
            return this._lowestCommonAncestor(root,
                [this._lowestCommonAncestor(root, firstHalf), 
                this._lowestCommonAncestor(root, secondHalf)]);
        } else if (elements.length == 1) {
            return elements[0];
        } else {
            // elements.length == 2
            let paths = [[], []]; // path for two elements
            for (let i of [0, 1]) {
                for (let e = elements[i]; e != root; e = e.parent) {
                    paths[i].push(e);
                }
            }
            for (let i of [0, 1]) 
                paths[i].reverse();

            let i = 0;
            for (; paths[0][i] != paths[1][i]; i++);

            return paths[i-1];
        }
    },

    /**
     * Get xpath expression of an element, from root to this element, no attr will be used.
     * @param {HTMLElement} element, which to find xpath of
     * @param {HTMLElement} root, element as xpath root, by default, it's document
     * @return {string} xpath expression between root and element
     */
    _findPathBetween(element, root=document) {
        let paths = [];

        for (; element && element.nodeType == Node.ELEMENT_NODE && element != root; element = element.parentNode) {

            let index = 0;

            for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
                    continue;
                if (sibling.nodeName == element.nodeName)
                    ++index;
            }

            let hasFollowingSiblings = false;
            for (let sibling = element.nextSiling; sibling && !hasFollowingSiblings; sibling = sibling.nextSibling) {
                if (sibling.nodeName == element.nodeName)
                    hasFollowingSiblings = true;
            }

            let pathIndex = (index || hasFollowingSiblings ? '[' + (index + 1) + ']' : '');
            paths.unshift(element.tagName.toLowerCase() + pathIndex);
        }
        return paths.join('/');
    },

    _findXpath(element, baseElement, basePath, relative) {
        if (baseElement == null)
            return null;
        if (baseElement == element)
            return basePath;
        if (relative) {
            return `${basePath}//${element.tagName.toLowerCase()}`;
        } else {
            return `${basePath}/${this._findPathBetween(element, baseElement)}`;
        }
    },

    /**
     * find xpath for given element by text value
     * @param {HTMLElement} element, which element to find xpath of
     * @param {bool} relative, relative path between base element and element or not
     * @return {string} xpath
     */
    findXpathByText(element, relative) {
        let baseElement = null;
        for (let e = element; e && e.nodeType == Node.ELEMENT_NODE; e = e.parentNode) {
            if (e.textContent && e.textContent.length < 32) {
                baseElement = e;
                break;
            }
        }
        let basePath = null;
        if (baseElement)
            basePath = `.//*[text()="${baseElement.textContent}"]`;
        return this._findXpath(element, baseElement, basePath, relative);
    },

    /**
     * find xpath for given element
     * @param {HTMLElement} element, which element to find xpath of
     * @param {string} attr, whihc attribute, the attribute of root element
     * @param {bool} relative, relative path between base element and element or not
     * @return {string} valut xpath from root to element
     */
    findXpathByAttr(element, attr, relative) {
        let baseElement = null;
        for (let e = element; e && e.nodeType == Node.ELEMENT_NODE; e = e.parentNode) {
            if (e.hasAttribute(attr) && e.getAttribute(attr)) {
                baseElement = e;
                break;
            }
        }
        let basePath = null;
        if (baseElement)
            basePath = `.//*[@${attr}="${baseElement.getAttribute(attr)}"]`;
        return this._findXpath(element, baseElement, basePath, relative);
    },

    /**
     * find all xpaths possible based on id, class, name, text
     */
    findAllXpaths(element) {
        let xpaths = []
        for (let attr of ['id', 'name', 'class']) {
            for (let relative of [true, false]) {
                let xpath = this.findXpathByAttr(element, attr, relative);
                console.log(`find xpath for ${element.tagName} by ${attr}, relative: ${relative}: ${xpath}`)
                if (xpath)
                    xpaths.push(xpath)
            }
        }
        for (let relative of [true, false]) {
            let xpath = this.findXpathByText(element, relative);
            if (xpath)
                xpaths.push(xpath)
        }
        xpaths = unique(xpaths)
        return xpaths;
    }
};
})(window)
