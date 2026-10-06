import React, { useEffect, useMemo, useState } from 'react';
import { Database, Plus, Pencil, Trash2, Search, Lock, Unlock, RefreshCw, ChevronLeft, ChevronRight, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { RecordModal, ConfirmDeleteModal, EditKeyModal, DATE_FIELD, toIsoDate } from '../components/DataModals';
import { hasApi, getEditKey, setEditKey, clearEditKey, checkKey, createRow, updateRow, deleteRow } from '../data/sheetApi';

const PAGE_SIZE = 20;
const SETUP_GUIDE = 'https://github.com/Thanut-Junnim26/deploy-webapp-example/blob/main/apps-script/README.md';

// Columns shown in the table (first header found in each group wins)
const TABLE_COLUMNS = [
    { label: 'วันที่', headers: ['Invoice Date'] },
    { label: 'ร้าน', headers: ['Shop_Name', 'Shop Name'], wide: true, subOnMobile: 'Product Name' },
    { label: 'สินค้า', headers: ['Product Name'], wide: true, hideSm: true },
    { label: 'Qty', headers: ['Qty'], num: true, hideSm: true },
    { label: 'Amount', headers: ['Amount'], num: true, money: true },
    { label: 'เดือน', headers: ['Month2', 'Month'], hideSm: true },
];

function Toast({ toast }) {
    if (!toast) return null;
    const ok = toast.type === 'success';
    return (
        <div role="status" className={`fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex items-start gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm bg-white ${ok ? 'border-emerald-200' : 'border-red-200'}`}>
            {ok ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />}
            <span className="text-slate-700">{toast.msg}</span>
        </div>
    );
}

const DataView = ({ sheet, setRows, onReload, reloading }) => {
    const { headers, rows, autoCols, source } = sheet;
    const editable = hasApi && source === 'api';
    const idIdx = headers.indexOf('ID');

    const [query, setQuery] = useState('');
    const [page, setPage] = useState(0);
    const [unlocked, setUnlocked] = useState(() => Boolean(getEditKey()));
    const [modal, setModal] = useState(null); // {type:'record', row} | {type:'delete', row} | {type:'key', then}
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    const cols = useMemo(
        () => TABLE_COLUMNS.map((c) => ({ ...c, idx: c.headers.map((h) => headers.indexOf(h)).find((i) => i >= 0) ?? -1 })).filter((c) => c.idx >= 0),
        [headers]
    );

    const filtered = useMemo(() => {
        const dateIdx = headers.indexOf(DATE_FIELD);
        const q = query.trim().toLowerCase();
        const list = q ? rows.filter((r) => r.some((v) => String(v).toLowerCase().includes(q))) : rows.slice();
        // newest first
        return list.sort((a, b) => toIsoDate(b[dateIdx]).localeCompare(toIsoDate(a[dateIdx])));
    }, [rows, headers, query]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, pageCount - 1);
    const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

    const notify = (type, msg) => setToast({ type, msg });

    // Run an action that needs the edit key; prompt first if we don't have one.
    const withKey = (action) => (unlocked ? action() : setModal({ type: 'key', then: action }));

    const handleError = (err) => {
        if (err.code === 'UNAUTHORIZED') {
            clearEditKey(); setUnlocked(false);
            setModal({ type: 'key' });
        }
        notify('error', err.message || 'เกิดข้อผิดพลาด');
        throw err; // keep the modal open
    };

    const save = async (row, payload) => {
        try {
            if (row) {
                const updated = await updateRow(row[idIdx], payload);
                setRows((rs) => rs.map((r) => (r[idIdx] === row[idIdx] ? updated : r)));
                notify('success', 'บันทึกการแก้ไขลง Google Sheet แล้ว');
            } else {
                const created = await createRow(payload);
                setRows((rs) => [...rs, created]);
                setQuery(''); setPage(0);
                notify('success', 'เพิ่มรายการลง Google Sheet แล้ว');
            }
            setModal(null);
        } catch (err) { handleError(err); }
    };

    const remove = async (row) => {
        try {
            await deleteRow(row[idIdx]);
            setRows((rs) => rs.filter((r) => r[idIdx] !== row[idIdx]));
            notify('success', 'ลบรายการแล้ว');
            setModal(null);
        } catch (err) {
            if (err.code === 'NOT_FOUND') { setRows((rs) => rs.filter((r) => r[idIdx] !== row[idIdx])); setModal(null); }
            handleError(err);
        }
    };

    const unlock = async (key) => {
        await checkKey(key);
        setEditKey(key); setUnlocked(true);
        const then = modal?.then;
        setModal(null);
        notify('success', 'ปลดล็อกการแก้ไขแล้ว');
        then?.();
    };

    const lock = () => { clearEditKey(); setUnlocked(false); notify('success', 'ล็อกการแก้ไขแล้ว'); };

    const summary = (row) => cols.slice(0, 5).map((c) => row[c.idx]).filter(Boolean).join(' · ');
    const fmt = (c, v) => (c.money && v !== '' && !isNaN(Number(String(v).replace(/,/g, ''))) ? `฿${Number(String(v).replace(/,/g, '')).toLocaleString()}` : v || '—');

    return (
        <div className="space-y-4">
            {!editable && (
                <div className="flex gap-3 items-start bg-white border border-slate-200 rounded-xl p-4" style={{ borderLeft: '4px solid #e8222b' }}>
                    <Info size={16} className="text-pink-500 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed text-slate-600">
                        <p className="font-semibold text-slate-700 mb-0.5">โหมดอ่านอย่างเดียว</p>
                        ยังไม่ได้เชื่อม Apps Script จึงเพิ่ม/แก้ไข/ลบไม่ได้ ทำตาม <a href={SETUP_GUIDE} target="_blank" rel="noreferrer" className="font-semibold text-pink-600 underline">คู่มือตั้งค่า</a> แล้วกำหนดตัวแปร <code className="px-1 rounded bg-slate-100">SHEET_API_URL</code> ใน GitHub
                    </div>
                </div>
            )}

            <div className="chart-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-600 via-red-500 to-orange-500"><Database size={14} className="text-white" /></div>
                        <span className="text-slate-700">ข้อมูลใน Google Sheet</span>
                        <span className="text-[10px] text-slate-400 font-normal">{filtered.length.toLocaleString()} รายการ</span>
                    </h3>
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="ค้นหา ร้าน, สินค้า, วันที่…" className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400" />
                        </div>
                        <button onClick={onReload} disabled={reloading} title="โหลดข้อมูลล่าสุดจาก Sheet" className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60">
                            <RefreshCw size={14} className={`text-slate-500 ${reloading ? 'animate-spin' : ''}`} />
                        </button>
                        {editable && (
                            <>
                                <button onClick={unlocked ? lock : () => setModal({ type: 'key' })} title={unlocked ? 'ล็อกการแก้ไข' : 'ปลดล็อกการแก้ไข'} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                                    {unlocked ? <Unlock size={14} className="text-emerald-500" /> : <Lock size={14} className="text-slate-500" />}
                                </button>
                                <button onClick={() => withKey(() => setModal({ type: 'record', row: null }))} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 hover:shadow-lg whitespace-nowrap">
                                    <Plus size={14} />เพิ่มรายการ
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto -mx-3.5 px-3.5 sm:-mx-5 sm:px-5">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                            <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                                {cols.map((c) => <th key={c.label} className={`pb-2.5 pr-3 ${c.num ? 'text-right' : ''} ${c.hideSm ? 'hidden sm:table-cell' : ''}`}>{c.label}</th>)}
                                {editable && <th className="pb-2.5 w-20 text-right">จัดการ</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visible.map((row, i) => (
                                <tr key={idIdx >= 0 ? row[idIdx] : i} className="hover:bg-pink-50/40 transition-colors">
                                    {cols.map((c) => (
                                        <td key={c.label} className={`py-2 pr-3 ${c.num ? 'text-right font-mono' : ''} ${c.money ? 'font-bold text-slate-700' : 'text-slate-600'} ${c.wide ? 'max-w-[140px] sm:max-w-[260px] truncate' : 'whitespace-nowrap'} ${c.hideSm ? 'hidden sm:table-cell' : ''}`} title={c.wide ? row[c.idx] : undefined}>
                                            {fmt(c, row[c.idx])}
                                            {c.subOnMobile && headers.includes(c.subOnMobile) && (
                                                <span className="block sm:hidden text-[11px] text-slate-400 truncate">{row[headers.indexOf(c.subOnMobile)]}</span>
                                            )}
                                        </td>
                                    ))}
                                    {editable && (
                                        <td className="py-1.5 text-right whitespace-nowrap">
                                            <button onClick={() => withKey(() => setModal({ type: 'record', row }))} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700" title="แก้ไข" aria-label="แก้ไข"><Pencil size={14} /></button>
                                            <button onClick={() => withKey(() => setModal({ type: 'delete', row }))} className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600" title="ลบ" aria-label="ลบ"><Trash2 size={14} /></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {visible.length === 0 && (
                        <div className="py-12 text-center text-sm text-slate-400">
                            {query ? `ไม่พบรายการที่ตรงกับ “${query}”` : 'ยังไม่มีข้อมูล'}
                        </div>
                    )}
                </div>

                {pageCount > 1 && (
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span>{current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, filtered.length)} จาก {filtered.length.toLocaleString()}</span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(current - 1)} disabled={current === 0} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40" aria-label="หน้าก่อน"><ChevronLeft size={14} /></button>
                            <span className="px-2">{current + 1} / {pageCount}</span>
                            <button onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1} className="p-1.5 rounded-md border border-slate-200 bg-white disabled:opacity-40" aria-label="หน้าถัดไป"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>

            {modal?.type === 'record' && (
                <RecordModal headers={headers} autoCols={autoCols} row={modal.row} allRows={rows} onSave={(p) => save(modal.row, p)} onClose={() => setModal(null)} />
            )}
            {modal?.type === 'delete' && (
                <ConfirmDeleteModal summary={summary(modal.row)} onConfirm={() => remove(modal.row)} onClose={() => setModal(null)} />
            )}
            {modal?.type === 'key' && <EditKeyModal onSubmit={unlock} onClose={() => setModal(null)} />}
            <Toast toast={toast} />
        </div>
    );
};

export default DataView;
