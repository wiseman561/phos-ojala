-- Initialize Ojala Healthcare database
-- This script runs when PostgreSQL container starts for the first time

-- Create the user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'ojala_user') THEN

      CREATE USER ojala_user WITH PASSWORD 'ojala_password';
   END IF;
END
$do$;

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE ojala_db OWNER ojala_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ojala_db')\gexec

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE ojala_db TO ojala_user;

-- Connect to the ojala_db database and set up schema permissions
\c ojala_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ojala_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ojala_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ojala_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ojala_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ojala_user;