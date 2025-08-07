-- Initialize Phos Healthcare database
-- This script runs when PostgreSQL container starts for the first time

-- Create the user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'phos_user') THEN

      CREATE USER phos_user WITH PASSWORD 'phos_password';
   END IF;
END
$do$;

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE phos_db OWNER phos_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'phos_db')\gexec

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE phos_db TO phos_user;

-- Connect to the phos_db database and set up schema permissions
\c phos_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO phos_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO phos_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO phos_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO phos_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO phos_user;