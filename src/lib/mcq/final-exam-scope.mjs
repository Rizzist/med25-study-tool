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
  return CARBOHYDRATE_LIPID_METABOLISM_TOPICS.has(normalize(question?.topic))
    || CARBOHYDRATE_LIPID_METABOLISM_TOPICS.has(normalize(question?.chapter));
}

export function filterFinalExamQuestions(questions, excludeCarbohydrateLipidMetabolism) {
  if (!excludeCarbohydrateLipidMetabolism) return questions;
  return questions.filter((question) => !isCarbohydrateOrLipidMetabolism(question));
}
