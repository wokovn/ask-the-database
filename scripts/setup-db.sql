-- 1. Create read-only role if not exists
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'shop_readonly') THEN
      CREATE ROLE shop_readonly WITH LOGIN PASSWORD 'shop_readonly_secret';
   END IF;
END $$;

-- 2. Grant permissions on shop database & public schema
GRANT CONNECT ON DATABASE shop TO shop_readonly;
GRANT USAGE ON SCHEMA public TO shop_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO shop_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO shop_readonly;

-- 3. Hard security settings on shop_readonly
ALTER ROLE shop_readonly SET default_transaction_read_only = on;
ALTER ROLE shop_readonly SET statement_timeout = '5000'; -- 5 seconds timeout
