// ==UserScript==
// @name        Plex GUID Grabber
// @namespace   plex-guid-grabber
// @description Grab the GUID of a Plex entry on demand
// @version     2.0.1
// @icon        https://app.plex.tv/desktop/favicon.ico
// @homepageURL https://soitora.com/Plex-GUID-Grabber/
// @downloadURL https://soitora.com/Plex-GUID-Grabber/plex-guid-grabber.user.js
// @include     *:32400/*
// @include     *://plex.*/*
// @include     https://app.plex.tv/*
// @require     https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.11/clipboard.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js
// @resource    TOASTR_CSS https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.css
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @run-at      document-end
// ==/UserScript==

GM_addStyle(GM_getResourceText("TOASTR_CSS"));
GM_addStyle(`.toast-message {
    width: 400px;
    word-wrap: break-word;
}

#toast-container > div {
    width: 400px;
}

button[id$="-guid-button"] {
    margin-right: 4px;
}

button[id$="-guid-button"]:not([id="imdb-guid-button"]):hover img {
    filter: invert(100%) grayscale(100%) contrast(120%);
}

button[id="imdb-guid-button"]:hover img {
    filter: grayscale(100%) contrast(120%);
}

button[id="imdb-guid-button"] img {
    width: 30px !important;
    height: 30px !important;
}
`);

// Configure Toastr for notifications
toastr.options = {
    closeButton: false,
    debug: false,
    newestOnTop: false,
    progressBar: true,
    positionClass: "toast-bottom-right",
    preventDuplicates: true,
    onclick: null,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "5000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
};

// Variables
let programName = "Plex GUID Grabber";
let buttonContainer = null;
let clipboard = null;
let plexServer = null;

// Add constants at the top
const BUTTON_IDS = {
    PLEX: "plex-guid-button",
    IMDB: "imdb-guid-button",
    TMDB: "tmdb-guid-button",
    TVDB: "tvdb-guid-button",
};

const BUTTON_CONFIG = {
    PLEX: {
        label: "Copy Plex GUID",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/plex.opti.png",
    },
    IMDB: {
        label: "Open IMDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/imdb.opti.png",
    },
    TMDB: {
        label: "Open TMDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tmdb-small.opti.png",
    },
    TVDB: {
        label: "Open TVDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tvdb.opti.png",
    },
};

// Logging and notification functions
const LOG_TYPES = {
    INFO: { console: "log", color: "Lime", toastr: "info" },
    DEBUG: { console: "debug", color: "Cyan", toastr: null },
    WARN: { console: "warn", color: "Orange", toastr: "warning" },
    ERROR: { console: "error", color: "Red", toastr: "error" },
    SUCCESS: { console: "log", color: "Lime", toastr: "success" },
};

/**
 * Logs a message to the console and optionally displays a notification.
 */
function logMessage(type, message, useToastr = false, title = programName) {
    const logConfig = LOG_TYPES[type];
    console[logConfig.console](`${programName} ${type}: %c${message}`, `color:${logConfig.color}`);

    if (useToastr && logConfig.toastr) {
        toastr[logConfig.toastr](message, title);
    }
}

// Shortcuts for logging and notifications
const log = (message) => logMessage("INFO", message);
const logDebug = (message) => logMessage("DEBUG", message);
const logWarn = (message) => logMessage("WARN", message);
const logError = (message) => logMessage("ERROR", message);

const notify = (message, title) => logMessage("INFO", message, true, title);
const notifySuccess = (message, title) => logMessage("SUCCESS", message, true, title);
const notifyWarn = (message, title) => logMessage("WARN", message, true, title);
const notifyError = (message, title) => logMessage("ERROR", message, true, title);

/**
 * Throws an error with a log message.
 */
function throwError(message) {
    logError(message);
    throw new Error(`${programName} Error: ${message}`);
}

// Script initialization
log("Script initialized");

/**
 * Fetches GUIDs from the Plex server for the current media item.
 */
async function getGUIDs() {
    const posterElement = document.querySelector("[class^=MetadataSimplePosterCard-card-], [class^=PrePlayPosterCard-card-]");
    if (!posterElement) {
        logDebug("No poster element found");
        return null;
    }

    const details = extractMetadataDetails(posterElement);
    if (!details) return null;

    try {
        const response = await fetch(`${plexServer}${details.metadataKey}?X-Plex-Token=${details.token}`);
        const xmlDoc = new DOMParser().parseFromString(await response.text(), "text/xml");
        const mainElement = xmlDoc.querySelector("Directory, Video");

        if (!mainElement) throw new Error("Main element not found in XML");

        const contentType = mainElement.getAttribute("type");
        const guids = {
            PLEX: mainElement.getAttribute("guid"),
            IMDB: null,
            TMDB: null,
            TVDB: null,
            type: contentType,
        };

        mainElement.querySelectorAll("Guid").forEach((guidElement) => {
            const id = guidElement.getAttribute("id");
            const [service, value] = id.split("://");
            const serviceUpper = service.toUpperCase();
            if (guids.hasOwnProperty(serviceUpper)) {
                guids[serviceUpper] = value;
            }
        });

        return guids;
    } catch (error) {
        logError(`Error fetching metadata: ${error.message}`);
        return null;
    }
}

/**
 * Extracts metadata key and token from a poster element.
 */
function extractMetadataDetails(element) {
    const linkElement = element.querySelector("a[class^=PosterCardLink-link-]");
    const imgElement = element.querySelector("img");

    if (linkElement && imgElement) {
        const imgURL = new URL(imgElement.src);
        const token = imgURL.searchParams.get("X-Plex-Token");
        const urlParam = imgURL.searchParams.get("url");
        const metadataKey = decodeURIComponent(urlParam).split("/thumb/")[0];
        return { metadataKey, token };
    }
    return null;
}

/**
 * Creates a button element for a given type.
 */
function createButton(type) {
    const config = BUTTON_CONFIG[type];
    const button = document.createElement("button");
    button.id = BUTTON_IDS[type];
    button.setAttribute("aria-label", config.label);
    button.className = "_1v4h9jl0 _76v8d62 _76v8d61 _76v8d68 tvbry61 _76v8d6g _76v8d6h _1v25wbq1g _1v25wbq18";
    button.style.marginRight = "8px";
    button.style.display = "none";
    button.innerHTML = `
        <div class="_1h4p3k00 _1v25wbq8 _1v25wbq1w _1v25wbq1g _1v25wbq1c _1v25wbq14 _1v25wbq3g _1v25wbq2g">
            <img src="${config.icon}" alt="${config.label}" title="${config.label}" style="width: 32px; height: 32px;">
        </div>
    `;
    return button;
}

/**
 * Adds GUID buttons to the page based on the current page type.
 */
function addGUIDButtons() {
    if (!buttonContainer || document.getElementById(BUTTON_IDS.PLEX)) return;

    const metadataPoster = document.querySelector("div[data-testid='metadata-poster']");
    const pageType = metadataPoster ? identifyPageType(metadataPoster) : "Unknown";

    const buttons = {
        PLEX: { handler: handlePlexButtonClick },
        TMDB: { handler: () => handleExternalButtonClick("TMDB") },
        TVDB: { handler: () => handleExternalButtonClick("TVDB") },
        IMDB: { handler: () => handleExternalButtonClick("IMDB") },
    };

    Object.entries(buttons).forEach(([type, { handler }]) => {
        if (BUTTON_VISIBILITY[type].includes(pageType)) {
            const button = createButton(type);
            button.addEventListener("click", handler);
            buttonContainer.prepend(button);
        }
    });

    logDebug("GUID buttons added successfully based on page type");
}

/**
 * Handles the click event for the Plex button, copying the Plex GUID to the clipboard.
 */
async function handlePlexButtonClick() {
    // Always get fresh GUIDs when button is clicked
    const guids = await getGUIDs();
    if (guids && guids.PLEX) {
        // Destroy existing clipboard instance if it exists
        if (clipboard) {
            clipboard.destroy();
            clipboard = null;
        }

        // Create new clipboard instance
        clipboard = new ClipboardJS("#plex-guid-button", {
            text: function () {
                return guids.PLEX;
            },
        });

        clipboard.on("success", function (e) {
            const metadataPoster = document.querySelector("div[data-testid='metadata-poster']");
            const metadataTopLevel = document.querySelector("div[data-testid='metadata-top-level-items']");

            const pageType = metadataPoster ? identifyPageType(metadataPoster) : "Unknown";
            const titleElement = metadataTopLevel.querySelector("h1[data-testid='metadata-title']");

            let title = "N/A";

            if (titleElement) {
                const spanElement = titleElement.querySelector("span");
                title = spanElement ? spanElement.textContent : titleElement.textContent;
            }

            if (pageType === "Season" || pageType === "Episode") {
                const seasonElement = document.querySelector("h2[data-testid='metadata-subtitle']");
                if (seasonElement) {
                    title += ` - ${seasonElement.textContent}`;
                }
            }

            notifySuccess(guids.PLEX, `Plex GUID for "${title}" copied successfully!`);
            e.clearSelection();
        });

        logDebug("New Clipboard.js instance initialized");

        // Trigger the click
        clipboard.onClick({ currentTarget: document.getElementById("plex-guid-button") });
    }
}

// Define global visibility rules
const BUTTON_VISIBILITY = {
    PLEX: ["Album", "Artist", "Movie", "Season", "Episode", "Series"],
    IMDB: ["Movie", "Series"],
    TMDB: ["Movie", "Series"],
    TVDB: ["Movie", "Series"],
};

/**
 * Handles clicks for external service buttons (IMDB, TMDB, TVDB).
 */
async function handleExternalButtonClick(type) {
    const guids = await getGUIDs();
    const metadataPoster = document.querySelector("div[data-testid='metadata-poster']");
    const pageType = metadataPoster ? identifyPageType(metadataPoster) : "Unknown";

    // Check if this button type should be available for current page type
    if (!BUTTON_VISIBILITY[type].includes(pageType)) {
        notifyWarn(`${type} links are not available for ${pageType} pages.`);
        return;
    }

    if (guids && guids[type]) {
        let url;
        switch (type) {
            case "IMDB":
                url = `https://www.imdb.com/title/${guids.IMDB}/`;
                break;
            case "TMDB":
                url = guids.type === "movie" ? `https://www.themoviedb.org/movie/${guids.TMDB}` : `https://www.themoviedb.org/tv/${guids.TMDB}`;
                break;
            case "TVDB":
                url = guids.type === "movie" ? `https://www.thetvdb.com/dereferrer/movie/${guids.TVDB}` : `https://www.thetvdb.com/dereferrer/series/${guids.TVDB}`;
                break;
        }
        if (url) {
            window.open(url, "_blank");
            notifySuccess(`Opened ${type} page in a new tab.`);
        }
    } else {
        notifyWarn(`No ${type} GUID found for this item.`);
    }
}

/**
 * Updates the visibility of buttons based on the current page type and available GUIDs.
 */
async function updateButtonVisibility(guids) {
    // Check if the domain contains "provider/tv.plex.provider.discover"
    if (window.location.href.includes("provider/tv.plex.provider.discover")) {
        Object.values(BUTTON_IDS).forEach((id) => {
            const button = document.getElementById(id);
            if (button) {
                button.style.display = "none";
            }
        });
        return;
    }

    if (!guids) return;

    const metadataPoster = document.querySelector("div[data-testid='metadata-poster']");
    const pageType = metadataPoster ? identifyPageType(metadataPoster) : "Unknown";

    // If page type is Unknown, hide all buttons
    if (pageType === "Unknown") {
        Object.values(BUTTON_IDS).forEach((id) => {
            const button = document.getElementById(id);
            if (button) {
                button.style.display = "none";
            }
        });
        return;
    }

    // Update visibility for each button type we know about
    Object.entries(BUTTON_VISIBILITY).forEach(([type, allowedTypes]) => {
        const button = document.getElementById(BUTTON_IDS[type]);
        if (button) {
            // Show button if page type is in allowed list AND (for external services) has a GUID
            const shouldShow = allowedTypes.includes(pageType) && (type === "PLEX" || guids[type]);
            button.style.display = shouldShow ? "" : "none";
        }
    });
}

/**
 * Handles hash changes in the URL, updating the page type and buttons.
 */
function handleHashChange() {
    logDebug("Hash changed, waiting for metadata poster...");
    // Give the DOM time to update after hash change
    setTimeout(() => {
        const metadataPoster = document.querySelector("div[data-testid='metadata-poster']");
        if (metadataPoster) {
            // Only identify page type if it wasn't already processed
            if (!metadataPoster.hasAttribute("data-page-type")) {
                logDebug("Metadata poster found after hash change");
                const pageType = identifyPageType(metadataPoster);
                metadataPoster.setAttribute("data-page-type", pageType);
            }
        } else {
            logDebug("No metadata poster found after hash change, starting observer");
            startMetadataPosterObserver();
        }
    }, 500);
}

/**
 * Starts an observer to detect changes in the metadata poster.
 */
function startMetadataPosterObserver() {
    // Disconnect existing observer if it exists
    if (observer) {
        observer.disconnect();
    }

    // Start observing the document body for added nodes
    observer.observe(document.body, { childList: true, subtree: true });
    logDebug("Started metadata poster observer");
}

// Update the observer to be more persistent
const observer = new MutationObserver((mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            const metadataPoster = document.querySelector("div[data-testid='metadata-poster']");
            if (metadataPoster) {
                // Only identify page type if it wasn't already found by handleHashChange
                if (!document.querySelector("div[data-testid='metadata-poster'][data-page-type]")) {
                    logDebug("Metadata poster found by observer");
                    const pageType = identifyPageType(metadataPoster);
                    // Mark the poster as processed
                    metadataPoster.setAttribute("data-page-type", pageType);
                    updateButtonsAndVisibility();
                }
                observer.disconnect();
                break;
            }
        }
    }
});

// Initial checks
handleHashChange();

/**
 * Identifies the type of page (e.g., Movie, Series) based on the metadata poster.
 */
function identifyPageType(metadataPoster) {
    let pageType = "Unknown";

    const link = metadataPoster.querySelector("a[aria-label]");
    const subtitleElement = document.querySelector("h2[data-testid='metadata-subtitle']");
    const metadataLine1 = document.querySelector("span[data-testid='metadata-line1']");
    const trackList = document.querySelector("div.AlbumDisc-trackList-uHEYNk");
    const radioButton = document.querySelector("button[data-testid='preplay-radio']");

    // Extract URL from img src if it exists
    const img = metadataPoster.querySelector("img");
    if (img) {
        const imgSrc = img.getAttribute("src");
        if (imgSrc) {
            try {
                const url = new URL(imgSrc);
                const serverUrl = `${url.protocol}//${url.host}`;
                plexServer = serverUrl;
                log(`Server URL: ${serverUrl}`);
            } catch (error) {
                logError(`Error parsing image URL: ${error.message}`);
            }
        }
    }

    // Check if it's an artist by looking for radio button
    if (radioButton) {
        pageType = "Artist";
    }
    // Check if it's an album by looking for track list
    else if (trackList) {
        pageType = "Album";
    }
    // Check if it's a movie by looking for runtime in metadata-line1
    else if (metadataLine1 && metadataLine1.textContent.includes("min")) {
        pageType = "Movie";
    } else if (link) {
        const ariaLabel = link.getAttribute("aria-label");
        const parts = ariaLabel.split(", ");

        if (parts.length === 1) {
            pageType = "Series";
        } else if (parts.length == 2) {
            pageType = "Season";
        } else if (parts.length >= 3) {
            if (subtitleElement && subtitleElement.textContent.includes(parts[1])) {
                pageType = "Season";
            } else {
                pageType = "Episode";
            }
        }
    }

    log(`Current page type: ${pageType}`);
    return pageType;
}

/**
 * Handles navigation changes in the single-page application.
 */
function handleNavigation(newUrl) {
    logDebug("Navigation detected:", newUrl);
    // Wait for DOM to update after navigation
    setTimeout(() => {
        updateButtonsAndVisibility();
        handleHashChange();
    }, 500);
}

// Set up history watcher for SPA navigation
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

// Override pushState
history.pushState = function () {
    originalPushState.apply(this, arguments);
    handleNavigation(location.href);
};

// Override replaceState
history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    handleNavigation(location.href);
};

// Listen for hash changes
window.addEventListener("hashchange", () => handleNavigation(location.hash));

// Listen for popstate (back/forward navigation)
window.addEventListener("popstate", () => handleNavigation(location.href));

// Initial check
handleNavigation(location.href);

/**
 * Caches the button container query for performance.
 */
function getButtonContainer() {
    return document.querySelector(".PageHeaderRight-pageHeaderRight-j9Yjqh");
}

/**
 * Checks for the button container and adds buttons if found.
 */
function checkForButtonContainer() {
    const newButtonContainer = getButtonContainer();
    if (newButtonContainer && newButtonContainer !== buttonContainer) {
        buttonContainer = newButtonContainer;
        removeExistingButtons();
        addGUIDButtons();
        logDebug("Button container found and buttons added.");
        updateButtonsAndVisibility();
    }
    return !!buttonContainer;
}

/**
 * Removes existing GUID buttons from the page.
 */
function removeExistingButtons() {
    ["PLEX", "IMDB", "TMDB", "TVDB"].forEach((type) => {
        const button = document.getElementById(`${type}-guid-button`);
        if (button) {
            button.remove();
        }
    });
}

/**
 * Updates buttons and their visibility based on the current page state.
 */
async function updateButtonsAndVisibility() {
    if (checkForButtonContainer()) {
        // First remove all existing buttons
        removeExistingButtons();
        // Then add new buttons
        addGUIDButtons();
        // Get fresh GUIDs and update visibility
        const guids = await getGUIDs();
        updateButtonVisibility(guids);

        // Also destroy clipboard instance to ensure fresh initialization
        if (clipboard) {
            clipboard.destroy();
            clipboard = null;
            logDebug("Clipboard instance destroyed");
        }
    }
}

// Set up a mutation observer for specific changes
const bodyObserver = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === "childList") {
            for (let node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches(".PageHeaderRight-pageHeaderRight-j9Yjqh") || node.querySelector(".PageHeaderRight-pageHeaderRight-j9Yjqh")) {
                        logDebug("Relevant change detected");
                        updateButtonsAndVisibility();
                        return;
                    }
                }
            }
        }
    }
});

// Observe the body for specific changes
bodyObserver.observe(document.body, { childList: true, subtree: true });
logDebug("Started observing for specific changes");
