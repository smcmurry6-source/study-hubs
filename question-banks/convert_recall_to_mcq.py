"""One-time conversion: turns every type:"recall" entry in
gi1-question-bank.json into type:"mcq" by pulling the original terse
answer out as the correct choice and pairing it with three curated,
same-category, length-matched distractors (drafted by hand against each
question's actual content -- not generated algorithmically).

Run this only if gi1-question-bank.json's recall entries are ever
re-extracted from scratch (e.g. via extract_gi1.py after an edit to
hubs/gi-exam1/index.html) and need re-converting. If you're just fixing
one question's wording or one distractor, it's simpler to hand-edit the
JSON entry directly and skip re-running this whole script.

After running this, hepatobiliary/index.html's embedded EXAM1_REVIEW_POOL
copy needs to be regenerated from the updated JSON too -- see this
folder's README for that mapping.

Usage: run from the repo root (the directory containing question-banks/).
"""
import json

PATH = "question-banks/gi1-question-bank.json"

DISTRACTORS = {
    "gi1-q24": ["Gastrocolic reflex", "Enterogastric reflex", "Gastroileal reflex"],
    "gi1-q25": ["Plicae circulares", "Rugae", "Taeniae coli"],
    "gi1-q26": ["Gastric phase", "Cephalic phase", "Intestinal phase"],
    "gi1-q27": ["Leptin", "Motilin", "GLP-1"],
    "gi1-q28": ["Secretin", "GIP", "VIP"],
    "gi1-q29": ["Hepatoduodenal ligament", "Gastrosplenic ligament", "Coronary ligament"],
    "gi1-q30": ["Amylase", "Mucin", "Lactoferrin"],
    "gi1-q31": ["GIP", "CCK", "Secretin"],
    "gi1-q32": ["Plicae circulares", "Rugae", "Villi"],
    "gi1-q33": ["Mucin", "Pepsinogen", "Transferrin"],
    "gi1-q34": ["Upper esophageal sphincter", "Pyloric sphincter", "Sphincter of Oddi"],
    "gi1-q35": ["Somatostatin", "Serotonin", "Gastrin"],
    "gi1-q36": ["Secretin", "GIP", "Motilin"],
    "gi1-q37": ["Fungiform papillae", "Circumvallate papillae", "Foliate papillae"],
    "gi1-q38": ["Jejunum", "Duodenum", "Cecum"],
    "gi1-q39": ["Duodenum", "Ileum", "Cecum"],
    "gi1-q40": ["VIP", "Substance P", "Nitric oxide"],
    "gi1-q41": ["Pepsin", "Gastrin", "Intrinsic factor"],
    "gi1-q42": ["Jejunum", "Ileum", "Stomach"],
    "gi1-q43": ["Chief cells", "G cells", "Mucous neck cells"],
    "gi1-q44": ["Superior mesenteric artery", "Inferior mesenteric artery", "Renal artery"],
    "gi1-q45": ["Mucosa", "Muscularis externa", "Serosa"],
    "gi1-q46": ["Peristalsis", "Segmentation", "Mass movement"],
    "gi1-q47": ["Vagus nerve", "Intercostal nerves", "Greater splanchnic nerve"],
    "gi1-q48": ["Pleura", "Pericardium", "Mesentery"],
    "gi1-q49": ["Enamel", "Cementum", "Pulp"],
    "gi1-q50": ["Pyloric sphincter", "Sphincter of Oddi", "Anal sphincter"],
    "gi1-q51": ["Esophageal varices", "Hemorrhoids", "Splenomegaly"],
    "gi1-q52": ["Lesser omentum", "Mesentery proper", "Falciform ligament"],
    "gi1-q53": ["Esophageal hiatus", "Inguinal canal", "Umbilical ring"],
    "gi1-q54": ["Murphy's point", "Costovertebral angle", "Linea semilunaris"],
    "gi1-q55": ["Submucosa", "Mucosa", "Serosa"],
    "gi1-q56": ["Submandibular gland", "Parotid gland", "Minor salivary glands"],
    "gi1-q57": ["Gastrin", "Intrinsic factor", "Mucus"],
    "gi1-q58": ["Cardia", "Antrum", "Body"],
    "gi1-q59": ["GLP-1", "CCK", "Secretin"],
    "gi1-q60": ["Villi", "Plicae circulares", "Haustra"],
    "gi1-q61": ["Volvulus", "Diverticulitis", "Hernia"],
    "gi1-q62": ["CCK", "GIP", "Gastrin"],
    "gi1-q63": ["VIP", "GRP", "Nitric oxide"],
    "gi1-q64": ["Cephalic phase", "Gastric phase", "Colonic phase"],
    "gi1-q65": ["Parotid gland", "Sublingual gland", "Minor salivary glands"],
    "gi1-q66": ["Retroperitoneal space", "Pleural cavity", "Mesentery"],
    "gi1-q67": ["External oblique", "Internal oblique", "Rectus abdominis"],
    "gi1-q68": ["Submandibular gland", "Sublingual gland", "Minor salivary glands"],
    "gi1-q70": ["Gallbladder contraction", "Pancreatic enzyme release", "Gastric acid secretion"],
    "gi1-q71": ["Substance P", "GRP", "Acetylcholine"],
    "gi1-q72": ["Greater splanchnic nerves", "Pudendal nerve", "Vagus nerve"],
    "gi1-q73": ["Secretin", "Somatostatin", "Cholecystokinin (CCK)"],
    "gi1-q74": ["Secretin", "Gastrin", "Motilin"],
    "gi1-q76": ["Ileum > jejunum > colon > feces", "Colon > jejunum > ileum > feces", "Jejunum > colon > ileum > feces"],
    "gi1-q78": ["Gastric fundus", "Gastric body", "Duodenum"],
    "gi1-q79": ["CCK", "Secretin", "Gastrin"],
    "gi1-q80": ["Secretin", "GIP", "Gastrin"],
    "gi1-q82": ["Cholecystokinin (CCK)", "Secretin", "Epidermal growth factor (EGF)"],
    "gi1-q83": ["Distension, acting through stretch receptors", "Protein, acting through gastrin-releasing peptide", "Fat, acting through CCK"],
    "gi1-q85": ["Gastric acid secretion", "Bile flow", "Pancreatic enzyme output"],
    "gi1-q86": ["Vomiting", "Belching", "Gastric acid secretion"],
    "gi1-q87": ["Secretin, CCK, and somatostatin", "Gastrin, secretin, and VIP", "Acetylcholine, somatostatin, and motilin"],
    "gi1-q88": [
        "The defecation reflex was suppressed entirely, so neither sphincter ever received a signal to relax.",
        "Both the internal and external anal sphincters relaxed involuntarily, and she had no voluntary control over the urge.",
        "The gastrocolic reflex was blocked, preventing the rectum from ever stretching enough to trigger a reflex.",
    ],
}

# Entries whose correct-choice text needs manual override rather than the
# generic "text before the first '. '" split (currently just the one where
# the source answer starts with a "Study guide answer:" preamble).
MANUAL_TERM = {
    "gi1-q58": "Fundus",
}

# Entries whose source answer has no explanation text after the term (so
# the generic split leaves nothing for `ex`), or whose split needs
# overriding for another reason -- each gets a short original write-up.
MANUAL_EX = {
    "gi1-q48": "A serous membrane with parietal and visceral layers; in the abdomen the parietal layer lines the cavity wall and the visceral layer covers the organs themselves.",
    "gi1-q50": "Sits at the ileum-cecum junction; relaxes during the colonic phase via the gastroileal reflex, letting chyme move forward while normally blocking reflux.",
    "gi1-q52": "A fatty peritoneal apron draped from the greater curvature over the transverse colon and small intestine — often nicknamed the abdomen's \"policeman\" for walling off local infection.",
    "gi1-q58": "The study guide keys this to the fundus, but the histology lecture instead assigns mucus/bicarbonate secretion to the cardia — the narrow zone right at the esophagogastric junction — while describing the fundus and body as parietal- and chief-cell-rich (acid- and enzyme-producing) territory. Know both framings; if this appears on your exam, go with whichever your professor emphasized in lecture.",
    "gi1-q59": "K cells in the duodenum and proximal jejunum release GIP in response to glucose, amino acids, and fatty acids — one of the two classic incretins alongside GLP-1.",
    "gi1-q66": "The potential space between the parietal and visceral peritoneal layers; normally contains only a thin film of serous fluid for lubrication.",
    "gi1-q88": "The urge came from a real defecation reflex — rectal stretch triggers involuntary internal anal sphincter relaxation no matter what — but voluntary control lives entirely in the external anal sphincter, which she kept contracted to override the reflex until a bathroom was available.",
}


def convert():
    with open(PATH) as f:
        data = json.load(f)

    converted = 0
    rotation_i = 0
    for entry in data:
        if entry.get("type") != "recall":
            continue
        qid = entry["id"]
        if qid not in DISTRACTORS:
            raise SystemExit("No distractors drafted for %s" % qid)
        distractors = DISTRACTORS[qid]
        if len(distractors) != 3:
            raise SystemExit("Expected exactly 3 distractors for %s, got %d" % (qid, len(distractors)))

        raw = entry["answer"]
        if qid in MANUAL_TERM:
            term = MANUAL_TERM[qid]
            rest = MANUAL_EX.get(qid, "")
        else:
            term, _, rest = raw.partition(". ")
            term = term.strip().rstrip(".")
            rest = rest.strip()
            if not rest:
                if qid not in MANUAL_EX:
                    raise SystemExit("Entry %s has no explanation text and no manual override" % qid)
                rest = MANUAL_EX[qid]

        correct_index = rotation_i % 4
        rotation_i += 1
        choices = list(distractors)
        choices.insert(correct_index, term)

        entry["type"] = "mcq"
        entry["choices"] = choices
        entry["answer"] = correct_index
        entry["ex"] = rest
        converted += 1

    if converted != 60:
        raise SystemExit("Expected to convert 60 entries, converted %d" % converted)

    for entry in data:
        if entry["type"] != "mcq":
            raise SystemExit("Entry %s is not mcq after conversion" % entry["id"])
        if not isinstance(entry.get("choices"), list) or len(entry["choices"]) < 2:
            raise SystemExit("Entry %s missing valid choices" % entry["id"])
        ai = entry.get("answer")
        if not isinstance(ai, int) or ai < 0 or ai >= len(entry["choices"]):
            raise SystemExit("Entry %s has invalid answer index" % entry["id"])

    with open(PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print("Converted %d recall entries to mcq. Total entries: %d, all mcq: %s" % (
        converted, len(data), all(e["type"] == "mcq" for e in data)))


if __name__ == "__main__":
    convert()
