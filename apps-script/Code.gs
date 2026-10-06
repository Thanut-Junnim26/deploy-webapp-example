/**
 * Google Sheet CRUD API for True Shop Dashboard
 * ---------------------------------------------
 * วางไฟล์นี้ใน Extensions → Apps Script ของ Google Sheet แล้ว Deploy เป็น Web App
 * (ดูขั้นตอนใน apps-script/README.md)
 *
 * GET  ?action=list                       → { ok, headers, rows: [[...], ...] }
 * POST { action: 'auth',   key }           → { ok }
 * POST { action: 'create', key, record }   → { ok, row }
 * POST { action: 'update', key, id, patch }→ { ok, row }
 * POST { action: 'delete', key, id }       → { ok }
 *
 * record / patch = { "<ชื่อหัวคอลัมน์>": value, ... }
 * ฝั่งเว็บต้องส่ง Content-Type: text/plain เพื่อเลี่ยง CORS preflight
 */

const CONFIG = {
  SHEET_GID: 1603101243,       // gid ของแท็บข้อมูล (ดูจาก URL ของ Sheet: ...#gid=XXXX)
  ID_HEADER: 'ID',             // คอลัมน์ ID จะถูกสร้างต่อท้ายให้อัตโนมัติถ้ายังไม่มี
  DATE_HEADER: 'Invoice Date',
  DATE_FORMAT: 'dd/mm/yyyy',
};

// คอลัมน์ที่คำนวณจาก Invoice Date ให้อัตโนมัติ (ข้ามถ้าเซลล์นั้นเป็นสูตรอยู่แล้ว)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function derivedFromDate_(d) {
  return {
    'Month': MONTHS[d.getMonth()],
    'Month2': MONTHS[d.getMonth()] + '-' + String(d.getFullYear()).slice(-2),
    'Day_of_Week': DAYS[d.getDay()],
    'Is_Weekend': d.getDay() === 0 || d.getDay() === 6,
  };
}

/* ---------------- HTTP entry points ---------------- */

function doGet() {
  return handle_(function () {
    const sheet = getSheet_();
    const meta = ensureIds_(sheet);
    return { headers: meta.headers, rows: readAll_(sheet, meta), autoCols: autoCols_(sheet, meta) };
  });
}

function doPost(e) {
  return handle_(function () {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    checkKey_(body.key);
    if (body.action === 'auth') return {};

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const sheet = getSheet_();
      const meta = ensureIds_(sheet);
      switch (body.action) {
        case 'create': return { row: createRow_(sheet, meta, body.record || {}) };
        case 'update': return { row: updateRow_(sheet, meta, body.id, body.patch || {}) };
        case 'delete': deleteRow_(sheet, meta, body.id); return {};
        default: throw apiError_('BAD_ACTION', 'ไม่รู้จัก action: ' + body.action);
      }
    } finally {
      lock.releaseLock();
    }
  });
}

/* ---------------- CRUD ---------------- */

function readAll_(sheet, meta) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, meta.headers.length).getDisplayValues();
  return values.filter(function (r) {
    return r.some(function (v, i) { return i !== meta.idCol - 1 && v !== ''; });
  });
}

// คอลัมน์ที่เว็บไม่ควรให้กรอก: ID, คอลัมน์ที่คำนวณจากวันที่ และคอลัมน์ที่เป็นสูตรในแถวล่าสุด
function autoCols_(sheet, meta) {
  const auto = [CONFIG.ID_HEADER].concat(Object.keys(derivedFromDate_(new Date())));
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(lastRow, 1, 1, meta.headers.length).getFormulas()[0].forEach(function (f, i) {
      if (f) auto.push(meta.headers[i]);
    });
  }
  return auto.filter(function (h, i, a) { return meta.headers.indexOf(h) >= 0 && a.indexOf(h) === i; });
}

function createRow_(sheet, meta, record) {
  const width = meta.headers.length;
  const lastRow = sheet.getLastRow();
  const rowNum = lastRow + 1;
  const target = sheet.getRange(rowNum, 1, 1, width);

  // คัดลอกสูตร/รูปแบบจากแถวล่าสุด เพื่อให้คอลัมน์ที่เป็นสูตรยังทำงานต่อ
  let formulas = new Array(width).fill('');
  if (lastRow >= 2) {
    sheet.getRange(lastRow, 1, 1, width).copyTo(target);
    formulas = target.getFormulas()[0];
  }
  const row = formulas.map(function (f) { return f || ''; });
  row[meta.idCol - 1] = Utilities.getUuid();
  applyPatch_(meta, row, formulas, record);
  target.setValues([row]);
  formatDate_(sheet, meta, rowNum, record, formulas);
  return readRow_(sheet, rowNum, width);
}

function updateRow_(sheet, meta, id, patch) {
  const rowNum = findRow_(sheet, meta, id);
  const width = meta.headers.length;
  const range = sheet.getRange(rowNum, 1, 1, width);
  const formulas = range.getFormulas()[0];
  const values = range.getValues()[0];
  // เซลล์ที่เป็นสูตรเขียนสูตรเดิมกลับไป ที่เหลือคงค่าเดิมไว้ แล้วทับเฉพาะ field ที่ส่งมา
  const row = values.map(function (v, i) { return formulas[i] || v; });
  applyPatch_(meta, row, formulas, patch);
  range.setValues([row]);
  formatDate_(sheet, meta, rowNum, patch, formulas);
  return readRow_(sheet, rowNum, width);
}

function deleteRow_(sheet, meta, id) {
  sheet.deleteRow(findRow_(sheet, meta, id));
}

function applyPatch_(meta, row, formulas, patch) {
  const set = function (header, value) {
    const i = meta.headers.indexOf(header);
    if (i < 0 || i === meta.idCol - 1 || formulas[i]) return;
    row[i] = value;
  };
  Object.keys(patch).forEach(function (key) {
    let value = patch[key];
    if (key === CONFIG.DATE_HEADER) {
      const d = parseDate_(value);
      if (!d) throw apiError_('VALIDATION', 'วันที่ไม่ถูกต้อง: ' + value);
      value = d;
      const derived = derivedFromDate_(d);
      Object.keys(derived).forEach(function (h) { set(h, derived[h]); });
    }
    set(key, value === null || value === undefined ? '' : value);
  });
}

// ตั้งรูปแบบวันที่ให้เซลล์ Invoice Date ที่เพิ่งเขียน (กรณีคอลัมน์เดิมเป็น text)
function formatDate_(sheet, meta, rowNum, patch, formulas) {
  const i = meta.headers.indexOf(CONFIG.DATE_HEADER);
  if (i < 0 || formulas[i] || !(CONFIG.DATE_HEADER in patch)) return;
  sheet.getRange(rowNum, i + 1).setNumberFormat(CONFIG.DATE_FORMAT);
}

/* ---------------- helpers ---------------- */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets().filter(function (s) { return s.getSheetId() === CONFIG.SHEET_GID; })[0];
  if (!sheet) throw apiError_('CONFIG', 'ไม่พบแท็บที่มี gid = ' + CONFIG.SHEET_GID);
  return sheet;
}

function ensureIds_(sheet) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (h) { return String(h).trim(); });
  let idCol = headers.indexOf(CONFIG.ID_HEADER) + 1;
  if (!idCol) {
    idCol = lastCol + 1;
    sheet.getRange(1, idCol).setValue(CONFIG.ID_HEADER);
    headers.push(CONFIG.ID_HEADER);
  }
  // เติม ID ให้แถวที่ยังไม่มี (เช่นแถวที่เพิ่มเองใน Sheet)
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const range = sheet.getRange(2, idCol, lastRow - 1, 1);
    const ids = range.getValues();
    let changed = false;
    ids.forEach(function (r) { if (!r[0]) { r[0] = Utilities.getUuid(); changed = true; } });
    if (changed) range.setValues(ids);
  }
  return { headers: headers, idCol: idCol };
}

function findRow_(sheet, meta, id) {
  if (!id) throw apiError_('VALIDATION', 'ไม่ได้ระบุ id');
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const ids = sheet.getRange(2, meta.idCol, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  }
  throw apiError_('NOT_FOUND', 'ไม่พบแถวที่มี id = ' + id + ' (อาจถูกลบไปแล้ว)');
}

function readRow_(sheet, rowNum, width) {
  SpreadsheetApp.flush();
  return sheet.getRange(rowNum, 1, 1, width).getDisplayValues()[0];
}

// รับได้ทั้ง 'YYYY-MM-DD' (จาก <input type=date>) และ 'DD/MM/YYYY'
function parseDate_(v) {
  if (v instanceof Date) return v;
  const s = String(v || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return validDate_(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return validDate_(+m[3], +m[2], +m[1]);
  return null;
}
function validDate_(y, mo, d) {
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
}

function checkKey_(key) {
  const expected = PropertiesService.getScriptProperties().getProperty('EDIT_KEY');
  if (!expected) throw apiError_('CONFIG', 'ยังไม่ได้ตั้ง EDIT_KEY ใน Project Settings → Script Properties');
  if (key !== expected) throw apiError_('UNAUTHORIZED', 'รหัสแก้ไขข้อมูลไม่ถูกต้อง');
}

function apiError_(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function handle_(fn) {
  let out;
  try {
    out = Object.assign({ ok: true }, fn());
  } catch (err) {
    out = { ok: false, code: err.code || 'ERROR', error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
