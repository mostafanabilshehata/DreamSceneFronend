import mysql from 'mysql2/promise';
import fs from 'fs';

const conn = await mysql.createConnection({
  host: 'yamabiko.proxy.rlwy.net',
  port: 45040,
  user: 'root',
  password: 'ibPUCUXnmmMsVbpKKuJPxGwpVhwLgEoy',
  database: 'railway',
  connectTimeout: 20000,
  ssl: {}
});

const tables = [
  'categories',
  'subcategories',
  'products',
  'product_images',
  'partners',
  'orders',
  'order_items',
  'special_orders',
];

let sql = `-- Railway → Neon data export\n-- Run this in Neon SQL Editor AFTER running schema.sql\n\n`;

for (const table of tables) {
  const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
  if (!rows.length) {
    sql += `-- (no rows in ${table})\n\n`;
    continue;
  }

  const cols = Object.keys(rows[0]).map(c => `"${c}"`).join(', ');
  sql += `-- ${table} (${rows.length} rows)\n`;

  for (const row of rows) {
    const vals = Object.values(row).map(v => {
      if (v === null) return 'NULL';
      if (v instanceof Date) return `'${v.toISOString()}'`;
      if (typeof v === 'number') return v;
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
      return `'${String(v).replace(/'/g, "''")}'`;
    }).join(', ');
    sql += `INSERT INTO "${table}" (${cols}) VALUES (${vals});\n`;
  }

  // Reset sequence so future inserts don't conflict
  sql += `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), MAX(id)) FROM "${table}";\n\n`;
}

await conn.end();

fs.writeFileSync('neon-import.sql', sql);
console.log('Done! Saved to neon-import.sql');
