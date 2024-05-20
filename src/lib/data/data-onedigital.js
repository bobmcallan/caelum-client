import Dexie from 'dexie';

export const db = new Dexie('onedigital');

db.version(1).stores({ measures: '&id, *measure_name, *source, *division, *purchase_type' });