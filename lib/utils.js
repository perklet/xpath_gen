function unique(list, keyFn) {
    seen = new Set();
    result = []
    for (let el of list) {
        if (keyFn == undefined)
            hashKey = el;
        else
            hashKey = keyFn(el)
        if (!seen.has(hashKey)) {
            result.push(el)
            seen.add(hashKey)
        }
    }
    return result;
}
