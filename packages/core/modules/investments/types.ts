import typesData from "../../data/investment-types.json";

export interface InvestmentType {
  id: string;
  /** The picture used for it: gold, banknotes, certificate, vault, coin, building, box. */
  icon: string;
}

export const INVESTMENT_TYPES: InvestmentType[] = typesData.types;

/** The preset with this id, or the generic "other" for an unknown or custom one. */
export function investmentType(id: string): InvestmentType {
  return (
    INVESTMENT_TYPES.find((type) => type.id === id) ??
    (INVESTMENT_TYPES.find((type) => type.id === "other") as InvestmentType) // "other" is in the data file (tested)
  );
}
