// Configure Toastr
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
let plexServer = window.location.origin;
let plexServerOverride = null;

// Add constants at the top
const BUTTON_IDS = {
    PLEX: "plex-guid-button",
    IMDB: "imdb-guid-button",
    TMDB: "tmdb-guid-button",
    TVDB: "tvdb-guid-button"
};

const BUTTON_CONFIG = {
    plex: {
        label: "Copy Plex GUID",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/plex.opti.png"
    },
    imdb: {
        label: "Open IMDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/imdb.opti.png"
    },
    tmdb: {
        label: "Open TMDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tmdb-small.opti.png"
    },
    tvdb: {
        label: "Open TVDB",
        icon: "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tvdb.opti.png"
    }
};

// Logging and notification functions
const LOG_TYPES = {
    INFO: { console: "log", color: "Lime", toastr: "info" },
    DEBUG: { console: "debug", color: "Cyan", toastr: null },
    WARN: { console: "warn", color: "Orange", toastr: "warning" },
    ERROR: { console: "error", color: "Red", toastr: "error" },
    SUCCESS: { console: "log", color: "Lime", toastr: "success" }
};

function logMessage(type, message, useToastr = false, title = programName) {
    const logConfig = LOG_TYPES[type];
    console[logConfig.console](`${programName} ${type}: %c${message}`, `color:${logConfig.color}`);

    if (useToastr && logConfig.toastr) {
        toastr[logConfig.toastr](message, title);
    }
}

// Simplified logging functions
const log = (message) => logMessage("INFO", message);
const logDebug = (message) => logMessage("DEBUG", message);
const logWarn = (message) => logMessage("WARN", message);
const logError = (message) => logMessage("ERROR", message);

// Simplified notification functions
const notify = (message, title) => logMessage("INFO", message, true, title);
const notifySuccess = (message, title) => logMessage("SUCCESS", message, true, title);
const notifyWarn = (message, title) => logMessage("WARN", message, true, title);
const notifyError = (message, title) => logMessage("ERROR", message, true, title);

function throwError(message) {
    logError(message);
    throw new Error(`${programName} Error: ${message}`);
}

// Script initialization
log("Script initialized");

// Check if we're on the Plex website
if (window.location.origin === "https://app.plex.tv") {
    if (plexServerOverride) {
        log("Setting custom Plex server URL:", plexServerOverride);
        plexServer = plexServerOverride;
    } else {
        logError("Please set the plexWebsiteUrlFix variable according to the GitHub docs.");
        notifyError("Please set the plexWebsiteUrlFix variable according to the GitHub docs.");
        throwError("plexWebsiteUrlFix unset while on the Plex website.");
    }
}

async function test() {
    const testElement = document.querySelector("h1[data-testid=metadata-title]");
    if (!testElement) {
        log("Might be on the main page");
        return null;
    }

    log("Not on the main page");
}

// Function to get GUIDs
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
            plex: mainElement.getAttribute("guid"),
            imdb: null,
            tmdb: null,
            tvdb: null,
            type: contentType
        };

        mainElement.querySelectorAll("Guid").forEach(guidElement => {
            const id = guidElement.getAttribute("id");
            const [service, value] = id.split("://");
            if (guids.hasOwnProperty(service)) guids[service] = value;
        });

        return guids;
    } catch (error) {
        logError(`Error fetching metadata: ${error.message}`);
        return null;
    }
}

// Function to extract metadata key and token from poster element
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

// Optimized button creation
function createButton(type) {
    const config = BUTTON_CONFIG[type];
    const button = document.createElement("button");
    button.id = BUTTON_IDS[type.toUpperCase()];
    button.setAttribute("aria-label", config.label);
    button.className = "_1v4h9jl0 _76v8d62 _76v8d61 _76v8d68 tvbry61 _76v8d6g _76v8d6h _1v25wbq1g _1v25wbq18";
    button.style.marginRight = "8px";
    button.innerHTML = `
        <div class="_1h4p3k00 _1v25wbq8 _1v25wbq1w _1v25wbq1g _1v25wbq1c _1v25wbq14 _1v25wbq3g _1v25wbq2g">
            <img src="${config.icon}" alt="${config.label}" title="${config.label}" style="width: 32px; height: 32px;">
        </div>
    `;
    return button;
}

// Function to add GUID buttons
function addGUIDButtons() {
    if (!buttonContainer || document.getElementById(BUTTON_IDS.PLEX)) return;

    const buttons = {
        plex: { handler: handlePlexButtonClick },
        tmdb: { handler: () => handleExternalButtonClick("tmdb") },
        tvdb: { handler: () => handleExternalButtonClick("tvdb") },
        imdb: { handler: () => handleExternalButtonClick("imdb") }
    };

    Object.entries(buttons).forEach(([type, { handler }]) => {
        const button = createButton(type);
        button.addEventListener("click", handler);
        buttonContainer.prepend(button);
    });

    logDebug("GUID buttons added successfully");
}

// Function to handle Plex button click
async function handlePlexButtonClick() {
    const guids = await getGUIDs();
    if (guids && guids.plex) {
        if (!clipboard) {
            clipboard = new ClipboardJS("#plex-guid-button", {
                text: function () {
                    return guids.plex;
                },
            });
            clipboard.on("success", function (e) {
                toastr.success(guids.plex, "Plex GUID copied successfully!");
                e.clearSelection();
            });
            logDebug("Clipboard.js initialized");
        }
        // Always use ClipboardJS for copying
        clipboard.onClick({ currentTarget: document.getElementById("plex-guid-button") });
    }
}

// Function to handle external button clicks (IMDB, TMDB, TVDB)
async function handleExternalButtonClick(type) {
    const guids = await getGUIDs();
    if (guids && guids[type]) {
        let url;
        switch (type) {
            case "imdb":
                url = `https://www.imdb.com/title/${guids.imdb}/`;
                break;
            case "tmdb":
                url = guids.type === "movie" ? `https://www.themoviedb.org/movie/${guids.tmdb}` : `https://www.themoviedb.org/tv/${guids.tmdb}`;
                break;
            case "tvdb":
                url = guids.type === "movie" ? `https://www.thetvdb.com/dereferrer/movie/${guids.tvdb}` : `https://www.thetvdb.com/dereferrer/series/${guids.tvdb}`;
                break;
        }
        if (url) {
            window.open(url, "_blank");
            toastr.success(`Opened ${type.toUpperCase()} page in a new tab.`);
        }
    } else {
        toastr.warning(`No ${type.toUpperCase()} GUID found for this item.`);
    }
}

// Function to update button visibility
function updateButtonVisibility(guids) {
    if (!guids) return;

    Object.keys(BUTTON_IDS).forEach(type => {
        const button = document.getElementById(BUTTON_IDS[type]);
        if (button) button.style.display = "";
    });
}

// Debounce function to limit the rate of function execution
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Use debouncing for URL change detection
let lastUrl = location.href;
const checkUrlChange = debounce(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        logDebug("URL changed, updating buttons and visibility");
        updateButtonsAndVisibility();
    }
}, 500);

setInterval(checkUrlChange, 1000);

// Cache button container query
function getButtonContainer() {
    return document.querySelector(".PageHeaderRight-pageHeaderRight-j9Yjqh");
}

// Function to check for button container and add buttons
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

// Function to remove existing buttons
function removeExistingButtons() {
    ["plex", "imdb", "tmdb", "tvdb"].forEach((type) => {
        const button = document.getElementById(`${type}-guid-button`);
        if (button) {
            button.remove();
        }
    });
}

// Function to update buttons and their visibility
async function updateButtonsAndVisibility() {
    await test();

    if (checkForButtonContainer()) {
        const guids = await getGUIDs();
        updateButtonVisibility(guids);
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

// Initial check and update
updateButtonsAndVisibility();
