import * as ENV from '@t3b/app.config';
import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: 'functions-string', level: (ENV.DEBUG) ? 'debug' : 'warn' });

export const isEmpty = (value) => {
    return (value == null || (typeof value === "string" && value.trim().length === 0));
}

String.prototype.concatWithDash = function (...inputs) {
    return concat('-', [this, ...inputs]);
};

String.prototype.contains = function (...searchStrings) {

    for (const searchString of searchStrings) {

        const index = this.toLowerCase().indexOf(searchString.toLowerCase());

        if (index >= 0) {
            return true;
        }

    }
    return false;
};

String.prototype.capitalize = function () {
    return _.startCase(this)
}

export const concatWithDash = (...inputs) => {
    return concat('-', ...inputs);
};

export const concat = (delimiter, ...elements) => {
    const stringElements = elements.map((element) => {
        if (typeof element === 'string') {
            return element;
        } else if (Array.isArray(element)) {
            return element.join(delimiter);
        } else if (typeof element === 'boolean') {
            return element ? 'true' : 'false';
        } else {
            return _.toString(element);
        }
    });

    return stringElements.join(delimiter);
}

export function lTrimChar(string, char) {

    let characters = '';

    for (let i = 0; i < string.length; i++) {
        if (string[i] === char) {
            break;
        }
        characters += string[i];
    }

    return characters;

}
String.prototype.lTrimChar = function (char) {
    return lTrimChar(this, char)
}

const titleCase = (input) => {
    return input.replace(/\b\w/g, (match) => match.toUpperCase());
}

String.prototype.titleCase = function () {
    return titleCase(this)
}

const _encryptString = async (message, secretKey) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const normalizedKey = secretKey.padEnd(32, '0').slice(0, 32); // Adjust the key size to 32 bytes (256 bits)

    // Generate an encryption key from the secret key
    const key = await crypto.subtle.importKey('raw', encoder.encode(normalizedKey), { name: 'AES-GCM' }, false, ['encrypt']);

    // Encrypt the data
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

    // Combine IV and encrypted data for storage or transfer
    const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
    return combined;
};

const _decryptString = async (encryptedData, secretKey) => {
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    const normalizedKey = secretKey.padEnd(32, '0').slice(0, 32); // Adjust the key size to 32 bytes (256 bits)

    // Generate a decryption key from the secret key
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(normalizedKey), { name: 'AES-GCM' }, false, ['decrypt']);

    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

    // Decode the decrypted data back to a string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
};

const _encryptArray = async (array, secretKey) => {
    const encoder = new TextEncoder();

    if (!_.isArray(array))
        array = _.toArray(array)

    // Convert each array element to a string

    const stringArray = array.map(item => String(item));

    // Join the string array into a single string
    const message = stringArray.join(',');

    // Encrypt the stringified array
    return await _encryptString(message, secretKey);
};

const _decryptArray = async (encryptedData, secretKey) => {
    // Decrypt the encrypted data
    const decryptedString = await _decryptString(encryptedData, secretKey);

    // Split the decrypted string into an array of strings
    const stringArray = decryptedString.split(',');

    // Convert each string element back to its original data type
    return stringArray.map(item => JSON.parse(item)); // You can use another parsing method depending on your data
};


const secretKey = 'onedigital1234';

export const encryptObject = async (input) => {
    if (_.isArray(input))
        return await _encryptArray(input, secretKey)
    else
        return await _encryptString(input, secretKey)
}

export const decryptObject = async (input) => {
    if (_.isArray(input))
        return await _decryptArray(input, secretKey)
    else
        return await _decryptString(input, secretKey)
}

Array.prototype.encrypt = async function (input) { await _encryptArray(input, secretKey) }
Array.prototype.decrypt = async function (input) { await _decryptArray(input, secretKey) }

String.prototype.lTrimChar = function (char) {
    return lTrimChar(this, char)
}

export const ensureTrailingSlash = (str) => {
    return str.endsWith('/') ? str : `${str}/`;
}

export const wrapText = (text, maxWidth = 250) => {
    const words = text.split(/\s+/); // Split on whitespace (including non-breaking spaces)

    let wrappedText = "";
    let currentLine = "";

    for (const word of words) {
        if (currentLine.length + word.length > maxWidth) {
            wrappedText += currentLine + "\n";
            currentLine = "";
        }
        currentLine += (currentLine ? " " : "") + word; // Add space for subsequent words
    }

    wrappedText += currentLine; // Add the last line
    return wrappedText;
}

export const truncateText = (text, maxLength = 250, ellipsis = "...") => {

    if (_.isNil(text) || !_.isString(text)) return text

    if (text.length <= maxLength) {
        return text;
    }

    // Truncate the sentence and add ellipsis
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

export const searchContains = (terms, input) => {

    if (!_.isString(terms)) return false
    if (!_.isString(input)) return true

    // Convert both searchTerm and string to lowercase for case-insensitive matching
    const _term = terms.toLowerCase().trim();
    const _input = input.toLowerCase();

    // Split the searchTerm into individual terms (handling potential extra spaces)
    const _terms = _term.split(/\s+/);

    // Check if any of the search terms exist within the string using some
    return _terms.some(term => _input.includes(term));
}

export const isEqualCaseInsensitive = (str1, str2) => {
    if (!_.isString(str1)) return false
    if (!_.isString(str2)) return false
    return str1.toLowerCase() === str2.toLowerCase();
}