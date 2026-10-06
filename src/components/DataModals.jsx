import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Lock, AlertTriangle, Sparkles } from 'lucide-react';

export const DATE_FIELD = 'Invoice Date';
export const NUMBER_FIELDS = ['Qty', 'Amount'];
export const REQUIRED_FIELDS = ['Invoice Date', 'Product Name', 'Qty', 'Amount'];
// Columns the Shop/Product dashboards group by — new rows need these to show up in the charts
const DASHBOARD_FIELDS = ['Shop_Type', 'Shop_Name', 'Product_Sub', 'Shop_Segment', 'Product_Segment'];

// DD/MM/YYYY (sheet) ↔ YYYY-MM-DD (<input type="date">)
export const toIsoDate = (s) => {
    const m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
};
const toInputValue = (header, v) =>
    header === DATE_FIELD ? toIsoDate(v) : NUMBER_FIELDS.includes(header) ? String(v ?? '').replace(/,/g, '') : String(v ?? '');
const fromInputValue = (header, v) => (NUMBER_FIELDS.includes(header) && v !== '' ? Number(v) : v);

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 transition-all';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed';
const btnGhost = 'px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-60';

function Modal({ title, onClose, children, footer, width = 'max-w-md', busy }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, busy]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-0 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-label={title} className={`modal-panel w-full ${width} bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]`}>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} disabled={busy} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" aria-label="ปิด"><X size={16} /></button>
                </div>
                <div className="px-5 py-4 overflow-y-auto">{children}</div>
                {footer && <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-slate-100">{footer}</div>}
            </div>
        </div>
    );
}

/** Create (row = null) or edit an existing row. onSave receives a record (create) or a patch of changed fields (edit). */
export function RecordModal({ headers, autoCols, row, allRows, onSave, onClose }) {
    const isEdit = Boolean(row);
    const editable = headers.filter((h) => h && !autoCols.includes(h));
    const initial = useMemo(
        () => Object.fromEntries(editable.map((h) => [h, row ? toInputValue(h, row[headers.indexOf(h)]) : ''])),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [row]
    );
    const [values, setValues] = useState(initial);
    const [errors, setErrors] = useState({});
    const [busy, setBusy] = useState(false);

    // Suggestions from existing values keep spelling consistent (e.g. Shop_Type, Product_Sub)
    const suggestions = useMemo(() => {
        const out = {};
        editable.forEach((h) => {
            if (h === DATE_FIELD || NUMBER_FIELDS.includes(h)) return;
            const i = headers.indexOf(h);
            out[h] = [...new Set(allRows.map((r) => r[i]).filter(Boolean))].slice(0, 300);
        });
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [headers, allRows]);

    const changed = editable.filter((h) => values[h] !== initial[h]);
    const primary = editable.filter((h) => REQUIRED_FIELDS.includes(h));
    const dashboard = editable.filter((h) => DASHBOARD_FIELDS.includes(h));
    const others = editable.filter((h) => !REQUIRED_FIELDS.includes(h) && !DASHBOARD_FIELDS.includes(h));
    const othersChanged = others.filter((h) => changed.includes(h)).length;

    const validate = () => {
        const errs = {};
        REQUIRED_FIELDS.forEach((h) => { if (editable.includes(h) && !String(values[h]).trim()) errs[h] = 'จำเป็นต้องกรอก'; });
        NUMBER_FIELDS.forEach((h) => { if (values[h] !== '' && values[h] !== undefined && isNaN(Number(values[h]))) errs[h] = 'ต้องเป็นตัวเลข'; });
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submit = async (e) => {
        e?.preventDefault();
        if (!validate()) return;
        const fields = isEdit ? changed : editable.filter((h) => values[h] !== '');
        const payload = Object.fromEntries(fields.map((h) => [h, fromInputValue(h, values[h])]));
        setBusy(true);
        try { await onSave(payload); } catch { /* parent shows the error; keep form open */ } finally { setBusy(false); }
    };

    const field = (h) => {
        const type = h === DATE_FIELD ? 'date' : NUMBER_FIELDS.includes(h) ? 'number' : 'text';
        const listId = suggestions[h]?.length ? `dl-${headers.indexOf(h)}` : undefined;
        return (
            <label key={h} className="block">
                <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {h}{REQUIRED_FIELDS.includes(h) && <span className="text-red-500"> *</span>}
                    {isEdit && changed.includes(h) && <span className="ml-1.5 text-[10px] font-bold text-pink-600">แก้ไขแล้ว</span>}
                </span>
                <input
                    type={type}
                    step={type === 'number' ? 'any' : undefined}
                    list={listId}
                    value={values[h] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [h]: e.target.value }))}
                    className={`${inputCls} ${errors[h] ? 'border-red-400' : ''}`}
                    disabled={busy}
                />
                {listId && <datalist id={listId}>{suggestions[h].map((s) => <option key={s} value={s} />)}</datalist>}
                {errors[h] && <span className="block text-[11px] text-red-500 mt-1">{errors[h]}</span>}
            </label>
        );
    };

    const autoShown = autoCols.filter((h) => h !== 'ID' && headers.includes(h));

    return (
        <Modal
            title={isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
            onClose={onClose}
            busy={busy}
            width="max-w-3xl"
            footer={<>
                {isEdit && <span className="mr-auto self-center text-xs text-slate-400">{changed.length ? `จะบันทึก ${changed.length} ช่องที่แก้ไข` : 'ยังไม่มีการแก้ไข'}</span>}
                <button type="button" onClick={onClose} disabled={busy} className={btnGhost}>ยกเลิก</button>
                <button type="button" onClick={submit} disabled={busy || (isEdit && !changed.length)} className={btnPrimary}>
                    {busy && <Loader2 size={14} className="animate-spin" />}{isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
                </button>
            </>}
        >
            <form onSubmit={submit} className="space-y-5">
                <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">ข้อมูลหลัก</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{primary.map(field)}</div>
                </section>
                {dashboard.length > 0 && (
                    <section>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">ใช้จัดกลุ่มใน Dashboard</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{dashboard.map(field)}</div>
                    </section>
                )}
                {others.length > 0 && (
                    <details className="group">
                        <summary className="cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600">
                            ข้อมูลอื่นๆ ({others.length} ช่อง){othersChanged > 0 && <span className="normal-case tracking-normal text-pink-600"> · แก้ไขแล้ว {othersChanged}</span>}
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">{others.map(field)}</div>
                    </details>
                )}
                {autoShown.length > 0 && (
                    <section className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                        <h3 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5"><Sparkles size={12} className="text-pink-500" />คำนวณอัตโนมัติ (ไม่ต้องกรอก)</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            {autoShown.map((h, i) => (
                                <span key={h}>{i > 0 && ' · '}<strong className="text-slate-600">{h}</strong>{row ? `: ${row[headers.indexOf(h)] || '—'}` : ''}</span>
                            ))}
                        </p>
                    </section>
                )}
                <button type="submit" className="hidden" />
            </form>
        </Modal>
    );
}

export function ConfirmDeleteModal({ summary, onConfirm, onClose }) {
    const [busy, setBusy] = useState(false);
    const go = async () => { setBusy(true); try { await onConfirm(); } catch { /* parent shows the error */ } finally { setBusy(false); } };
    return (
        <Modal title="ลบรายการนี้?" onClose={onClose} busy={busy} footer={<>
            <button onClick={onClose} disabled={busy} className={btnGhost}>ยกเลิก</button>
            <button onClick={go} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
                {busy && <Loader2 size={14} className="animate-spin" />}ลบรายการ
            </button>
        </>}>
            <div className="flex gap-3">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-slate-600 space-y-2">
                    <p>แถวนี้จะถูกลบออกจาก Google Sheet ทันที</p>
                    <p className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-700">{summary}</p>
                    <p className="text-xs text-slate-400">ถ้าลบผิด กู้คืนได้จาก File → Version history ใน Google Sheet</p>
                </div>
            </div>
        </Modal>
    );
}

export function EditKeyModal({ onSubmit, onClose }) {
    const [key, setKey] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        if (!key) return;
        setBusy(true); setError('');
        try { await onSubmit(key); } catch (err) { setError(err.message); } finally { setBusy(false); }
    };
    return (
        <Modal title="ปลดล็อกการแก้ไขข้อมูล" onClose={onClose} busy={busy}>
            <form onSubmit={submit} className="space-y-3">
                <p className="text-sm text-slate-500 flex gap-2"><Lock size={15} className="shrink-0 mt-0.5 text-pink-500" />ใส่รหัสแก้ไข (EDIT_KEY) ที่ตั้งไว้ใน Apps Script ระบบจะจำไว้ในเบราว์เซอร์นี้</p>
                <input type="password" autoFocus value={key} onChange={(e) => setKey(e.target.value)} placeholder="รหัสแก้ไข" className={`${inputCls} ${error ? 'border-red-400' : ''}`} disabled={busy} />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={onClose} disabled={busy} className={btnGhost}>ยกเลิก</button>
                    <button type="submit" disabled={busy || !key} className={btnPrimary}>{busy && <Loader2 size={14} className="animate-spin" />}ปลดล็อก</button>
                </div>
            </form>
        </Modal>
    );
}
