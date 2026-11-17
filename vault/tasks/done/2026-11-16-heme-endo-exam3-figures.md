---
type: task
status: done
hub: heme-endo-exam3
created: 2026-11-16
requested-by: Sam
due: 2026-11-20
waiting-on: 
agent: Claude Code
pr: https://github.com/smcmurry6-source/study-hubs/pull/396
---

# Heme & Endo Exam 3: finish the figures and the High yield narration

## Goal

Sam said yes to every diagram for this hub (2026-11-16: "yes to all diagrams and figures"), and every lecture gets High yield
narration ([text-and-audio-never-drift](../../rules/text-and-audio-never-drift.md)). The hub was merged before either was
finished, because Sam was about to run out of usage ("merge before i run out of usage, we can finish the rest when it
resets"). Finish both before Exam 3 (Fri 11/20, 8 am): [ship-it-now](../../rules/ship-it-now.md).

## Context

- Hub note: [heme-endo-exam3](../../hubs/heme-endo-exam3.md). How figures are built here: `tools/figures/heme-endo-exam3/`
  (`shared.mjs` is Exam 2's `makeFig` helper; `index.mjs` builds every `.mjs` in that folder; `preview.mjs <id>` draws one
  in light and dark), and the rules [diagrams-anima](../../rules/diagrams-anima.md),
  [figures-teach-the-lecture](../../rules/figures-teach-the-lecture.md) and
  [outside-sources-for-figures](../../rules/outside-sources-for-figures.md). Heme & Endo Exam 2's figures
  (`tools/figures/heme-endo-exam2/`) are the templates.
- **Drafts:** 12 modules in `tools/figures/heme-endo-exam3/drafts/`, stopped part way and unchecked (some don't build yet).
  Move one up a folder, finish it, check it at 390 and 760 px in light and dark (no text under 11 px, leaders end on
  their part, no SVG ids, every CSS class with its own prefix), then build.
- **Placing them:** `FIG_PLACE` in `hubs/heme-endo-exam3/content/figures.js` (`{ <lecture>: [{ full: "<start of the
  heading's text>", plain: "...", figs: ["<id>"] }] }`), `figByLec` in `content/core.json`, and a `{ "type": "figs",
  "title": "Diagrams", "figs": [...] }` section in that lecture's Review group in `content/study.json`; then
  `node tools/hub-next/build.mjs --hub heme-endo-exam3`. Add the hub to the About page's Diagrams entry, then
  `node tools/timmy/build.mjs`.
- **High yield narration:** Lecture A's is recorded. For L17-L20, after the content is final:
  `python3 tools/narrate.py heme-endo-exam3 --level hy --lec <id> --force`, then the content build (it fills `hyAudio`).
  L19 and L20 will change when their recordings land ([that task](../2026-11-16-heme-endo-exam3-l19-l22.md)): record theirs
  then, at all three levels.

## The figures (each one's plan)

### Lecture A (`dental`)

- [x] **`laminadura`** (draft in `drafts/`, nearly done): The lamina dura, normal and in hyperparathyroidism. A periapical-style film of the lower premolars with the lamina dura, PDL space and trabecular bone, and the boxed area magnified where PTH reaches the bone cells; pick normal, hyperparathyroidism (osteoclasts open resorption bays, the lamina dura fades, a brown tumor) or hypoparathyroidism. Goes in A's notes after its hyperparathyroidism section. Supports `dc-lamina-dura`, `dc-2s-brown`.
- [x] **`glandmap`** (draft in `drafts/`): The endocrine glands and the mouth. A body outline with the glands Lecture A walks through (hypothalamus and pituitary, thyroid and parathyroids, adrenals with cortex and medulla, pancreas, ovaries or testes); tap one for what it makes and, for each disorder, the notes' table rows (what it does, what it looks like in the mouth, what changes in dental care), with small drawn mouths. Goes near the start of A's notes, after its overview of the glands.

### L17 (`preg`)

- [x] **`oocyte`** (draft in `drafts/`): Getting into the oocyte. A cross-section of the ovulated oocyte with its three layers (expanded cumulus or corona radiata, zona pellucida, plasma membrane). A sperm moves inward: ZP3 binding and the acrosomal reaction at the zona's surface, the ZP3 layer cleaved to expose ZP2, the second meiotic division, the cortical granules releasing so the remaining sperm can't bind, and the pronuclei fusing. Interaction: Step through the stages with a slider; each step lights its layer and names the protein or event. Goes after the heading starting "Fertilization: ZP3, ZP2 and one sperm per egg". Supports `pg-layers`, `pg-zp3`, `pg-2s-zp2`, `pg-meiosis`, `pg-polyspermy`.
- [x] **`firstweeks`** (not started): The first weeks: a timeline with the hormone handoff. A track from ovulation to the end of the first trimester: fertilization in the distal tube within 24 hours, estrogen constricting the opening of the uterus and progesterone relaxing it, the blastocyst in the uterus on day 4, implantation on days 5 to 7, hCG from day 8 rescuing the corpus luteum (which would otherwise regress at day 14), the hCG curve peaking at about 10 weeks, and corpus luteum versus placental progesterone crossing at the end of the first trimester. Interaction: Drag a marker along the days; the readout names what is happening and which structure makes the progesterone. Goes after the heading starting "The first week: a timeline". Supports `pg-num-timeline`, `pg-2s-myo`, `pg-hcg-rescue`, `pg-first-tri`, `pg-wf-hcg`.
- [x] **`estriol`** (draft in `drafts/`): The fetoplacental unit makes estriol. Three boxes, mother, placenta and fetus (adrenal and liver), with arrows: maternal cholesterol into the placenta (cholesterol desmolase, pregnenolone; progesterone made on its own), pregnenolone to the fetal adrenal (17,20 desmolase, DHEA sulfate), to the fetal liver (16-hydroxylation), back to the placenta (aromatase, estriol), and estriol into the mother's blood. Interaction: Tap an enzyme to see which side has it; switch off the fetal adrenal or liver and watch estriol fall. Goes after the heading starting "Making progesterone and estrogen: mother, placenta and fetus". Supports `pg-1720`, `pg-2s-aromatase`, `pg-estriol-health`, `pg-tf-prog-alone`, `pg-estriol`.
- [x] **`letdown`** (draft in `drafts/`): The breastfeeding reflex. Suckling at the nipple signaling up to the hypothalamus: dopamine to the anterior pituitary falls, so prolactin rises and drives the alveoli; oxytocin made in the hypothalamus is released from the posterior pituitary and contracts the myoepithelial cells around an alveolus (letdown); prolactin's inhibition of GnRH, with LH and FSH falling. Interaction: Toggle suckling on and off; the dopamine, prolactin, oxytocin and GnRH arrows change with it. Goes after the heading starting "How prolactin and oxytocin are controlled". Supports `pg-dopamine`, `pg-num-suckling`, `pg-prl-oxy`, `pg-tf-myoepi`, `pg-amen`.
- [x] **`implant`** (not started): Implantation in the decidualized endometrium. A blastocyst (trophoblast shell, fluid-filled cavity) attaching to the endometrium: cytotrophoblasts as the inner nurse layer, syncytiotrophoblasts sending protease-secreting protrusions into the stroma and secreting hCG, and the decidual cells around it swollen with glycogen and new vessels. Interaction: Three stages, attachment, invasion and differentiation, with the cell types labeled in each. Goes after the heading starting "Implantation". Supports `pg-trophoblast`, `pg-syncytio`, `pg-decid-except`, `pg-2s-hpl`.

### L18 (`sexster`)

- [x] **`tfates`** (draft in `drafts/`): Testosterone's two fates. The pathway from cholesterol through DHEA and androstenedione to testosterone, then the fork: 5-alpha-reductase to DHT (the active androgen) and aromatase to estradiol (and on to estrone and estriol), with the blocking drugs drawn as stops on each arrow (finasteride and dutasteride; anastrozole, letrozole and exemestane) Interaction: Tap an enzyme to block it with its drug and see which product falls and what that treats (BPH and hair loss, or breast cancer); a 'no aromatase' switch shows the tall man with osteoporotic bones Goes after the heading starting "Where the sex hormones come from". Supports `ea-5ar-active`, `ea-aromdef`, `ea-anastrozole`, `ea-pbox-finasteride`, `ea-dhea-otc`.
- [x] **`gnrh`** (not started): Pulsed versus continuous GnRH, and where each anti-androgen acts. The hypothalamus, pituitary, testis and a target cell: GnRH as pulses (bursts with long pauses) driving LH, FSH and testosterone, beside a long-acting analog's flat, continuous signal that switches the pituitary off; the 5-alpha-reductase inhibitors and receptor antagonists marked where they act in the target cell Interaction: A switch between natural pulses and goserelin moves LH and testosterone gauges up or down; tapping each anti-androgen class lights up its site Goes after the heading starting "GnRH analogs". Supports `ea-gnrh-paradox`, `ea-num-gnrh`, `ea-bicalutamide`, `ea-5ari-pair`, `ea-ws-antiandro`.
- [x] **`sermmap`** (draft in `drafts/`): One drug, different tissues: the SERM map. A body outline with breast, uterus, bone and ovary (with the hypothalamus), colored for estradiol, tamoxifen, raloxifene and clomiphene as acting like estrogen or the opposite, from his summary table Interaction: Pick a drug to recolor the tissues; a label at each tissue says what follows (breast cancer treated, uterine cancer risk, bone protected, ovulation induced) Goes after the heading starting "The SERM summary table". Supports `ea-tamox-tissues`, `ea-serm-uterus`, `ea-raloxifene-use`, `ea-clomid-mech`, `ea-serm-why`.
- [x] **`clots`** (not started): Why estrogen-active drugs cause clots. An estrogen taken by mouth passing through the liver, which makes more clotting factors 2, 7, 9 and 10 and less antithrombin III; a clot forming in a leg vein and traveling to the lung; warfarin's effect pushed back; the drugs that share the risk (estrogens, tamoxifen and raloxifene, aromatase inhibitors) Interaction: Toggle oral versus patch to see the liver effect change; add 'immobilized after surgery' to see the risk climb Goes after the heading starting "What estrogen does". Supports `ea-clotting`, `ea-2s-oral`, `ea-warfarin`, `ea-pbox-raloxifene`, `ea-tf-thrombo`.
- [x] **`ecwindow`** (not started): The emergency contraception window. A timeline from intercourse to 5 days: Plan B (high-dose levonorgestrel, over the counter) open to 72 hours, ulipristal (Ella, prescription, a progestin receptor antagonist) open to 120 hours Interaction: Drag a marker along the timeline to see which option is still open and whether it needs a prescription Goes after the heading starting "Anti-progestins and emergency contraception". Supports `ea-ws-ec`, `ea-2s-ec`.

### L19 (`hemeintro`)

- [x] **`hemato`** (not started): Where the blood cells come from. His hematopoiesis tree drawn as a cartoon: one pluripotential stem cell splitting into the lymphoid line (B and T cells, with NK cells) and the myeloid line (red cells, megakaryocytes shedding platelets, granulocytes, monocytes), each end cell labeled with its share of the white count. Interaction: Tap a cell to see its line, its share and its one-line job; a toggle hides the labels for self-testing. Goes after the heading starting "Where the blood cells come from". Supports `hi-hemato`, `hi-wbc-order`, `hi-ws-blood`.
- [x] **`wbc`** (draft in `drafts/`): The five white cells side by side. Cartoon drawings (not stained micrographs) of the neutrophil, eosinophil, basophil, monocyte and lymphocyte at relative size, showing each nucleus shape (multi-lobed, bilobed, bilobed, horseshoe, round with a thin rim) and granule color (fine, red, dark blue), with NK cells drawn as the large lymphocyte. Interaction: Tap a cell for its features, granule contents and job; a quiz mode hides the names and asks which cell has the described features. Goes after the heading starting "Basophils". Supports `hi-ws-nucleus`, `hi-pb-neut`, `hi-pb-eos`, `hi-baso`.
- [x] **`thymus`** (not started): A thymic lobule and T cell education. One lobule: capsule and trabecula, the dark cortex packed with thymocytes, the pale medulla with a Hassall's corpuscle, a cortical capillary with the three layers of the blood-thymus barrier, and the path of a precursor entering by a postcapillary venule, positive selection in the cortex, negative selection in the medulla, and a single-positive cell leaving. Interaction: Step through the education path one stage at a time, with the CD markers at each stage; tap a barrier layer to name it. Goes after the heading starting "Thymic education". Supports `hi-2s-thymus`, `hi-num-btb`, `hi-num-educ`, `hi-stroma`.
- [x] **`node`** (draft in `drafts/`): A lymph node, with its B and T cell zones. A bean-shaped node cut in half: afferent lymphatics entering the capsule, the sinuses, cortex with a primary follicle and a secondary follicle (germinal center, mantle, follicular dendritic cells), the paracortex with high endothelial venules, the medulla, and the artery and efferent lymphatic at the hilum, with B and T zones in two colors. Interaction: Trace two routes: antigen arriving in the afferent lymph, and a lymphocyte arriving from the blood through an HEV; then watch a primary follicle turn into a secondary one. Goes after the heading starting "How lymph and lymphocytes move through a node". Supports `hi-num-bt`, `hi-hev`, `hi-2s-node`, `hi-pb-node`, `hi-fdc`.
- [x] **`spleen`** (not started): The spleen's white and red pulp. A wedge of spleen: trabecula, a central arteriole with its PALS (T cells), an off-center B cell nodule with a germinal center, the marginal zone, then red pulp with splenic cords and sinuses; the arterial path to the penicillar arterioles and a sheathed capillary emptying into a cord (open) beside one draining straight into a sinus (closed); and a close-up of a sinus wall with rod-shaped endothelial cells and hoop-like basal lamina. Interaction: Follow a red cell through the open route and watch it squeeze through a slit; tap each region for what fills it. Goes after the heading starting "Blood flow through the spleen". Supports `hi-pals`, `hi-marginal`, `hi-red-pulp`, `hi-open-circ`, `hi-sinus`.

### L20 (`lymleuk`)

- [x] **`ladder`** (draft in `drafts/`): The neutrophil ladder. The six stages from myeloblast to segmented neutrophil side by side, with the blast's large nucleus and fine chromatin and the promyelocyte's large granules, marking where APL stops and which stages fill CML's blood Interaction: Tap a stage to see its look and which disease lives there Goes after the heading starting "How blood cells mature". Supports `ll-maturation`, `ll-apl-t1517`, `ll-tf-cml-blasts`.
- [x] **`follicle`** (draft in `drafts/`): Where in the follicle. A lymphoid follicle cut open: the germinal center, the mantle zone around it and the marginal zone outside, each labeled with the lymphoma it gives rise to (follicular from the follicle center, mantle cell from the mantle zone, MALT lymphoma from the marginal zone) Interaction: Tap a zone to see its lymphoma, its translocation or link, and its course Goes after the heading starting "Mantle cell lymphoma". Supports `ll-2s-mcl`, `ll-mcl-t1114`, `ll-ws-fl`.
- [x] **`smears`** (draft in `drafts/`): Smear look-alikes. Six cells at the same scale: a myeloblast with an Auer rod, a lymphoblast, a CLL lymphocyte with soccer-ball chromatin beside a smudge cell, an APL promyelocyte with an Auer rod bundle, a Sézary cell with a cerebriform nucleus, and rouleaux Interaction: Pick a cell and name it; the card says what gives it away Goes after the heading starting "Review". Supports `ll-auer`, `ll-ws-aml-all`, `ll-cll-smear`, `ll-2s-pc`.
- [x] **`hnmap`** (not started): Head and neck map. A face and mouth with each presentation in place: gingival hypertrophy (AML), the endemic Burkitt jaw, a perforated hard palate (extranodal NK/T-cell lymphoma), a parotid swelling (MALT after Sjögren), the tonsils, cervical and supraclavicular nodes (Hodgkin), punched-out jaw lesions (myeloma) and the eye (intraocular lymphoma) Interaction: Tap a site for the disease, the clue and the case that goes with it Goes after the heading starting "In the mouth and the head and neck". Supports `ll-amol-case`, `ll-bl-case`, `ll-enktl-case`, `ll-malt-case`, `ll-hl-case`, `ll-mm-case`.
- [x] **`transloc`** (not started): Five translocations. Pairs of chromosomes swapping pieces: 14 and 18 (BCL2 to IGH), 11 and 14 (cyclin D1), 8 and 14 (MYC), 9 and 22 (the short Philadelphia chromosome, BCR::ABL1) and 15 and 17 (PML::RARA), each tagged with its disease Interaction: Tap a pair to swap the pieces and see the fusion, the disease and its drug or course Goes after the heading starting "The translocations side by side". Supports `ll-fl-t1418`, `ll-mcl-t1114`, `ll-bl-case`, `ll-cml-case`, `ll-apl-t1517`.

## Done when

- [x] Every figure above built, checked and placed (notes, Review), and the About page lists them
- [x] High yield narration for L17 and L18 (L19 and L20 recorded too, from their slides; they are recorded again with the
      rest of their narration when they go taught: [that task](../2026-11-16-heme-endo-exam3-l19-l22.md))
- [x] CI passes (`node tools/ci/syntax.js`, `node tools/ci/vault.js`, `node tools/ci/smoke.js`)
- [x] Vault written back (hub note, this note's Outcome)

## Log

- 2026-11-16: written when the hub was merged with its figures part way (Sam was running out of usage).
- 2026-11-17: Sam: "continue with where things left off". All 22 finished (the 12 drafts and the 10 not started), each
  checked at 390 and 760 px in light and dark through every state; placed; High yield recorded for L17-L20 after the study
  guide's rebuild (#393).

## Outcome

All 22 figures shipped on 2026-11-17, numbered Fig 1-22 in lecture order (Exam 2's style), in the notes after the section
each plan names (at both reading levels; High yield shows none, as its paragraphs don't start with an As taught anchor), and
in each lecture's Review under **Diagrams**. Placed after a different section than planned: `wbc` after "Lymphocytes" (the
last of the five white cells; anchored on its first paragraph with `end`, since a High yield paragraph also starts
"Lymphocytes"), `node` in Plain English on "Lymph nodes"' first paragraph (an earlier paragraph starts "Lymph nodes"),
`hnmap` after "Acute monocytic leukemia and the gums" (As taught) and "In the mouth" (Plain English), `follicle` after
"Mantle cell lymphoma", `smears` after "Blasts and Auer rods", `ladder` after "How blood cells mature" and `clots` after
"What estrogen does".

Judgment calls are in each module's `sources` block ("What this shows, and what's simplified"): `tfates` follows Dr.
Fasinu's DHEA correction and gives Proscar 5 mg and Propecia 1 mg from the labels; `gnrh` leaves out FSH and the agonist
flare; `ecwindow` leaves out mifepristone (not an option he taught); `node` gives the size as the notes do, not slide 30;
`spleen` draws both the open and the closed route (the slides contradict each other) and names slide 40's "(PALS)" slip;
`letdown` cites Sarhadi et al. 1996 for the oxytocin release, a citation not checked against the paper. L19's and L20's
figures follow their slides, and are checked against the recordings when those lectures go taught
([that task](../2026-11-16-heme-endo-exam3-l19-l22.md)).

`content/figures.js` is 2.3 MB (580 KB gzipped), fetched only when the notes open, like Occlusion's 1.5 MB. A
figure's place is written three times: `FIG_PLACE` in `content/figures.js`, `figByLec` in `core.json` and the `figs` section
of its Review group in `study.json`; to move or add one, edit all three, then the content build.
