CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  full_name     VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  role          role_enum   NOT NULL DEFAULT 'guest',
  department    department_enum,
  phone         VARCHAR(20),
  student_id    VARCHAR(20),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email      ON users(email);
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_is_active  ON users(is_active);

CREATE TABLE seasons (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  start_date DATE    NOT NULL,
  end_date   DATE    NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT seasons_date_check CHECK (end_date > start_date)
);

CREATE TABLE season_members (
  id         UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id  UUID            NOT NULL REFERENCES seasons(id)  ON DELETE CASCADE,
  user_id    UUID            NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  role       role_enum       NOT NULL,
  department department_enum NOT NULL,
  joined_at  DATE            NOT NULL DEFAULT CURRENT_DATE,
  left_at    DATE,
  CONSTRAINT season_members_unique UNIQUE (season_id, user_id),
  CONSTRAINT season_members_date_check CHECK (left_at IS NULL OR left_at > joined_at)
);