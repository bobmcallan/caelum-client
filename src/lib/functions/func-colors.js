import chroma from 'chroma-js';
import { newlogger } from '@t3b/lib/vue/vue-logger';

const logger = newlogger({ name: 'color.js', level: 'debug' });

// Define prime hues
const primeHues = [0, 120, 240, 60, 300, 180];

// Generate prime colors with distinctiveness
export var primeColors = [];

for (const hue of primeHues) {
    // Moderate saturation and lightness for clarity
    let color = chroma.hsl(hue, 0.7, 0.5);

    // Ensure sufficient contrast between colors
    let adjustedHue = hue;
    for (const existingColor of primeColors) {
        const contrast = chroma.contrast(color, existingColor);
        if (contrast < 4.5) {
            // Adjust hue slightly for better contrast
            adjustedHue += 10;
            color = chroma.hsl(adjustedHue, 0.7, 0.5);
            break;
        }
    }

    primeColors.push(color);
}

export const pallet = ['rgb(102,26,26)', 'rgb(255,191,191)', 'rgb(229,31,0)', 'rgb(255,162,128)', 'rgb(128,104,96)', 'rgb(153,61,0)',
    'rgb(255,136,0)', 'rgb(51,27,0)', 'rgb(217,166,108)', 'rgb(179,158,134)', 'rgb(115,86,29)', 'rgb(229,184,0)',
    'rgb(255,251,191)', 'rgb(48,51,0)', 'rgb(242,255,64)', 'rgb(138,153,77)', 'rgb(66,166,0)', 'rgb(43,51,38)', 'rgb(0,242,0)',
    'rgb(0,89,24)', 'rgb(54,217,163)', 'rgb(26,102,87)', 'rgb(0,41,51)', 'rgb(121,218,242)', 'rgb(70,126,140)', 'rgb(0,119,179)',
    'rgb(0,102,255)', 'rgb(0,32,242)', 'rgb(182,190,242)', 'rgb(0,0,153)', 'rgb(22,22,89)', 'rgb(73,57,115)', 'rgb(170,102,204)',
    'rgb(184,0,230)', 'rgb(95,0,102)', 'rgb(204,51,133)', 'rgb(89,45,68)', 'rgb(217,163,191)', 'rgb(204,0,54)', 'rgb(51,0,7)', 'rgb(191,96,108)'];


export const namedColors = {
    'red': '#DC143C',
    'blue': '#1f77b4',
    'black': '#000',
    'yellow': '#f1c40f',
    'all': '#000',
    'revenue': '#DC143C',
}
export const defaultColors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']

export const randomColor = () => {
    return chroma.random().hex();
}

export const namedColor = (input) => {
    if (!input) return input;
    return namedColors[input.toLowerCase()]
}

export function getRandChartColor(brightness = 0.4) {
    var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
    return {
        backgroundColor: "rgba(" + rgb.join(",") + ", " + brightness + ")", borderColor: "rgba(" + rgb.join(",") + ", 1)"
    };
}


export function stringToColour(value) {
    return pallet[value.length]
};

export function lightenColor(color, amount) {
    // Check if color is valid
    if (!chroma.valid(color)) {
        throw new Error('Invalid color provided.');
    }

    // Convert color to chroma object
    const chromaColor = chroma(color);

    // Lighten color by specified amount
    const lighterColor = chromaColor.brighten(amount);

    // Get hex representation of lighter color
    const lighterHex = lighterColor.hex();

    // Return lighter color
    return lighterHex;
}

export function washoutColor(color, amount) {
    // Check if color is valid
    if (!chroma.valid(color)) {
        throw new Error('Invalid color provided.');
    }

    // Convert color to chroma object
    const chromaColor = chroma(color);

    // Reduce saturation by specified amount
    const washedColor = chromaColor.desaturate(amount);

    // Increase luminosity by specified amount
    const washedAndLighterColor = washedColor.brighten(amount / 2);

    // Get hex representation of washed color
    const washedHex = washedAndLighterColor.hex();

    // Return washed color
    return washedHex;
}

export function darkenColor(color, amount) {
    // Check if color is valid
    if (!chroma.valid(color)) {
        throw new Error('Invalid color provided.');
    }

    // Convert color to chroma object
    const chromaColor = chroma(color);

    // Darken color by specified amount
    const darkerColor = chromaColor.darken(amount);

    // Get hex representation of darker color
    const darkerHex = darkerColor.hex();

    // Return darker color
    return darkerHex;
}