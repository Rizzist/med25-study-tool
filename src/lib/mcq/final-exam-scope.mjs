const CARBOHYDRATE_LIPID_METABOLISM_TOPICS = new Set([
  "carbohydrate metabolism",
  "dietary lipid metabolism",
  "fatty acid and ketone metabolism",
  "feed-fast cycle",
  "lipid metabolism",
  "lipoproteins",
  "cholesterol and lipoprotein metabolism",
]);

function normalize(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isCarbohydrateOrLipidMetabolism(question) {
  if ((question?.tags ?? []).includes("carbohydrate-lipid-metabolism")) return true;
  if (CARBOHYDRATE_LIPID_METABOLISM_TOPICS.has(normalize(question?.topic))
    || CARBOHYDRATE_LIPID_METABOLISM_TOPICS.has(normalize(question?.chapter))) return true;

  // The downloaded papers label oxidative phosphorylation, the TCA cycle, and
  // ATP production as “bioenergetics.” They are still metabolic-pathway items
  // for this exam scope. Keep the cytochrome-c apoptosis question because it
  // tests cell death rather than metabolism.
  if (normalize(question?.topic) === "bioenergetics") {
    return !normalize(question?.prompt).includes("released into the cytosol");
  }
  return false;
}

export function filterFinalExamQuestions(questions, excludeCarbohydrateLipidMetabolism) {
  if (!excludeCarbohydrateLipidMetabolism) return questions;
  return questions.filter((question) => !isCarbohydrateOrLipidMetabolism(question));
}
