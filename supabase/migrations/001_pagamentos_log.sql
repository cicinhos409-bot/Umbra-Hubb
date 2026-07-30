-- ============================================================
--  Tabela de log de eventos de pagamento da Cakto
--  Execute no Supabase SQL Editor ou via supabase db push
-- ============================================================

CREATE TABLE IF NOT EXISTS pagamentos_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL,
  event            TEXT NOT NULL,
  transaction_id   TEXT,
  amount           NUMERIC(10,2) DEFAULT 0,
  produto          TEXT,
  tier_atribuido   TEXT,
  licenca          TEXT,
  motivo           TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_pagamentos_log_email       ON pagamentos_log(email);
CREATE INDEX IF NOT EXISTS idx_pagamentos_log_event       ON pagamentos_log(event);
CREATE INDEX IF NOT EXISTS idx_pagamentos_log_created_at  ON pagamentos_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagamentos_log_transaction ON pagamentos_log(transaction_id);

-- Somente service_role pode inserir/ler (webhook usa service role)
ALTER TABLE pagamentos_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON pagamentos_log
  USING (true)
  WITH CHECK (true);
