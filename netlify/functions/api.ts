import express, { Request, Response, NextFunction } from 'express';
import serverless from 'serverless-http';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';

const app = express();

// ─── Cloudinary ───────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = () =>
  (process.env.CORS_ORIGINS || 'http://localhost:4200,https://dreamscene.netlify.app')
    .split(',')
    .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
      callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// ─── Path normalisation (local dev via netlify functions:serve) ───────────────
// Locally, the path arrives as /.netlify/functions/api/xxx → rewrite to /api/xxx
app.use((req, _res, next) => {
  const prefix = '/.netlify/functions/api';
  if (req.path.startsWith(prefix)) {
    req.url = '/api' + req.url.slice(prefix.length);
  }
  next();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDb = () => neon(process.env.DATABASE_URL!);
const jwtSecret = () => process.env.JWT_SECRET || 'change-me-in-production';

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), jwtSecret()) as any;
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

const ok = <T>(res: Response, message: string, data: T) =>
  res.json({ success: true, message, data });

const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, message });

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return fail(res, 400, 'Username and password required');
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE username = ${username} LIMIT 1`;
    const user = rows[0];
    if (!user || !(await bcrypt.compare(String(password), String(user.password)))) {
      return fail(res, 401, 'Invalid username or password');
    }
    const token = jwt.sign(
      { username: user.username, role: user.role, email: user.email },
      jwtSecret(),
      { expiresIn: '24h' }
    );
    return ok(res, 'Login successful', {
      token,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

// Utility endpoint – call once after deploy to set admin password, then leave it
app.get('/api/auth/reset-admin-password', async (_req, res) => {
  try {
    const sql = getDb();
    const hash = await bcrypt.hash('admin123', 10);
    await sql`
      INSERT INTO users (username, email, password, role)
      VALUES ('admin', 'admin@dreamscene.com', ${hash}, 'ADMIN')
      ON CONFLICT (username) DO UPDATE SET password = ${hash}
    `;
    return res.send(
      'Admin password reset to: admin123 — Keep this endpoint private, remove after use.'
    );
  } catch (e: any) {
    return res.status(500).send('Error: ' + e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/verification/send-code', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return fail(res, 400, 'Email is required');
    const sql = getDb();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await sql`DELETE FROM verification_codes WHERE email = ${email}`;
    await sql`
      INSERT INTO verification_codes (email, code, expires_at, verified)
      VALUES (${email}, ${code}, ${expiresAt}, false)
    `;
    // Only send email if Brevo credentials are configured
    if (process.env.BREVO_EMAIL && process.env.BREVO_API_KEY) {
      const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: { user: process.env.BREVO_EMAIL, pass: process.env.BREVO_API_KEY },
      });
      await transporter.sendMail({
        from: `"DreamScene" <${process.env.BREVO_FROM_EMAIL || process.env.BREVO_EMAIL}>`,
        to: String(email),
        subject: 'Order Tracking Verification Code',
        text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this email.`,
      });
    }
    // Code is always saved to DB — if email is not configured,
    // retrieve the code from your Neon SQL Editor for testing:
    // SELECT code FROM verification_codes WHERE email = 'test@example.com';
    return ok(res, 'Verification code sent successfully', null);
  } catch (e: any) {
    return fail(res, 500, 'Failed to send verification code: ' + e.message);
  }
});

app.post('/api/verification/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) return fail(res, 400, 'Email and code are required');
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM verification_codes
      WHERE email = ${email} AND code = ${code} AND verified = false AND expires_at > NOW()
      LIMIT 1
    `;
    if (!rows[0]) return ok(res, 'Invalid or expired verification code', false);
    await sql`UPDATE verification_codes SET verified = true WHERE id = ${rows[0].id as number}`;
    return ok(res, 'Code verified successfully', true);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES  (more-specific routes first)
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/categories', async (_req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        c.id, c.name, c.description, c.image_url AS "imageUrl", c.created_at AS "createdAt",
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id, 'name', s.name, 'imageUrl', s.image_url,
              'categoryId', s.category_id, 'createdAt', s.created_at
            ) ORDER BY s.name
          ) FILTER (WHERE s.id IS NOT NULL), '[]'
        ) AS subcategories
      FROM categories c
      LEFT JOIN subcategories s ON s.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `;
    return ok(res, 'Categories retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/categories/:id/subcategories', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, image_url AS "imageUrl", category_id AS "categoryId", created_at AS "createdAt"
      FROM subcategories WHERE category_id = ${req.params.id} ORDER BY name
    `;
    return ok(res, 'Subcategories retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/categories/:id/subcategories/:subId', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, image_url AS "imageUrl", category_id AS "categoryId", created_at AS "createdAt"
      FROM subcategories WHERE id = ${req.params.subId} AND category_id = ${req.params.id}
    `;
    if (!rows[0]) return fail(res, 404, 'Subcategory not found');
    return ok(res, 'Subcategory retrieved successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/categories/:id/with-subcategories', async (req, res) => {
  try {
    const sql = getDb();
    const cats = await sql`
      SELECT id, name, description, image_url AS "imageUrl", created_at AS "createdAt"
      FROM categories WHERE id = ${req.params.id}
    `;
    if (!cats[0]) return fail(res, 404, 'Category not found');
    const subs = await sql`
      SELECT id, name, image_url AS "imageUrl", category_id AS "categoryId", created_at AS "createdAt"
      FROM subcategories WHERE category_id = ${req.params.id} ORDER BY name
    `;
    return ok(res, 'Category retrieved successfully', { ...cats[0], subcategories: subs });
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, name, description, image_url AS "imageUrl", created_at AS "createdAt"
      FROM categories WHERE id = ${req.params.id}
    `;
    if (!rows[0]) return fail(res, 404, 'Category not found');
    return ok(res, 'Category retrieved successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body || {};
    if (!name) return fail(res, 400, 'Name is required');
    const sql = getDb();
    const rows = await sql`
      INSERT INTO categories (name, description, image_url)
      VALUES (${name}, ${description ?? null}, ${imageUrl ?? null})
      RETURNING id, name, description, image_url AS "imageUrl", created_at AS "createdAt"
    `;
    return ok(res, 'Category created successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body || {};
    const sql = getDb();
    const rows = await sql`
      UPDATE categories SET
        name = COALESCE(${name ?? null}, name),
        description = COALESCE(${description ?? null}, description),
        image_url = COALESCE(${imageUrl ?? null}, image_url)
      WHERE id = ${req.params.id}
      RETURNING id, name, description, image_url AS "imageUrl", created_at AS "createdAt"
    `;
    if (!rows[0]) return fail(res, 404, 'Category not found');
    return ok(res, 'Category updated successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM categories WHERE id = ${req.params.id}`;
    return ok(res, 'Category deleted successfully', null);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.post('/api/admin/subcategories', requireAdmin, async (req, res) => {
  try {
    const { name, imageUrl, categoryId } = req.body || {};
    if (!name || !categoryId) return fail(res, 400, 'Name and categoryId are required');
    const sql = getDb();
    const rows = await sql`
      INSERT INTO subcategories (name, image_url, category_id)
      VALUES (${name}, ${imageUrl ?? null}, ${categoryId})
      RETURNING id, name, image_url AS "imageUrl", category_id AS "categoryId", created_at AS "createdAt"
    `;
    return ok(res, 'Subcategory created successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.put('/api/admin/subcategories/:id', requireAdmin, async (req, res) => {
  try {
    const { name, imageUrl, categoryId } = req.body || {};
    const sql = getDb();
    const rows = await sql`
      UPDATE subcategories SET
        name = COALESCE(${name ?? null}, name),
        image_url = COALESCE(${imageUrl ?? null}, image_url),
        category_id = COALESCE(${categoryId ?? null}, category_id)
      WHERE id = ${req.params.id}
      RETURNING id, name, image_url AS "imageUrl", category_id AS "categoryId", created_at AS "createdAt"
    `;
    if (!rows[0]) return fail(res, 404, 'Subcategory not found');
    return ok(res, 'Subcategory updated successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.delete('/api/admin/subcategories/:id', requireAdmin, async (req, res) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM subcategories WHERE id = ${req.params.id}`;
    return ok(res, 'Subcategory deleted successfully', null);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS  (search before :id to avoid route conflict)
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/products/search', async (req, res) => {
  try {
    const keyword = `%${req.query.keyword ?? ''}%`;
    const sql = getDb();
    const rows = await sql`
      SELECT
        p.id, p.name, p.description,
        p.sale_price AS "salePrice", p.rent_price AS "rentPrice",
        p.availability, p.image_cover AS "imageCover",
        p.rating, p.stock_quantity AS "stockQuantity",
        p.created_at AS "createdAt",
        p.category_id AS "categoryId", p.subcategory_id AS "subcategoryId",
        c.name AS "categoryName", s.name AS "subcategoryName",
        COALESCE(
          json_agg(json_build_object('id', pi.id, 'imageUrl', pi.image_url, 'itemId', pi.product_id))
          FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS images
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN subcategories s ON s.id = p.subcategory_id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.name ILIKE ${keyword} OR p.description ILIKE ${keyword}
      GROUP BY p.id, c.id, c.name, s.id, s.name
      ORDER BY p.created_at DESC
    `;
    return ok(res, 'Products retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const sql = getDb();
    const catId = req.query.categoryId ? Number(req.query.categoryId) : null;
    const subId = req.query.subcategoryId ? Number(req.query.subcategoryId) : null;
    const avail = req.query.availability ? String(req.query.availability) : null;
    const rows = await sql`
      SELECT
        p.id, p.name, p.description,
        p.sale_price AS "salePrice", p.rent_price AS "rentPrice",
        p.availability, p.image_cover AS "imageCover",
        p.rating, p.stock_quantity AS "stockQuantity",
        p.created_at AS "createdAt",
        p.category_id AS "categoryId", p.subcategory_id AS "subcategoryId",
        c.name AS "categoryName", s.name AS "subcategoryName",
        COALESCE(
          json_agg(json_build_object('id', pi.id, 'imageUrl', pi.image_url, 'itemId', pi.product_id))
          FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS images
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN subcategories s ON s.id = p.subcategory_id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE (${catId}::bigint IS NULL OR p.category_id = ${catId}::bigint)
        AND (${subId}::bigint IS NULL OR p.subcategory_id = ${subId}::bigint)
        AND (${avail}::text IS NULL OR p.availability = ${avail}::text)
      GROUP BY p.id, c.id, c.name, s.id, s.name
      ORDER BY p.created_at DESC
    `;
    return ok(res, 'Products retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        p.id, p.name, p.description,
        p.sale_price AS "salePrice", p.rent_price AS "rentPrice",
        p.availability, p.image_cover AS "imageCover",
        p.rating, p.stock_quantity AS "stockQuantity",
        p.created_at AS "createdAt",
        p.category_id AS "categoryId", p.subcategory_id AS "subcategoryId",
        c.name AS "categoryName", s.name AS "subcategoryName",
        COALESCE(
          json_agg(json_build_object('id', pi.id, 'imageUrl', pi.image_url, 'itemId', pi.product_id))
          FILTER (WHERE pi.id IS NOT NULL), '[]'
        ) AS images
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN subcategories s ON s.id = p.subcategory_id
      LEFT JOIN product_images pi ON pi.product_id = p.id
      WHERE p.id = ${req.params.id}
      GROUP BY p.id, c.id, c.name, s.id, s.name
    `;
    if (!rows[0]) return fail(res, 404, 'Product not found');
    return ok(res, 'Product retrieved successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, salePrice, rentPrice, availability, imageCover, rating, stockQuantity, categoryId, subcategoryId } = req.body || {};
    if (!name || !availability || !categoryId || !subcategoryId) {
      return fail(res, 400, 'name, availability, categoryId and subcategoryId are required');
    }
    const sql = getDb();
    const rows = await sql`
      INSERT INTO products (name, description, sale_price, rent_price, availability, image_cover, rating, stock_quantity, category_id, subcategory_id)
      VALUES (${name}, ${description ?? null}, ${salePrice ?? null}, ${rentPrice ?? null}, ${availability}, ${imageCover ?? null}, ${rating ?? 0}, ${stockQuantity ?? 0}, ${categoryId}, ${subcategoryId})
      RETURNING id, name, description, sale_price AS "salePrice", rent_price AS "rentPrice",
        availability, image_cover AS "imageCover", rating, stock_quantity AS "stockQuantity",
        created_at AS "createdAt", category_id AS "categoryId", subcategory_id AS "subcategoryId"
    `;
    return ok(res, 'Product created successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, salePrice, rentPrice, availability, imageCover, rating, stockQuantity, categoryId, subcategoryId } = req.body || {};
    const sql = getDb();
    const rows = await sql`
      UPDATE products SET
        name = COALESCE(${name ?? null}, name),
        description = COALESCE(${description ?? null}, description),
        sale_price = COALESCE(${salePrice ?? null}, sale_price),
        rent_price = COALESCE(${rentPrice ?? null}, rent_price),
        availability = COALESCE(${availability ?? null}, availability),
        image_cover = COALESCE(${imageCover ?? null}, image_cover),
        rating = COALESCE(${rating ?? null}, rating),
        stock_quantity = COALESCE(${stockQuantity ?? null}, stock_quantity),
        category_id = COALESCE(${categoryId ?? null}, category_id),
        subcategory_id = COALESCE(${subcategoryId ?? null}, subcategory_id)
      WHERE id = ${req.params.id}
      RETURNING id, name, description, sale_price AS "salePrice", rent_price AS "rentPrice",
        availability, image_cover AS "imageCover", rating, stock_quantity AS "stockQuantity",
        created_at AS "createdAt", category_id AS "categoryId", subcategory_id AS "subcategoryId"
    `;
    if (!rows[0]) return fail(res, 404, 'Product not found');
    return ok(res, 'Product updated successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM products WHERE id = ${req.params.id}`;
    return ok(res, 'Product deleted successfully', null);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PARTNERS  (category route before :id to avoid conflict)
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/partners/category/:category', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, title, category, description, icon, image_url AS "imageUrl",
        since, rating, gradient, created_at AS "createdAt"
      FROM partners WHERE category = ${req.params.category} ORDER BY title
    `;
    return ok(res, 'Partners retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/partners', async (_req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, title, category, description, icon, image_url AS "imageUrl",
        since, rating, gradient, created_at AS "createdAt"
      FROM partners ORDER BY title
    `;
    return ok(res, 'Partners retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/partners/:id', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, title, category, description, icon, image_url AS "imageUrl",
        since, rating, gradient, created_at AS "createdAt"
      FROM partners WHERE id = ${req.params.id}
    `;
    if (!rows[0]) return fail(res, 404, 'Partner not found');
    return ok(res, 'Partner retrieved successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.post('/api/admin/partners', requireAdmin, async (req, res) => {
  try {
    const { title, category, description, icon, imageUrl, since, rating, gradient } = req.body || {};
    if (!title || !category || !icon) return fail(res, 400, 'title, category and icon are required');
    const sql = getDb();
    const rows = await sql`
      INSERT INTO partners (title, category, description, icon, image_url, since, rating, gradient)
      VALUES (${title}, ${category}, ${description ?? null}, ${icon}, ${imageUrl ?? null}, ${since ?? null}, ${rating ?? null}, ${gradient ?? null})
      RETURNING id, title, category, description, icon, image_url AS "imageUrl",
        since, rating, gradient, created_at AS "createdAt"
    `;
    return ok(res, 'Partner created successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.put('/api/admin/partners/:id', requireAdmin, async (req, res) => {
  try {
    const { title, category, description, icon, imageUrl, since, rating, gradient } = req.body || {};
    const sql = getDb();
    const rows = await sql`
      UPDATE partners SET
        title = COALESCE(${title ?? null}, title),
        category = COALESCE(${category ?? null}, category),
        description = COALESCE(${description ?? null}, description),
        icon = COALESCE(${icon ?? null}, icon),
        image_url = COALESCE(${imageUrl ?? null}, image_url),
        since = COALESCE(${since ?? null}, since),
        rating = COALESCE(${rating ?? null}, rating),
        gradient = COALESCE(${gradient ?? null}, gradient)
      WHERE id = ${req.params.id}
      RETURNING id, title, category, description, icon, image_url AS "imageUrl",
        since, rating, gradient, created_at AS "createdAt"
    `;
    if (!rows[0]) return fail(res, 404, 'Partner not found');
    return ok(res, 'Partner updated successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.delete('/api/admin/partners/:id', requireAdmin, async (req, res) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM partners WHERE id = ${req.params.id}`;
    return ok(res, 'Partner deleted successfully', null);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/orders', async (req, res) => {
  try {
    const { userName, userEmail, userPhone, items } = req.body || {};
    if (!userName || !userEmail || !userPhone || !Array.isArray(items) || !items.length) {
      return fail(res, 400, 'userName, userEmail, userPhone and items are required');
    }
    const sql = getDb();

    // Validate products and compute total
    let totalAmount = 0;
    const enrichedItems: any[] = [];

    for (const item of items) {
      const products = await sql`SELECT * FROM products WHERE id = ${item.itemId} LIMIT 1`;
      if (!products[0]) return fail(res, 404, `Product ${item.itemId} not found`);
      const product = products[0];
      const unitPrice =
        item.type === 'RENT' ? Number(product.rent_price) : Number(product.sale_price);
      const lineTotal =
        item.type === 'RENT'
          ? unitPrice * item.quantity * (item.rentDays || 1)
          : unitPrice * item.quantity;
      totalAmount += lineTotal;
      enrichedItems.push({ ...item, productName: product.name, unitPrice });
    }

    // Insert order
    const orderRows = await sql`
      INSERT INTO orders (user_name, user_email, user_phone, total_amount, status)
      VALUES (${userName}, ${userEmail}, ${userPhone}, ${totalAmount}, 'PENDING')
      RETURNING *
    `;
    const order = orderRows[0];

    // Insert items
    const insertedItems: any[] = [];
    for (const item of enrichedItems) {
      const itemRows = await sql`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, type, price, rent_days)
        VALUES (${order.id}, ${item.itemId}, ${item.productName}, ${item.quantity}, ${item.type}, ${item.unitPrice}, ${item.rentDays ?? null})
        RETURNING id, product_id AS "itemId", product_name AS "itemName", quantity, type, price, rent_days AS "rentDays"
      `;
      insertedItems.push(itemRows[0]);
    }

    return ok(res, 'Order created successfully', {
      id: order.id,
      userName: order.user_name,
      userEmail: order.user_email,
      userPhone: order.user_phone,
      totalAmount: order.total_amount,
      status: order.status,
      createdAt: order.created_at,
      items: insertedItems,
    });
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/orders/email/:email', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        o.id, o.user_name AS "userName", o.user_email AS "userEmail",
        o.user_phone AS "userPhone", o.total_amount AS "totalAmount",
        o.status, o.rejection_reason AS "rejectionReason", o.created_at AS "createdAt",
        COALESCE(
          json_agg(json_build_object(
            'id', oi.id, 'itemId', oi.product_id, 'itemName', oi.product_name,
            'quantity', oi.quantity, 'type', oi.type, 'price', oi.price, 'rentDays', oi.rent_days
          )) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_email = ${req.params.email}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    return ok(res, 'Orders retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/orders/phone/:phone', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        o.id, o.user_name AS "userName", o.user_email AS "userEmail",
        o.user_phone AS "userPhone", o.total_amount AS "totalAmount",
        o.status, o.rejection_reason AS "rejectionReason", o.created_at AS "createdAt",
        COALESCE(
          json_agg(json_build_object(
            'id', oi.id, 'itemId', oi.product_id, 'itemName', oi.product_name,
            'quantity', oi.quantity, 'type', oi.type, 'price', oi.price, 'rentDays', oi.rent_days
          )) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_phone = ${req.params.phone}
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    return ok(res, 'Orders retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        o.id, o.user_name AS "userName", o.user_email AS "userEmail",
        o.user_phone AS "userPhone", o.total_amount AS "totalAmount",
        o.status, o.rejection_reason AS "rejectionReason", o.created_at AS "createdAt",
        COALESCE(
          json_agg(json_build_object(
            'id', oi.id, 'itemId', oi.product_id, 'itemName', oi.product_name,
            'quantity', oi.quantity, 'type', oi.type, 'price', oi.price, 'rentDays', oi.rent_days
          )) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
    return ok(res, 'Orders retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        o.id, o.user_name AS "userName", o.user_email AS "userEmail",
        o.user_phone AS "userPhone", o.total_amount AS "totalAmount",
        o.status, o.rejection_reason AS "rejectionReason", o.created_at AS "createdAt",
        COALESCE(
          json_agg(json_build_object(
            'id', oi.id, 'itemId', oi.product_id, 'itemName', oi.product_name,
            'quantity', oi.quantity, 'type', oi.type, 'price', oi.price, 'rentDays', oi.rent_days
          )) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ${req.params.id}
      GROUP BY o.id
    `;
    if (!rows[0]) return fail(res, 404, 'Order not found');
    return ok(res, 'Order retrieved successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.put('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    // Status can come from query param (original API) or body
    const status = (req.query.status || req.body?.status) as string;
    const rejectionReason = req.query.rejectionReason || req.body?.rejectionReason || null;
    const validStatuses = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return fail(res, 400, `Status must be one of: ${validStatuses.join(', ')}`);
    }
    const sql = getDb();
    const rows = await sql`
      UPDATE orders SET
        status = ${status},
        rejection_reason = ${rejectionReason as string ?? null}
      WHERE id = ${req.params.id}
      RETURNING id, user_name AS "userName", user_email AS "userEmail",
        user_phone AS "userPhone", total_amount AS "totalAmount",
        status, rejection_reason AS "rejectionReason", created_at AS "createdAt"
    `;
    if (!rows[0]) return fail(res, 404, 'Order not found');
    return ok(res, 'Order status updated successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIAL ORDERS
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/special-orders', async (req, res) => {
  try {
    const { userName, userEmail, description, imageUrls } = req.body || {};
    if (!userName || !userEmail || !description) {
      return fail(res, 400, 'userName, userEmail and description are required');
    }
    const sql = getDb();
    const rows = await sql`
      INSERT INTO special_orders (user_name, user_email, description, image_urls, status)
      VALUES (${userName}, ${userEmail}, ${description}, ${imageUrls ?? null}, 'PENDING')
      RETURNING id, user_name AS "userName", user_email AS "userEmail", description,
        image_urls AS "imageUrls", status, admin_notes AS "adminNotes", created_at AS "createdAt"
    `;
    return ok(res, 'Special order submitted successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/special-orders/user/:email', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, user_name AS "userName", user_email AS "userEmail", description,
        image_urls AS "imageUrls", status, admin_notes AS "adminNotes", created_at AS "createdAt"
      FROM special_orders WHERE user_email = ${req.params.email}
      ORDER BY created_at DESC
    `;
    return ok(res, 'Special orders retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/admin/special-orders', requireAdmin, async (_req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, user_name AS "userName", user_email AS "userEmail", description,
        image_urls AS "imageUrls", status, admin_notes AS "adminNotes", created_at AS "createdAt"
      FROM special_orders ORDER BY created_at DESC
    `;
    return ok(res, 'Special orders retrieved successfully', rows);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.get('/api/admin/special-orders/:id', requireAdmin, async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, user_name AS "userName", user_email AS "userEmail", description,
        image_urls AS "imageUrls", status, admin_notes AS "adminNotes", created_at AS "createdAt"
      FROM special_orders WHERE id = ${req.params.id}
    `;
    if (!rows[0]) return fail(res, 404, 'Special order not found');
    return ok(res, 'Special order retrieved successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.put('/api/admin/special-orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body || {};
    const validStatuses = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return fail(res, 400, `Status must be one of: ${validStatuses.join(', ')}`);
    }
    const sql = getDb();
    const rows = await sql`
      UPDATE special_orders SET
        status = ${status},
        admin_notes = COALESCE(${adminNotes ?? null}, admin_notes)
      WHERE id = ${req.params.id}
      RETURNING id, user_name AS "userName", user_email AS "userEmail", description,
        image_urls AS "imageUrls", status, admin_notes AS "adminNotes", created_at AS "createdAt"
    `;
    if (!rows[0]) return fail(res, 404, 'Special order not found');
    return ok(res, 'Special order status updated successfully', rows[0]);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

app.delete('/api/admin/special-orders/:id', requireAdmin, async (req, res) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM special_orders WHERE id = ${req.params.id}`;
    return ok(res, 'Special order deleted successfully', null);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE MANAGEMENT  (upload handled client-side via Cloudinary unsigned preset)
// ═══════════════════════════════════════════════════════════════════════════════
app.delete('/api/admin/delete-image', requireAdmin, async (req, res) => {
  try {
    const imageUrl = req.query.url as string;
    if (!imageUrl) return fail(res, 400, 'url query parameter is required');
    // Extract public_id from Cloudinary URL
    // e.g. https://res.cloudinary.com/cloud/image/upload/v123/dreamscene/abc.jpg → dreamscene/abc
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    if (match?.[1]) {
      await cloudinary.uploader.destroy(match[1]);
    }
    return ok(res, 'Image deleted successfully', null);
  } catch (e: any) {
    return fail(res, 500, e.message);
  }
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Endpoint not found' }));

export const handler = serverless(app);
