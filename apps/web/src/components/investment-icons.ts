import {
  Banknote,
  Bitcoin,
  Building2,
  FileText,
  Gem,
  Landmark,
  Package,
  type LucideIcon,
} from "lucide-react";
import { investmentType } from "@stoafi/core";

/** The picture for a type: what sits in the pot, and what falls in when you buy. */
const PICTURES: Record<string, { pot: LucideIcon; drop: LucideIcon }> = {
  gold: { pot: Gem, drop: Gem },
  banknotes: { pot: Banknote, drop: Banknote },
  certificate: { pot: FileText, drop: FileText },
  vault: { pot: Landmark, drop: Banknote },
  coin: { pot: Bitcoin, drop: Bitcoin },
  building: { pot: Building2, drop: Banknote },
  box: { pot: Package, drop: Package },
};

export function picturesFor(typeId: string): { pot: LucideIcon; drop: LucideIcon } {
  return (
    PICTURES[investmentType(typeId).icon] ?? (PICTURES.box as { pot: LucideIcon; drop: LucideIcon })
  );
}
