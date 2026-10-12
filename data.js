// ไฟล์กลางจัดการข้อมูลคำสั่งซื้อ
// รอบนี้เก็บข้อมูลในเบราว์เซอร์ ช่วงบ่ายจะแก้เฉพาะไฟล์นี้เพื่อเปลี่ยนไปใช้ Supabase

const STORAGE_KEY = 'amata-orders';

const STATUS_LABELS = {
  pending: 'รอส่ง',
  shipped: 'ส่งแล้ว',
  paid: 'ชำระแล้ว',
};

// ข้อมูลสมมติ ชื่อร้านและชื่อหนังสือแต่งขึ้นทั้งหมด
const SAMPLE_ORDERS = [
  { id: '0001', shop: 'ร้านหนังสือนกกระจิบ', book: 'แสงสุดท้ายที่ปลายนา', quantity: 20, price: 245, orderDate: '2026-08-14', status: 'shipped' },
  { id: '0002', shop: 'ร้านหนังสือเรือนไม้หอม', book: 'บันทึกลับของแมวส้ม', quantity: 15, price: 189, orderDate: '2026-08-20', status: 'paid' },
  { id: '0003', shop: 'ร้านอักษรพฤกษ์', book: 'สวนครัวในคอนโด', quantity: 30, price: 159, orderDate: '2026-08-27', status: 'pending' },
  { id: '0004', shop: 'ร้านหนังสือริมคลองสาม', book: 'เดินทางไกลด้วยรถไฟชั้นสาม', quantity: 12, price: 320, orderDate: '2026-09-02', status: 'shipped' },
  { id: '0005', shop: 'ร้านหนังสือทุ่งดาวเรือง', book: 'คณิตคิดสนุก ชั้น ป.4', quantity: 50, price: 95, orderDate: '2026-09-05', status: 'paid' },
  { id: '0006', shop: 'ร้านปากกาสีฟ้าบุ๊คส์', book: 'ประวัติศาสตร์ขนมไทย', quantity: 10, price: 280, orderDate: '2026-09-15', status: 'shipped' },
  { id: '0007', shop: 'ร้านหนังสือนกกระจิบ', book: 'นิทานก่อนนอนจากทะเลใต้', quantity: 25, price: 135, orderDate: '2026-09-22', status: 'paid' },
  { id: '0008', shop: 'ร้านอักษรพฤกษ์', book: 'ภาษาอังกฤษวันละห้านาที', quantity: 40, price: 199, orderDate: '2026-09-30', status: 'pending' },
  { id: '0009', shop: 'ร้านหนังสือเรือนไม้หอม', book: 'แสงสุดท้ายที่ปลายนา', quantity: 8, price: 245, orderDate: '2026-10-06', status: 'pending' },
  { id: '0010', shop: 'ร้านหนังสือริมคลองสาม', book: 'บันทึกลับของแมวส้ม', quantity: 18, price: 189, orderDate: '2026-10-10', status: 'pending' },
];

// รายชื่อร้านค้า (สมมติ)
const SHOPS = [
  'ร้านหนังสือนกกระจิบ',
  'ร้านหนังสือเรือนไม้หอม',
  'ร้านอักษรพฤกษ์',
  'ร้านหนังสือริมคลองสาม',
  'ร้านหนังสือทุ่งดาวเรือง',
  'ร้านปากกาสีฟ้าบุ๊คส์',
];

// รายชื่อหนังสือและราคาต่อเล่ม (สมมติ)
const BOOKS = [
  { title: 'แสงสุดท้ายที่ปลายนา', price: 245 },
  { title: 'บันทึกลับของแมวส้ม', price: 189 },
  { title: 'สวนครัวในคอนโด', price: 159 },
  { title: 'เดินทางไกลด้วยรถไฟชั้นสาม', price: 320 },
  { title: 'คณิตคิดสนุก ชั้น ป.4', price: 95 },
  { title: 'ประวัติศาสตร์ขนมไทย', price: 280 },
  { title: 'นิทานก่อนนอนจากทะเลใต้', price: 135 },
  { title: 'ภาษาอังกฤษวันละห้านาที', price: 199 },
];

function loadOrders() {
  let orders = null;
  try {
    orders = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    orders = null;
  }
  if (!Array.isArray(orders)) {
    orders = [...SAMPLE_ORDERS];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      // เบราว์เซอร์ไม่ยอมให้บันทึก ใช้ข้อมูลตัวอย่างไปก่อน
    }
  }
  return orders;
}

// อ่านคำสั่งซื้อทั้งหมด เรียงจากใหม่ไปเก่า (วันเดียวกัน เลขที่มากกว่าอยู่บน)
async function getOrders() {
  return [...loadOrders()].sort(
    (a, b) => b.orderDate.localeCompare(a.orderDate) || b.id.localeCompare(a.id)
  );
}

async function getShops() {
  return SHOPS;
}

async function getBooks() {
  return BOOKS;
}

// เพิ่มคำสั่งซื้อใหม่ สถานะเริ่มต้นเป็น "รอส่ง" แล้วคืนคำสั่งซื้อที่บันทึกแล้ว
async function addOrder({ shop, book, quantity, price, orderDate }) {
  const orders = loadOrders();
  const lastNumber = orders.reduce((max, o) => Math.max(max, Number(o.id) || 0), 0);
  const order = {
    id: String(lastNumber + 1).padStart(4, '0'),
    shop,
    book,
    quantity,
    price,
    orderDate,
    status: 'pending',
  };
  orders.push(order);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return order;
}

// ลำดับสถานะ: รอส่ง -> ส่งแล้ว -> ชำระแล้ว
const NEXT_STATUS = {
  pending: 'shipped',
  shipped: 'paid',
};

// เปลี่ยนสถานะคำสั่งซื้อ แล้วคืนคำสั่งซื้อที่แก้แล้ว
async function updateOrderStatus(id, status) {
  const orders = loadOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) throw new Error('ไม่พบคำสั่งซื้อ');
  order.status = status;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return order;
}

// ยังไม่ชำระ และสั่งมาเกิน 30 วันแล้ว
function isOverdue(order) {
  return order.status !== 'paid' && daysSince(order.orderDate) > 30;
}

// นับจำนวนวันตั้งแต่วันที่สั่งจนถึงวันนี้
function daysSince(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}

// วันนี้ในรูปแบบ '2026-10-12'
function todayIso() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

// ยอดเงินของคำสั่งซื้อ = จำนวน x ราคาต่อเล่ม
function orderTotal(order) {
  return order.quantity * order.price;
}

// 1250 -> ฿1,250.00
function formatBaht(amount) {
  return '฿' + amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// '2026-10-12' -> 12 ต.ค. 2569
function formatThaiDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('th-TH-u-ca-buddhist', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
