export type MaterialPreset = {
  defaultUnit: string;
  descriptions: string[];
  commonQty: number[];
  commonRates: number[];
};

export type LabourPreset = {
  descriptions: string[];
  commonWorkers: number[];
  commonDays: number[];
  commonDailyRates: number[];
  commonContractAmounts: number[];
};

const DEFAULT_MAT_PRESET: MaterialPreset = {
  defaultUnit: "bags",
  descriptions: ["Site material purchase", "Hardware & fittings"],
  commonQty: [10, 20, 50, 100],
  commonRates: [100, 250, 420, 1000],
};

const DEFAULT_LAB_PRESET: LabourPreset = {
  descriptions: ["Daily site labour", "Contract milestone payment"],
  commonWorkers: [2, 3, 4, 5],
  commonDays: [1, 2, 3, 4, 7],
  commonDailyRates: [800, 900, 1000, 1200],
  commonContractAmounts: [10000, 25000, 50000, 75000],
};

const MATERIAL_PRESETS_BY_KEYWORD: { keyword: string; preset: MaterialPreset }[] = [
  {
    keyword: "cement",
    preset: {
      defaultUnit: "bags",
      descriptions: ["OPC 53 grade cement", "PPC cement"],
      commonQty: [20, 50, 100, 200],
      commonRates: [380, 400, 420, 440],
    },
  },
  {
    keyword: "steel",
    preset: {
      defaultUnit: "kg",
      descriptions: ["TMT Fe550D bars", "Binding wire"],
      commonQty: [250, 500, 1000, 2000],
      commonRates: [65, 72, 75, 80],
    },
  },
  {
    keyword: "sand",
    preset: {
      defaultUnit: "loads",
      descriptions: ["M-sand truck load", "River sand"],
      commonQty: [1, 2, 3, 4],
      commonRates: [12000, 15000, 18000, 22000],
    },
  },
  {
    keyword: "brick",
    preset: {
      defaultUnit: "nos",
      descriptions: ["Table-moulded bricks", "Flyash bricks"],
      commonQty: [500, 1000, 2000, 5000],
      commonRates: [9, 10, 11, 12],
    },
  },
  {
    keyword: "block",
    preset: {
      defaultUnit: "nos",
      descriptions: ["Solid concrete blocks", "AAC blocks"],
      commonQty: [300, 500, 800, 1000],
      commonRates: [36, 40, 44, 48],
    },
  },
  {
    keyword: "tile",
    preset: {
      defaultUnit: "sqft",
      descriptions: ["Vitrified floor tiles", "Bathroom wall tiles"],
      commonQty: [200, 400, 800, 1200],
      commonRates: [45, 65, 80, 110],
    },
  },
  {
    keyword: "electr",
    preset: {
      defaultUnit: "coils",
      descriptions: ["Copper wire coils", "Switches and MCBs"],
      commonQty: [2, 5, 10, 15],
      commonRates: [1800, 3200, 5500, 9000],
    },
  },
  {
    keyword: "plumb",
    preset: {
      defaultUnit: "nos",
      descriptions: ["CPVC pipes and fittings", "Sanitaryware"],
      commonQty: [1, 5, 10, 20],
      commonRates: [1500, 3500, 7500, 12000],
    },
  },
  {
    keyword: "paint",
    preset: {
      defaultUnit: "litres",
      descriptions: ["Interior emulsion", "Exterior weather paint"],
      commonQty: [4, 10, 20],
      commonRates: [850, 1800, 3500, 5800],
    },
  },
];

const LABOUR_PRESETS_BY_KEYWORD: { keyword: string; preset: LabourPreset }[] = [
  {
    keyword: "mason",
    preset: {
      descriptions: ["Brick / block masonry", "Plastering work"],
      commonWorkers: [3, 4, 5, 6],
      commonDays: [2, 3, 5, 7],
      commonDailyRates: [850, 900, 1000, 1100],
      commonContractAmounts: [15000, 30000, 50000, 85000],
    },
  },
  {
    keyword: "cement",
    preset: {
      descriptions: ["Cement masonry labour", "Concrete pouring labour"],
      commonWorkers: [3, 4, 5],
      commonDays: [2, 3, 5],
      commonDailyRates: [800, 900, 1000],
      commonContractAmounts: [8000, 15000, 25000],
    },
  },
  {
    keyword: "tile",
    preset: {
      descriptions: ["Floor tile laying", "Bathroom tile work"],
      commonWorkers: [2, 3, 4],
      commonDays: [2, 3, 5, 7],
      commonDailyRates: [900, 1000, 1200],
      commonContractAmounts: [12000, 25000, 40000],
    },
  },
  {
    keyword: "electr",
    preset: {
      descriptions: ["Concealed wiring", "Switch and light fitting"],
      commonWorkers: [1, 2, 3],
      commonDays: [2, 3, 5],
      commonDailyRates: [900, 1000, 1100],
      commonContractAmounts: [10000, 22000, 45000],
    },
  },
  {
    keyword: "plumb",
    preset: {
      descriptions: ["Pipe work", "Sanitaryware installation"],
      commonWorkers: [1, 2, 3],
      commonDays: [1, 2, 3, 5],
      commonDailyRates: [850, 900, 1100],
      commonContractAmounts: [8000, 18000, 35000],
    },
  },
];

export function getMaterialPreset(categoryName?: string | null): MaterialPreset {
  if (!categoryName) return DEFAULT_MAT_PRESET;
  const name = categoryName.toLowerCase();
  const match = MATERIAL_PRESETS_BY_KEYWORD.find((entry) => name.includes(entry.keyword));
  return match?.preset ?? DEFAULT_MAT_PRESET;
}

export function getLabourPreset(categoryName?: string | null): LabourPreset {
  if (!categoryName) return DEFAULT_LAB_PRESET;
  const name = categoryName.toLowerCase();
  const match = LABOUR_PRESETS_BY_KEYWORD.find((entry) => name.includes(entry.keyword));
  return match?.preset ?? DEFAULT_LAB_PRESET;
}

export const CATEGORY_GROUP_ORDER: Record<string, number> = {
  "Foundation / Earthwork": 1,
  "Civil / Structural": 2,
  "RCC / Roofing": 3,
  Masonry: 4,
  Electrical: 5,
  Plumbing: 6,
  Flooring: 10,
  Painting: 11,
  "Wood / Interior": 12,
  "Civil / Masonry Labour": 2,
  "Electrical Labour": 5,
  "Plumbing Labour": 6,
  "Tile Labour": 10,
  "Painting Labour": 11,
  "Wood Labour": 12,
};
