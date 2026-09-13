-- IRL XP — static shop catalog seed
-- Run after 001_irl_xp_schema.sql.

insert into shop_items (name, description, price, type, metadata) values
  ('Focus Theme', 'A calm, distraction-free color theme.', 50, 'theme', '{"palette": "focus"}'),
  ('Night Theme', 'A dark theme for late-night quest sessions.', 50, 'theme', '{"palette": "night"}'),
  ('XP Booster', 'Cosmetic badge marking dedication to leveling up.', 100, 'badge', '{"icon": "xp-boost"}'),
  ('Golden Badge', 'A prestige badge for your profile.', 150, 'badge', '{"icon": "golden"}'),
  ('Streak Flame', 'A flame icon that shows off your streak.', 75, 'cosmetic', '{"icon": "streak-flame"}');
