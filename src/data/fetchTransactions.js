const SHEET_CSV_URL =
    'https://docs.google.com/spreadsheets/d/1v2_cSHm_Jn19BZARhl6XzrShZ99ARAT6emAw8rp1AUk/gviz/tq?tqx=out:csv&gid=395929549';

// Column indices for the 11 focused columns (0-indexed)
const COL = {
    productName: 11,   // Product Name
    qty: 12,           // Qty
    amount: 13,        // Amount
    month: 19,         // Month2
    dayOfWeek: 20,     // Day_of_Week
    isWeekend: 21,     // Is_Weekend
    shopType: 22,      // Shop_Type
    shopName: 23,      // Shop_Name
    productSub: 24,    // Product_Sub
    shopSegment: 25,   // Shop_Segment
    productSegment: 26 // Product_Segment
};

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

/**
 * Fetch transaction data from the published Google Sheet and return
 * an array of objects with only the 11 focused columns.
 */
export async function fetchTransactions() {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);

    const csvText = await response.text();
    const lines = csvText.split('\n').filter((l) => l.trim().length > 0);

    // Skip header row (index 0)
    const dataLines = lines.slice(1);

    return dataLines
        .map((line) => {
            const cols = parseCSVLine(line);
            if (cols.length < 27) return null;

            const qty = parseInt(cols[COL.qty], 10);
            const amount = parseFloat(cols[COL.amount]);

            if (isNaN(qty) || isNaN(amount)) return null;

            return {
                productName: cols[COL.productName] || '',
                qty,
                amount,
                month: cols[COL.month] || '',
                dayOfWeek: cols[COL.dayOfWeek] || '',
                isWeekend: cols[COL.isWeekend] === 'TRUE',
                shopType: cols[COL.shopType] || '',
                shopName: cols[COL.shopName] || '',
                productSub: cols[COL.productSub] || '',
                shopSegment: cols[COL.shopSegment] || '',
                productSegment: cols[COL.productSegment] || ''
            };
        })
        .filter(Boolean);
}
