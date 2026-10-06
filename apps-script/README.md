# ตั้งค่า Google Apps Script สำหรับ CRUD

เว็บบน GitHub Pages เป็น static จึงเขียนข้อมูลลง Google Sheet เองไม่ได้ เราใช้ Apps Script เป็น API ตัวกลาง:

```
หน้าเว็บ (GitHub Pages) ──GET/POST──▶ Apps Script Web App ──▶ Google Sheet
```

ถ้ายังไม่ได้ตั้งค่า เว็บจะทำงานแบบ **อ่านอย่างเดียว** (โหลด CSV จาก Sheet เหมือนเดิม)

## 1. ใส่โค้ดลงใน Sheet

1. เปิด Google Sheet ที่เก็บข้อมูล → เมนู **Extensions → Apps Script**
2. ลบโค้ดเดิมใน `Code.gs` แล้ววางโค้ดทั้งหมดจาก [`Code.gs`](./Code.gs)
3. ตรวจ `CONFIG.SHEET_GID` ให้ตรงกับแท็บข้อมูล (ตัวเลขหลัง `#gid=` ใน URL ของ Sheet) — ค่าตั้งต้นคือ `1603101243`
4. กด 💾 Save

## 2. ตั้งรหัสแก้ไข (EDIT_KEY)

ใครจะเพิ่ม/แก้/ลบ ต้องใส่รหัสนี้ในหน้าเว็บก่อน (ส่วนการอ่านยังเปิดเหมือนเดิม)

1. ใน Apps Script กด ⚙️ **Project Settings** (แถบซ้าย)
2. เลื่อนลงไปที่ **Script Properties → Add script property**
3. Property: `EDIT_KEY` · Value: รหัสที่ตั้งเอง (แนะนำยาว 12 ตัวขึ้นไป) → **Save script properties**

เปลี่ยนรหัสเมื่อไรก็ได้ที่จุดเดิม คนที่เคยปลดล็อกไว้จะถูกถามรหัสใหม่อัตโนมัติ

## 3. Deploy เป็น Web App

1. กด **Deploy → New deployment** → ไอคอนเฟือง ⚙️ → เลือก **Web app**
2. ตั้งค่า:
   - **Execute as:** Me
   - **Who has access:** Anyone
3. กด **Deploy** → **Authorize access** → เลือกบัญชี Google
   - ถ้าเจอหน้า "Google hasn't verified this app" ให้กด **Advanced → Go to … (unsafe)** (ปกติสำหรับ script ที่เราเขียนเอง)
4. คัดลอก **Web app URL** (ลงท้ายด้วย `/exec`)

ทดสอบ: เปิด URL นั้นในเบราว์เซอร์ ควรเห็น JSON ขึ้นต้นด้วย `{"ok":true,"headers":[...`

> ครั้งแรกที่เรียก script จะเพิ่มคอลัมน์ **`ID`** ต่อท้ายตารางและเติม ID ให้ทุกแถว ใช้อ้างอิงแถวตอนแก้/ลบ **ห้ามลบหรือแก้คอลัมน์นี้**

## 4. บอก GitHub ให้รู้จัก URL

1. ที่ repo บน GitHub → **Settings → Secrets and variables → Actions → แท็บ Variables**
2. **New repository variable** · Name: `SHEET_API_URL` · Value: URL จากข้อ 3
3. ไปที่แท็บ **Actions → Deploy to GitHub Pages → Run workflow** (หรือ push อะไรก็ได้เข้า `main`)

เสร็จแล้วเปิดเว็บ → แท็บ **Data** → กด 🔒 หรือ **เพิ่มรายการ** แล้วใส่ EDIT_KEY

### รันบนเครื่องตัวเอง

สร้างไฟล์ `.env.local` ที่ root ของโปรเจกต์ (ไฟล์นี้ไม่ถูก commit):

```
VITE_SHEET_API_URL=https://script.google.com/macros/s/xxxx/exec
```

แล้ว `npm run dev`

## แก้โค้ด Apps Script ภายหลัง

กด Save อย่างเดียว **เว็บจะยังใช้เวอร์ชันเก่า** ต้องไปที่ **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy** (URL เดิมไม่เปลี่ยน)

## พฤติกรรมที่ควรรู้

| เรื่อง | รายละเอียด |
|---|---|
| คอลัมน์ที่คำนวณให้ | `Month`, `Month2`, `Day_of_Week`, `Is_Weekend` คำนวณจาก `Invoice Date` อัตโนมัติ |
| คอลัมน์ที่เป็นสูตร | script ไม่เขียนทับ และคัดลอกสูตรจากแถวล่าสุดไปใส่แถวใหม่ให้ หน้าเว็บจะแสดงว่า "คำนวณอัตโนมัติ" |
| `Week` | ไม่ได้คำนวณให้ (ยังไม่ทราบสูตรที่ใช้) กรอกเองในหัวข้อ "ข้อมูลอื่นๆ" |
| การแก้ไข | ส่งเฉพาะช่องที่แก้ ช่องอื่นในแถวไม่ถูกแตะ |
| แก้พร้อมกัน | มี lock กันเขียนชนกัน แต่ถ้าสองคนแก้ช่องเดียวกัน ใครบันทึกทีหลังจะทับ |
| ลบผิด | กู้คืนได้จาก **File → Version history** ใน Google Sheet |
| ความเร็ว | ประมาณ 1–3 วินาทีต่อการบันทึก (ข้อจำกัดของ Apps Script) |
| ความปลอดภัย | การอ่านเปิดสาธารณะ (เหมือน CSV เดิม) · การเขียนต้องใช้ EDIT_KEY · ถ้า Sheet อยู่ใน Google Workspace ขององค์กร admin อาจปิดตัวเลือก "Anyone" ไว้ |

## API (สำหรับนักพัฒนา)

| Method | Body / Query | ผลลัพธ์ |
|---|---|---|
| `GET` | – | `{ ok, headers, rows, autoCols }` |
| `POST` | `{ action: "auth", key }` | `{ ok }` |
| `POST` | `{ action: "create", key, record: { "<header>": value } }` | `{ ok, row }` |
| `POST` | `{ action: "update", key, id, patch: { "<header>": value } }` | `{ ok, row }` |
| `POST` | `{ action: "delete", key, id }` | `{ ok }` |

ข้อผิดพลาดตอบกลับเป็น `{ ok: false, code, error }` โดย `code` เป็น `UNAUTHORIZED`, `NOT_FOUND`, `VALIDATION` หรือ `CONFIG`

POST ต้องส่ง `Content-Type: text/plain` (ไม่ใช่ `application/json`) เพราะ Apps Script ไม่รองรับ CORS preflight
