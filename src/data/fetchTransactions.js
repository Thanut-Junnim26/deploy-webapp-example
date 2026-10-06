import { hasApi, listRows } from './sheetApi';

const SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/1v2_cSHm_Jn19BZARhl6XzrShZ99ARAT6emAw8rp1AUk/gviz/tq?tqx=out:csv&gid=395929549';

// Dashboard fields → sheet header names. Columns are looked up by header,
// so adding the ID column (or reordering columns) in the sheet is safe.
const FIELDS = {
    invoiceDate: 'Invoice Date',
    productName: 'Product Name',
    qty: 'Qty',
    amount: 'Amount',
    month: 'Month2',
    dayOfWeek: 'Day_of_Week',
    isWeekend: 'Is_Weekend',
    shopType: 'Shop_Type',
    shopName: 'Shop_Name',
    productSub: 'Product_Sub',
    shopSegment: 'Shop_Segment',
    productSegment: 'Product_Segment'
};

export function parseDDMMYYYY(str) {
    if (!str) return null;
    const cleaned = str.replace(/"/g, '').trim();
    const parts = cleaned.split('/');
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    const d = new Date(parseInt(yyyy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
    return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse a single CSV line handling quoted fields with commas.
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++; // skip escaped quote
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
    }
    result.push(current.trim());
    return result;
}

const toNumber = (v) => parseFloat(String(v ?? '').replace(/,/g, ''));

/**
 * Load the raw sheet. Uses the Apps Script API when configured (needed for editing),
 * otherwise falls back to the public CSV export (read-only).
 * @returns {Promise<{headers: string[], rows: string[][], autoCols: string[], source: 'api'|'csv'}>}
 */
export async function fetchSheet() {
    if (hasApi) {
        const data = await listRows();
        return { headers: data.headers, rows: data.rows, autoCols: data.autoCols || [], source: 'api' };
    }

    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);
    const lines = (await response.text()).split('\n').filter((l) => l.trim().length > 0);
    const [headerLine, ...dataLines] = lines;
    return {
        headers: parseCSVLine(headerLine || ''),
        rows: dataLines.map(parseCSVLine),
        autoCols: [],
        source: 'csv'
    };
}

/** Convert raw sheet rows into the transaction objects the dashboard views use. */
export function toTransactions(headers, rows) {
    const idx = Object.fromEntries(Object.entries(FIELDS).map(([k, h]) => [k, headers.indexOf(h)]));
    const idIdx = headers.indexOf('ID');
    const at = (cols, key) => (idx[key] >= 0 ? cols[idx[key]] ?? '' : '');

    return rows
        .map((cols) => {
            const qty = parseInt(toNumber(at(cols, 'qty')), 10);
            const amount = toNumber(at(cols, 'amount'));
            if (isNaN(qty) || isNaN(amount)) return null;

            const invoiceDate = parseDDMMYYYY(at(cols, 'invoiceDate'));

            return {
                id: idIdx >= 0 ? cols[idIdx] : undefined,
                productName: at(cols, 'productName'),
                qty,
                amount,
                month: at(cols, 'month'),
                invoiceDate,
                invoiceDay: invoiceDate ? invoiceDate.getDate() : null,
                dayOfWeek: at(cols, 'dayOfWeek'),
                isWeekend: at(cols, 'isWeekend') === 'TRUE',
                shopType: at(cols, 'shopType'),
                shopName: at(cols, 'shopName'),
                productSub: at(cols, 'productSub'),
                shopSegment: at(cols, 'shopSegment'),
                productSegment: at(cols, 'productSegment')
            };
        })
        .filter(Boolean);
}

export async function fetchTransactions() {
    const { headers, rows } = await fetchSheet();
    return toTransactions(headers, rows);
}
