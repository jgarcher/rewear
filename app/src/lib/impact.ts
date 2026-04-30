// Impact calculation — ADR 016 methodology
// Conservative: 20 re-wears = 1 garment delayed.
// Per delayed garment (weighted average across mixed wardrobe):
//   ~ 3,000 L water, ~ 10 kg CO₂, ~ 0.4 kg waste

const REWEARS_PER_DELAYED_GARMENT = 20;
const WATER_L_PER_GARMENT = 3000;
const CO2_KG_PER_GARMENT = 10;
const WASTE_KG_PER_GARMENT = 0.4;

export type Impact = {
  rewears: number;
  garments_delayed: number;
  water_litres: number;
  co2_kg: number;
  waste_kg: number;
};

export function calculateImpact(rewearCount: number): Impact {
  const garmentsDelayed = rewearCount / REWEARS_PER_DELAYED_GARMENT;
  return {
    rewears: rewearCount,
    garments_delayed: Math.round(garmentsDelayed * 10) / 10,
    water_litres: Math.round((garmentsDelayed * WATER_L_PER_GARMENT) / 100) * 100,
    co2_kg: Math.round(garmentsDelayed * CO2_KG_PER_GARMENT),
    waste_kg: Math.round(garmentsDelayed * WASTE_KG_PER_GARMENT * 10) / 10,
  };
}

export function formatImpact(impact: Impact): {
  water: string;
  co2: string;
  delayed: string;
} {
  return {
    water: impact.water_litres > 0 ? `~ ${impact.water_litres.toLocaleString()} L` : "—",
    co2: impact.co2_kg > 0 ? `~ ${impact.co2_kg} kg` : "—",
    delayed:
      impact.garments_delayed > 0 ? `~ ${impact.garments_delayed}` : "—",
  };
}
