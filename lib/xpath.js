/**
 * object for xpath manipulation
 *
 * @author Yifei Kong
 * @date Sep 22, 2016
 */
const X = {

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

    /**
     * Get a path to this unique element
     * @param {HTMLElement} element, which to find xpath of
     * @param {HTMLElement} root, element as xpath root
     * @return  {string} valid xpath to lowest unique element
     * TODO: find a one pass method
     */
    findOne2OneXpath (element) {

        let uniqueAttrs = ['id', 'name'];
        let baseNode = null;
        let containedAttr = '';
        let attrValue = '';

        let e = element;
        for (let hasUniqueAttr = false; e && e.nodeType == Node.ELEMENT_NODE && !hasUniqueAttr; e = e.parentNode) {
            hasUniqueAttr = uniqueAttrs.some((attr) => { // jshint ignore: line
                if (e.hasAttribute(attr) && e.getAttribute(attr)) {
                    baseNode = e;
                    containedAttr = attr;
                    attrValue = baseNode.getAttribute(containedAttr);
                    return true;
                } else {
                    return false;
                }
            });
        }

        let pathBetween = this._findPathBetween(element, baseNode);

        if (baseNode) {
            if (pathBetween) {
                return `.//*[@${containedAttr}="${attrValue}"]/${pathBetween}`;
            } else {
                return `.//*[@${containedAttr}="${attrValue}"]`;
            }
        } else {
            return `.//${this._findPathBetween(element, document)}`;
        }
    },

    /**
     * Get a path to one class element, similar to X.findOne2OneXpath
     * @param {HTMLElement} element, which to find xpath of
     * @param {HTMLElement} root, element as xpath root
     * @return  {string} valid xpath to lowest class element
     * TODO: find a one pass method
     */
    findOne2ManyXpath (element) {
        let baseNode = null;
        for (let e = element; e && e.nodeType == Node.ELEMENT_NODE; e = e.parentNode) {
            if (e.hasAttribute('class') && e.getAttribute('class')) {
                baseNode = e;
                break;
            }
        }
        let pathBetween = this._findPathBetween(element, baseNode);
        let className = baseNode.getAttribute('class');
        if (pathBetween) {
            return `.//*[@class="${className}"]/${pathBetween}`;
        } else {
            return `.//*[@class="${className}"]`;
        }
    },
};
