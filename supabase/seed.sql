-- ==============================================================================
-- PTECH-Sci : Secret Item Hunt - Supabase Seed Data
-- ==============================================================================

-- 1. EVENT SETTINGS INITIALIZATION
INSERT INTO public.event_settings (
    id,
    event_name,
    tagline,
    status,
    dashboard_title,
    dashboard_subtitle,
    show_student_name_mode,
    sound_enabled,
    animation_enabled,
    celebration_enabled,
    show_recent_discoveries,
    show_item_hints
) VALUES (
    1,
    'PTECH-Sci : Survive in Mario World',
    'The Game Has Begun. Science Is Your Only Way Out.',
    'open',
    'PTECH-Sci : SURVIVE IN MARIO WORLD',
    'MISSION CONTROL - RECOVERY DASHBOARD',
    'masked',
    true,
    true,
    true,
    true,
    true
) ON CONFLICT (id) DO UPDATE SET
    event_name = EXCLUDED.event_name,
    tagline = EXCLUDED.tagline,
    status = EXCLUDED.status;

-- 2. INSERT 5 ITEM TYPES
INSERT INTO public.item_types (id, code, name, name_en, description, icon, color, sort_order, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'STAR', 'STAR CORE', 'Recovery Energy Core', 'แกนพลังงานแห่งการฟื้นฟู สลายการกลายพันธุ์และคืนสภาพคลื่นมิติ', '⭐', '#FFD700', 1, true),
    ('11111111-1111-1111-1111-111111111102', 'BIO', 'BIO-CELL', 'Life Restoration Cell', 'เซลล์แห่งการฟื้นฟูชีวิต สังเคราะห์โปรตีนพิเศษต้านทานเชื้อไวรัสโลกมาริโอ้', '🧬', '#00E676', 2, true),
    ('11111111-1111-1111-1111-111111111103', 'THERMO', 'THERMO CRYSTAL', 'Thermal Energy Crystal', 'ผลึกพลังงานความร้อน ขับเคลื่อนเตาปฏิกรณ์วิทยาศาสตร์อุณหภูมิสูง', '🔥', '#FF5722', 3, true),
    ('11111111-1111-1111-1111-111111111104', 'HYDRO', 'HYDRO CELL', 'Hydro Power Cell', 'เซลล์พลังงานแห่งน้ำ ควบคุมระบบหล่อเย็นและฟอกสารพิษในสสาร', '💧', '#00B0FF', 4, true),
    ('11111111-1111-1111-1111-111111111105', 'WARP', 'WARP KEY', 'Dimensional Portal Key', 'กุญแจเปิดประตูสู่โลกจริง ปลดล็อกมิติและเชื่อมสัญญาณสู่ความจริง', '🔑', '#E040FB', 5, true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- 3. INSERT 25 SECRET ITEMS (5 ITEMS PER TYPE) WITH OPAQUE ENCRYPTED TOKENS
-- Type 1: STAR CORE (5 items)
INSERT INTO public.items (item_code, name, item_type_id, qr_token, status, location_hint, hint, description, reward_name, sort_order)
VALUES
    ('STAR-001', 'STAR CORE #01 - Alpha Prism', '11111111-1111-1111-1111-111111111101', 'PTECH_SEC_8F9C4A1D7B0E2356F4A8D9B1C3E7A250', 'active', 'ห้องปฏิบัติการฟิสิกส์ ชั้น 2', 'สเปกตรัมแสงสีรุ้งตกกระทบปริซึมแก้ว', 'แกนพลังงานดาวฤกษ์ลำดับที่ 1 ฟื้นฟูการหักเหแสงในมิติ', 'Mario Sci-Badge + Science Kit', 1),
    ('STAR-002', 'STAR CORE #02 - Beta Flare', '11111111-1111-1111-1111-111111111101', 'PTECH_SEC_3A7B9C1E5F8D0246A1B3C5D7E9F0A2B4', 'active', 'อาคาร 3 ซุ้มเคมีไฟฟ้า', 'ปฏิกิริยาคายแสงเคมีส่องสว่างในที่มืด', 'แกนประกายดาวฤกษ์ ลำดับ 2', 'PTECH Power Bank', 2),
    ('STAR-003', 'STAR CORE #03 - Gamma Pulse', '11111111-1111-1111-1111-111111111101', 'PTECH_SEC_E1F2A3B4C5D6E7F80918273645546372', 'active', 'ห้องสมุด โซนค้นคว้าดาราศาสตร์', 'มองหาลูกโลกจำลองระบบสุริยะจักรวาล', 'แกนพัลส์พลังงานสูงเพื่อปรับสมดุลแรงโน้มถ่วง', 'PTECH Mystery Gift Box', 3),
    ('STAR-004', 'STAR CORE #04 - Delta Nova', '11111111-1111-1111-1111-111111111101', 'PTECH_SEC_9876543210ABCDEF13579BDF2468ACE0', 'active', 'ลานกิจกรรมหน้าเสาธง เสากลาง', 'ตำแหน่งที่เงาแดดตกกระทบ ณ เวลา 10.00 น.', 'ชิ้นส่วนระเบิดซูเปอร์โนวาจำลอง', 'PTECH Super Science Mug', 4),
    ('STAR-005', 'STAR CORE #05 - Omega Radiance', '11111111-1111-1111-1111-111111111101', 'PTECH_SEC_A1B2C3D4E5F67890123456789ABCDEF0', 'active', 'ศูนย์ประชุม PTECH Dome ประตูด้านทิศเหนือ', 'ใกล้กับแผงควบคุมจอแสดงผล LED หลัก', 'แกนสุดท้ายแห่งดาวฤกษ์ ควบคุมระบบแสดงผลมิติ', 'Special Grand Trophy Box', 5)
ON CONFLICT (item_code) DO UPDATE SET
    name = EXCLUDED.name,
    qr_token = EXCLUDED.qr_token,
    location_hint = EXCLUDED.location_hint,
    hint = EXCLUDED.hint;

-- Type 2: BIO-CELL (5 items)
INSERT INTO public.items (item_code, name, item_type_id, qr_token, status, location_hint, hint, description, reward_name, sort_order)
VALUES
    ('BIO-001', 'BIO-CELL #01 - Helix Prime', '11111111-1111-1111-1111-111111111102', 'PTECH_SEC_7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A', 'active', 'สวนพฤกษศาสตร์วิทยาลัย ต้นจามจุรีใหญ่', 'สังเคราะห์แสงในจุดที่ร่มรื่นที่สุด', 'เกลียวคู่ DNA ต้านการกลายพันธุ์จากไวรัสมาริโอ้', 'Bio-Shield Eco Bottle', 6),
    ('BIO-002', 'BIO-CELL #02 - Chloroplast Node', '11111111-1111-1111-1111-111111111102', 'PTECH_SEC_2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F', 'active', 'แปลงทดลองเกษตรอัจฉริยะ Smart Farm', 'ระบบเซ็นเซอร์วัดความชื้นดินแปลงที่ 4', 'เซลล์คลอโรพลาสต์สังเคราะห์พลังงานชีวภาพ', 'PTECH Eco Plant Kit', 7),
    ('BIO-003', 'BIO-CELL #03 - Mitochondria Core', '11111111-1111-1111-1111-111111111102', 'PTECH_SEC_5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B', 'active', 'โรงอาหาร โต๊ะโภชนาการวิทยาศาสตร์', 'โรงงานผลิตพลังงาน ATP ของเซลล์สิ่งมีชีวิต', 'แหล่งผลิตพลังงานชีวเคมีเข้มข้น', 'Mario Sci-Shirt', 8),
    ('BIO-004', 'BIO-CELL #04 - Neural Mesh', '11111111-1111-1111-1111-111111111102', 'PTECH_SEC_8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E', 'active', 'ศูนย์หุ่นยนต์และ AI ชั้น 1', 'โครงข่ายประสาทเทียมและสมองกลชีวภาพ', 'ตัวเชื่อมต่อคลื่นสมองกับมิติเสมือน', 'Robotics Flash Drive 64GB', 9),
    ('BIO-005', 'BIO-CELL #05 - Vaccine Matrix', '11111111-1111-1111-1111-111111111102', 'PTECH_SEC_1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B', 'active', 'ห้องพยาบาล จุดปฐมพยาบาลเคลื่อนที่', 'สูตรผสมแอนติบอดีลบล้างไวรัสมาริโอ้', 'เซรั่มฟื้นฟูชีวเคมีระดับเซลล์', 'Sci-Doc First Aid Gift Box', 10)
ON CONFLICT (item_code) DO UPDATE SET
    name = EXCLUDED.name,
    qr_token = EXCLUDED.qr_token,
    location_hint = EXCLUDED.location_hint,
    hint = EXCLUDED.hint;

-- Type 3: THERMO CRYSTAL (5 items)
INSERT INTO public.items (item_code, name, item_type_id, qr_token, status, location_hint, hint, description, reward_name, sort_order)
VALUES
    ('THERMO-001', 'THERMO CRYSTAL #01 - Magma Gem', '11111111-1111-1111-1111-111111111103', 'PTECH_SEC_4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E', 'active', 'ช็อปแผนกช่างเชื่อมโลหะ', 'จุดที่มีอุณหภูมิเปลวไฟสูงสุดในวิทยาลัย', 'ผลึกแมกมาจำลอง ให้ความร้อนขับเคลื่อนกังหัน', 'Thermo Tumbler', 11),
    ('THERMO-002', 'THERMO CRYSTAL #02 - Plasma Core', '11111111-1111-1111-1111-111111111103', 'PTECH_SEC_7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D', 'active', 'ห้องแล็บไฟฟ้าแรงสูง อาคาร 4', 'สถานะที่ 4 ของสสาร เปล่งแสงสีม่วงเรืองรอง', 'พลาสมาคอร์สร้างสนามแม่เหล็กอุณหภูมิสูง', 'Mario Sci-Keyring & Badge', 12),
    ('THERMO-003', 'THERMO CRYSTAL #03 - Solar Flare', '11111111-1111-1111-1111-111111111103', 'PTECH_SEC_0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A', 'active', 'ดาดฟ้าอาคารเรียนรวม แผงโซลาร์เซลล์', 'แปลงพลังงานแสงอาทิตย์เป็นพลังงานความร้อน', 'ผลึกโซลาร์แฟลร์ กักเก็บรังสีอินฟราเรด', 'Solar Tech Mini Lamp', 13),
    ('THERMO-004', 'THERMO CRYSTAL #04 - Kinetic Spark', '11111111-1111-1111-1111-111111111103', 'PTECH_SEC_3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D', 'active', 'โรงยิมเนเซียม ลานแข่งขันฟุตซอล', 'พลังงานจลน์จากการเคลื่อนไหวกลายเป็นความร้อน', 'สปาร์กความร้อนเหนี่ยวนำด้วยการเคลื่อนที่', 'Sport Sci Towel & Bag', 14),
    ('THERMO-005', 'THERMO CRYSTAL #05 - Fusion Catalyst', '11111111-1111-1111-1111-111111111103', 'PTECH_SEC_6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A', 'active', 'ห้องเครื่องกำเนิดไฟฟ้าสำรอง', 'ปฏิกิริยานิวเคลียร์ฟิวชันจำลองไร้กัมมันตรังสี', 'ตัวเร่งปฏิกิริยาความร้อนรวมหลอมระบบ', 'High-Temp Thermal Flask', 15)
ON CONFLICT (item_code) DO UPDATE SET
    name = EXCLUDED.name,
    qr_token = EXCLUDED.qr_token,
    location_hint = EXCLUDED.location_hint,
    hint = EXCLUDED.hint;

-- Type 4: HYDRO CELL (5 items)
INSERT INTO public.items (item_code, name, item_type_id, qr_token, status, location_hint, hint, description, reward_name, sort_order)
VALUES
    ('HYDRO-001', 'HYDRO CELL #01 - Pure Aqua', '11111111-1111-1111-1111-111111111104', 'PTECH_SEC_9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D', 'active', 'สระน้ำหน้าอาคารอำนวยการ', 'ระบบบำบัดน้ำพลังกังหันชัยพัฒนาจำลอง', 'เซลล์น้ำบริสุทธิ์ ลดอุณหภูมิแกนปฏิกรณ์', 'Hydro Aqua Bottle', 16),
    ('HYDRO-002', 'HYDRO CELL #02 - Vapor Surge', '11111111-1111-1111-1111-111111111104', 'PTECH_SEC_2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A', 'active', 'ระบบทำความเย็น Chiller อาคาร 1', 'วัฏจักรการควบแน่นของไอน้ำเป็นหยดน้ำ', 'เซลล์ไอน้ำแรงดันสูงขับดันระบบระบายความร้อน', 'Sci-Tech Umbrella', 17),
    ('HYDRO-003', 'HYDRO CELL #03 - Cryo Frost', '11111111-1111-1111-1111-111111111104', 'PTECH_SEC_5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D', 'active', 'ห้องปฏิบัติการเคมี ตู้แช่แข็งสารเคมี', 'จุดเยือกแข็งสัมบูรณ์ 0 องศาเซลเซียส', 'ผลึกน้ำแข็งไครโอเจนิครักษาความเสถียร', 'Mario Sci-Freeze Pack', 18),
    ('HYDRO-004', 'HYDRO CELL #04 - Osmosis Mesh', '11111111-1111-1111-1111-111111111104', 'PTECH_SEC_8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A', 'active', 'ตู้น้ำดื่มระบบ RO อาคาร 2', 'เยื่อเลือกผ่าน Reverse Osmosis กรองโมเลกุล', 'แผ่นกรองออสโมซิสชำระล้างสารพิษในบรรยากาศ', 'Clean Water Kit', 19),
    ('HYDRO-005', 'HYDRO CELL #05 - Electrolysis Valve', '11111111-1111-1111-1111-111111111104', 'PTECH_SEC_1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D', 'active', 'ลานจอดรถพลังงานไฮโดรเจน', 'แยกน้ำด้วยไฟฟ้าได้ก๊าซไฮโดรเจนและออกซิเจน', 'วาล์วแยกสลายน้ำเพื่อผลิตเชื้อเพลิงสะอาด', 'PTECH Hydro Speaker', 20)
ON CONFLICT (item_code) DO UPDATE SET
    name = EXCLUDED.name,
    qr_token = EXCLUDED.qr_token,
    location_hint = EXCLUDED.location_hint,
    hint = EXCLUDED.hint;

-- Type 5: WARP KEY (5 items)
INSERT INTO public.items (item_code, name, item_type_id, qr_token, status, location_hint, hint, description, reward_name, sort_order)
VALUES
    ('WARP-001', 'WARP KEY #01 - Quantum Gateway', '11111111-1111-1111-1111-111111111105', 'PTECH_SEC_3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F', 'active', 'ห้องเซิร์ฟเวอร์ Network Data Center', 'สายเคเบิลใยแก้วนำแสงความเร็ว 100 Gbps', 'กุญแจควอนตัมเปิดเกตเวย์ข้อมูลสู่เครือข่ายโลกจริง', 'Quantum Flash Drive 128GB', 21),
    ('WARP-002', 'WARP KEY #02 - Wormhole Stabilizer', '11111111-1111-1111-1111-111111111105', 'PTECH_SEC_6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C', 'active', 'อุโมงค์ทางเชื่อมระหว่างอาคาร 1 และ 2', 'จุดบิดเบี้ยวของกาลอวกาศในทางเดินมีหลังคา', 'ตัวควบคุมเสถียรภาพรูหนอนข้ามมิติ', 'Mario Warp Badge Box', 22),
    ('WARP-003', 'WARP KEY #03 - Frequency Tuner', '11111111-1111-1111-1111-111111111105', 'PTECH_SEC_9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F', 'active', 'เสาส่งสัญญาณวิทยุสื่อสารบนดาดฟ้า', 'คลื่นความถี่วิทยุย่าน 2.4 GHz และ 5 GHz', 'ตัวปรับจูนความถี่คลื่นสัญญาณเปิดมิติ', 'PTECH Wireless Earbuds', 23),
    ('WARP-004', 'WARP KEY #04 - Cipher Matrix', '11111111-1111-1111-1111-111111111105', 'PTECH_SEC_2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C', 'active', 'ห้องปฏิบัติการ Cyber Security ชั้น 3', 'รหัสลับการเข้ารหัสถอดรหัสแบบ SHA-256', 'กุญแจถอดรหัสมิติเพื่อส่งสัญญาณกลับโลกจริง', 'Cyber Defense Hoodie', 24),
    ('WARP-005', 'WARP KEY #05 - Master Reality Core', '11111111-1111-1111-1111-111111111105', 'PTECH_SEC_5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F', 'active', 'ห้องรับรอง VIP อาคารอำนวยการ', 'จุดศูนย์กลางการเชื่อมต่อทุกประตูมิติใน PTECH', 'กุญแจเอกแห่งความจริง ปลดล็อก 100% สู่โลกปกติ', 'Grand Master Mystery Set', 25)
ON CONFLICT (item_code) DO UPDATE SET
    name = EXCLUDED.name,
    qr_token = EXCLUDED.qr_token,
    location_hint = EXCLUDED.location_hint,
    hint = EXCLUDED.hint;

-- 4. INSERT 10 SAMPLE STUDENTS
INSERT INTO public.students (student_code, first_name, last_name, class_name, department, level, student_status)
VALUES
    ('66209010001', 'สมชาย', 'สายวิทย์', 'ปวช. 2/1', 'เทคโนโลยีสารสนเทศ', 'ปวช.', 'active'),
    ('66209010002', 'วิภาดา', 'รักการเรียน', 'ปวช. 2/1', 'เทคโนโลยีสารสนเทศ', 'ปวช.', 'active'),
    ('66209010003', 'ธนพล', 'คิดสร้างสรรค์', 'ปวช. 2/2', 'คอมพิวเตอร์ธุรกิจ', 'ปวช.', 'active'),
    ('66209010004', 'กานดา', 'สุขสมบูรณ์', 'ปวช. 1/1', 'อิเล็กทรอนิกส์', 'ปวช.', 'active'),
    ('66209010005', 'ชญานนท์', 'มุ่งมั่น', 'ปวช. 3/1', 'ช่างยนต์', 'ปวช.', 'active'),
    ('66209010006', 'ปภัสสร', 'แก้วมณี', 'ปวส. 1/1', 'เทคนิคคอมพิวเตอร์', 'ปวส.', 'active'),
    ('66209010007', 'ณัฐวุฒิ', 'ทองดี', 'ปวส. 2/1', 'ไฟฟ้ากำลัง', 'ปวส.', 'active'),
    ('66209010008', 'สุดารัตน์', 'ใจงาม', 'ปวช. 1/2', 'การบัญชี', 'ปวช.', 'active'),
    ('66209010009', 'พงศกร', 'ยอดเยี่ยม', 'ปวช. 3/2', 'เมคคาทรอนิกส์', 'ปวช.', 'active'),
    ('66209010010', 'อารียา', 'พิทักษ์', 'ปวส. 1/2', 'การตลาดดิจิทัล', 'ปวส.', 'active')
ON CONFLICT (student_code) DO NOTHING;
