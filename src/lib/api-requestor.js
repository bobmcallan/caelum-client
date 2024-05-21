import * as ENV from '@t3b/app.config';
import * as lib from './api-common.js';

import frisbee from 'frisbee';
import { nanoid } from 'nanoid'

import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: "api-requestor", level: ENV.LOGLEVEL });
logger.debug('Loading..');

const __baseurl = lib.removeTrailingSlash(lib.DEFAULTAPIURL)
const __api = new frisbee({ baseURI: __baseurl })
const __devdelay = (ENV.DEVDELAY) ? ENV.DEVDELAY : -1;
const __defaultoptions = {
    headers: {},
    withAuthentication: false,
    withPath: ""
}

export class requestor {

    __options = {
        headers: {},
        path: "",
        withAuthentication: false
    };
    // __headers = {};
    // __path = "";

    constructor(opts = {}) {
        this.__options = Object.assign({}, __defaultoptions, opts)
    }

    async request(req) {

        let __req = Object.assign({}, lib.DEFAULTREQUEST, req)

        // Headers
        // if (this.__options.withAuthentication) {
        //     const auth = authStore();
        //     Object.assign(__req.headers, { [lib.AUTH_KEY]: `Bearer ${auth.$state.token}`, [lib.CLIENT_KEY]: auth.$state.uid, })
        // }


        __req.headers = Object.assign(lib.DEFAULTHEADERS, { [lib.CLIENT_REQUEST_ID]: nanoid(10) }, __req.headers)

        // Path
        if (!_.isEmpty(this.__options.path)) {
            __req.url = "/" + this.__options.path + "/" + __req.url
            __req.url = lib.removeDoubleSlashs(__req.url)
        }

        const apirequest = (api, url, opts) => {

            logger.trace("[apirequest] url:%s", url)
            logger.trace("[apirequest] opts:\n%s", JSON.stringify(opts, null, 2))

            switch (opts.method.toUpperCase()) {

                case "POST":
                    return api.post(url, opts);

                case "PUT":
                    return api.put(url, opts);

                case "DELETE":
                    return api.delete(url, opts);

                default:
                    return api.get(url, opts);
            }

        }

        let resp = await apirequest(__api, __req.url, __req)

        // Dev TESTING
        if (ENV.DEBUG && __devdelay > 0) {
            const delay = ms => new Promise(res => setTimeout(res, ms))
            await delay(__devdelay)
        }

        if (resp.err && !_.isNil(resp.err)) {

            logger.warn("[request] error:%s", resp.err)

            //throw response.err;

        }

        return Object.assign({}, lib.DEFAULTRESPONSE, resp.body);

    }

}

