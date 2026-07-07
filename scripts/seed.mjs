import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const dbPath = "/Users/phongtran/Library/Application Support/com.customermgmt.app/customer_mgmt.db";

// Names generation arrays (Vietnamese style mock data)
const familyNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const middleNames = ["Văn", "Thị", "Minh", "Hữu", "Đức", "Anh", "Hoàng", "Khánh", "Ngọc", "Thanh", "Như", "Tuấn", "Quang"];
const givenNames = ["Hùng", "Dũng", "Sơn", "Hải", "Tuấn", "Anh", "Vy", "Trang", "Linh", "Hương", "Lan", "Mai", "Cường", "Nam", "Phong", "Long", "Tùng", "Bách", "Giang", "Hà", "Yến", "Oanh", "Thảo", "Hạnh"];

function generateName() {
  const f = familyNames[Math.floor(Math.random() * familyNames.length)];
  const m = middleNames[Math.floor(Math.random() * middleNames.length)];
  const g = givenNames[Math.floor(Math.random() * givenNames.length)];
  return `${f} ${m} ${g}`;
}

function generatePhone() {
  const prefixes = ["090", "091", "098", "097", "096", "032", "033", "034", "035", "036", "037", "038", "039", "070", "079", "077", "076", "078", "083", "084", "085", "081", "082"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
  return `${prefix}${num}`;
}

console.log("Generating 1000 mock customer records...");

let sql = "BEGIN TRANSACTION;\n";
for (let i = 0; i < 1000; i++) {
  const name = generateName();
  const phone = generatePhone();
  const escapedName = name.replace(/'/g, "''");
  sql += `INSERT INTO customers (name, phone) VALUES ('${escapedName}', '${phone}');\n`;
}
sql += "COMMIT;\n";

const tempSqlFile = join(process.cwd(), "scripts", "temp_seed.sql");
writeFileSync(tempSqlFile, sql);

try {
  console.log(`Executing SQL Transaction against SQLite db: ${dbPath}`);
  execSync(`sqlite3 "${dbPath}" < "${tempSqlFile}"`);
  console.log("✅ Seed complete! 1000 customers successfully added.");
} catch (err) {
  console.error("❌ Seeding failed:", err.message);
} finally {
  try {
    unlinkSync(tempSqlFile);
  } catch {}
}
