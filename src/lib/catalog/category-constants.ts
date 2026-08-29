export const MAJOR_MATERIAL_CATEGORIES = [
  "Cement",
  "Steel / TMT",
  "Sand / M-Sand / Aggregates",
  "Bricks & Blocks",
  "Ready Mix Concrete (RMC)",
  "Plumbing & Sanitary",
  "Electrical & Wiring",
  "Tiles & Flooring",
  "Paint & Wall Care",
  "Wood, Doors & Windows",
  "Hardware & Metal / Grills",
  "Waterproofing & Chemicals",
  "Other Materials",
] as const;

export const MAJOR_LABOUR_CATEGORIES = [
  "Civil & Masonry Labour",
  "Bar Bending & Steel Work",
  "Shuttering & Carpentry",
  "Tile & Granite Laying",
  "Plumbing Labour",
  "Electrical Labour",
  "Painting Labour",
  "General Labour & Helpers",
  "Other Labour",
] as const;

export const QUICK_MATERIAL_PRESETS = [
  "Cement",
  "Steel / TMT",
  "Sand / M-Sand / Aggregates",
  "Bricks & Blocks",
  "Electrical & Wiring",
  "Plumbing & Sanitary",
  "Tiles & Flooring",
  "Paint & Wall Care",
] as const;

export const QUICK_LABOUR_PRESETS = [
  "Civil & Masonry Labour",
  "Bar Bending & Steel Work",
  "Shuttering & Carpentry",
  "Plumbing Labour",
  "Electrical Labour",
  "Tile & Granite Laying",
  "Painting Labour",
  "General Labour & Helpers",
] as const;

export const STAGE_GROUP_ORDER: Record<string, number> = {
  "Structure & Civil": 1,
  "Structure": 1,
  "Civil": 1,
  "Piping & Wiring": 2,
  "Services & MEP": 2,
  "MEP": 2,
  "Finishes & Carpentry": 3,
  "Finishing Labour": 3,
  "Finishing": 3,
  "Specialized & Other": 4,
  "General & Helpers": 5,
  "Other Categories": 6,
  "Custom": 7,
};

export function getStageGroupOrder(groupName: string): number {
  for (const [key, rank] of Object.entries(STAGE_GROUP_ORDER)) {
    if (groupName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(groupName.toLowerCase())) {
      return rank;
    }
  }
  return 50;
}
