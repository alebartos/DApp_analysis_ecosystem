let idValue = ""
export const findValue = (obj, key, array) => {
    if (obj.hasOwnProperty("txHash")) {
        idValue = obj["txHash"]
    }
    if (obj.hasOwnProperty(key)) {
        array.push({id: idValue, value: obj[key]})
        return obj[key]
    } else {
        for (let k in obj) {
            if (Array.isArray(obj[k])) {
                obj[k].forEach(item => {
                    if (typeof item === "object" && item !== null) {
                        const result = findValue(item, key, array)
                        if (result) {
                            return result
                        }
                    }
                })
            } else if (typeof obj[k] === "object" && obj[k] !== null) {
                const result = findValue(obj[k], key, array)
                if (result) {
                    return result
                }
            }
        }
    }
}

export const findUnixTime = (obj) => {
    if (obj.hasOwnProperty("txHash")) {
        idValue = obj["txHash"]
    }
    for (let key in obj) {
        if (Array.isArray(obj[key])) {
            obj[key].forEach(item => {
                if (typeof item === "object" && item !== null) {
                    findUnixTime(item)
                } else if(typeof item === "string") {
                    if (obj[key].includes("T") && obj[key].includes(".000Z")) {
                        return {id: idValue, time: obj[key]}
                    }
                }
            })
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
            findUnixTime(obj[key])
        } else if (typeof obj[key] === "string") {
            if (obj[key].includes("T") && obj[key].includes(".000Z")) {
                return {id: idValue, time: obj[key]}
            }
        }
    }
}

export const findRelatedKeys = (obj, key, array) => {
    let keys = []
    if (obj.hasOwnProperty(key)) {
        Object.keys(obj).forEach(key => array.push(key))
        return keys
    } else {
        for (let k in obj) {
            if (Array.isArray(obj[k])) {
                const item = obj[k][0]
                if (typeof item === "object" && item !== null) {
                    const result = findRelatedKeys(item, key, array)
                    if (result) {
                        return result
                    }
                }
            } else if (typeof obj[k] === "object" && obj[k] !== null) {
                const result = findRelatedKeys(obj[k], key, array)
                if (result) {
                    return result
                }
            }
        }
    }
}