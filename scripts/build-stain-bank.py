#!/usr/bin/env python3
"""Build the focused staining/histochemistry collection for the exam."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/bank/questions/histology-stains.jsonl"

# prompt, choices, correct index, explanation
ITEMS = [
    ("In a routine H&E section, which tissue component is expected to be strongly basophilic?", ["Collagen bundles", "Lipid droplets", "Ribosome-rich rough endoplasmic reticulum", "Elastic lamellae", "Neutral mucin"], 2, "Hematoxylin behaves as a basic dye complex and colors acidic, anionic structures such as nucleic acids in ribosomes and nuclei blue-purple."),
    ("Which statement best describes eosin in routine H&E staining?", ["It stains DNA black", "It stains many cytoplasmic and extracellular proteins pink", "It selectively stains glycogen magenta", "It stains elastic fibers brown", "It demonstrates ferric iron blue"], 1, "Eosin is an acidic dye that binds many basic proteins, producing pink to red cytoplasm, collagen, and other extracellular material."),
    ("A pathologist wants to demonstrate glycogen and basement membranes as magenta structures. Which reaction is most appropriate?", ["PAS reaction", "Orcein stain", "Prussian blue reaction", "Oil Red O", "Silver reticulin stain"], 0, "Periodic acid–Schiff (PAS) detects carbohydrate-rich structures, including glycogen, glycoproteins, many mucins, and basement membranes, as magenta."),
    ("Which control best establishes that magenta cytoplasmic material in a PAS section is glycogen?", ["Pretreatment with DNase", "Pretreatment with diastase", "Extraction with acid alcohol", "Counterstaining with eosin", "Polarized-light examination"], 1, "Diastase digests glycogen. Loss of PAS positivity after diastase treatment supports that the original material was glycogen."),
    ("Orcein is especially useful when the examiner asks you to identify which extracellular component?", ["Type II collagen", "Reticular fibers", "Elastic fibers and elastic lamellae", "Basement-membrane proteoglycan", "Fibrin"], 2, "Orcein demonstrates elastin, making elastic fibers or elastic lamellae stand out as dark brown to purple-brown structures."),
    ("A silver impregnation method reveals a delicate black branching framework in a lymph node. What is being demonstrated?", ["Type I collagen bundles", "Type III collagen reticular fibers", "Elastic fibers", "Actin filaments", "Myelin"], 1, "Reticular fibers are rich in type III collagen and are argyrophilic; silver methods render their branching stromal network dark or black."),
    ("Why are reticular fibers described as argyrophilic rather than intrinsically black?", ["They reduce silver without treatment", "They bind silver salts that require a separate reducing step", "They contain endogenous iron", "They bind only acidic dyes", "They are visible only by electron microscopy"], 1, "Argyrophilic structures bind silver ions but require an external reducing agent to deposit visible metallic silver."),
    ("Methylene blue most directly behaves as which type of histologic dye?", ["An acidic dye binding basic proteins", "A basic dye binding acidic cell components", "A lipid-soluble dye", "A metallic impregnation", "A fluorescent antibody"], 1, "Methylene blue is a basic, cationic dye and therefore binds basophilic acidic material such as nucleic acids."),
    ("Toluidine blue changes from blue to purple-red over mast-cell granules. What explains this metachromasia?", ["High lipid concentration", "Dense sulfated glycosaminoglycans", "Abundant neutral glycogen", "Type I collagen birefringence", "Ferric iron deposition"], 1, "Closely spaced anionic sulfate groups in mast-cell granules alter aggregation of toluidine-blue molecules, shifting the observed color."),
    ("Which stain is most appropriate for routine differential identification of leukocytes in a peripheral-blood smear?", ["Wright–Giemsa", "Masson trichrome", "Congo red", "Alcian blue", "Orcein"], 0, "Wright–Giemsa-type Romanowsky stains differentiate nuclei, cytoplasmic granules, erythrocytes, and platelets in blood and marrow smears."),
    ("A paraffin-processed section shows empty spaces where adipocyte lipid droplets had been. Which method would best preserve and demonstrate neutral lipid?", ["PAS on the paraffin section", "Oil Red O on a frozen section", "Hematoxylin alone", "Silver impregnation", "Feulgen reaction"], 1, "Routine organic solvents remove neutral lipid. Oil Red O or Sudan dyes are therefore commonly applied to frozen sections in which lipid remains."),
    ("Which reagent both fixes membranes for electron microscopy and makes many lipids electron-dense or black?", ["Eosin", "Osmium tetroxide", "Alcian blue", "Cresyl violet", "Schiff reagent"], 1, "Osmium tetroxide reacts with unsaturated lipids, stabilizing membranes and producing electron-dense, dark material."),
    ("The Feulgen reaction is selective for which macromolecule?", ["RNA", "DNA", "Glycogen", "Neutral lipid", "Collagen"], 1, "Controlled acid hydrolysis exposes aldehyde groups in DNA that react with Schiff reagent, making the Feulgen reaction DNA-specific."),
    ("Alcian blue is most useful for demonstrating which material?", ["Acidic mucins and glycosaminoglycans", "Neutral lipid droplets", "DNA", "Ferric iron", "Elastic lamellae"], 0, "Alcian blue is a cationic dye that binds acidic mucosubstances and glycosaminoglycans, coloring them blue."),
    ("Coarse golden-brown granules in macrophages are suspected to contain hemosiderin. Which reaction confirms ferric iron?", ["Prussian blue", "PAS", "Congo red", "Orcein", "Wright–Giemsa"], 0, "The Perls Prussian blue reaction detects ferric iron in hemosiderin as blue deposits."),
    ("Amyloid stained with Congo red has which diagnostic appearance under polarized light?", ["Blue metachromasia", "Apple-green birefringence", "Black reticular fibers", "Magenta basement membranes", "Red myelin"], 1, "Congo-red-bound amyloid shows characteristic apple-green birefringence when examined with polarized light."),
    ("Masson trichrome is most useful when a question asks you to distinguish which two tissue components?", ["Collagen from muscle or cytoplasm", "DNA from RNA", "Glycogen from mucin", "Elastic fibers from reticular fibers only", "Neutral from acidic lipid"], 0, "Trichrome methods color collagen differently from muscle and cytoplasm, commonly blue or green for collagen and red for muscle/cytoplasm."),
    ("Cresyl violet or another Nissl stain highlights neuronal Nissl substance because it contains abundant what?", ["Smooth endoplasmic reticulum", "Rough ER and ribosomal RNA", "Neurofilaments", "Lysosomal lipid", "Myelin protein"], 1, "Nissl substance is rough endoplasmic reticulum with many ribosomes; its RNA makes it strongly basophilic with cresyl violet."),
    ("Luxol fast blue is used primarily to assess which structure in nervous tissue?", ["Myelin", "Nissl substance", "Astrocyte nuclei", "Reticular fibers", "Capillary basement membranes"], 0, "Luxol fast blue binds lipoprotein components of myelin and is widely used to assess myelinated white matter."),
    ("Immunohistochemistry is the best choice when the goal is to localize what in a tissue section?", ["A specific protein antigen", "All acidic molecules", "Neutral lipid without a probe", "Every collagen type simultaneously", "Only DNA sequence changes"], 0, "Immunohistochemistry uses antigen-specific antibodies to localize a particular protein or other antigen in cells or extracellular matrix."),
    ("In situ hybridization differs from immunohistochemistry because its labeled probe binds directly to which target?", ["A complementary DNA or RNA sequence", "A specific protein epitope", "Neutral triglyceride", "Ferric iron", "Type III collagen fibrils"], 0, "In situ hybridization uses a labeled nucleic-acid probe to identify a complementary DNA or RNA sequence within cells or tissue."),
    ("Why are unfixed frozen sections often preferred for enzyme histochemistry?", ["Paraffin enhances every enzyme", "Routine fixation and heat can destroy enzymatic activity", "Frozen sections remove all lipid", "They eliminate the need for a substrate", "They make antibodies unnecessary"], 1, "Enzyme histochemistry depends on retained catalytic activity, which may be reduced or destroyed by fixation, heat, and routine paraffin processing."),
    ("A stain shows elastic lamellae clearly but does not reliably identify a fine type III collagen network. Which pairing is correct?", ["Orcein for elastic fibers; silver impregnation for reticular fibers", "PAS for elastic fibers; eosin for reticular fibers", "Oil Red O for elastic fibers; Feulgen for reticular fibers", "Prussian blue for elastic fibers; Congo red for reticular fibers", "Methylene blue for elastic fibers; osmium for reticular fibers"], 0, "Orcein is an elastic-fiber stain, whereas silver impregnation is the classic method for argyrophilic reticular fibers."),
    ("Which component is usually extracted during routine paraffin processing and therefore appears as an empty vacuole in an H&E section?", ["Nuclear chromatin", "Neutral lipid", "Ribosomal RNA", "Type I collagen", "Basement membrane glycoprotein"], 1, "Alcohol and organic clearing agents dissolve many neutral lipids during paraffin processing, leaving optically empty spaces."),
]


def main():
    questions = []
    for index, (prompt, choices, answer_index, explanation) in enumerate(ITEMS, 1):
        options = [{"id": chr(65 + i), "text": text} for i, text in enumerate(choices)]
        correct = options[answer_index]
        digest = hashlib.sha1(prompt.encode()).hexdigest()[:10]
        questions.append({
            "schemaVersion": "1.0.0", "id": f"hist-stain-{index:02d}-{digest}", "revision": 1,
            "status": "verified", "kind": "single_best_answer", "subject": "histology",
            "topic": "Histology methods and stains", "subtopic": "Stain recognition",
            "chapter": "Chapter 1", "difficulty": 3, "prompt": prompt, "options": options,
            "correctOptionId": correct["id"], "acceptedFreeText": [correct["id"], correct["text"]],
            "explanation": explanation,
            "distractorExplanations": {option["id"]: f"{option['text']} does not match the target, chemistry, or appearance in this stem. {explanation}" for option in options if option["id"] != correct["id"]},
            "learningObjective": "Select and interpret common stains by target, color, chemistry, and limitation.",
            "source": {"title": "Junqueira's Basic Histology", "edition": "16th", "chapter": "Chapter 1: Histology & Its Methods of Study", "excerpt": "Focused stain-recognition item aligned to the methods chapter and course emphasis."},
            "tags": ["histology", "stains", "image-recognition"], "examPriority": "core",
            "qualityFlags": ["focused-course-emphasis", "manually-authored"],
        })
    with OUT.open("w", encoding="utf-8") as handle:
        for question in questions:
            handle.write(json.dumps(question, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"wrote {len(questions)} questions -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
