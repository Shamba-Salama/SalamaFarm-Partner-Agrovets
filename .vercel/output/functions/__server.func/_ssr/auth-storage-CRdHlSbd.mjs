//#region node_modules/.nitro/vite/services/ssr/assets/auth-storage-CRdHlSbd.js
var ApiError = class extends Error {
	status;
	body;
	constructor(message, status, body) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.body = body;
	}
};
/** Best-effort message from ApiError, Error, fetch failures, or Supabase payloads. */
function messageFromUnknown(err) {
	if (typeof err === "string" && err.trim()) return err.trim();
	if (err instanceof Error && err.message.trim()) return err.message.trim();
	if (!err || typeof err !== "object") return null;
	const record = err;
	if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
	if (typeof record.detail === "string" && record.detail.trim()) return record.detail.trim();
	if (typeof record.error_description === "string" && record.error_description.trim()) return record.error_description.trim();
	if (typeof record.hint === "string" && record.hint.trim()) return record.hint.trim();
	return null;
}
var ACCESS_KEY = "salamafarm_access_token";
var REFRESH_KEY = "salamafarm_refresh_token";
function canUseStorage() {
	return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function getAccessToken() {
	if (!canUseStorage()) return null;
	return window.localStorage.getItem(ACCESS_KEY);
}
function getRefreshToken() {
	if (!canUseStorage()) return null;
	return window.localStorage.getItem(REFRESH_KEY);
}
function setTokens(access, refresh) {
	if (!canUseStorage()) return;
	window.localStorage.setItem(ACCESS_KEY, access);
	window.localStorage.setItem(REFRESH_KEY, refresh);
}
function clearTokens() {
	if (!canUseStorage()) return;
	window.localStorage.removeItem(ACCESS_KEY);
	window.localStorage.removeItem(REFRESH_KEY);
}
//#endregion
export { messageFromUnknown as a, getRefreshToken as i, clearTokens as n, setTokens as o, getAccessToken as r, ApiError as t };
