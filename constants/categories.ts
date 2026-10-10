// Tür (genre) kimlikleri. Renk burada YALNIZCA anlam taşır: editoryal dilde
// dekoratif renk yok, tür rengi bir etiketin/aksanın kimliğidir.
import i18n from "@/i18n";

export const CategoryMeta: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  romance: { label: "genres.romance", color: "#E0517F", icon: "heart" },
  fantasy: { label: "genres.fantasy", color: "#7355CE", icon: "sparkles" },
  mystery: { label: "genres.mystery", color: "#4363D8", icon: "search" },
  drama: { label: "genres.drama", color: "#B85C9E", icon: "rainy" },
  adventure: { label: "genres.adventure", color: "#1F9C80", icon: "compass" },
  horror: { label: "genres.horror", color: "#6D4AAE", icon: "skull" },
  comedy: { label: "genres.comedy", color: "#D99427", icon: "happy" },
  poetry: { label: "genres.poetry", color: "#CC5A82", icon: "leaf" },
  sci_fi: { label: "genres.sci_fi", color: "#1FA3B3", icon: "planet" },
  other: { label: "genres.other", color: "#8C8598", icon: "ellipsis-horizontal" },
};

export const categoryColor = (cat?: string, fallback = "#7355CE") =>
  (cat && CategoryMeta[cat]?.color) || fallback;

export const categoryLabel = (cat?: string) =>
  i18n.t((cat && CategoryMeta[cat]?.label) || "genres.other");
