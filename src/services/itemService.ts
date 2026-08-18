import { Item, ItemType } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { dashboardService } from './dashboardService';

export const INITIAL_ITEM_TYPES: ItemType[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    code: 'STAR',
    name: 'STAR CORE',
    name_en: 'Recovery Energy Core',
    description: 'แกนพลังงานแห่งการฟื้นฟู สลายการกลายพันธุ์และคืนสภาพคลื่นมิติ',
    color: '#FFD700',
    icon: '⭐',
    total_count: 5,
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    code: 'BIO',
    name: 'BIO-CELL',
    name_en: 'Life Restoration Cell',
    description: 'เซลล์แห่งการฟื้นฟูชีวิต สังเคราะห์โปรตีนพิเศษต้านทานเชื้อไวรัสมาริโอ้',
    color: '#00E676',
    icon: '🧬',
    total_count: 5,
    sort_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    code: 'THERMO',
    name: 'THERMO CRYSTAL',
    name_en: 'Thermal Energy Crystal',
    description: 'ผลึกพลังงานความร้อน ขับเคลื่อนเตาปฏิกรณ์วิทยาศาสตร์อุณหภูมิสูง',
    color: '#FF7A00',
    icon: '🔥',
    total_count: 5,
    sort_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    code: 'HYDRO',
    name: 'HYDRO CELL',
    name_en: 'Hydro Power Cell',
    description: 'เซลล์พลังงานแห่งน้ำ ควบคุมระบบหล่อเย็นและฟอกสารพิษในสสาร',
    color: '#00F0FF',
    icon: '💧',
    total_count: 5,
    sort_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    code: 'WARP',
    name: 'WARP KEY',
    name_en: 'Dimensional Portal Key',
    description: 'กุญแจเปิดประตูสู่โลกจริง ปลดล็อกมิติและเชื่อมสัญญาณสู่ความจริง',
    color: '#FF0055',
    icon: '🔑',
    total_count: 5,
    sort_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_ITEMS: Item[] = [
  // 1. STAR CORE (5 items)
  {
    id: 'item_star_01',
    item_code: 'STAR-001',
    name: 'STAR CORE #01 - Alpha Prism',
    item_type_id: '11111111-1111-1111-1111-111111111101',
    qr_token: 'PTECH_SEC_8F9C4A1D7B0E2356F4A8D9B1C3E7A250',
    status: 'active',
    location_hint: 'ห้องปฏิบัติการฟิสิกส์ ชั้น 2',
    hint: 'สเปกตรัมแสงสีรุ้งตกกระทบปริซึมแก้ว',
    description: 'แกนพลังงานดาวฤกษ์ลำดับที่ 1 ฟื้นฟูการหักเหแสงในมิติ',
    reward_name: 'Mario Sci-Badge + Science Kit',
    reward_quantity: 1,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_star_02',
    item_code: 'STAR-002',
    name: 'STAR CORE #02 - Beta Flare',
    item_type_id: '11111111-1111-1111-1111-111111111101',
    qr_token: 'PTECH_SEC_3A7B9C1E5F8D0246A1B3C5D7E9F0A2B4',
    status: 'active',
    location_hint: 'อาคาร 3 ซุ้มเคมีไฟฟ้า',
    hint: 'ปฏิกิริยาคายแสงเคมีส่องสว่างในที่มืด',
    description: 'แกนประกายดาวฤกษ์ ลำดับ 2',
    reward_name: 'PTECH Power Bank',
    reward_quantity: 1,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_star_03',
    item_code: 'STAR-003',
    name: 'STAR CORE #03 - Gamma Pulse',
    item_type_id: '11111111-1111-1111-1111-111111111101',
    qr_token: 'PTECH_SEC_E1F2A3B4C5D6E7F80918273645546372',
    status: 'active',
    location_hint: 'ห้องสมุด โซนค้นคว้าดาราศาสตร์',
    hint: 'มองหาลูกโลกจำลองระบบสุริยะจักรวาล',
    description: 'แกนพัลส์พลังงานสูงเพื่อปรับสมดุลแรงโน้มถ่วง',
    reward_name: 'PTECH Mystery Gift Box',
    reward_quantity: 1,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_star_04',
    item_code: 'STAR-004',
    name: 'STAR CORE #04 - Delta Nova',
    item_type_id: '11111111-1111-1111-1111-111111111101',
    qr_token: 'PTECH_SEC_9876543210ABCDEF13579BDF2468ACE0',
    status: 'active',
    location_hint: 'ลานกิจกรรมหน้าเสาธง เสากลาง',
    hint: 'ตำแหน่งที่เงาแดดตกกระทบ ณ เวลา 10.00 น.',
    description: 'ชิ้นส่วนระเบิดซูเปอร์โนวาจำลอง',
    reward_name: 'PTECH Super Science Mug',
    reward_quantity: 1,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_star_05',
    item_code: 'STAR-005',
    name: 'STAR CORE #05 - Omega Radiance',
    item_type_id: '11111111-1111-1111-1111-111111111101',
    qr_token: 'PTECH_SEC_A1B2C3D4E5F67890123456789ABCDEF0',
    status: 'active',
    location_hint: 'ศูนย์ประชุม PTECH Dome ประตูด้านทิศเหนือ',
    hint: 'ใกล้กับแผงควบคุมจอแสดงผล LED หลัก',
    description: 'แกนสุดท้ายแห่งดาวฤกษ์ ควบคุมระบบแสดงผลมิติ',
    reward_name: 'Special Grand Trophy Box',
    reward_quantity: 1,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 2. BIO-CELL (5 items)
  {
    id: 'item_bio_01',
    item_code: 'BIO-001',
    name: 'BIO-CELL #01 - Helix Prime',
    item_type_id: '11111111-1111-1111-1111-111111111102',
    qr_token: 'PTECH_SEC_7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A',
    status: 'active',
    location_hint: 'สวนพฤกษศาสตร์วิทยาลัย ต้นจามจุรีใหญ่',
    hint: 'สังเคราะห์แสงในจุดที่ร่มรื่นที่สุด',
    description: 'เกลียวคู่ DNA ต้านการกลายพันธุ์จากไวรัสมาริโอ้',
    reward_name: 'Bio-Shield Eco Bottle',
    reward_quantity: 1,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_bio_02',
    item_code: 'BIO-002',
    name: 'BIO-CELL #02 - Chloroplast Node',
    item_type_id: '11111111-1111-1111-1111-111111111102',
    qr_token: 'PTECH_SEC_2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F',
    status: 'active',
    location_hint: 'แปลงทดลองเกษตรอัจฉริยะ Smart Farm',
    hint: 'ระบบเซ็นเซอร์วัดความชื้นดินแปลงที่ 4',
    description: 'เซลล์คลอโรพลาสต์สังเคราะห์พลังงานชีวภาพ',
    reward_name: 'PTECH Eco Plant Kit',
    reward_quantity: 1,
    sort_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_bio_03',
    item_code: 'BIO-003',
    name: 'BIO-CELL #03 - Mitochondria Core',
    item_type_id: '11111111-1111-1111-1111-111111111102',
    qr_token: 'PTECH_SEC_5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    status: 'active',
    location_hint: 'โรงอาหาร โต๊ะโภชนาการวิทยาศาสตร์',
    hint: 'โรงงานผลิตพลังงาน ATP ของเซลล์สิ่งมีชีวิต',
    description: 'แหล่งผลิตพลังงานชีวเคมีเข้มข้น',
    reward_name: 'Mario Sci-Shirt',
    reward_quantity: 1,
    sort_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_bio_04',
    item_code: 'BIO-004',
    name: 'BIO-CELL #04 - Neural Mesh',
    item_type_id: '11111111-1111-1111-1111-111111111102',
    qr_token: 'PTECH_SEC_8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E',
    status: 'active',
    location_hint: 'ศูนย์หุ่นยนต์และ AI ชั้น 1',
    hint: 'โครงข่ายประสาทเทียมและสมองกลชีวภาพ',
    description: 'ตัวเชื่อมต่อคลื่นสมองกับมิติเสมือน',
    reward_name: 'Robotics Flash Drive 64GB',
    reward_quantity: 1,
    sort_order: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_bio_05',
    item_code: 'BIO-005',
    name: 'BIO-CELL #05 - Vaccine Matrix',
    item_type_id: '11111111-1111-1111-1111-111111111102',
    qr_token: 'PTECH_SEC_1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B',
    status: 'active',
    location_hint: 'ห้องพยาบาล จุดปฐมพยาบาลเคลื่อนที่',
    hint: 'สูตรผสมแอนติบอดีลบล้างไวรัสมาริโอ้',
    description: 'เซรั่มฟื้นฟูชีวเคมีระดับเซลล์',
    reward_name: 'Sci-Doc First Aid Gift Box',
    reward_quantity: 1,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 3. THERMO CRYSTAL (5 items)
  {
    id: 'item_thermo_01',
    item_code: 'THERMO-001',
    name: 'THERMO CRYSTAL #01 - Magma Gem',
    item_type_id: '11111111-1111-1111-1111-111111111103',
    qr_token: 'PTECH_SEC_4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E',
    status: 'active',
    location_hint: 'ช็อปแผนกช่างเชื่อมโลหะ',
    hint: 'จุดที่มีอุณหภูมิเปลวไฟสูงสุดในวิทยาลัย',
    description: 'ผลึกแมกมาจำลอง ให้ความร้อนขับเคลื่อนกังหัน',
    reward_name: 'Thermo Tumbler',
    reward_quantity: 1,
    sort_order: 11,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_thermo_02',
    item_code: 'THERMO-002',
    name: 'THERMO CRYSTAL #02 - Plasma Core',
    item_type_id: '11111111-1111-1111-1111-111111111103',
    qr_token: 'PTECH_SEC_7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D',
    status: 'active',
    location_hint: 'ห้องแล็บไฟฟ้าแรงสูง อาคาร 4',
    hint: 'สถานะที่ 4 ของสสาร เปล่งแสงสีม่วงเรืองรอง',
    description: 'พลาสมาคอร์สร้างสนามแม่เหล็กอุณหภูมิสูง',
    reward_name: 'Mario Sci-Keyring & Badge',
    reward_quantity: 1,
    sort_order: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_thermo_03',
    item_code: 'THERMO-003',
    name: 'THERMO CRYSTAL #03 - Solar Flare',
    item_type_id: '11111111-1111-1111-1111-111111111103',
    qr_token: 'PTECH_SEC_0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A',
    status: 'active',
    location_hint: 'ดาดฟ้าอาคารเรียนรวม แผงโซลาร์เซลล์',
    hint: 'แปลงพลังงานแสงอาทิตย์เป็นพลังงานความร้อน',
    description: 'ผลึกโซลาร์แฟลร์ กักเก็บรังสีอินฟราเรด',
    reward_name: 'Solar Tech Mini Lamp',
    reward_quantity: 1,
    sort_order: 13,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_thermo_04',
    item_code: 'THERMO-004',
    name: 'THERMO CRYSTAL #04 - Kinetic Spark',
    item_type_id: '11111111-1111-1111-1111-111111111103',
    qr_token: 'PTECH_SEC_3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D',
    status: 'active',
    location_hint: 'โรงยิมเนเซียม ลานแข่งขันฟุตซอล',
    hint: 'พลังงานจลน์จากการเคลื่อนไหวกลายเป็นความร้อน',
    description: 'สปาร์กความร้อนเหนี่ยวนำด้วยการเคลื่อนที่',
    reward_name: 'Sport Sci Towel & Bag',
    reward_quantity: 1,
    sort_order: 14,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_thermo_05',
    item_code: 'THERMO-005',
    name: 'THERMO CRYSTAL #05 - Fusion Catalyst',
    item_type_id: '11111111-1111-1111-1111-111111111103',
    qr_token: 'PTECH_SEC_6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A',
    status: 'active',
    location_hint: 'ห้องเครื่องกำเนิดไฟฟ้าสำรอง',
    hint: 'ปฏิกิริยานิวเคลียร์ฟิวชันจำลองไร้กัมมันตรังสี',
    description: 'ตัวเร่งปฏิกิริยาความร้อนรวมหลอมระบบ',
    reward_name: 'High-Temp Thermal Flask',
    reward_quantity: 1,
    sort_order: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 4. HYDRO CELL (5 items)
  {
    id: 'item_hydro_01',
    item_code: 'HYDRO-001',
    name: 'HYDRO CELL #01 - Pure Aqua',
    item_type_id: '11111111-1111-1111-1111-111111111104',
    qr_token: 'PTECH_SEC_9A0B1C2D3E4F5A6B7C8D9E0F1A2B3C4D',
    status: 'active',
    location_hint: 'สระน้ำหน้าอาคารอำนวยการ',
    hint: 'ระบบบำบัดน้ำพลังกังหันชัยพัฒนาจำลอง',
    description: 'เซลล์น้ำบริสุทธิ์ ลดอุณหภูมิแกนปฏิกรณ์',
    reward_name: 'Hydro Aqua Bottle',
    reward_quantity: 1,
    sort_order: 16,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_hydro_02',
    item_code: 'HYDRO-002',
    name: 'HYDRO CELL #02 - Vapor Surge',
    item_type_id: '11111111-1111-1111-1111-111111111104',
    qr_token: 'PTECH_SEC_2D3E4F5A6B7C8D9E0F1A2B3C4D5E6F7A',
    status: 'active',
    location_hint: 'ระบบทำความเย็น Chiller อาคาร 1',
    hint: 'วัฏจักรการควบแน่นของไอน้ำเป็นหยดน้ำ',
    description: 'เซลล์ไอน้ำแรงดันสูงขับดันระบบระบายความร้อน',
    reward_name: 'Sci-Tech Umbrella',
    reward_quantity: 1,
    sort_order: 17,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_hydro_03',
    item_code: 'HYDRO-003',
    name: 'HYDRO CELL #03 - Cryo Frost',
    item_type_id: '11111111-1111-1111-1111-111111111104',
    qr_token: 'PTECH_SEC_5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D',
    status: 'active',
    location_hint: 'ห้องปฏิบัติการเคมี ตู้แช่แข็งสารเคมี',
    hint: 'จุดเยือกแข็งสัมบูรณ์ 0 องศาเซลเซียส',
    description: 'ผลึกน้ำแข็งไครโอเจนิครักษาความเสถียร',
    reward_name: 'Mario Sci-Freeze Pack',
    reward_quantity: 1,
    sort_order: 18,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_hydro_04',
    item_code: 'HYDRO-004',
    name: 'HYDRO CELL #04 - Osmosis Mesh',
    item_type_id: '11111111-1111-1111-1111-111111111104',
    qr_token: 'PTECH_SEC_8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A',
    status: 'active',
    location_hint: 'ตู้น้ำดื่มระบบ RO อาคาร 2',
    hint: 'เยื่อเลือกผ่าน Reverse Osmosis กรองโมเลกุล',
    description: 'แผ่นกรองออสโมซิสชำระล้างสารพิษในบรรยากาศ',
    reward_name: 'Clean Water Kit',
    reward_quantity: 1,
    sort_order: 19,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_hydro_05',
    item_code: 'HYDRO-005',
    name: 'HYDRO CELL #05 - Electrolysis Valve',
    item_type_id: '11111111-1111-1111-1111-111111111104',
    qr_token: 'PTECH_SEC_1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D',
    status: 'active',
    location_hint: 'ลานจอดรถพลังงานไฮโดรเจน',
    hint: 'แยกน้ำด้วยไฟฟ้าได้ก๊าซไฮโดรเจนและออกซิเจน',
    description: 'วาล์วแยกสลายน้ำเพื่อผลิตเชื้อเพลิงสะอาด',
    reward_name: 'PTECH Hydro Speaker',
    reward_quantity: 1,
    sort_order: 20,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 5. WARP KEY (5 items)
  {
    id: 'item_warp_01',
    item_code: 'WARP-001',
    name: 'WARP KEY #01 - Quantum Gateway',
    item_type_id: '11111111-1111-1111-1111-111111111105',
    qr_token: 'PTECH_SEC_3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F',
    status: 'active',
    location_hint: 'ห้องเซิร์ฟเวอร์ Network Data Center',
    hint: 'สายเคเบิลใยแก้วนำแสงความเร็ว 100 Gbps',
    description: 'กุญแจควอนตัมเปิดเกตเวย์ข้อมูลสู่เครือข่ายโลกจริง',
    reward_name: 'Quantum Flash Drive 128GB',
    reward_quantity: 1,
    sort_order: 21,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_warp_02',
    item_code: 'WARP-002',
    name: 'WARP KEY #02 - Wormhole Stabilizer',
    item_type_id: '11111111-1111-1111-1111-111111111105',
    qr_token: 'PTECH_SEC_6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C',
    status: 'active',
    location_hint: 'อุโมงค์ทางเชื่อมระหว่างอาคาร 1 และ 2',
    hint: 'จุดบิดเบี้ยวของกาลอวกาศในทางเดินมีหลังคา',
    description: 'ตัวควบคุมเสถียรภาพรูหนอนข้ามมิติ',
    reward_name: 'Mario Warp Badge Box',
    reward_quantity: 1,
    sort_order: 22,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_warp_03',
    item_code: 'WARP-003',
    name: 'WARP KEY #03 - Frequency Tuner',
    item_type_id: '11111111-1111-1111-1111-111111111105',
    qr_token: 'PTECH_SEC_9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F',
    status: 'active',
    location_hint: 'เสาส่งสัญญาณวิทยุสื่อสารบนดาดฟ้า',
    hint: 'คลื่นความถี่วิทยุย่าน 2.4 GHz และ 5 GHz',
    description: 'ตัวปรับจูนความถี่คลื่นสัญญาณเปิดมิติ',
    reward_name: 'PTECH Wireless Earbuds',
    reward_quantity: 1,
    sort_order: 23,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_warp_04',
    item_code: 'WARP-004',
    name: 'WARP KEY #04 - Cipher Matrix',
    item_type_id: '11111111-1111-1111-1111-111111111105',
    qr_token: 'PTECH_SEC_2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C',
    status: 'active',
    location_hint: 'ห้องปฏิบัติการ Cyber Security ชั้น 3',
    hint: 'รหัสลับการเข้ารหัสถอดรหัสแบบ SHA-256',
    description: 'กุญแจถอดรหัสมิติเพื่อส่งสัญญาณกลับโลกจริง',
    reward_name: 'Cyber Defense Hoodie',
    reward_quantity: 1,
    sort_order: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'item_warp_05',
    item_code: 'WARP-005',
    name: 'WARP KEY #05 - Master Reality Core',
    item_type_id: '11111111-1111-1111-1111-111111111105',
    qr_token: 'PTECH_SEC_5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F',
    status: 'active',
    location_hint: 'ห้องรับรอง VIP อาคารอำนวยการ',
    hint: 'จุดศูนย์กลางการเชื่อมต่อทุกประตูมิติใน PTECH',
    description: 'กุญแจเอกแห่งความจริง ปลดล็อก 100% สู่โลกปกติ',
    reward_name: 'Grand Master Mystery Set',
    reward_quantity: 1,
    sort_order: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

class ItemService {
  private itemTypes: ItemType[] = [...INITIAL_ITEM_TYPES];
  private items: Item[] = [...INITIAL_ITEMS];

  constructor() {
    const savedTypes = localStorage.getItem('ptech_item_types');
    if (savedTypes) {
      try {
        this.itemTypes = JSON.parse(savedTypes);
      } catch {
        this.itemTypes = [...INITIAL_ITEM_TYPES];
      }
    }

    const savedItems = localStorage.getItem('ptech_items');
    if (savedItems) {
      try {
        const loaded: Item[] = JSON.parse(savedItems);
        // Automatically migrate legacy readable tokens to encrypted tokens
        this.items = loaded.map((item) => {
          const matchInitial = INITIAL_ITEMS.find((init) => init.id === item.id || init.item_code === item.item_code);
          if (matchInitial && (item.qr_token.startsWith('tok_') || !item.qr_token.startsWith('PTECH_SEC_'))) {
            return { ...item, qr_token: matchInitial.qr_token };
          }
          return item;
        });
        this.saveState();
      } catch {
        this.items = [...INITIAL_ITEMS];
      }
    }
  }

  private saveState() {
    localStorage.setItem('ptech_item_types', JSON.stringify(this.itemTypes));
    localStorage.setItem('ptech_items', JSON.stringify(this.items));
  }

  private syncFromStorage() {
    const savedTypes = localStorage.getItem('ptech_item_types');
    if (savedTypes) {
      try { this.itemTypes = JSON.parse(savedTypes); } catch { /* ignore */ }
    }
    const savedItems = localStorage.getItem('ptech_items');
    if (savedItems) {
      try {
        const loaded: Item[] = JSON.parse(savedItems);
        this.items = loaded.map((item) => {
          const matchInitial = INITIAL_ITEMS.find((init) => init.id === item.id || init.item_code === item.item_code);
          if (matchInitial && (item.qr_token.startsWith('tok_') || !item.qr_token.startsWith('PTECH_SEC_'))) {
            return { ...item, qr_token: matchInitial.qr_token };
          }
          return item;
        });
      } catch { /* ignore */ }
    }
  }

  async getItemTypes(): Promise<ItemType[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('item_types')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data) return data as ItemType[];
    }
    this.syncFromStorage();
    return this.itemTypes.filter((t) => t.is_active);
  }

  async getAllItems(): Promise<Item[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('items')
        .select('*, item_type:item_types(*)')
        .order('sort_order', { ascending: true });
      if (data) return data as Item[];
    }
    this.syncFromStorage();
    // Join with item type
    return this.items.map((i) => ({
      ...i,
      item_type: this.itemTypes.find((t) => t.id === i.item_type_id),
    }));
  }

  async getItemByQrToken(qrToken: string): Promise<Item | null> {
    const cleanToken = qrToken.trim();

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('items')
        .select('*, item_type:item_types(*)')
        .eq('qr_token', cleanToken)
        .single();
      return (data as Item) || null;
    }

    this.syncFromStorage();
    // Local fallback: search by encrypted qr_token OR item_code for manual testing convenience
    const found = this.items.find(
      (i) => i.qr_token === cleanToken || i.item_code.toLowerCase() === cleanToken.toLowerCase()
    );
    if (!found) return null;

    return {
      ...found,
      item_type: this.itemTypes.find((t) => t.id === found.item_type_id),
    };
  }

  async createItem(itemData: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Promise<Item> {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase();
    const newItem: Item = {
      ...itemData,
      qr_token: itemData.qr_token || `PTECH_SEC_${randomHex}`,
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('items').insert([newItem]).select().single();
      if (error) throw error;
      return data as Item;
    }

    this.items.push(newItem);
    this.saveState();
    dashboardService.forceRefresh();
    return newItem;
  }

  async updateItem(id: string, updates: Partial<Item>): Promise<Item> {
    const { item_type, ...cleanUpdates } = updates as any;
    let updatedResult: Item | null = null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('items')
          .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*, item_type:item_types(*)')
          .maybeSingle();
        if (!error && data) {
          updatedResult = data as Item;
        }
      } catch (err) {
        console.warn('Supabase updateItem error:', err);
      }
    }

    if (!updatedResult) {
      const idx = this.items.findIndex((i) => i.id === id);
      if (idx !== -1) {
        this.items[idx] = { ...this.items[idx], ...cleanUpdates, updated_at: new Date().toISOString() };
        updatedResult = this.items[idx];
      } else {
        updatedResult = { id, ...updates } as Item;
      }
      this.saveState();
    }

    dashboardService.forceRefresh();
    return updatedResult;
  }

  async deleteItem(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    }

    this.items = this.items.filter((i) => i.id !== id);
    this.saveState();
    dashboardService.forceRefresh();
  }

  public resetLocalItems() {
    this.items = [...INITIAL_ITEMS];
    this.itemTypes = [...INITIAL_ITEM_TYPES];
    this.saveState();
    dashboardService.forceRefresh();
  }
}

export const itemService = new ItemService();
