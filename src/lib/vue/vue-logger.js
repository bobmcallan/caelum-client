import * as ENV from '@t3b/app.config';
import { createLogger } from 'browser-bunyan';
import { ConsoleFormattedStream } from '@browser-bunyan/console-formatted-stream';

import { TRACE, DEBUG, INFO, WARN, ERROR, FATAL, nameFromLevel } from '@browser-bunyan/levels';

const _default_loglevel = (ENV.DEBUG) ? 'debug' : 'warn'

const __levelAbbr = {
    default: 'I',
    error: 'E',
    warn: 'W',
    debug: 'D',
    trace: 'T',
    verbose: 'V',
    data: 'DAT',
};
const __formatLevelName = (level) => {
    let ret = __levelAbbr.default;

    switch (level.toUpperCase()) {
        case 'ERROR':
            ret = __levelAbbr.error;
            break;

        case 'WARN':
            ret = __levelAbbr.warn;
            break;

        case 'DATA':
            ret = __levelAbbr.data;
            break;

        case 'DEBUG':
            ret = __levelAbbr.debug;
            break;

        case 'TRACE':
            ret = __levelAbbr.trace;
            break;

        case 'VERBOSE':
            ret = __levelAbbr.verbose;
            break;
    }

    return ret;
}

export class FormattedStream extends ConsoleFormattedStream {

    constructor(opts) {
        super(opts);
    }

    write(rec) {
        let levelCss, consoleMethod;
        const defaultCss = this.css.def;
        const msgCss = this.css.msg;
        const srcCss = this.css.src;

        const loggerName = rec.childName ? rec.name + '/' + rec.childName : rec.name;

        //get level name and pad start with spacs
        let levelName = nameFromLevel[rec.level];
        const formattedLevelName = (Array(5 - levelName.length).join(' ') + __formatLevelName(levelName)).toUpperCase();

        if (rec.level === TRACE) {
            levelName = 'debug';
        } else if (rec.level === FATAL) {
            levelName = 'error';
        }

        if (rec.level < DEBUG) {
            levelCss = this.css.levels.trace;
        } else if (rec.level < INFO) {
            levelCss = this.css.levels.debug;
        } else if (rec.level < WARN) {
            levelCss = this.css.levels.info;
        } else if (rec.level < ERROR) {
            levelCss = this.css.levels.warn;
        } else if (rec.level < FATAL) {
            levelCss = this.css.levels.error;
        } else {
            levelCss = this.css.levels.fatal;
        }

        const padZeros = (number, len) => Array((len + 1) - (number + '').length).join('0') + number;

        const urlpagename = (rec.src) ? this.getPageName(rec.src) : ''

        const logArgs = [];
        // logArgs.push(`%c[%s:%s:%s:%s] %c%s%c: %s: %c%s ${rec.src ? '%c%s' : ''}`);
        logArgs.push(`%c[%s:%s:%s:%s] [%c%s] [%c%s] %c%s`);
        logArgs.push(levelCss);
        logArgs.push(padZeros(rec.time.getHours(), 2));
        logArgs.push(padZeros(rec.time.getMinutes(), 2));
        logArgs.push(padZeros(rec.time.getSeconds(), 2));
        logArgs.push(padZeros(rec.time.getMilliseconds(), 4));
        logArgs.push(levelCss);
        logArgs.push(formattedLevelName);
        // logArgs.push(defaultCss);
        logArgs.push(levelCss);
        logArgs.push(loggerName);
        logArgs.push(msgCss);
        logArgs.push(rec.msg);

        // console.log(urlpagename)
        // if (rec.src) {
        //     logArgs.push(srcCss);
        //     logArgs.push(rec.src);
        // }

        if (rec.obj) {
            logArgs.push('\n');
            logArgs.push(rec.obj);
        }
        if (rec.err && rec.err.stack) {
            logArgs.push('\n');
            logArgs.push(rec.err.stack);
        }

        if (['error'].includes(levelName)) {
            consoleMethod = typeof console[levelName] === 'function' ? console[levelName] : console.log;
        }
        else {
            consoleMethod = console.log;
        }


        setTimeout(console.log.bind(console, ...logArgs));
        // consoleMethod.apply(console, logArgs);


    }

    getFilename() {
        try {
            // Example using Error object (might not work in all environments)
            throw new Error("Get filename stack trace");
        } catch (error) {
            const stack = error.stack.split("\n")[1];
            // Extract filename from stack trace (adjust regex if necessary)
            const match = stack.match(/at (?:.*\/)?([^:]+):\d+:\d+/);
            return match ? match[1] : "unknown";
        }
    }

    getPageName(urlString) {
        try {
            const output = urlString.split('/').pop();
            const parts = output.split('?');

            return parts[0]
        }
        catch (err) {
            console.log("Error in logger:", err)
            return ""
        }
    }

    toJsonInline(obj) {
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

}

const _defaultFont = 'font-family: "Fira Mono", Arial, sans-serif; font-size:smaller;';
const _defaultStreamOptions = {

    level: _default_loglevel,

    css: {
        levels: {
            trace: `color: DeepPink; ${_defaultFont}`,
            debug: `color: Silver; ${_defaultFont}`,
            info: `color: DarkTurquoise; ${_defaultFont}`,
            warn: `color: GoldenRod; ${_defaultFont}`,
            error: `color: Crimson; ${_defaultFont}`,
            fatal: `color: Black; ${_defaultFont}`,
        },
        def: `color: DimGray; ${_defaultFont}`,
        msg: `color: SteelBlue; ${_defaultFont}`,
        src: `color: DimGray; ${_defaultFont}`,
    },

}

const _defaultOptions = {

    name: "T3B",

    streams: [
        {
            // stream: new ConsoleFormattedStream(_defaultoptions),
            stream: new FormattedStream(_defaultStreamOptions)
        },
    ],

    src: true,

};

export const newlogger = (opts) => {

    const options = Object.assign({}, _defaultOptions, opts);

    return createLogger(options);
}

const plugin = {
    name: 'vue-logger',

    install: (app, options) => {

        if (app.config.globalProperties.$logger) {
            console.warn('[vue-logger] already installed. Vue.use(logger) should be called only once.');
            return;
        }

        app.config.globalProperties.$logger = newlogger(options)

        app.mixin({
            beforeCreate: function () {
                if (!this.$options.logger) return;

                let _mixinOptions = Object.assign({}, _defaultOptions);

                _mixinOptions.name = this.$options.name && !_.isNil(this.$options.name) ? this.$options.name : _mixinOptions.name;

                if (_.isObject(this.$options.logger)) {
                    _mixinOptions = Object.assign(_mixinOptions, this.$options.logger);
                }

                this.$logger = newlogger(_mixinOptions);
            },
        });
    },
};

export default plugin;
