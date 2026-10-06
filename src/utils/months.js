const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Sortable key for a 'Mmm-YY' label (e.g. 'Mar-26' → 202603). Unknown labels sort last. */
export function monthKey(label) {
    const m = String(label || '').match(/^([A-Za-z]{3})-(\d{2})$/);
    const mi = m ? MONTHS.indexOf(m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()) : -1;
    return mi < 0 ? Number.MAX_SAFE_INTEGER : (2000 + Number(m[2])) * 100 + mi + 1;
}

export const byMonth = (a, b) => monthKey(a) - monthKey(b);
