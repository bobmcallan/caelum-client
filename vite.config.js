import { defineConfig, splitVendorChunkPlugin } from 'vite'

import vue from '@vitejs/plugin-vue'
import banner_plugin from 'vite-plugin-banner'

// Auto Element loader
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// Very Cool stuff
// https://github.com/antfu/unplugin-icons
// https://icon-sets.iconify.design/
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

// CSS
import UnoCSS from 'unocss/vite'
import presetAttributify from '@unocss/preset-attributify'
import presetUno from '@unocss/preset-uno'
import presetIcons from '@unocss/preset-icons'
// import presetIcons from '@unocss/preset-icons/browser'

// npm i --save-dev unplugin-auto-import
// npm i --save-dev unplugin-vue-components
// npm i --save-dev unplugin-icons
// npm i --save-dev @rollup/plugin-alias
// npm i --save-dev vite-plugin-externals
// npm i --save-dev url-parse

// npm i --save-dev vite-plugin-html
// npm i --save-dev vite-plugin-html-env

// npm i --save-dev versiony
// npm i --save-dev date-fns
// npm i --save-dev envfile
// npm i --save-dev yargs

// npm i -D lodash
// npm i browser-bunyan

// npm i --save-dev vite-plugin-banner
// npm i --save-dev rollup-plugin-scss
// npm i --save-dev variable-replacer

// NOT npm i --save-dev fs
// npm i --save-dev fs-extra

// npm i --save-dev command-line-args
// npm i -D sass
// npm i -D url-parse
// npm i -D got -D
// npm i -D vite-plugin-externals

import rollup_plugin_alias from '@rollup/plugin-alias';
import { viteExternalsPlugin } from 'vite-plugin-externals'
// import VitePluginHtmlEnv from 'vite-plugin-html-env'
import url_parse from 'url-parse';

// import styleImport from 'vite-plugin-style-import'
// import { injectHtml } from 'vite-plugin-html';
// import { createHtmlPlugin } from 'vite-plugin-html'

import versiony from 'versiony';

import format from 'date-fns/format'
import { parse, stringify } from 'envfile'
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs-extra'
import _ from 'lodash';
import path from 'path';

// Element-Plus Plugin
// import ElementPlus from 'unplugin-element-plus/vite'

import * as __package from './package.json';

const rootDir = path.resolve(__dirname);
const Reset = "\x1b[0m"
const FgGreen = "\x1b[32m"
const FgMagenta = "\x1b[35m"

var _date = new Date();
var _year = _date.getFullYear().toString().substr(-2);
var _month = _date.getMonth() + 1;
var _day = _date.getDate();

const args = yargs(hideBin(process.argv)).argv
const mode = args.mode || "production"
console.log("%s[config] %sMODE: %s", FgMagenta, Reset, mode)

const version = (mode == 'development') ?
    versiony
        .from("package.json")
        .major(_year)
        .minor(_month)
        .patch(_day)
        .to("package.json")
        .get()
    :
    versiony
        .from("package.json")
        .get()

const appversion = _.toString(version) + format(_date, ".pp");

// Update .env file
const sourcePath = '.env'
let parsedFile = parse(sourcePath);

parsedFile.VITE_VERSION = appversion
parsedFile.VITE_TITLE = (mode == 'development') ? "DEV::" + __package.title : __package.title
parsedFile.VITE_FAVICON = (mode == 'development') ? "favicon_dev.ico" : "favicon.ico"

// Production 
if (mode != 'development') {
    parsedFile.VITE_API_PORT = '8080'
}

console.log("%s[config] %sVERSION: %s", FgMagenta, Reset, appversion)
console.log("%s[config] %sTITLE: %s", FgMagenta, Reset, parsedFile.VITE_TITLE)
console.log("%s[config] %sFAV: %s", FgMagenta, Reset, parsedFile.VITE_FAVICON)

if (mode == 'development')
    fs.writeFileSync('./.env.development', stringify(parsedFile))
else
    fs.writeFileSync('./.env.production', stringify(parsedFile))
// console.log(stringify(parsedFile))

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
        __VUE_PROD_DEVTOOLS__: 'true',
        __VUE_OPTIONS_API__: 'true'
    },
    server: {
        watch: {
            usePolling: true
        },
        fs: {
            allow: ['..']
        },
        proxy: {
            '/api': {
                configure: config,
                target: {
                    protocol: 'http:',
                    host: 'localhost',
                    port: 4000,
                },
                rewrite: (path) => {
                    // console.log(path)
                    const output = path.replace(/^\/api/, '')
                    // console.log(output)
                    return output
                }
            },
        }
    },

    build: {
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks: {
                    bunyan: ['browser-bunyan'],
                    frisbee: ['frisbee'],
                    // lodash: ['lodash'],
                    luxon: ['luxon'],
                    pinia: ['pinia'],
                    // mande: ['mande'],
                    vuerouter: ['vue-router'],
                }
            },
        }
    },
    plugins: [
        vue(),
        banner_plugin(__package.banner),
        viteExternalsPlugin({
            lodash: 'lodash',
        }),
        rollup_plugin_alias({
            entries: [
                {
                    find: '@t3b',
                    replacement: path.resolve(rootDir, 'src')
                },
            ]
        }),
        Icons({
            autoInstall: true,
            // scale: 1.8,
        }),
        AutoImport({
            resolvers: [ElementPlusResolver()],
        }),
        UnoCSS({
            presets: [
                presetUno(),
                presetAttributify(),
                presetIcons({
                    prefix: 'i-',
                    collections: {
                        carbon: () => import('@iconify-json/carbon/icons.json').then(i => i.default),
                        mdi: () => import('@iconify-json/mdi/icons.json').then(i => i.default),
                    }
                }),
            ]
        }),
        Components({
            resolvers: [
                IconsResolver(),
                ElementPlusResolver()
            ]
        }),

    ],
    sourcemap: true,
})


const config = (proxy, options) => {

    proxy.on('proxyReq', function (proxyReq, req, res, options) {

        // Extract the query params
        let target = options.target.protocol + options.target.host + ":" + options.target.port

        let input = new URL(target + req.originalUrl);
        let output = new URL(target + proxyReq.path);

        //Iterate the search parameters.
        for (let [k, v] of input.searchParams) {
            // console.log("[config] %s:%s", k, v);
            output.searchParams.set(k, v)
        }

        // Write Path
        proxyReq.path = output.pathname + output.search


    });
}