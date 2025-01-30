// SweetAlert2 Toast
const Toast = Swal.mixin({
    toast: true,
    position: "bottom-right",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
});

// Variables
let buttonContainer = null;
let clipboard = null;

const siteConfig = {
    plex: {
        id: "plex-guid-button",
        name: "Plex",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/plex.opti.png",
        buttonLabel: "Copy Plex GUID",
        visible: ["album", "artist", "movie", "season", "episode", "show"],
    },
    imdb: {
        id: "imdb-guid-button",
        name: "IMDb",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/imdb.opti.png",
        buttonLabel: "Open IMDB",
        visible: ["movie", "show"],
    },
    tmdb: {
        id: "tmdb-guid-button",
        name: "TMDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tmdb-small.opti.png",
        buttonLabel: "Open TMDB",
        visible: ["movie", "show"],
    },
    tvdb: {
        id: "tvdb-guid-button",
        name: "TVDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tvdb.opti.png",
        buttonLabel: "Open TVDB",
        visible: ["movie", "show"],
    },
    mbid: {
        id: "musicbrainz-guid-button",
        name: "MusicBrainz",
        icon: "https://raw.githubusercontent.com/Soitora/Plex-GUID-Grabber/main/.github/icons/musicbrainz.webp",
        buttonLabel: "Open MusicBrainz",
        visible: ["album", "artist"],
    },
};

// Initialize
console.log("\x1b[36mPGG", "🔍 Plex GUID Grabber");

function handleButtons(metadata, pageType, guid) {
    const buttonContainer = $(document).find(".PageHeaderRight-pageHeaderRight-j9Yjqh");
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Button container found:", buttonContainer.length > 0);

    // Check if container exists or button already exists
    if (!buttonContainer.length || $("#" + siteConfig.plex.id).length) return;

    const buttons = Object.keys(siteConfig).reduce((acc, site) => {
        acc[site] = {
            handler: (event) => handleButtonClick(event, site, guid[site], pageType, metadata),
            config: siteConfig[site],
        };
        return acc;
    }, {});

    Object.entries(buttons).forEach(([site, { handler, config }]) => {
        if (siteConfig[site].visible.includes(pageType)) {
            const $button = $("<button>", {
                id: config.id,
                "aria-label": config.buttonLabel,
                class: "_1v4h9jl0 _76v8d62 _76v8d61 _76v8d68 tvbry61 _76v8d6g _76v8d6h _1v25wbq1g _1v25wbq18",
                css: {
                    marginRight: "8px",
                    display: guid[site] ? "block" : "none",
                    opacity: 0,
                    transition: "opacity 0.3s ease-in-out",
                },
                html: `
                    <div class="_1h4p3k00 _1v25wbq8 _1v25wbq1w _1v25wbq1g _1v25wbq1c _1v25wbq14 _1v25wbq3g _1v25wbq2g">
                        <img src="${config.icon}" alt="${config.buttonLabel}" title="${config.buttonLabel}" style="width: 32px; height: 32px;">
                    </div>
                `,
            }).on("click", (e) => handler(e));

            buttonContainer.prepend($button);

            setTimeout(() => {
                $button.css("opacity", 1);
            }, 50);
        }
    });
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
        // Destroy existing clipboard instance if it exists
        if (clipboard) {
            clipboard.destroy();
            clipboard = null;
        }

        // Create new clipboard instance
        clipboard = new ClipboardJS(`#${siteConfig.plex.id}`, {
            text: () => guid,
        });

        clipboard.on("success", (e) => {
            Toast.fire({
                icon: "success",
                title: `Copied ${siteConfig[site].name} guid to clipboard.`,
                html: `<span><strong>${title}</strong><br>${guid}</span>`,
            });
            e.clearSelection();
        });

        clipboard.onClick({
            currentTarget: $(`#${siteConfig.plex.id}`)[0],
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

    // Add debug logging for Directory/Video element
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Directory/Video outerHTML:", $directory[0]?.outerHTML);
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Directory/Video innerHTML:", $directory[0]?.innerHTML);

    if (!$directory.length) {
        console.error("\x1b[36mPGG \x1b[31mError", "Main element not found in XML");
        return null;
    }

    const guid = {
        plex: $directory.attr("guid"),
        imdb: null,
        tmdb: null,
        tvdb: null,
        mbid: null,
    };

    $directory.find("Guid").each(function () {
        const [service, value] = $(this).attr("id")?.split("://") ?? [];
        if (service && guid.hasOwnProperty(service.toLowerCase())) {
            guid[service.toLowerCase()] = value;
        }
    });

    return guid;
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

$(document).ready(observeMetadataPoster);
