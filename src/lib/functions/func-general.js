import * as ENV from '@t3b/app.config';
import Papa from 'papaparse';
import { newlogger } from '@t3b/lib/vue/vue-logger';

import { } from '@t3b/lib/functions/func-array';
import { convertStringToType } from '@t3b/lib/functions/func-types';
import * as arrayFunctions from '@t3b/lib/functions/func-array.js';

const logger = newlogger({ name: 'functions', level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const arrayToObject = (input, key) => arrayFunctions.arrayToObject(input, key)

export const importCSV = async (data, delimiter = ',') => {

    if (!data || _.isEmpty(data)) {
        logger.warn('[importCSV] data is empty');
        return []
    }

    const csv = await Papa.parse(data, {
        header: true,
        delimiter: delimiter,
        quoteChar: '"',
        escapeChar: '"',
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => {
            return (typeof header === "string") ? header.toLowerCase() : header
        },
        transform: (field) => {

            // Objects
            if (typeof field === "string" && field.startsWith("{") && field.endsWith("}")) {
                field = JSON.parse(field);
            }

            // Arrays
            if (typeof field === "string" && field.startsWith("[") && field.endsWith("]")) {
                field = JSON.parse(field);
            }

            return field
        },
    });

    return csv.data;
}


Map.prototype.isEmpty = function (item) {
    if (!this) return false
    const _item = this.get(item)
    return _item === undefined || _item === null || Object.keys(_item).length === 0;
}

export const queryObjectsWithMap = async (data, query) => {

    if (!data) return null;

    const output = [];
    const _query = (_.isMap(query)) ? Object.fromEntries(query) : query;

    for (const item of data) {

        const criteriaPromises = Object.keys(_query).map(async (key) => {
            const value = _query[key];
            const itemValue = item[key];

            // logger.debug('[queryObjectsWithMap] where %s = "%s" (data:%s)', key, value, itemValue);

            if (Array.isArray(value)) {
                return value.includes(itemValue);
            } else if (typeof value === 'string') {
                return itemValue.toLowerCase().includes(value.toLowerCase());
            } else if (typeof value === 'number') {
                return itemValue === value;
            } else {
                throw new Error(`Invalid query value type: ${typeof value}`);
            }
        });

        const criteriaResults = await Promise.all(criteriaPromises);
        const matchesAllCriteria = criteriaResults.every((result) => result);

        if (matchesAllCriteria) {
            output.push(item);
        }
    }

    if (_.isEmpty(output)) {
        logger.warn('[queryObjectsWithMap] output is empty');
        return []
    }

    logger.trace('[queryObjectsWithMap] output:%s', output.length);

    return output;

};

export const updateKeyValuePair = (array, key, value) => {

    const keyValuePair = array.find((item) => item.key === key);

    if (keyValuePair) {
        keyValuePair.value = value;
    } else {
        console.error(`Key-value pair does not exist in array`);
    }
};

export const importKeyValuePairsIntoMap = (keyValuePairArray) => {

    const map = new Map();

    for (const keyValuePair of keyValuePairArray) {
        map.set(keyValuePair.key, keyValuePair.value);
    }

    return map;
};

export function toJson(obj, inline = false) {

    if (inline) return toJsonInline(obj)

    if (!obj) return '';

    if (obj instanceof Map) {
        obj = [...obj];
        return obj.map(([key, value]) => `${key}:${JSON.stringify(value, null, 2)}`).join("\n");
    }

    if (obj instanceof Set) {
        obj = [...obj];
        return JSON.stringify(obj, null, 2);
    }

    return JSON.stringify(obj, null, 2);
}

export function toJsonInline(obj) {
    if (!obj) return '';

    if (obj instanceof Map) {
        obj = [...obj];
        return obj.map(([key, value]) => `${key}:${JSON.stringify(value)}`).join("\n");
    }

    if (obj instanceof Set) {
        obj = [...obj];
        return JSON.stringify(obj);
    }

    return JSON.stringify(obj);
}

export const paramsToObject = (input) => {

    const output = {}

    logger.trace('[paramsToObject] input:%s', toJson(input));

    Object.entries(input).map(([key, value]) => {

        if (key.includes(':')) {
            const _key = key.split(':')
            if (_key.length > 1) {
                output[_key[0]] = { ...output[_key[0]], [_key[1]]: convertStringToType(value) }
            }
        } else {
            logger.trace('[paramsToObject] value:%s', toJson(value));
            output[key] = convertStringToType(value)
        }

    })

    logger.trace('[paramsToObject] output:%s', toJson(output));

    return output;
}

export const objectToParams = (input) => {

    const output = {}

    Object.entries(input).forEach(([key, value]) => {

        logger.trace('[objectToUrl] %s:%s', key, toJson(value));

        if (value === null) return

        if (Array.isArray(value)) {

            output[key] = value.join(',')
            return

        }

        // Note only 1 level deep!
        if (typeof value === 'object') {

            Object.entries(value).map(([subkey, subvalue]) => {
                if (subvalue != null) output[`${key}:${subkey}`] = subvalue
            })

            return
        }

        output[key] = value

    })

    logger.trace('[objectToUrl] output:%s', toJson(output));

    return output;
}

export const getDistinct = (array, property) => {
    const set = new Set();

    for (const object of array) {
        // logger.debug('[getDistinct] %s', object[property]);
        set.add(object[property]);
    }

    return [...set];
};

// export const getDistinctPropertyList = (array, property) => {
//     const set = new Set();

//     for (const object of array) {
//         // logger.debug('[getDistinctPropertyList] %s', object[property]);
//         set.add(object[property]);
//     }

//     return [...set];
// };


export const groupBytoMap = (objects, keySelector) => {
    const groups = new Map();

    for (const object of objects) {

        const key = keySelector(object);

        // const key = object[property];

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key).push(object);
    }

    return groups;
};

export const groupByMultipleProperties = (array, properties) => {

    const groups = new Map();

    for (const object of array) {
        const key = properties.map((property) => object[property]).join("|");

        if (!groups.has(key)) {
            groups.set(key, []);
        }

        groups.get(key).push(object);
    }

    return groups;
}

export const groupBy = (objects, keySelector) =>

    objects.reduce((groupedData, object) => {

        const key = keySelector(object);

        groupedData[key] = groupedData[key] ?? [];
        groupedData[key].push(object);

        return groupedData;

    }, {});

const ASC = 1;
const DESC = -1;

export const sortMapByPropertyAndSortOrder = (map, property, sortOrder) => {

    // Convert the Map to an array.
    const array = [...map];

    // console.log(array)

    // Sort the array using the specified property and sort order.
    array.sort((a, b) => {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        const indexA = sortOrder.indexOf(keysA[property]);
        const indexB = sortOrder.indexOf(keysB[property]);

        return indexA - indexB;
    });

    console.log(array)

    // Convert the array back to a Map.
    const sortedMap = new Map(array);

    // Return the sorted Map.
    return sortedMap;
}

export const sortByMultipleProperties = (map, propertyOrders = {}) => {
    const sortedMap = new Map();
    const sortedEntries = [...map.entries()].sort((a, b) => {
        let direction = DESC;

        for (const [propertyName, sortOrder] of Object.entries(propertyOrders)) {
            direction = sortOrder === DESC || sortOrder === undefined ? DESC : ASC;

            const propertyValueA = a[1][propertyName];
            const propertyValueB = b[1][propertyName];

            if (propertyValueA !== propertyValueB) {
                return (propertyValueA - propertyValueB) * direction; // sort by ascending or descending order
            }
        }

        return 0;
    });

    for (const [key, value] of sortedEntries) {
        sortedMap.set(key, value);
    }

    return sortedMap;
};

export const sortMap = (map, key, order) => {

    const sortedMap = new Map();

    for (const element of order) {
        sortedMap.set(key(element), map.get(element));
    }

    return sortedMap;

};

export const unionMaps = (...maps) => maps.reduce((newMap, map) => {

    for (const [key, value] of map.entries()) {
        newMap.set(key, value);
    }

    return newMap;

}, new Map());


export const getPropertyValueByVariable = (obj, variable, value, property) => {

    if (Array.isArray(obj)) {

        const matchingObject = obj.find((object) => object[variable] === value);

        return matchingObject ? matchingObject[property] : undefined;

    } else if (typeof obj === "object") {

        return obj[variable] === value ? obj[property] : undefined;

    } else {

        return undefined;

    }
};

Number.prototype.divide = function (input) {
    return _.divide(this, input);
}



export function avatarStyle(input = null) {

    let hashed = sumChars(input)
    let bgcolor = `hsl(${hashed % 360}, 40%, 90%)`

    return { "--el-avatar-bg-color": bgcolor, "--el-avatar-text-color": "#00000" }

}

export function colorFromWord(input = null) {

    let hashed = sumChars(input)
    return `hsl(${hashed % 360}, 100%, 100%)`

}

export function sumChars(s) {

    var i,
        n = s.length,
        acc = 0;

    for (i = 0; i < n; i++) {
        let calc = parseInt(s[i], 36)
        acc += (calc) ? parseInt(s[i], 36) : 0;
    }

    return acc;
}

export function firstChar(input = null) {

    if (!input || !_.isString(input)) {
        return "?"
    }

    return (input) ? input.charAt(0) : ""
}

export const delay = async (timeout = 1000) => {
    await new Promise((resolve) => setTimeout(resolve, timeout));
};

export const sleepUntil = async (f, timeoutMs) => {

    return new Promise((resolve, reject) => {

        const timeWas = new Date();

        const wait = setInterval(function () {

            if (f()) {

                // console.log("resolved after", new Date() - timeWas, "ms");

                clearInterval(wait);

                resolve();

            } else if (new Date() - timeWas > timeoutMs) { // Timeout

                // console.log("rejected after", new Date() - timeWas, "ms");

                clearInterval(wait);

                reject();

            }

        }, 20);

    });
}
