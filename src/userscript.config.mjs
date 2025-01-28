import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

export const header = `// ==UserScript==
// @name        Plex GUID Grabber2
// @namespace   ${packageJson.name}2
// @description ${packageJson.description}
// @version     ${packageJson.version}
// @icon        https://app.plex.tv/desktop/favicon.ico
// @homepageURL https://soitora.com/Plex-GUID-Grabber/
// @downloadURL https://soitora.com/Plex-GUID-Grabber/plex-guid-grabber.user.js
// @include     *:32400/*
// @include     http://plex.*/*
// @include     https://plex.*/*
// @include     https://app.plex.tv/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.11/clipboard.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js
// @resource    TOASTR_CSS https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @run-at      document-end
// ==/UserScript==`;
