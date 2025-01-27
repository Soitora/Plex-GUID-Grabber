import fs from "fs";
import write from "write";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));
const version = packageJson.version;

const header = `// ==UserScript==
// @name        Plex GUID Grabber
// @namespace   plex-guid-grabber
// @description Grab the GUID of a Plex entry on demand
// @version     ${version}
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
// @grant       GM_getResourceText`;

// First, ensure the dist directory exists and write the version file
write.sync("dist/version.info", version, {
    overwrite: true,
});

// Read the source file and combine it with the header
fs.readFile("src/plex-guid-grabber.js", "utf8", (err, sourceCode) => {
    if (err) return handleError(err);

    // Write the combined header and source code to the output file
    fs.writeFile("dist/plex-guid-grabber.user.js", header + "\n// ==/UserScript==\n\n" + sourceCode, "utf8", (err) => {
        if (err) return handleError(err);
    });
});

function handleError(err) {
    console.log(err);
    process.exit(1);
}
