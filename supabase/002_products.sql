-- Drop policy if exists
drop policy if exists "Public read-only products" on products;

-- Create products table
create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  sub text not null,
  price numeric not null,
  description text,
  is_new boolean default false,
  release_date date,
  rating numeric default 0,
  reviews int default 0
);

-- Enable RLS
alter table products enable row level security;

-- Public read-only policy
create policy "Public read-only products"
  on products for select
  using (true);

-- Insert seed data
insert into products (id, name, category, sub, price, description, is_new, release_date, rating, reviews)
values
  ('sv-velocity-x', 'Marg Velocity X', 'men', 'Running', 12999, 'Lightweight carbon-plated runner engineered for speed. Energy-return foam delivers explosive takeoff on every stride.', true, '2026-06-15', 4.8, 142),
  ('sv-aero-pulse', 'Marg Aero Pulse', 'men', 'Running', 10499, 'Daily training shoe with breathable engineered mesh and responsive midsole.', false, null, 4.6, 89),
  ('sv-court-pro', 'Marg Court Pro', 'men', 'Sports', 8999, 'Multi-court traction with lateral support for explosive cuts.', false, null, 4.5, 64),
  ('sv-urban-low', 'Marg Urban Low', 'men', 'Casual', 7499, 'Minimalist everyday silhouette in premium leather.', false, null, 4.4, 51),
  ('sv-flux-trainer', 'Marg Flux Trainer', 'men', 'Training', 9499, 'Stability-tuned trainer for HIIT, lifting, and cross-training.', true, '2026-06-20', 4.7, 73),
  ('sv-phantom-elite', 'Marg Phantom Elite', 'men', 'Running', 15999, 'Flagship race-day shoe. Full-length carbon plate, ultra-light superfoam.', true, '2026-06-25', 5.0, 12),
  ('sv-nova-low', 'Marg Nova Low', 'men', 'Lifestyle', 8299, 'Heritage runner-inspired silhouette, modernized.', false, null, 4.5, 76),
  ('sv-drift-trainer', 'Marg Drift Trainer', 'men', 'Training', 10999, 'Gym-to-street trainer with stable wide base.', false, null, 4.6, 62),
  ('sv-apex-street', 'Marg Apex Street', 'men', 'Casual', 8999, 'Urban street style meets high-performance comfort.', false, null, 4.4, 34),
  ('sv-quantum-run', 'Marg Quantum Run', 'men', 'Running', 13999, 'Propulsive feel for long distances and marathons.', true, '2026-07-01', 4.9, 22),
  ('sv-titan-court', 'Marg Titan Court', 'men', 'Sports', 9999, 'Heavy-duty court protection with pivot points.', false, null, 4.7, 110),
  ('sv-hyper-lift', 'Marg Hyper Lift', 'men', 'Training', 11499, 'Elevated heel for maximum squat depth and stability.', false, null, 4.8, 56),
  ('sv-horizon-x', 'Marg Horizon X', 'men', 'Lifestyle', 7999, 'All-day wearability with a sleek profile.', false, null, 4.5, 88),
  ('sv-dash-pro', 'Marg Dash Pro', 'men', 'Running', 12499, 'Responsive speed for track and tempo days.', true, '2026-07-15', 4.6, 45),
  ('sv-classic-m', 'Marg Classic M', 'men', 'Casual', 6999, 'A timeless design updated for modern comfort.', false, null, 4.3, 130),
  ('sv-impact-trainer', 'Marg Impact Trainer', 'men', 'Training', 10499, 'Absorbs shock during plyometrics and heavy lifts.', false, null, 4.7, 67),
  ('sv-bounce-m', 'Marg Bounce M', 'men', 'Sports', 9499, 'Superior grip and court feel for dynamic players.', false, null, 4.5, 92),
  ('sv-infinity-run', 'Marg Infinity Run', 'men', 'Running', 14999, 'Limitless cushioning for endless miles.', true, '2026-07-20', 4.9, 15),
  ('sv-glide-w', 'Marg Glide W', 'women', 'Running', 11499, 'Plush long-distance ride with adaptive heel cradle.', true, '2026-06-18', 4.9, 211),
  ('sv-luna-runner', 'Marg Luna Runner', 'women', 'Running', 9999, 'Daily miles, redefined. Soft cushioning, springy return.', false, null, 4.6, 98),
  ('sv-zen-flow', 'Marg Zen Flow', 'women', 'Lifestyle', 8499, 'Studio-to-street silhouette with flex-knit upper.', false, null, 4.7, 132),
  ('sv-ember-casual', 'Marg Ember Casual', 'women', 'Casual', 6999, 'Refined everyday classic with sculpted midsole.', false, null, 4.3, 47),
  ('sv-strike-w', 'Marg Strike W', 'women', 'Sports', 9299, 'Multi-surface court grip and dynamic midfoot lockdown.', false, null, 4.5, 58),
  ('sv-aria-pro', 'Marg Aria Pro', 'women', 'Running', 14499, 'Race-tuned women''s flagship. Built for podiums.', true, '2026-06-28', 4.9, 9),
  ('sv-halo-w', 'Marg Halo W', 'women', 'Lifestyle', 7999, 'Sculpted everyday silhouette with cloud-like cushioning.', false, null, 4.6, 84),
  ('sv-aura-street', 'Marg Aura Street', 'women', 'Casual', 8499, 'Streetwear aesthetic with lightweight foam.', false, null, 4.8, 112),
  ('sv-blaze-w', 'Marg Blaze W', 'women', 'Running', 12999, 'Ignite your speed with our lightest racer yet.', true, '2026-07-05', 4.9, 30),
  ('sv-core-trainer', 'Marg Core Trainer', 'women', 'Training', 9999, 'Flat, stable base for perfect form and balance.', false, null, 4.7, 85),
  ('sv-elevate-w', 'Marg Elevate W', 'women', 'Lifestyle', 8999, 'Platform sole for an elevated everyday look.', false, null, 4.5, 44),
  ('sv-pivot-w', 'Marg Pivot W', 'women', 'Sports', 9499, 'Engineered for quick directional changes.', false, null, 4.6, 76),
  ('sv-pulse-pro', 'Marg Pulse Pro', 'women', 'Running', 13499, 'Advanced shock absorption for the longest runs.', true, '2026-07-10', 4.8, 18),
  ('sv-flex-w', 'Marg Flex W', 'women', 'Training', 10499, 'Move naturally with a fully articulated sole.', false, null, 4.7, 90),
  ('sv-chill-w', 'Marg Chill W', 'women', 'Casual', 7499, 'Slip-on ease with sneaker-level support.', false, null, 4.4, 150),
  ('sv-smash-w', 'Marg Smash W', 'women', 'Sports', 10999, 'Premium court performance and ankle stability.', false, null, 4.6, 33),
  ('sv-breeze-run', 'Marg Breeze Run', 'women', 'Running', 11999, 'Maximum airflow engineered mesh upper.', true, '2026-07-22', 4.7, 25),
  ('sv-lounge-w', 'Marg Lounge W', 'women', 'Lifestyle', 6499, 'Unmatched comfort for recovery and relaxation.', false, null, 4.5, 205),
  ('sv-rocket-kids', 'Marg Rocket Kids', 'kids', 'Running', 4999, 'Easy-on, easy-off speed runners for the next generation.', true, '2026-06-22', 4.8, 88),
  ('sv-mini-court', 'Marg Mini Court', 'kids', 'Sports', 4299, 'Durable little court shoes built to keep up with playtime.', false, null, 4.6, 54),
  ('sv-cub-casual', 'Marg Cub Casual', 'kids', 'Casual', 3799, 'Soft, supportive, and unstoppable — everyday kids'' classic.', false, null, 4.5, 39),
  ('sv-spark-k', 'Marg Spark K', 'kids', 'Lifestyle', 3499, 'Light-up sole and grippy outsole for daily adventures.', false, null, 4.4, 31),
  ('sv-bolt-kids', 'Marg Bolt Kids', 'kids', 'Sports', 4599, 'Built for the playground champions of tomorrow.', true, '2026-06-30', 4.7, 18),
  ('sv-zoom-k', 'Marg Zoom K', 'kids', 'Running', 5499, 'Responsive foam for kids who never stop running.', true, '2026-07-02', 4.9, 40),
  ('sv-play-k', 'Marg Play K', 'kids', 'Casual', 3999, 'Velcro straps and scuff-resistant toes.', false, null, 4.6, 65),
  ('sv-jump-k', 'Marg Jump K', 'kids', 'Sports', 4799, 'Ankle support and grip for active playground sports.', false, null, 4.5, 29),
  ('sv-twinkle-k', 'Marg Twinkle K', 'kids', 'Lifestyle', 4299, 'Glitter accents with cloud-soft insoles.', false, null, 4.8, 110),
  ('sv-dash-k', 'Marg Dash K', 'kids', 'Running', 4899, 'Track-ready look with everyday durability.', true, '2026-07-08', 4.7, 55),
  ('sv-buddy-k', 'Marg Buddy K', 'kids', 'Casual', 3599, 'The reliable slip-on for busy mornings.', false, null, 4.4, 85),
  ('sv-star-k', 'Marg Star K', 'kids', 'Lifestyle', 4499, 'Classic retro style sized down for kids.', false, null, 4.6, 72),
  ('sv-turbo-k', 'Marg Turbo K', 'kids', 'Running', 5299, 'Breathable knit upper with high-rebound foam.', true, '2026-07-18', 4.9, 21),
  ('sv-recess-k', 'Marg Recess K', 'kids', 'Sports', 4699, 'Tough enough for any recess game.', false, null, 4.5, 47),
  ('sv-cloud-k', 'Marg Cloud K', 'kids', 'Casual', 4199, 'Pillow-soft steps for growing feet.', false, null, 4.7, 93),
  ('sv-hero-k', 'Marg Hero K', 'kids', 'Training', 4999, 'All-around performance shoe for active youth.', false, null, 4.8, 36)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  sub = excluded.sub,
  price = excluded.price,
  description = excluded.description,
  is_new = excluded.is_new,
  release_date = excluded.release_date,
  rating = excluded.rating,
  reviews = excluded.reviews;

notify pgrst, 'reload schema';
