let buttonContainer = null;
let clipboard = null;

// Add Toastr CSS
GM_addStyle(GM_getResourceText("TOASTR_CSS"));

// Add custom CSS for wider toasts
GM_addStyle(`
        .toast-message {
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

function log(message) {
    console.log(`PLEX_GUID_GRABBER:`, message);
}

function logDebug(type, content) {
    console.debug(`PLEX_GUID_GRABBER_DEBUG:`, type, content);
}

log("Script initialized");

let plexServer = window.location.origin;
let plexServerOverride = null; // Check the GitHub docs for how to setup this.

if (window.location.origin === "https://app.plex.tv") {
    if (plexServerOverride) {
        log("Setting custom Plex server URL:", plexServerOverride);
        plexServer = plexServerOverride;
    } else {
        toastr.error("Please set the plexWebsiteUrlFix variable according to the GitHub docs.");
    }
}

// Function to get GUIDs
async function getGUIDs() {
    const posterElement = document.querySelector("[class^=MetadataSimplePosterCard-card-], [class^=PrePlayPosterCard-card-]");
    if (!posterElement) {
        log("No poster element found");
        return null;
    }

    const details = extractMetadataDetails(posterElement);
    if (!details) {
        log("Unable to extract metadata details.");
        return null;
    }

    const { metadataKey, token } = details;
    const metadataUrl = `${plexServer}${metadataKey}?X-Plex-Token=${token}`;

    try {
        const response = await fetch(metadataUrl);
        //logDebug("response", response)
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        //logDebug("xmlDoc", xmlDoc)
        const mainElement = xmlDoc.querySelector("Directory") || xmlDoc.querySelector("Video");
        //logDebug("mainElement", mainElement)

        if (mainElement) {
            const contentType = mainElement.getAttribute("type");
            const guids = {
                plex: mainElement.getAttribute("guid"),
                imdb: null,
                tmdb: null,
                tvdb: null,
                type: contentType,
            };

            const guidElements = mainElement.querySelectorAll("Guid");
            guidElements.forEach((guidElement) => {
                const id = guidElement.getAttribute("id");
                if (id.startsWith("tmdb://")) guids.tmdb = id.replace("tmdb://", "");
                if (id.startsWith("tvdb://")) guids.tvdb = id.replace("tvdb://", "");
                if (id.startsWith("imdb://")) guids.imdb = id.replace("imdb://", "");
            });

            log(`GUIDs fetched: ${JSON.stringify(guids)}`);
            return guids;
        } else {
            throw new Error("Main element (Directory or Video) not found in XML");
        }
    } catch (error) {
        console.error("Plex GUID Grabber: Error fetching metadata:", error);
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

// Function to create a button
function createButton(id, label, iconUrl, clickHandler) {
    const button = document.createElement("button");
    button.id = id;
    button.setAttribute("aria-label", label);
    button.className = "_1v4h9jl0 _76v8d62 _76v8d61 _76v8d68 tvbry61 _76v8d6g _76v8d6h _1v25wbq1g _1v25wbq18";
    button.style.marginRight = "8px";
    button.innerHTML = `
            <div class="_1h4p3k00 _1v25wbq8 _1v25wbq1w _1v25wbqg _1v25wbq1g _1v25wbq1c _1v25wbq14 _1v25wbq3g _1v25wbq2g">
                <img src="${iconUrl}" alt="${label}" title="${label}" style="width: 32px; height: 32px;">
            </div>
        `;
    button.addEventListener("click", clickHandler);
    return button;
}

// Function to add GUID buttons
function addGUIDButtons() {
    if (buttonContainer && !document.getElementById("plex-guid-button")) {
        const plexButton = createButton(
            "plex-guid-button",
            "Copy Plex GUID",
            "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/plex.opti.png",
            handlePlexButtonClick
        );
        buttonContainer.prepend(plexButton);

        const tmdbButton = createButton(
            "tmdb-guid-button",
            "Open TMDB",
            "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tmdb-small.opti.png",
            () => handleExternalButtonClick("tmdb")
        );
        buttonContainer.prepend(tmdbButton);

        const tvdbButton = createButton(
            "tvdb-guid-button",
            "Open TVDB",
            "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/tvdb.opti.png",
            () => handleExternalButtonClick("tvdb")
        );
        buttonContainer.prepend(tvdbButton);

        const imdbButton = createButton(
            "imdb-guid-button",
            "Open IMDB",
            "https://raw.githubusercontent.com/Soitora/PlexAniSync-Mapping-Assistant/main/.github/icons/imdb.opti.png",
            () => handleExternalButtonClick("imdb")
        );
        buttonContainer.prepend(imdbButton);

        log("GUID buttons added successfully");
    }
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
            log("Clipboard.js initialized");
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
    log(`Updating button visibility with GUIDs: ${JSON.stringify(guids)}`);
    ["imdb", "tmdb", "tvdb"].forEach((type) => {
        const button = document.getElementById(`${type}-guid-button`);
        if (button) {
            // Always show the button
            button.style.display = "";
            log(`${type} button: showing`);
        }
    });

    // Always show the Plex GUID button
    const plexButton = document.getElementById("plex-guid-button");
    if (plexButton) {
        plexButton.style.display = "";
        log("Showing Plex button");
    }
}

// Function to check for button container and add buttons
function checkForButtonContainer() {
    const newButtonContainer = document.querySelector(".PageHeaderRight-pageHeaderRight-j9Yjqh");
    if (newButtonContainer && newButtonContainer !== buttonContainer) {
        buttonContainer = newButtonContainer;
        removeExistingButtons();
        addGUIDButtons();
        log("Button container found and buttons added.");
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
                        log("Relevant change detected");
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
log("Started observing for specific changes");

// Set up an interval to check for URL changes
let lastUrl = location.href;
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        log("URL changed, updating buttons and visibility");
        updateButtonsAndVisibility();
    }
}, 1000);

// Initial check and update
updateButtonsAndVisibility();

log("Script setup complete");
