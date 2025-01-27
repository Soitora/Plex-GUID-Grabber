<div align="center">

<a href="https://github.com/RickDB/PlexAniSync/">
    <img src="https://raw.githubusercontent.com/RickDB/PlexAniSync/master/logo.png" alt="PlexAniSync logo" title="PlexAniSync logo" width="80"/>
</a>

# [Plex](https://www.plex.tv/) GUID Grabber

Script to assist in grabbing the GUID for use in [PlexAniSync](https://github.com/RickDB/PlexAniSync/), specifically, for contribution to the [custom mappings](https://github.com/RickDB/PlexAniSync-Custom-Mappings) project.

Also check out [PlexAniSync-Mapping-Assistant](https://github.com/Soitora/PlexAniSync-Mapping-Assistant) to help you map shows for the [custom mappings](https://github.com/RickDB/PlexAniSync-Custom-Mappings) project.

### Repositories

[![RickDB/PlexAniSync - GitHub](https://github-readme-stats.vercel.app/api/pin/?username=RickDB&repo=PlexAniSync&bg_color=161B22&text_color=c9d1d9&title_color=0877d2&icon_color=0877d2&border_radius=8&hide_border=true)](https://github.com/RickDB/PlexAniSync/)
[![RickDB/PlexAniSync-Custom-Mappings - GitHub](https://github-readme-stats.vercel.app/api/pin/?username=RickDB&repo=PlexAniSync-Custom-Mappings&bg_color=161B22&text_color=c9d1d9&title_color=0877d2&icon_color=0877d2&border_radius=8&hide_border=true)](https://github.com/RickDB/PlexAniSync-Custom-Mappings/)
[![Soitora/PlexAniSync-Mapping-Assistant - GitHub](https://github-readme-stats.vercel.app/api/pin/?username=Soitora&repo=PlexAniSync-Mapping-Assistant&bg_color=161B22&text_color=c9d1d9&title_color=0877d2&icon_color=0877d2&border_radius=8&hide_border=true)](https://github.com/Soitora/PlexAniSync-Mapping-Assistant/)

## Guide (WIP)

</div>
<div align="left">

To use this script, install it using a Userscript manager like [Violentmonkey](https://violentmonkey.github.io/), [Tampermonkey](https://www.tampermonkey.net/), etc.
Then it should add buttons to the top-right of your screen inside movies/series. If it doesn't, check that the URL matches what this script uses.

<img src="https://gist.github.com/user-attachments/assets/635411fd-f018-4ea4-8a44-4e9ce6bbda30" alt="Plex - GUID Grabber View" title="Plex - GUID Grabber View" width="500"/>

To use this on the https://app.plex.tv domain, please change the value of `plexServerOverride` to the URL found on "**View XML**" when you click "**Get Info**" on an episode.

The URL should look something like "`https://192.168.1.2.abc123.plex.direct:32400`", this must not contain a slash after the port numbers.

<img src="https://gist.github.com/user-attachments/assets/41cfe190-54a5-4cb4-8fb5-139ffcdcd3a1" alt="Plex - View XML Button" title="Plex - View XML Button" width="500"/>

## Issues

If you have any issues, please open a new issue in the [Issues](https://github.com/Soitora/Plex-GUID-Grabber/issues) section of this repository.

### Credits

Thank you to all the people who have contributed!

<a href="https://github.com/Soitora/Plex-GUID-Grabber/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Soitora/Plex-GUID-Grabber" alt="Plex GUID Grabber contributors" title="Plex GUID Grabber contributors"/>
</a>

## License

<pre>
Copyright © 2025 Soitora

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
</pre>

</div>
