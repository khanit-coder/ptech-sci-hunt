# PTECH-Sci : Secret Item Hunt — Production Deployment Guide

คู่มือการติดตั้งและนำระบบขึ้น Production สำหรับงานสัปดาห์วันวิทยาศาสตร์ PTECH 2026

---

## 1. การเตรียม Supabase Project

1. เข้าไปที่ [https://supabase.com](https://supabase.com) แล้วสร้างโปรเจกต์ใหม่ (เช่น `ptech-sci-2026`)
2. เลือก Region ที่ใกล้ที่สุด (เช่น `Singapore (ap-southeast-1)`) เพื่อให้ได้ Latency ต่ำที่สุด
3. ไปที่เมนู **SQL Editor** ใน Supabase Dashboard:
   - นำเนื้อหาในไฟล์ `supabase/schema.sql` มารันเพื่อสร้างตาราง, View, Database Functions, และ Row Level Security (RLS)
   - นำเนื้อหาในไฟล์ `supabase/seed.sql` มารันเพื่อสร้างประเภทไอเทม 5 ประเภท, ไอเทมลับ 25 ชิ้นแรก และค่าเริ่มต้นกิจกรรม
4. ไปที่เมนู **Project Settings > API**:
   - คัดลอก `Project URL` (สำหรับใส่ใน `VITE_SUPABASE_URL`)
   - คัดลอก `anon` `public` key (สำหรับใส่ใน `VITE_SUPABASE_ANON_KEY`)
   - **ข้อควรระวัง**: ห้ามนำ `service_role` key ไปใส่ในไฟล์ `.env` ของ Frontend เด็ดขาด!

---

## 2. การตั้งค่า Authentication & Staff Accounts

1. ไปที่เมนู **Authentication > Users** ใน Supabase Dashboard
2. สร้างบัญชีผู้ใช้งานสำหรับ Admin:
   - Email: `admin@ptech.ac.th`
   - รหัสผ่าน: ตั้งรหัสผ่านที่มีความปลอดภัยสูง
3. ผูกบทบาท Admin ในตาราง `profiles`:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, display_name, role, is_active)
   VALUES (
     '<USER_UUID_FROM_AUTH>',
     'admin@ptech.ac.th',
     'อาจารย์ผู้ดูแลระบบ PTECH',
     'Admin Commander',
     'admin',
     true
   ) ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```
4. สร้างบัญชี Staff สำหรับจุด Check-in ต่าง ๆ ตามจำนวนจุดตรวจ

---

## 3. การตั้งค่า Realtime

1. ไปที่เมนู **Database > Publications** ใน Supabase
2. ตรวจสอบว่าตารางต่อไปนี้เปิดใช้งานใน `supabase_realtime` เรียบร้อย:
   - `public.discoveries`
   - `public.items`
   - `public.event_settings`

---

## 4. การ Build และ Deploy Frontend ผ่าน Cloudflare Pages

1. ติดตั้ง Dependencies และทดสอบ Build:
   ```bash
   npm install
   npm run build
   ```
2. โฟลเดอร์ `dist/` จะถูกสร้างขึ้นมาพร้อมไฟล์พร้อม Deploy
3. **Deploy บน Cloudflare Pages**:
   - ไปที่ Cloudflare Dashboard > **Workers & Pages > Create application > Pages**
   - เชื่อมต่อกับ Git Repository หรืออัปโหลดโฟลเดอร์ `dist` โดยตรง
   - ตั้งค่า **Build Command**: `npm run build`
   - ตั้งค่า **Build Output Directory**: `dist`
   - ตั้งค่า **Environment Variables**:
     - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
     - `VITE_SUPABASE_ANON_KEY`: `<your_anon_key>`
     - `VITE_EXTERNAL_STUDENT_API_URL`: `(ถ้ามี)`
     - `VITE_EXTERNAL_STUDENT_API_KEY`: `(ถ้ามี)`

---

## 5. การตั้งค่า Custom Domain & Cloudflare CDN / WAF

1. กำหนด Custom Domain เช่น `scihunt.ptech.ac.th`
2. เปิดใช้งาน Cloudflare **Proxy (Orange Cloud)** เพื่อรับสิทธิประโยชน์:
   - DDoS Protection
   - Global CDN Caching Static Assets
   - Automatic HTTPS / TLS 1.3
   - WAF Security Rules & Rate Limiting

---

## 6. Pre-Flight Checklist ก่อนเริ่มกิจกรรมจริง

- [ ] รัน `supabase/schema.sql` และ `supabase/seed.sql` ครบถ้วน
- [ ] ทดสอบล็อกอินด้วยบัญชี Admin บนหน้า `/login`
- [ ] ทดสอบล็อกอินด้วยบัญชี Staff บนหน้า `/staff`
- [ ] พิมพ์แผ่นป้าย QR Code จากหน้า Admin (เมนู Items > พิมพ์ QR Sheet)
- [ ] นำเข้าข้อมูลนักเรียนผ่านหน้า Admin (เมนู Students > นำเข้าไฟล์นักเรียน Wizard)
- [ ] ตรวจสอบว่าหน้าจอ LED โดมเปิด URL `/dashboard/led` และแสดงผลเต็มจอ 16:9 สวยงาม
- [ ] ทดสอบสแกน QR Code ทดลอง 1 ชิ้นและดูว่า Dashboard บนจอ LED เด้ง Alert ทันที
- [ ] ทดสอบสแกนไอเทมเดิมซ้ำเพื่อดูว่าระบบบล็อกด้วยข้อความ "ITEM ALREADY DISCOVERED"
- [ ] ดาวน์โหลดสำเนา Backup Data จากหน้า Admin ก่อนเริ่มงาน
- [ ] กด Reset Event Data เพื่อให้ระบบสะอาดพร้อมเริ่มงานเวลา 09:00 น.
