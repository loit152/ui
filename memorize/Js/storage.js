const COOKIE_NAME = "elementMemory";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5;

export function saveState(state) {
    const value = encodeURIComponent(JSON.stringify(state));
    document.cookie =
        `${COOKIE_NAME}=${value}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

export function loadState() {
    const prefix = `${COOKIE_NAME}=`;
    const cookie = document.cookie
        .split("; ")
        .find(row => row.startsWith(prefix));

    if (!cookie) return null;

    try {
        return JSON.parse(decodeURIComponent(cookie.slice(prefix.length)));
    } catch {
        return null;
    }
}

export function clearState() {
    document.cookie =
        `${COOKIE_NAME}=; max-age=0; path=/; SameSite=Lax`;
}
