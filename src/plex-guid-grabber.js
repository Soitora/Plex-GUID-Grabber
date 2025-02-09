// SweetAlert2 Toast
const Toast = Swal.mixin({
    toast: true,
    position: "bottom-right",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
});

// Initialize GM values if they don't exist
function initializeGMValues() {
    // Only set if the values don't already exist
    if (GM_getValue("TMDB_API_KEY") === undefined) {
        GM_setValue("TMDB_API_KEY", "");
        console.log("\x1b[36mPGG", "Created TMDB_API_KEY storage");
    }

    if (GM_getValue("TVDB_API_KEY") === undefined) {
        GM_setValue("TVDB_API_KEY", "");
        console.log("\x1b[36mPGG", "Created TVDB_API_KEY storage");
    }

    if (GM_getValue("USE_PAS") === undefined) {
        GM_setValue("USE_PAS", false);
        console.log("\x1b[36mPGG", "Created USE_PAS storage");
    }
}

// Initialize
console.log("\x1b[36mPGG", "🔍 Plex GUID Grabber");
initializeGMValues();

// Variables
let rightButtonContainer = null;

// User configuration - Set these values in your userscript manager
const TMDB_API_KEY = GM_getValue("TMDB_API_KEY", ""); // Default empty
const TVDB_API_KEY = GM_getValue("TVDB_API_KEY", ""); // Default empty
const USE_PAS = GM_getValue("USE_PAS", false); // Default false

const siteConfig = {
    plex: {
        id: "plex-guid-button",
        name: "Plex",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/plex.webp",
        buttonLabel: "Copy Plex GUID",
        visible: ["album", "artist", "movie", "season", "episode", "show"],
    },
    imdb: {
        id: "imdb-guid-button",
        name: "IMDb",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/imdb.webp",
        buttonLabel: "Open IMDB",
        visible: ["movie", "show"],
    },
    tmdb: {
        id: "tmdb-guid-button",
        name: "TMDB",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/tmdb-small.webp",
        buttonLabel: "Open TMDB",
        visible: ["movie", "show"],
    },
    tvdb: {
        id: "tvdb-guid-button",
        name: "TVDB",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/tvdb.webp",
        buttonLabel: "Open TVDB",
        visible: ["movie", "show"],
    },
    mbid: {
        id: "musicbrainz-guid-button",
        name: "MusicBrainz",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/musicbrainz.webp",
        buttonLabel: "Open MusicBrainz",
        visible: ["album", "artist"],
    },
    anidb: {
        id: "anidb-guid-button",
        name: "AniDB",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/anidb.webp",
        buttonLabel: "Open AniDB",
        visible: ["show", "movie"],
    },
    youtube: {
        id: "youtube-guid-button",
        name: "YouTube",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/youtube.webp",
        buttonLabel: "Open YouTube",
        visible: ["movie", "show", "episode"],
    },
    tmdbYaml: {
        id: "tmdb-yaml-button",
        name: "TMDB YAML",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/tmdb-pas.webp",
        buttonLabel: "Copy TMDB YAML",
        visible: ["movie", "show"],
        isYamlButton: true,
    },
    tvdbYaml: {
        id: "tvdb-yaml-button",
        name: "TVDB YAML",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/tvdb-pas.webp",
        buttonLabel: "Copy TVDB YAML",
        visible: ["movie", "show"],
        isYamlButton: true,
    },
};

function handleButtons(metadata, pageType, guid) {
    const leftButtonContainer = $(document).find(".PageHeaderLeft-pageHeaderLeft-GB_cUK");
    const rightButtonContainer = $(document).find(".PageHeaderRight-pageHeaderRight-j9Yjqh");
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Button container found:", rightButtonContainer.length > 0);

    if (!rightButtonContainer.length || $("#" + siteConfig.plex.id).length) return;

    const $directory = $(metadata).find("Directory, Video").first();
    const title = $directory.attr("parentTitle") || $directory.attr("title");

    const buttons = createButtonsConfig(guid, pageType, metadata);

    Object.entries(buttons).forEach(([site, { handler, config }]) => {
        if (config.visible.includes(pageType)) {
            if (config.isYamlButton && !USE_PAS) return;

            let shouldShow = true;
            if (config.isYamlButton) {
                const apiSite = site === "tmdbYaml" ? "tmdb" : "tvdb";
                shouldShow = !!guid[apiSite];
            }

            const $button = createButtonElement(config, shouldShow, guid[site], title);

            if (site === "plex") {
                $button.on("click", () => handlePlexButtonClick(guid[site], config, title));
            } else if (config.isYamlButton) {
                $button.on("click", async () => handleYamlButtonClick(metadata, site, pageType, guid, title));
            } else {
                $button.on("click", (e) => handler(e));
            }

            appendButtonToContainer($button, config, rightButtonContainer, leftButtonContainer);

            setTimeout(() => {
                $button.css("opacity", 1);
            }, 50);
        }
    });
}

function createButtonsConfig(guid, pageType, metadata) {
    return Object.keys(siteConfig).reduce((acc, site) => {
        acc[site] = {
            handler: (event) => handleButtonClick(event, site, guid[site], pageType, metadata),
            config: siteConfig[site],
        };
        return acc;
    }, {});
}

function createButtonElement(config, shouldShow, guid, title) {
    return $("<button>", {
        id: config.id,
        "aria-label": config.buttonLabel,
        class: "_1v4h9jl0 _76v8d62 _76v8d61 _76v8d68 tvbry61 _76v8d6g _76v8d6h _1v25wbq1g _1v25wbq18",
        css: {
            marginRight: "8px",
            display: (config.isYamlButton ? shouldShow : guid) ? "block" : "none",
            opacity: 0,
            transition: "opacity 0.3s ease-in-out",
        },
        html: `
            <div class="_1h4p3k00 _1v25wbq8 _1v25wbq1w _1v25wbq1g _1v25wbq1c _1v25wbq14 _1v25wbq3g _1v25wbq2g">
                <img src="${config.icon}" alt="${config.buttonLabel}" title="${config.buttonLabel}" style="width: 32px; height: 32px;">
            </div>
        `,
    });
}

function handlePlexButtonClick(guid, config, title) {
    GM_setClipboard(guid);
    Toast.fire({
        icon: "success",
        title: `Copied ${config.name} guid to clipboard.`,
        html: `<span><strong>${title}</strong><br>${guid}</span>`,
    });
}

async function handleYamlButtonClick(metadata, site, pageType, guid, title) {
    try {
        const yamlOutput = await generateYamlOutput(metadata, site, pageType, guid);
        console.log("\x1b[36mPGG", "yamlOutput:", yamlOutput);
        if (yamlOutput) {
            GM_setClipboard(yamlOutput);
            console.log("\x1b[36mPGG", "Generated YAML");
            Toast.fire({
                icon: "success",
                title: `Copied YAML output to clipboard`,
                html: `<span><strong>${title}</strong> mapping data copied</span>`,
            });
        }
    } catch (error) {
        console.error("\x1b[36mPGG \x1b[31mError", "Failed to generate YAML:", error);
        Toast.fire({
            icon: "error",
            title: "Failed to generate YAML",
            html: error.message,
        });
    }
}

function appendButtonToContainer($button, config, rightButtonContainer, leftButtonContainer) {
    if (config.isYamlButton || config.id === siteConfig.plex.id) {
        rightButtonContainer.prepend($button);
    } else {
        leftButtonContainer.append($button);
    }
}

// Add a function to check if API keys are set
function checkApiKeys(site) {
    if (site === "tmdb" && !TMDB_API_KEY) {
        Toast.fire({
            icon: "error",
            title: "TMDB API Key Missing",
            html: "Please set your TMDB API key in the userscript settings",
        });
        return false;
    }
    if (site === "tvdb" && !TVDB_API_KEY) {
        Toast.fire({
            icon: "error",
            title: "TVDB API Key Missing",
            html: "Please set your TVDB API key in the userscript settings",
        });
        return false;
    }
    return true;
}

async function handleButtonClick(event, site, guid, pageType, metadata) {
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Button clicked:", site, guid, pageType);

    let title = $(metadata).find("Directory, Video").first();
    title = title.attr("parentTitle") || title.attr("title");

    const urlMap = {
        imdb: `https://www.imdb.com/title/${guid}/`,
        tmdb: pageType === "movie" ? `https://www.themoviedb.org/movie/${guid}` : `https://www.themoviedb.org/tv/${guid}`,
        tvdb: pageType === "movie" ? `https://www.thetvdb.com/dereferrer/movie/${guid}` : `https://www.thetvdb.com/dereferrer/series/${guid}`,
        mbid: pageType === "album" ? `https://musicbrainz.org/album/${guid}` : `https://musicbrainz.org/artist/${guid}`,
        anidb: `https://anidb.net/anime/${guid}`,
        youtube: `https://www.youtube.com/watch?v=${guid}`,
    };

    const url = urlMap[site];

    if (!siteConfig[site].visible.includes(pageType)) {
        Toast.fire({
            icon: "warning",
            title: `${siteConfig[site].name} links are not available for ${pageType} pages.`,
        });
        return;
    }

    if (!guid) {
        Toast.fire({
            icon: "warning",
            title: `No ${siteConfig[site].name} GUID found for this item.`,
        });
        return;
    }

    if (site === "plex") {
        GM_setClipboard(guid);
        Toast.fire({
            icon: "success",
            title: `Copied ${siteConfig[site].name} guid to clipboard.`,
            html: `<span><strong>${title}</strong><br>${guid}</span>`,
        });
        return;
    } else if (url) {
        const ctrlClick = event.ctrlKey || event.metaKey;

        const newTab = window.open(url, "_blank");

        if (!ctrlClick) {
            newTab.focus();
        }

        Toast.fire({
            icon: "success",
            title: `Opened ${siteConfig[site].name} in a new tab.`,
        });
    }
}

async function getGuid(metadata) {
    if (!metadata) return null;

    const $directory = $(metadata).find("Directory, Video").first();
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Directory/Video outerHTML:", $directory[0]?.outerHTML);
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Directory/Video innerHTML:", $directory[0]?.innerHTML);

    if (!$directory.length) {
        console.error("\x1b[36mPGG \x1b[31mError", "Main element not found in XML");
        return null;
    }

    const guid = initializeGuid($directory);

    if (guid.plex?.startsWith("com.plexapp.agents.hama://")) {
        extractHamaGuid(guid, guid.plex);
    }

    $directory.find("Guid").each(function () {
        const guidId = $(this).attr("id");
        if (guidId) {
            const [service, value] = guidId.split("://");
            if (service && value) {
                extractGuid(guid, service, value);
            }
        }
    });

    return guid;
}

function initializeGuid($directory) {
    return {
        plex: $directory.attr("guid"),
        imdb: null,
        tmdb: null,
        tvdb: null,
        mbid: null,
        anidb: null,
        youtube: null,
    };
}

function extractHamaGuid(guid, plexGuid) {
    const match = plexGuid.match(/com\.plexapp\.agents\.hama:\/\/(\w+)-(\d+)/);
    if (match) {
        extractGuid(guid, match[1], match[2]);
    }
}

function extractGuid(guid, service, value) {
    const normalizedService = service.toLowerCase();
    if (normalizedService.startsWith("tsdb")) {
        guid.tmdb = value;
    } else if (guid.hasOwnProperty(normalizedService)) {
        guid[normalizedService] = value;
    }
}

async function getLibraryMetadata(metadataPoster) {
    const img = metadataPoster.find("img").first();
    if (!img?.length) return null;

    const imgSrc = img.attr("src");
    if (!imgSrc) return null;

    const url = new URL(imgSrc);
    const serverUrl = `${url.protocol}//${url.host}`;
    const plexToken = url.searchParams.get("X-Plex-Token");
    const urlParam = url.searchParams.get("url");
    const metadataKey = urlParam?.match(/\/library\/metadata\/(\d+)/)?.[1];

    if (!plexToken || !metadataKey) return null;

    try {
        const response = await fetch(`${serverUrl}/library/metadata/${metadataKey}?X-Plex-Token=${plexToken}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return new DOMParser().parseFromString(await response.text(), "text/xml");
    } catch (error) {
        console.error("\x1b[36mPGG \x1b[31mError", "Failed to fetch metadata:", error.message);
        return null;
    }
}

async function observeMetadataPoster() {
    let isObserving = true;

    const observer = new MutationObserver(
        debounce(async () => {
            if (!isObserving) return;

            if (!window.location.href.includes("%2Flibrary%2Fmetadata%2")) {
                isObserving = false;
                console.debug("\x1b[36mPGG \x1b[32mDebug", "Not a metadata page.");
                return;
            }

            const $metadataPoster = $("div[data-testid='metadata-poster']");
            console.debug("\x1b[36mPGG \x1b[32mDebug", "Metadata poster found:", $metadataPoster.length > 0);

            if (!$metadataPoster.length) return;

            isObserving = false;
            const metadata = await getLibraryMetadata($metadataPoster);
            console.debug("\x1b[36mPGG \x1b[32mDebug", "Metadata retrieved:", !!metadata);

            const pageType = $(metadata).find("Directory, Video").first().attr("type");
            let title = $(metadata).find("Directory, Video").first();
            title = title.attr("parentTitle") || title.attr("title");

            console.log("\x1b[36mPGG", "Type:", pageType);
            console.log("\x1b[36mPGG", "Title:", title);

            if (pageType) {
                const guid = await getGuid(metadata);
                console.log("\x1b[36mPGG", "Guid:", guid);

                if (guid) {
                    handleButtons(metadata, pageType, guid);
                }
            }
        }, 100)
    );

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-page-type"],
    });

    const handleNavigation = debounce(() => {
        isObserving = true;
        console.debug("\x1b[36mPGG \x1b[32mDebug", "Navigation detected - resuming observation.");
    }, 100);

    $(window).on("hashchange popstate", handleNavigation);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

async function fetchApiData(url, headers) {
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("\x1b[36mPGG \x1b[31mError", "Failed to fetch data:", error);
        throw error;
    }
}

async function generateYamlOutput(metadata, site, pageType, guid) {
    const apiSite = site === "tmdbYaml" ? "tmdb" : "tvdb";

    if (!checkApiKeys(apiSite)) return "";

    const mediaType = pageType === "movie" ? "movie" : "tv";
    const $directory = $(metadata).find("Directory, Video").first();
    const plex_guid = $directory.attr("guid");

    // Fetch title from respective API
    let title;
    try {
        if (apiSite === "tmdb") {
            const data = await fetchApiData(`https://api.themoviedb.org/3/${mediaType}/${guid[apiSite]}?api_key=${TMDB_API_KEY}`, {
                Accept: "application/json",
            });
            title = mediaType === "movie" ? data.title : data.name;
        } else {
            // TVDB
            const data = await fetchApiData(`https://api.thetvdb.com/series/${guid[apiSite]}`, {
                Authorization: `Bearer ${TVDB_API_KEY}`,
                Accept: "application/json",
            });
            title = data.data.seriesName;
        }
    } catch (error) {
        return "";
    }

    const data = [
        {
            title: title,
            guid: plex_guid,
            seasons: Array.from({ length: mediaType === "movie" ? 1 : $directory.attr("childCount") || 1 }, (_, i) => ({
                season: i + 1,
                "anilist-id": 0,
            })),
        },
    ];

    let yamlOutput = jsyaml.dump(data, {
        quotingType: `"`,
        forceQuotes: { title: true },
        indent: 2,
    });

    // Remove quotes from guid line
    yamlOutput = yamlOutput.replace(/^(\s*guid: )"([^"]+)"$/gm, "$1$2").trim();

    const url_IMDB = guid.imdb ? `\n  # imdb: https://www.imdb.com/title/${guid.imdb}/` : "";
    const url_TMDB = guid.tmdb ? `\n  # tmdb: https://www.themoviedb.org/${mediaType}/${guid.tmdb}` : "";
    const url_TVDB = guid.tvdb ? `\n  # tvdb: https://www.thetvdb.com/dereferrer/${mediaType === "tv" ? "series" : "movie"}/${guid.tvdb}` : "";

    const guidRegex = /^(\s*guid:.*)$/m;
    return yamlOutput
        .replace(guidRegex, `$1${url_IMDB}${url_TMDB}${url_TVDB}`)
        .replace(/^/gm, "  ")
        .replace(/^\s\s$/gm, "\n");
}

$(document).ready(observeMetadataPoster);
