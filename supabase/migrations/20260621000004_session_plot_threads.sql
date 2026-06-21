CREATE TABLE session_plot_threads (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES sessions(id)     ON DELETE CASCADE,
  plot_thread_id UUID NOT NULL REFERENCES plot_threads(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, plot_thread_id)
);
