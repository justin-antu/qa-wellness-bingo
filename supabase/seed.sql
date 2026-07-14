-- QA Winter Wellness Bingo Tracker - seed data
--
-- Loads the 25 challenges from the bingo card (read left-to-right, top-to-
-- bottom) into the `activities` table, default display text, the first
-- challenge round, and a default admin password. Safe to re-run.
--
-- IMPORTANT: change the default admin password immediately after seeding -
-- log into /admin with "changeme123" and update it from the Settings tab
-- (or run: select admin_change_password('changeme123', 'your-new-password');).

insert into activities (position, title) values
  (1,  'Hit 10,000 steps for 20 days (non-consecutive)'),
  (2,  'Read a new book'),
  (3,  'Spend a few minutes organising your workspace'),
  (4,  'Eat 5 servings of fruits or vegetables in one day'),
  (5,  'Complete your daily hydration goal'),
  (6,  'Have a "No Phone Day" (Calls Allowed :D)'),
  (7,  'Reflect on one moment that made you smile'),
  (8,  'Try a new cafe or brunch spot'),
  (9,  'Maintain a consistent sleep and wake routine'),
  (10, 'Go for a walk without headphones'),
  (11, 'Give kudos to a teammate'),
  (12, 'Try a new form of exercise (swim, Pilates, cycling, etc.)'),
  (13, 'Send a random kind message to someone you appreciate within the QA team'),
  (14, 'Have one junk-free healthy weekend'),
  (15, 'Write down three things you''re grateful for before ending your day everyday'),
  (16, 'Try a new recipe you''ve never made before'),
  (17, 'Do something enjoyable with no productivity purpose'),
  (18, 'Go for coffee with someone from the QA team you haven''t connected with much yet'),
  (19, 'Spending 20 minutes learning something new'),
  (20, 'Have a "Beanie Day" at the office and snap a selfie'),
  (21, 'Acknowledge one thing you handled well today'),
  (22, 'Sit in silence for 10 mins daily'),
  (23, 'Take a proper lunch break away from your desk'),
  (24, 'Go to the closest park and play any equipment, slide, swing etc'),
  (25, 'Join for June Culinary walk')
on conflict (position) do update set title = excluded.title;

insert into app_settings (key, value) values
  ('title', 'QA Winter Wellness Challenge'),
  ('kicker', 'Pause Every Day'),
  ('subtitle', 'QA Winter Wellness Challenge'),
  ('footer_note', 'Complete all 25 challenges during Winter! (June to August)'),
  ('signups_open', 'true'),
  -- Empty by default (no countdown banner shown) - set a "yyyy-mm-dd" date
  -- from the admin Settings tab to turn it on.
  ('challenge_end_date', '')
on conflict (key) do nothing;

-- Only seed a starting round if there isn't already an active one, so this
-- file stays safe to re-run without accidentally resetting progress.
insert into rounds (label)
select 'Round 1'
where not exists (select 1 from rounds where ended_at is null);

-- Default admin password is "changeme123" - change it right after seeding.
insert into admin_settings (id, password_hash)
values (true, crypt('changeme123', gen_salt('bf')))
on conflict (id) do nothing;
