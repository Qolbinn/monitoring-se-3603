CREATE TABLE IF NOT EXISTS public.survey_period (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.survey_period (id, name, start_date, end_date) 
VALUES (1, 'Sensus Ekonomi 2026', '2026-06-15', '2026-08-31')
ON CONFLICT (id) DO NOTHING;
