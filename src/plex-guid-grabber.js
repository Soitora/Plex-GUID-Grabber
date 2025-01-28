let plexServer;

console.log("\x1b[36mTGUID", "Plex GUID Grabber");

function getServerUrl(metadataPoster) {
    const img = metadataPoster.find("img");
    if (img) {
        const imgSrc = img.attr("src");
        if (imgSrc) {
            const url = new URL(imgSrc);
            const serverUrl = `${url.protocol}//${url.host}`;
            return serverUrl;
        }
    }
}

function identifyPageType(metadataPoster) {
    let pageType;

    const metadataPosterLink = metadataPoster.find("a[aria-label]");
    const metadataSubtitle = $(document).find("h2[data-testid='metadata-subtitle']");
    const metadataLine = $(document).find("span[data-testid='metadata-line1']");

    if (metadataLine && metadataLine.text().includes("min")) {
        pageType = "Movie";
    } else if (metadataPosterLink) {
        const ariaLabel = metadataPosterLink.attr("aria-label");
        const parts = ariaLabel.split(", ");

        if (parts.length === 1) {
            pageType = "Series";
        } else if (parts.length == 2) {
            pageType = "Season";
        } else if (parts.length >= 3) {
            if (metadataSubtitle && metadataSubtitle.text().includes(parts[1])) {
                pageType = "Season";
            } else {
                pageType = "Episode";
            }
        }
    }

    return pageType;
}

function observeMetadataPoster() {
    let isObserving = true;

    const observer = new MutationObserver((mutations) => {
        if (!isObserving) return;
        const metadataPoster = $("div[data-testid='metadata-poster']");

        if (metadataPoster.length) {
            const pageType = identifyPageType(metadataPoster);

            if (pageType) {
                isObserving = false;
                console.log("\x1b[36mTGUID", "Page Type:", pageType);
                console.log("\x1b[36mTGUID", "Server URL:", getServerUrl(metadataPoster));
            }
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-page-type"]
    });

    // Resume observation on hash change or navigation
    $(window).on("hashchange popstate", () => {
        isObserving = true;
        console.debug("\x1b[36mTGUID", "Navigation detected - resuming observation");
    });
}

$(document).ready(observeMetadataPoster);

/*function processData(metadataElement, posterElement, titleElement) {
    console.log("\x1b[36mTGUID", titleElement);
    if (titleElement) {
        const spanElement = titleElement.find("span");
        const customTitle = spanElement ? spanElement.text() : titleElement.text();
    }
}

function logInfo(pageType, title) {
    console.log("\x1b[36mTGUID", pageType);
    console.log("\x1b[36mTGUID", title);
}

function getServerUrl(posterElement) {
    // Extract URL from img src if it exists
    const img = posterElement.find("img");
    if (img.length) {  // jQuery uses .length to check if element exists
        const imgSrc = img.attr("src");
        if (imgSrc) {
            try {
                const url = new URL(imgSrc);
                const serverUrl = `${url.protocol}//${url.host}`;
                plexServer = serverUrl;
                console.log("\x1b[36mTGUID", "Server URL", serverUrl);
            } catch (error) {
                console.error("\x1b[36mTGUID", "Error parsing image URL", error.message);
            }
        }
    } else {
      console.error("\x1b[36mTGUID", "Did not find an image.")
    }
}*/
