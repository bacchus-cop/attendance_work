export const BRAND_CONFIG = {
  name: 'BACCHUS INTER',
  companyName: 'Bacchusinter Co., Ltd.',
  title: 'BACCHUS INTER',
  tagline: 'เปลี่ยนความวุ่นวายหลังบ้านให้เป็นระบบระเบียบ',
  description: 'แพลตฟอร์มบริหารจัดการงานสร้างสรรค์ที่เน้น Workflow ของครีเอเตอร์โดยเฉพาะ',
  supportEmail: 'bacchusinter@kontentos.ai',
  website: 'https://kontentos.ai',
  copyright: '© 2024 Kontent OS. All rights reserved.',
  madeBy: 'Made with ♥ by Content Creator for Creator',
  projectPlaceholder: 'เริ่มต้นวางแผนกลยุทธ์ของคุณด้วยเครื่องมือ Kontent OS โดยกดปุ่มสร้างโครงการใหม่ด้านบน',

  // โหมดหน้าแรกเมื่อไม่ได้เข้าสู่ระบบ
  // 1 = แสดงหน้า LandingPage (ค่าเริ่มต้น)
  // 2 = แสดงหน้า AuthPage ทันทีเพื่อความสะดวกรวดเร็ว
  initialRouteMode: 2,

  // โหมดการแสดงปุ่มเข้าสู่ระบบด้วย Google
  // 1 = แสดงปุ่มเข้าสู่ระบบด้วย Google
  // 2 = ไม่แสดง (ซ่อน/คอมเมนต์ไว้ชั่วคราว)
  showGoogleLoginMode: 2,
  
  // โหมดการแสดงผล WorkBox (กล่องเก็บงาน)
  // 1 = แสดง (ค่าเริ่มต้น)
  // 2 = ไม่แสดง (ซ่อน/ปิดการแสดงผล)
  showWorkboxMode: 2,

  // โหมดการแสดงผลผู้ช่วย JuiJui Bot (AI)
  // 1 = แสดง (ค่าเริ่มต้น)
  // 2 = ไม่แสดง (ซ่อน/ปิดการแสดงผล)
  showJuiJuiAiMode: 2,

  // โหมดการแสดงผลหลอดเลือด (HP Bar) และ Badge ใน LiveClock
  // 1 = แสดงหลอดเลือดแบบปกติ (เริ่มต้นหลอดเต็ม 100%) และแสดง Badge HP ปกติ (ติดลบแสดงไอคอนหัวกะโหลกกระดอนสีเข้มดูน่ากลัว)
  // 2 = แสดงหลอดเลือดแบบสะสมความเสียหาย (เริ่มต้นหลอด 0%) และแสดง Badge เป็นตัวเลขล้วน โดยแสดงค่าติดลบในธีมสีชมพูอ่อนเป็นมิตรไม่น่ากลัว
  hpDisplayMode: 2,

  // โหมดของระบบ Gamification และการตาย (Death System)
  // 1 = ทำงานเต็มรูปแบบ (คำนวณคะแนน หัก HP บล็อกหน้าจอเมื่อ HP <= 0 หรือเข้าสู่สถานะ DEATH)
  // 2 = ปิดระบบการลงโทษและการล็อกหน้าจอทั้งหมด (ข้าม Logic HP <= 0 และข้ามการจำกัดหน้าจอทุกรูปแบบ)
  gamificationMode: 2,

  // โหมดนับสาย (Late Calculation Mode)
  // 1 = โหมดปกติ (มี Buffer)
  // 2 = โหมดเข้มงวด (ไม่มี Buffer + อ้างอิงตาราง Multiple Shifts ทันที)
  lateCalculationMode: 2,

  // โหมดแสดงเกรด (Grade Display Mode)
  // 1 = แสดงผลปกติ (Show Grade Column)
  // 2 = ปิดการแสดงผลทั้งหมดของคอลัมน์ Grade (Hide Grade Column)
  showGradeMode: 2,
};
