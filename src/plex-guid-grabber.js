const Toast = Swal.mixin({
    toast: true,
    position: "bottom-right",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
});

// Variables
const buttonConfig = {
    plex: {
        id: "plex-guid-button",
        label: "Copy Plex GUID",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/plex.opti.png",
    },
    imdb: {
        id: "imdb-guid-button",
        label: "Open IMDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/imdb.opti.png",
    },
    tmdb: {
        id: "tmdb-guid-button",
        label: "Open TMDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tmdb-small.opti.png",
    },
    tvdb: {
        id: "tvdb-guid-button",
        label: "Open TVDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tvdb.opti.png",
    },
};

const buttonVisibility = {
    plex: ["album", "artist", "movie", "season", "episode", "show"],
    imdb: ["movie", "show"],
    tmdb: ["movie", "show"],
    tvdb: ["movie", "show"],
};

const siteDisplayNames = {
    plex: "Plex",
    imdb: "IMDb",
    tmdb: "TMDB",
    tvdb: "TVDB",
};

let buttonContainer = null;
let clipboard = null;

// Initialize
console.log("\x1b[36mPGG", "🔍 Plex GUID Grabber");

function handleButtons(metadata, pageType, guid) {
    const buttonContainer = $(document).find(".PageHeaderRight-pageHeaderRight-j9Yjqh");
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Button container found:", buttonContainer.length > 0);

    // Check if container exists or button already exists
    if (!buttonContainer.length || $("#" + buttonConfig.plex.id).length) return;

    const buttons = {
        plex: {
            handler: () => handleButtonClick("plex", guid.plex, pageType, metadata),
            config: buttonConfig.plex,
        },
        tmdb: {
            handler: () => handleButtonClick("tmdb", guid.tmdb, pageType, metadata),
            config: buttonConfig.tmdb,
        },
        tvdb: {
            handler: () => handleButtonClick("tvdb", guid.tvdb, pageType, metadata),
            config: buttonConfig.tvdb,
        },
        imdb: {
            handler: () => handleButtonClick("imdb", guid.imdb, pageType, metadata),
            config: buttonConfig.imdb,
        },
    };

    Object.entries(buttons).forEach(([site, { handler, config }]) => {
        if (buttonVisibility[site].includes(pageType)) {
            const $button = $("<button>", {
                id: config.id,
                "aria-label": config.label,
                class: "_1v4h9jl0 _76v8d62 _76v8d61 _76v8d68 tvbry61 _76v8d6g _76v8d6h _1v25wbq1g _1v25wbq18",
                css: {
                    marginRight: "8px",
                    display: guid[site] ? "block" : "none",
                },
                html: `
                    <div class="_1h4p3k00 _1v25wbq8 _1v25wbq1w _1v25wbq1g _1v25wbq1c _1v25wbq14 _1v25wbq3g _1v25wbq2g">
                        <img src="${config.icon}" alt="${config.label}" title="${config.label}" style="width: 32px; height: 32px;">
                    </div>
                `,
            }).on("click", handler);

            buttonContainer.prepend($button);
        }
    });
}

async function handleButtonClick(site, guid, pageType, metadata) {
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Button clicked:", site, guid, pageType);

    let title = $(metadata).find("Directory, Video").first();
    title = title.attr("parentTitle") || title.attr("title");

    const urlMap = {
        imdb: `https://www.imdb.com/title/${guid}/`,
        tmdb: pageType === "movie" ? `https://www.themoviedb.org/movie/${guid}` : `https://www.themoviedb.org/tv/${guid}`,
        tvdb: pageType === "movie" ? `https://www.thetvdb.com/dereferrer/movie/${guid}` : `https://www.thetvdb.com/dereferrer/series/${guid}`,
    };

    const url = urlMap[site];

    if (!buttonVisibility[site].includes(pageType)) {
        Toast.fire({
            icon: "warning",
            title: `${site} links are not available for ${pageType} pages.`,
        });
        return;
    }

    if (!guid) {
        Toast.fire({
            icon: "warning",
            title: `No ${site} GUID found for this item.`,
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
        clipboard = new ClipboardJS(`#${buttonConfig.plex.id}`, {
            text: () => guid,
        });

        clipboard.on("success", (e) => {
            Toast.fire({
                icon: "success",
                title: `Copied Plex guid to clipboard.`,
                html: `<span><strong>${title}</strong><br>${guid}</span>`,
            });
            e.clearSelection();
        });

        clipboard.onClick({
            currentTarget: $(`#${buttonConfig.plex.id}`)[0],
        });
        return;
    }

    if (url) {
        window.open(url, "_blank");
        Toast.fire({
            icon: "success",
            title: `Opened ${site.toUpperCase()} in a new tab.`,
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
