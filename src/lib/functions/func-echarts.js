import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: 'functions-echarts', level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const blankChart = {
    title: {
        show: true,
        textStyle: {
            color: 'grey',
            fontSize: 15,
            fontWeight: 'normal'
        },
        text: `No Data`,
        left: 'center',
        top: 'center'
    },
    xAxis: {
        show: false
    },
    yAxis: {
        show: false
    },
    series: []
};