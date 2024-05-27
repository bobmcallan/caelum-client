import * as ENV from '@t3b/app.config';
import { DateTime, Interval } from "luxon";
import { newlogger } from '@t3b/lib/vue/vue-logger';
import { convertStringToDate } from '@t3b/lib/functions/func-dates';
import { namedColors } from '@t3b/lib/functions/func-colors';
import { calculatePercentDifference } from '@t3b/lib/functions/func-number';
import { toJson } from '@t3b/lib/functions/func-general';

const _name = "common-js"
const _logger = newlogger({ name: _name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const segmentName = (value) => {
    // _logger.debug('[segmentName] value:%s', value);

    if (!value) return value;

    switch (value.toLowerCase()) {
        case 'all': return 'Total'
        case '95%': return '95th Percentile'
        default: return value.capitalize();
    }
}

export const scaleName = (value, short = false) => {

    if (!value) return value;

    switch (value.toLowerCase()) {
        case 'days': return (short) ? 'D' : 'Days'
        case 'weeks': return (short) ? 'W' : 'Weeks (start)'
        case 'months': return (short) ? 'M' : 'Months'
        case 'years': return (short) ? 'Y' : 'Years'
        default: return value.capitalize();
    }
}

export const segmentFromDate = (inputValue, scale = 'month', incrementValue = 0) => {

    const date = DateTime.fromISO(inputValue);

    if (!date.isValid) {
        return null; // Invalid date input
    }

    switch (scale) {
        case 'week':
        case 'weeks': {
            const modifiedDate = date.plus({ weeks: incrementValue });
            return `week-${modifiedDate.weekNumber}-${modifiedDate.year}`
        }

        case 'month':
        case 'months': {
            const modifiedDate = date.plus({ months: incrementValue });
            return `month-${modifiedDate.toFormat('LLL').toLowerCase()}-${modifiedDate.year}`
        }

        case 'fy':
        case 'years': {
            return getFiscalYear(date, incrementValue)
        }

    }

    return null;
}

export const segmentIncrement = (inputValue, incrementValue = 0) => {


    const date = convertStringToDate(inputValue)

    const parts = inputValue.split('-');

    if (parts.length > 1) {
        const type = parts[0].toLowerCase();

        return segmentFromDate(date, type, incrementValue)

    }

    return null

}

export const getFiscalYearStartDate = (inputString, incrementValue = 0) => {

    const parts = inputString.split('-');

    if (parts.length === 2 && parts[0].toLowerCase() === 'fy') {

        const year = parseInt(`20${parts[1]}`, 10);

        if (!isNaN(year)) {

            // Australian fiscal year starts on July 1st
            const startDate = DateTime.fromObject({ year, month: 7, day: 1 }).plus({ year: incrementValue });

            return startDate.isValid ? startDate : null;
        }
    }
    return null;
}

export const getFiscalYear = (inputString, incrementValue = 0) => {

    const date = DateTime.fromISO(inputString).plus({ year: incrementValue });

    if (!date.isValid) {
        return null; // Invalid date input
    }

    const modifiedDate = DateTime.fromObject({ month: 7, day: 1, year: date.year });

    if (date < modifiedDate) {
        // Date is before July 1st, so it belongs to the previous fiscal year
        return `fy-${(date.year - 1).toString().slice(2)}`;
    } else {
        // Date is on or after July 1st, so it belongs to the current fiscal year
        return `fy-${date.year.toString().slice(2)}`;
    }
}

export const getShortMonthName = (month) => {

    return DateTime.local(DateTime.local().year, month, 1).toFormat('LLL').toLowerCase()

}

export const getDayMonth = (date) => {

    const options = {
        weekday: 'short', // Display the short form of the day
        month: 'short' // Display the short form of the month
    };

    return new Intl.DateTimeFormat('en-US', options).format(date);

}
export const calculateEMA = (data, period) => {
    const alpha = 2 / (period + 1);
    let ema = [];

    // Calculate the initial SMA (Simple Moving Average) as the first data point
    let sma = data.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
    ema.push(sma);

    // Calculate EMA for the remaining data points
    for (let i = period; i < data.length; i++) {
        ema.push((1 - alpha) * ema[i - 1] + alpha * data[i]);
    }

    return ema;
}

export const randomNumbers = (config) => {
    var cfg = config || {};
    var min = valueOrDefault(cfg.min, 0);
    var max = valueOrDefault(cfg.max, 100);
    var from = valueOrDefault(cfg.from, []);
    var count = valueOrDefault(cfg.count, 8);
    var decimals = valueOrDefault(cfg.decimals, 8);
    var continuity = valueOrDefault(cfg.continuity, 1);
    var dfactor = Math.pow(10, decimals) || 0;
    var data = [];
    var i, value;

    for (i = 0; i < count; ++i) {
        value = (from[i] || 0) + this.rand(min, max);
        if (this.rand() <= continuity) {
            data.push(Math.round(dfactor * value) / dfactor);
        } else {
            data.push(null);
        }
    }

    return data;
}

export const incrementalChange = (oldValue, newValue) => {
    const abs = newValue - oldValue;
    const percentageDiff = (abs / Math.abs(oldValue));

    return {
        abs,
        per: (isFinite(percentageDiff)) ? percentageDiff : 0,
        dir: (isFinite(percentageDiff)) ? Math.sign(abs) : 0
    };
}

export const formatNumber = (input, opts = {}) => {

    opts = { ...{ notation: 'compact', compactDisplay: 'short' }, ...opts }

    // _logger.debug('[formatNumber] opts:%s', toJson(opts, true));

    const formatter = new Intl.NumberFormat('en', opts);

    return formatter.format(input)
}

Number.prototype.formatNumber = function (opts = {}) {
    return formatNumber(this, opts)
}

export const formatCurrency = function (input = 0, opts = {}) {

    opts = { ...{ style: 'currency', currency: 'AUD', notation: 'compact', compactDisplay: 'short' }, ...opts }
    const formatter = new Intl.NumberFormat('en', opts);

    return formatter.format(input);
};

Number.prototype.formatCurrency = function (opts = {}) {

    return formatCurrency(this, opts)

};


export const formatPercentage = (input = 0, opts = {}) => {

    // minimumFractionDigits: decimalplaces,

    opts = { ...{ minimumFractionDigits: 0, maximumFractionDigits: 0 }, ...opts }

    const formatter = new Intl.NumberFormat("en", {
        style: "percent",
        opts
    });

    return formatter.format(input);

}
Number.prototype.formatPercentage = function (opts = {}) {

    return formatPercentage(this, opts);

};

export const downloadUrl = async (url, name = "download") => {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}


export const getStats = (arr) => {
    // Check if array is empty with optional chaining
    if (arr?.length === 0) {
        return {
            low: undefined,
            high: undefined,
            open: undefined,
            close: undefined,
            avg: undefined,
            chg: { abs: undefined, per: undefined, dir: undefined },
        };
    }

    const lowest = Math.min(...arr);
    const highest = Math.max(...arr);
    const open = arr[0];
    const close = arr[arr.length - 1]
    const avgerage = arr.reduce((acc, value) => acc + value, 0) / arr.length;
    const differance = calculatePercentDifference(open, close);
    const change = incrementalChange(open, close);

    // Return an object with the results
    return {
        low: lowest,
        high: highest,
        avg: avgerage,
        open: open,
        close: close,
        diff: differance,
        chg: change ?? { abs: undefined, per: undefined, dir: undefined },
    };
}