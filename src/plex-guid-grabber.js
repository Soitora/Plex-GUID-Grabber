// SweetAlert2 Toast
const Toast = Swal.mixin({
    toast: true,
    position: "bottom-right",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    width: "auto",
    customClass: {
        container: "pgg-toast-container",
    },
});

// Add constants
const LOG_PREFIX = "\x1b[36mPGG";
const DEBUG_PREFIX = "\x1b[36mPGG \x1b[32mDebug";
const ERROR_PREFIX = "\x1b[36mPGG \x1b[31mError";
const DEBOUNCE_DELAY = 100;
const BUTTON_FADE_DELAY = 50;
const BUTTON_MARGIN = "8px";

// Initialize GM values if they don't exist
function initializeGMValues() {
    // Only set if the values don't already exist
    if (GM_getValue("TMDB_API_KEY") === undefined) {
        GM_setValue("TMDB_API_KEY", "");
        console.log(LOG_PREFIX, "Created TMDB_API_KEY storage");
    }

    if (GM_getValue("TVDB_API_KEY") === undefined) {
        GM_setValue("TVDB_API_KEY", "");
        console.log(LOG_PREFIX, "Created TVDB_API_KEY storage");
    }

    if (GM_getValue("USE_PAS") === undefined) {
        GM_setValue("USE_PAS", false);
        console.log(LOG_PREFIX, "Created USE_PAS storage");
    }

    if (GM_getValue("SOCIAL_BUTTON_SEPARATION") === undefined) {
        GM_setValue("SOCIAL_BUTTON_SEPARATION", true);
        console.log(LOG_PREFIX, "Created SOCIAL_BUTTON_SEPARATION storage");
    }

    if (GM_getValue("USE_SOCIAL_BUTTONS") === undefined) {
        GM_setValue("USE_SOCIAL_BUTTONS", true);
        console.log(LOG_PREFIX, "Created USE_SOCIAL_BUTTONS storage");
    }
}

// Initialize
console.log(LOG_PREFIX, "🔍 Plex GUID Grabber");
initializeGMValues();

// Variables
let rightButtonContainer = null;

// User configuration - Set these values in your userscript manager
const TMDB_API_KEY = GM_getValue("TMDB_API_KEY", ""); // Default empty
const TVDB_API_KEY = GM_getValue("TVDB_API_KEY", ""); // Default empty
const USE_PAS = GM_getValue("USE_PAS", false); // Default false
const SOCIAL_BUTTON_SEPARATION = GM_getValue("SOCIAL_BUTTON_SEPARATION", true); // Default true
const USE_SOCIAL_BUTTONS = GM_getValue("USE_SOCIAL_BUTTONS", true); // Default true

const siteConfig = {
    plex: {
        id: "plex-guid-button",
        name: "Plex",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/plex.webp",
        buttonLabel: "Copy Plex GUID",
        visible: ["album", "artist", "movie", "season", "episode", "show"],
        isYamlButton: false,
        isSocialButton: false,
    },
    imdb: {
        id: "imdb-social-button",
        name: "IMDb",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/imdb.webp",
        buttonLabel: "Open IMDB",
        visible: ["movie", "show"],
        isYamlButton: false,
        isSocialButton: true,
    },
    tmdb: {
        id: "tmdb-social-button",
        name: "TMDB",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/tmdb-small.webp",
        buttonLabel: "Open TMDB",
        visible: ["movie", "show"],
        isYamlButton: false,
        isSocialButton: true,
    },
    tvdb: {
        id: "tvdb-social-button",
        name: "TVDB",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/tvdb.webp",
        buttonLabel: "Open TVDB",
        visible: ["movie", "show"],
        isYamlButton: false,
        isSocialButton: true,
    },
    mbid: {
        id: "musicbrainz-social-button",
        name: "MusicBrainz",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/musicbrainz.webp",
        buttonLabel: "Open MusicBrainz",
        visible: ["album", "artist"],
        isYamlButton: false,
        isSocialButton: true,
    },
    anidb: {
        id: "anidb-social-button",
        name: "AniDB",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/anidb.webp",
        buttonLabel: "Open AniDB",
        visible: ["show", "movie"],
        isYamlButton: false,
        isSocialButton: true,
    },
    youtube: {
        id: "youtube-social-button",
        name: "YouTube",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/youtube.webp",
        buttonLabel: "Open YouTube",
        visible: ["movie", "show", "episode"],
        isYamlButton: false,
        isSocialButton: true,
    },
    tmdbYaml: {
        id: "tmdb-yaml-button",
        name: "TMDB YAML",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/tmdb-pas.webp",
        buttonLabel: "Copy TMDB YAML",
        visible: ["movie", "show"],
        isYamlButton: true,
        isSocialButton: false,
    },
    tvdbYaml: {
        id: "tvdb-yaml-button",
        name: "TVDB YAML",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/images/tvdb-pas.webp",
        buttonLabel: "Copy TVDB YAML",
        visible: ["movie", "show"],
        isYamlButton: true,
        isSocialButton: false,
    },
};

function handleButtons(metadata, pageType, guid) {
    const leftButtonContainer = $(document).find(".PageHeaderLeft-pageHeaderLeft-GB_cUK");
    const rightButtonContainer = $(document).find(".PageHeaderRight-pageHeaderRight-j9Yjqh");
    console.debug(DEBUG_PREFIX, "Button container found:", rightButtonContainer.length > 0);

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

            if ($button) {
                // Only proceed if button was created (not null)
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
                }, BUTTON_FADE_DELAY);
            }
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
    // Don't create social buttons if social buttons are disabled
    if (!USE_SOCIAL_BUTTONS && config.isSocialButton) {
        return null;
    }

    const buttonClasses = ["_1v4h9jl0", "_76v8d62", "_76v8d61", "_76v8d68", "tvbry61", "_76v8d6g", "_76v8d6h", "_1v25wbq1g", "_1v25wbq18"].join(" ");

    const imageContainerClasses = ["_1h4p3k00", "_1v25wbq8", "_1v25wbq1w", "_1v25wbq1g", "_1v25wbq1c", "_1v25wbq14", "_1v25wbq3g", "_1v25wbq2g"].join(" ");

    return $("<button>", {
        id: config.id,
        "aria-label": config.buttonLabel,
        class: buttonClasses,
        css: {
            marginRight: BUTTON_MARGIN,
            display: (config.isYamlButton ? shouldShow : guid) ? "block" : "none",
            opacity: 0,
            transition: "opacity 0.3s ease-in-out",
        },
        html: `
            <div class="${imageContainerClasses}">
                <img src="${config.icon}" alt="${config.buttonLabel}" title="${config.buttonLabel}" style="width: 32px; height: 32px;">
            </div>
        `,
    });
}

function handlePlexButtonClick(guid, config, title) {
    console.log(LOG_PREFIX, "GUID Output:", guid);
    try {
        GM_setClipboard(guid);
        Toast.fire({
            icon: "success",
            title: `Copied ${config.name} guid to clipboard.`,
            html: `<span><strong>${title}</strong><br>${guid}</span>`,
        });
    } catch (error) {
        console.error(ERROR_PREFIX, "Failed to copy guid:", error);
    }
}

async function handleYamlButtonClick(metadata, site, pageType, guid, title) {
    try {
        const yamlOutput = await generateYamlOutput(metadata, site, pageType, guid);
        console.log(LOG_PREFIX, "YAML Output:\n", yamlOutput);
        if (yamlOutput) {
            GM_setClipboard(yamlOutput);
            Toast.fire({
                icon: "success",
                title: `Copied YAML output to clipboard.`,
                html: `<span><strong>${title}</strong><br><span class="pgg-toast-yaml">${yamlOutput.replace(/\n/g, "<br>")}</span></span>`,
            });
        }
    } catch (error) {
        console.error(ERROR_PREFIX, "Failed to generate YAML:", error);
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
        if (SOCIAL_BUTTON_SEPARATION) {
            leftButtonContainer.append($button);
        } else {
            rightButtonContainer.prepend($button);
        }
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
    console.debug(DEBUG_PREFIX, "Button clicked:", site, guid, pageType);

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

    if (url) {
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
    console.debug(DEBUG_PREFIX, "Directory/Video outerHTML:", $directory[0]?.outerHTML);
    console.debug(DEBUG_PREFIX, "Directory/Video innerHTML:", $directory[0]?.innerHTML);

    if (!$directory.length) {
        console.error(ERROR_PREFIX, "Main element not found in XML");
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
    if (!img?.length) {
        console.debug(DEBUG_PREFIX, "No image found in metadata poster");
        return null;
    }

    const imgSrc = img.attr("src");
    if (!imgSrc) {
        console.debug(DEBUG_PREFIX, "No src attribute found in image");
        return null;
    }

    const url = new URL(imgSrc);
    const serverUrl = `${url.protocol}//${url.host}`;
    const plexToken = url.searchParams.get("X-Plex-Token");
    const urlParam = url.searchParams.get("url");
    const metadataKey = urlParam?.match(/\/library\/metadata\/(\d+)/)?.[1];

    if (!plexToken || !metadataKey) {
        console.debug(DEBUG_PREFIX, "Missing plexToken or metadataKey", { plexToken: !!plexToken, metadataKey: !!metadataKey });
        return null;
    }

    try {
        const response = await fetch(`${serverUrl}/library/metadata/${metadataKey}?X-Plex-Token=${plexToken}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return new DOMParser().parseFromString(await response.text(), "text/xml");
    } catch (error) {
        console.error(ERROR_PREFIX, "Failed to fetch metadata:", error.message);
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
                console.debug(DEBUG_PREFIX, "Not a metadata page.");
                return;
            }

            const $metadataPoster = $("div[data-testid='metadata-poster']");
            console.debug(DEBUG_PREFIX, "Metadata poster found:", $metadataPoster.length > 0);

            if (!$metadataPoster.length) return;

            isObserving = false;
            const metadata = await getLibraryMetadata($metadataPoster);
            console.debug(DEBUG_PREFIX, "Metadata retrieved:", !!metadata);

            const pageType = $(metadata).find("Directory, Video").first().attr("type");
            let title = $(metadata).find("Directory, Video").first();
            title = title.attr("parentTitle") || title.attr("title");

            console.log(LOG_PREFIX, "Type:", pageType);
            console.log(LOG_PREFIX, "Title:", title);

            if (pageType) {
                const guid = await getGuid(metadata);
                console.log(LOG_PREFIX, "Guid:", guid);

                if (guid) {
                    handleButtons(metadata, pageType, guid);
                }
            }
        }, DEBOUNCE_DELAY)
    );

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-page-type"],
    });

    const handleNavigation = debounce(() => {
        isObserving = true;
        console.debug(DEBUG_PREFIX, "Navigation detected - resuming observation.");
    }, DEBOUNCE_DELAY);

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
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(ERROR_PREFIX, "Failed to fetch data:", error);
        Toast.fire({
            icon: "error",
            title: "API Error",
            html: `Failed to fetch data: ${error.message}`,
        });
        throw error;
    }
}

async function generateYamlOutput(metadata, site, pageType, guid) {
    const apiSite = site === "tmdbYaml" ? "tmdb" : "tvdb";

    if (!checkApiKeys(apiSite)) return "";

    const mediaType = pageType === "movie" ? "movie" : "tv";
    const $directory = $(metadata).find("Directory, Video").first();
    const plex_guid = $directory.attr("guid");

    // Fetch title and seasons data from respective API
    let title;
    let numberOfSeasons = mediaType === "movie" ? 1 : ($directory.attr("childCount") || 1);

    try {
        if (apiSite === "tmdb") {
            const data = await fetchApiData(`https://api.themoviedb.org/3/${mediaType}/${guid[apiSite]}?api_key=${TMDB_API_KEY}`, {
                Accept: "application/json",
            });
            title = mediaType === "movie" ? data.title : data.name;

            // For TV shows, fetch the number of seasons from TMDB
            if (mediaType === "tv") {
                numberOfSeasons = data.number_of_seasons || 1;
            }
        } else {
            // TVDB
            const data = await fetchApiData(`https://api.thetvdb.com/series/${guid[apiSite]}`, {
                Authorization: `Bearer ${TVDB_API_KEY}`,
                Accept: "application/json",
            });
            title = data.data.seriesName;

            // For TV shows, fetch the number of seasons from TVDB
            if (mediaType === "tv") {
                const seasonsData = await fetchApiData(`https://api.thetvdb.com/series/${guid[apiSite]}/episodes/summary`, {
                    Authorization: `Bearer ${TVDB_API_KEY}`,
                    Accept: "application/json",
                });
                // Filter out season 0 (Specials) and get the count
                numberOfSeasons = seasonsData.data.airedSeasons
                    .filter(season => season !== "0")
                    .length || 1;
            }
        }
    } catch (error) {
        return "";
    }

    const data = [
        {
            title: title,
            guid: plex_guid,
            seasons: Array.from({ length: numberOfSeasons }, (_, i) => ({
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
