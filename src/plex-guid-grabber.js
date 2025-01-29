console.log("\x1b[36mPGG", "Plex GUID Grabber");

async function getLibraryMetadata(metadataPoster) {
    let details = null;
    const img = metadataPoster.find("img");
    if (img) {
        const imgSrc = img.attr("src");
        if (imgSrc) {
            const url = new URL(imgSrc);
            const serverUrl = `${url.protocol}//${url.host}`;
            const plexToken = url.searchParams.get("X-Plex-Token");

            const urlParam = url.searchParams.get("url");
            const metadataKey = urlParam ?
                decodeURIComponent(urlParam).match(/\/library\/metadata\/(\d+)/)?.[1] : null;

            details = { serverUrl, plexToken, metadataKey };
        }
    }

    const response = await fetch(`${details.serverUrl}/library/metadata/${details.metadataKey}?X-Plex-Token=${details.plexToken}`);
    const xmlDoc = new DOMParser().parseFromString(await response.text(), "text/xml");
    return xmlDoc;
}

async function getGuid(metadata) {
    const directory = metadata.querySelector("Directory, Video");
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Directory:", directory);

    try {
        if (!directory) throw new Error("Main element not found in XML");

        const guid = {
            plex: directory.getAttribute("guid"),
            imdb: null,
            tmdb: null,
            tvdb: null,
        };

        directory.querySelectorAll("Guid").forEach((guidElement) => {
            const id = guidElement.getAttribute("id");
            const [service, value] = id.split("://");
            const serviceLower = service.toLowerCase();
            if (guid.hasOwnProperty(serviceLower)) {
                guid[serviceLower] = value;
            }
        });

        console.log("\x1b[36mPGG", "GUID:", guid);
        return guid;
    } catch (error) {
        console.error("\x1b[36mPGG \x1b[31mError", "Error fetching directory:", error.message);
        return null;
    }
}

function observeMetadataPoster() {
    let isObserving = true;

    const observer = new MutationObserver(async () => {
        if (!isObserving) return;

        if (!window.location.href.includes("%2Flibrary%2Fmetadata%2")) {
            isObserving = false;
            console.debug("\x1b[36mPGG \x1b[32mDebug", "Not a metadata page.");
            return;
        }

        const metadataPoster = $("div[data-testid='metadata-poster']");

        if (metadataPoster.length) {
            isObserving = false;
            const metadata = await getLibraryMetadata(metadataPoster);
            const pageType = metadata.querySelector("Directory, Video").getAttribute("type");
            if (pageType) {
                getGuid(metadata);
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-page-type"]
    });

    const handleNavigation = debounce(() => {
        isObserving = true;
        console.debug("\x1b[36mPGG \x1b[32mDebug", "Navigation detected - resuming observation.");
    }, 100);

    $(window).on("hashchange popstate", handleNavigation);
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

$(document).ready(observeMetadataPoster);
