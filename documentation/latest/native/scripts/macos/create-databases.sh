#!/bin/bash

# Run commands as the postgres user
# Note: -d postgres connects to the default maintenance database (required on macOS Homebrew)
psql -p 5432 -d postgres -c "CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgres';" 2>/dev/null || echo "User postgres already exists, skipping."

# Create the mentoring database and assign privileges
psql -p 5432 -d postgres -c "CREATE DATABASE mentoring;"
psql -p 5432 -d mentoring -c "GRANT ALL PRIVILEGES ON DATABASE mentoring TO postgres;"
psql -p 5432 -d mentoring -c "GRANT ALL ON SCHEMA public TO postgres;"

# Create the user database and assign privileges
psql -p 5432 -d postgres -c "CREATE DATABASE users;"
psql -p 5432 -d users -c "GRANT ALL PRIVILEGES ON DATABASE users TO postgres;"
psql -p 5432 -d users -c "GRANT ALL ON SCHEMA public TO postgres;"

# Create the notification database and assign privileges
psql -p 5432 -d postgres -c "CREATE DATABASE notification;"
psql -p 5432 -d notification -c "GRANT ALL PRIVILEGES ON DATABASE notification TO postgres;"
psql -p 5432 -d notification -c "GRANT ALL ON SCHEMA public TO postgres;"

# Create the communications database and assign privileges
psql -p 5432 -d postgres -c "CREATE DATABASE communications;"
psql -p 5432 -d communications -c "GRANT ALL PRIVILEGES ON DATABASE communications TO postgres;"
psql -p 5432 -d communications -c "GRANT ALL ON SCHEMA public TO postgres;"

echo "Database setup complete."
