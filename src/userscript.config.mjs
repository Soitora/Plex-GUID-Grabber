import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

export const header = `// ==UserScript==
// @name        Plex GUID Grabber
// @namespace   ${packageJson.name}
// @description ${packageJson.description}
// @version     ${packageJson.version}
// @icon        https://app.plex.tv/desktop/favicon.ico
// @homepageURL https://soitora.com/Plex-GUID-Grabber/
// @downloadURL https://soitora.com/Plex-GUID-Grabber/plex-guid-grabber.user.js
// @include     *:32400/*
// @include     *://plex.*/*
// @include     https://app.plex.tv/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.11/clipboard.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require     https://cdn.jsdelivr.net/npm/sweetalert2@11
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @run-at      document-end
// ==/UserScript==`;
