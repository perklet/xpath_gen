function unique(list) {
    seen = new Set();
    result = []
    for (let el of list) {
        if (!seen.has(el)) {
            result.push(el)
            seen.add(el)
        }
    }
    return result;
}
