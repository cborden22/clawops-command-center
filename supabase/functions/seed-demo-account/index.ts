import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-seed-secret",
};

const DEMO_EMAIL = "demo@clawops.com";
const DEMO_PASSWORD = "ClawOpsDemo2026!";
const DEMO_NAME = "Dale Whitfield";

const day = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * day);
const iso = (d: Date) => d.toISOString();
const dateOnly = (d: Date) => d.toISOString().slice(0, 10);

// deterministic pseudo-random so re-seeds look stable
let seedState = 42;
function rnd() {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}
function between(min: number, max: number) {
  return min + rnd() * (max - min);
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function money(n: number) {
  return Math.round(n * 100) / 100;
}
function token() {
  let s = "";
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  for (let i = 0; i < 24; i++) s += chars[Math.floor(rnd() * chars.length)];
  return s;
}

type SB = ReturnType<typeof createClient>;

const OWNED_TABLES = [
  "collection_photos",
  "machine_collections",
  "nayax_transactions",
  "stock_run_history",
  "route_runs",
  "mileage_entries",
  "inventory_balances",
  "inventory_items",
  "inventory_locations",
  "lead_activities",
  "leads",
  "calendar_tasks",
  "expense_budgets",
  "recurring_revenue",
  "revenue_entries",
  "reminder_dismissals",
  "custom_categories",
  "custom_machine_types",
  "vehicles",
  "complimentary_access",
];

async function wipe(admin: SB, userId: string) {
  // child rows that hang off locations / routes / warehouses
  const { data: locs } = await admin.from("locations").select("id").eq("user_id", userId);
  const locIds = (locs ?? []).map((l: { id: string }) => l.id);
  if (locIds.length) {
    const { data: machines } = await admin
      .from("location_machines")
      .select("id")
      .in("location_id", locIds);
    const machineIds = (machines ?? []).map((m: { id: string }) => m.id);
    if (machineIds.length) {
      await admin.from("maintenance_reports").delete().in("machine_id", machineIds);
    }
    await admin.from("commission_summaries").delete().in("location_id", locIds);
    await admin.from("location_agreements").delete().in("location_id", locIds);
    await admin.from("location_machines").delete().in("location_id", locIds);
  }

  const { data: routes } = await admin.from("mileage_routes").select("id").eq("user_id", userId);
  const routeIds = (routes ?? []).map((r: { id: string }) => r.id);
  if (routeIds.length) {
    await admin.from("mileage_route_stops").delete().in("route_id", routeIds);
  }

  for (const t of OWNED_TABLES) {
    await admin.from(t).delete().eq("user_id", userId);
  }
  await admin.from("mileage_routes").delete().eq("user_id", userId);
  await admin.from("locations").delete().eq("user_id", userId);

  const { data: warehouses } = await admin.from("warehouses").select("id").eq("user_id", userId);
  const whIds = (warehouses ?? []).map((w: { id: string }) => w.id);
  if (whIds.length) await admin.from("warehouse_zones").delete().in("warehouse_id", whIds);
  await admin.from("warehouses").delete().eq("user_id", userId);
}

const LOCATIONS = [
  {
    name: "Strike Zone Lanes",
    address: "1234 Kingston Pike, Knoxville, TN 37919",
    contact_person: "Marcy Holloway",
    contact_phone: "(865) 555-0142",
    contact_email: "marcy@strikezonelanes.com",
    commission_rate: 25,
    latitude: 35.9432, longitude: -83.9723,
    restock_day_of_week: 2,
    frequency: 14,
    portal: true,
    notes: "High traffic on league nights (Tue/Thu). Enter through the side service door.",
  },
  {
    name: "Rocky Top Pizza Co.",
    address: "702 Highway 321 N, Lenoir City, TN 37771",
    contact_person: "Tony Belcher",
    contact_phone: "(865) 555-0198",
    contact_email: "tony@rockytoppizza.com",
    commission_rate: 20,
    latitude: 35.8265, longitude: -84.2401,
    restock_day_of_week: 3,
    frequency: 14,
    portal: false,
    notes: "Family night Wednesdays doubles play volume. Manager pays commission by check.",
  },
  {
    name: "Sudsy's Coin Laundry",
    address: "418 Broadway St, Maryville, TN 37804",
    contact_person: "Renee Carter",
    contact_phone: "(865) 555-0177",
    contact_email: "renee.carter@sudsylaundry.net",
    commission_rate: 20,
    latitude: 35.7565, longitude: -83.9705,
    restock_day_of_week: 1,
    frequency: 21,
    portal: false,
    notes: "Quarters only crowd — keep the bulk machine stocked.",
  },
  {
    name: "Regal Riverbend Cinema",
    address: "9450 Parkside Dr, Knoxville, TN 37922",
    contact_person: "Devin Marsh",
    contact_phone: "(865) 555-0113",
    contact_email: "dmarsh@riverbendcinema.com",
    commission_rate: 30,
    latitude: 35.9061, longitude: -84.1533,
    restock_day_of_week: 5,
    frequency: 10,
    portal: false,
    notes: "Lobby placement near concessions. Best weekend in the route.",
  },
  {
    name: "Hilltop IGA Market",
    address: "205 W Race St, Kingston, TN 37763",
    contact_person: "Bill Denton",
    contact_phone: "(865) 555-0166",
    contact_email: "bdenton@hilltopiga.com",
    commission_rate: 20,
    latitude: 35.8792, longitude: -84.5088,
    restock_day_of_week: 4,
    frequency: 28,
    portal: false,
    notes: "Front vestibule. Low volume but zero maintenance.",
  },
  {
    name: "Pilot Travel Center #418",
    address: "1600 Buttermilk Rd, Lenoir City, TN 37771",
    contact_person: "Angela Ruiz",
    contact_phone: "(865) 555-0121",
    contact_email: "angela.ruiz@pilottc418.com",
    commission_rate: 25,
    latitude: 35.8621, longitude: -84.2087,
    restock_day_of_week: 2,
    frequency: 14,
    portal: false,
    notes: "24-hour location. Boxing machine does most of the volume here.",
  },
  {
    name: "Smoky Mountain Fun Center",
    address: "3115 Parkway, Pigeon Forge, TN 37863",
    contact_person: "Jared Whitt",
    contact_phone: "(865) 555-0154",
    contact_email: "jared@smokyfuncenter.com",
    commission_rate: 40,
    latitude: 35.7959, longitude: -83.5637,
    restock_day_of_week: 5,
    frequency: 7,
    portal: false,
    notes: "Tourist season swings hard. Split rate: 40% on the boxing/crane units.",
  },
  {
    name: "Cumberland Inn & Suites",
    address: "880 N Illinois Ave, Oak Ridge, TN 37830",
    contact_person: "Patrice Lyle",
    contact_phone: "(865) 555-0189",
    contact_email: "plyle@cumberlandinnsuites.com",
    commission_rate: 20,
    latitude: 36.0206, longitude: -84.2596,
    restock_day_of_week: 3,
    frequency: 28,
    portal: false,
    notes: "Lobby unit. Ask front desk for the key card to the alcove.",
  },
];

const MACHINE_PLAN: Record<string, Array<{ type: string; label: string; rate: number; cpp: number; win: number }>> = {
  "Strike Zone Lanes": [
    { type: "claw", label: "Big Plush Claw", rate: 25, cpp: 1.0, win: 12 },
    { type: "claw", label: "Licensed Plush Claw", rate: 25, cpp: 1.0, win: 10 },
    { type: "mini_claw", label: "Mini Prize Claw", rate: 25, cpp: 0.5, win: 18 },
    { type: "other", label: "Boxing Champ", rate: 40, cpp: 2.0, win: 0 },
  ],
  "Rocky Top Pizza Co.": [
    { type: "claw", label: "Front Door Claw", rate: 20, cpp: 1.0, win: 12 },
    { type: "mini_claw", label: "Kids Mini Claw", rate: 20, cpp: 0.5, win: 20 },
    { type: "sticker", label: "Sticker Vendor", rate: 20, cpp: 0.5, win: 100 },
  ],
  "Sudsy's Coin Laundry": [
    { type: "bulk", label: "Bulk Capsule Vendor", rate: 20, cpp: 0.5, win: 100 },
    { type: "mini_claw", label: "Laundry Mini Claw", rate: 20, cpp: 0.5, win: 20 },
  ],
  "Regal Riverbend Cinema": [
    { type: "claw", label: "Lobby Plush Claw", rate: 30, cpp: 1.0, win: 11 },
    { type: "claw", label: "Concession Claw", rate: 30, cpp: 1.0, win: 11 },
    { type: "clip", label: "Prize Clip Machine", rate: 30, cpp: 1.0, win: 15 },
  ],
  "Hilltop IGA Market": [
    { type: "bulk", label: "Vestibule Bulk", rate: 20, cpp: 0.5, win: 100 },
    { type: "mini_claw", label: "Grocery Mini Claw", rate: 20, cpp: 0.5, win: 18 },
  ],
  "Pilot Travel Center #418": [
    { type: "other", label: "Boxing Champ II", rate: 40, cpp: 2.0, win: 0 },
    { type: "claw", label: "Truck Stop Claw", rate: 25, cpp: 1.0, win: 12 },
    { type: "clip", label: "Hat & Knife Clip", rate: 25, cpp: 2.0, win: 14 },
  ],
  "Smoky Mountain Fun Center": [
    { type: "claw", label: "Jumbo Crane", rate: 40, cpp: 2.0, win: 8 },
    { type: "claw", label: "Parkway Plush Claw", rate: 40, cpp: 1.0, win: 12 },
    { type: "mini_claw", label: "Souvenir Mini Claw", rate: 25, cpp: 0.5, win: 20 },
    { type: "clip", label: "Watch Clip Machine", rate: 25, cpp: 2.0, win: 12 },
  ],
  "Cumberland Inn & Suites": [
    { type: "claw", label: "Lobby Claw", rate: 20, cpp: 1.0, win: 13 },
  ],
};

const LEADS = [
  { business_name: "Volunteer Bowl & Billiards", city: "Alcoa", status: "new", priority: "hot", contact: "Sam Kirkland", est: 3, rev: 850, source: "Cold walk-in" },
  { business_name: "El Charro Mexican Grill", city: "Farragut", status: "contacted", priority: "warm", contact: "Ana Delgado", est: 2, rev: 500, source: "Referral" },
  { business_name: "Tellico Village Rec Center", city: "Loudon", status: "negotiating", priority: "hot", contact: "Greg Nash", est: 4, rev: 1200, source: "Referral" },
  { business_name: "Waffle House #2211", city: "Lenoir City", status: "contacted", priority: "cold", contact: "Deb Owens", est: 1, rev: 220, source: "Cold call" },
  { business_name: "Clinton Family Skate", city: "Clinton", status: "negotiating", priority: "hot", contact: "Mike Fowler", est: 5, rev: 1600, source: "Trade show" },
  { business_name: "Cedar Bluff Car Wash", city: "Knoxville", status: "new", priority: "cold", contact: "Ray Sizemore", est: 1, rev: 180, source: "Drive-by" },
  { business_name: "Pigeon Forge Pancake House", city: "Pigeon Forge", status: "won", priority: "hot", contact: "Lisa Trent", est: 2, rev: 700, source: "Referral" },
  { business_name: "Oak Ridge Bowling Center", city: "Oak Ridge", status: "contacted", priority: "warm", contact: "Curt Bailey", est: 3, rev: 900, source: "Cold call" },
  { business_name: "Fort Loudoun Marina Store", city: "Lenoir City", status: "lost", priority: "cold", contact: "Hank Pruitt", est: 1, rev: 150, source: "Cold walk-in" },
  { business_name: "Sevier County Laundromat", city: "Sevierville", status: "new", priority: "warm", contact: "Dana Combs", est: 2, rev: 340, source: "Facebook" },
  { business_name: "Rocky Hill Ace Hardware", city: "Knoxville", status: "lost", priority: "cold", contact: "Joel Bratcher", est: 1, rev: 160, source: "Cold call" },
  { business_name: "Harriman Cinema 6", city: "Harriman", status: "negotiating", priority: "warm", contact: "Tasha Greer", est: 3, rev: 780, source: "Referral" },
];

const INVENTORY = [
  { name: "Licensed Plush 8\"", category: "Plush", sku: "PLU-LIC-08", qty: 340, min: 120, pkg: "case", pkgQty: 24, price: 68.5, per: 2.85, supplier: "Sunrise Toys" },
  { name: "Generic Plush 6\"", category: "Plush", sku: "PLU-GEN-06", qty: 620, min: 200, pkg: "case", pkgQty: 48, price: 79.0, per: 1.65, supplier: "Sunrise Toys" },
  { name: "Jumbo Plush 16\"", category: "Plush", sku: "PLU-JMB-16", qty: 84, min: 40, pkg: "case", pkgQty: 12, price: 96.0, per: 8.0, supplier: "A&A Global" },
  { name: "Anime Plush Assortment", category: "Plush", sku: "PLU-ANI-AS", qty: 210, min: 100, pkg: "case", pkgQty: 24, price: 84.0, per: 3.5, supplier: "Sunrise Toys" },
  { name: "Squishmallow Knockoff 10\"", category: "Plush", sku: "PLU-SQU-10", qty: 155, min: 80, pkg: "case", pkgQty: 20, price: 70.0, per: 3.5, supplier: "Prime Prizes" },
  { name: "Bulk Capsules 1\"", category: "Bulk", sku: "BLK-CAP-01", qty: 4200, min: 1500, pkg: "case", pkgQty: 1000, price: 145.0, per: 0.145, supplier: "A&A Global" },
  { name: "Bulk Capsules 2\"", category: "Bulk", sku: "BLK-CAP-02", qty: 1800, min: 800, pkg: "case", pkgQty: 500, price: 165.0, per: 0.33, supplier: "A&A Global" },
  { name: "Sticker Rolls", category: "Bulk", sku: "BLK-STK-RL", qty: 62, min: 24, pkg: "box", pkgQty: 12, price: 42.0, per: 3.5, supplier: "Stamp & Sticker Co." },
  { name: "Bouncy Balls 45mm", category: "Bulk", sku: "BLK-BNC-45", qty: 2400, min: 1000, pkg: "case", pkgQty: 1000, price: 89.0, per: 0.089, supplier: "A&A Global" },
  { name: "Digital Watches", category: "Clip Prizes", sku: "CLP-WTC-01", qty: 190, min: 75, pkg: "box", pkgQty: 50, price: 112.0, per: 2.24, supplier: "Prime Prizes" },
  { name: "Pocket Knives", category: "Clip Prizes", sku: "CLP-KNF-01", qty: 130, min: 60, pkg: "box", pkgQty: 25, price: 98.0, per: 3.92, supplier: "Prime Prizes" },
  { name: "Bluetooth Earbuds", category: "Clip Prizes", sku: "CLP-EAR-01", qty: 74, min: 40, pkg: "box", pkgQty: 20, price: 148.0, per: 7.4, supplier: "Prime Prizes" },
  { name: "Trucker Hats", category: "Clip Prizes", sku: "CLP-HAT-01", qty: 96, min: 48, pkg: "case", pkgQty: 24, price: 86.0, per: 3.58, supplier: "Southern Caps" },
  { name: "Claw Machine Cable", category: "Parts", sku: "PRT-CBL-01", qty: 14, min: 6, pkg: "each", pkgQty: 1, price: 18.5, per: 18.5, supplier: "Coast to Coast" },
  { name: "Claw Assembly (3-prong)", category: "Parts", sku: "PRT-CLW-03", qty: 9, min: 4, pkg: "each", pkgQty: 1, price: 62.0, per: 62.0, supplier: "Coast to Coast" },
  { name: "Coin Comparator", category: "Parts", sku: "PRT-CMP-01", qty: 6, min: 3, pkg: "each", pkgQty: 1, price: 44.0, per: 44.0, supplier: "Coast to Coast" },
  { name: "LED Light Strip 5m", category: "Parts", sku: "PRT-LED-5M", qty: 11, min: 5, pkg: "each", pkgQty: 1, price: 22.0, per: 22.0, supplier: "Amazon Business" },
  { name: "Power Supply 12V", category: "Parts", sku: "PRT-PSU-12", qty: 7, min: 3, pkg: "each", pkgQty: 1, price: 39.0, per: 39.0, supplier: "Coast to Coast" },
  { name: "Door Locks w/ Keys", category: "Parts", sku: "PRT-LCK-01", qty: 22, min: 10, pkg: "box", pkgQty: 10, price: 48.0, per: 4.8, supplier: "Coast to Coast" },
  { name: "Prize Chute Flaps", category: "Parts", sku: "PRT-FLP-01", qty: 15, min: 6, pkg: "each", pkgQty: 1, price: 9.5, per: 9.5, supplier: "Coast to Coast" },
  { name: "Coin Bags", category: "Supplies", sku: "SUP-BAG-01", qty: 180, min: 60, pkg: "box", pkgQty: 100, price: 26.0, per: 0.26, supplier: "Uline" },
  { name: "Coin Wrappers (Quarters)", category: "Supplies", sku: "SUP-WRP-25", qty: 900, min: 300, pkg: "box", pkgQty: 1000, price: 21.0, per: 0.021, supplier: "Uline" },
  { name: "Glass Cleaner", category: "Supplies", sku: "SUP-CLN-01", qty: 18, min: 8, pkg: "each", pkgQty: 1, price: 4.25, per: 4.25, supplier: "Sam's Club" },
  { name: "Microfiber Towels", category: "Supplies", sku: "SUP-TWL-01", qty: 60, min: 24, pkg: "pack", pkgQty: 12, price: 14.0, per: 1.17, supplier: "Sam's Club" },
  { name: "QR Sticker Labels", category: "Supplies", sku: "SUP-QRL-01", qty: 240, min: 100, pkg: "pack", pkgQty: 100, price: 32.0, per: 0.32, supplier: "Avery" },
  { name: "Nitrile Gloves", category: "Supplies", sku: "SUP-GLV-01", qty: 400, min: 200, pkg: "box", pkgQty: 200, price: 19.0, per: 0.095, supplier: "Sam's Club" },
  { name: "Zip Ties 8\"", category: "Supplies", sku: "SUP-ZIP-08", qty: 500, min: 200, pkg: "bag", pkgQty: 500, price: 12.0, per: 0.024, supplier: "Amazon Business" },
  { name: "Padlocks", category: "Supplies", sku: "SUP-PDL-01", qty: 12, min: 6, pkg: "each", pkgQty: 1, price: 11.5, per: 11.5, supplier: "Lowe's" },
  { name: "Dollar Bill Validator", category: "Parts", sku: "PRT-DBV-01", qty: 4, min: 2, pkg: "each", pkgQty: 1, price: 189.0, per: 189.0, supplier: "Coast to Coast" },
  { name: "Marquee Decals", category: "Supplies", sku: "SUP-DCL-01", qty: 28, min: 10, pkg: "pack", pkgQty: 4, price: 36.0, per: 9.0, supplier: "SignsNow" },
];

async function seed(admin: SB, userId: string) {
  await wipe(admin, userId);

  // ---- complimentary access -------------------------------------------------
  await admin.from("complimentary_access").insert({
    user_id: userId,
    granted_by: "ClawOps",
    reason: "Demo account",
    expires_at: null,
  });

  // ---- machine types --------------------------------------------------------
  const machineTypes = [
    { type_key: "claw", label: "Claw Machine" },
    { type_key: "mini_claw", label: "Mini Claw Machine" },
    { type_key: "bulk", label: "Bulk Machine" },
    { type_key: "clip", label: "Clip Machine" },
    { type_key: "sticker", label: "Sticker Machine" },
    { type_key: "other", label: "Boxing / Specialty" },
  ];
  await admin.from("custom_machine_types").insert(
    machineTypes.map((t, i) => ({ user_id: userId, type_key: t.type_key, label: t.label, sort_order: i })),
  );

  await admin.from("custom_categories").insert(
    ["Plush", "Bulk", "Clip Prizes", "Parts", "Supplies"].map((name) => ({ user_id: userId, name })),
  );

  // ---- locations ------------------------------------------------------------
  const locRows = LOCATIONS.map((l, i) => ({
    user_id: userId,
    name: l.name,
    address: l.address,
    contact_person: l.contact_person,
    contact_phone: l.contact_phone,
    contact_email: l.contact_email,
    commission_rate: l.commission_rate,
    notes: l.notes,
    is_active: true,
    slug: l.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    collection_frequency_days: l.frequency,
    last_collection_date: iso(daysAgo(3 + i * 2)),
    restock_day_of_week: l.restock_day_of_week,
    latitude: l.latitude,
    longitude: l.longitude,
    portal_enabled: l.portal,
    portal_token: l.portal ? token() : null,
  }));
  const { data: locations, error: locErr } = await admin.from("locations").insert(locRows).select("id,name,commission_rate");
  if (locErr) throw locErr;
  const locByName = new Map<string, string>();
  for (const l of locations as Array<{ id: string; name: string }>) locByName.set(l.name, l.id);

  // ---- machines -------------------------------------------------------------
  const machineRows: Record<string, unknown>[] = [];
  let unitSeq = 1;
  for (const loc of LOCATIONS) {
    const plan = MACHINE_PLAN[loc.name] ?? [];
    for (const m of plan) {
      machineRows.push({
        location_id: locByName.get(loc.name),
        machine_type: m.type,
        custom_label: m.label,
        count: 1,
        cost_per_play: m.cpp,
        win_probability: m.win,
        unit_code: `U${String(unitSeq++).padStart(3, "0")}`,
        installed_at: dateOnly(daysAgo(Math.floor(between(120, 900)))),
        commission_rate: m.rate,
        is_card_enabled: rnd() > 0.6,
      });
    }
  }
  const { data: machines, error: machErr } = await admin
    .from("location_machines")
    .insert(machineRows)
    .select("id,location_id,custom_label,machine_type,cost_per_play");
  if (machErr) throw machErr;
  type Machine = { id: string; location_id: string; custom_label: string; machine_type: string; cost_per_play: number };
  const machinesByLoc = new Map<string, Machine[]>();
  for (const m of machines as Machine[]) {
    const arr = machinesByLoc.get(m.location_id) ?? [];
    arr.push(m);
    machinesByLoc.set(m.location_id, arr);
  }

  // ---- agreements -----------------------------------------------------------
  await admin.from("location_agreements").insert(
    LOCATIONS.map((l) => ({
      location_id: locByName.get(l.name),
      agreement_date: dateOnly(daysAgo(400)),
      start_date: dateOnly(daysAgo(395)),
      end_date: dateOnly(new Date(now.getTime() + 330 * day)),
      provider_name: "Volunteer Amusements LLC",
      provider_address: "4700 Williams Ferry Rd, Lenoir City, TN 37771",
      provider_contact: "(865) 555-0100",
      payment_type: "revenue_share",
      revenue_share_percentage: l.commission_rate,
      payment_method: "Check",
      notice_period: "30 days",
    })),
  );

  // ---- revenue, expenses, collections --------------------------------------
  const revenueRows: Record<string, unknown>[] = [];
  const collectionSeeds: Array<{ locId: string; machine: Machine; date: Date; gross: number }> = [];

  for (const loc of LOCATIONS) {
    const locId = locByName.get(loc.name)!;
    const mList = machinesByLoc.get(locId) ?? [];
    const cycle = loc.frequency;
    for (let d = 182; d > 0; d -= cycle) {
      const visit = daysAgo(d);
      const seasonal = 1 + 0.25 * Math.sin((visit.getMonth() / 12) * Math.PI * 2);
      let total = 0;
      for (const m of mList) {
        const base = m.machine_type === "bulk" || m.machine_type === "sticker" ? between(25, 70)
          : m.machine_type === "mini_claw" ? between(45, 130)
          : m.machine_type === "other" ? between(90, 260)
          : between(80, 240);
        const gross = money(base * seasonal * (cycle / 14));
        total += gross;
        collectionSeeds.push({ locId, machine: m, date: visit, gross });
      }
      revenueRows.push({
        user_id: userId,
        location_id: locId,
        type: "income",
        amount: money(total),
        category: "Collection",
        notes: `Route collection — ${loc.name}`,
        date: iso(visit),
      });
    }
  }

  // expenses
  const restockNotes = ["Plush restock", "Bulk capsule restock", "Clip prize restock"];
  for (const loc of LOCATIONS) {
    const locId = locByName.get(loc.name)!;
    for (let d = 170; d > 0; d -= 30) {
      revenueRows.push({
        user_id: userId,
        location_id: locId,
        type: "expense",
        amount: money(between(45, 190)),
        category: "Prize Restock",
        notes: pick(restockNotes),
        date: iso(daysAgo(d + Math.floor(between(0, 5)))),
      });
    }
  }
  const businessExpenses = [
    { category: "Vehicle Costs", notes: "Fuel — service van", min: 55, max: 120, every: 10 },
    { category: "Software/Subscriptions", notes: "ClawOps + phone plan", min: 39, max: 79, every: 30 },
    { category: "Insurance", notes: "General liability premium", min: 145, max: 165, every: 30 },
    { category: "Equipment Purchase", notes: "Replacement claw assembly", min: 62, max: 240, every: 60 },
    { category: "Business License/Fees", notes: "County amusement permit", min: 85, max: 120, every: 90 },
    { category: "Marketing", notes: "Referral flyers & decals", min: 30, max: 95, every: 45 },
  ];
  for (const be of businessExpenses) {
    for (let d = 178; d > 0; d -= be.every) {
      revenueRows.push({
        user_id: userId,
        location_id: null,
        type: "expense",
        amount: money(between(be.min, be.max)),
        category: be.category,
        notes: be.notes,
        date: iso(daysAgo(d)),
      });
    }
  }

  const { data: revEntries, error: revErr } = await admin
    .from("revenue_entries")
    .insert(revenueRows)
    .select("id,location_id,date,type");
  if (revErr) throw revErr;

  // machine collections tied to income entries
  const incomeByKey = new Map<string, string>();
  for (const r of (revEntries ?? []) as Array<{ id: string; location_id: string | null; date: string; type: string }>) {
    if (r.type === "income" && r.location_id) incomeByKey.set(`${r.location_id}|${r.date}`, r.id);
  }
  const meterState = new Map<string, number>();
  const collectionRows = collectionSeeds.map((c) => {
    const cpp = c.machine.cost_per_play || 1;
    const plays = Math.max(1, Math.round(c.gross / cpp));
    const start = meterState.get(c.machine.id) ?? Math.floor(between(1000, 9000));
    const end = start + plays;
    meterState.set(c.machine.id, end);
    return {
      user_id: userId,
      location_id: c.locId,
      machine_id: c.machine.id,
      revenue_entry_id: incomeByKey.get(`${c.locId}|${iso(c.date)}`) ?? null,
      collection_date: iso(c.date),
      coins_inserted: plays,
      prizes_won: Math.max(0, Math.round(plays * between(0.06, 0.2))),
      meter_reading_start: start,
      meter_reading_end: end,
      bag_label: `BAG-${c.machine.id.slice(0, 4).toUpperCase()}`,
    };
  });
  for (let i = 0; i < collectionRows.length; i += 400) {
    const { error } = await admin.from("machine_collections").insert(collectionRows.slice(i, i + 400));
    if (error) throw error;
  }

  // ---- commission summaries -------------------------------------------------
  const summaryRows: Record<string, unknown>[] = [];
  for (const loc of LOCATIONS) {
    const locId = locByName.get(loc.name)!;
    const machineCount = (machinesByLoc.get(locId) ?? []).length;
    for (let mAgo = 4; mAgo >= 1; mAgo--) {
      const end = new Date(now.getFullYear(), now.getMonth() - mAgo + 1, 0);
      const start = new Date(now.getFullYear(), now.getMonth() - mAgo, 1);
      const revenue = money(between(320, 1650));
      const pct = loc.commission_rate;
      const paid = mAgo > 1;
      summaryRows.push({
        location_id: locId,
        start_date: dateOnly(start),
        end_date: dateOnly(end),
        total_revenue: revenue,
        commission_percentage: pct,
        commission_amount: money((revenue * pct) / 100),
        machine_count: machineCount,
        commission_paid: paid,
        commission_paid_at: paid ? iso(new Date(end.getTime() + 5 * day)) : null,
        notes: paid ? "Paid by check" : "Pending payment",
      });
    }
  }
  const { error: sumErr } = await admin.from("commission_summaries").insert(summaryRows);
  if (sumErr) throw sumErr;

  // ---- leads ----------------------------------------------------------------
  const leadRows = LEADS.map((l, i) => ({
    user_id: userId,
    business_name: l.business_name,
    address: `${100 + i * 37} Main St, ${l.city}, TN`,
    contact_name: l.contact,
    contact_phone: `(865) 555-0${200 + i}`,
    contact_email: `${l.contact.split(" ")[0].toLowerCase()}@${l.business_name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 14)}.com`,
    status: l.status,
    priority: l.priority,
    estimated_machines: l.est,
    estimated_revenue: l.rev,
    source: l.source,
    next_follow_up:
      l.status === "won" || l.status === "lost" ? null : iso(new Date(now.getTime() + Math.floor(between(-3, 21)) * day)),
    target_install_date:
      l.status === "negotiating" || l.status === "won" ? dateOnly(new Date(now.getTime() + Math.floor(between(5, 45)) * day)) : null,
    notes: `Spoke with ${l.contact}. ${l.est} machine${l.est > 1 ? "s" : ""} estimated, roughly $${l.rev}/mo gross.`,
  }));
  const { data: leads, error: leadErr } = await admin.from("leads").insert(leadRows).select("id,business_name,status");
  if (leadErr) throw leadErr;

  const activityTemplates: Record<string, string[]> = {
    call: ["Cold call — reached the manager, asked for a callback next week.", "Follow-up call, owner is interested in a 2-machine trial.", "Called to confirm placement measurements."],
    email: ["Emailed the standard revenue-share agreement.", "Sent photos of similar placements at other venues.", "Emailed a recap of our phone call."],
    visit: ["Stopped by and measured the entry alcove.", "Site visit — power outlet available near the front door.", "Dropped off a sample prize display."],
    note: ["Owner wants to revisit after the holidays.", "Competitor already has one machine here.", "Decision maker is the district manager, not the store manager."],
  };
  const activityRows: Record<string, unknown>[] = [];
  for (const lead of (leads ?? []) as Array<{ id: string; status: string }>) {
    const count = lead.status === "new" ? 1 : lead.status === "contacted" ? 2 : 4;
    for (let i = 0; i < count; i++) {
      const type = pick(["call", "email", "visit", "note"]);
      activityRows.push({
        lead_id: lead.id,
        user_id: userId,
        activity_type: type,
        description: pick(activityTemplates[type]),
        created_at: iso(daysAgo(Math.floor(between(1, 90)))),
      });
    }
  }
  await admin.from("lead_activities").insert(activityRows);

  // ---- warehouse, zones, inventory -----------------------------------------
  const { data: warehouse, error: whErr } = await admin
    .from("warehouses")
    .insert({
      user_id: userId,
      name: "Lenoir City Shop",
      address: "4700 Williams Ferry Rd",
      city: "Lenoir City",
      state: "TN",
      zip: "37771",
      is_default: true,
      notes: "Main storage — prizes on the left racks, parts in the back.",
    })
    .select("id")
    .single();
  if (whErr) throw whErr;
  const warehouseId = (warehouse as { id: string }).id;

  const { data: zones, error: zoneErr } = await admin
    .from("warehouse_zones")
    .insert([
      { warehouse_id: warehouseId, name: "Plush Racks A-C", zone_type: "shelf", notes: "Bagged plush by size" },
      { warehouse_id: warehouseId, name: "Bulk Totes", zone_type: "tote", notes: "Capsules and bouncy balls" },
      { warehouse_id: warehouseId, name: "Parts Bin", zone_type: "bin", notes: "Claws, cables, comparators" },
      { warehouse_id: warehouseId, name: "Van Load-Out", zone_type: "section", notes: "Staged for the next route" },
    ])
    .select("id,name");
  if (zoneErr) throw zoneErr;
  const zoneByName = new Map((zones as Array<{ id: string; name: string }>).map((z) => [z.name, z.id]));
  const zoneFor = (cat: string) =>
    cat === "Plush" ? zoneByName.get("Plush Racks A-C")
    : cat === "Bulk" ? zoneByName.get("Bulk Totes")
    : cat === "Parts" ? zoneByName.get("Parts Bin")
    : zoneByName.get("Van Load-Out");

  await admin.from("inventory_items").insert(
    INVENTORY.map((it) => ({
      user_id: userId,
      name: it.name,
      category: it.category,
      sku: it.sku,
      quantity: it.qty,
      min_stock: it.min,
      location: "Lenoir City Shop",
      package_type: it.pkg,
      package_quantity: it.pkgQty,
      last_price: it.price,
      price_per_item: it.per,
      supplier_name: it.supplier,
      warehouse_id: warehouseId,
      zone_id: zoneFor(it.category),
      active: true,
      last_updated: iso(daysAgo(Math.floor(between(1, 45)))),
    })),
  );

  const { data: invItems } = await admin.from("inventory_items").select("id,name,quantity").eq("user_id", userId);
  const stockRuns: Record<string, unknown>[] = [];
  for (let r = 0; r < 6; r++) {
    const picked = (invItems ?? []).slice(r * 3, r * 3 + 5) as Array<{ id: string; name: string }>;
    const items = picked.map((p) => ({ id: p.id, name: p.name, quantity: Math.floor(between(4, 40)) }));
    stockRuns.push({
      user_id: userId,
      run_date: iso(daysAgo(7 + r * 14)),
      total_items: items.reduce((s, i) => s + i.quantity, 0),
      total_products: items.length,
      items,
    });
  }
  await admin.from("stock_run_history").insert(stockRuns);

  // ---- vehicles, routes, mileage -------------------------------------------
  const { data: vehicle, error: vehErr } = await admin
    .from("vehicles")
    .insert({
      user_id: userId,
      name: "Service Van",
      year: 2019,
      make: "Ford",
      model: "Transit 250",
      license_plate: "TN 4H2-8815",
      last_recorded_odometer: 118450,
    })
    .select("id")
    .single();
  if (vehErr) throw vehErr;
  const vehicleId = (vehicle as { id: string }).id;

  const routePlans = [
    { name: "West Knox Loop", desc: "Kingston Pike / Parkside corridor", stops: ["Strike Zone Lanes", "Regal Riverbend Cinema", "Sudsy's Coin Laundry"], miles: 62, freq: 14, dow: 2 },
    { name: "Lenoir City & River Route", desc: "Highway 321 south run", stops: ["Rocky Top Pizza Co.", "Pilot Travel Center #418", "Hilltop IGA Market"], miles: 78, freq: 14, dow: 3 },
    { name: "Sevier County Tourist Run", desc: "Pigeon Forge & Oak Ridge overflow", stops: ["Smoky Mountain Fun Center", "Cumberland Inn & Suites"], miles: 141, freq: 7, dow: 5 },
  ];
  const routeIdByName = new Map<string, string>();
  for (const rp of routePlans) {
    const { data: route, error: rErr } = await admin
      .from("mileage_routes")
      .insert({
        user_id: userId,
        name: rp.name,
        description: rp.desc,
        total_miles: rp.miles,
        is_round_trip: true,
        schedule_frequency_days: rp.freq,
        schedule_day_of_week: rp.dow,
        next_scheduled_date: dateOnly(new Date(now.getTime() + Math.floor(between(1, 9)) * day)),
      })
      .select("id")
      .single();
    if (rErr) throw rErr;
    const routeId = (route as { id: string }).id;
    routeIdByName.set(rp.name, routeId);
    await admin.from("mileage_route_stops").insert(
      rp.stops.map((s, i) => ({
        route_id: routeId,
        location_id: locByName.get(s),
        stop_order: i,
        miles_from_previous: money(between(8, 34)),
        notes: i === 0 ? "Depart from the shop" : null,
      })),
    );
  }

  const mileageRows: Record<string, unknown>[] = [];
  let odo = 118450;
  for (let d = 175; d > 0; d -= 7) {
    const rp = routePlans[Math.floor(between(0, routePlans.length))];
    const miles = money(rp.miles * between(0.9, 1.1));
    const start = odo - miles;
    mileageRows.push({
      user_id: userId,
      date: iso(daysAgo(d)),
      start_location: "Lenoir City Shop",
      end_location: rp.stops[rp.stops.length - 1],
      miles,
      purpose: `${rp.name} service run`,
      is_round_trip: true,
      vehicle_id: vehicleId,
      route_id: routeIdByName.get(rp.name),
      odometer_start: money(start),
      odometer_end: money(odo),
      status: "completed",
      tracking_mode: "odometer",
      completed_at: iso(daysAgo(d)),
    });
    odo = money(start - between(3, 20));
  }
  mileageRows.reverse();
  await admin.from("mileage_entries").insert(mileageRows);

  // ---- maintenance ----------------------------------------------------------
  const allMachines = machines as Machine[];
  const maintenance = [
    { issue_type: "Claw not gripping", description: "Claw strength dropped off, customers complaining it never closes.", severity: "high", status: "open" },
    { issue_type: "Coin jam", description: "Coin mech jamming on quarters. Comparator likely needs replacing.", severity: "medium", status: "in_progress" },
    { issue_type: "Lights out", description: "Marquee LED strip is dead on the right side.", severity: "low", status: "open" },
    { issue_type: "Prize chute stuck", description: "Prize door flap sticking, prizes hanging up in the chute.", severity: "medium", status: "resolved" },
    { issue_type: "Screen flickering", description: "Attract screen flickers intermittently after an hour of runtime.", severity: "low", status: "resolved" },
    { issue_type: "Card reader offline", description: "Card reader shows no signal — venue reports card declines.", severity: "high", status: "in_progress" },
    { issue_type: "Door lock broken", description: "Service door lock will not catch, machine cannot be secured.", severity: "high", status: "resolved" },
  ];
  await admin.from("maintenance_reports").insert(
    maintenance.map((m, i) => {
      const machine = allMachines[i % allMachines.length];
      const created = daysAgo(Math.floor(between(2, 70)));
      return {
        machine_id: machine.id,
        user_id: userId,
        reporter_name: pick(["Venue staff", "Route tech", "Dale Whitfield", "Customer report"]),
        reporter_contact: "(865) 555-0100",
        issue_type: m.issue_type,
        description: m.description,
        severity: m.severity,
        status: m.status,
        created_at: iso(created),
        resolved_at: m.status === "resolved" ? iso(new Date(created.getTime() + 3 * day)) : null,
        resolution_notes: m.status === "resolved" ? "Part swapped on the next route stop, tested 10 plays." : null,
      };
    }),
  );

  // ---- calendar, budgets, recurring revenue --------------------------------
  await admin.from("calendar_tasks").insert([
    { user_id: userId, title: "Restock Smoky Mountain Fun Center", description: "Heavy plush load — jumbo crane is running low.", task_date: dateOnly(new Date(now.getTime() + 1 * day)), task_type: "restock", completed: false },
    { user_id: userId, title: "Collect West Knox Loop", description: "Three stops, bring extra coin bags.", task_date: dateOnly(new Date(now.getTime() + 2 * day)), task_type: "collection", completed: false },
    { user_id: userId, title: "Install 2 machines — Pigeon Forge Pancake House", description: "New win. Bring mounting hardware and QR stickers.", task_date: dateOnly(new Date(now.getTime() + 6 * day)), task_type: "install", completed: false },
    { user_id: userId, title: "Follow up: Tellico Village Rec Center", description: "Greg asked for a call back with a 4-machine quote.", task_date: dateOnly(new Date(now.getTime() + 3 * day)), task_type: "reminder", completed: false },
    { user_id: userId, title: "Pay commissions for last month", description: "Print statements and mail checks.", task_date: dateOnly(new Date(now.getTime() + 4 * day)), task_type: "reminder", completed: false },
    { user_id: userId, title: "Replace claw assembly at Strike Zone", description: "High severity ticket open.", task_date: dateOnly(new Date(now.getTime() + 1 * day)), task_type: "maintenance", completed: false },
    { user_id: userId, title: "Order plush case restock", description: "Sunrise Toys — 4 cases licensed plush.", task_date: dateOnly(daysAgo(4)), task_type: "reminder", completed: true },
    { user_id: userId, title: "Quarterly permit renewal", description: "Loudon County amusement permit.", task_date: dateOnly(daysAgo(12)), task_type: "reminder", completed: true },
  ]);

  await admin.from("expense_budgets").insert([
    { user_id: userId, category: "Prize Restock", monthly_budget: 1200 },
    { user_id: userId, category: "Vehicle Costs", monthly_budget: 450 },
    { user_id: userId, category: "Maintenance", monthly_budget: 300 },
    { user_id: userId, category: "Software/Subscriptions", monthly_budget: 90 },
    { user_id: userId, category: "Insurance", monthly_budget: 160 },
    { user_id: userId, category: "Marketing", monthly_budget: 150 },
  ]);

  await admin.from("recurring_revenue").insert([
    {
      user_id: userId,
      location_id: locByName.get("Cumberland Inn & Suites"),
      amount: 150,
      frequency: "monthly",
      category: "Flat Fee Placement",
      next_due_date: dateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 5)),
      is_active: true,
      notes: "Flat monthly placement fee instead of revenue share.",
    },
    {
      user_id: userId,
      location_id: locByName.get("Pilot Travel Center #418"),
      amount: 90,
      frequency: "monthly",
      category: "Flat Fee Placement",
      next_due_date: dateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 12)),
      is_active: true,
      notes: "Boxing machine minimum guarantee.",
    },
  ]);

  return {
    locations: LOCATIONS.length,
    machines: machineRows.length,
    revenue_entries: revenueRows.length,
    machine_collections: collectionRows.length,
    commission_summaries: summaryRows.length,
    leads: LEADS.length,
    inventory_items: INVENTORY.length,
    mileage_entries: mileageRows.length,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secret = Deno.env.get("DEMO_SEED_SECRET");
    if (!secret || req.headers.get("x-seed-secret") !== secret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    // find or create the demo auth user
    let userId: string | null = null;
    let page = 1;
    while (page <= 20 && !userId) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const found = data.users.find((u) => u.email?.toLowerCase() === DEMO_EMAIL);
      if (found) userId = found.id;
      if (data.users.length < 200) break;
      page++;
    }

    if (userId) {
      await admin.auth.admin.updateUserById(userId, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: DEMO_NAME },
      });
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: DEMO_NAME },
      });
      if (error) throw error;
      userId = data.user.id;
    }

    const stats = await seed(admin, userId!);

    return new Response(JSON.stringify({ ok: true, email: DEMO_EMAIL, user_id: userId, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("seed-demo-account failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
