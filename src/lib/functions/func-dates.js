import * as ENV from '@t3b/app.config';

import { DateTime, Interval } from "luxon";

import { newlogger } from '@t3b/lib/vue/vue-logger';

const __name = "func-dates"
const logger = newlogger({ name: __name, level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const generateScaledDates = (scale, todate = null) => {

    // logger.debug('[generateScaledDates] scale:%s todate:%s', scale, todate);

    todate = (!todate) ? DateTime.local().endOf('day') : DateTime.fromISO(todate)

    // todate = todate.minus({ weeks: 1 }).endOf('week')

    const fromdate = todate.minus({ months: 13 });
    const diff = Interval.fromDateTimes(fromdate, todate);

    const _scale = (!scale || !['days', 'weeks', 'months', 'years'].includes(scale)) ? 'months' : scale;

    // logger.debug('[generateScaledDates] _scale:%s', _scale);

    switch (_scale) {
        case 'years':
            return [DateTime.fromObject({ year: 2022, month: 6, day: 1 }).toISODate(), DateTime.fromObject({ year: 2023, month: 6, day: 1 }).toISODate()]

        case 'days':
            return [...createDateArray(todate, Math.floor(diff.length(_scale)))]

        case 'weeks':
            return [...createWeekNoArray(todate, Math.floor(diff.length(_scale)))]

        case 'months':
        default:
            return [...createMonthArray(todate, Math.floor(diff.length(_scale)))]

    }

}

export const getReportSegmentfromDate = (scale, date = null) => {

    if (!date || !DateTime.isDateTime(date)) return date;

    const _scale = (!scale || !['days', 'weeks', 'months', 'years'].includes(scale)) ? 'months' : scale;

    // format = "'day'-dd-LLL-yyyy"
    // format = "'week'-WW-yyyy"
    // format = "'month'-MMM-yyyy"

    switch (_scale) {
        case 'years':
            return date.toFormat("'fy'-yy").toLowerCase()

        case 'days':
            return date.toFormat("'day'-dd-LLL-yyyy").toLowerCase()

        case 'weeks':
            return date.toFormat("'week'-WW-kkkk").toLowerCase()

        case 'months':
        default:
            return date.toFormat("'month'-MMM-yyyy").toLowerCase()

    }
}

export const createDateArray = (indexdate, days = 14) => {

    indexdate = (!indexdate) ? DateTime.local() : DateTime.fromISO(indexdate)
    const dates = [];
    let initialdate = indexdate.minus({ days: days });

    while (initialdate <= indexdate) {
        dates.push(initialdate);
        initialdate = initialdate.plus({ days: 1 });
    }

    return dates;
}

export const createWeekNoArray = (indexdate, weeks = 14) => {

    // Start of the Week?
    indexdate = (!indexdate) ? DateTime.local() : DateTime.fromISO(indexdate)
    const dates = [];
    let initialdate = indexdate.minus({ weeks: weeks });

    while (initialdate <= indexdate) {
        dates.push(initialdate.startOf('week'));
        initialdate = initialdate.plus({ weeks: 1 });
    }

    return dates;
}

export const createMonthArray = (indexdate, months = 6) => {

    indexdate = (!indexdate) ? DateTime.local() : DateTime.fromISO(indexdate)
    const dates = [];
    let initialdate = indexdate.minus({ months: months });

    while (initialdate <= indexdate) {
        dates.push(initialdate);
        initialdate = initialdate.plus({ months: 1 });
    }

    return dates;
}

export const getCurrentDayNumber = () => {

    return DateTime.local().day

}

export const getCurrentWeekNumber = () => {

    return DateTime.local().weekNumber

}

export const getCurrentMonth = () => {

    return DateTime.local().month

}

export const dateToColumnName = (scale, date) => {

    if (!date || !DateTime.isDateTime(date)) return date;

    switch (scale) {
        case 'year':
            return date.toFormat("'FY'YY");

        case 'days':
            return date.toFormat('dd-MMM');

        case 'weeks':
            // start of the week
            return date.startOf('week').toFormat('dd-MMM');

        case 'months':
        default:
            return date.startOf('month').toFormat('MMM-yy');
    }

}

export const convertStringToDate = (inputString, incrementValue = 0) => {

    const parts = inputString.split('-');
    let date;

    if (parts.length > 1) {
        const type = parts[0].toLowerCase();
        const value = parts[1];

        switch (type) {
            case 'day': {
                // const date = DateTime.fromObject({ year: parts[3], month: parts[2], day: parts[1] })
                date = DateTime.fromFormat(`${parts[1]}-${parts[2]}-${parts[3]}`, 'dd-LLL-yyyy')
                // logger.debug('[formatColumnName] input:%s date:%s', inputString, date);
                date = date.plus({ days: incrementValue });
                break;
            }

            case 'week': {
                const year = _.toNumber(`${parts[2]}`);
                const weekNumber = _.toNumber(value)
                date = DateTime.fromObject({ weekNumber: weekNumber, weekyear: year });
                date = date.plus({ weeks: incrementValue });
                break;
            }

            case 'month': {
                date = DateTime.fromFormat(`${parts[1]}-${parts[2]}`, 'LLL-yyyy')
                date = date.plus({ months: incrementValue });
                break;
            }

            case 'fy': {
                date = getFiscalYearStartDate(inputString, incrementValue)
                break;
            }

        }

    }

    return date ? date : null;
}

export const convertTimestamp = (timestamp = null) => {

    if (!timestamp || timestamp === null)
        return timestamp;

    const output = DateTime.fromMillis(timestamp)

    return output.toLocaleString(
        {
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }
    )
}