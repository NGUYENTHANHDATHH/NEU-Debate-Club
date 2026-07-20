CREATE TABLE transactions (
  id               UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  type             transaction_type_enum  NOT NULL,
  amount           DECIMAL(15,2)          NOT NULL,
  description      VARCHAR(500)           NOT NULL,
  category         VARCHAR(100),
  event_id         UUID                   REFERENCES events(id) ON DELETE SET NULL,
  transaction_date DATE                   NOT NULL,
  created_by       UUID                   NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ            NOT NULL DEFAULT now(),
  CONSTRAINT transactions_amount_check CHECK (amount > 0)
);

CREATE INDEX idx_transactions_event_id         ON transactions(event_id);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date DESC);

CREATE TABLE partners (
  id                   UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name         VARCHAR(255)        NOT NULL,
  field                VARCHAR(100),
  logo_url             TEXT,
  status               partner_status_enum NOT NULL DEFAULT 'dang_lien_he',
  total_collaborations INTEGER             NOT NULL DEFAULT 0,
  total_sponsored      DECIMAL(15,2)       NOT NULL DEFAULT 0,
  notes                TEXT,
  created_by           UUID                NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE TABLE partner_contacts (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID    NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  full_name  VARCHAR(255) NOT NULL,
  position   VARCHAR(100),
  phone      VARCHAR(20),
  email      VARCHAR(255),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE outreach_logs (
  id             UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id     UUID                 NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  contact_date   DATE                 NOT NULL,
  method         VARCHAR(50)          NOT NULL,
  content        TEXT                 NOT NULL,
  result         outreach_result_enum NOT NULL DEFAULT 'cho_phan_hoi',
  follow_up_date DATE,
  created_by     UUID                 NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ          NOT NULL DEFAULT now()
);

CREATE TABLE collaborations (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id         UUID          NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
  event_id           UUID          REFERENCES events(id) ON DELETE SET NULL,
  description        VARCHAR(500)  NOT NULL,
  sponsored_amount   DECIMAL(15,2) NOT NULL DEFAULT 0,
  mou_link           TEXT,
  collaboration_date DATE          NOT NULL,
  created_by         UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now()
);