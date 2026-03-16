-- Seed supermarkets
-- Dutch market share order: AH ~35%, Jumbo ~22%, Lidl ~12%, Aldi ~9%, Plus ~5%, rest

INSERT INTO supermarkets (slug, name, logo_url, website_url, color, is_active) VALUES
  ('ah',         'Albert Heijn',  NULL, 'https://www.ah.nl',          '#00A0E2', true),
  ('jumbo',      'Jumbo',         NULL, 'https://www.jumbo.com',       '#FFD700', true),
  ('lidl',       'Lidl',          NULL, 'https://www.lidl.nl',         '#0050AA', true),
  ('aldi',       'Aldi',          NULL, 'https://www.aldi.nl',         '#1D5AA8', true),
  ('plus',       'Plus',          NULL, 'https://www.plus.nl',         '#E30613', true),
  ('dirk',       'Dirk',          NULL, 'https://www.dirk.nl',         '#E4002B', true),
  ('hoogvliet',  'Hoogvliet',     NULL, 'https://www.hoogvliet.com',   '#009900', true),
  ('vomar',      'Vomar',         NULL, 'https://www.vomar.nl',        '#E2001A', true),
  ('poiesz',     'Poiesz',        NULL, 'https://www.poiesz-supermarkten.nl', '#00529B', true),
  ('spar',       'Spar',          NULL, 'https://www.spar.nl',         '#007A3D', true),
  ('dekamarkt',  'DekaMarkt',     NULL, 'https://www.dekamarkt.nl',    '#C8002D', true)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  website_url = EXCLUDED.website_url,
  color       = EXCLUDED.color;
