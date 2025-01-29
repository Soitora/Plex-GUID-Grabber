console.log("\x1b[36mPGG", "Plex GUID Grabber");

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
        const response = await fetch(
            `${serverUrl}/library/metadata/${metadataKey}?X-Plex-Token=${plexToken}`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return new DOMParser().parseFromString(await response.text(), "text/xml");
    } catch (error) {
        console.error("\x1b[36mPGG \x1b[31mError", "Failed to fetch metadata:", error.message);
        return null;
    }
}

async function getGuid(metadata) {
    if (!metadata) return null;

    const directory = metadata.querySelector("Directory, Video");
    console.debug("\x1b[36mPGG \x1b[32mDebug", "Directory:", directory);

    if (!directory) {
        console.error("\x1b[36mPGG \x1b[31mError", "Main element not found in XML");
        return null;
    }

    const guid = {
        plex: directory.getAttribute("guid"),
        imdb: null,
        tmdb: null,
        tvdb: null,
    };

    directory.querySelectorAll("Guid").forEach((guidElement) => {
        const [service, value] = guidElement.getAttribute("id")?.split("://") ?? [];
        if (service && guid.hasOwnProperty(service.toLowerCase())) {
            guid[service.toLowerCase()] = value;
        }
    });

    console.log("\x1b[36mPGG", "GUID:", guid);
    return guid;
}

function observeMetadataPoster() {
    let isObserving = true;

    const observer = new MutationObserver(
        debounce(async () => {
            if (!isObserving) return;

            if (!window.location.href.includes("%2Flibrary%2Fmetadata%2")) {
                isObserving = false;
                console.debug("\x1b[36mPGG \x1b[32mDebug", "Not a metadata page.");
                return;
            }

            const metadataPoster = $("div[data-testid='metadata-poster']");
            if (!metadataPoster.length) return;

            isObserving = false;
            const metadata = await getLibraryMetadata(metadataPoster);
            const pageType = metadata?.querySelector("Directory, Video")?.getAttribute("type");
            if (pageType) {
                getGuid(metadata);
            }
        }, 100)
    );

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
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

$(document).ready(observeMetadataPoster);
