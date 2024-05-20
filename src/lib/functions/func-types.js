import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: 'functions-types', level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const toBoolean = (value, defaultValue = false) => {
    if (value === null) {
        return defaultValue; // Handle null explicitly
    }

    if (typeof value === 'boolean') {
        return value; // Already a boolean, return as-is
    }

    const lowercaseValue = String(value).toLowerCase();
    return lowercaseValue === 'true'; // Handle strings like 'True', 'TRUE', etc.
};

export const convertStringToType = (value) => {
    const isNonEmptyString = (val) => typeof val === 'string' && !!val

    // Null Values -> return Null
    if (_.isNull(value))
        return value;

    // Number
    if (_.isNumber(value))
        return _.toNumber(value)

    // Boolean Checks
    if (_.isBoolean(value))
        return _.toBoolean(value)

    const _value = String(value).toLowerCase();
    if (['true', 'false'].includes(_value))
        return (_value === 'true') ? true : false

    // Return as entered
    if (isNonEmptyString(value)) return value

    return null;
}