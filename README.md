<div align="center">
    <img src="https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/banner.png" alt="Plex GUID Grabber logo" title="Plex GUID Grabber logo" height="80" />
    <br>
    Script to assist in grabbing the GUID for use in <a href="https://github.com/RickDB/PlexAniSync/">PlexAniSync</a>, specifically, for contribution to the <a href="https://github.com/RickDB/PlexAniSync-Custom-Mappings">custom mappings</a> project.
    <br>
    Also check out <a href="https://github.com/Soitora/PlexAniSync-Mapping-Assistant">PlexAniSync-Mapping-Assistant</a> to help you map shows for the <a href="https://github.com/RickDB/PlexAniSync-Custom-Mappings">custom mappings</a> project.
</div>

<h2>Table of Contents</h2>
<ul>
    <li><a href="#features">Features</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#repositories">Repositories</a></li>
    <li><a href="#issues">Issues</a></li>
    <li><a href="#credits">Credits</a></li>
    <li><a href="#license">License</a></li>
</ul>

<h3 id="features">Features</h3>
<ul>
    <li><strong>Copy Plex GUID</strong>: Easily copy the GUID of Plex entries for use in other applications.</li>
    <li><strong>Open External Links</strong>: Quickly open related entries on IMDb, TMDB, TVDB, MusicBrainz, AniDB, and YouTube.</li>
    <li><strong>User-Friendly Interface</strong>: Buttons are added directly to the Plex interface for easy access.</li>
    <li><strong>Compatibility</strong>: Works with movies, shows, episodes, albums, and artists.</li>
</ul>

<h2 id="installation">Installation</h2>
<ol>
    <li>Install a Userscript manager like <a href="https://violentmonkey.github.io/">Violentmonkey</a> or <a href="https://www.tampermonkey.net/">Tampermonkey</a>.</li>
    <li>Click on the following link to install the script: <a href="https://soitora.com/Plex-GUID-Grabber/plex-guid-grabber.user.js">Plex GUID Grabber</a>.</li>
</ol>

<h2 id="configuration">Configuration</h2>
<p>To customize the script's behavior, you can modify these settings in your userscript manager:</p>
<ol>
    <li>Open your userscript manager:
        <ul>
            <li>For Violentmonkey: Click the extension icon → Manage → Find "Plex GUID Grabber" → Settings → Values</li>
            <li>For Tampermonkey: Click the extension icon → Dashboard → Find "Plex GUID Grabber" → Edit → Storage</li>
        </ul>
    </li>
    <li>Available settings:
        <ul>
            <li><code>SOCIAL_BUTTON_SEPARATION</code>: Set to <code>true</code> (default) to separate social media buttons to the left side, or <code>false</code> to keep all buttons on the right</li>
            <li><code>USE_SOCIAL_BUTTONS</code>: Set to <code>true</code> (default) to show social media buttons (IMDb, TMDB, etc.), or <code>false</code> to only show the GUID button</li>
        </ul>
    </li>
</ol>

<h3>PlexAniSync Support</h3>
<p>The script includes support for generating YAML mappings for <a href="https://github.com/RickDB/PlexAniSync">PlexAniSync</a>. To enable this feature:</p>

<ol>
    <li>Open your userscript manager:
        <ul>
            <li>For Violentmonkey: Click the extension icon → Manage → Find "Plex GUID Grabber" → Settings → Values</li>
            <li>For Tampermonkey: Click the extension icon → Dashboard → Find "Plex GUID Grabber" → Edit → Storage</li>
        </ul>
    </li>
    <li>Set the following values:
        <ul>
            <li><code>USE_PAS</code>: Set to <code>true</code> to enable PlexAniSync support</li>
            <li><code>TMDB_API_KEY</code>: Your TMDB V3 API key
                <ul>
                    <li>Find your "API Key Auth" here: <a href="https://developer.themoviedb.org/reference/intro/authentication">TMDB Developer Portal</a></li>
                    <li>Or find your "API Key" here: <a href="https://www.themoviedb.org/settings/api">TMDB Settings</a></li>
                </ul>
            </li>
            <li><code>TVDB_API_KEY</code>: Your TVDB V4 API key
                <ul>
                    <li>Get your API key here: <a href="https://thetvdb.com/dashboard/account/apikey">TVDB Dashboard</a></li>
                    <li>Or here: <a href="https://thetvdb.com/api-information">TVDB API Information</a></li>
                </ul>
            </li>
        </ul>
    </li>
    <li>Refresh your Plex page to see the new YAML copy buttons</li>
</ol>

<p>Once enabled, you'll see additional buttons for copying TMDB and TVDB YAML mappings directly to your clipboard, ready to use with PlexAniSync.</p>

<h2 id="usage">Usage</h2>
<p>Once installed, the script will add buttons to the top-right of your screen inside movies/series. If it doesn't, check that the URL matches what this script uses.</p>

<div align="center">
    <img src="https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/preview.png" alt="Plex - GUID Grabber View" title="Plex - GUID Grabber View" width="500" />
</div>

<h2 id="repositories">Repositories</h2>
<a href="https://github.com/RickDB/PlexAniSync/">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=RickDB&repo=PlexAniSync&bg_color=161B22&text_color=c9d1d9&title_color=0877d2&icon_color=0877d2&border_radius=8&hide_border=true" alt="RickDB/PlexAniSync - GitHub" />
</a>
<a href="https://github.com/RickDB/PlexAniSync-Custom-Mappings/">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=RickDB&repo=PlexAniSync-Custom-Mappings&bg_color=161B22&text_color=c9d1d9&title_color=0877d2&icon_color=0877d2&border_radius=8&hide_border=true" alt="RickDB/PlexAniSync-Custom-Mappings - GitHub" />
</a>
<a href="https://github.com/Soitora/PlexAniSync-Mapping-Assistant/">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=Soitora&repo=PlexAniSync-Mapping-Assistant&bg_color=161B22&text_color=c9d1d9&title_color=0877d2&icon_color=0877d2&border_radius=8&hide_border=true" alt="Soitora/PlexAniSync-Mapping-Assistant - GitHub" />
</a>

<h2 id="issues">Issues</h2>
<p>If you have any issues, please open a new issue in the <a href="https://github.com/Soitora/Plex-GUID-Grabber/issues">Issues</a> section of the GitHub repository.</p>

<h2 id="credits">Credits</h2>
<p>Thank you to all the people who have contributed!</p>
<a href="https://github.com/Soitora/Plex-GUID-Grabber/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Soitora/Plex-GUID-Grabber" alt="Plex GUID Grabber contributors" title="Plex GUID Grabber contributors" />
</a>

<h2 id="license">License</h2>
<pre>
Copyright © 2025 Soitora

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.

</pre>
