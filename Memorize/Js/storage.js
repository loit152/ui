(function () {
    "use strict";

    const COOKIE_NAME = "elementMemory";
    const MAX_AGE = 60 * 60 * 24 * 365 * 5;

    function saveState(state) {
        const value = encodeURIComponent(JSON.stringify(state));
        document.cookie =
            COOKIE_NAME + "=" + value +
            "; max-age=" + MAX_AGE +
            "; path=/; SameSite=Lax";
    }

    function loadState() {
        const prefix = COOKIE_NAME + "=";
        const row = document.cookie
            .split("; ")
            .find(function (item) {
                return item.startsWith(prefix);
            });

        if (!row) return null;

        try {
            return JSON.parse(
                decodeURIComponent(row.slice(prefix.length))
            );
        } catch (error) {
            return null;
        }
    }

    function clearState() {
        document.cookie =
            COOKIE_NAME + "=; max-age=0; path=/; SameSite=Lax";
    }

    window.ElementMemoryStorage = {
        saveState: saveState,
        loadState: loadState,
        clearState: clearState
    };
})();
