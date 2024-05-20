import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: "common", level: (ENV.DEBUG) ? ENV.LOGLEVEL : 'warn' });

// export const DEFAULTAPIURL = `${location.protocol}//${location.hostname}:${location.port}/api` : 
export const DEFAULTAPIURL = `${import.meta.env.VITE_API_PROTOCOL ?? location.protocol}//${import.meta.env.VITE_API_HOSTNAME ?? location.hostname}:${import.meta.env.VITE_API_PORT ?? location.port}/${import.meta.env.VITE_API_PATH ?? 'api'}`

export const DEFAULTHEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, HEAD, OPTIONS"
};

// Auth Header Constants
export const AUTH_KEY = "Authorization"
export const CLIENT_KEY = "x-client-key"
export const CLIENT_ACTION_KEY = "x-client-action"
export const CLIENT_REQUEST_ID = "x-client-requestid"
export const CLIENT_ENV_KEY = "x-client-env"
export const CLIENT_FUNCTION = "x-client-function"

export const DEFAULTREQUEST = {
    method: "",
    headers: {},
    url: "",
    params: null,
    body: null
}

export const DEFAULTREQUESTOPTS = {
    id: '',
    query: null,
    page: 0,
    size: 25,
    cache: false
}

export const DEFAULTRESPONSE = {
    name: "",
    version: "",
    status: 500,
    path: "",
    correlationid: "",
    log: [],
    error: null,
    result: {},
}

export const DEFAULTPAGEDRESPONSE = {
    name: "",
    version: "",
    status: 500,
    correlationid: "",
    path: "",
    log: [],
    error: null,
    result: {
        total: 0,
        page: 0,
        size: 0,
        data: [],
    },
}

export const AUTHRESPONSE = {
    token: "",
    message: "",
    code: 0
}


export function validateRequest(request) {

    try {

        request = Object.assign({}, DEFAULTREQUEST, request)
        request.headers = Object.assign({}, DEFAULTHEADERS, request.headers)

        logger.trace("request:\n%s", JSON.stringify(request, null, 2))

        return request;

    } catch (err) {

        return Object.assign({}, DEFAULTREQUEST, { error: err })

    }

}

export function removeDoubleSlashs(path) {

    return path.replace(/\/\//g, "/");

}

export function removeTrailingSlash(path) {

    return path.replace(/\/$/, "");

}

export function removeLeadingSlashs(path) {

    return path.replace(/^\/+/, '')

}

export function justPath(path) {

    return path.replace(/^\/|\/$/g, '');

}