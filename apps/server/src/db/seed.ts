/**
 * Seeds the database with ~250 realistic dummy devices and their warranty
 * timelines. Run with `pnpm db:seed` (clears existing device data first).
 */
import { faker } from "@faker-js/faker";
import { db } from "./index";
import * as schema from "./schema";

// Deterministic output so re-seeds and demos look consistent.
faker.seed(42);

type CategorySpec = {
  category: string;
  brands: Record<string, string[]>; // brand -> model names
  priceRange: [number, number];
  warrantyMonths: number[];
};

const CATALOG: CategorySpec[] = [
  {
    category: "Laptop",
    brands: {
      Apple: ['MacBook Pro 14"', 'MacBook Pro 16"', "MacBook Air M3"],
      Dell: ["XPS 13", "XPS 15", "Latitude 7440"],
      Lenovo: ["ThinkPad X1 Carbon", "ThinkPad T14", "Yoga Slim 7"],
      HP: ["Spectre x360", "EliteBook 840", "Pavilion 15"],
      Asus: ["ZenBook 14", "ROG Zephyrus G14"],
    },
    priceRange: [999, 4200],
    warrantyMonths: [12, 24, 36],
  },
  {
    category: "Phone",
    brands: {
      Apple: ["iPhone 15 Pro", "iPhone 15", "iPhone 14"],
      Samsung: ["Galaxy S24 Ultra", "Galaxy S23", "Galaxy A55"],
      Google: ["Pixel 8 Pro", "Pixel 8", "Pixel 7a"],
      OnePlus: ["OnePlus 12", "OnePlus Nord 3"],
    },
    priceRange: [499, 2400],
    warrantyMonths: [12, 24],
  },
  {
    category: "TV",
    brands: {
      Sony: ["Bravia XR A95L", "Bravia X90L"],
      LG: ["OLED evo C4", "OLED B3", "QNED 80"],
      Samsung: ["QLED Q80C", 'Neo QLED QN90C', "The Frame"],
      TCL: ["C845 Mini LED", "C745 QLED"],
    },
    priceRange: [699, 5500],
    warrantyMonths: [12, 24, 36, 60],
  },
  {
    category: "Tablet",
    brands: {
      Apple: ['iPad Pro 12.9"', "iPad Air", "iPad mini"],
      Samsung: ["Galaxy Tab S9", "Galaxy Tab A9"],
      Microsoft: ["Surface Pro 9", "Surface Go 4"],
    },
    priceRange: [399, 2600],
    warrantyMonths: [12, 24],
  },
  {
    category: "Headphones",
    brands: {
      Sony: ["WH-1000XM5", "WF-1000XM5"],
      Bose: ["QuietComfort Ultra", "QuietComfort 45"],
      Apple: ["AirPods Pro 2", "AirPods Max"],
      Sennheiser: ["Momentum 4"],
    },
    priceRange: [199, 900],
    warrantyMonths: [12, 24],
  },
  {
    category: "Smartwatch",
    brands: {
      Apple: ["Watch Series 9", "Watch Ultra 2", "Watch SE"],
      Samsung: ["Galaxy Watch 6", "Galaxy Watch 6 Classic"],
      Garmin: ["Fenix 7", "Forerunner 965"],
    },
    priceRange: [299, 1300],
    warrantyMonths: [12, 24],
  },
  {
    category: "Camera",
    brands: {
      Canon: ["EOS R6 Mark II", "EOS R8"],
      Nikon: ["Z6 III", "Z f"],
      Sony: ["Alpha 7 IV", "Alpha 6700"],
      Fujifilm: ["X-T5", "X100VI"],
    },
    priceRange: [899, 4500],
    warrantyMonths: [12, 24, 36],
  },
  {
    category: "Console",
    brands: {
      Sony: ["PlayStation 5", "PlayStation 5 Slim"],
      Microsoft: ["Xbox Series X", "Xbox Series S"],
      Nintendo: ["Switch OLED", "Switch Lite"],
    },
    priceRange: [299, 1100],
    warrantyMonths: [12, 24],
  },
  {
    category: "Monitor",
    brands: {
      Dell: ["UltraSharp U2723QE", "S2722DC"],
      LG: ["UltraGear 27GR95QE", "UltraFine 32UN880"],
      Samsung: ["Odyssey G7", "ViewFinity S9"],
      BenQ: ["PD2725U", "MOBIUZ EX2710Q"],
    },
    priceRange: [299, 2200],
    warrantyMonths: [12, 24, 36],
  },
  {
    category: "Appliance",
    brands: {
      Dyson: ["V15 Detect", "Airwrap", "Purifier Cool"],
      Bosch: ["Series 6 Dishwasher", "Series 8 Oven"],
      Samsung: ["Bespoke Fridge", "WindFree AC"],
      LG: ["InstaView Fridge", "Styler"],
    },
    priceRange: [349, 3800],
    warrantyMonths: [12, 24, 36, 60],
  },
];

const RETAILERS = [
  "JB Hi-Fi",
  "Harvey Norman",
  "Officeworks",
  "The Good Guys",
  "Amazon AU",
  "Apple Store",
  "Bing Lee",
  "Kogan",
];

function pick<T>(arr: T[]): T {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
}

function warrantyProviderFor(brand: string): string {
  const map: Record<string, string> = {
    Apple: "AppleCare+",
    Samsung: "Samsung Care+",
  };
  return faker.helpers.arrayElement([
    map[brand] ?? "Manufacturer Warranty",
    "Manufacturer Warranty",
    "Extended Warranty (Allianz)",
    "Retailer Warranty",
  ]);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function buildTimeline(deviceId: string, purchaseDate: Date, expiry: Date) {
  const now = new Date();
  const events: (typeof schema.warrantyEvent.$inferInsert)[] = [];

  events.push({
    deviceId,
    date: purchaseDate,
    type: "purchase",
    title: "Device purchased",
    description: "Purchase recorded and added to tracker.",
  });

  // Most owners register within a couple of weeks.
  if (faker.datatype.boolean(0.8)) {
    events.push({
      deviceId,
      date: faker.date.soon({ days: 14, refDate: purchaseDate }),
      type: "registered",
      title: "Warranty registered",
      description: "Warranty registered with the manufacturer.",
    });
  }

  // Occasional claim/repair somewhere during coverage.
  if (faker.datatype.boolean(0.25)) {
    const claimDate = faker.date.between({ from: purchaseDate, to: expiry < now ? expiry : now });
    events.push({
      deviceId,
      date: claimDate,
      type: faker.helpers.arrayElement(["claim", "repair"]),
      title: faker.helpers.arrayElement([
        "Warranty claim lodged",
        "Repair completed",
        "Part replaced under warranty",
      ]),
      description: faker.helpers.arrayElement([
        "Battery replaced under warranty.",
        "Screen repaired by authorised service centre.",
        "Logic board replaced free of charge.",
        "Faulty unit swapped for a replacement.",
      ]),
    });
  }

  // Coverage extension for some.
  if (faker.datatype.boolean(0.15)) {
    events.push({
      deviceId,
      date: faker.date.between({ from: purchaseDate, to: expiry }),
      type: "extended",
      title: "Warranty extended",
      description: "Extended coverage purchased.",
    });
  }

  if (expiry < now) {
    events.push({
      deviceId,
      date: expiry,
      type: "expired",
      title: "Warranty expired",
      description: "Manufacturer coverage ended.",
    });
  }

  return events;
}

async function main() {
  console.log("Clearing existing device data…");
  await db.delete(schema.warrantyEvent);
  await db.delete(schema.device);

  const TOTAL = 250;
  const deviceRows: (typeof schema.device.$inferInsert)[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const spec = pick(CATALOG);
    const brand = pick(Object.keys(spec.brands));
    const model = pick(spec.brands[brand]);
    // Spread purchases across the last ~4.5 years for a good status mix.
    const purchaseDate = faker.date.past({ years: 4.5 });
    const warrantyMonths = pick(spec.warrantyMonths);
    const warrantyExpiry = addMonths(purchaseDate, warrantyMonths);

    deviceRows.push({
      name: model,
      brand,
      category: spec.category,
      model,
      serialNumber: faker.string.alphanumeric({ length: 12, casing: "upper" }),
      purchaseDate,
      purchasePrice: faker.number.int({
        min: spec.priceRange[0],
        max: spec.priceRange[1],
      }),
      retailer: pick(RETAILERS),
      warrantyMonths,
      warrantyExpiry,
      warrantyProvider: warrantyProviderFor(brand),
      notes: faker.datatype.boolean(0.3)
        ? faker.helpers.arrayElement([
            "Keep the receipt in the email folder.",
            "Gift from family — original box stored in garage.",
            "Used daily for work.",
            "Has a minor scratch on the back, cosmetic only.",
            "Extended warranty paperwork filed.",
          ])
        : "",
    });
  }

  console.log(`Inserting ${TOTAL} devices…`);
  const inserted = await db.insert(schema.device).values(deviceRows).returning({
    id: schema.device.id,
    purchaseDate: schema.device.purchaseDate,
    warrantyExpiry: schema.device.warrantyExpiry,
  });

  console.log("Building warranty timelines…");
  const events = inserted.flatMap((d) =>
    buildTimeline(d.id, d.purchaseDate, d.warrantyExpiry)
  );
  // Insert in chunks to stay well under parameter limits.
  for (let i = 0; i < events.length; i += 500) {
    await db.insert(schema.warrantyEvent).values(events.slice(i, i + 500));
  }

  console.log(`Done. Seeded ${inserted.length} devices and ${events.length} events.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
