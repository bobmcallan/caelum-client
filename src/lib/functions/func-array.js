import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';
import { toJson } from '@t3b/lib/functions/func-general';

const _logger = newlogger({ name: 'functions-array', level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const sortbyOrder = (sortArr, orderArr) => {

    _logger.debug('[sortbyOrder]\ninput:%s\nsort:%s\nisArray:%s\nisEmpty:%s', toJson(sortArr), toJson(orderArr), _.isArray(orderArr), _.isEmpty(orderArr));

    if (!_.isArray(orderArr) || _.isEmpty(orderArr)) return sortArr;

    const orderMap = new Map();

    // Create a map of each element's index in orderArr
    orderArr.forEach((element, index) => {
        orderMap.set(element, index);
    });

    // Custom sorting function using the orderMap
    sortArr.sort((a, b) => {
        const indexA = orderMap.get(a);
        const indexB = orderMap.get(b);

        // If elements are not found in orderArr, place them at the end
        if (indexA === undefined) return 1;
        if (indexB === undefined) return -1;

        return indexA - indexB;
    });

    return sortArr;
};

Array.prototype.sortbyOrder = function (orderArr) { return sortbyOrder(this, orderArr) }

Array.prototype.remove = function (...items) {

    const indices = items.map(item => this.indexOf(item));

    indices.forEach(index => {

        if (index !== -1) {
            this.splice(index, 1);
        }

    });

    return this;
};

Array.prototype.pushUnique = function (...items) {

    items.forEach(item => {

        if (!this.includes(item)) {
            this.push(item);
        }
    });

    return this;
};

// export const arrayToObject = (array, key) => array.reduce((obj, item) => ((obj[[item[key]]] = item), obj), {});

export const arrayToObject = (input, key) => {

    if (!_.isArray(input)) {
        _logger.warn(`[arrayToObject] Not Array -> input:${typeof input} key:${typeof key}`);
        return
    }

    _logger.debug('[arrayToObject] key:%s input:\n%s', key, toJson(input));

    // logger.debug(`[arrayToObject] input:${typeof input}`);

    // return input.reduce((obj, item) => {

    const output = {}

    for (const item of input) {

        console.log(item);
        // console.log(item[key]);

        const k = item[key]
        const v = item

        console.log(k);
        delete v[key]

        output[k] = v
        // return Object.assign({}, { k: v })

    }

    return output
}

Array.prototype.Contains = function (searchString) { return ArrayContains(this, searchString) }

export const ArrayContains = (array, searchString) => {

    if (!_.isString(searchString)) return false;
    if (!_.isArray(array)) return false;

    const searchTerms = searchString.toLowerCase().split(/\s+/);

    const _output = array.filter(item => {
        const _item = item.toLowerCase();
        return searchTerms.some(term => term.includes(_item));
    });

    return (_output.length > 0)
}

Array.prototype.Same = function () { return ArraySame(this) }

export const ArraySame = (array) => {
    if (!_.isArray(array) || array.length === 0) return true;

    const firstValue = array[0].toLowerCase();

    return array.every(element => (element.toLowerCase() === firstValue));
}