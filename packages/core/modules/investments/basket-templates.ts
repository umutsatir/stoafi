import data from "../../data/basket-templates.json";

export interface BasketTemplateEntry {
  /** Names the slice in the language files; also the id of the entry once the template is applied. */
  key: string;
  typeId: string;
  percent: number;
}

export interface BasketTemplate {
  id: string;
  /** 1 careful, 2 balanced, 3 growth. */
  risk: number;
  sources: string[];
  entries: BasketTemplateEntry[];
}

/** When the example baskets were last reviewed (YYYY-MM); shown next to them. */
export const BASKET_TEMPLATES_AS_OF: string = data.asOf;
export const BASKET_TEMPLATES: BasketTemplate[] = data.templates;
