// Application Constants

import { nanoid } from 'nanoid'


export const DEBUG = (import.meta.env.MODE === "development")
export const LOGLEVEL = (DEBUG) ? 'debug' : 'warn'
export const DEVDELAY = 300
export const UIDKEY = (import.meta.env.VITE_UIDKEY) ? import.meta.env.VITE_UIDKEY : "T3B::UIDKEY"
export const TOKENKEY = (import.meta.env.VITE_TOKENKEY) ? import.meta.env.VITE_TOKENKEY : "T3B::USERTOKEN"
export const ACTIVITY_TIMEOUT = (import.meta.env.VITE_ACTIVITY_TIMEOUT) ? import.meta.env.VITE_ACTIVITY_TIMEOUT : 300
export const FREQUENCY = 180

// Events
export const APPLICATIONLOAD = nanoid(10);
export const APPLICATIONFATAL = nanoid(10);

// User Events
export const USERAUTHORIZED = nanoid(10);
export const USERUNAUTHORIZED = nanoid(10);
export const USERREFRESH = nanoid(10);
export const USERRESET = nanoid(10);
export const USERCALLBACK = nanoid(10);
export const USERTOKENUPDATED = nanoid(10);

// Ticket Events
export const TICKERSTART = nanoid(10);
export const TICKERSTOP = nanoid(10);

// Functional Events
export const COLLECTORCREATED = nanoid(10);
export const COLLECTORUPDATED = nanoid(10);

export const PROJECTCREATED = nanoid(10);
export const PROJECTUPDATED = nanoid(10);

