export type Category = "men" | "women" | "kids";
export type SubCategory = "Running" | "Casual" | "Sports" | "Lifestyle" | "Training";

export interface Product {
  id: string;
  name: string;
  category: Category;
  sub: SubCategory;
  price: number;
  colors: { name: string; hex: string }[];
  sizes: number[];
  isNew?: boolean;
  releaseDate?: string;
  rating: number;
  reviews: number;
  description: string;
}

const C = {
  blackOrange: [
    { name: "Volt Orange", hex: "#ff6a00" },
    { name: "Stealth Black", hex: "#111111" },
    { name: "Arctic White", hex: "#f5f5f5" },
  ],
  blueWhite: [
    { name: "Electric Blue", hex: "#1f7aff" },
    { name: "Pure White", hex: "#fafafa" },
    { name: "Carbon", hex: "#222222" },
  ],
  pinkBlush: [
    { name: "Blush Pink", hex: "#ff5a8a" },
    { name: "Ivory", hex: "#f3ead8" },
    { name: "Midnight", hex: "#1a1a2e" },
  ],
};

const mensSizes = [7, 8, 9, 10, 11, 12];
const womensSizes = [5, 6, 7, 8, 9, 10];
const kidsSizes = [1, 2, 3, 4, 5, 6];

export const products: Product[] = [
  // men (18)
  { id: "sv-velocity-x", name: "Marg Velocity X", category: "men", sub: "Running", price: 12999, colors: C.blackOrange, sizes: mensSizes, isNew: true, releaseDate: "2026-06-15", rating: 4.8, reviews: 142, description: "Lightweight carbon-plated runner engineered for speed. Energy-return foam delivers explosive takeoff on every stride." },
  { id: "sv-aero-pulse", name: "Marg Aero Pulse", category: "men", sub: "Running", price: 10499, colors: C.blueWhite, sizes: mensSizes, rating: 4.6, reviews: 89, description: "Daily training shoe with breathable engineered mesh and responsive midsole." },
  { id: "sv-court-pro", name: "Marg Court Pro", category: "men", sub: "Sports", price: 8999, colors: C.blackOrange, sizes: mensSizes, rating: 4.5, reviews: 64, description: "Multi-court traction with lateral support for explosive cuts." },
  { id: "sv-urban-low", name: "Marg Urban Low", category: "men", sub: "Casual", price: 7499, colors: C.blueWhite, sizes: mensSizes, rating: 4.4, reviews: 51, description: "Minimalist everyday silhouette in premium leather." },
  { id: "sv-flux-trainer", name: "Marg Flux Trainer", category: "men", sub: "Training", price: 9499, colors: C.blackOrange, sizes: mensSizes, isNew: true, releaseDate: "2026-06-20", rating: 4.7, reviews: 73, description: "Stability-tuned trainer for HIIT, lifting, and cross-training." },
  { id: "sv-phantom-elite", name: "Marg Phantom Elite", category: "men", sub: "Running", price: 15999, colors: C.blackOrange, sizes: mensSizes, isNew: true, releaseDate: "2026-06-25", rating: 5.0, reviews: 12, description: "Flagship race-day shoe. Full-length carbon plate, ultra-light superfoam." },
  { id: "sv-nova-low", name: "Marg Nova Low", category: "men", sub: "Lifestyle", price: 8299, colors: C.blueWhite, sizes: mensSizes, rating: 4.5, reviews: 76, description: "Heritage runner-inspired silhouette, modernized." },
  { id: "sv-drift-trainer", name: "Marg Drift Trainer", category: "men", sub: "Training", price: 10999, colors: C.blueWhite, sizes: mensSizes, rating: 4.6, reviews: 62, description: "Gym-to-street trainer with stable wide base." },
  { id: "sv-apex-street", name: "Marg Apex Street", category: "men", sub: "Casual", price: 8999, colors: C.blackOrange, sizes: mensSizes, rating: 4.4, reviews: 34, description: "Urban street style meets high-performance comfort." },
  { id: "sv-quantum-run", name: "Marg Quantum Run", category: "men", sub: "Running", price: 13999, colors: C.blueWhite, sizes: mensSizes, isNew: true, releaseDate: "2026-07-01", rating: 4.9, reviews: 22, description: "Propulsive feel for long distances and marathons." },
  { id: "sv-titan-court", name: "Marg Titan Court", category: "men", sub: "Sports", price: 9999, colors: C.blackOrange, sizes: mensSizes, rating: 4.7, reviews: 110, description: "Heavy-duty court protection with pivot points." },
  { id: "sv-hyper-lift", name: "Marg Hyper Lift", category: "men", sub: "Training", price: 11499, colors: C.pinkBlush, sizes: mensSizes, rating: 4.8, reviews: 56, description: "Elevated heel for maximum squat depth and stability." },
  { id: "sv-horizon-x", name: "Marg Horizon X", category: "men", sub: "Lifestyle", price: 7999, colors: C.blueWhite, sizes: mensSizes, rating: 4.5, reviews: 88, description: "All-day wearability with a sleek profile." },
  { id: "sv-dash-pro", name: "Marg Dash Pro", category: "men", sub: "Running", price: 12499, colors: C.blackOrange, sizes: mensSizes, isNew: true, releaseDate: "2026-07-15", rating: 4.6, reviews: 45, description: "Responsive speed for track and tempo days." },
  { id: "sv-classic-m", name: "Marg Classic M", category: "men", sub: "Casual", price: 6999, colors: C.blueWhite, sizes: mensSizes, rating: 4.3, reviews: 130, description: "A timeless design updated for modern comfort." },
  { id: "sv-impact-trainer", name: "Marg Impact Trainer", category: "men", sub: "Training", price: 10499, colors: C.blackOrange, sizes: mensSizes, rating: 4.7, reviews: 67, description: "Absorbs shock during plyometrics and heavy lifts." },
  { id: "sv-bounce-m", name: "Marg Bounce M", category: "men", sub: "Sports", price: 9499, colors: C.pinkBlush, sizes: mensSizes, rating: 4.5, reviews: 92, description: "Superior grip and court feel for dynamic players." },
  { id: "sv-infinity-run", name: "Marg Infinity Run", category: "men", sub: "Running", price: 14999, colors: C.blueWhite, sizes: mensSizes, isNew: true, releaseDate: "2026-07-20", rating: 4.9, reviews: 15, description: "Limitless cushioning for endless miles." },

  // women (18)
  { id: "sv-glide-w", name: "Marg Glide W", category: "women", sub: "Running", price: 11499, colors: C.pinkBlush, sizes: womensSizes, isNew: true, releaseDate: "2026-06-18", rating: 4.9, reviews: 211, description: "Plush long-distance ride with adaptive heel cradle." },
  { id: "sv-luna-runner", name: "Marg Luna Runner", category: "women", sub: "Running", price: 9999, colors: C.blueWhite, sizes: womensSizes, rating: 4.6, reviews: 98, description: "Daily miles, redefined. Soft cushioning, springy return." },
  { id: "sv-zen-flow", name: "Marg Zen Flow", category: "women", sub: "Lifestyle", price: 8499, colors: C.pinkBlush, sizes: womensSizes, rating: 4.7, reviews: 132, description: "Studio-to-street silhouette with flex-knit upper." },
  { id: "sv-ember-casual", name: "Marg Ember Casual", category: "women", sub: "Casual", price: 6999, colors: C.blackOrange, sizes: womensSizes, rating: 4.3, reviews: 47, description: "Refined everyday classic with sculpted midsole." },
  { id: "sv-strike-w", name: "Marg Strike W", category: "women", sub: "Sports", price: 9299, colors: C.blueWhite, sizes: womensSizes, rating: 4.5, reviews: 58, description: "Multi-surface court grip and dynamic midfoot lockdown." },
  { id: "sv-aria-pro", name: "Marg Aria Pro", category: "women", sub: "Running", price: 14499, colors: C.pinkBlush, sizes: womensSizes, isNew: true, releaseDate: "2026-06-28", rating: 4.9, reviews: 9, description: "Race-tuned women's flagship. Built for podiums." },
  { id: "sv-halo-w", name: "Marg Halo W", category: "women", sub: "Lifestyle", price: 7999, colors: C.pinkBlush, sizes: womensSizes, rating: 4.6, reviews: 84, description: "Sculpted everyday silhouette with cloud-like cushioning." },
  { id: "sv-aura-street", name: "Marg Aura Street", category: "women", sub: "Casual", price: 8499, colors: C.pinkBlush, sizes: womensSizes, rating: 4.8, reviews: 112, description: "Streetwear aesthetic with lightweight foam." },
  { id: "sv-blaze-w", name: "Marg Blaze W", category: "women", sub: "Running", price: 12999, colors: C.blackOrange, sizes: womensSizes, isNew: true, releaseDate: "2026-07-05", rating: 4.9, reviews: 30, description: "Ignite your speed with our lightest racer yet." },
  { id: "sv-core-trainer", name: "Marg Core Trainer", category: "women", sub: "Training", price: 9999, colors: C.blueWhite, sizes: womensSizes, rating: 4.7, reviews: 85, description: "Flat, stable base for perfect form and balance." },
  { id: "sv-elevate-w", name: "Marg Elevate W", category: "women", sub: "Lifestyle", price: 8999, colors: C.pinkBlush, sizes: womensSizes, rating: 4.5, reviews: 44, description: "Platform sole for an elevated everyday look." },
  { id: "sv-pivot-w", name: "Marg Pivot W", category: "women", sub: "Sports", price: 9499, colors: C.blackOrange, sizes: womensSizes, rating: 4.6, reviews: 76, description: "Engineered for quick directional changes." },
  { id: "sv-pulse-pro", name: "Marg Pulse Pro", category: "women", sub: "Running", price: 13499, colors: C.blueWhite, sizes: womensSizes, isNew: true, releaseDate: "2026-07-10", rating: 4.8, reviews: 18, description: "Advanced shock absorption for the longest runs." },
  { id: "sv-flex-w", name: "Marg Flex W", category: "women", sub: "Training", price: 10499, colors: C.pinkBlush, sizes: womensSizes, rating: 4.7, reviews: 90, description: "Move naturally with a fully articulated sole." },
  { id: "sv-chill-w", name: "Marg Chill W", category: "women", sub: "Casual", price: 7499, colors: C.blueWhite, sizes: womensSizes, rating: 4.4, reviews: 150, description: "Slip-on ease with sneaker-level support." },
  { id: "sv-smash-w", name: "Marg Smash W", category: "women", sub: "Sports", price: 10999, colors: C.blackOrange, sizes: womensSizes, rating: 4.6, reviews: 33, description: "Premium court performance and ankle stability." },
  { id: "sv-breeze-run", name: "Marg Breeze Run", category: "women", sub: "Running", price: 11999, colors: C.pinkBlush, sizes: womensSizes, isNew: true, releaseDate: "2026-07-22", rating: 4.7, reviews: 25, description: "Maximum airflow engineered mesh upper." },
  { id: "sv-lounge-w", name: "Marg Lounge W", category: "women", sub: "Lifestyle", price: 6499, colors: C.blueWhite, sizes: womensSizes, rating: 4.5, reviews: 205, description: "Unmatched comfort for recovery and relaxation." },

  // kids (16)
  { id: "sv-rocket-kids", name: "Marg Rocket Kids", category: "kids", sub: "Running", price: 4999, colors: C.blackOrange, sizes: kidsSizes, isNew: true, releaseDate: "2026-06-22", rating: 4.8, reviews: 88, description: "Easy-on, easy-off speed runners for the next generation." },
  { id: "sv-mini-court", name: "Marg Mini Court", category: "kids", sub: "Sports", price: 4299, colors: C.blueWhite, sizes: kidsSizes, rating: 4.6, reviews: 54, description: "Durable little court shoes built to keep up with playtime." },
  { id: "sv-cub-casual", name: "Marg Cub Casual", category: "kids", sub: "Casual", price: 3799, colors: C.pinkBlush, sizes: kidsSizes, rating: 4.5, reviews: 39, description: "Soft, supportive, and unstoppable — everyday kids' classic." },
  { id: "sv-spark-k", name: "Marg Spark K", category: "kids", sub: "Lifestyle", price: 3499, colors: C.blackOrange, sizes: kidsSizes, rating: 4.4, reviews: 31, description: "Light-up sole and grippy outsole for daily adventures." },
  { id: "sv-bolt-kids", name: "Marg Bolt Kids", category: "kids", sub: "Sports", price: 4599, colors: C.blackOrange, sizes: kidsSizes, isNew: true, releaseDate: "2026-06-30", rating: 4.7, reviews: 18, description: "Built for the playground champions of tomorrow." },
  { id: "sv-zoom-k", name: "Marg Zoom K", category: "kids", sub: "Running", price: 5499, colors: C.blueWhite, sizes: kidsSizes, isNew: true, releaseDate: "2026-07-02", rating: 4.9, reviews: 40, description: "Responsive foam for kids who never stop running." },
  { id: "sv-play-k", name: "Marg Play K", category: "kids", sub: "Casual", price: 3999, colors: C.pinkBlush, sizes: kidsSizes, rating: 4.6, reviews: 65, description: "Velcro straps and scuff-resistant toes." },
  { id: "sv-jump-k", name: "Marg Jump K", category: "kids", sub: "Sports", price: 4799, colors: C.blackOrange, sizes: kidsSizes, rating: 4.5, reviews: 29, description: "Ankle support and grip for active playground sports." },
  { id: "sv-twinkle-k", name: "Marg Twinkle K", category: "kids", sub: "Lifestyle", price: 4299, colors: C.pinkBlush, sizes: kidsSizes, rating: 4.8, reviews: 110, description: "Glitter accents with cloud-soft insoles." },
  { id: "sv-dash-k", name: "Marg Dash K", category: "kids", sub: "Running", price: 4899, colors: C.blackOrange, sizes: kidsSizes, isNew: true, releaseDate: "2026-07-08", rating: 4.7, reviews: 55, description: "Track-ready look with everyday durability." },
  { id: "sv-buddy-k", name: "Marg Buddy K", category: "kids", sub: "Casual", price: 3599, colors: C.blueWhite, sizes: kidsSizes, rating: 4.4, reviews: 85, description: "The reliable slip-on for busy mornings." },
  { id: "sv-star-k", name: "Marg Star K", category: "kids", sub: "Lifestyle", price: 4499, colors: C.blueWhite, sizes: kidsSizes, rating: 4.6, reviews: 72, description: "Classic retro style sized down for kids." },
  { id: "sv-turbo-k", name: "Marg Turbo K", category: "kids", sub: "Running", price: 5299, colors: C.pinkBlush, sizes: kidsSizes, isNew: true, releaseDate: "2026-07-18", rating: 4.9, reviews: 21, description: "Breathable knit upper with high-rebound foam." },
  { id: "sv-recess-k", name: "Marg Recess K", category: "kids", sub: "Sports", price: 4699, colors: C.blackOrange, sizes: kidsSizes, rating: 4.5, reviews: 47, description: "Tough enough for any recess game." },
  { id: "sv-cloud-k", name: "Marg Cloud K", category: "kids", sub: "Casual", price: 4199, colors: C.pinkBlush, sizes: kidsSizes, rating: 4.7, reviews: 93, description: "Pillow-soft steps for growing feet." },
  { id: "sv-hero-k", name: "Marg Hero K", category: "kids", sub: "Training", price: 4999, colors: C.blueWhite, sizes: kidsSizes, rating: 4.8, reviews: 36, description: "All-around performance shoe for active youth." }
];

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}
