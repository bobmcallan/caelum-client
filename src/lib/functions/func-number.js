import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: 'functions-number', level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const calculatePercentDifference = (num1, num2) => {

    if (!num2 || num2 === 0) {
        return 0;
    }

    if (!num1 || num1 === 0) {
        return 0;
    }

    const difference = (num1 - num2) / Math.max(Math.abs(num1), Math.abs(num2));
    return difference;
}