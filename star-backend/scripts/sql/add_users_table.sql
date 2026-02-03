CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    hashed_password VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Index for username lookups
CREATE INDEX ix_users_username ON users (username);
