// Client for the Apps Script Web App (see apps-script/Code.gs).
// Set VITE_SHEET_API_URL (in .env locally, or the SHEET_API_URL repo variable for GitHub Pages).

export const API_URL = import.meta.env.VITE_SHEET_API_URL || '';
export const hasApi = Boolean(API_URL);

const KEY_STORAGE = 'sheetEditKey';

export class ApiError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

export function getEditKey() {
    try { return localStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
}
export function setEditKey(key) {
    try { localStorage.setItem(KEY_STORAGE, key); } catch { /* storage unavailable */ }
}
export function clearEditKey() {
    try { localStorage.removeItem(KEY_STORAGE); } catch { /* storage unavailable */ }
}

async function parse(res) {
    if (!res.ok) throw new ApiError('HTTP', `เชื่อมต่อ Apps Script ไม่สำเร็จ (${res.status})`);
    let data;
    try { data = await res.json(); } catch {
        throw new ApiError('HTTP', 'Apps Script ตอบกลับไม่ใช่ JSON — ตรวจสอบว่า Deploy เป็น Web App และตั้งสิทธิ์ "Anyone"');
    }
    if (!data.ok) throw new ApiError(data.code, data.error);
    return data;
}

async function post(body) {
    // text/plain avoids a CORS preflight, which Apps Script does not answer.
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
    });
    return parse(res);
}

/** @returns {Promise<{headers: string[], rows: string[][], autoCols: string[]}>} */
export async function listRows() {
    return parse(await fetch(API_URL));
}

export async function checkKey(key) {
    await post({ action: 'auth', key });
}

export async function createRow(record) {
    return (await post({ action: 'create', key: getEditKey(), record })).row;
}

export async function updateRow(id, patch) {
    return (await post({ action: 'update', key: getEditKey(), id, patch })).row;
}

export async function deleteRow(id) {
    await post({ action: 'delete', key: getEditKey(), id });
}
