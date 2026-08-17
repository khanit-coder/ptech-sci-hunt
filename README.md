# PTECH-Sci : Secret Item Hunt (Survive in Mario World)

> **"The Game Has Begun. Science Is Your Only Way Out."**

เว็บแอปพลิเคชันระบบจริงสำหรับกิจกรรมล่าไอเทมลับ (Side Quest) ในงานสัปดาห์วันวิทยาศาสตร์ PTECH 2026 รองรับผู้ใช้งานพร้อมกันกว่า 500 คน พร้อมระบบแสดงผล Dashboard บนจอ LED ขนาดใหญ่แบบ Real-Time, ระบบสแกน QR Code สำหรับเจ้าหน้าที่, การนำเข้ารายชื่อนักเรียนด้วย Wizard 6 ขั้นตอน, และสถาปัตยกรรมความปลอดภัยระดับ Production

---

## 🎮 กิจกรรม & Lore ของเกม

จากเหตุการณ์ **PTECH-Sci Core** ระเบิด ทำให้โลกจริงถูกไวรัสจากโลก Mario กลายพันธุ์ พื้นที่ PTECH ถูกแบ่งออกเป็น 14 มิติ ผู้เล่นต้องออกตามล่าไอเทมชิ้นส่วน Core ทั้ง 25 ชิ้นที่กระจัดกระจายอยู่ทั่ววิทยาลัย:

| ลำดับ | ประเภทไอเทม | สัญลักษณ์ | คำอธิบายวิทยาศาสตร์ | จำนวน |
|---|---|---|---|---|
| 1 | **STAR CORE** | ⭐ | แกนพลังงานแห่งการฟื้นฟู สลายการกลายพันธุ์และคืนสภาพคลื่นมิติ | 5 ชิ้น |
| 2 | **BIO-CELL** | 🧬 | เซลล์แห่งการฟื้นฟูชีวิต สังเคราะห์โปรตีนพิเศษต้านทานเชื้อไวรัส | 5 ชิ้น |
| 3 | **THERMO CRYSTAL** | 🔥 | ผลึกพลังงานความร้อน ขับเคลื่อนเตาปฏิกรณ์วิทยาศาสตร์อุณหภูมิสูง | 5 ชิ้น |
| 4 | **HYDRO CELL** | 💧 | เซลล์พลังงานแห่งน้ำ ควบคุมระบบหล่อเย็นและฟอกสารพิษในสสาร | 5 ชิ้น |
| 5 | **WARP KEY** | 🔑 | กุญแจเปิดประตูสู่โลกจริง ปลดล็อกมิติและเชื่อมสัญญาณสู่ความจริง | 5 ชิ้น |

---

## 🏛️ สถาปัตยกรรมระบบ (System Architecture)

```
                       ┌──────────────────────┐
                       │ 500 Active Students  │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │   Cloudflare Pages   │
                       │  CDN / WAF / TLS 1.3 │
                       └──────────┬───────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
   Public Dashboard             Staff                   Admin
    (/dashboard)               (/staff)                (/admin)
   LED Mode (16:9)           Check-in App            Command Hub
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                                  ▼
                       ┌──────────────────────┐
                       │  Supabase Backend    │
                       │  - PostgreSQL 15     │
                       │  - Supabase Realtime │
                       │  - Supabase Auth     │
                       │  - Atomic RPC Locks  │
                       │  - RLS Policies      │
                       └──────────┬───────────┘
                                  │
                                  ▼
                       External Student API
                       (Adapter Pattern: Mock/Real)
```

---

## 🚀 เทคโนโลยีหลักที่เลือกใช้

* **Frontend**: React 18 + TypeScript + Vite
* **Styling**: Tailwind CSS v3 + Mario/Sci-Fi Neon Design Tokens + Glassmorphism
* **Sound**: Web Audio API Sound Synthesizer (Zero external dependencies)
* **QR Scanning**: `html5-qrcode` + USB Barcode Scanner Keyboard Listener
* **QR Generation**: `qrcode.react` + Print Sheet Batch Generator
* **Charts**: Recharts (Discovery Timeline & Progress Bars)
* **Data Processing**: SheetJS (`xlsx`) + `papaparse` for Thai CSV/Excel
* **Backend**: Supabase (PostgreSQL, Realtime, Row Level Security, Auth)
* **Hosting**: Cloudflare Pages / Workers

---

## 📄 หน้าเว็บในระบบ

1. **Public Dashboard (`/dashboard`)**
   - แสดงสถานะ **WORLD RESTORED** (เช่น `68%`, `17 / 25 ITEMS`)
   - แสดงความคืบหน้าของไอเทมทั้ง 5 ประเภท
   - Real-time Discovery Radar แสดง 8 รายการล่าสุดพร้อมระบบเซ็นเซอร์ชื่อ (Privacy Masking)
   - ป๊อปอัปแจ้งเตือนขนาดใหญ่เมื่อมีไอเทมถูกค้นพบใหม่ (Discovery Alert)
   - Fullscreen 100% Celebration เมื่อฟื้นคืนโลกครบ 25 ชิ้น

2. **LED Presentation Mode (`/dashboard/led`)**
   - ออกแบบเฉพาะสำหรับเปิดบนจอ LED 16:9 ขนาดใหญ่ในโดม
   - ตัวอักษรขนาดใหญ่ High-Contrast มองเห็นได้ชัดจากระยะไกล
   - ปุ่มควบคุมแบบ Minimal ซ่อนขอบที่ไม่จำเป็น

3. **Staff Check-in (`/staff`)**
   - Mobile-First ออกแบบเพื่อความรวดเร็วในการสแกนหน้างาน
   - รองรับกล้องมือถือ, กรอกรหัสด้วยตนเอง, หรือเสียบเครื่องสแกนบาร์โค้ด USB/Bluetooth
   - รองรับการระบุตัวตนนักเรียน 3 วิธี:
     - สแกน QR Code นักเรียน (รองรับ Dynamic QR 5 วินาที)
     - ค้นหาด้วยชื่อ / นามสกุล / รหัสนักเรียน
     - กรอกชื่อด้วยตนเอง (Manual Fallback)
   - ป้องกันการบันทึกซ้ำด้วย Atomic Transaction & Idempotency Key
   - บันทึกการแจกของรางวัล (`REWARD GIVEN`) ทันทีที่หน้างาน

4. **Admin Command Hub (`/admin`)**
   - **Overview**: สถิติสด, กราฟการค้นพบตามช่วงเวลา (Timeline), ความคืบหน้า 5 หมวดหมู่
   - **Items**: จัดการไอเทม, สร้าง/แก้ไข/ลบ, พิมพ์แผ่นป้าย QR Batch Sheet
   - **Students**: จัดการรายชื่อนักเรียน, Wizard นำเข้าไฟล์ 6 ขั้นตอน (รองรับภาษาไทย)
   - **Discoveries**: ประวัติการค้นพบทั้งหมด, ระบบอนุมัติคำขอแก้ไข, ยกเลิกการค้นพบ (Revoke)
   - **Staff & Users**: จัดการบัญชีผู้ใช้งานและกำหนดสิทธิ์ (RBAC: Admin, Staff, Viewer)
   - **Event Settings**: ควบคุมสถานะกิจกรรม (OPEN, PAUSED, CLOSED), ตั้งค่าความเป็นส่วนตัว
   - **Audit Logs**: บันทึกความปลอดภัยของทุก Action ในระบบ
   - **System Health**: ตรวจสอบ Latency และสถานะ Realtime/DB
   - **Simulator**: เครื่องมือจำลองการค้นพบและทดสอบ Race Condition

5. **Login Portal (`/login`)**
   - เข้าสู่ระบบด้วย Supabase Auth พร้อมปุ่ม Quick Demo Login สำหรับทดสอบระบบทันที

---

## 🛠️ วิธีการรันบนเครื่อง Local (Development)

1. Clone โปรเจกต์และติดตั้ง Dependencies:
   ```bash
   npm install
   ```
2. รัน Dev Server:
   ```bash
   npm run dev
   ```
3. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
   - ระบบพร้อมใช้งานทันทีด้วย **Local In-Memory Engine** (ไม่ต้องต่อ Supabase ก็ทดสอบได้ทันที!)
   - คลิกที่ปุ่ม **Quick Demo Login** บนหน้า `/login` เพื่อเข้าสู่ระบบทดสอบ

---

## 🔒 มาตรการความปลอดภัย (Security Architecture)

- **Database-Level Atomic Locking**: การยืนยันไอเทมทำผ่าน RPC function (`confirm_discovery_atomic`) บน PostgreSQL พร้อม `UNIQUE(item_id)` constraint ป้องกันการเคลมซ้ำแม้ Staff 2 คนจะกดปุ่มพร้อมกันในเสี้ยววินาที
- **Opaque QR Tokens**: QR Code ที่ติดในสถานที่จริงจะ encode เฉพาะ secret token ไม่เปิดเผย item ID แบบตรง ๆ
- **Dynamic Student QR Expire**: ตรวจสอบอายุของ QR Code นักเรียน (หมดอายุหลัง 5 วินาที)
- **Zero Client Trust**: การคำนวณ World Stability และสถานะไอเทมทั้งหมดทำบน Server / View ไม่มีการคำนวณเองที่หน้าบ้าน
- **Privacy Mode Compliance**: หน้าจอ Dashboard สาธารณะจะ Mask ชื่อนักเรียน (เช่น `สม*** ส***`) โดยอัตโนมัติ
