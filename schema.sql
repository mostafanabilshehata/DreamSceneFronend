-- ─────────────────────────────────────────────────────────────────────────────
-- DreamScene PostgreSQL Schema for Neon
-- Run this in your Neon project's SQL Editor before first deploy
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  username   VARCHAR(255) NOT NULL UNIQUE,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(50)  NOT NULL DEFAULT 'ADMIN',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id          BIGSERIAL    PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  description VARCHAR(1000),
  image_url   TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategories (
  id          BIGSERIAL    PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  image_url   TEXT,
  category_id BIGINT       NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id             BIGSERIAL       PRIMARY KEY,
  name           VARCHAR(255)    NOT NULL,
  description    TEXT,
  sale_price     DECIMAL(10, 2),
  rent_price     DECIMAL(10, 2),
  availability   VARCHAR(20)     NOT NULL CHECK (availability IN ('SALE', 'RENT', 'BOTH')),
  image_cover    TEXT,
  rating         DOUBLE PRECISION NOT NULL DEFAULT 0,
  stock_quantity INTEGER          NOT NULL DEFAULT 0,
  category_id    BIGINT           NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id BIGINT           NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_images (
  id         BIGSERIAL PRIMARY KEY,
  image_url  TEXT      NOT NULL,
  product_id BIGINT    NOT NULL REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partners (
  id          BIGSERIAL    PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  category    VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  icon        VARCHAR(255) NOT NULL,
  image_url   VARCHAR(500),
  since       VARCHAR(50),
  rating      VARCHAR(50),
  gradient    VARCHAR(500),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id               BIGSERIAL       PRIMARY KEY,
  user_name        VARCHAR(255)    NOT NULL,
  user_email       VARCHAR(255)    NOT NULL,
  user_phone       VARCHAR(255)    NOT NULL,
  total_amount     DECIMAL(10, 2)  NOT NULL,
  status           VARCHAR(50)     NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED')),
  rejection_reason VARCHAR(500),
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id           BIGSERIAL      PRIMARY KEY,
  order_id     BIGINT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   BIGINT         NOT NULL,
  product_name VARCHAR(255)   NOT NULL,
  quantity     INTEGER        NOT NULL,
  type         VARCHAR(20)    NOT NULL CHECK (type IN ('SALE', 'RENT')),
  price        DECIMAL(10, 2) NOT NULL,
  rent_days    INTEGER
);

CREATE TABLE IF NOT EXISTS special_orders (
  id          BIGSERIAL   PRIMARY KEY,
  user_name   VARCHAR(255) NOT NULL,
  user_email  VARCHAR(255) NOT NULL,
  description TEXT         NOT NULL,
  image_urls  TEXT,
  status      VARCHAR(50)  NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED')),
  admin_notes TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id         BIGSERIAL    PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  code       VARCHAR(10)  NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  verified   BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ─── Indexes for common lookups ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_orders_email         ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_phone         ON orders(user_phone);
CREATE INDEX IF NOT EXISTS idx_special_orders_email ON special_orders(user_email);
CREATE INDEX IF NOT EXISTS idx_verification_email   ON verification_codes(email);

-- ─── NOTE ─────────────────────────────────────────────────────────────────────
-- After running this schema and deploying to Netlify, call:
--   GET https://your-site.netlify.app/api/auth/reset-admin-password
-- to create the initial admin user with password: admin123
-- Then log in and change the password, and remove that endpoint from api.ts
-- ─────────────────────────────────────────────────────────────────────────────
