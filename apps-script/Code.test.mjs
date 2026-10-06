// Runs Code.gs against an in-memory mock of SpreadsheetApp:  npm run test:apps-script
// Mock SpreadsheetApp & friends, then exercise Code.gs end-to-end.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const gsPath = process.argv[2] || new URL('./Code.gs', import.meta.url).pathname;

function makeSheet(grid, formulasGrid) {
  // grid: 2D array (row 0 = header). cells: {v, f}
  let cells = grid.map((r, ri) => r.map((v, ci) => ({ v, f: (formulasGrid?.[ri]?.[ci]) || '' })));
  const width = () => Math.max(...cells.map(r => r.length));
  const cell = (r, c) => {
    while (cells.length < r) cells.push([]);
    const row = cells[r - 1];
    while (row.length < c) row.push({ v: '', f: '' });
    return row[c - 1];
  };
  const evalF = (f, r) => f === '=TEXT_UPPER' ? String(cell(r, 2).v).toUpperCase() : 'F(' + f + ')';
  const isDate = (v) => Object.prototype.toString.call(v) === '[object Date]';
  const disp = (v) => isDate(v)
    ? `${String(v.getDate()).padStart(2, '0')}/${String(v.getMonth() + 1).padStart(2, '0')}/${v.getFullYear()}`
    : v === true ? 'TRUE' : v === false ? 'FALSE' : String(v);
  const range = (r, c, nr = 1, nc = 1) => {
    const each = (fn) => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => fn(cell(r + i, c + j), r + i)));
    return {
      getValues: () => each(x => x.v),
      getDisplayValues: () => each(x => disp(x.v)),
      getFormulas: () => each(x => x.f),
      setValue: (v) => { cell(r, c).v = v; cell(r, c).f = ''; },
      setValues: (vals) => vals.forEach((row, i) => row.forEach((v, j) => {
        const x = cell(r + i, c + j);
        if (typeof v === 'string' && v.startsWith('=')) { x.f = v; x.v = null; } else { x.v = v; x.f = ''; }
      })),
      setNumberFormat: (fmt) => { cell(r, c).fmt = fmt; },
      copyTo: (dst) => { const src = each(x => ({ ...x })); dst._paste(src); },
      _paste: (src) => src.forEach((row, i) => row.forEach((x, j) => Object.assign(cell(r + i, c + j), x))),
    };
  };
  const recompute = () => cells.forEach((row, ri) => row.forEach(x => { if (x.f) x.v = evalF(x.f, ri + 1); }));
  const lastRow = () => { for (let i = cells.length; i > 0; i--) if (cells[i - 1].some(x => x.v !== '' && x.v != null || x.f)) return i; return 0; };
  return {
    getSheetId: () => 1603101243,
    getRange: range,
    getLastRow: lastRow,
    getLastColumn: () => width(),
    deleteRow: (r) => { cells.splice(r - 1, 1); },
    _recompute: recompute,
    _cells: () => cells,
  };
}

const H = ['Type', 'Shop Name', 'Invoice Date', 'Month', 'Month2', 'Upper', 'Day_of_Week', 'Is_Weekend', 'Qty', 'Amount', 'Material Code'];
const sheet = makeSheet([
  H,
  ['Sell-Out', 'ร้าน ก', new Date(2025, 0, 25), 'Jan', 'Jan-25', null, 'Saturday', true, 1, 1999, 3000000123],
  ['Sell-Out', 'ร้าน ข', new Date(2025, 0, 20), 'Jan', 'Jan-25', null, 'Monday', false, 2, 500, 3000000456],
], [[], [, , , , , '=TEXT_UPPER'], [, , , , , '=TEXT_UPPER']]);
sheet._recompute();

let uuid = 0;
let props = { EDIT_KEY: 'secret' };
const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [sheet] }), flush: () => sheet._recompute() },
  Utilities: { getUuid: () => 'id-' + (++uuid) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] }) },
  ContentService: { createTextOutput: (s) => ({ s, setMimeType() { return JSON.parse(s); } }), MimeType: { JSON: 'json' } },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(gsPath, 'utf8'), ctx);
const get = () => ctx.doGet({});
const post = (body) => ctx.doPost({ postData: { contents: JSON.stringify(body) } });

// list: ID column auto-created, IDs backfilled
let res = get();
assert.equal(res.ok, true);
assert.equal(res.headers.at(-1), 'ID');
assert.deepEqual(res.rows.map(r => r.at(-1)), ['id-1', 'id-2']);
assert.equal(res.rows[0][2], '25/01/2025');
assert.deepEqual([...res.autoCols].sort(), ['Day_of_Week', 'ID', 'Is_Weekend', 'Month', 'Month2', 'Upper']);
console.log('✓ list adds ID column, backfills ids, reports auto columns');

// second list keeps the same ids
res = get();
assert.deepEqual(res.rows.map(r => r.at(-1)), ['id-1', 'id-2']);
console.log('✓ ids are stable across reads');

// auth
assert.equal(post({ action: 'auth', key: 'wrong' }).code, 'UNAUTHORIZED');
assert.equal(post({ action: 'auth', key: 'secret' }).ok, true);
assert.equal(post({ action: 'delete', key: 'nope', id: 'id-1' }).code, 'UNAUTHORIZED');
assert.equal(get().rows.length, 2);
console.log('✓ wrong key rejected for writes, nothing changed');

// create with Thai text + derived date fields + formula column copied
res = post({ action: 'create', key: 'secret', record: { 'Type': 'Sell-Out', 'Shop Name': 'ร้าน ค เชียงใหม่', 'Invoice Date': '2025-03-01', Qty: 3, Amount: 2500.5, Upper: 'SHOULD NOT WRITE' } });
assert.equal(res.ok, true, res.error);
const created = res.row;
const col = (row, h) => row[[...H, 'ID'].indexOf(h)];
assert.equal(col(created, 'Shop Name'), 'ร้าน ค เชียงใหม่');
assert.equal(col(created, 'Invoice Date'), '01/03/2025');
assert.equal(col(created, 'Month'), 'Mar');
assert.equal(col(created, 'Month2'), 'Mar-25');
assert.equal(col(created, 'Day_of_Week'), 'Saturday');
assert.equal(col(created, 'Is_Weekend'), 'TRUE');
assert.equal(col(created, 'Upper'), 'ร้าน ค เชียงใหม่'.toUpperCase(), 'formula column should be computed, not overwritten');
assert.equal(col(created, 'Material Code'), '', 'unspecified field should be blank, not copied from previous row');
assert.equal(col(created, 'ID'), 'id-3');
assert.equal(sheet._cells()[3][5].f, '=TEXT_UPPER');
assert.equal(sheet._cells()[3][2].fmt, 'dd/mm/yyyy');
console.log('✓ create: Thai text, derived date fields, formula preserved, blank unspecified');

// update only patched fields; untouched raw values (big number) kept intact
res = post({ action: 'update', key: 'secret', id: 'id-1', patch: { Amount: 2199 } });
assert.equal(res.ok, true, res.error);
assert.equal(col(res.row, 'Amount'), '2199');
assert.equal(sheet._cells()[1][10].v, 3000000123, 'untouched number must be preserved exactly');
assert.equal(sheet._cells()[1][2].v.getTime !== undefined, true, 'untouched date stays a Date');
assert.equal(sheet._cells()[1][5].f, '=TEXT_UPPER', 'formula kept on update');
console.log('✓ update patches only sent fields, keeps raw values and formulas');

// update date recomputes derived fields
res = post({ action: 'update', key: 'secret', id: 'id-2', patch: { 'Invoice Date': '15/02/2025' } });
assert.equal(col(res.row, 'Month2'), 'Feb-25');
assert.equal(col(res.row, 'Day_of_Week'), 'Saturday');
assert.equal(col(res.row, 'Is_Weekend'), 'TRUE');
console.log('✓ changing date recomputes Month/Month2/Day/Weekend');

// invalid date
assert.equal(post({ action: 'update', key: 'secret', id: 'id-2', patch: { 'Invoice Date': '31/02/2025' } }).code, 'VALIDATION');
console.log('✓ invalid date rejected');

// delete middle row, others keep ids
assert.equal(post({ action: 'delete', key: 'secret', id: 'id-2' }).ok, true);
res = get();
assert.deepEqual(res.rows.map(r => r.at(-1)), ['id-1', 'id-3']);
assert.equal(post({ action: 'delete', key: 'secret', id: 'id-2' }).code, 'NOT_FOUND');
console.log('✓ delete by id; deleting again → NOT_FOUND');

// missing EDIT_KEY
props = {};
assert.equal(post({ action: 'auth', key: 'x' }).code, 'CONFIG');
console.log('✓ missing EDIT_KEY reported clearly');
console.log('\nAll Apps Script tests passed');
