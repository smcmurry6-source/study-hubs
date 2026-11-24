/* study-hubs: the dental case kit (window.shCases), shared by every hub's Patient Box questions.
   One case model -> a periodontal chart, a periapical radiograph and a drawn buccal view, all from the same numbers,
   plus derive() (the 2018 staging and grading, recession types, peri-implant states) and validate() (every number
   realistic and consistent with the others). Loaded by a hub with
     <link rel="stylesheet" href="../../widget/cases.css"> and <script src="../../widget/cases.js"></script>
   before the hub's own script; the hub keeps its cases in PCASES and calls shCases.pboxFigures(q, PCASES) from its
   pboxHTML. How to write a case: vault/how-to/draw-a-patient-box-case.md. CI: node tools/ci/cases.js.

   Anatomy: tooth sizes and shapes follow Wheeler's Dental Anatomy (average crown length, root length, mesiodistal
   width at the contacts and at the cervix; cusp count and position; contact heights; root number, trunk length and
   apical curvature). Charts follow the conventions of a standard probing chart; staging, grading, recession types,
   Glickman classes and peri-implant case definitions as the hubs teach them. Patient Box v2.1 (2026-11-21): crowns by
   material, inlays, onlays and veneers, posts and cores and root canal fillings by quality, fractures, recurrent caries,
   overhangs, open margins and fixed bridges, on every view, from Rosenstiel's Contemporary Fixed Prosthodontics, Cohen's
   Pathways of the Pulp, Andreasen's Textbook and Color Atlas of Traumatic Injuries (crown and root fractures) and White and
   Pharoah (a vertical root fracture's J-shaped radiolucency; a crack that no film shows; a fiber post barely brighter than
   dentin). Everything drawn is original SVG.
   v2.1's clinical calls, settled from outside sources (Sam, 2026-11-21: "Use outside sources to determine answers"):
   - radiopacity, from mm-Al studies: Pekkan et al., J Prosthet Dent 2011;106:109 (zirconia about as radiopaque as base metals and
     above enamel; IPS e.max Press and feldspathic porcelains not different from dentin), Atala et al., J Esthet Restor Dent
     2019;31:88 (e.max CAD equal to dentin), Erzurumlu et al., Clin Oral Investig 2021;25:5735 (e.max CAD and Vita Mark II above
     dentin; resin cements above enamel), Hitij and Fidler, Clin Oral Investig 2013;17:1167 (every composite above dentin, most above
     enamel), Balci et al., Oper Dent 2023;48:337 (amalgam highest; enamel about 2 mm Al per mm, dentin about 1): so gold, amalgam
     and a PFM's metal brightest, zirconia close to them, then enamel and composite, lithium disilicate between dentin and enamel,
     feldspathic porcelain about dentin's (cases.css);
   - the access cavity of an uncrowned root-filled tooth: the whole chamber roof removed, its walls flaring a little to the occlusal
     (Cohen's), on the lingual of an incisor or canine (directly over the chamber, as ADEX's endodontic criteria have it) and the
     occlusal of a premolar or molar; restored with a bonded composite (amalgam under an amalgam), and needed: Ray and Trope, Int
     Endod J 1995;28:12 (the coronal restoration's quality matters to the periapex as much as the filling's). A veneer doesn't
     seal a lingual access (validate());
   - a filling counts as short more than 2 mm from the radiographic apex (Sjogren et al., J Endod 1990;16:498; Schaeffer, White and
     Walton, J Endod 2005;31:271: 0-1 mm best, over the apex worst); 4-5 mm of gutta-percha left under a post (Rahimi et al., J Oral
     Sci 2008;50:435: the seal improves with each mm kept from 4 to 6);
   - a stainless steel crown on a permanent tooth is for a molar (AAPD, Pediatric restorative dentistry, Reference Manual 2026:
     primary teeth and permanent molars);
   - a vertical root fracture without root canal treatment or a restoration is rare but real (Liao et al., J Endod 2017;43:687 and J
     Pers Med 2021;11:1375: mostly attrited first molars of older patients, the mandibular mesial root): allowed on a molar marked
     vital:true, an error elsewhere;
   - calculus on a film kept as drawn (a spur about 0.5 mm proud, 1-2.5 mm long, just apical to the CEJ): films show only the
     thicker, more extensive proximal deposits (Buchanan et al., J Periodontol 1987;58:747: 44% of surfaces; Hyer et al., J
     Periodontol 2021;92:419: about half);
   - the odontogram's bridge: the units joined by a bar, a pontic's crown drawn and its root crossed out (the usual charting
     convention for a pontic: an X through the missing tooth's roots, the crowns outlined, a line joining the units).
   Decay seen from the buccal (Sam, 2026-11-21: the drawn view shows fillings and decay, "Yes"), drawn anew from: Fejerskov, Nyvad
   and Kidd, Dental Caries: The Disease and its Clinical Management (smooth-surface lesions form along the gingival margin where
   plaque stays; active lesions chalky and matte, arrested ones shiny and brown); the ICDAS II visual criteria (Ismail et al.,
   Community Dent Oral Epidemiol 2007;35:170: codes 1-2 a white or brown spot, 3 an enamel break, 5-6 a cavity into dentin); Nyvad
   and Fejerskov, Int Dent J 1982;32:311 and Fejerskov's root caries chapters, with Banting's root caries index (root caries
   only on an exposed root, near the CEJ and the margin, spreading along the CEJ more than in depth; active yellowish to light
   brown and soft, arrested dark brown to black and hard); Sturdevant's Art and Science of Operative Dentistry (Class V lesions and
   outlines; a Class III lesion seen as a shadow through the labial enamel; a Class II box's buccal wall just clear of the contact,
   so a sliver of the restoration shows at the crown's outline; most Class III restorations placed from the lingual); Mjor and
   Toffenetti, Quintessence Int 2000;31:165 (secondary caries mostly at the gingival margin); White and Pharoah (a buccal or
   lingual lesion is hard to see on a film: sound tooth lies in front of it). See buccalLesion() and viewResto().
   Patient Box v2.2 (2026-11-24): proximal root caries, root tips, resorption, sealants, temporary restorations and a case's own
   clinical tests, each call settled from outside sources (Sam, 2026-11-21: "Use outside sources to determine answers"):
   - proximal root caries: root caries forms only on a root bared to the mouth (Nyvad and Fejerskov; Banting's root caries index),
     and the proximal surfaces are among the most affected, most of all in the upper jaw (Katz et al., Caries Res 1982;16:265), under
     the contact where interdental attachment and the papilla are lost. On a film (White and Pharoah) it is a saucer- or
     crater-shaped radiolucency on the root between the CEJ and the bone crest, its inner margin ill defined; cervical burnout is a
     band at the neck between the enamel's edge and the crest with the root's outline intact, which changes with the angle. So
     validate() wants interdental recession of at least 1 mm at that side's site and the crest at least 2.5 mm from the CEJ, and the
     buccal view doesn't show it (rootCarSVG());
   - root tips: a retained root (its crown lost to decay, the chamber open at the ragged top) or a fragment left in a healed socket
     after an extraction, the commonest finding on panoramic films of edentulous jaws (Sumer et al., Quintessence Int 2007; Kose et
     al., J Adv Prosthodont 2015;7:380), told from bone by its canal and the PDL space and lamina dura around it (White and Pharoah);
     charted with the crown crossed out, the root that remains drawn solid and a bar across it where it ends (the charting convention
     for a retained root) (stumpSVG(), fragSVG());
   - resorption (Patel, Ricucci, Durak and Tay, J Endod 2010;36:1107; Patel, Kanagasingam and Pitt Ford, J Endod 2009;35:616;
     Heithersay, Quintessence Int 1999;30:27; Andreasen and Hjorting-Hansen, Acta Odontol Scand 1966;24:263): internal a smooth, oval,
     symmetric widening of the canal, the canal's outline lost in it; external cervical an irregular, mottled radiolucency below the
     CEJ with the canal's outline still seen through it (the pericanalar resorption-resistant sheet), in Heithersay's four classes (1
     a shallow defect near the CEJ, 2 near the pulp but little into the root, 3 into the root's coronal third, 4 past it), a pink spot
     through the crown once it reaches under the enamel; external apical a shortened, blunted root; replacement (ankylosis) the PDL
     space and lamina dura gone, the root replaced by bone, the tooth immobile with a high, metallic sound on percussion (rspSVG());
   - sealants: the ADA and AAPD guideline (Wright et al., JADA 2016;147:672) seals the pits and fissures of permanent molars and finds
     a sealant can arrest a non-cavitated lesion, so one may go over an enamel lesion, never a cavity or a dentin lesion; sealants'
     radiopacity runs from below enamel's to about it (Celikel et al.'s mm-Al study, 2024) and a thin one is lost in the enamel, so no
     film draws one (the view draws a buccal pit's, the odontogram every one);
   - temporary restorations: IRM about 5.7 mm Al (Tanomaru-Filho et al., J Appl Oral Sci 2008;16:376) and Cavit about as radiopaque
     (DuBois, Reichl and Hondrum, Mil Med 2000;165:278), both above enamel and dentin, with the small voids of a hand-mixed or
     hand-packed material; at least 3.5 mm of Cavit to seal (Webber et al., Oral Surg Oral Med Oral Pathol 1978;46:123), over a
     cotton pellet in the chamber of a tooth between or after root canal visits, which is radiolucent; a provisional crown's
     materials all below dentin and enamel (Pekkan, Ataturk Univ Dis Hek Fak Derg 2011;(1):28), on its preparation, set with a
     radiopaque zinc oxide-eugenol cement;
   - clinical tests (Cameron, JADA 1964;68:405; AAE, Cracking the Cracked Tooth Code, 2008; Cohen's): a cracked tooth hurts on biting
     one cusp, most on release; transillumination's light stops at a crack, and a full crown blocks it; no one test proves a crack; a
     tooth with apical periodontitis is tender to percussion and to biting; an ankylosed one rings (spec.tests, the case's rows).
   Patient Box v2.3 (2026-11-24): implants on modules ({ m:'implant' }) and an implant-supported bridge, each call settled from outside
   sources and the PCD Implants lectures:
   - peri-implant states: the 2017 World Workshop's case definitions (Berglundh et al., J Clin Periodontol 2018;45(S20):S286; Renvert,
     Persson, Pirih and Camargo, J Clin Periodontol 2018;45(S20):S278): health no bleeding or suppuration and no bone loss beyond the
     initial remodeling; mucositis bleeding and/or suppuration, no bone loss beyond it; peri-implantitis bleeding and/or suppuration,
     deeper probing and bone loss beyond it. With no earlier records, the consensus asks for all three of bleeding or suppuration, a
     probing depth of 6 mm or more and bone 3 mm or more apical to the implant's most coronal intraosseous part; the lecture (PCD
     Implants, peri-implant disease) teaches the depth and the bone as either one, and derive() keeps the lecture's (the hubs teach it;
     a case that wants both readings to agree has both). The initial remodeling is under 2 mm (the lecture); more than half the
     implant's length of bone lost, or any mobility, is a failed implant (the lecture; ICOI Pisa, Misch et al., Implant Dent 2008;17:5);
   - the numbers an implant module writes: healthy peri-implant mucosa 3 to 4 mm tall over the crest (barrier epithelium about 2 mm,
     connective tissue 1 to 1.5 mm: Berglundh and Lindhe, J Clin Periodontol 1996;23:971; the lecture), taller between teeth than on
     the facial (Kan et al., J Periodontol 2003;74:557); a probe stops at the connective tissue's level in health, about 1.5 mm short
     of the bone, and goes past it, close to the bone, when the tissue is inflamed (Lang, Wetzel, Stich and Caffesse, Clin Oral
     Implants Res 1994;5:191; Abrahamsson and Soldini, J Clin Periodontol 2006;33:290). So validate() wants an implant's pocket base
     within 2.5 mm above the bone and no more than half a millimeter below it, and the margin at least a millimeter above it; its
     recession and attachment are measured from the platform;
   - where implants go: 1.5 mm from a tooth's root and 3 mm from another implant (the lecture; Tarnow, Cho and Wallace, J Periodontol
     2000;71:546: 3 mm or less between implants loses more crestal bone; Esposito, Ekestubbe and Grondahl, Clin Oral Implants Res
     1993;4:151; Grunder, Gracis and Capelli, Int J Periodontics Restorative Dent 2005;25:113), with the diameters of the common
     bone-level systems (narrow 3.3 mm for a lower incisor or an upper lateral, regular 4.1, wide 4.8 for a molar) and 10 mm long
     unless a case says; one too close isn't drawn;
   - retention: cement-retained or screw-retained; excess cement left under the margin was found in 81% of peri-implant disease cases
     (Wilson, J Periodontol 2009;80:1388) and the lecture puts cement-retained crowns at higher risk; most cements show on a film, some
     barely (Wadhwani, Hess, Faber, Pineyro and Chen, J Prosthet Dent 2010;103:295). A screw-retained crown's access channel is sealed
     with PTFE tape over the screw head and composite above it (Moraguez and Belser, J Prosthet Dent 2010;103:189). On the film a
     metal, metal-ceramic or zirconia crown is as radiopaque as metal and hides the abutment, lithium disilicate is about dentin's and
     shows it (Pekkan, Pekkan, Hatipoglu and Tuna, J Prosthet Dent 2011;106:109);
   - an implant-supported bridge: two implants carry a three-unit bridge, not usually four (the lecture: a span flexes with its cube),
     and implant fixed partial dentures do well (Pjetursson et al., Clin Oral Implants Res 2012;23(S6):22); never an implant joined to
     a tooth (the lecture: the tooth moves 25 to 100 um in its ligament, the implant 3 to 5 um; Lang, Pjetursson, Tan, Bragger, Egger
     and Zwahlen, Clin Oral Implants Res 2004;15:643: lower survival and intrusion of the tooth). Lithium disilicate stays a bridge
     material up to the second premolar, as on teeth.
   Patient Box v2.4 (2026-11-24): removable partial and complete dentures, overdenture abutments, cantilever, resin-bonded and
   provisional bridges ({ m:'denture' }; the bridge module's cantilever and type), each call settled from outside sources. The
   textbooks (McCracken's Removable Partial Prosthodontics, Carr and Brown; Zarb's Prosthodontic Treatment for Edentulous Patients;
   Shillingburg's Fundamentals of Fixed Prosthodontics; Rosenstiel's Contemporary Fixed Prosthodontics) are as their teaching
   summaries give them; the papers were checked against their PubMed records:
   - Kennedy's classes (the Glossary of Prosthodontic Terms, 10th ed., J Prosthet Dent 2023;130(4 Suppl 1):e1) and Applegate's rules
     (McCracken's): classify after the planned extractions; a missing third molar, or second molar, the denture doesn't replace isn't
     counted; the most posterior space sets the class (I both sides free-ended, II one side, III bounded, IV one bounded space across
     the midline in front of the teeth left); every other space is a modification, counted, whatever its size; Class IV has none.
     derive() works it out (kennedy) and the box never states it; a tooth missing inside the arch that nothing replaces is refused;
   - rests (McCracken's): an occlusal rest on a premolar or molar in its marginal ridge, the side next to the denture base, and on
     a distal-extension abutment the mesial (a distal rest next to the free-end base tips the abutment toward it as the base
     rotates); a cingulum rest on a maxillary canine (or several maxillary incisors); a mandibular canine's cingulum has too little
     enamel, so it takes an incisal rest at its distoincisal angle, the least preferred rest and a last resort on an incisor;
   - clasps (McCracken's; Davenport et al., Br Dent J 2001;190:71; Owen and Naidoo, Int Dent J 2022;72:58): every clasp has its rest;
     the retentive arm's tip in the gingival third, in a 0.25 mm undercut for cast cobalt-chromium, usually on the buccal with the
     rigid reciprocal arm on the lingual; the RPI (Kratochvil, J Prosthet Dent 1963;13:114; Krol, J Prosthet Dent 1973;29:408) on a
     distal-extension abutment: a mesio-occlusal rest, a distal proximal plate on a guide plane and an I-bar in the gingival third
     near the middle of the buccal, its approach arm 3-4 mm from the gingival margin, so the plate and bar move away from the tooth
     as the base rotates; clasps on both sides of the arch; no clasp on a tooth with mobility 2 or more (an abutment's support; the
     abutments do well with yearly recall: Bergman, Hugoson and Olsson, J Prosthet Dent 1982;48:506 and J Oral Rehabil 1995;22:595);
   - major connectors and indirect retainers (McCracken's; the Glossary): a lingual bar needs 8 mm from the lingual gingival margins
     to the raised floor of the mouth (its upper border 4 mm below them, the bar about 4 mm tall), else a lingual plate (also for
     tori, a high frenum or anterior teeth that need support); the upper connectors a palatal strap, an anterior-posterior strap, a
     horseshoe or a complete palate (chosen by the class, not refused by it). A Class I or II denture has an indirect retainer, a
     rest on the far side of the fulcrum line from its free-end base: a canine's or first premolar's;
   - films are taken with removable prostheses out (Iannucci and Howerton, Dental Radiography: patient preparation): its framework
     would shadow the teeth, so every film here is drawn without the denture and says so. A denture's acrylic is radiolucent (Tsuge,
     J Oral Sci 2009;51:223: under 0.5 mm Al per 2 mm, dentin 2.3; Bloodworth and Render, J Prosthet Dent 1992;67:121);
   - the edentulous ridge resorbs most in the first year and slowly after it, the anterior mandible about four times as fast as the
     maxilla (Tallgren, J Prosthet Dent 1972;27:120; Atwood and Coy, J Prosthet Dent 1971;26:280; Cawood and Howell, Int J Oral
     Maxillofac Surg 1988;17:232): the denture's ridge (mm below the neighbors' crests; 1.5 by default, 0-15) on the film and the view;
   - a front bounded space's labial flange (Faigenblum, Prim Dent J 2023;12(3):55-63; Dental Update's "Successful removable partial
     dentures"; McCracken's): where the ridge has not resorbed significantly the front teeth are gum-fitted (open face), set on
     the ridge with no flange, for the most natural look; where it has resorbed a little and the smile line is low, a partial
     flange about 1 mm past the ridge's crest; where it has resorbed significantly, a full labial flange, to set the teeth back
     where they stood and support the lip. The papers give no millimeters: the kit's reading is none to 1.5 mm (no more than a
     socket's usual healing, Tan 2012), partial to 3 and full past it, chosen from the ridge by default (flange sets it) and
     refused past those. A gum-fitted tooth stands in the gum as a bridge's pontic does, its margin where the ridge's crest is;
     a complete denture's base has its flange all round. No cingulum rest on a mandibular canine (above; Sam, 2026-11-24);
   - overdenture abutments (Zarb's; Leong et al., Cureus 2024;16:e53184; Crum and Rooney, J Prosthet Dent 1978;40:610: less bone lost
     under them): a canine first, then a premolar, with at least half its bone support; root-filled, cut to a dome about 2-3 mm
     above the gingival margin and its canal's orifice sealed with amalgam, composite or glass ionomer, which do alike (Keltjens et
     al., J Dent 1999;27:551); a fifth were lost over up to 22 years, to periodontal disease, periapical lesions and caries, more
     often without daily fluoride and recall (Ettinger and Qian, JADA 2004;135:739). A vital abutment, a coping and an
     implant-retained overdenture aren't drawn yet;
   - cantilevers (Shillingburg's, via Hill, Compend Contin Educ Dent 2009;30:580; Rosenstiel's; Pjetursson, Tan, Lang, Bragger,
     Egger and Zwahlen, Clin Oral Implants Res 2004;15:667: 81.8% at 10 years, abutments losing vitality the commonest problem):
     one small pontic; a single abutment only for a maxillary lateral incisor from the canine; a first premolar from the second
     premolar and first molar splinted, cantilevered mesially (the pontic past the last abutment, distally, rests on expert opinion
     and finite-element studies: refused); a molar only as a premolar-sized pontic on two splinted premolars (not drawn); never a
     canine (it guides the excursions); not on implants here;
   - resin-bonded bridges (Livaditis and Thompson, J Prosthet Dent 1982;47:52; Kern, Quintessence Int 2005;36:141 and Kern and
     Sasse, J Adhes Dent 2011;13:407: single-retainer 94.4% at 10 years, two-retainer 73.9%; Kern, Passia, Sasse and Yazigi, J Dent
     2017;65:51; Kern and Glaser, J Esthet Restor Dent 2023;35:64; Pjetursson et al., Clin Oral Implants Res 2008;19:131; Thoma et
     al., Clin Oral Implants Res 2017;28:1421): a metal or zirconia wing (zirconia at least 0.7 mm) bonded to the lingual enamel of
     an uncrowned abutment, wrapping the proximal next to the pontic, its margin above the gingiva, with no restoration where it
     bonds; one pontic, an incisor's,
     canine's or premolar's; the single-retainer cantilever for an incisor (Kern prefers the central incisor for a lateral), the
     two-retainer design debonding one wing unnoticed; not on a mobile abutment. On a film the wing lies over the crown as a
     radiopaque band;
   - a provisional bridge: PMMA or bis-acryl on temporary cement, less radiopaque than dentin (Pekkan 2011; Tsuge 2009), drawn as
     v2.2's provisional crown is;
   - the view's gingiva over a gap: a healed socket's buccal crest about 1.2 mm lower after six months (Tan, Wong, Wong and Lang,
     Clin Oral Implants Res 2012;23 Suppl 5:1: 1.24 mm buccal, about 0.8 mm at the neighbors, its soft tissue a little thicker),
     so one smooth ridge from the neighbors' margins, their papilla on that side gone, and past it the mouth, dark; under a
     denture the denture's ridge. The base's flange covers the ridge: into the vestibule over a free end or a complete arch, and
     over a bounded space a rounded collar just past it.
   The odontogram's marks follow no single standard (charting conventions vary by school and software): a denture's teeth crossed
   out and joined by its base, as the common teaching charts draw them, with every mark in its key. */
(function(){
  'use strict';
  var I = {};
  function f1(v){ return +(+v).toFixed(1); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var TL = window.SH_TEETH;
  if(!TL) throw new Error('widget/cases.js needs widget/teeth.js (window.SH_TEETH) loaded first');
  var dense = TL.dense, rnd = TL.rnd;
  function poly(pts, open){ return 'M' + pts.map(function(p){ return f1(p[0]) + ' ' + f1(p[1]); }).join('L') + (open ? '' : 'Z'); }
  function path(cls, pts, open, style){ return '<path class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + ' d="' + poly(pts, open) + '"/>'; }
  function txt(x, y, t, cls, anchor){ return '<text class="' + (cls || 'dc-t') + '" x="' + f1(x) + '" y="' + f1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(t) + '</text>'; }
  function dot(cls, x, y, r){ return '<circle class="' + cls + '" cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '"/>'; }

  /* ---------- the teeth: the tooth library (widget/teeth.js, window.SH_TEETH), shared with the figure builds ----------
     Wheeler's sizes and outlines for the 16 types (XT, crownMM, rootsMM, backRootMM), the numbering helpers and one
     catalogue entry per tooth (surfaces, roots, furcation entrances, root trunk, sites, landmarks, films). */
  var XT = TL.XT, POS = TL.POS, isUpper = TL.isUpper, posOf = TL.posOf, typeOf = TL.typeOf, dims = TL.dims, mesialRight = TL.mesialRight,
    isMolar = TL.isMolar, viewOrder = TL.viewOrder, siteOrder = TL.siteOrder, SITE_NAME = TL.SITE_NAME,
    crownMM = TL.crownMM, rootsMM = TL.rootsMM, backRootMM = TL.backRootMM, CAT = TL.tooth;
  function hasFurc(n){ var c = CAT(n); return !!(c && c.furcations.length); }
  /* ---------- modules (Patient Box v2): a case assembled from a few choices, the per-tooth numbers written from them ----------
     spec.modules is a list applied in order, then spec.t (the per-tooth numbers, as in v1) is laid over the result
     field by field, so an author can still set one number by hand. Each module:
       { m:'missing', teeth:[...] }                                  the teeth are gone (the odontogram's X)
       { m:'restoration', tooth, surfaces:'MOD', material }          amalgam | composite | gold | crown (crown: all surfaces)
       { m:'caries', tooth, surface:'D', depth }                     enamel | dentin | pulp
       { m:'endo', tooth, fill:true, lesion:mm }                     a root canal filling and/or a periapical radiolucency
       { m:'bone', teeth:[...], percent, pattern, defect, side, rec, swell, furc, mob }
           percent: bone loss as a share of the root (a number, or { tooth:percent }); pattern 'horizontal' (default) or
           'vertical' with defect (mm) on side 'm' or 'd'. It writes the bone, the vertical defect and, at all six sites,
           the CAL that agrees with the crest (the pocket base about 1 mm coronal to it, Newman and Carranza), the
           recession (rec, facial mm at the middle site, default 0; the lingual one less) and the probing depth (CAL minus
           recession, at least 2 mm; swell mm of pseudopocket adds to it). Furcations follow the bone past the root trunk
           (Class I within 1.5 mm of it, II from 1.5 mm past, III from 4 mm past, both entrances of a mandibular molar;
           the film shows II and III on a molar), and mobility follows the bone (1 from 55%, 2 from 70%), unless furc:false
           or mob is given.
       { m:'bop', rate:.3, teeth }, { m:'pus', ... }, { m:'plaque', ... }   that share of the sites, the deepest first
       { m:'recession', teeth:[...], mm }                           facial recession at the middle site, the pocket 1 mm
     Patient Box v2.1 (Sam, 2026-11-21: "more possibilities like endodontically treated teeth, fractured teeth, and different
     crown materials"):
       restoration: material:'crown' takes crown:'gold' | 'pfm' | 'zirconia' | 'lithium' (lithium disilicate) | 'ssc' (crown:true,
           or no crown option, is v1's crown, drawn as before); a restoration by surface takes type:'inlay' | 'onlay' (gold or
           ceramic) or 'veneer' (ceramic or composite, the labial surface of an incisor, canine or premolar); any of them takes
           overhang and open ('m', 'd' or 'md': excess past the proximal contour at the gingival margin, or a gap there)
       { m:'endo', tooth, fill:'adequate'|'short'|'long'|'voids', post:'cast'|'metal'|'fiber', core:'amalgam'|'composite'|'cast',
           sep:root, missed:root, widened:true }   fill:true is v1's filling; sep a separated instrument in that root's apical
           third; missed a canal left unfilled (a root the film shows on its own); widened (with fill:false) a widened apical PDL
       { m:'caries', ..., recurrent:true }      under a restoration's (or a crown's) margin, M or D
     Decay seen from the buccal (Sam, 2026-11-21: the drawn view should show fillings and decay, "Yes"):
       { m:'caries', ..., stage:'white-spot' | 'cavitated' }   a smooth-surface lesion's look; by default an enamel lesion is a
           white spot and a dentin or pulp one cavitated. stage 'white-spot' is enamel only (and a white spot on the facial or
           lingual, given explicitly, shows on no film)
       { m:'caries', ..., arrested:true }       an arrested lesion: brown, hard and shiny instead of chalky (a brown spot, a dark
           cavity, a dark root lesion)
       { m:'caries', surface:'B', root:true, depth:'dentin' }   root caries on the exposed facial (or lingual) root: needs that
           surface's recession (at least 1 mm at the middle site); no enamel on a root, so dentin or pulp
       { m:'caries', surface:'B', recurrent:true }   recurrent caries at a buccal margin: a Class V's, a veneer's or a crown's
       { m:'fracture', tooth, type, ... }       crown (an incisor or canine: depth enamel | dentin | pulp, side m | d), cusp
           (a premolar or molar: cusp B | L, or MB | DB | ML | DL), crack (no film shows it), vrf (a vertical root fracture: side
           m | d of root, a narrow pocket pd mm, default 8, at the middle of surface f | l), hrf (a horizontal root fracture: at
           cervical | middle | apical, a single-rooted tooth)
       { m:'bridge', abutments:[a, b], material }   a fixed bridge: crowns on the two abutments, a pontic (material pfm | gold |
           zirconia | lithium) at every tooth between them, each of which must be missing (the missing module)
     Patient Box v2.2 (2026-11-24; the sources are in this file's header):
       { m:'caries', surface:'M' | 'D', root:true, depth }   proximal root caries under the contact: needs interdental recession
           (at least 1 mm at that side's site) and bone loss (the crest at least 2.5 mm from the CEJ); a film finding
       { m:'roottip', tooth, kind:'retained' }   a retained root: the crown lost to decay, the root still in its socket
       { m:'roottip', tooth, kind:'fragment', len:4, root }   a root tip left in a healed socket: the tooth missing, len mm of the
           apex (1.5-6) of one root (a molar's mesial or distal, else its root) still in the bone
       { m:'resorption', tooth, type, ... }   internal (at cervical | middle | apical, size mm across, 1-4), cervical (external
           cervical resorption: side m | d | f | l, heithersay 1-4), apical (mm of root lost, 1-5) or replacement (ankylosis: side
           m | d | md, at, mm of root, 2-10; the tooth immobile); root names one root of a molar
       { m:'sealant', teeth:[...], surfaces:'O' }   pit and fissure sealants: O on a premolar or molar, B a mandibular molar's buccal
           pit, L a maxillary molar's palatal groove or a maxillary incisor's lingual pit
       restoration: material:'temporary' with temp:'irm' | 'cavit' (a direct temporary filling; over a root-filled tooth's access a
           cotton pellet under it); material:'crown' with crown:'provisional' (a temporary crown)
     and spec.tests: [{ test:'bite', tooth, result:'positive' | 'negative', release:true, cusp:'DL' }, { test:'transillumination',
       tooth, result }, { test:'percussion', tooth, result:'normal' | 'tender' | 'metallic' }]: the case's clinical tests, which the
       box's rows give and validate() holds to the record (a positive bite test or transillumination needs what causes it)
     Patient Box v2.3 (2026-11-24; the sources are in this file's header): implants on modules, in place of v1's per-tooth numbers
       { m:'implant', tooth (or teeth), state:'health' | 'mucositis' | 'peri-implantitis' | 'failed' | 'healing', w, len, crown,
           retention:'cement' | 'screw', cement:true, baseline:1.5 | { m, d } | false, loss, bone, rec, swell, bop, pus, mob, cover,
           years, weeks }   writes implant, bone (mm below the platform), pd, rec, bop, pus, halo and mob (implantModule()): w and len
           in mm (by default 3.3 for a lower incisor or an upper lateral, 4.8 for a molar, 4.1 elsewhere; 10 long); crown the implant
           crown's material (gold, pfm, zirconia, lithium, provisional); baseline the bone on the film at the crown's delivery (1.5 mm
           by default; false: no earlier films or probings, so the 2017 rule for a patient without records decides); loss mm lost
           since (peri-implantitis: 3 by default); rec mm the facial mucosa has receded from where it healed, swell mm it is swollen
           (mucositis: 1); bop a share of the sites (every site of an inflamed implant by default); pus at the deepest site of each
           surface; failed: mobile (mob 1) with a radiolucent line round it, cover:true when it failed before it was uncovered;
           healing: under its cover screw, no crown and no probing; years since the crown was delivered, weeks since placement
       { m:'bridge', abutments:[a, b], material } on two implants (each in an implant module): an implant-supported bridge, drawn on
           every view; never an implant joined to a tooth, and one pontic between two implants
     Patient Box v2.4 (2026-11-24; the sources are in this file's header):
       { m:'denture', type:'partial', arch, connector, floor, ridge, years, replaces:[...], clasps:{ n:'circumferential' | 'rpi' },
           rests:{ n:'m' | 'd' | 'md' | 'cingulum' | 'incisal' } }   a removable partial denture: it replaces every missing tooth of
           its arch but the third molars and a bridge's pontics (or replaces); a clasp's rest, where rests gives none, is worked out;
           connector strap | ap-strap | horseshoe | palate (upper), bar | plate (lower); floor the lingual gingival margins to the
           floor of the mouth, mm (a lingual bar needs 8); ridge the edentulous ridge's resorption, mm; years worn; flange
           'none' | 'partial' | 'full' over a front bounded space (incisors and canines): by default from the ridge
       { m:'denture', type:'complete', arch, ridge, years, abutments:[...], seal:'amalgam' | 'composite' | 'gi' }   a complete
           denture: every tooth of the arch missing but its overdenture abutments, each root-filled (the endo module may give its
           fill), cut to a dome and sealed
       { m:'bridge', abutments:[a] (or two side by side, splinted), cantilever:'n', material }   a cantilever bridge: its one
           pontic n held from one side
       { m:'bridge', type:'resin-bonded', abutments:[a, b] (or [a] with cantilever), material:'metal' | 'zirconia' }   a
           resin-bonded bridge: wings on the abutments' lingual enamel, the pontic porcelain on the metal framework or zirconia
       bridge material:'provisional' (a provisional bridge)
     The record keeps everything else (age, smoke, hba1c, cc, mouth, gingiva), and the box rows, every view and the key
     are drawn from it. */
  var MAT = ['amalgam', 'composite', 'gold', 'crown'], DEPTH = ['enamel', 'dentin', 'pulp'];
  var RMAT = ['amalgam', 'composite', 'gold', 'ceramic', 'temporary'], RTYPE = ['direct', 'inlay', 'onlay', 'veneer'], CROWNS = ['gold', 'pfm', 'zirconia', 'lithium', 'ssc', 'provisional'], BRIDGES = CROWNS.slice(0, 4).concat('provisional');
  var CROWN_NAME = { gold:'full gold crown', pfm:'porcelain-fused-to-metal crown', zirconia:'zirconia crown', lithium:'lithium disilicate crown', ssc:'stainless steel crown', provisional:'provisional (temporary) crown' };
  /* v2.2: temporary fillings, resorption, root tips, sealants, clinical tests */
  var TEMPS = ['irm', 'cavit'], TEMP_NAME = { irm:'IRM', cavit:'Cavit' }, RSP = ['internal', 'cervical', 'apical', 'replacement'], AT_T = { cervical:.22, middle:.5, apical:.75 };
  var RSP_KEYS = { internal:['type', 'at', 'size', 'root'], cervical:['type', 'side', 'heithersay', 'root'], apical:['type', 'mm', 'root'], replacement:['type', 'side', 'at', 'mm', 'root'] };
  var TESTS = ['bite', 'transillumination', 'percussion'], RESULTS = { bite:['positive', 'negative'], transillumination:['positive', 'negative'], percussion:['normal', 'tender', 'metallic'] };
  var FILLS = ['adequate', 'short', 'long', 'voids'], POSTS = ['cast', 'metal', 'fiber'], CORES = ['amalgam', 'composite', 'cast'];
  var FX = ['crown', 'cusp', 'crack', 'vrf', 'hrf'], HRF_AT = ['cervical', 'middle', 'apical'];
  /* v2.3: implants on modules. The states the module writes numbers for; the implant record's own fields; the crowns an implant
     carries (no stainless steel crown: that is a molar tooth's); how far an implant's platform must stay from a tooth's root and
     from another implant (the lecture's 1.5 mm and 3 mm: Grunder 2005, Tarnow 2000); the mucosa's height above the bone in health
     (3-4 mm: Berglundh and Lindhe 1996), and how far above the bone the probe stops in each state (Lang 1994; Abrahamsson and
     Soldini 2006) */
  var ISTATES = ['health', 'mucositis', 'peri-implantitis', 'failed', 'healing'], IKEYS = ['w', 'len', 'baseline', 'cement', 'cover', 'retention', 'years', 'weeks'];
  var ICROWNS = ['gold', 'pfm', 'zirconia', 'lithium', 'provisional'], RETAIN = ['cement', 'screw'], TO_TOOTH = 1.5, TO_IMPLANT = 3;
  var PLAT = 1.1, MUCOSA = 3.5, PROBE_GAP = { health:1.5, mucositis:1, 'peri-implantitis':.5, failed:.5 };
  /* the width an implant gets by default where the author gives none: narrow (3.3) for a lower incisor or an upper lateral, wide
     (4.8) for a molar, regular (4.1) elsewhere (the narrow, regular and wide sizes of the common bone-level systems) */
  /* v2.4: dentures, overdenture abutments, cantilever, resin-bonded and provisional bridges (the sources are in this file's header).
     A partial denture's clasps and rests, its major connector by arch, an overdenture abutment's seal over its canal, a resin-bonded
     bridge's retainer wings */
  var DENT = ['partial', 'complete'], CLASPS = ['circumferential', 'rpi'], REST_AT = ['m', 'd', 'md', 'cingulum', 'incisal'], SEALS = ['amalgam', 'composite', 'gi'], WINGS = ['metal', 'zirconia'];
  var CONNECTORS = { upper:['strap', 'ap-strap', 'horseshoe', 'palate'], lower:['bar', 'plate'] };
  var CONNECTOR_NAME = { strap:'a palatal strap', 'ap-strap':'an anterior-posterior palatal strap', horseshoe:'a horseshoe (U-shaped) connector', palate:'a complete palatal plate', bar:'a lingual bar', plate:'a lingual plate' };
  var REST_NAME = { m:'mesial occlusal', d:'distal occlusal', md:'mesial and distal occlusal', cingulum:'cingulum', incisal:'incisal' };
    var CLASP_NAME = { circumferential:'circumferential clasp', rpi:'RPI clasp (a mesial rest, a distal proximal plate and an I-bar)' }, SEAL_NAME = { amalgam:'amalgam', composite:'composite', gi:'glass ionomer' };
  var DKEYS = ['type', 'connector', 'years', 'floor', 'ridge', 'replaces', 'flange'], LINGUAL_BAR = 8, RIDGE = 1.5;
  /* a front bounded space's labial flange by how far its ridge has resorbed (Faigenblum 2023): none (the tooth gum-fitted on the
     ridge) to 1.5 mm, no more than a socket's usual healing; a partial flange to 3; past that a full one */
  var FLANGES = ['none', 'partial', 'full'], FLANGE_NONE = 1.5, FLANGE_PARTIAL = 3;
  function archNums(arch){ var o = []; for(var i = arch === 'upper' ? 1 : 17, e = i + 16; i < e; i++) o.push(String(i)); return o; }
  function archOf(n){ return isUpper(n) ? 'upper' : 'lower'; }
  /* a tooth's neighbor toward the midline (mesial) or away from it (distal) in its arch; the two centrals are each other's mesial */
  function nbr(n, mesial){ var p = posOf(n), out = null; [+n - 1, +n + 1].forEach(function(b){ if(b < 1 || b > 32 || !adjacent(n, b)) return; var q = posOf(b); if(mesial ? (q < p || (q === 1 && p === 1)) : q > p) out = String(b); }); return out; }
  /* a distal-extension (free-end) abutment: the tooth distal to it is one the denture replaces, and everything past it to the end of
     the arch is gone. get(n) gives { dent, gone } from whichever record is at hand (expand's raw one, or tooth()) */
  function freeEnd(n, get){ var b = nbr(n, false); if(!b || !get(b).dent) return false; while(b){ if(!get(b).gone) return false; b = nbr(b, false); } return true; }
  function implantW(n){ var c = CAT(n); if(!c) return 4.1; return c.pos >= 6 ? 4.8 : (c.pos === 2 || (c.pos === 1 && c.arch !== 'upper')) ? 3.3 : 4.1; }
  function sides2(v, def){ return v && typeof v === 'object' ? { m:+(v.m != null ? v.m : def), d:+(v.d != null ? v.d : def) } : { m:v == null ? def : +v, d:v == null ? def : +v }; }
  /* the roots a film shows one by one (the canals it can judge): a molar's mesial and distal (buccal) roots, else the one in front */
  /* a class name built from the record's data only when the value is one the kit knows (the rest is markup) */
  function oneOf(v, list, pre){ return list.indexOf(v) >= 0 ? pre + v : ''; }
  function filmRoots(n){ var c = CAT(n); return c ? (c.pos >= 6 ? c.roots.slice(0, 2) : [c.roots[0]]) : []; }
  function cuspsOf(n){ var c = CAT(n); return !c || c.pos < 4 ? [] : c.pos >= 6 ? ['MB', 'DB', 'ML', 'DL'] : ['B', 'L']; }
  function adjacent(a, b){ a = +a; b = +b; return Math.abs(a - b) === 1 && isUpper(a) === isUpper(b); }
  function bridgeSpan(a, b){ a = +a; b = +b; if(isUpper(a) !== isUpper(b)) return null; var o = [], lo = Math.min(a, b), hi = Math.max(a, b); for(var i = lo + 1; i < hi; i++) o.push(String(i)); return o; }
  function toothKeys(t){ return Object.keys(t || {}).filter(function(k){ return /^\d+$/.test(k) && +k >= 1 && +k <= 32; }); }
  function ensure(t, n){ n = String(n); if(!t[n]) t[n] = {}; return t[n]; }
  function list(v){ return Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)]; }
  function normSurf(n, s){ var c = CAT(n); return String(s || '').toUpperCase().split('').map(function(x){ if(!c) return x; if(x === 'B' || x === 'F') return c.surfaces[3]; if(x === 'O' || x === 'I') return c.surfaces[1]; return x; }).join(''); }
  function boneModule(t, md, probs){
    list(md.teeth).forEach(function(n){
      var c = CAT(n); if(!c){ probs.push('bone: tooth ' + n + ' is not a universal number'); return; }
      var pct = typeof md.percent === 'object' && md.percent ? (md.percent[n] || 0) : (md.percent || 0), d = c.dims, r = ensure(t, n);
      var vert = md.pattern === 'vertical', side = md.side === 'd' ? 'd' : 'm', vd = vert ? (md.defect || 0) : 0;
      r.bone = { m:pct, d:pct }; r.vdef = vert ? (side === 'm' ? { m:vd } : { d:vd }) : {};
      function crest(sd){ return Math.max(1.5, pct / 100 * d.rl) + (r.vdef[sd] || 0); }
      var cm = crest('m'), cd = crest('d'), base = Math.max(1.5, pct / 100 * d.rl);
      var calI = function(cr){ return pct || vd ? Math.max(0, Math.round(cr - 1)) : 0; };
      var calMid = pct ? Math.max(0, Math.round(base - 1.5)) : 0;
      var recF = md.rec || 0, recL = Math.max(0, recF - 1), sw = md.swell || 0;
      r.pd = {}; r.rec = {};
      ['f', 'l'].forEach(function(s){
        var R = s === 'f' ? recF : recL, cals = [calI(cm), calMid, calI(cd)], recs = [Math.max(0, R - 1), R, Math.max(0, R - 1)];
        r.pd[s] = []; r.rec[s] = [];
        cals.forEach(function(cal, i){
          var rec = cal === 0 && recs[i] === 0 ? -2 : recs[i], pd = cal - rec;
          if(pd < 2){ pd = 2; rec = cal - 2; }
          pd += sw; rec -= sw;
          r.pd[s].push(pd); r.rec[s].push(rec);
        });
      });
      if(md.furc !== false && c.furcations.length && c.trunk){
        var past = base - c.trunk;
        var cls = past < -1.5 ? 0 : past < 1.5 ? 1 : past < 4 ? 2 : 3;
        if(cls){ r.furc = { f:cls, l:cls }; var onFilm = c.furcations.some(function(e){ return e.film; }); r.furcX = onFilm && cls >= 2 ? cls : 0; }
      }
      if(md.mob != null) r.mob = md.mob; else r.mob = pct >= 70 ? 2 : pct >= 55 ? 1 : 0;
    });
  }
  /* v2.3: an implant from its state. The record's numbers follow, as the bone module's do: the bone today in mm below the platform
     (the baseline, plus loss), the mucosal margin 3.5 mm above the bone the mucosa healed on (the lecture's 3-4 mm), 1 mm higher
     between the teeth (the papilla), and the probe's stop above the bone by state: 1.5 mm in health (the connective tissue zone),
     1 mm in mucositis and 0.5 mm in peri-implantitis or at a failed implant, where it passes the inflamed tissue to near the bone
     (Lang 1994). Swelling moves the margin up (mucositis: 1 mm by default), recession down. Every site bleeds once it is inflamed
     (bop: a share of them instead), and pus wells from the deepest site of each surface. A failed implant is mobile with a
     radiolucent line around it; a healing one sits under its cover screw, unprobed. */
  function implantModule(t, n, md, w, probs){
    var c = CAT(n); if(!c){ probs.push(w + 'tooth ' + n + ' is not a universal number'); return; }
    var st = md.state || 'health', r = ensure(t, n), im = { w:md.w != null ? md.w : implantW(n), len:md.len != null ? md.len : 10 };
    if(ISTATES.indexOf(st) < 0){ probs.push(w + 'state must be ' + ISTATES.join(', ')); return; }
    ['retention', 'years', 'weeks'].forEach(function(k){ if(md[k] != null) im[k] = md[k]; });
    if(md.cement) im.cement = true;
    if(md.loss != null && st !== 'peri-implantitis' && st !== 'failed') probs.push(w + 'bone loss past the baseline is peri-implantitis (or a failed implant): ' + st + ' has none');
    if(md.cover && st !== 'healing' && st !== 'failed') probs.push(w + 'a cover screw is a healing implant\'s (state healing), or one that failed before it was uncovered (state failed)');
    if(st === 'healing' || md.cover){
      ['crown', 'baseline', 'rec', 'swell', 'pus', 'bop', 'years'].forEach(function(k){ if(md[k] != null && md[k] !== false) probs.push(w + 'an implant under its cover screw has no ' + (k === 'years' ? 'crown delivered (give weeks since placement)' : k === 'crown' || k === 'baseline' ? k + ' yet' : 'probing (' + k + ')')); });
      im.cover = true; r.implant = im; var b0 = sides2(md.bone, 0), l0 = st === 'failed' ? sides2(md.loss, 0) : { m:0, d:0 }; r.bone = { m:b0.m + l0.m, d:b0.d + l0.d };
      if(st === 'failed'){ r.halo = true; r.mob = md.mob != null ? md.mob : 1; }
      return;
    }
    var base = md.baseline === false ? null : sides2(md.baseline, 1.5);
    if(base) im.baseline = { m:base.m, d:base.d };
    var loss = sides2(md.loss, st === 'peri-implantitis' ? 3 : 0), from = base || sides2(null, 1.5);
    var bone = md.bone != null ? sides2(md.bone, 0) : { m:from.m + loss.m, d:from.d + loss.d };
    r.implant = im; r.bone = bone;
    if(md.crown) r.crown = md.crown;
    if(st === 'failed'){ r.halo = true; r.mob = md.mob != null ? md.mob : 1; }
    var healed = (from.m + from.d) / 2, swell = md.swell != null ? md.swell : st === 'mucositis' ? 1 : 0, gap = PROBE_GAP[st];
    /* the margin heals about MUCOSA mm over the crest; rec (facial, as the recession module's) moves it apically, a millimeter less at
       the line angles and on the lingual */
    var recF = Math.round(healed - MUCOSA) - swell, R = md.rec || 0, at = [bone.m, (bone.m + bone.d) / 2, bone.d];
    var inflamed = st !== 'health';
    r.pd = {}; r.rec = {}; r.bop = {}; r.pus = {};
    ['f', 'l'].forEach(function(s){
      var Rs = s === 'f' ? R : Math.max(0, R - 1), Ra = Math.max(0, Rs - 1), recs = [recF - 1 + Ra, recF + Rs, recF - 1 + Ra];
      r.rec[s] = recs; r.pd[s] = at.map(function(b, i){ return Math.max(1, Math.round(b - gap - recs[i])); });
      r.bop[s] = [0, 0, 0]; r.pus[s] = [0, 0, 0];
      if(inflamed && md.bop == null) r.bop[s] = [1, 1, 1];
      if(md.pus && inflamed){ var dp = Math.max.apply(null, r.pd[s]), ip = r.pd[s].indexOf(dp); if(dp >= 4){ r.pus[s][ip] = 1; r.bop[s][ip] = 1; } }
    });
    if(inflamed && md.bop != null){ var sites = []; ['f', 'l'].forEach(function(s){ [0, 1, 2].forEach(function(i){ sites.push([s, i, r.pd[s][i]]); }); });
      sites.sort(function(a, b){ return b[2] - a[2]; }); sites.slice(0, Math.round(md.bop * 6)).forEach(function(x){ r.bop[x[0]][x[1]] = 1; }); }
  }
  /* bleeding, suppuration or plaque at a share of the sites (of md.teeth, or of every tooth in the case), the deepest first */
  function siteModule(t, md, spec, field){
    var teeth = md.teeth ? list(md.teeth) : allNums(spec, t), sites = [];
    teeth.forEach(function(n){ var r = t[n] || {}; if(r.missing || r.implant) return; var pd = r.pd || {};
      ['f', 'l'].forEach(function(s){ [0, 1, 2].forEach(function(i){ sites.push({ n:n, s:s, i:i, pd:(pd[s] || [2, 2, 2])[i] }); }); }); });
    sites.sort(function(a, b){ return b.pd - a.pd || (+a.n - +b.n) || (a.s < b.s ? -1 : a.s > b.s ? 1 : 0) || a.i - b.i; });
    var k = Math.round((md.rate || 0) * sites.length);
    if(field === 'pus') sites = sites.filter(function(x){ return x.pd >= 4; });
    sites.slice(0, k).forEach(function(x){ var r = ensure(t, x.n); r[field] = r[field] || {}; r[field][x.s] = r[field][x.s] || [0, 0, 0]; r[field][x.s][x.i] = 1;
      if(field === 'pus'){ r.bop = r.bop || {}; r.bop[x.s] = r.bop[x.s] || [0, 0, 0]; r.bop[x.s][x.i] = 1; } });
  }
  function allNums(spec, t){
    var seen = {}, out = [];
    (spec.teeth || []).concat(toothKeys(t || spec.t)).forEach(function(n){ n = String(n); if(!seen[n]){ seen[n] = 1; out.push(n); } });
    return out.sort(function(a, b){ return +a - +b; });
  }
  function expand(spec){
    if(!spec || !spec.modules) return spec;
    var t = {}, probs = [], dens = {};
    spec.modules.forEach(function(md, i){
      var w = 'module ' + (i + 1) + ' (' + md.m + '): ';
      if(md.m === 'missing') list(md.teeth).forEach(function(n){ ensure(t, n).missing = true; });
      else if(md.m === 'restoration'){
        var r = ensure(t, md.tooth), mat = md.material || 'amalgam';
        if(MAT.indexOf(mat) < 0 && mat !== 'ceramic' && mat !== 'temporary') probs.push(w + 'material must be ' + MAT.concat('ceramic', 'temporary').join(', '));
        if(mat === 'crown'){ r.crown = md.crown || true; if(md.open || md.overhang){ r.margin = {}; if(md.open) r.margin.open = md.open; if(md.overhang) r.margin.overhang = md.overhang; } }
        else { var it = { s:normSurf(md.tooth, md.surfaces), mat:mat }; ['type', 'overhang', 'open', 'temp'].forEach(function(k){ if(md[k]) it[k] = md[k]; });
          if(mat === 'temporary' && !it.temp) it.temp = 'irm';
          (r.resto = r.resto || []).push(it); if(mat === 'amalgam' || mat === 'gold') r.amalgam = true; }
      }
      else if(md.m === 'caries'){ var rc = ensure(t, md.tooth), ci = { s:normSurf(md.tooth, md.surface), depth:md.depth || 'dentin' };
        ['recurrent', 'root', 'arrested'].forEach(function(k){ if(md[k]) ci[k] = true; }); if(md.stage) ci.stage = md.stage; (rc.caries = rc.caries || []).push(ci); }
      else if(md.m === 'endo'){ var re = ensure(t, md.tooth), eo = {};
        ['post', 'core', 'sep', 'missed'].forEach(function(k){ if(md[k]) eo[k] = md[k]; });
        if(typeof md.fill === 'string') eo.fill = md.fill;
        if(md.fill !== false) re.endo = Object.keys(eo).length ? eo : true;
        else { re.nofill = true; if(re.od) probs.push(w + '#' + md.tooth + ' is an overdenture abutment: it is root-filled (a vital one isn\'t drawn yet)'); }
        if(md.widened) re.apdl = true;
        if(md.lesion) re.lesion = md.lesion; }
      else if(md.m === 'fracture'){ var rf = ensure(t, md.tooth), fx = { type:md.type };
        ['depth', 'side', 'cusp', 'at', 'root', 'surface', 'pd', 'vital'].forEach(function(k){ if(md[k] != null) fx[k] = md[k]; });
        if(md.type === 'vrf'){ var sf = md.surface === 'l' ? 'l' : 'f', dep = md.pd || 8; fx.surface = sf; fx.pd = dep;
          rf.pd = rf.pd || {}; rf.pd[sf] = (rf.pd[sf] || [2, 2, 2]).slice(); rf.pd[sf][1] = dep;
          rf.bop = rf.bop || {}; rf.bop[sf] = (rf.bop[sf] || [0, 0, 0]).slice(); rf.bop[sf][1] = 1; }
        (rf.fx = rf.fx || []).push(fx); }
      else if(md.m === 'bridge'){ var ab = list(md.abutments), rb = md.type === 'resin-bonded', bm = md.material || (rb ? 'metal' : 'pfm'), cv = md.cantilever != null ? String(md.cantilever) : null;
        /* v2.4: a resin-bonded bridge's abutments carry wings bonded to their lingual enamel, not crowns, and its pontic is porcelain on
           the metal framework (a metal one) or zirconia; a cantilever's pontic hangs off one end, held by one abutment or two splinted */
        var pm = rb ? (bm === 'zirconia' ? 'zirconia' : 'pfm') : bm;
        if(md.type != null && md.type !== 'conventional' && !rb) probs.push(w + 'type is conventional (the default) or resin-bonded');
        if(rb ? WINGS.indexOf(bm) < 0 : BRIDGES.indexOf(bm) < 0) probs.push(w + (rb ? 'a resin-bonded bridge is metal (cobalt-chromium or nickel-chromium) or zirconia' : 'a bridge is ' + BRIDGES.join(', ') + ' (a stainless steel crown is a single crown)'));
        var abutAs = function(n, splint){ var ra = ensure(t, n); if(rb) ra.wing = bm; else ra.crown = bm; ra.abut = splint ? 'splint' : true; };
        if(cv){
          if(ab.length < 1 || ab.length > 2) probs.push(w + 'a cantilever names one abutment, or two side by side');
          else if(ab.length === 2 && !adjacent(ab[0], ab[1])) probs.push(w + 'a cantilever\'s two abutments are side by side, splinted together');
          else if(ab.indexOf(cv) >= 0 || ab.filter(function(n){ return adjacent(n, cv); }).length !== 1) probs.push(w + 'the cantilevered pontic sits next to one abutment, past the end of the bridge');
          else { ab.forEach(function(n){ abutAs(n, ab.length > 1); }); var rp = ensure(t, cv); rp.pontic = pm; rp.cant = true; } }
        else if(ab.length !== 2) probs.push(w + 'a bridge names its two abutments (or one, with cantilever: the pontic it holds)');
        else { var span = bridgeSpan(ab[0], ab[1]);
          if(!span || !span.length) probs.push(w + 'the abutments must be in one arch with at least one tooth between them');
          else { ab.forEach(function(n){ abutAs(n, false); }); span.forEach(function(n){ ensure(t, n).pontic = pm; }); } } }
      else if(md.m === 'denture'){ var dt = md.type || 'partial', ar = md.arch, ods = list(md.abutments);
        if(DENT.indexOf(dt) < 0) probs.push(w + 'type must be partial or complete');
        else if(ar !== 'upper' && ar !== 'lower') probs.push(w + 'arch must be upper or lower');
        else if(dens[ar]) probs.push(w + 'a second denture in the ' + ar + ' arch');
        else {
          var dd = { type:dt }; ['connector', 'years', 'floor', 'ridge', 'flange'].forEach(function(k){ if(md[k] != null) dd[k] = md[k]; });
          Object.keys(md).forEach(function(k){ if(['m', 'type', 'arch', 'connector', 'years', 'floor', 'ridge', 'flange', 'abutments', 'seal', 'replaces', 'clasps', 'rests'].indexOf(k) < 0) probs.push(w + k + ' is not part of a denture'); });
          /* an overdenture abutment: a root-filled root under the denture, domed and its canal sealed (the endo module may give the fill) */
          if(dt === 'partial' && (md.abutments || md.seal)) probs.push(w + 'overdenture abutments go under a complete denture here (one under a partial denture isn\'t drawn yet)');
          else ods.forEach(function(n){ var ro = ensure(t, n); if(ro.nofill){ probs.push(w + '#' + n + ' is an overdenture abutment: it is root-filled (a vital one isn\'t drawn yet)'); return; }
            ro.od = md.seal || 'amalgam'; if(!ro.endo) ro.endo = { fill:'adequate' }; });
          if(dt === 'complete'){
            ['replaces', 'clasps', 'rests', 'connector', 'floor', 'flange'].forEach(function(k){ if(md[k] != null) probs.push(w + 'a complete denture has no ' + k + ' (that is a partial denture\'s' + (k === 'flange' ? ': a complete denture\'s base has its flange all round' : '') + ')'); });
            /* every tooth of the arch is gone but its overdenture abutments; the denture's fourteen teeth replace all but the third molars */
            archNums(ar).forEach(function(n){ if(ods.indexOf(n) >= 0) return; var rc = ensure(t, n);
              if(rc.implant){ probs.push(w + '#' + n + ' is an implant: an implant-retained overdenture (attachments on implants under the denture) isn\'t drawn yet'); return; }
              rc.missing = true; if(posOf(n) < 8) rc.dent = 'complete'; });
          } else { dd.replaces = md.replaces ? list(md.replaces) : null; dd.clasps = md.clasps || {}; dd.rests = md.rests || {};
            dd.replaces && dd.replaces.forEach(function(n){ ensure(t, n).missing = true; }); }
          dens[ar] = dd; } }
      else if(md.m === 'roottip'){ var rt = ensure(t, md.tooth);
        if(md.kind === 'fragment'){ rt.missing = true; rt.rtip = { len:md.len == null ? 4 : md.len }; if(md.root) rt.rtip.root = md.root; }
        else if(md.kind == null || md.kind === 'retained') rt.retained = true;
        else probs.push(w + 'kind must be retained (the crown gone, the root in its socket) or fragment (a root tip in a healed socket)'); }
      else if(md.m === 'resorption'){ var rz = ensure(t, md.tooth), rx = { type:md.type };
        ['at', 'side', 'size', 'mm', 'root', 'heithersay'].forEach(function(k){ if(md[k] != null) rx[k] = md[k]; });
        (rz.rsp = rz.rsp || []).push(rx); }
      else if(md.m === 'sealant') (md.teeth ? list(md.teeth) : list(md.tooth)).forEach(function(n){ ensure(t, n).seal = normSurf(n, md.surfaces || 'O'); });
      else if(md.m === 'implant') (md.teeth ? list(md.teeth) : list(md.tooth)).forEach(function(n){ implantModule(t, n, md, w, probs); });
      else if(md.m === 'bone') boneModule(t, md, probs);
      else if(md.m === 'bop' || md.m === 'pus' || md.m === 'plaque') siteModule(t, md, spec, md.m);
      else if(md.m === 'recession') list(md.teeth).forEach(function(n){ var r = ensure(t, n), mm = md.mm || 0; r.rec = r.rec || {}; r.pd = r.pd || {};
        r.rec.f = (r.rec.f || [-2, -2, -2]).slice(); r.pd.f = (r.pd.f || [2, 2, 2]).slice(); var cal = r.pd.f[1] + r.rec.f[1]; r.rec.f[1] = Math.max(mm, 0); r.pd.f[1] = Math.max(1, cal - mm); });
      else probs.push(w + 'unknown module');
    });
    /* v2.4: a partial denture, once every module has run: the teeth it replaces (by default every missing tooth of its arch but the
       third molars and a bridge's pontics), its clasps, and each clasp's rest where the author gives none: a cingulum rest on a maxillary
       canine or incisor, an incisal rest on a mandibular one; on a premolar or molar the mesial for an RPI and for a distal-extension abutment (a rest next to the free-end base
       tips the abutment toward it), otherwise the side next to the denture base */
    Object.keys(dens).forEach(function(ar){ var dd = dens[ar]; if(dd.type !== 'partial') return;
      var rep = dd.replaces || archNums(ar).filter(function(n){ var r = t[n]; return r && r.missing && !r.pontic && posOf(n) < 8; });
      rep.forEach(function(n){ ensure(t, n).dent = 'partial'; });
      dd.replaces = rep;
      var get = function(n){ var r = t[n] || {}; return { dent:!!r.dent || !!r.od, gone:(!!r.missing && !r.pontic) || !!r.od }; };
      Object.keys(dd.rests).forEach(function(n){ ensure(t, n).rest = dd.rests[n]; });
      Object.keys(dd.clasps).forEach(function(n){ var r = ensure(t, n); r.clasp = dd.clasps[n]; if(r.rest) return;
        var mz = nbr(n, true), di = nbr(n, false), md2 = mz && get(mz).dent, dd2 = di && get(di).dent;
        r.rest = posOf(n) <= 3 ? (isUpper(n) ? 'cingulum' : 'incisal') : r.clasp === 'rpi' || freeEnd(n, get) ? 'm' : md2 && dd2 ? 'md' : dd2 ? 'd' : 'm'; });
      delete dd.clasps; delete dd.rests; });
    /* the author's own numbers win, field by field */
    Object.keys(spec.t || {}).forEach(function(n){
      var own = spec.t[n]; if(!own) return; var r = ensure(t, n);
      Object.keys(own).forEach(function(k){ r[k] = own[k]; });
    });
    var out = {}; Object.keys(spec).forEach(function(k){ out[k] = spec[k]; });
    out.t = t; out._moduleProblems = probs; delete out.modules;
    if(Object.keys(dens).length){ var dz = {}; Object.keys(spec.dentures || {}).forEach(function(a){ dz[a] = spec.dentures[a]; }); Object.keys(dens).forEach(function(a){ dz[a] = dens[a]; }); out.dentures = dz; }
    return out;
  }
  var CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;
  function prep(spec){
    if(!spec || !spec.modules) return spec;
    if(CACHE && CACHE.has(spec)) return CACHE.get(spec);
    var e = expand(spec); if(CACHE) CACHE.set(spec, e); return e;
  }
  I.expand = function(spec){ return prep(spec); };

  /* ---------- the model's tooth record, with defaults ---------- */
  function tooth(spec, n){
    var t = (spec.t && spec.t[n]) || {}, z = [0, 0, 0], d = dims(n);
    function arr(o, s, def){ return o && o[s] ? o[s] : def.slice(); }
    var pd = t.pd || {}, rec = t.rec || {}, bop = t.bop || {}, pus = t.pus || {}, pl = t.plaque || {};
    /* defaults: a healthy sulcus of 2 mm whose base sits at the CEJ (the margin 2 mm coronal to it: recession -2, CAL 0) */
    var r = { n:String(n), d:d, missing:!!t.missing, implant:t.implant || null, mob:t.mob || 0, furc:t.furc || {},
      pd:{ f:arr(pd, 'f', [2, 2, 2]), l:arr(pd, 'l', [2, 2, 2]) }, rec:{ f:arr(rec, 'f', [-2, -2, -2]), l:arr(rec, 'l', [-2, -2, -2]) },
      bop:{ f:arr(bop, 'f', z), l:arr(bop, 'l', z) }, pus:{ f:arr(pus, 'f', z), l:arr(pus, 'l', z) }, plaque:{ f:arr(pl, 'f', z), l:arr(pl, 'l', z) },
      bone:t.bone || { m:0, d:0 }, vdef:t.vdef || {}, furcX:t.furcX || 0, calc:!!t.calc, crown:!!t.crown, endo:!!t.endo, amalgam:!!t.amalgam, halo:!!t.halo,
      resto:t.resto || [], caries:t.caries || [], lesion:t.lesion || 0, raw:t,
      crownMat:typeof t.crown === 'string' ? t.crown : null, margin:t.margin || {}, eo:t.endo && typeof t.endo === 'object' ? t.endo : null,
      apdl:!!t.apdl, fx:t.fx || [], pontic:t.pontic || null, abut:!!t.abut,
      retained:!!t.retained, rtip:t.rtip || null, rsp:t.rsp || [], seal:t.seal ? String(t.seal) : '',
      dent:t.dent || null, clasp:t.clasp || null, rest:t.rest ? String(t.rest) : '', od:t.od || null, wing:t.wing || null, cant:!!t.cant, splint:t.abut === 'splint' };
    r.cal = { f:r.pd.f.map(function(p, i){ return p + r.rec.f[i]; }), l:r.pd.l.map(function(p, i){ return p + r.rec.l[i]; }) };
    return r;
  }
  /* the teeth a view shows (its own list, or the case's), in viewer order; allOf: every tooth the case says anything about */
  function teethOf(spec, teeth){ return viewOrder(teeth || spec.teeth).map(function(n){ return tooth(spec, n); }); }
  function allOf(spec){ var a = allNums(spec), up = a.filter(isUpper), lo = a.filter(function(n){ return !isUpper(n); });
    return viewOrder(up).concat(viewOrder(lo)).map(function(n){ return tooth(spec, n); }); }
  /* radiographic bone level on one side, in mm from the CEJ (the crest sits 1.5 mm from the CEJ in health, so a
     percentage of root length below that; an implant's bone is given in mm below its platform) */
  function boneMM(t, side){ return t.implant ? (t.bone[side] || 0) : Math.max(1.5, (t.bone[side] || 0) / 100 * t.d.rl); }

  /* ---------- derived values: what the numbers add up to under the 2018 staging and grading tables ---------- */
  I.derive = function(spec){
    spec = prep(spec);
    var ts = allOf(spec), out = { maxCAL:{ v:-99 }, maxInterdental:{ v:-99 }, maxPD:{ v:-99 }, maxRBL:{ pct:0 }, vertical:0, furc:0, bop:0, sites:0, pus:0, impl:{} };
    ts.forEach(function(t){
      if(t.missing) return;
      if(t.implant){
        /* an implant is read against its baseline film (bone in mm below the platform; ~2 mm of crestal remodeling is
           expected), not staged: health, mucositis (inflamed, no loss beyond remodeling) or peri-implantitis (loss
           beyond it). With no baseline (2018 case definitions): bone 3 mm or more below the most coronal part of the
           implant and/or PD 6 mm or more with profuse bleeding = peri-implantitis. Meffert: ailing (static loss, no
           inflammation), failing (progressing, inflamed), failed (mobile, or a radiolucent line around it). */
        var im = t.implant, base = im.baseline, now = t.bone, infl = t.bop.f.concat(t.bop.l, t.pus.f, t.pus.l).some(Boolean), maxPD = Math.max.apply(null, t.pd.f.concat(t.pd.l));
        var beyond, progressing, dx;
        if(base){ beyond = Math.max((now.m || 0) - Math.max(base.m || 0, 2), (now.d || 0) - Math.max(base.d || 0, 2)); progressing = Math.max((now.m || 0) - (base.m || 0), (now.d || 0) - (base.d || 0)) > 0; }
        else { beyond = Math.max(now.m || 0, now.d || 0) - 3 + .01; progressing = beyond > 0; if(maxPD >= 6 && infl) beyond = Math.max(beyond, .01); }
        /* v2.3: bone lost past half the implant's length is a failure too, mobile or not (the lecture: "losing more than half the
           implant's length of bone, or any mobility, means failure"; the ICOI Pisa scale, Misch 2008) */
        var lost = t.mob || t.halo || Math.max(now.m || 0, now.d || 0) > im.len / 2;
        /* an implant still under its cover screw isn't loaded or probed: it is healing, unless it has failed */
        if(im.cover && !lost){ out.impl[t.n] = { dx:'healing implant', meffert:'healing', lossBeyondRemodeling:0, baseline:false }; return; }
        dx = lost ? 'failed implant' : beyond > 0 && infl ? 'peri-implantitis' : infl ? 'peri-implant mucositis' : beyond > 0 ? 'bone loss without inflammation' : 'peri-implant health';
        out.impl[t.n] = { dx:dx, meffert: lost ? 'failed' : progressing && infl ? 'failing' : beyond > 0 ? 'ailing' : 'healthy', lossBeyondRemodeling:+Math.max(0, beyond).toFixed(1), baseline:!!base };
        return;
      }
      var vrf = t.fx.filter(function(f){ return f.type === 'vrf'; });
      ['f', 'l'].forEach(function(s){
        t.pd[s].forEach(function(p, i){
          out.sites++; if(t.bop[s][i]) out.bop++; if(t.pus[s][i]) out.pus++;
          /* a vertical root fracture's narrow pocket is the fracture's, not periodontitis: it stays on the chart and out of the staging */
          if(i === 1 && vrf.some(function(f){ return (f.surface || 'f') === s; })){ out.vrfSites = (out.vrfSites || 0) + 1; return; }
          if(p > out.maxPD.v) out.maxPD = { v:p, tooth:t.n, site:SITE_NAME[i], surface:s };
          var c = t.cal[s][i];
          if(c > out.maxCAL.v) out.maxCAL = { v:c, tooth:t.n, site:SITE_NAME[i], surface:s };
          if(i !== 1 && c > out.maxInterdental.v) out.maxInterdental = { v:c, tooth:t.n, site:SITE_NAME[i], surface:s };
        });
      });
      ['m', 'd'].forEach(function(side){ var b = t.bone[side] || 0; if(b > out.maxRBL.pct) out.maxRBL = { pct:b, tooth:t.n, side:side === 'm' ? 'mesial' : 'distal' };
        if((t.vdef[side] || 0) > out.vertical){ out.vertical = t.vdef[side]; out.verticalTooth = t.n; } });
      var fc = Math.max(t.furc.f || 0, t.furc.l || 0, t.furcX || 0); if(fc > out.furc){ out.furc = fc; out.furcTooth = t.n; }
    });
    var m = spec.mouth || {};
    out.bopPct = out.sites ? Math.round(100 * out.bop / out.sites) : 0;
    /* severity: interdental CAL first (the gold standard), radiographic bone loss second; the worse one sets the stage */
    var cal = out.maxInterdental.v, rbl = out.maxRBL.pct;
    var sCAL = cal >= 5 ? 3 : cal >= 3 ? 2 : cal >= 1 ? 1 : 0, sRBL = rbl > 33 ? 3 : rbl >= 15 ? 2 : rbl > 0 ? 1 : 0;
    out.severity = Math.max(sCAL, sRBL); out.sCAL = sCAL; out.sRBL = sRBL;
    out.attachmentLoss = cal >= 1 || rbl > 0;
    out.triggers = [];
    if(out.maxPD.v >= 6) out.triggers.push('probing depth of 6 mm or more');
    if(out.vertical >= 3) out.triggers.push('vertical bone loss of 3 mm or more');
    if(out.furc >= 2) out.triggers.push('Class II or III furcation involvement');
    if(m.lost) out.triggers.push((m.lost >= 5 ? '5 or more' : '1 to 4') + ' teeth lost to periodontitis');
    var stage = out.severity;
    if(out.triggers.length) stage = Math.max(stage, 3);
    if(m.lost >= 5 || (m.stage4 && m.stage4.length)) stage = 4;
    out.stage = out.attachmentLoss ? stage : 0;
    out.ratio = spec.age ? +(rbl / spec.age).toFixed(2) : null;
    out.gradeByRatio = out.ratio == null ? 'B' : out.ratio < .25 ? 'A' : out.ratio > 1 ? 'C' : 'B';
    out.modifiers = [];
    if((spec.smoke || 0) >= 10) out.modifiers.push('smoking ' + spec.smoke + ' cigarettes a day');
    if((spec.hba1c || 0) >= 7) out.modifiers.push('HbA1c ' + spec.hba1c + '%');
    out.grade = out.modifiers.length ? 'C' : out.gradeByRatio;
    out.extentPct = m.teeth && m.involved != null ? Math.round(100 * m.involved / m.teeth) : null;
    out.extent = out.extentPct == null ? null : out.extentPct < 30 ? 'localized' : 'generalized';
    out.kind = !out.attachmentLoss ? (out.bopPct >= 10 ? 'gingivitis' : 'health') : 'periodontitis';
    out.dx = out.kind === 'periodontitis' ? (out.extent ? out.extent.charAt(0).toUpperCase() + out.extent.slice(1) + ' ' : '') + 'Stage ' + out.stage + ' Grade ' + out.grade + ' periodontitis' :
      out.kind === 'gingivitis' ? 'Gingivitis on an intact periodontium' : 'Clinical health';
    out.rt = {};
    ts.forEach(function(t){ if(t.missing || t.implant) return; var fr = t.rec.f[1], ip = Math.max(t.cal.f[0], t.cal.f[2], t.cal.l[0], t.cal.l[2]), fc = t.cal.f[1];
      if(fr > 0) out.rt[t.n] = ip <= 0 ? 'RT1' : ip <= fc ? 'RT2' : 'RT3'; });
    /* v2.4: each partial denture's arch, its Kennedy class (Applegate's rules) */
    out.kennedy = {};
    Object.keys(spec.dentures || {}).forEach(function(ar){ var d = spec.dentures[ar]; if(!d || d.type !== 'partial') return; var K = kennedyOf(spec, ar); if(K) out.kennedy[ar] = K; });
    return out;
  };

  /* ---------- validate: every number realistic, and consistent with the others ----------
     Returns a list of problems (empty when the case holds up). The ranges are clinical: probing depths 0-12 mm,
     recession -5 (a margin 5 mm up the crown, a swollen pseudopocket) to 10, CAL never negative (a pocket base can't sit coronal to the CEJ),
     CAL within the root, bone loss as a share of root length, a furcation only on a molar and only once bone loss has
     reached the trunk, a Class III through and through, mobility rising with bone loss, implant bone within the
     implant's length and never above its baseline, ages, cigarettes and HbA1c in human ranges. The pocket base and
     the bone crest must agree: in a suprabony pocket the crest sits 0-3 mm apical to the pocket base, and a pocket
     base more than 1.5 mm apical to the crest needs a declared vertical defect that reaches it. */
  /* Patient Box v2.1's rules for one present tooth: crown materials and margins, indirect restorations, endodontic detail,
     fractures and bridges. Every one is an error (validate() has no warnings). A vertical root fracture on a tooth with no root
     canal treatment or restoration is allowed only on a molar the case marks vital:true: most follow root canal treatment, a post
     or a large restoration (Cohen's), and the untreated ones are nearly all attrited first molars (Liao et al. 2017, 2021). */
  function v21(t, w, cat, bad, spec){
    var post = cat.pos >= 4, molar = cat.pos >= 6, fr = filmRoots(t.n), sides = function(v){ return /^(m|d|md|dm)$/.test(String(v)); };
    if(t.crownMat && CROWNS.indexOf(t.crownMat) < 0) bad(w + 'crown must be true or one of ' + CROWNS.join(', '));
    if(t.crownMat === 'ssc' && !molar) bad(w + 'a stainless steel crown on a permanent tooth is for a molar (AAPD: primary teeth and permanent molars)');
    if(t.crownMat === 'lithium' && molar && t.abut) bad(w + 'a lithium disilicate bridge is for the front of the mouth or premolars, not a molar abutment');
    Object.keys(t.margin).forEach(function(k){ if(['open', 'overhang'].indexOf(k) < 0) bad(w + 'margin.' + k + ' is not open or overhang'); else if(!sides(t.margin[k])) bad(w + 'margin.' + k + ' must be m, d or md'); });
    if((t.margin.open || t.margin.overhang) && !t.crown) bad(w + 'a crown margin (open, overhang) on a tooth with no crown');
    if(t.crown && t.resto.length) bad(w + 'a restoration by surface on a crowned tooth: the crown covers every surface');
    t.resto.forEach(function(r){ var ty = r.type || 'direct';
      if(RTYPE.indexOf(ty) < 0){ bad(w + 'restoration type must be ' + RTYPE.join(', ')); return; }
      if(r.mat === 'ceramic' && ty === 'direct') bad(w + 'a ceramic restoration is indirect: type inlay, onlay or veneer');
      if(r.mat === 'temporary'){ if(ty !== 'direct') bad(w + 'a temporary filling is placed directly: no temporary ' + ty);
        if(TEMPS.indexOf(r.temp) < 0) bad(w + 'a temporary filling is temp ' + TEMPS.join(' or '));
        if(r.overhang || r.open) bad(w + 'an overhang or open margin is drawn on a permanent restoration, not a temporary'); }
      else if(r.temp) bad(w + 'temp is for material temporary');
      if(r.mat === 'amalgam' && ty !== 'direct') bad(w + 'amalgam is placed directly: no amalgam ' + ty);
      if((ty === 'inlay' || ty === 'onlay') && !post) bad(w + 'an ' + ty + ' is for a premolar or molar');
      if((ty === 'inlay' || ty === 'onlay') && r.mat === 'composite') bad(w + 'an ' + ty + ' here is gold or ceramic');
      if(ty === 'onlay' && r.s.indexOf('O') < 0) bad(w + 'an onlay covers the occlusal surface: include O');
      if(ty === 'veneer'){ if(molar) bad(w + 'a veneer is for an incisor, canine or premolar'); if(r.s !== cat.surfaces[3]) bad(w + 'a veneer covers the labial (facial) surface only: surfaces "' + cat.surfaces[3] + '"'); if(r.mat !== 'ceramic' && r.mat !== 'composite') bad(w + 'a veneer is ceramic or composite'); }
      ['overhang', 'open'].forEach(function(k){ if(!r[k]) return; if(!sides(r[k])) bad(w + k + ' must be m, d or md');
        else String(r[k]).toUpperCase().split('').forEach(function(x){ if(r.s.indexOf(x) < 0) bad(w + 'an ' + k + ' on ' + x + ', a surface the restoration does not cover'); });
        if(ty === 'onlay' || ty === 'veneer') bad(w + 'an ' + k + ' is drawn on a direct restoration or an inlay'); if(!post) bad(w + 'an ' + k + ' is drawn on a premolar or molar box'); }); });
    var eo = t.eo;
    if(eo){
      Object.keys(eo).forEach(function(k){ if(['fill', 'post', 'core', 'sep', 'missed'].indexOf(k) < 0) bad(w + 'endo.' + k + ' is not something the kit draws'); });
      if(eo.fill && FILLS.indexOf(eo.fill) < 0) bad(w + 'endo fill must be ' + FILLS.join(', '));
      if(eo.post && POSTS.indexOf(eo.post) < 0) bad(w + 'endo post must be ' + POSTS.join(', '));
      if(eo.core && CORES.indexOf(eo.core) < 0) bad(w + 'endo core must be ' + CORES.join(', '));
      if(eo.post === 'cast' && eo.core && eo.core !== 'cast') bad(w + 'a cast post and core are one casting: core cast');
      if(eo.core === 'cast' && eo.post !== 'cast') bad(w + 'a cast core comes with a cast post');
      if(eo.post && !eo.core && eo.post !== 'cast') bad(w + 'a ' + eo.post + ' post holds a core: give core amalgam or composite');
      if((eo.post || eo.core) && !t.crown) bad(w + 'a post or core build-up is drawn under a crown: add the crown');
      if(eo.post && eo.fill === 'short') bad(w + 'a post over a short filling: the apical seal is the reason a post leaves 4-5 mm of gutta-percha');
      ['sep', 'missed'].forEach(function(k){ if(eo[k] && fr.indexOf(eo[k]) < 0) bad(w + 'endo.' + k + ' names a root the film shows on its own (' + fr.join(', ') + ')'); });
      if(eo.missed && fr.length < 2) bad(w + 'a missed canal is drawn on a molar, whose film shows two roots apart');
      if(eo.missed && eo.missed === eo.sep) bad(w + 'a separated instrument and a missed canal in one root');
    }
    if(t.apdl && t.lesion) bad(w + 'a widened PDL and a periapical lesion: the lesion already widens it');
    t.fx.forEach(function(f){ var ty = f && f.type;
      if(FX.indexOf(ty) < 0){ bad(w + 'fracture type must be ' + FX.join(', ')); return; }
      if(ty === 'crown'){ if(post) bad(w + 'a crown fracture is drawn on an incisor or canine (a premolar or molar: type cusp)'); if(DEPTH.indexOf(f.depth) < 0) bad(w + 'crown fracture depth must be ' + DEPTH.join(', ')); if(f.side && f.side !== 'm' && f.side !== 'd') bad(w + 'crown fracture side must be m or d'); if(t.crown) bad(w + 'a crown fracture on a crowned tooth (a fractured crown is the restoration\'s)'); }
      if(ty === 'cusp'){ if(cuspsOf(t.n).indexOf(f.cusp) < 0) bad(w + 'cusp must be one of ' + (cuspsOf(t.n).join(', ') || 'a premolar\'s or molar\'s')); if(t.crown) bad(w + 'a fractured cusp under a full crown'); }
      if(ty === 'crack' && t.crown) bad(w + 'a cracked tooth under a full crown');
      if(ty === 'vrf'){ if(f.root && fr.indexOf(f.root) < 0) bad(w + 'vrf root must be one the film shows (' + fr.join(', ') + ')'); if(f.side && f.side !== 'm' && f.side !== 'd') bad(w + 'vrf side must be m or d');
        if(!t.endo && !t.resto.length && !t.crown && !t.amalgam && !(molar && f.vital === true)) bad(w + (molar ? 'a vertical root fracture on an untreated, unrestored molar is rare: mark it vital:true (an attrited molar, Liao 2017) or give the tooth its root canal treatment or restoration' : 'a vertical root fracture on a vital, unrestored ' + (post ? 'premolar' : 'anterior tooth') + ': it follows root canal treatment, a post or a large restoration (untreated ones are nearly all molars)'));
        if(f.pd != null){ num(f.pd, 5, 12, w + 'vrf pocket'); } }
      if(ty === 'hrf'){ if(cat.roots.length > 1) bad(w + 'a horizontal root fracture is drawn on a single-rooted tooth'); if(HRF_AT.indexOf(f.at) < 0) bad(w + 'hrf at must be ' + HRF_AT.join(', ')); }
    });
    if(t.abut && !t.crown && !t.wing) bad(w + 'a bridge abutment carries a crown (or, on a resin-bonded bridge, a wing)');
    if(t.wing){ if(WINGS.indexOf(t.wing) < 0) bad(w + 'a resin-bonded wing is metal or zirconia'); if(t.crown) bad(w + 'a resin-bonded wing on a crowned tooth: a crowned abutment carries a conventional bridge'); if(!t.abut) bad(w + 'a resin-bonded wing with no bridge (the bridge module writes it)');
      if(t.mob >= 2) bad(w + 'a resin-bonded wing on a tooth with mobility ' + t.mob + ': a mobile abutment debonds it (Kern)');
      /* the wing bonds to the enamel of the lingual and of the proximal next to the pontic: no restoration there */
      var pm = nbr(t.n, true), side = pm && tooth(spec, pm).pontic ? 'M' : 'D';
      t.resto.forEach(function(r){ var hit = String(r.s || '').split('').filter(function(c){ return c === 'L' || c === side; });
        if(hit.length) bad(w + 'a resin-bonded wing bonds to enamel: a restoration on ' + hit.join('') + ', under the wing (a restored abutment takes a conventional bridge)'); }); }
    function num(v, lo, hi, what){ if(typeof v !== 'number' || v < lo || v > hi) bad(what + ' = ' + v + ' is outside ' + lo + '-' + hi); }
  }
  /* decay seen from the buccal: what a lesion's look and place allow (Fejerskov's Dental Caries; ICDAS; Nyvad and Fejerskov's root
     caries criteria): a white spot is a lesion still in the enamel; root caries is on an exposed root (recession on that surface),
     with no enamel there, and not at a crown's margin (that is recurrent caries); an arrested lesion is a primary one */
  var CKEYS = ['s', 'depth', 'recurrent', 'stage', 'root', 'arrested'], STAGES = ['white-spot', 'cavitated'];
  function cariesCheck(t, c, w, cat, bad){
    Object.keys(c).forEach(function(k){ if(CKEYS.indexOf(k) < 0) bad(w + 'caries.' + k + ' is not something the kit draws'); });
    if(c.stage != null && STAGES.indexOf(c.stage) < 0) bad(w + 'caries stage must be ' + STAGES.join(' or '));
    if(c.stage === 'white-spot' && c.depth !== 'enamel') bad(w + 'a white-spot lesion is still in the enamel: depth enamel (a lesion in the dentin is cavitated or shows as a shadow)');
    if(c.stage && c.recurrent) bad(w + 'stage is for a primary lesion, not recurrent caries');
    if(c.arrested && c.recurrent) bad(w + 'arrested is for a primary lesion, not recurrent caries');
    if(c.root){ var F = cat.surfaces[3], sf = c.s === F ? 'f' : c.s === 'L' ? 'l' : null;
      /* proximal root caries (v2.2): under the contact, on a root bared by interdental attachment loss (the papilla gone with it) */
      if(c.s === 'M' || c.s === 'D'){ var si = c.s === 'M' ? 0 : 2, sd = c.s === 'M' ? 'm' : 'd', nm = sd === 'm' ? 'mesial' : 'distal', ri = Math.max(t.rec.f[si], t.rec.l[si]), cr = boneMM(t, sd) + (t.vdef[sd] || 0);
        if(ri < 1) bad(w + 'proximal root caries on ' + c.s + ' needs the root bared under the contact: interdental recession of at least 1 mm at the ' + nm + ' site, facial or lingual (now ' + ri + ' mm)');
        if(cr < 2.5) bad(w + 'proximal root caries on ' + c.s + ' needs interdental bone loss: the ' + nm + ' crest at least 2.5 mm from the CEJ (now ' + f1(cr) + ' mm), so there is bared root between them'); }
      else if(!sf) bad(w + 'root caries is drawn on the facial (' + F + '), lingual (L), mesial or distal root');
      else if((t.rec[sf][1] || 0) < 1) bad(w + 'root caries on ' + c.s + ' needs the root exposed: ' + (sf === 'f' ? 'facial' : 'lingual') + ' recession of at least 1 mm at the middle site (attachment loss in a pocket leaves the root covered)');
      if(c.depth === 'enamel') bad(w + 'a root has no enamel: root caries is depth dentin or pulp');
      if(c.stage === 'white-spot') bad(w + 'a white-spot lesion is an enamel lesion, not root caries');
      if(c.recurrent) bad(w + 'root caries at a crown\'s or restoration\'s margin is recurrent caries: recurrent:true, without root');
      if(t.crown && !c.recurrent) bad(w + 'a lesion on the root of a crowned tooth starts at the crown\'s margin: recurrent:true, without root'); }
  }
  /* Patient Box v2.2's rules for one present tooth: a retained root, resorption, sealants (the sources are in this file's header).
     Every one is an error. */
  function rootMM(n, name){ var c = CAT(n), rs = mkRoots(c.dims, function(x){ return x; }, 1, 0); return rs[c.pos >= 6 ? Math.max(0, c.roots.indexOf(name)) : 0] || rs[0]; }
  function v22(t, w, cat, bad){
    var fr = filmRoots(t.n), rl = t.d.rl;
    function num(v, lo, hi, what){ if(typeof v !== 'number' || isNaN(v) || v < lo || v > hi) bad(w + what + ' = ' + v + ' is outside ' + f1(lo) + '-' + f1(hi)); }
    if(t.rtip) bad(w + 'a root tip in a healed socket is on a missing tooth (kind fragment marks it missing); a root whose crown is gone is kind retained');
    if(t.retained) [['crown', t.crown], ['restoration', t.resto.length || t.amalgam], ['caries', t.caries.length], ['fracture', t.fx.length], ['root canal filling', t.endo], ['sealant', t.seal], ['resorption', t.rsp.length], ['bridge abutment', t.abut], ['crown margin', t.margin.open || t.margin.overhang]].forEach(function(e){
      if(e[1]) bad(w + 'a retained root (its crown gone) has no ' + e[0] + (e[0] === 'caries' ? ': the decay that took the crown is drawn with it' : e[0] === 'root canal filling' ? ' here: a root-filled root kept under a denture is an overdenture abutment (the denture module\'s abutments)' : '')); });
    var seen = {};
    t.rsp.forEach(function(x){
      if(!x || RSP.indexOf(x.type) < 0){ bad(w + 'resorption type must be ' + RSP.join(', ')); return; }
      if(seen[x.type]) bad(w + 'two ' + x.type + ' resorptions on one tooth'); seen[x.type] = 1;
      Object.keys(x).forEach(function(k){ if(RSP_KEYS[x.type].indexOf(k) < 0) bad(w + x.type + ' resorption takes ' + RSP_KEYS[x.type].slice(1).join(', ') + ', not ' + k); });
      if(x.root != null && fr.indexOf(x.root) < 0) bad(w + 'resorption root must be one the film shows (' + fr.join(', ') + ')');
      if(x.at != null && HRF_AT.indexOf(x.at) < 0) bad(w + 'resorption at must be ' + HRF_AT.join(', '));
      if(x.type === 'internal'){ var sz = x.size == null ? 2 : x.size, hw = rHw(rootMM(t.n, x.root), AT_T[x.at || 'middle']); num(sz, 1, 4, x.type + ' resorption size (mm across)');
        if(sz / 2 > hw - .35) bad(w + 'internal resorption ' + sz + ' mm across is wider than the root there allows (' + f1(2 * hw) + ' mm): it would perforate');
        if(t.endo) bad(w + 'internal resorption in a root-filled canal: the filling fills the defect (draw it before treatment)'); }
      if(x.type === 'cervical'){ if(x.side != null && ['m', 'd', 'f', 'l'].indexOf(x.side) < 0) bad(w + 'external cervical resorption side must be m, d, f or l');
        if(x.heithersay != null && [1, 2, 3, 4].indexOf(x.heithersay) < 0) bad(w + 'Heithersay class must be 1, 2, 3 or 4'); }
      if(x.type === 'apical') num(x.mm == null ? 2 : x.mm, 1, Math.min(5, .35 * rl), 'apical root resorption (mm of root lost)');
      if(x.type === 'replacement'){ if(x.side != null && ['m', 'd', 'md'].indexOf(x.side) < 0) bad(w + 'replacement resorption side must be m, d or md');
        num(x.mm == null ? 4 : x.mm, 2, Math.min(10, .6 * rl), 'replacement resorption (mm of root)');
        if(t.mob) bad(w + 'an ankylosed tooth is not mobile: replacement resorption fuses the root to the bone (Andreasen), so mob 0'); }
    });
    if(t.seal){
      var up = isUpper(t.n), pos = cat.pos;
      if(t.crown) bad(w + 'a sealant on a crowned tooth');
      t.seal.split('').forEach(function(x){
        if(['O', 'B', 'L'].indexOf(x) < 0){ bad(w + 'a sealant fills pits and fissures: O, B (a mandibular molar\'s buccal pit) or L (a maxillary molar\'s palatal groove, a maxillary incisor\'s lingual pit), not ' + x); return; }
        if(x === 'O' && pos < 4) bad(w + 'an occlusal sealant is for a premolar or molar');
        if(x === 'B' && !(pos >= 6 && !up)) bad(w + 'a buccal pit sealant is for a mandibular molar');
        if(x === 'L' && !(up && (pos >= 6 || pos <= 2))) bad(w + 'a lingual sealant is for a maxillary molar\'s palatal groove or a maxillary incisor\'s lingual pit');
        if(t.resto.some(function(r){ return r.type !== 'veneer' && (r.s.indexOf(x) >= 0 || (x === 'O' && r.type === 'onlay')); })) bad(w + 'a sealant on ' + x + ', a restored surface');
        t.caries.forEach(function(c){ if(c.s !== x) return;
          if(c.depth !== 'enamel' || c.stage === 'cavitated' || c.recurrent) bad(w + 'a sealant over ' + (c.depth !== 'enamel' ? 'caries into the ' + c.depth : 'a cavity') + ' on ' + x + ': that lesion is restored, not sealed (a sealant can arrest a non-cavitated enamel lesion: ADA and AAPD 2016)'); });
      });
    }
  }
  /* the case's clinical tests (spec.tests): each on a present tooth of the case, its result one the record explains */
  function testsCheck(spec, bad){
    var seen = {}, nums = allNums(spec);
    (spec.tests || []).forEach(function(x, i){
      var w = 'test ' + (i + 1) + ' (' + (x && x.test) + '): ';
      if(!x || TESTS.indexOf(x.test) < 0){ bad(w + 'test must be ' + TESTS.join(', ')); return; }
      Object.keys(x).forEach(function(k){ if(['test', 'tooth', 'result', 'release', 'cusp'].indexOf(k) < 0) bad(w + k + ' is not part of a test'); });
      var n = String(x.tooth);
      if(!CAT(n)){ bad(w + 'tooth ' + x.tooth + ' is not a universal number'); return; }
      if(nums.indexOf(n) < 0){ bad(w + '#' + n + ' is not one of the case\'s teeth'); return; }
      var t = tooth(spec, n), fx = function(ty){ return t.fx.some(function(f){ return f.type === ty; }); }, crack = fx('crack'), cusp = t.fx.filter(function(f){ return f.type === 'cusp'; })[0];
      if(t.missing || t.implant || t.retained){ bad(w + '#' + n + ' is ' + (t.missing ? 'missing' : t.implant ? 'an implant' : 'a retained root') + ': no tooth to test'); return; }
      if(seen[x.test + n]) bad(w + 'the same test twice on #' + n); seen[x.test + n] = 1;
      if(RESULTS[x.test].indexOf(x.result) < 0){ bad(w + 'result must be ' + RESULTS[x.test].join(', ')); return; }
      if((x.release || x.cusp) && !(x.test === 'bite' && x.result === 'positive')) bad(w + 'release and cusp describe a positive bite test');
      if(x.test === 'bite' && x.result === 'positive'){
        if(!(crack || cusp || fx('vrf') || t.lesion || t.apdl)) bad(w + 'pain on biting needs a cause in the record: a crack, a fractured cusp, a vertical root fracture or apical periodontitis (a lesion or a widened PDL)');
        if(x.release && !(crack || cusp)) bad(w + 'pain on release is a cracked tooth\'s (or a fractured cusp\'s): the record has neither');
        if(x.cusp != null){ if(cuspsOf(n).indexOf(x.cusp) < 0) bad(w + 'cusp must be one of ' + (cuspsOf(n).join(', ') || 'a premolar\'s or molar\'s'));
          else if(cusp && cusp.cusp !== x.cusp) bad(w + 'the bite test points at the ' + x.cusp + ' cusp, but the fractured cusp is ' + cusp.cusp); } }
      if(x.test === 'transillumination'){
        if(t.crown) bad(w + 'transillumination through a full crown: the crown blocks the light');
        else if(x.result === 'positive' && !(crack || cusp)) bad(w + 'the light stops at a crack: a positive transillumination needs a crack or a fractured cusp in the record'); }
      if(x.test === 'percussion'){ var rp = t.rsp.some(function(r){ return r.type === 'replacement'; });
        if(x.result === 'metallic' && !rp) bad(w + 'a metallic sound on percussion is an ankylosed tooth\'s: the record has no replacement resorption');
        if(rp && x.result !== 'metallic') bad(w + 'an ankylosed tooth (replacement resorption) rings on percussion: result metallic');
        if(x.result === 'tender' && !(t.lesion || t.apdl || crack || cusp || fx('vrf') || fx('hrf') || fx('crown'))) bad(w + 'tender to percussion needs a cause in the record: apical periodontitis, a crack or fracture, or a recent injury'); }
    });
  }
  /* v2.3: one implant's own rules (its sources are in this file's header). Its record holds only what the kit draws; a cemented
     crown is the one that leaves excess cement; an implant under its cover screw has no crown, bridge, baseline film or probing;
     its crown is a material an implant carries; its platform keeps 1.5 mm from a neighbor's root and 3 mm from a neighboring
     implant (the lecture; Grunder 2005, Tarnow 2000), measured where the kit draws them (the teeth at their contacts, a tooth's root
     at its cervical width); and the probe stops where the mucosa allows: no deeper than the bone, no more than 2.5 mm above it,
     with the margin at least 1 mm above the bone (Lang 1994; Berglundh and Lindhe 1996) */
  function implantCheck(spec, t, w, bad, num){
    var im = t.implant;
    Object.keys(im).forEach(function(k){ if(IKEYS.indexOf(k) < 0) bad(w + 'implant.' + k + ' is not something the kit draws'); });
    if(im.retention != null && RETAIN.indexOf(im.retention) < 0) bad(w + 'implant retention must be ' + RETAIN.join(' or '));
    if(im.cement && im.retention === 'screw') bad(w + 'excess cement is left under a cemented crown: a screw-retained one has none');
    if(im.years != null) num(im.years, 0, 40, w + 'years since the crown was delivered');
    if(im.weeks != null) num(im.weeks, 0, 52, w + 'weeks since the implant was placed');
    if(im.cover){
      if(t.crown) bad(w + 'an implant under its cover screw has no crown yet');
      if(t.abut) bad(w + 'an implant under its cover screw carries no bridge yet');
      if(im.cement || im.retention || im.years != null || im.baseline) bad(w + 'an implant under its cover screw has no crown yet, so no retention, cement, years since delivery or baseline film');
      ['pd', 'rec', 'bop', 'pus', 'plaque'].forEach(function(k){ if(t.raw[k]) bad(w + 'an implant under its cover screw is under the mucosa and can\'t be probed (' + k + ')'); });
    }
    if(t.crownMat && ICROWNS.indexOf(t.crownMat) < 0) bad(w + 'an implant crown is ' + ICROWNS.join(', ') + (t.crownMat === 'ssc' ? ' (a stainless steel crown is a molar tooth\'s)' : ''));
    if(t.margin.open || t.margin.overhang) bad(w + 'an implant crown\'s margin: excess cement is implant.cement, and an open margin or overhang isn\'t drawn on one');
    var named = spec.full ? null : allNums(spec);
    [+t.n - 1, +t.n + 1].forEach(function(b){
      if(b < 1 || b > 32 || !adjacent(t.n, b)) return; var nb = String(b); if(named && named.indexOf(nb) < 0) return;
      var u = tooth(spec, nb); if(u.missing) return;
      var ctr = (t.d.cw + u.d.cw) / 2;
      if(u.implant){ if(b < +t.n) return; var gi = ctr - im.w / 2 - u.implant.w / 2;
        if(gi < TO_IMPLANT - 1e-9) bad(w + 'and #' + nb + '\'s implants are ' + f1(gi) + ' mm apart: implants are kept 3 mm apart, or the bone between them resorbs and the papilla goes (Tarnow 2000): narrower implants, or a pontic between'); }
      else { var gt = ctr - u.d.cv / 2 - im.w / 2;
        var fit = Math.floor((im.w - 2 * (TO_TOOTH - gt)) * 10) / 10;
        if(gt < TO_TOOTH - 1e-9) bad(w + 'the implant is ' + f1(gt) + ' mm from #' + nb + '\'s root: an implant is kept 1.5 mm from a tooth (' + (fit >= 3 ? 'one up to ' + fit + ' mm wide fits here' : 'no implant 3 mm or wider fits here') + ')'); }
    });
    if(im.cover) return;
    var bm = t.bone.m || 0, bd = t.bone.d || 0;
    ['f', 'l'].forEach(function(s){ [0, 1, 2].forEach(function(i){
      var b = i === 0 ? bm : i === 2 ? bd : (bm + bd) / 2, base = t.pd[s][i] + t.rec[s][i], site = w + (s === 'f' ? 'facial' : 'lingual') + ' ' + SITE_NAME[i] + ' ';
      if(base > b + .5) bad(site + 'the pocket base (' + base + ' mm below the platform) is past the bone (' + f1(b) + ' mm): the probe stops at the bone');
      else if(base < b - 2.5) bad(site + 'the pocket base sits ' + f1(b - base) + ' mm above the bone (the bone ' + f1(b) + ' mm below the platform): the probe stops about 1-1.5 mm above it in health and nearer in disease');
      if(t.rec[s][i] > b - 1) bad(site + 'the mucosal margin (recession ' + t.rec[s][i] + ') sits within 1 mm of the bone (' + f1(b) + ' mm below the platform)'); }); });
  }
  /* bridges across the record: every run of pontics has an abutment at each end (a cantilever's one pontic an abutment on one side),
     every abutment is next to a pontic (or splinted to the abutment that is) */
  function bridgeCheck(spec, bad){
    var T = {}; for(var n = 1; n <= 32; n++) T[n] = tooth(spec, String(n));
    function nb(a, b){ return b >= 1 && b <= 32 && adjacent(a, b); }
    for(var a = 1; a <= 32; a++){ var t = T[a];
      if(t.pontic && t.cant) cantCheck(T, a, bad);
      else if(t.pontic){ [a - 1, a + 1].forEach(function(b){ if(!nb(a, b)) { bad('#' + a + ': a pontic at the end of the arch has no abutment past it'); return; } var u = T[b]; if(!u.pontic && !u.abut) bad('#' + a + ': a pontic next to #' + b + ', which is neither a pontic nor an abutment'); if(u.abut && u.missing) bad('#' + b + ': an abutment that is missing'); if(u.pontic && u.pontic !== t.pontic) bad('#' + a + ': one bridge, two materials'); if(u.pontic && u.cant) bad('#' + a + ': a pontic next to a cantilevered one: a cantilever carries one pontic'); });
        /* v2.3: the run of pontics this one starts, and the abutments at its two ends: both teeth or both implants (never an implant
           joined to a tooth: the tooth moves 25-100 um in its ligament, the implant 3-5 um, so the implant takes the load; Lang 2004),
           and two implants carry one pontic (a three-unit bridge), not usually two (the lecture: a span flexes with its cube) */
        if(!(a > 1 && adjacent(a, a - 1) && T[a - 1].pontic)){ var e = a; while(e < 32 && adjacent(e, e + 1) && T[e + 1].pontic) e++;
          var A0 = T[a - 1], A1 = T[e + 1];
          if(A0 && A1 && adjacent(a - 1, a) && adjacent(e, e + 1) && A0.abut && A1.abut){
            if(!!A0.implant !== !!A1.implant) bad('#' + (a - 1) + ' to #' + (e + 1) + ': a bridge joining an implant to a tooth (never: the tooth moves 25-100 um in its ligament, the implant 3-5 um, so the implant takes the load)');
            else if(A0.implant && e > a) bad('#' + (a - 1) + ' to #' + (e + 1) + ': ' + (e - a + 1) + ' pontics on two implants: two implants carry a three-unit bridge, not usually a longer one (a span flexes with its cube): add an implant under a pontic');
            /* v2.4: a resin-bonded bridge replaces one tooth: both wings bonded, one pontic between (Kern; Pjetursson 2008) */
            if(!!A0.wing !== !!A1.wing) bad('#' + (a - 1) + ' to #' + (e + 1) + ': a bridge with a resin-bonded wing at one end and a crown at the other');
            else if(A0.wing && e > a) bad('#' + (a - 1) + ' to #' + (e + 1) + ': ' + (e - a + 1) + ' pontics on a resin-bonded bridge: it replaces one tooth');
            if(A0.wing && A0.wing !== A1.wing) bad('#' + (a - 1) + ' to #' + (e + 1) + ': one resin-bonded bridge, two framework materials');
            if(A0.wing && posOf(a) >= 6) bad('#' + a + ': a resin-bonded bridge replacing a molar: it is for an incisor, a canine or a premolar'); } } }
      if(t.abut && !t.missing && ![a - 1, a + 1].some(function(b){ return nb(a, b) && T[b].pontic; }) && !(t.splint && [a - 1, a + 1].some(function(b){ return nb(a, b) && T[b].splint; }))) bad('#' + a + ': an abutment with no pontic beside it');
      if(t.abut && t.crownMat && [a - 1, a + 1].some(function(b){ return nb(a, b) && T[b].pontic && T[b].pontic !== t.crownMat; })) bad('#' + a + ': the abutment crown and its pontic are different materials');
      if(t.splint && !t.missing && [a - 1, a + 1].some(function(b){ return nb(a, b) && T[b].splint && T[b].crownMat !== t.crownMat; })) bad('#' + a + ': two splinted abutments, two materials');
    }
  }
  /* v2.4: a cantilever (the sources are in this file's header): one pontic held from one side only, by one abutment or two splinted
     side by side. Never a molar; a premolar on two splinted abutments, mesial to them (a distal cantilever tips the last abutment
     under load); a single abutment holds an incisor only (a maxillary lateral from the canine, on a conventional bridge; on a
     resin-bonded one, an incisor from one incisor or canine); not on implants (not drawn yet) */
  function cantCheck(T, a, bad){
    var t = T[a], w = '#' + a + ': ', nbs = [a - 1, a + 1].filter(function(b){ return b >= 1 && b <= 32 && adjacent(a, b); });
    var ab = nbs.filter(function(b){ return T[b].abut && !T[b].missing; }), pn = nbs.filter(function(b){ return T[b].pontic; });
    if(pn.length) bad(w + 'a cantilever carries one pontic: #' + pn.join(', #') + ' beside it is a pontic too');
    if(ab.length !== 1){ bad(w + (ab.length ? 'a pontic held on both sides is a fixed-fixed bridge, not a cantilever' : 'a cantilevered pontic is held by an abutment on one side')); return; }
    var A = T[ab[0]], rest = A.splint ? [ab[0] - 1, ab[0] + 1].filter(function(b){ return b !== a && b >= 1 && b <= 32 && adjacent(ab[0], b) && T[b].splint; }) : [], units = [A].concat(rest.map(function(b){ return T[b]; }));
    var p = posOf(a), pa = posOf(A.n), rb = !!A.wing;
    if(units.some(function(u){ return u.implant; })) { bad(w + 'a cantilever on implants isn\'t drawn yet'); return; }
    if(units.some(function(u){ return !!u.wing !== rb; })) bad(w + 'a cantilever\'s abutments are both crowned or both resin-bonded');
    if(p >= 6) bad(w + 'a cantilevered molar: only a premolar-sized pontic on two splinted premolars is accepted, and that isn\'t drawn yet (a full molar is too long a lever)');
    else if(p >= 4){ if(rb) bad(w + 'a resin-bonded cantilever replaces an incisor (single-retainer: Kern)'); else if(units.length < 2) bad(w + 'a cantilevered premolar needs two splinted abutments (the second premolar and first molar for a first premolar)'); if(p > pa && !rb) bad(w + 'a distal cantilever: the pontic sits mesial to its abutments (a pontic past the last abutment tips it distally under load)'); }
    else if(p === 3) bad(w + 'a cantilevered canine: the canine takes the bite in a lateral excursion, too much for a cantilever');
    else if(units.length === 1 && !rb && !(p === 2 && pa === 3 && isUpper(a))) bad(w + 'a single-abutment cantilever (a conventional bridge) replaces a maxillary lateral incisor from the canine: a pontic on one crowned incisor levers it');
    if(rb && units.length > 1) bad(w + 'a resin-bonded cantilever has one retainer wing (the single-retainer design: Kern)');
  }
  /* v2.4: dentures (the sources are in this file's header). A complete denture: the arch is gone but its overdenture abutments. A
     partial denture: teeth left in its arch, the teeth it replaces missing, no tooth missing inside the arch that nothing replaces;
     clasps on natural teeth, on both sides of the arch (cross-arch: a one-sided denture can be swallowed), each with its rest; an
     RPI on a distal-extension abutment, whose rest is mesial; a rest a tooth can take (an occlusal rest on a premolar or molar, a
     cingulum rest on a maxillary canine or incisor, an incisal rest on a mandibular one, whose cingulum is too shallow); a Class I or
     II denture with an indirect retainer, a rest farther forward than its free-end abutments; a lingual bar only with room for it
     (8 mm from the lingual gingival margin to the floor of the mouth, else a lingual plate); no clasp on a tooth with mobility 2 or
     more. An overdenture abutment: under a denture, root-filled, with at least half its bone support, nothing of a crown's on it */
  function dentureCheck(spec, bad, num){
    var D = spec.dentures || {};
    Object.keys(D).forEach(function(ar){ var d = D[ar], w = 'the ' + ar + ' denture: ';
      if(ar !== 'upper' && ar !== 'lower'){ bad('dentures.' + ar + ': the arch is upper or lower'); return; }
      if(!d || DENT.indexOf(d.type) < 0){ bad(w + 'type must be partial or complete'); return; }
      Object.keys(d).forEach(function(k){ if(DKEYS.indexOf(k) < 0) bad(w + k + ' is not part of a denture'); });
      if(d.years != null) num(d.years, 0, 60, w + 'years worn');
      if(d.ridge != null) num(d.ridge, 0, 15, w + 'ridge resorption (mm)');
      var ts = archNums(ar).map(function(n){ return tooth(spec, n); });
      if(d.type === 'complete'){
        ts.forEach(function(t){ if(t.missing || t.od) return; bad(w + '#' + t.n + ' is still there under a complete denture: only an overdenture abutment stays (abutments)'); });
        if(d.connector || d.floor != null) bad(w + 'a complete denture has no major connector (it is all base)');
        return; }
      if(d.connector != null && CONNECTORS[ar].indexOf(d.connector) < 0) bad(w + 'an ' + ar + ' major connector is ' + CONNECTORS[ar].join(', '));
      if(d.floor != null){ if(ar !== 'lower') bad(w + 'floor (the floor of the mouth\'s depth) is a lower denture\'s'); else num(d.floor, 2, 20, w + 'the lingual gingival margin to the floor of the mouth (mm)');
        if(ar === 'lower' && d.connector === 'bar' && typeof d.floor === 'number' && d.floor < LINGUAL_BAR) bad(w + 'a lingual bar needs ' + LINGUAL_BAR + ' mm from the lingual gingival margin to the floor of the mouth (here ' + d.floor + '): a 4 mm bar kept 3-4 mm off the margin; use a lingual plate'); }
      var left = ts.filter(function(t){ return !t.missing && !t.od; });
      if(!left.length){ bad(w + 'a partial denture with no teeth left in its arch is a complete denture'); return; }
      var rep = ts.filter(function(t){ return t.dent; });
      if(!rep.length) bad(w + 'a partial denture replaces at least one tooth');
      (d.replaces || []).forEach(function(n){ if(archOf(n) !== ar) bad(w + '#' + n + ' is not in the ' + ar + ' arch'); });
      ts.forEach(function(t){ if(t.dent && t.dent !== 'partial') bad(w + '#' + t.n + ' is a complete denture\'s tooth'); });
      var K = kennedyOf(spec, ar);
      if(K) K.gaps.forEach(function(n){ bad(w + '#' + n + ' is missing inside the arch and nothing replaces it: add it to the denture\'s replaces (or a bridge)'); });
      var get = function(n){ var u = tooth(spec, n); return { dent:!!u.dent || !!u.od, gone:(u.missing && !u.pontic) || !!u.od }; };
      var clasped = ts.filter(function(t){ return t.clasp; });
      clasped.forEach(function(t){ var tw = '#' + t.n + ' ';
        if(CLASPS.indexOf(t.clasp) < 0) bad(tw + 'clasp must be ' + CLASPS.join(' or '));
        if(t.implant || t.od || t.retained) bad(tw + 'a clasp grips a crown: not on ' + (t.implant ? 'an implant' : t.od ? 'an overdenture abutment' : 'a retained root'));
        if(t.mob >= 2) bad(tw + 'a clasp on a tooth with mobility ' + t.mob + ': an abutment needs its bone support (McCracken)');
        if(!t.rest) bad(tw + 'a clasp with no rest: every clasp has its rest, which carries the denture\'s load');
        if(t.clasp === 'rpi'){ if(!freeEnd(t.n, get)) bad(tw + 'an RPI is a distal-extension abutment\'s clasp: the tooth distal to it, and everything past it, must be gone and the denture\'s base there');
          if(posOf(t.n) < 3) bad(tw + 'an RPI is for a canine, premolar or molar abutment'); } });
      ts.forEach(function(t){ if(!t.rest) return; var tw = '#' + t.n + ' ', p = posOf(t.n), rs = t.rest;
        if(REST_AT.indexOf(rs) < 0){ bad(tw + 'rest must be ' + REST_AT.join(', ')); return; }
        if(t.missing || t.implant || t.od || t.retained) return;
        if(p >= 4 && (rs === 'cingulum' || rs === 'incisal')) bad(tw + 'a premolar or molar takes an occlusal rest: m, d or md');
        if(p <= 3 && /^(m|d|md)$/.test(rs)) bad(tw + 'a canine or incisor takes a cingulum or incisal rest, not an occlusal one');
        if(rs === 'cingulum' && !isUpper(t.n)) bad(tw + 'a mandibular ' + (p === 3 ? 'canine' : 'incisor') + '\'s cingulum has too little enamel for a rest seat: an incisal rest (McCracken)');
        if(freeEnd(t.n, get) && /d/.test(rs) && p >= 4) bad(tw + 'a distal-extension abutment\'s rest goes on its mesial: one next to the free-end base tips the abutment toward it (McCracken)'); });
      if(clasped.length && !(clasped.some(function(t){ return CAT(t.n).side === 'right'; }) && clasped.some(function(t){ return CAT(t.n).side === 'left'; })))
        bad(w + 'clasps on one side of the arch only: a partial denture is held on both sides (cross-arch), or it can be dislodged and swallowed');
      if(!clasped.length) bad(w + 'a partial denture with no clasps');
      /* the labial flange over a front bounded space (Faigenblum 2023): a tooth gum-fitted on the ridge with no flange only where
         the ridge has barely resorbed, a partial flange where it has resorbed a little, a full flange where it has resorbed more,
         to set the tooth back where it stood and support the lip */
      var fsp = frontSpaces(spec, ar), rr = d.ridge != null ? d.ridge : RIDGE, fw = fsp.length ? '#' + fsp.map(function(sp){ return sp.join(' and #'); }).join(', #') : '';
      if(d.flange != null){
        if(FLANGES.indexOf(d.flange) < 0) bad(w + 'flange must be ' + FLANGES.join(', '));
        else if(!fsp.length) bad(w + 'flange is for a bounded space of incisors and canines, and this denture has none (a free end or a back tooth\'s space has its buccal flange)');
        else if(d.flange === 'none' && rr > FLANGE_NONE) bad(w + fw + ' set on the ridge with no flange (gum-fitted) needs a ridge that has barely resorbed, ' + FLANGE_NONE + ' mm at most (here ' + rr + '): a partial or full labial flange (Faigenblum 2023)');
        else if(d.flange === 'partial' && rr > FLANGE_PARTIAL) bad(w + fw + ': a ridge resorbed more than ' + FLANGE_PARTIAL + ' mm (here ' + rr + ') takes a full labial flange, to set the teeth back where they stood and support the lip (Faigenblum 2023)'); }
      if(K && (K.cls === 'I' || K.cls === 'II')){ var fm = Math.min.apply(null, K.free.map(posOf));
        if(!ts.some(function(t){ return t.rest && !t.missing && posOf(t.n) < fm; })) bad(w + 'a Class ' + K.cls + ' denture needs an indirect retainer: a rest farther forward than its free-end abutment' + (K.free.length > 1 ? 's' : '') + ' (#' + K.free.join(', #') + '), such as a cingulum rest on a canine'); }
    });
    for(var n = 1; n <= 32; n++){ var t = tooth(spec, String(n)), tw = '#' + n + ' ';
      if((t.clasp || t.rest) && !(D[archOf(n)] && D[archOf(n)].type === 'partial')) bad(tw + 'a clasp or rest belongs to a partial denture in its arch');
      if(t.dent && !D[archOf(n)]) bad(tw + 'a denture tooth with no denture in its arch');
      if(!t.od) continue;
      if(SEALS.indexOf(t.od) < 0) bad(tw + 'an overdenture abutment\'s canal is sealed with ' + SEALS.join(', '));
      if(!D[archOf(n)]) bad(tw + 'an overdenture abutment sits under a denture: none in its arch');
      if(!t.endo) bad(tw + 'an overdenture abutment here is root-filled (a vital one, barely reduced, isn\'t drawn yet)');
      if(Math.max(t.bone.m || 0, t.bone.d || 0) > 50) bad(tw + 'an overdenture abutment keeps at least half its bone support (here ' + Math.max(t.bone.m || 0, t.bone.d || 0) + '% lost)');
      [['crown', t.crown], ['restoration', t.resto.length || t.amalgam], ['caries', t.caries.length], ['fracture', t.fx.length], ['sealant', t.seal], ['post or core', t.eo && (t.eo.post || t.eo.core)], ['bridge', t.abut || t.wing], ['clasp', t.clasp], ['retained root', t.retained]].forEach(function(e){
        if(e[1]) bad(tw + 'an overdenture abutment (cut down to a dome, its canal sealed) has no ' + e[0] + (e[0] === 'caries' ? ' drawn yet' : '')); });
    }
  }
  /* v2.4: Kennedy's class of a partial denture's arch, by Applegate's rules: a missing third molar (or second molar) the denture
     doesn't replace isn't counted; the most posterior space sets the class (I both sides free-ended, II one side, III bounded, IV one
     bounded space across the midline, in front of the teeth left); every other space is a modification, counted, whatever its size;
     Class IV has none. gaps: teeth missing inside the arch that nothing replaces (validate() refuses them; here they count as
     teeth). free: the free-end abutments */
  function kennedyOf(spec, ar){
    var nums = archNums(ar), sl = nums.map(function(n){ var t = tooth(spec, n); return t.dent || t.od ? 'E' : !t.missing || t.pontic ? 'T' : 'X'; });
    var a = 0, b = sl.length - 1, runs = [], gaps = [], cur = null, i;
    while(a <= b && sl[a] === 'X') a++; while(b >= a && sl[b] === 'X') b--;
    for(i = a; i <= b; i++){ if(sl[i] === 'E'){ if(cur) cur.to = i; else { cur = { from:i, to:i }; runs.push(cur); } } else { cur = null; if(sl[i] === 'X') gaps.push(nums[i]); } }
    if(!runs.length || !sl.slice(a, b + 1).some(function(x){ return x !== 'E'; })) return null;
    var fl = sl[a] === 'E', fr = sl[b] === 'E', free = [], cls, mods;
    if(fl){ for(i = runs[0].to + 1; i <= b && sl[i] !== 'T'; i++); free.push(nums[i]); }
    if(fr){ for(i = runs[runs.length - 1].from - 1; i >= a && sl[i] !== 'T'; i--); free.push(nums[i]); }
    if(fl && fr){ cls = 'I'; mods = runs.length - 2; }
    else if(fl || fr){ cls = 'II'; mods = runs.length - 1; }
    else if(runs.length === 1 && runs[0].from <= 7 && runs[0].to >= 8){ cls = 'IV'; mods = 0; }
    else { cls = 'III'; mods = runs.length - 1; }
    return { cls:cls, mods:mods, text:'Kennedy Class ' + cls + (mods ? ', modification ' + mods : ''), free:free, gaps:gaps,
      spaces:runs.map(function(r){ return nums.slice(r.from, r.to + 1); }) };
  }
  I.validate = function(spec){
    spec = prep(spec);
    var P = (spec && spec._moduleProblems || []).slice(), ts;
    function bad(m){ P.push(m); }
    function num(v, lo, hi, what){ if(typeof v !== 'number' || isNaN(v)) bad(what + ' is not a number'); else if(v < lo || v > hi) bad(what + ' = ' + v + ' is outside ' + lo + '-' + hi); }
    if(!spec || !spec.teeth || !spec.teeth.length) return ['no teeth'];
    spec.teeth.forEach(function(n){ if(!(+n >= 1 && +n <= 32 && +n === Math.floor(+n))) bad('tooth ' + n + ' is not a universal number'); });
    var arch = spec.teeth.map(function(n){ return isUpper(n); });
    if(arch.some(Boolean) && !arch.every(Boolean)) bad('the teeth are not all in one arch');
    toothKeys(spec.t).forEach(function(n){ if(spec.teeth.map(String).indexOf(n) < 0 && !spec.full) bad('#' + n + ' has numbers but is not in teeth (list it, or set full:true for a full-mouth case)'); });
    try { ts = allOf(spec); } catch(e){ return ['teeth: ' + e.message]; }
    if(spec.age != null) num(spec.age, 12, 105, 'age');
    if(spec.smoke != null) num(spec.smoke, 0, 80, 'cigarettes a day');
    if(spec.hba1c != null) num(spec.hba1c, 4, 16, 'HbA1c');
    var m = spec.mouth;
    if(m){ if(m.teeth != null) num(m.teeth, 1, 32, 'teeth in the mouth'); if(m.involved != null){ num(m.involved, 0, 32, 'teeth involved'); if(m.teeth != null && m.involved > m.teeth) bad('more teeth involved than teeth in the mouth'); }
      if(m.lost != null){ num(m.lost, 0, 32, 'teeth lost'); if(m.teeth != null && m.lost + m.teeth > 32) bad('teeth lost + teeth present exceed 32'); } }
    if(spec.full){
      /* a full-mouth case: the box's counts must be the record's */
      /* v2.3: an implant stands where a tooth was lost, so it counts as a tooth gone, not one present (the staging counts teeth) */
      var gone = 0, inv = 0, imps = 0;
      for(var j = 1; j <= 32; j++){ var tj = tooth(spec, String(j)); if(tj.missing){ gone++; continue; } if(tj.implant){ imps++; continue; }
        if(Math.max(tj.cal.f[0], tj.cal.f[2], tj.cal.l[0], tj.cal.l[2]) >= 1 || (tj.bone.m || 0) > 0 || (tj.bone.d || 0) > 0) inv++; }
      if(!m || m.teeth == null) bad('a full-mouth case gives mouth.teeth');
      else if(m.teeth !== 32 - gone - imps) bad('mouth.teeth = ' + m.teeth + ', but the record has ' + (32 - gone - imps) + ' teeth present' + (imps ? ' (its ' + imps + ' implant' + (imps > 1 ? 's are' : ' is') + ' not a tooth)' : ''));
      if(m && m.involved != null && m.involved !== inv) bad('mouth.involved = ' + m.involved + ', but ' + inv + ' teeth in the record have attachment or bone loss');
      if(m && m.lost != null && m.lost > gone + imps) bad('mouth.lost = ' + m.lost + ', but only ' + (gone + imps) + ' teeth are missing or replaced by implants');
    }
    var g = spec.gingiva || {};
    if(g.kt != null) num(g.kt, 0, 9, 'keratinized tissue width');
    if(g.edema != null) num(g.edema, 0, 1, 'edema');
    if(g.look && ['healthy', 'inflamed', 'fibrotic'].indexOf(g.look) < 0) bad('gingiva.look must be healthy, inflamed or fibrotic');
    ts.forEach(function(t){
      var w = '#' + t.n + ' ', raw = t.raw;
      Object.keys(raw).forEach(function(k){ if(['pd', 'rec', 'bop', 'pus', 'plaque', 'mob', 'furc', 'bone', 'vdef', 'furcX', 'calc', 'crown', 'endo', 'amalgam', 'implant', 'missing', 'halo', 'lift', 'resto', 'caries', 'lesion', 'margin', 'apdl', 'fx', 'pontic', 'abut', 'retained', 'rtip', 'rsp', 'seal', 'dent', 'clasp', 'rest', 'od', 'wing', 'cant', 'nofill'].indexOf(k) < 0) bad(w + 'unknown field ' + k); });
      /* impossible combinations: nothing on a missing tooth; nothing of a tooth's own on an implant */
      if(t.pontic && !t.missing) bad(w + 'a pontic replaces a missing tooth: add #' + t.n + ' to the missing module');
      if(t.pontic && BRIDGES.indexOf(t.pontic) < 0) bad(w + 'a pontic is ' + BRIDGES.join(', '));
      /* v2.4: a denture tooth stands where a tooth was lost; a pontic and a denture tooth in one place can't both be */
      if(t.dent && DENT.indexOf(t.dent) < 0) bad(w + 'dent is partial or complete');
      if(t.dent && !t.missing) bad(w + 'a denture tooth replaces a missing tooth: #' + t.n + ' is still there');
      if(t.dent && t.pontic) bad(w + 'a bridge\'s pontic and a denture tooth in one place');
      if(t.cant && !t.pontic) bad(w + 'cant marks a cantilevered pontic');
      if(t.missing){
        [['margin', t.margin.open || t.margin.overhang], ['fracture', t.fx.length], ['widened PDL', t.apdl], ['abutment', t.abut], ['resto', t.resto.length], ['crown', t.crown], ['amalgam', t.amalgam], ['caries', t.caries.length], ['endo', t.endo], ['periapical lesion', t.lesion], ['furcation', t.furc.f || t.furc.l || t.furcX], ['implant', t.implant], ['calculus', t.calc], ['retained root', t.retained], ['resorption', t.rsp.length], ['sealant', t.seal], ['clasp', t.clasp], ['rest', t.rest], ['overdenture abutment', t.od], ['resin-bonded wing', t.wing]].forEach(function(e){ if(e[1]) bad(w + 'a missing tooth has ' + (e[0] === 'resto' ? 'a restoration' : e[0] === 'caries' ? 'caries' : 'a ' + e[0]) + (e[0] === 'retained root' ? ' (a root left after an extraction is a root tip: kind fragment)' : '')); });
        /* a root tip left in the healed socket (v2.2) */
        if(t.rtip){ var tmax = Math.min(6, t.d.rl - 3);
          Object.keys(t.rtip).forEach(function(k){ if(k !== 'len' && k !== 'root') bad(w + 'rtip.' + k + ' is not something the kit draws'); });
          if(typeof t.rtip.len !== 'number' || t.rtip.len < 1.5 || t.rtip.len > tmax) bad(w + 'a root tip is 1.5 to ' + f1(tmax) + ' mm of the root (a longer piece is a retained root)');
          if(t.rtip.root != null && filmRoots(t.n).indexOf(t.rtip.root) < 0) bad(w + 'the root tip\'s root must be one the film shows (' + filmRoots(t.n).join(', ') + ')'); }
        return;
      }
      var cat = CAT(t.n);
      v21(t, w, cat, bad, spec);
      v22(t, w, cat, bad);
      t.resto.forEach(function(r){ if(!r || RMAT.indexOf(r.mat) < 0) bad(w + 'a restoration\'s material must be ' + RMAT.join(', ') + ' (a crown is crown:true, or the crown\'s material)');
        String(r && r.s || '').split('').forEach(function(x){ if(cat.surfaces.indexOf(x) < 0) bad(w + 'restoration surface ' + x + ' is not one of this tooth\'s (' + cat.surfaces.join('') + ')'); });
        if(!r || !r.s) bad(w + 'a restoration with no surfaces'); });
      t.caries.forEach(function(c){ if(!c || cat.surfaces.indexOf(c.s) < 0) bad(w + 'caries surface ' + (c && c.s) + ' is not one of this tooth\'s (' + cat.surfaces.join('') + ')');
        if(c && DEPTH.indexOf(c.depth) < 0) bad(w + 'caries depth must be ' + DEPTH.join(', '));
        if(c) cariesCheck(t, c, w, cat, bad);
        if(c && t.crown && !c.recurrent) bad(w + 'caries under a full crown can\'t be charted by surface (recurrent caries at its margin can: recurrent:true, M, D or ' + cat.surfaces[3] + ')');
        if(c && c.recurrent){ var F = cat.surfaces[3];
          if(c.s !== 'M' && c.s !== 'D' && c.s !== F) bad(w + 'recurrent caries is drawn at a proximal margin (M or D) or a buccal one (' + F + ')');
          else if(c.s === F){ if(!t.crown && !t.resto.some(function(r){ return r.s.indexOf(F) >= 0 && (r.type === 'veneer' || !/[OMD]/.test(r.s) || posOf(t.n) <= 3 && !/[MD]/.test(r.s)); }))
            bad(w + 'recurrent caries on ' + F + ' is at a buccal margin: it needs a Class V (' + F + ' alone), a veneer or a crown'); }
          else if(!t.crown && !t.resto.some(function(r){ return r.type !== 'veneer' && r.s.indexOf(c.s) >= 0; })) bad(w + 'recurrent caries on ' + c.s + ' needs a restoration on that surface (or a crown)'); }
        else if(c && t.resto.some(function(r){ return r.s.indexOf(c.s) >= 0; })) bad(w + 'caries on ' + c.s + ', a restored (or veneered) surface: is it recurrent (recurrent:true)?'); });
      if(t.lesion) num(t.lesion, 1, 15, w + 'periapical lesion (mm across)');
      if(t.mob != null) num(t.mob, 0, 3, w + 'mobility');
      ['f', 'l'].forEach(function(s){
        if(t.pd[s].length !== 3 || t.rec[s].length !== 3) bad(w + s + ': three sites per surface');
        t.pd[s].forEach(function(p, i){
          var site = w + (s === 'f' ? 'facial' : 'lingual') + ' ' + SITE_NAME[i] + ' ';
          num(p, 0, 12, site + 'probing depth'); if(p !== Math.round(p)) bad(site + 'probing depth is not a whole mm');
          var r = t.rec[s][i]; num(r, -5, 10, site + 'recession'); if(r !== Math.round(r)) bad(site + 'recession is not a whole mm');
          var c = p + r;
          if(c < 0) bad(site + 'CAL ' + c + ' is negative (the pocket base would sit coronal to the CEJ)');
          if(!t.implant && c > t.d.rl - 1) bad(site + 'CAL ' + c + ' runs past the root (' + t.d.rl + ' mm)');
          if(t.implant && c > t.implant.len - 1) bad(site + 'CAL ' + c + ' runs past the implant (' + t.implant.len + ' mm)');
          [['bop', t.bop], ['pus', t.pus], ['plaque', t.plaque]].forEach(function(e){ var v = e[1][s][i]; if(v !== 0 && v !== 1) bad(site + e[0] + ' must be 0 or 1'); });
          if(t.pus[s][i] && p < 4) bad(site + 'suppuration from a ' + p + ' mm site');
          if(t.pus[s][i] && !t.bop[s][i]) bad(site + 'suppuration without bleeding');
        });
      });
      if(t.implant){
        var im = t.implant;
        num(im.w, 3, 7, w + 'implant width'); num(im.len, 6, 18, w + 'implant length');
        ['m', 'd'].forEach(function(sd){ var b = t.bone[sd] || 0; num(b, 0, im.len - 1, w + 'implant bone loss ' + sd);
          if(im.baseline){ num(im.baseline[sd] || 0, 0, im.len - 1, w + 'baseline bone ' + sd); if(b < (im.baseline[sd] || 0)) bad(w + 'bone at ' + sd + ' is higher than at the baseline'); } });
        if(t.furc.f || t.furc.l || t.furcX) bad(w + 'an implant has no furcation');
        if(t.endo || t.amalgam || t.calc || t.resto.length || t.caries.length || t.lesion || t.fx.length || t.apdl || t.retained || t.rtip || t.rsp.length || t.seal || t.od) bad(w + 'an implant and a root in one site: an implant has no root filling, restoration, caries, periapical lesion, resorption, sealant or root calculus');
        if(t.mob && !t.halo) bad(w + 'a mobile implant has lost osseointegration: set halo:true so the film shows it');
        if(t.clasp || t.rest) bad(w + 'a clasp or rest on an implant: an implant under a partial denture carries an attachment, which isn\'t drawn yet');
        if(t.wing) bad(w + 'a resin-bonded wing is bonded to a tooth\'s enamel, not to an implant');
        implantCheck(spec, t, w, bad, num);
        return;
      }
      if(t.halo) bad(w + 'halo is for implants');
      ['m', 'd'].forEach(function(sd){
        var pct = t.bone[sd] || 0; num(pct, 0, 90, w + 'bone loss ' + sd + ' (% of root length)');
        var vd = t.vdef[sd] || 0; num(vd, 0, 8, w + 'vertical defect ' + sd);
        var crest = boneMM(t, sd), si = sd === 'm' ? 0 : 2, cal = Math.max(t.cal.f[si], t.cal.l[si]);
        if(crest + vd > t.d.rl - 1) bad(w + 'the ' + sd + ' defect reaches the apex');
        if(cal > crest + vd + 1.5) bad(w + SITE_NAME[si] + ' pocket base (CAL ' + cal + ' mm) sits more than 1.5 mm below the bone (' + f1(crest + vd) + ' mm from the CEJ): add a vertical defect or less CAL');
        if(crest + vd > cal + 3.5 && cal > 0) bad(w + SITE_NAME[si] + ' bone (' + f1(crest + vd) + ' mm) sits more than 3.5 mm below the pocket base (CAL ' + cal + ' mm)');
        if(vd && cal < crest + vd - 1.5) bad(w + SITE_NAME[si] + ' vertical defect ' + vd + ' mm deeper than the pocket reaches');
      });
      var maxBone = Math.max(t.bone.m || 0, t.bone.d || 0);
      if(t.mob >= 2 && maxBone < 30) bad(w + 'mobility ' + t.mob + ' with only ' + maxBone + '% bone loss');
      if(t.mob === 3 && maxBone < 50) bad(w + 'mobility 3 needs severe bone loss');
      if(maxBone >= 70 && !t.mob) bad(w + maxBone + '% bone loss with no mobility');
      var fcs = [t.furc.f || 0, t.furc.l || 0];
      fcs.forEach(function(f){ num(f, 0, 3, w + 'furcation class'); });
      Object.keys(t.furc).forEach(function(s){ if(s !== 'f' && s !== 'l') bad(w + 'furcation surface ' + s + ' must be f or l'); });
      var fe = cat.furcations, filmF = fe.some(function(e){ return e.film; });
      if((fcs[0] || fcs[1] || t.furcX) && !fe.length) bad(w + 'a furcation on a tooth with no furcation (' + cat.roots.join(', ') + ' root' + (cat.roots.length > 1 ? 's' : '') + ')');
      [['f', fcs[0]], ['l', fcs[1]]].forEach(function(e){ if(e[1] && fe.length && !fe.some(function(x){ return x.from === e[0]; })) bad(w + 'no furcation entrance is probed from the ' + (e[0] === 'f' ? 'facial' : 'lingual')); });
      if(t.furcX && fe.length && !filmF) bad(w + 'furcX: a film doesn\'t show this tooth\'s furcation (its roots overlap)');
      if(fe.length){
        var fmax = Math.max(fcs[0], fcs[1]), trk = cat.trunk;
        if(fmax >= 1 && Math.max(boneMM(t, 'm'), boneMM(t, 'd')) < trk - 1.5 && !t.furcX) bad(w + 'a furcation involvement before bone loss has reached the root trunk (' + trk + ' mm)');
        if(fmax >= 2 && !t.furcX && filmF) bad(w + 'a Class II or III furcation should show on the film: set furcX');
        if(t.furcX > fmax) bad(w + 'the film shows more furcation loss (furcX ' + t.furcX + ') than the probe found (' + fmax + ')');
        if((fcs[0] === 3) !== (fcs[1] === 3) && !t.d.pal) bad(w + 'a Class III furcation is through and through: both surfaces');
      }
      if(t.endo && !t.implant && !t.od && !(t.crown || t.amalgam || t.resto.some(function(r){ return r.type !== 'veneer' && (cat.pos <= 3 ? /L/.test(r.s) : (/O/.test(r.s) || r.type === 'onlay' || (/M/.test(r.s) && /D/.test(r.s)))); })))
        bad(w + 'a root-filled tooth needs its access restored: a crown, or a restoration over the access (' + (cat.pos <= 3 ? 'L on an incisor or canine: a veneer alone leaves the lingual access open' : 'one with O') + '; Ray and Trope 1995)');
    });
    if(ts.some(function(t){ return t.pontic || t.abut; }) || toothKeys(spec.t).some(function(n){ return spec.t[n].pontic || spec.t[n].abut; })) bridgeCheck(spec, bad);
    if(spec.dentures || toothKeys(spec.t).some(function(n){ var r = spec.t[n]; return r.dent || r.clasp || r.rest || r.od; })) dentureCheck(spec, bad, num);
    if(spec.tests != null){ if(!Array.isArray(spec.tests)) bad('tests is a list'); else testsCheck(spec, bad); }
    return P;
  };

  /* ---------- root geometry shared by the chart, the film and the view: the tooth library's (widget/teeth.js) ---------- */
  var rAx = TL.rAx, rHw = TL.rHw, rootOutline = TL.rootOutline, mkRoots = TL.mkRoots, mkBack = TL.mkBack, trunkPts = TL.trunkPts;
  /* ---------- the periodontal chart: an SVG strip per surface plus the numbers as a table ---------- */
  var CK = 5.2, CW = 46, CPAD_L = 34;
  /* one tooth drawn crown-up in a column, in chart px: the CEJ at y0, the crown above it, the root (or roots) below */
  function chartTooth(t, cx, y0, k, mr){
    var d = t.d, s = '', sg = mr ? -1 : 1;   /* mesial at -x in the outline; mirror when mesial faces right */
    function X(x){ return cx + sg * x * k; }
    if(t.implant){
      var hw = t.implant.w / 2 * k, len = t.implant.len * k, L = [], R = [], pitch = .9 * k, n = Math.floor((len - 1.5 * k) / pitch), i;
      L.push([cx - hw, y0]); R.push([cx + hw, y0]);
      for(i = 0; i < n; i++){ var yy = y0 + .8 * k + i * pitch; L.push([cx - hw, yy], [cx - hw - .3 * k, yy + pitch * .4], [cx - hw, yy + pitch * .75]); R.push([cx + hw, yy + pitch * .3], [cx + hw + .3 * k, yy + pitch * .65], [cx + hw, yy + pitch]); }
      L.push([cx - hw * .7, y0 + len]); R.push([cx + hw * .7, y0 + len]);
      s += path('dc-implant', L.concat(R.reverse()));
      if(!t.implant.cover) s += path('dc-crown dc-restored', dense(crownMM(d), true, 4).map(function(p){ return [X(p[0]), y0 - p[1] * k]; }));
      return s;
    }
    var back = mkBack(d, X, k, y0), roots = mkRoots(d, X, k, y0);
    if(back) s += path('dc-root dc-back', rootOutline(back, 0, y0, y0));
    roots.forEach(function(r){ s += path('dc-root', rootOutline(r, 0, y0, y0)); });
    if(d.tr){ var tp = trunkPts(roots, sg, 0, y0 - 1, y0 + d.tr * k, k); if(tp) s += path('dc-root dc-trunk', tp); }
    /* v2.4: an overdenture abutment: the crown cut down to a dome, the canal's orifice sealed */
    if(t.od){ var dm = [], pl = [], i2; for(i2 = 0; i2 <= 16; i2++){ var a2 = Math.PI * i2 / 16; dm.push([X(-d.cv / 2 * Math.cos(a2)), y0 - domeMM(a2) * k]); pl.push([X(1.1 * Math.cos(a2)), y0 - (DOME - .3 - 1.1 * Math.sin(a2)) * k]); }
      return s + path('dc-crown dc-stump', dm.concat([[X(d.cv / 2), y0 + 2], [X(-d.cv / 2), y0 + 2]])) + path('dc-amalgam' + (t.od === 'composite' ? ' dc-comp' : t.od === 'gi' ? ' dc-gi' : ''), pl); }
    /* a retained root (v2.2): the crown broken off about a millimeter above the CEJ */
    if(t.retained){ var yc = y0 - .9 * k; return s + path('dc-crown dc-stump', clipHalf(dense(crownMM(d), true, 4).map(function(p){ return [X(p[0]), y0 - p[1] * k]; }), [0, yc], [1, yc], [cx, y0 + 5], .2 * k)); }
    s += path('dc-crown' + (t.crown ? ' dc-restored' : '') + (t.crownMat === 'gold' ? ' dc-goldcrown' : ''), dense(crownMM(d), true, 4).map(function(p){ return [X(p[0]), y0 - p[1] * k]; }));
    /* restorations by surface (Patient Box v2's resto, the library's outline); a v1 tooth with only amalgam:true keeps its box */
    if(t.resto.length) t.resto.forEach(function(r){ var cls = 'dc-amalgam' + (r.mat === 'composite' ? ' dc-comp' : r.mat === 'gold' ? ' dc-gold' : r.mat === 'ceramic' ? ' dc-cer' : r.mat === 'temporary' ? ' dc-temp' : '');
      if(r.type === 'veneer') return;
      TL.restoMM(typeOf(t.n), r.s, { per:4, mat:r.mat, type:r.type, overhang:r.overhang }).forEach(function(p){ s += path(cls, p.map(function(q){ return [X(q[0]), y0 - q[1] * k]; })); }); });
    else if(t.amalgam && posOf(t.n) >= 4) s += path('dc-amalgam', TL.restoMM(typeOf(t.n), 'O', { per:4 })[0].map(function(q){ return [X(q[0]), y0 - q[1] * k]; }));
    else if(t.amalgam) s += path('dc-amalgam', [[cx - d.cw * .32 * k, y0 - d.ch * k + .3 * k], [cx + d.cw * .32 * k, y0 - d.ch * k + .3 * k], [cx + d.cw * .22 * k, y0 - d.ch * .62 * k], [cx - d.cw * .22 * k, y0 - d.ch * .62 * k]]);
    return s;
  }
  function furcMark(cls, x, y, r){
    var tri = [[x, y + r], [x - r, y - r * .7], [x + r, y - r * .7]];
    if(cls >= 3) return path('dc-furc dc-furc3', tri);
    var s = path('dc-furc', tri);
    if(cls === 2) s += path('dc-furc dc-furc3', [[x, y + r], [x - r / 2, y + r * .15], [x + r / 2, y + r * .15]]);
    return s;
  }
  /* one surface strip: pd/rec/bop/pus for surface sf ('f' or 'l'); upper arches are shown crowns down */
  function chartStrip(spec, ts, sf, o){
    var up = isUpper(ts[0].n), k = CK, n = ts.length, W = CPAD_L + n * CW + 8, top = 16, numsY = 12;
    var mmUp = 13, mmDown = 15, y0 = top + mmUp * k, H = y0 + mmDown * k + 22, s = '';
    var hide = o.hide || {};
    s += '<rect class="dc-paper" x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/>';
    for(var mm = -3; mm <= 12; mm++){ var gy = y0 + mm * k; s += '<path class="dc-grid' + (mm === 0 ? ' dc-cej' : mm % 5 === 0 ? ' dc-grid5' : '') + '" d="M' + CPAD_L + ' ' + f1(gy) + 'H' + (W - 8) + '"/>'; }
    [0, 5, 10].forEach(function(mm){ s += txt(CPAD_L - 4, y0 + mm * k + 3.5, mm === 0 ? 'CEJ' : mm + ' mm', 'dc-ax', 'end'); });
    var inner = '';
    ts.forEach(function(t, i){
      var cx = CPAD_L + i * CW + CW / 2, mr = mesialRight(t.n), so = siteOrder(t.n), sx = [cx - 14, cx, cx + 14];
      if(t.missing && t.pontic){ var dp = t.d, sgp = mr ? -1 : 1; inner += path('dc-crown dc-restored' + (t.pontic === 'gold' ? ' dc-goldcrown' : ''), TL.ponticMM(typeOf(t.n), { per:4 }).map(function(p){ return [cx + sgp * p[0] * k, y0 - p[1] * k]; })); return; }
      if(t.missing){ inner += '<path class="dc-x" d="M' + f1(cx - 10) + ' ' + f1(y0 - 24) + 'l20 20m0 -20l-20 20"/>'; return; }
      inner += chartTooth(t, cx, y0, k, mr);
      if(t.implant && t.implant.cover) return;   /* submerged under the mucosa: nothing to probe yet */
      if(hasFurc(t.n) && !hide.furc && (t.furc[sf] || 0) > 0) inner += furcMark(t.furc[sf], cx, y0 + CAT(t.n).trunk * k + 2, 5);
      /* the gingival margin and the pocket base through the three sites (tooth terms m, c, d in viewer order); the
         middle site's CEJ sits where the cervical line dips */
      var gm = [], pb = [], dip = t.implant ? 0 : (t.d.cej || 0) * k;
      so.forEach(function(si, j){ var rec = t.rec[sf][si], pd = t.pd[sf][si], base = y0 + (si === 1 ? dip : 0); gm.push([sx[j], base + rec * k]); pb.push([sx[j], base + (rec + pd) * k]); });
      inner += path('dc-pocket', gm.concat(pb.slice().reverse()));
      inner += path('dc-gm', gm, true) + path('dc-pd', pb, true);
      so.forEach(function(si, j){ var p = pb[j];
        if(t.bop[sf][si]) inner += dot('dc-bop', p[0], p[1], 3.2);
        if(t.pus[sf][si]) inner += dot('dc-pus', p[0] + 5, p[1] - 3, 2.6); });
    });
    s += up ? '<g transform="translate(0 ' + f1(2 * y0) + ') scale(1 -1)">' + inner + '</g>' : inner;
    ts.forEach(function(t, i){ var cx = CPAD_L + i * CW + CW / 2;
      s += txt(cx, up ? H - 6 : numsY, '#' + t.n, 'dc-num', 'middle');
      if(!t.missing && !hide.mob) s += txt(cx, up ? numsY : H - 6, 'M' + t.mob, 'dc-mob', 'middle'); });
    var label = (sf === 'f' ? 'Facial' : 'Lingual') + ' surfaces, ' + (up ? 'upper' : 'lower') + ' ' + ts[0].n + ' to ' + ts[n - 1].n;
    return '<svg class="dc-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label + ': the probing chart drawn as lines; the numbers are in the table below') + '">' + s + '</svg>';
  }
  function chartTable(spec, ts, sf, o){
    var hide = o.hide || {};
    function cells(fn, mob){ return ts.map(function(t){ if(t.missing) return '<td class="pc-miss">' + (t.pontic ? 'pontic' : 'X') + '</td>';
      if(t.implant && t.implant.cover && !mob) return '<td class="pc-miss">submerged</td>'; return '<td>' + fn(t) + '</td>'; }).join(''); }
    function sites(t, arr, mark){ return '<span class="pc-sites">' + siteOrder(t.n).map(function(si){ return '<span class="' + (mark && mark[si] ? 'bop' : '') + '">' + esc(arr[si]) + '</span>'; }).join('') + '</span>'; }
    var h = '<table class="pchart dc-table"><caption class="dc-cap">' + (sf === 'f' ? 'Facial' : 'Lingual') + ' surfaces: three sites per tooth, left to right as you look at the patient</caption><thead><tr><th scope="row">Tooth</th>' +
      ts.map(function(t){ return '<th scope="col">#' + esc(t.n) + (t.implant ? '<br><small>implant</small>' : '') + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += '<tr><th scope="row">Probing depth</th>' + cells(function(t){ return sites(t, t.pd[sf], t.bop[sf]); }) + '</tr>';
    h += '<tr><th scope="row">Recession</th>' + cells(function(t){ return sites(t, t.rec[sf]); }) + '</tr>';
    if(!hide.cal) h += '<tr><th scope="row">CAL</th>' + cells(function(t){ return sites(t, t.cal[sf]); }) + '</tr>';
    if(ts.some(function(t){ return t.pus[sf].some(Boolean); })) h += '<tr><th scope="row">Suppuration</th>' + cells(function(t){ return siteOrder(t.n).map(function(si){ return t.pus[sf][si] ? '<span class="pc-flag">+</span>' : '<span>–</span>'; }).join(''); }) + '</tr>';
    if(ts.some(function(t){ return t.plaque[sf].some(Boolean); })) h += '<tr><th scope="row">Plaque</th>' + cells(function(t){ return siteOrder(t.n).map(function(si){ return t.plaque[sf][si] ? '<span class="pc-flag">+</span>' : '<span>–</span>'; }).join(''); }) + '</tr>';
    if(sf === 'f'){
      if(!hide.mob) h += '<tr><th scope="row">Mobility</th>' + cells(function(t){ return t.mob ? '<span class="pc-flag">' + esc(t.mob) + '</span>' : '0'; }, true) + '</tr>';
      if(!hide.furc && ts.some(function(t){ return !t.missing && !t.implant && (isMolar(t.n) || (hasFurc(t.n) && (t.furc.f || t.furc.l))); })) h += '<tr><th scope="row">Furcation (Glickman)</th>' + cells(function(t){ if(!hasFurc(t.n) || t.implant) return '–'; var f = t.furc.f || 0, l = t.furc.l || 0; return (f ? '<span class="pc-flag">' + ['', 'I', 'II', 'III', 'IV'][f] + '</span> facial' : '') + (f && l ? ', ' : '') + (l ? '<span class="pc-flag">' + ['', 'I', 'II', 'III', 'IV'][l] + '</span> lingual' : '') || 'none'; }) + '</tr>';
    }
    return '<div class="pchart-wrap">' + h + '</tbody></table></div>';
  }
  /* a chart with both surfaces says so above each strip and at the top: the two strips look alike, and with the label only
     in the table's caption under each one, a student read them as two charts from two visits (Perio report #61, 2026-11-18) */
  function sideHead(sf, up){
    return '<p class="dc-side dc-side-' + sf + '"><b>' + (sf === 'f' ? 'Facial' : up ? 'Lingual (palatal)' : 'Lingual') + '</b> · the ' +
      (sf === 'f' ? 'cheek and lip' : up ? 'palate' : 'tongue') + ' side</p>';
  }
  I.chart = function(spec, o){
    spec = prep(spec); o = o || {}; var ts = teethOf(spec, o.teeth), hide = o.hide || {}, s = '';
    var surfaces = o.lingual === false ? ['f'] : (spec.lingual === false ? ['f'] : ['f', 'l']), two = surfaces.length > 1, up = isUpper(ts[0].n);
    if(two) s += '<p class="dc-sides">One chart from one visit: the facial side of these teeth, then the lingual side of the same teeth.</p>';
    surfaces.forEach(function(sf){ s += (two ? '<div class="dc-surf">' + sideHead(sf, up) : '') + chartStrip(spec, ts, sf, o) + chartTable(spec, ts, sf, o) + (two ? '</div>' : ''); });
    s += '<div class="pchart-key">Blue line: the gingival margin. Red line: the base of the pocket (probing depth below the margin). <span class="bop">Red dot</span>: bleeding on probing; yellow dot: suppuration. Recession is the CEJ to the margin, in mm; a negative number means the margin sits coronal to the CEJ.' +
      (hide.cal ? '' : ' CAL = probing depth + recession.') + (ts.some(function(t){ return t.implant && !t.implant.cover; }) ? ' An implant\'s numbers are measured from its platform (drawn on the CEJ line), where a tooth\'s are from its CEJ.' : '') +
      (ts.some(function(t){ return t.implant && t.implant.cover; }) ? ' An implant under its cover screw is submerged under the mucosa, not yet probed.' : '') + ' M = mobility (0-3).' + (hide.furc ? '' : ' Furcation triangles: open = Class I, half filled = II, filled = III.') + '</div>';
    return s;
  };

  /* ---------- the radiograph ---------- */
  /* o: { t:type, x, k, occ, m (mirror: mesial faces right), bone:[mesial mm, distal mm] below the normal crest, implant,
     lift, funnel, pdl, lam, crown, endo, amalgam, calc, halo } */
  function xrTooth(o){
    var d = XT[o.t], k = o.k, sg = o.m ? -1 : 1, top = o.occ + (o.lift || 0) * k, cej = top + d.ch * k;
    function X(x){ return o.x + sg * x * k; }
    var cr = dense(crownMM(d), true, 6).map(function(p){ return [X(p[0]), cej - p[1] * k]; });
    var g = { o:o, d:d, k:k, x:o.x, cej:cej, top:top, sg:sg, X:X, crown:cr, roots:[] };
    var crestY = cej + 1.5 * k, bm = (o.bone && o.bone[0]) || 0, bd = (o.bone && o.bone[1]) || 0;
    g.crestM = crestY + bm * k; g.crestD = crestY + bd * k;
    if(o.ridge != null){ g.crestM = g.crestD = crestY + o.ridge * k; return g; }
    if(o.implant || (o.pontic && !o.rtip)) return g;
    g.roots = mkRoots(d, X, k, cej);
    g.back = mkBack(d, X, k, cej);
    /* external apical root resorption (v2.2): the root shorter by mm, its end blunted (the old half width there, a little wider) */
    (o.rsp || []).forEach(function(x){ if(x.type !== 'apical') return; var mm = (x.mm == null ? 2 : x.mm) * k;
      function cut(r){ var f = Math.max(.5, 1 - mm / r.len); return { a0:r.a0, a1:rAx(r, f), w0:r.w0, wa:Math.max(r.wa, rHw(r, f) * 1.1), y0:r.y0, len:r.len * f }; }
      g.roots = g.roots.map(function(r, i){ return !x.root || rootName(g, i) === x.root ? cut(r) : r; });
      if(g.back && !x.root) g.back = cut(g.back); });
    /* a root tip left in a healed socket (v2.2): the apical len mm of one root, its coronal end broken obliquely */
    if(o.rtip){ var nm = g.roots.map(function(r, i){ return rootName(g, i); }), ri = Math.max(0, nm.indexOf(o.rtip.root || nm[0])), r0 = g.roots[ri] || g.roots[0], f0 = Math.max(.3, 1 - (o.rtip.len || 4) * k / r0.len);
      var fr = { a0:rAx(r0, f0), a1:r0.a1, w0:rHw(r0, f0), wa:r0.wa, y0:r0.y0 + f0 * r0.len, len:(1 - f0) * r0.len }, sl = (+o.n % 2 ? 1 : -1) * .45 * k;
      g.site = g.roots; g.roots = [fr]; g.back = null; g.frag = true;
      g.fragLine = [[fr.a0 - 3 * fr.w0, fr.y0 + .55 * k + sl], [fr.a0 + 3 * fr.w0, fr.y0 + .55 * k - sl]]; }
    return g;
  }
  /* the fracture line across a root tip's coronal end (off px further toward the crown, for its socket), jagged */
  function fragCut(g, pts, off){ var L = g.fragLine, fr = g.roots[0];
    return clipHalf(pts, [L[0][0], L[0][1] - off], [L[1][0], L[1][1] - off], [rAx(fr, 1), fr.y0 + fr.len], .14 * g.k); }
  function crestLR(g){ return g.sg > 0 ? [g.crestM, g.crestD] : [g.crestD, g.crestM]; }
  function socketSVG(g, dd, cls){
    if(g.o.implant || g.o.ridge != null || (g.o.pontic && !g.frag)) return '';
    var c = crestLR(g), s = '', fun = (g.o.funnel || 0) * g.k;
    g.roots.forEach(function(r){ var pts = rootOutline(r, dd * g.k, c[0], c[1], fun); s += path(cls, g.frag ? fragCut(g, pts, dd * g.k) : pts); });
    if(g.d.tr && !g.frag){ var y0 = Math.min(c[0], c[1]), tf = trunkPts(g.roots, g.sg, dd * g.k, y0, g.cej + g.d.tr * g.k, g.k); if(tf) s += path(cls, tf); }
    return s;
  }
  function toothSVG(g){
    var s = '', o = g.o, k = g.k, d = g.d;
    if(o.ridge != null) return '';
    if(o.implant) return implantSVG(g);
    if(o.pontic) return ponticSVG(g) + (o.rtip ? fragSVG(g) : '');
    if(o.rtip) return fragSVG(g);
    if(o.retained) return stumpSVG(g);
    if(o.od) return odSVG(g);
    var cut = fxCut(g);
    function C(pts){ return cut ? cut(pts) : pts; }
    if(g.back) s += path('xr-dentin', rootOutline(g.back, 0, g.cej, g.cej), false, 'opacity:.5');
    s += path('xr-dentin', [[g.X(-d.cv / 2 + .15), g.cej - 1.6 * k], [g.X(d.cv / 2 - .15), g.cej - 1.6 * k], [g.X(d.cv / 2 - .1), g.cej + 2], [g.X(-d.cv / 2 + .1), g.cej + 2]]);
    g.roots.forEach(function(r){ s += path('xr-dentin', rootOutline(r, 0, g.cej, g.cej)); });
    if(d.tr){ var tp = trunkPts(g.roots, g.sg, 0, g.cej - 1, g.cej + d.tr * k, k); if(tp) s += path('xr-dentin', tp); }
    /* the enamel cap thins to nothing at the CEJ; dentin inside it (the library's DEJ). Under a full crown the tooth was
       prepared: no enamel is left, only the dentin core inside the crown's shell */
    if(o.crown) s += path('xr-dentin', g.crown);
    else { s += path('xr-enamel', C(g.crown)); s += path('xr-dentin', C(TL.dejPts(g.crown, d, g.x, g.top, g.cej, k))); }
    s += pulpSVG(g, C);
    s += rspSVG(g, 'pulp');
    if(o.endo) s += endoSVG(g);
    if(o.endo && !o.crown) s += accessSVG(g, C);
    if(o.eo && o.crown) s += coreSVG(g);
    if(o.caries && !o.crown) s += cariesSVG(g, true);
    /* restorations by surface (Patient Box v2's resto); a v1 tooth with only amalgam:true keeps its occlusal restoration */
    /* an incisor's or canine's lingual restoration on a root-filled tooth is its access restoration: accessSVG draws it, where
       the access is (a film projects it over the middle of the crown), not as a cervical Class V */
    if(o.resto && o.resto.length) s += o.resto.map(function(r){ return o.endo && !o.crown && posOf(o.n || 4) <= 3 && r.s === 'L' && (r.type || 'direct') === 'direct' ? '' : restoSVG(g, r, C); }).join('');
    else if(o.amalgam) s += amalgamSVG(g);
    if(o.caries) s += cariesSVG(g, false, C);
    if(o.crownMat) s += crownMatSVG(g);
    else if(o.crown) s += crownSVG(g);
    if(o.crown && o.margin) s += marginSVG(g);
    if(o.crown && o.caries) s += recurRootSVG(g);
    if(o.wing) s += wingSVG(g);
    (o.fx || []).forEach(function(f){ if(f.type === 'hrf') s += hrfSVG(g, f); if(f.type === 'cusp' && /L/.test(f.cusp)) s += cuspFadeSVG(g, f); });
    if(o.calc) s += calcSVG(g);
    s += rspSVG(g, 'end');
    return s;
  }
  /* a root tip in a healed socket (v2.2): the fragment's dentin, its canal running out at the break; its PDL space and lamina dura
     are the socket's (filmBG), the bone over it the healed ridge's */
  function fragSVG(g){
    var fr = g.roots[0], k = g.k, L = [], R = [];
    for(var i = 0; i <= 10; i++){ var t = .94 * i / 10, x = rAx(fr, t), y = fr.y0 + t * fr.len, hw = Math.max(.07, .3 - .24 * t) * k; L.push([x - hw, y]); R.unshift([x + hw, y]); }
    L.push([rAx(fr, .97), fr.y0 + .97 * fr.len]);
    return path('xr-dentin', fragCut(g, rootOutline(fr, 0, fr.y0, fr.y0), 0)) + path('xr-pulp', fragCut(g, dense(L.concat(R), true, 3), 0));
  }
  /* a retained root (v2.2): the crown lost to decay to about a millimeter above the CEJ, its top ragged, the chamber open there, a
     band of soft decayed dentin along the break; the root, its PDL and lamina dura as a tooth's */
  function stumpSVG(g){
    var o = g.o, k = g.k, d = g.d, y = g.cej - .9 * k, keep = [g.x, g.cej + 3 * k], s = '';
    function C(p){ return clipHalf(p, [0, y], [1, y], keep, .24 * k); }
    if(g.back) s += path('xr-dentin', rootOutline(g.back, 0, g.cej, g.cej), false, 'opacity:.5');
    s += path('xr-dentin', C([[g.X(-d.cv / 2 + .15), g.cej - 1.6 * k], [g.X(d.cv / 2 - .15), g.cej - 1.6 * k], [g.X(d.cv / 2 - .1), g.cej + 2], [g.X(-d.cv / 2 + .1), g.cej + 2]]));
    g.roots.forEach(function(r){ s += path('xr-dentin', rootOutline(r, 0, g.cej, g.cej)); });
    if(d.tr){ var tp = trunkPts(g.roots, g.sg, 0, g.cej - 1, g.cej + d.tr * k, k); if(tp) s += path('xr-dentin', tp); }
    var stub = C(g.crown), yc = y + .55 * k;
    s += path('xr-dentin', stub) + pulpSVG(g, C) + path('xr-car', clipHalf(stub, [0, yc], [1, yc], [g.x, g.top], .18 * k));
    if(o.calc) s += calcSVG(g);
    return s;
  }
  /* the dome's height above the CEJ (mm) at angle a along it (0 and pi: its cervical edges) */
  var DOME = 4.3; function domeMM(a){ return .4 + (DOME - .4) * Math.pow(Math.sin(a), .8); }
  /* v2.4: an overdenture abutment (the sources are in this file's header): root-filled, its crown cut down to a smooth dome about
     4.3 mm above the CEJ (2-3 mm above the gingival margin), the canal's orifice sealed with a plug a few mm deep: amalgam as bright
     as metal, composite and glass ionomer a little less */
  function odSVG(g){
    var o = g.o, k = g.k, d = g.d, v = d.cv / 2, s = '', dome = [], N = 16, i;
    if(g.back) s += path('xr-dentin', rootOutline(g.back, 0, g.cej, g.cej), false, 'opacity:.5');
    g.roots.forEach(function(r){ s += path('xr-dentin', rootOutline(r, 0, g.cej, g.cej)); });
    if(d.tr){ var tp = trunkPts(g.roots, g.sg, 0, g.cej - 1, g.cej + d.tr * k, k); if(tp) s += path('xr-dentin', tp); }
    dome.push([g.X(-v), g.cej + 2]);
    for(i = 0; i <= N; i++){ var a = Math.PI * i / N; dome.push([g.X(-v * Math.cos(a)), g.cej - domeMM(a) * k]); }
    dome.push([g.X(v), g.cej + 2]);
    s += path('xr-dentin', dome);
    if(o.endo) s += endoSVG(g);
    var pw = Math.min(1.3, v * .45), plug = [];
    for(i = 0; i <= N; i++){ var b = Math.PI * i / N; plug.push([g.X(pw * Math.cos(b)), g.cej - (DOME - .35 - 3 * Math.sin(b)) * k]); }
    s += path(o.od === 'amalgam' ? 'xr-metal' : o.od === 'composite' ? 'xr-comp' : 'xr-gi', plug);
    return s;
  }
  /* v2.4: a resin-bonded bridge's wing (the sources are in this file's header): a metal (or zirconia) plate under a millimeter thick
     bonded to the lingual enamel and wrapping the proximal next to the pontic. The beam passes through it, so it lies over the crown
     as a radiopaque band from about 1.5 mm short of the incisal edge or cusp tips to about 1 mm above the CEJ (the margin kept on
     enamel, above the gingiva) */
  function wingSVG(g){
    var k = g.k, y0 = g.top + 1.5 * k, y1 = g.cej - 1 * k, far = g.o.wingSide === 'm' ? 1 : -1, xc = g.X(far * (g.d.cw / 2 - 1.2));
    var band = clipHalf(clipHalf(g.crown, [0, y0], [1, y0], [g.x, g.cej], 0), [0, y1], [1, y1], [g.x, g.top], 0);
    /* it wraps the proximal next to the pontic and stops about a millimeter short of the other */
    band = clipHalf(band, [xc, 0], [xc, 1], [g.X(-far * g.d.cw), g.cej], 0);
    return path(g.o.wing === 'zirconia' ? 'xr-zr' : 'xr-metal', band, false, 'opacity:.82');
  }
  /* a point inside a closed outline (even-odd) */
  function inPoly(p, poly){ var c = false; for(var i = 0, j = poly.length - 1; i < poly.length; j = i++){ var a = poly[i], b = poly[j];
    if((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  /* n small spots inside an outline (px), seeded: a temporary's voids, the mottling of external cervical resorption */
  function spots(poly, n, R, cls, rx, ry){
    var xs = poly.map(function(p){ return p[0]; }), ys = poly.map(function(p){ return p[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), s = '';
    for(var m = 0, tries = 0; m < n && tries < 60; tries++){ var q = [x0 + (x1 - x0) * (.12 + .76 * R()), y0 + (y1 - y0) * (.12 + .76 * R())]; if(!inPoly(q, poly)) continue;
      s += '<ellipse class="' + cls + '" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" rx="' + f1(rx * (.75 + .5 * R())) + '" ry="' + f1(ry * (.75 + .5 * R())) + '"/>'; m++; }
    return s;
  }
  /* the root on one side of the tooth (px +1 right, -1 left): a molar's outermost root that way */
  function outerRoot(g, px){ var rs = g.roots; return rs.length > 1 ? (rs[0].a0 * px > rs[rs.length - 1].a0 * px ? rs[0] : rs[rs.length - 1]) : rs[0]; }
  function namedRoot(g, name){ if(name) for(var i = 0; i < g.roots.length; i++) if(rootName(g, i) === name) return g.roots[i]; return null; }
  /* resorption on a film (v2.2; the sources are in this file's header). Phase 'pulp' (after the pulp, before a filling): internal
     resorption, a smooth oval widening of the canal, symmetric about it, the canal's outline lost in it; external cervical
     resorption (ecrSVG). Phase 'end': replacement resorption (ankySVG). External apical resorption shortens the roots (xrTooth). */
  function rspSVG(g, phase){
    var o = g.o, k = g.k, s = '';
    (o.rsp || []).forEach(function(x, j){
      var R = rnd(+o.n * 17 + j * 5 + 3);
      if(phase === 'pulp' && x.type === 'internal'){ var r = namedRoot(g, x.root) || g.roots[0], t = AT_T[x.at || 'middle'], rad = (x.size || 2) / 2 * k, cx = rAx(r, t), cy = r.y0 + t * r.len, e = [];
        for(var i = 0; i < 28; i++){ var a = i / 28 * Math.PI * 2; e.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 1.3]); }
        s += path('xr-irr', e); }
      if(phase === 'pulp' && x.type === 'cervical') s += ecrSVG(g, x, R);
      if(phase === 'end' && x.type === 'replacement') s += ankySVG(g, x, R);
    });
    return s;
  }
  /* external cervical resorption: below the CEJ (under the enamel once past class 1), as long and as deep as its Heithersay class.
     On the mesial or distal, a ragged notch from the root's surface toward the canal that stops short of it; on the facial or
     lingual, an irregular radiolucency over the canal with the canal's walls still drawn through it; mottled from class 2 */
  function ecrSVG(g, x, R){
    var k = g.k, cls = x.heithersay || 2, side = x.side || 'm', Lc = [0, 1.3, 2.3, 3.8, 6.2][cls], y0 = g.cej + (cls >= 2 ? -.4 : .15) * k, y1 = g.cej + Lc * k, cwf = canalHw(g), s = '', N = 16, i;
    if(side === 'm' || side === 'd'){
      var px = (side === 'm' ? -1 : 1) * g.sg, r = namedRoot(g, x.root) || outerRoot(g, px), frac = [0, .35, .62, .88, .9][cls], out = [], inn = [];
      for(i = 0; i <= N; i++){ var u = i / N, y = y0 + (y1 - y0) * u, t = Math.max(0, (y - r.y0) / r.len), hw = rHw(r, t), surf = rAx(r, t) + px * hw;
        var reach = Math.max(.3 * k, hw - cwf(t) - .1 * k), dd = reach * frac * Math.pow(Math.sin(Math.PI * (.08 + .84 * u)), .5) * (.78 + .3 * R());
        out.push([surf + px * .06 * k, y]); inn.push([surf - px * dd, y]); }
      var P1 = out.concat(dense(inn, false, 2).reverse());
      return path('xr-ecr', P1) + (cls >= 2 ? spots(P1, cls >= 3 ? cls + 1 : 1, R, 'xr-mottle', .2 * k, .26 * k) : '');
    }
    var r0 = namedRoot(g, x.root) || g.roots[0], ym = (y0 + y1) / 2, tm = Math.max(0, (ym - r0.y0) / r0.len), cx = g.d.tr ? g.x : rAx(r0, tm), hwx = g.d.tr ? g.d.cv * .28 * k : rHw(r0, tm) * .78, hy = (y1 - y0) / 2, e = [];
    for(i = 0; i < 30; i++){ var a = i / 30 * Math.PI * 2, wob = 1 + .16 * Math.sin(a * 3 + R() * 2) + .1 * (R() - .5); e.push([cx + Math.cos(a) * hwx * wob, ym + Math.sin(a) * hy * wob]); }
    s += path('xr-ecr xr-ecr-f', e) + (cls >= 2 ? spots(e, cls >= 3 ? cls + 2 : 2, R, 'xr-mottle', .2 * k, .26 * k) : '');
    var pulp = TL.pulpPts(g.d, g.X, k, g.cej, g.roots)[0], Lw = [], Rw = [];
    for(i = 2; i <= 12; i++){ var yy = y0 + (y1 - y0) * i / 14, sp = spanAt(pulp, yy); if(!sp) continue; Lw.push([sp[0], yy]); Rw.push([sp[1], yy]); }
    if(Lw.length > 1) s += path('xr-prrs', Lw, true) + path('xr-prrs', Rw, true);
    return s;
  }
  /* replacement resorption (ankylosis): along mm of the root on each side named, the PDL space and lamina dura gone, the bone
     running straight onto the root and into it, the root's edge eaten and replaced by bone */
  function ankySVG(g, x, R){
    var k = g.k, o = g.o, sides = x.side === 'm' ? ['m'] : x.side === 'd' ? ['d'] : ['m', 'd'], t = AT_T[x.at || 'middle'], L = (x.mm == null ? 4 : x.mm) * k, dd = ((o.pdl || .2) + (o.lam || .22) + .12) * k, s = '';
    sides.forEach(function(sd){
      var px = (sd === 'm' ? -1 : 1) * g.sg, r = namedRoot(g, x.root) || outerRoot(g, px), yc = r.y0 + t * r.len, ya = Math.max(r.y0 + .12 * r.len, yc - L / 2), yb = Math.min(r.y0 + .97 * r.len, yc + L / 2), out = [], inn = [], N = 18;
      for(var i = 0; i <= N; i++){ var u = i / N, y = ya + (yb - ya) * u, tt = (y - r.y0) / r.len, surf = rAx(r, tt) + px * rHw(r, tt), e = Math.min(1, prof(u, .6) * 2.2);
        out.push([surf + px * dd * e, y]); inn.push([surf - px * (.1 + .42 * prof(u, .45) * (.6 + .6 * R())) * k, y]); }
      var P2 = out.concat(inn.reverse());
      s += path('xr-bone', P2) + spots(P2, 3, R, 'xr-tb', .45 * k, .2 * k);
    });
    return s;
  }
  /* proximal root caries (v2.2; White and Pharoah): under the contact on the bared root, between the CEJ and the bone crest, a
     saucer-shaped radiolucency from the root's surface, deepest at its middle, its inner margin ill defined (a soft outer layer
     round a darker core), deepest toward its coronal end; dentin a shallow saucer, pulp reaching the canal */
  function rootCarSVG(g, c){
    var k = g.k, px = (c.s === 'M' ? -1 : 1) * g.sg, r = outerRoot(g, px), crest = c.s === 'M' ? g.crestM : g.crestD, deep = c.depth === 'pulp', cwf = canalHw(g), s = '';
    var y0 = g.cej - .1 * k, y1 = Math.max(g.cej + 1.4 * k, Math.min(g.cej + (deep ? 3.4 : 3) * k, crest - .3 * k)), N = 16, R = rnd(+g.o.n * 7 + (c.s === 'M' ? 1 : 2));
    [[1.2, 'xr-car xr-car-soft'], [1, 'xr-car']].forEach(function(Lr, j){ var out = [], inn = [];
      for(var i = 0; i <= N; i++){ var u = i / N, y = y0 + (y1 - y0) * u, t = Math.max(0, (y - r.y0) / r.len), hw = rHw(r, t), surf = rAx(r, t) + px * hw;
        var reach = Math.max(.3 * k, hw - cwf(t) - (deep ? .02 : .3) * k), dd = reach * (deep ? .96 : .4) * Lr[0] * Math.pow(Math.sin(Math.PI * Math.pow(u, .72)), deep ? .6 : .85) * (j && i && i < N ? .88 + .2 * R() : 1);
        out.push([surf + px * .06 * k, y]); inn.push([surf - px * dd, y]); }
      s += path(Lr[1], out.concat(dense(inn, false, 3).reverse())); });
    return s;
  }
  /* px from the library's mm (mesial at -x, the cervix at 0, the crown up) */
  function mmPx(g, pts){ return pts.map(function(q){ return [g.X(q[0]), g.cej - q[1] * g.k]; }); }
  /* a half-plane clip (Sutherland-Hodgman, one edge: fine for any polygon), the cut edge made a little irregular the same way
     for every layer it crosses, so the enamel, dentin and pulp end on one fracture line */
  function sideOf(A, B, p){ return (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]); }
  function clipHalf(poly, A, B, keep, jag){
    var sk = sideOf(A, B, keep) > 0 ? 1 : -1, out = [], n = poly.length, i;
    for(i = 0; i < n; i++){ var p = poly[i], q = poly[(i + 1) % n], sp = sk * sideOf(A, B, p), sq = sk * sideOf(A, B, q);
      if(sp >= 0) out.push(p);
      if((sp >= 0) !== (sq >= 0)){ var tt = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * tt, p[1] + (q[1] - p[1]) * tt, 1]); } }
    if(!jag || out.length < 3) return out;
    var L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / L, uy = (B[1] - A[1]) / L, res = [];
    for(i = 0; i < out.length; i++){ var a = out[i], b = out[(i + 1) % out.length]; res.push(a);
      if(a[2] && b[2]){ var sa = (a[0] - A[0]) * ux + (a[1] - A[1]) * uy, sb = (b[0] - A[0]) * ux + (b[1] - A[1]) * uy, step = jag * 1.6, m = Math.max(1, Math.round(Math.abs(sb - sa) / step));
        for(var j = 1; j < m; j++){ var sj = sa + (sb - sa) * j / m, u = sj / (jag * 7), off = jag * (Math.sin(u * 2.3) + .5 * Math.sin(u * 5.9 + 1.3)) * sk;
          res.push([A[0] + ux * sj - uy * off, A[1] + uy * sj + ux * off]); } } }
    return res;
  }
  /* where a crown fracture or a fractured buccal cusp cuts the crown (mm, then px): enamel only a corner chip, into the dentin a
     larger piece, into the pulp an oblique loss through the horn (Andreasen's classes, as Cohen's draws them) */
  function fxLine(d, f){
    var w = d.cw / 2, h = d.ch, sg = f.side === 'd' ? 1 : -1, hy = TL.hornsMM(d)[0][1];
    if(f.type === 'crown'){
      if(f.depth === 'enamel') return [[sg * (w + .3), h - 1.7], [sg * (w - 1.9), h + .4]];
      if(f.depth === 'dentin') return [[sg * (w + .3), h - 3.3], [sg * (w - 3.6), h + .4]];
      return [[sg * (w + .5), hy - 2.0], [-sg * (w + .5), hy + 1.6]];
    }
    if(f.cusp === 'B') return [[-(w + .5), h - 2.6], [w + .5, h - 1.5]];
    var c = f.cusp.charAt(0) === 'M' ? -1 : 1;
    return [[c * (w + .5), h - 2.7], [-c * .4, h + .4]];
  }
  function fxCut(g){
    var f = (g.o.fx || []).filter(function(x){ return x.type === 'crown' || (x.type === 'cusp' && /B/.test(x.cusp)); })[0];
    if(!f) return null;
    var Lm = fxLine(g.d, f), A = mmPx(g, [Lm[0]])[0], B = mmPx(g, [Lm[1]])[0], keep = mmPx(g, [[0, .5]])[0];
    return function(pts){ return clipHalf(pts, A, B, keep, .14 * g.k); };
  }
  /* a fractured lingual cusp: the buccal cusp still projects over its place, so the film shows one layer less there, not a gap */
  function cuspFadeSVG(g, f){
    var Lm = fxLine(g.d, { type:'cusp', cusp:f.cusp.replace('L', 'B') }), A = mmPx(g, [Lm[0]])[0], B = mmPx(g, [Lm[1]])[0], away = mmPx(g, [[0, g.d.ch + 3]])[0];
    return path('xr-fade', clipHalf(g.crown, A, B, away, .14 * g.k));
  }
  /* a horizontal root fracture: a thin, slightly oblique, irregular radiolucent line across the root (and its filling) */
  function hrfSVG(g, f){
    var r = g.roots[0], k = g.k, tt = f.at === 'cervical' ? .24 : f.at === 'apical' ? .78 : .5, y = r.y0 + tt * r.len, x = rAx(r, tt), hw = rHw(r, tt) + .04 * k, top = [], bot = [];
    for(var i = 0; i <= 8; i++){ var u = i / 8, xx = x - hw + 2 * hw * u, yy = y + (u - .5) * .9 * k + Math.sin(u * 9.1) * .12 * k, th = (.16 + .08 * Math.sin(u * 5.3 + 1)) * k; top.push([xx, yy - th]); bot.unshift([xx, yy + th]); }
    return path('xr-frac', top.concat(bot));
  }
  /* the pulp (the library's outline); in a root-filled tooth the chamber and canals are filled: a core in the chamber,
     gutta-percha down the canals (endoSVG draws it over), so no dark pulp space is left. With v2.1's detail (an endo object)
     the canals are drawn dark and the gutta-percha goes over them, so a short filling or a missed canal leaves its canal
     showing, and the chamber holds the core's material */
  function pulpSVG(g, C){
    var o = g.o, parts = TL.pulpPts(g.d, g.X, g.k, g.cej, g.roots), cut = C || function(p){ return p; };
    if(!o.endo) return parts.map(function(p){ return path('xr-pulp', cut(p)); }).join('');
    var core = accessCls(g), yc = g.cej + .3 * g.k, s = '';
    if(!o.eo) return parts.map(function(p, i){ return path('xr-core', p) + (i || o.crown ? '' : path(core, g.d.tr ? p : clipHalf(p, [0, yc], [1, yc], [g.x, g.cej - 6 * g.k]))); }).join('');
    /* a single-rooted tooth's canal flares into its chamber: the gutta-percha fills the flare wall to wall (the canal below it is
       filled by endoDetailSVG), so no dark sliver of pulp is left between the filling and the access */
    var yf = g.cej + 1.6 * g.k, gp = !(o.eo.missed && o.eo.missed === rootName(g, 0));
    parts.forEach(function(p, i){
      if(g.d.tr){ s += path(i === 0 ? core : 'xr-pulp', p); return; }
      s += path('xr-pulp', p) + (gp ? path('xr-metal', clipHalf(p, [0, yf], [1, yf], [g.x, g.cej - 6 * g.k])) : '') + path(core, clipHalf(p, [0, yc], [1, yc], [g.x, g.cej - 6 * g.k]));
    });
    return s;
  }
  function rootName(g, i){ var c = CAT(g.o.n); return c ? (c.pos >= 6 ? c.roots[i] : c.roots[0]) : ''; }
  /* a root canal filling: radiopaque gutta-percha down each canal to just short of the apex (v1: endo:true). The detail
     (Cohen's Pathways of the Pulp; White and Pharoah): adequate ends 0.5-2 mm short of the radiographic apex; short more than
     2 mm short (Sjogren 1990), the canal dark beyond it; long past the apex with a puff of sealer; voids dark gaps in a poorly condensed
     filling; a separated instrument a thin, brighter fragment in the apical third with the filling stopping on it; a missed
     canal no filling at all; a post down the coronal two thirds, leaving 4-5 mm of gutta-percha: cast (as bright as metal,
     tapered, one piece with its core), prefabricated metal (parallel, serrated) or fiber (barely more radiopaque than dentin,
     outlined by its cement). */
  function endoSVG(g){
    var s = '', k = g.k, eo = g.o.eo;
    if(eo) return endoDetailSVG(g, eo);
    g.roots.forEach(function(r){ var L = [], R = [], N = 10;
      for(var i = 0; i <= N; i++){ var t = .02 + .9 * i / N, x = rAx(r, t), y = r.y0 + t * r.len, hw = (.5 - .36 * t) * k; L.push([x - hw, y]); R.unshift([x + hw, y]); }
      s += path('xr-metal', L.concat(R)); });
    if(g.back) s += path('xr-metal', gpPts(g.back, k, .02, .92), false, 'opacity:.6');
    if(g.d.tr) s += path('xr-metal', [[g.X(-g.d.cv * .3), g.cej + 1.2 * k], [g.X(g.d.cv * .3), g.cej + 1.2 * k], [g.X(g.d.cv * .3), g.cej - .4 * k], [g.X(-g.d.cv * .3), g.cej - .4 * k]]);
    return s;
  }
  /* gutta-percha down a canal from t0 to t1 (of the root's length): f its width as a share of the canal's (cw, the canal's half
     width at t, from the library's pulp: a filled canal is filled wall to wall), or v1's taper without cw */
  function gpPts(r, k, t0, t1, f, cw){ var L = [], R = [], N = 10; f = f || 1;
    for(var i = 0; i <= N; i++){ var t = t0 + (t1 - t0) * i / N, x = rAx(r, t), y = r.y0 + t * r.len, hw = (cw ? cw(t) : (.5 - .36 * t) * k) * f; L.push([x - hw, y]); R.unshift([x + hw, y]); }
    return L.concat(R); }
  /* the canal's half width (px) at t, as TL.pulpPts draws it: a molar's canals one taper, a single-rooted tooth's wider at the
     cervix */
  function canalHw(g){ var k = g.k; return g.d.tr ? function(t){ return (.55 - .4 * t) * k; } : function(t){ return Math.max(.45, (.95 - .8 * Math.pow(Math.max(0, t), .7)) * k * .85); }; }
  function postRoot(g){ var c = CAT(g.o.n); if(c && c.pos >= 6) return isUpper(g.o.n) && g.back ? g.back : g.roots[1]; return g.roots[0]; }
  function endoDetailSVG(g, eo){
    var s = '', k = g.k, fill = eo.fill || 'adequate', cw = canalHw(g);
    /* the root behind (a maxillary molar's palatal root, a first premolar's palatal one) is filled too, as faint as its root */
    if(g.back){ var tb = fill === 'short' ? Math.max(.45, 1 - 3.8 * k / g.back.len) : fill === 'long' ? .98 : .92;
      s += path('xr-metal', gpPts(g.back, k, .02, tb, fill === 'voids' ? .82 : 1), false, 'opacity:.6'); }
    g.roots.forEach(function(r, i){
      var name = rootName(g, i); if(eo.missed && eo.missed === name) return;
      var sep = eo.sep && eo.sep === name, t1 = sep ? .68 : fill === 'short' ? Math.max(.45, 1 - 3.8 * k / r.len) : fill === 'long' ? 1 : .92;
      s += path('xr-metal', gpPts(r, k, .02, t1, fill === 'voids' ? .82 : 1, cw));
      if(fill === 'long'){ var ax = rAx(r, 1), ay = r.y0 + r.len, dx = rAx(r, 1) - rAx(r, .9), dy = .1 * r.len, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, e = 1.3 * k;
        s += path('xr-metal', [[ax - .2 * k, ay - .2 * k], [ax + ux * e - .08 * k, ay + uy * e], [ax + ux * e + .08 * k, ay + uy * e], [ax + .2 * k, ay - .2 * k]]);
        [[.2, 1.25, .5, .32], [-.55, 1.0, .34, .26], [.75, .7, .3, .22]].forEach(function(b){ s += '<ellipse class="xr-sealer" cx="' + f1(ax + ux * e + b[0] * k) + '" cy="' + f1(ay + b[1] * k) + '" rx="' + f1(b[2] * k) + '" ry="' + f1(b[3] * k) + '"/>'; }); }
      if(fill === 'voids') [.3, .52, .7].forEach(function(t, j){ s += '<ellipse class="xr-void" cx="' + f1(rAx(r, t) + (j % 2 ? .08 : -.08) * k) + '" cy="' + f1(r.y0 + t * r.len) + '" rx="' + f1(.13 * k) + '" ry="' + f1(.55 * k) + '"/>'; });
      if(sep) s += path('xr-file', gpPts(r, k, .71, .9, .34));
    });
    if(eo.post){ var r = postRoot(g), te = Math.min(.62, 1 - 4.8 * k / r.len), L = [], R = [], N = 8;
      for(var i = 0; i <= N; i++){ var t = te * i / N, x = rAx(r, t), y = r.y0 + t * r.len, hw = (eo.post === 'cast' ? .72 - .3 * t / te : .52) * k;
        if(eo.post === 'metal' && i % 2) hw += .09 * k;
        L.push([x - hw, y]); R.unshift([x + hw, y]); }
      var top = r.y0 - 1.6 * k, pts = [[L[0][0], top]].concat(L, R, [[R[R.length - 1][0], top]]);
      s += eo.post === 'fiber' ? path('xr-fiber', pts) : path('xr-metal', dense(pts, true, 2)); }
    return s;
  }
  /* a core build-up (or a cast core) inside a crown: the preparation's stump above a 1.8 mm ferrule of the tooth's own dentin.
     A cast post is one casting with its core; a crowned root-filled tooth given no core still has one (a light build-up) */
  function coreSVG(g){
    var P = TL.prepMM(g.o.t, g.o.crownMat || 'pfm'), y = g.cej - 1.8 * g.k;
    return path(accessCls(g), clipHalf(mmPx(g, P.poly), [0, y], [1, y], [g.x, g.top]));
  }
  /* what fills a root-filled tooth's chamber and access: the core under a crown (composite, or metal for amalgam and a cast
     post and core); without a crown, the restoration over the access (amalgam metal; composite, or a composite core under a
     gold or ceramic inlay or onlay), or a composite in an incisor's or canine's lingual access */
  function accessCls(g){
    var o = g.o, eo = o.eo || {};
    if(o.crown){ if(eo.core === 'composite') return 'xr-comp'; if(eo.core || eo.post === 'cast') return 'xr-metal'; return 'xr-core'; }
    if(posOf(o.n || 4) <= 3) return (o.resto || []).some(function(r){ return r.mat === 'temporary' && /L/.test(r.s); }) ? 'xr-temp' : 'xr-comp';
    var occ = (o.resto || []).filter(function(r){ return r.type !== 'veneer' && (/O/.test(r.s) || r.type === 'onlay' || (/M/.test(r.s) && /D/.test(r.s))); })[0];
    if(occ && occ.mat === 'temporary') return 'xr-temp';
    if(occ) return occ.mat === 'amalgam' && occ.type !== 'inlay' && occ.type !== 'onlay' ? 'xr-metal' : 'xr-comp';
    return o.amalgam ? 'xr-metal' : 'xr-comp';
  }
  /* where two points of a closed outline cross the height y: the leftmost and rightmost (px) */
  function spanAt(pts, y){
    var lo = null, hi = null;
    for(var i = 0; i < pts.length; i++){ var a = pts[i], b = pts[(i + 1) % pts.length];
      if(a[1] === b[1] || (a[1] - y) * (b[1] - y) > 0) continue;
      var x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); if(lo == null || x < lo) lo = x; if(hi == null || x > hi) hi = x; }
    return lo == null ? null : [lo, hi];
  }
  /* a root-filled tooth without a crown: the access cavity, opened through the occlusal surface (an incisor's or canine's
     lingual, which a film projects over the middle of the crown) into the unroofed chamber, as wide as the chamber with its walls
     flaring a little toward the occlusal (the roof removed whole, no overhang: Cohen's), and filled with the chamber's material, so
     a restoration over it meets the gutta-percha with no dentin bridge between */
  function accessSVG(g, C){
    var d = g.d, k = g.k, ch = TL.pulpPts(d, g.X, k, g.cej, g.roots)[0], ant = posOf(g.o.n || 4) <= 3;
    var yb = g.cej - (d.tr ? .5 : .2) * k, sp = spanAt(ch, yb); if(!sp) return '';
    var cx = (sp[0] + sp[1]) / 2, hw = (sp[1] - sp[0]) / 2, ht = d.tr ? hw * 1.08 : hw * 1.1 + .25 * k;
    var yt = ant ? g.cej - d.ch * .62 * k : g.cej - (d.ch - 1.5) * k, yd = yb + .5 * k;
    var pts = TL.filletClosed([[cx - hw, yd], [cx - ht, yt], [cx + ht, yt], [cx + hw, yd]], (ant ? .7 : .45) * k), out = path(accessCls(g), C ? C(pts) : pts);
    /* under a temporary filling (v2.2): a cotton pellet in the chamber over the canal orifices, radiolucent, the temporary over it */
    if(accessCls(g) === 'xr-temp'){ var py = d.tr ? g.cej + .15 * k : yb + .05 * k, prx = Math.max(.6 * k, hw * .8), pry = .72 * k, R = rnd(+g.o.n * 3 + 1), e = [];
      for(var i = 0; i < 22; i++){ var a = i / 22 * Math.PI * 2, wob = 1 + .1 * Math.sin(a * 5 + R() * 3); e.push([cx + Math.cos(a) * prx * wob, py + Math.sin(a) * pry * wob]); }
      out += path('xr-pellet', C ? C(e) : e); }
    return out;
  }
  /* a restoration's outline by its surfaces (the library's restoParts): metal for amalgam and gold, crisp and bright; composite a
     about as radiopaque as enamel or a little more; a ceramic inlay or onlay about as radiopaque as dentin (feldspathic or
     lithium disilicate: Pekkan 2011, Atala 2019), outlined on the tooth's side by its radiopaque resin cement (a line along the preparation's walls and floors, never past the tooth's surface); a veneer a
     faint shell over the labial face. An open margin's gap is dark, drawn under the restoration. Over an occlusal restoration
     the cusps project, so the crown above it is enamel (occCap) */
  function restoSVG(g, r, C){
    var cut = C || function(p){ return p; }, P = TL.restoParts(g.o.t, r.s, { mat:r.mat, type:r.type, overhang:r.overhang, open:r.open });
    var shapes = P.shapes.map(function(p){ return cut(mmPx(g, p)); }), s = '';
    if(r.type === 'veneer') return shapes.map(function(p){ return path('xr-veneer', p); }).join('');
    var cls = r.mat === 'composite' ? 'xr-comp' : r.mat === 'ceramic' ? 'xr-cer' : r.mat === 'temporary' ? 'xr-temp' : 'xr-metal';
    s += P.gaps.map(function(p){ return path('xr-gap', cut(mmPx(g, p))); }).join('');
    if(/O/.test(r.s) || r.type === 'onlay' || (/M/.test(r.s) && /D/.test(r.s))) s += occCap(g, shapes, cut);
    s += shapes.map(function(p){ return path(cls, p); }).join('');
    /* a temporary filling (v2.2): brighter than enamel (IRM, Cavit), with the small voids of a hand-packed material */
    if(r.mat === 'temporary'){ var R = rnd(+(g.o.n || 4) * 7 + r.s.length); s += shapes.map(function(p){ return spots(p, 3, R, 'xr-tvoid', .13 * g.k, .1 * g.k); }).join(''); }
    if(r.mat === 'ceramic' && !fxCut(g)) s += P.lines.map(function(l){ return path('xr-cement', mmPx(g, l), true); }).join('');
    return s;
  }
  /* the cusps over an occlusal restoration (posterior): the crown outline above the restoration's top, across its width, drawn as
     enamel, so no sliver of dentin shows between the restoration and the cusps */
  function occCap(g, shapes, cut){
    if(posOf(g.o.n || 4) < 4 || !shapes.length) return '';
    var xl = Infinity, xr = -Infinity, k = g.k, N = 48, up = [], lo = [], s = '';
    shapes.forEach(function(p){ p.forEach(function(q){ xl = Math.min(xl, q[0]); xr = Math.max(xr, q[0]); }); });
    function flush(){ if(up.length > 1) s += path('xr-enamel', cut(up.concat(lo))); up = []; lo = []; }
    /* column by column: from the crown's outline down to the restoration's top (a little under it, hidden by it) */
    for(var i = 0; i <= N; i++){ var x = xl + (xr - xl) * i / N, c = colAt(g.crown, x), rt = Infinity;
      shapes.forEach(function(p){ var r = colAt(p, x); if(r && r[0] < rt) rt = r[0]; });
      if(c && rt < Infinity && rt - c[0] > .02 * k){ up.push([x, c[0]]); lo.unshift([x, rt + .06 * k]); } else flush(); }
    flush();
    return s;
  }
  /* a polygon's extent along the vertical line at x: [top, bottom], or null */
  function colAt(pts, x){
    var lo = null, hi = null;
    for(var i = 0; i < pts.length; i++){ var a = pts[i], b = pts[(i + 1) % pts.length];
      if(a[0] === b[0] || (a[0] - x) * (b[0] - x) > 0) continue;
      var y = a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); if(lo == null || y < lo) lo = y; if(hi == null || y > hi) hi = y; }
    return lo == null ? null : [lo, hi];
  }
  /* v1's amalgam:true: an occlusal amalgam, drawn as the library's Class I (v2.1's cleaner outline) */
  function amalgamSVG(g){
    if(posOf(g.o.n || 4) >= 4){ var sh = mmPx(g, TL.restoMM(g.o.t, 'O')[0]); return occCap(g, [sh], function(p){ return p; }) + path('xr-metal', sh); }
    var k = g.k, d = g.d;
    var occ = g.crown.filter(function(p){ return p[1] < g.top + d.ch * .42 * k; });
    var floor = g.top + d.ch * .5 * k, box = g.top + d.ch * .66 * k;
    occ = occ.map(function(p){ return [g.x + (p[0] - g.x) * .97, p[1] + .25 * k]; });
    var a = occ[0], b = occ[occ.length - 1];
    function at(p, f, y){ return [g.x + (p[0] - g.x) * f, y]; }
    return path('xr-metal', occ.concat([[b[0], box], at(b, .74, box + .2 * k), at(b, .62, floor), at(a, .62, floor), at(a, .74, box + .2 * k), [a[0], box]]));
  }
  /* caries on a film (White and Pharoah), the library's cariesMM: a proximal lesion just cervical to the contact, a triangle
     in the enamel pointing at the DEJ, then (dentin, pulp) spreading along the DEJ with a second triangle toward the pulp;
     an occlusal lesion only once it is in the dentin; a facial or lingual one a fainter round shadow at the cervical third.
     Recurrent caries (recurrent:true) is drawn first, under the restoration: a radiolucency apical to its gingival floor and
     along its axial wall (or under a crown's margin) */
  function cariesSVG(g, recur, C){
    var cut = C || function(p){ return p; };
    return g.o.caries.map(function(c){
      if(!!c.recurrent !== !!recur) return '';
      /* decay on the facial or lingual (Patient Box, decay seen from the buccal): sound tooth lies in front of it, so a film shows
         only a faint round shadow (White and Pharoah), and a white spot given as one, nothing. Recurrent: at the Class V's or
         veneer's cervical edge; root caries: on the root, just apical to the CEJ */
      if(c.root && (c.s === 'M' || c.s === 'D')) return rootCarSVG(g, c);
      var face = c.s !== 'M' && c.s !== 'D' && c.s !== 'O' && c.s !== 'I';
      if(face && c.stage === 'white-spot') return '';
      if(face && (c.recurrent || c.root)){ var big = c.depth === 'pulp' ? 1.3 : c.depth === 'enamel' ? .8 : 1.05, cy = c.root ? -1.1 : .9, e = [];
        for(var i = 0; i < 18; i++){ var a = i / 18 * Math.PI * 2; e.push([Math.cos(a) * big * 1.2, cy + Math.sin(a) * big * .7]); }
        return path('xr-car xr-car-f', cut(mmPx(g, e))); }
      if(recur){ var rr = (g.o.resto || []).filter(function(r){ return r.type !== 'veneer' && r.s.indexOf(c.s) >= 0; })[0];
        return TL.recurMM(g.o.t, c.s, c.depth, { inc:!!(rr && /I/.test(rr.s)) }).map(function(p){ return path('xr-car', cut(mmPx(g, p))); }).join(''); }
      return TL.cariesMM(g.o.t, c.s, c.depth).map(function(sh){
      return path('xr-car' + (sh.face ? ' xr-car-f' : ''), cut(sh.pts.map(function(q){ return [g.X(q[0]), g.cej - q[1] * g.k]; }))); }).join(''); }).join('');
  }
  /* recurrent caries at a crown's margin (White and Pharoah): the crown hides the tooth inside it, so the lesion shows on the
     root just apical to the margin, a rounded radiolucency into the root's surface (enamel: shallow; dentin: about a third of the
     way in; pulp: deeper), its top on the margin; drawn after the crown */
  function recurRootSVG(g){
    var k = g.k, s = '';
    (g.o.caries || []).forEach(function(c){ if(!c.recurrent) return;
      if(c.s !== 'M' && c.s !== 'D'){ var e = [], b = c.depth === 'pulp' ? 1.3 : c.depth === 'enamel' ? .8 : 1.05;
        for(var j = 0; j < 18; j++){ var a = j / 18 * Math.PI * 2; e.push([Math.cos(a) * b * 1.2, -1 + Math.sin(a) * b * .7]); }
        s += path('xr-car xr-car-f', mmPx(g, e)); return; }
      var mm = c.s === 'M' ? -1 : 1, px = mm * g.sg, rs = g.roots, r = rs.length > 1 ? (rs[0].a0 * px > rs[rs.length - 1].a0 * px ? rs[0] : rs[rs.length - 1]) : rs[0];
      var dep = (c.depth === 'enamel' ? .45 : c.depth === 'pulp' ? 1.3 : .85) * k, len = (c.depth === 'enamel' ? 1.0 : 1.6) * k, y0 = g.cej + .02 * k, N = 10, out = [], inn = [];
      for(var i = 0; i <= N; i++){ var u = i / N, y = y0 + len * u, t = Math.max(0, (y - r.y0) / r.len), x = rAx(r, t) + px * rHw(r, t);
        var dd = dep * Math.pow(Math.sin(Math.PI * (.5 + .5 * u)), .8) * (.85 + .15 * Math.cos(u * 7));
        out.push([x + px * .05 * k, y]); inn.push([x - px * dd, y]); }
      s += path('xr-car', out.concat(dense(inn, false, 3).reverse())); });
    return s;
  }
  /* a full-coverage crown: a metal (or metal-ceramic) cap that follows the crown outline down to a margin at the CEJ */
  function crownSVG(g){
    var k = g.k, inner = g.crown.map(function(p){ var dx = g.x - p[0], dy = (g.top + g.d.ch * .7 * k) - p[1], L = Math.sqrt(dx * dx + dy * dy) || 1; return [p[0] + dx / L * .9 * k, p[1] + dy / L * .9 * k]; });
    return path('xr-metal', g.crown.concat(inner.slice().reverse()), false, 'opacity:.92');
  }
  /* a crown by its material (v2.1; White and Pharoah, Rosenstiel's preparations). Full gold: the whole crown as bright as metal,
     nothing of the tooth showing through. Porcelain-fused-to-metal: the metal coping as bright as metal over the whole
     preparation, a metal collar at the margin, and the porcelain over it much less radiopaque, about dentin's (Pekkan 2011).
     Zirconia: nearly as bright as metal (Pekkan: like a base metal's), the preparation barely seen through it. Lithium
     disilicate: between dentin and enamel, nearer dentin (Pekkan, Atala, Erzurumlu), the preparation and the pulp seen through it,
     outlined by the brighter resin cement. Stainless steel: a thin
     metal shell, brightest at its edges where the beam meets it side on, its margin crimped in just below the cervical line. */
  function crownMatSVG(g){
    var m = g.o.crownMat, P = TL.prepMM(g.o.t, m), L = P.L, all = mmPx(g, L.C), s = '';
    var ring = mmPx(g, L.C.slice(0, L.iv + 1)).concat(mmPx(g, P.arc).reverse());
    if(m === 'gold') return path('xr-metal', all);
    if(m === 'pfm') return path('xr-porc', all) + path('xr-metal', mmPx(g, TL.prepMM(g.o.t, 'pfm', { extra:.5, collar:1.0 }).poly));
    if(m === 'zirconia') return path('xr-zr', ring) + path('xr-zr-in', mmPx(g, P.poly));
    if(m === 'lithium') return path('xr-li', ring) + path('xr-cement', mmPx(g, P.arc), true);
    /* a provisional crown (v2.2): less radiopaque than dentin (Pekkan 2011), so the preparation shows bright inside it, outlined by
       its radiopaque zinc oxide-eugenol cement */
    if(m === 'provisional') return path('xr-prov', ring) + path('xr-zoe', mmPx(g, P.arc), true);
    var v = g.d.cv / 2, arc = L.C.slice(0, L.iv + 1), sh = [[-v + .4, -.75], [-v + .05, -.3]].concat(arc, [[v - .05, -.3], [v - .4, -.75]]);
    return path('xr-ssc', mmPx(g, sh)) + path('xr-ssc-rim', mmPx(g, sh), true);
  }
  function crownCls(m){ return m === 'pfm' ? 'xr-porc' : m === 'zirconia' ? 'xr-zr' : m === 'lithium' ? 'xr-li' : m === 'provisional' ? 'xr-prov' : 'xr-metal'; }
  /* a crown's margin: open (the crown stands off its finish line, a dark gap where crown should be) or overhanging (a ledge
     past the root's contour) */
  function marginSVG(g){
    var mg = g.o.margin, d = g.d, v = d.cv / 2, s = '', m = g.o.crownMat || 'gold', P = TL.prepMM(g.o.t, m), pm = (TL.PREP[m] || TL.PREP.gold).m;
    [[-1, 'm'], [1, 'd']].forEach(function(e){ var sg = e[0];
      if(String(mg.open || '').indexOf(e[1]) >= 0) s += path('xr-gap', mmPx(g, [[sg * v, 0], [TL.sideAt(P.L.C, .7, sg), .7], [TL.sideAt(P.poly, .7, sg), .7], [sg * (v - pm), 0]]));
      if(String(mg.overhang || '').indexOf(e[1]) >= 0) s += path(crownCls(m), mmPx(g, dense([[TL.sideAt(P.L.C, 1.0, sg) - sg * .1, 1.0], [sg * (v + .5), .35], [sg * (v + .85), -.2], [sg * (v + .45), -.45], [sg * (v - .1), -.15]], false, 4)));
    });
    return s;
  }
  /* calculus on a film (White and Pharoah, Newman and Carranza): a radiopaque spur on each proximal root surface just apical to
     the CEJ, seen tangentially where the deposit rings the root: about half a millimeter proud at its coronal end, tapering
     apically onto the root over 1-2.5 mm, never below the bone crest (it sits in the pocket); its outer edge irregular and
     crusty (small points, not smooth lobes); a little less radiopaque than enamel. Films show only the thicker, more extensive
     deposits (Buchanan 1987: 44% of proximal surfaces with calculus; Hyer 2021: half), so a drawn one is a clear one. On the outer side of the leftmost and the
     rightmost root, so it never sits in a furcation. */
  function calcSVG(g){
    var k = g.k, s = '', a = g.roots[0], b = g.roots[g.roots.length - 1], r0 = a.a0 <= b.a0 ? a : b, rN = r0 === a ? b : a, c = crestLR(g);
    [[r0, -1, c[0]], [rN, 1, c[1]]].forEach(function(e, j){
      var r = e[0], sg = e[1], seed = (+g.o.n || 3) * 1.7 + j * 2.3, T = (.5 + .1 * Math.sin(seed * 3.1)) * k;
      var y0 = g.cej + .02 * k, y1 = Math.min(g.cej + 2.5 * k, Math.max(g.cej + 1.1 * k, e[2] - .5 * k)), inner = [], outer = [], N = 26;
      for(var i = 0; i <= N; i++){ var u = i / N, y = y0 + (y1 - y0) * u, tt = Math.max(0, (y - r.y0) / r.len), x = rAx(r, tt) + sg * rHw(r, tt);
        var f = u < .16 ? Math.sin(u / .16 * Math.PI / 2) : Math.pow(1 - (u - .16) / .84, 1.15);
        var lump = .24 * Math.sin(u * 11 + seed) + .15 * Math.sin(u * 27 + seed * 1.7) + .07 * Math.sin(u * 61 + seed * .6);
        inner.push([x - sg * .05 * k, y]); outer.push([x + sg * Math.max(0, T * f * (1 + lump)), y]); }
      s += path('xr-calc', outer.concat(inner.reverse())); });
    return s;
  }
  /* a pontic over the ridge: no root; gold all metal, porcelain-fused-to-metal a metal framework inside its porcelain */
  function ponticSVG(g){
    var m = g.o.pontic, P = TL.ponticMM(g.o.t), body = mmPx(g, P);
    if(m === 'pfm') return path('xr-porc', body) + path('xr-metal', mmPx(g, TL.shrink(P, g.d.ch * .4, function(p){ return p[1] < 0 ? .9 : 1.3; }, 3)));
    return path(crownCls(m), body);
  }
  /* a bridge's connectors: the joints at the contacts between a pontic and its neighbors in the bridge */
  function connectorsSVG(gs){
    var s = '';
    for(var i = 0; i + 1 < gs.length; i++){ var A = gs[i], B = gs[i + 1];
      if(!((A.o.pontic && (B.o.pontic || B.o.abut)) || (B.o.pontic && A.o.abut) || (A.o.splint && B.o.splint))) continue;
      if(A.o.pontic && B.o.pontic && (A.o.cant || B.o.cant)) continue;
      var m = A.o.pontic || B.o.pontic || A.o.crownMat || 'pfm', k = A.k, xa = A.x + A.d.cw * k / 2, xb = B.x - B.d.cw * k / 2, x = (xa + xb) / 2;
      var hc = (TL.CONTACT[A.o.t][1] * A.d.ch + TL.CONTACT[B.o.t][0] * B.d.ch) / 2, y = (A.cej + B.cej) / 2 - (hc - .6) * k;
      var bx = function(hw, hh){ return TL.filletClosed([[x - hw * k, y - hh * k], [x + hw * k, y - hh * k], [x + hw * k, y + hh * k], [x - hw * k, y + hh * k]], Math.min(hw, hh) * .8 * k); };
      /* a metal-ceramic connector is metal inside its porcelain */
      if(m === 'pfm') s += path('xr-porc', bx(1.0, 1.5)) + path('xr-metal', bx(.6, 1.05));
      else s += path(crownCls(m), bx(.9, 1.4)); }
    return s;
  }
  function implantSVG(g){
    var o = g.o, k = g.k, x = g.x, im = o.implant, hw = im.w / 2 * k, y0 = g.cej + 1.5 * k, len = im.len * k, s = '';
    var L = [], R = [], pitch = .8 * k, n = Math.floor((len - 1.2 * k) / pitch);
    L.push([x - hw, y0]); R.push([x + hw, y0]);
    for(var i = 0; i < n; i++){ var yy = y0 + .6 * k + i * pitch, taper = 1 - .18 * Math.pow(i / n, 2);
      L.push([x - hw * taper, yy], [x - hw * taper - .38 * k, yy + pitch * .35], [x - hw * taper, yy + pitch * .7]);
      R.push([x + hw * taper, yy + pitch * .3], [x + hw * taper + .38 * k, yy + pitch * .65], [x + hw * taper, yy + pitch]); }
    var yb = y0 + len, tip = hw * .72;
    L.push([x - tip, yb - .6 * k], [x - tip * .6, yb]); R.push([x + tip, yb - .6 * k], [x + tip * .6, yb]);
    /* excess cement left under the crown margin: a bright fleck on the mesial side, below the margin (most cements show on a film,
       some barely: Wadhwani 2010; a case that has it draws it) */
    if(im.cement && !o.cover) s += path('xr-metal', [[x - hw * .95 * g.sg - .1 * k * g.sg, y0 - .4 * k], [x - hw * 1.35 * g.sg, y0 - .1 * k], [x - hw * 1.25 * g.sg, y0 + .9 * k], [x - hw * .95 * g.sg, y0 + .7 * k]]);
    /* a failed implant: a radiolucent line all round it (fibrous tissue where bone should touch the threads), following the implant's
       taper half a millimeter or so past its threads and round its apex (v2.3; v1 drew a box) */
    if(o.halo){ var hl = [], hr = [], m2 = .6 * k;
      for(var j = 0; j <= 8; j++){ var u = j / 8, yh = y0 + u * (len - .6 * k), tw = hw * (1 - .18 * u * u) + .38 * k + m2; hl.push([x - tw, yh]); hr.push([x + tw, yh]); }
      hl.push([x - tip - m2 * .5, yb + m2 * .8]); hr.push([x + tip + m2 * .5, yb + m2 * .8]);
      s += path('xr-pdl', TL.filletClosed(hl.concat(hr.reverse()), .6 * k), false, 'opacity:.95'); }
    s += path('xr-metal', L.concat(R.reverse()));
    if(!o.cover){
      var abP = [[x - hw * .84, y0 + .1 * k], [x - hw * .74, y0 - 2.6 * k], [x + hw * .74, y0 - 2.6 * k], [x + hw * .84, y0 + .1 * k]];
      s += path('xr-metal', abP);
      var y1 = g.top + g.d.ch * .5 * k, ha = hw * .74, drop = (y0 - 1.1 * k) - g.cej, m = o.crownMat, scr = o.implant.retention === 'screw';
      var cw = g.crown.map(function(p){ var f = Math.max(0, Math.min(1, (p[1] - y1) / (g.cej - y1))), e = f * f * (3 - 2 * f), dx = p[0] - x;
        return [x + dx * (1 - e) + (dx < 0 ? -ha : ha) * e, p[1] + e * drop]; });
      /* v2.3: the crown by its material, as a tooth's is drawn (crownCls): a metal-ceramic crown's porcelain over a metal coping that
         hugs the abutment; a crown the kit isn't told the material of drawn as v1 drew it */
      if(m === 'pfm'){ var cwH = g.d.cw / 2 * k, ym = g.cej - g.d.ch * .45 * k;
        s += path('xr-porc', cw) + path('xr-metal', TL.filletClosed([[x - ha - .35 * k, y0 - 1.15 * k], [x - cwH + 1.15 * k, ym], [x - cwH + 1.35 * k, g.top + 1.7 * k], [x + cwH - 1.35 * k, g.top + 1.7 * k], [x + cwH - 1.15 * k, ym], [x + ha + .35 * k, y0 - 1.15 * k]], .7 * k)); }
      else s += path(m ? crownCls(m) : 'xr-crown', cw);
      /* the abutment seen through a crown less radiopaque than metal (lithium disilicate, a provisional); a metal, metal-ceramic or
         zirconia crown hides it and the screw above the crown's margin (Pekkan 2011), unless the screw's own channel runs through it */
      var hides = m === 'gold' || m === 'pfm' || m === 'zirconia';
      if(m === 'lithium' || m === 'provisional') s += path('xr-metal', abP, false, 'opacity:.55');
      var top = hides && !scr ? y0 - 1.15 * k : y0 - 2.6 * k;
      function clipTop(pts){ return pts.map(function(p){ return [p[0], Math.max(p[1], top)]; }); }
      /* a screw-retained crown (v2.3): the screw's access channel up through the crown to the occlusal, sealed with PTFE tape over the
         screw head and composite above it (Moraguez and Belser 2010): both radiopaque, the tape less than the composite, and the
         channel a column less radiopaque than a metal or zirconia crown around it, brighter than porcelain or lithium disilicate */
      if(scr){ var yo = g.top + .25 * k, cwd = 1.25 * k;
        s += path('xr-chan', TL.filletClosed([[x - cwd, y0 - 2.4 * k], [x - cwd * 1.06, yo], [x + cwd * 1.06, yo], [x + cwd, y0 - 2.4 * k]], .2 * k));
        s += path('xr-ptfe', TL.filletClosed([[x - cwd * .96, y0 - 2.5 * k], [x - cwd * .97, y0 - 4.3 * k], [x + cwd * .97, y0 - 4.6 * k], [x + cwd * .96, y0 - 2.5 * k]], .25 * k)); }
      s += path('xr-bore', clipTop([[x - .58 * k, y0 + 3 * k], [x - .58 * k, y0 - 1.9 * k], [x - .8 * k, y0 - 1.9 * k], [x - .8 * k, y0 - 2.6 * k], [x + .8 * k, y0 - 2.6 * k], [x + .8 * k, y0 - 1.9 * k], [x + .58 * k, y0 - 1.9 * k], [x + .58 * k, y0 + 3 * k]]));
      s += path('xr-metal', clipTop([[x - .42 * k, y0 + 2.8 * k], [x - .42 * k, y0 - 1.9 * k], [x - .66 * k, y0 - 1.9 * k], [x - .66 * k, y0 - 2.5 * k], [x + .66 * k, y0 - 2.5 * k], [x + .66 * k, y0 - 1.9 * k], [x + .42 * k, y0 - 1.9 * k], [x + .42 * k, y0 + 2.8 * k]]));
    } else {
      /* a cover screw: the implant sits submerged under the mucosa, its top flush with the crest */
      s += path('xr-metal', [[x - hw * .7, y0 + .1 * k], [x - hw * .5, y0 - .5 * k], [x + hw * .5, y0 - .5 * k], [x + hw * .7, y0 + .1 * k]]);
      s += path('xr-bore', [[x - .5 * k, y0 + 2.6 * k], [x - .5 * k, y0 + .2 * k], [x + .5 * k, y0 + .2 * k], [x + .5 * k, y0 + 2.6 * k]]);
    }
    return s;
  }
  /* bone up to the crest on each root surface, the septum between neighbors; an angular defect drops the crest beside
     its root to the defect's base while the septum keeps its height; a furcation lesion darkens the space between the
     roots below the trunk; trabeculae inside */
  function boneSVG(gs, w, yBottom, seed, tb){
    var top = [], k = gs[0].k, extra = '';
    function side(g, right, y){
      if(g.o.implant) return g.x + (right ? 1 : -1) * (g.o.implant.w / 2 + .1) * k;
      if(g.o.ridge != null) return g.x + (right ? 1 : -1) * g.d.cw / 2 * k * .92;
      /* a root tip's site: the healed ridge spans the whole tooth's place (its roots as they were), not only the fragment */
      var dd = ((g.o.pdl || .2) + (g.o.lam || .22)) * k, xs = (g.site || g.roots).map(function(r){ var t = Math.max(0, (y - r.y0) / r.len); return rAx(r, t) + (right ? 1 : -1) * rHw(r, t); });
      return (right ? Math.max.apply(null, xs) + dd : Math.min.apply(null, xs) - dd);
    }
    gs.forEach(function(g, i){
      var c = crestLR(g), vd = g.o.vdef || [0, 0], vL = g.sg > 0 ? vd[0] : vd[1], vR = g.sg > 0 ? vd[1] : vd[0];
      var xl = side(g, false, c[0]), xr = side(g, true, c[1]);
      /* the bone runs past the film's edge (a tooth cut by the edge of a series film starts left of it) */
      if(i === 0) top.push([Math.min(-5, xl - 2.5 * k), c[0] - .3 * k]);
      if(vL) top.push([xl - 1.6 * k, c[0] - .2 * k], [xl - .3 * k, c[0] + vL * k * .85]);
      var ym = Math.max(c[0] + vL * k, c[1] + vR * k) * .35 + Math.max(c[0], c[1]) * .65 + (g.frag ? 1.3 : .4) * k;
      /* v2.4: a healed edentulous ridge: rounded, a little higher at its middle than at its ends, its cortex unbroken */
      if(g.o.ridge != null) top.push([xl, c[0] + .2 * k], [xl + (g.x - xl) * .5, c[0] - .1 * k], [g.x, c[0] - .2 * k], [xr - (xr - g.x) * .5, c[1] - .1 * k], [xr, c[1] + .2 * k]);
      else if(g.frag) top.push([xl, c[0]], [xl + (g.x - xl) * .45, c[0] + (ym - c[0]) * .8], [g.x, ym], [xr - (xr - g.x) * .45, c[1] + (ym - c[1]) * .8], [xr, c[1]]);
      else top.push([xl, c[0] + vL * k], [g.x, ym], [xr, c[1] + vR * k]);
      if(vR) top.push([xr + .3 * k, c[1] + vR * k * .85], [xr + 1.6 * k, c[1] - .2 * k]);
      var nx = gs[i + 1];
      if(nx){ var cn = crestLR(nx), xn = side(nx, false, cn[0]);
        var lo = Math.min(c[1], cn[0]), px = c[1] > cn[0] + 2 ? xn - .9 * k : cn[0] > c[1] + 2 ? xr + .9 * k : (xr + xn) / 2;
        top.push([px, lo - .4 * k]); }
      else top.push([Math.max(w + 5, xr + 2.5 * k), c[1] - .3 * k]);
      if(g.d.tr && g.o.furcX && !g.o.implant){ var yf = g.cej + g.d.tr * k, dep = (g.o.furcX >= 3 ? 3.2 : g.o.furcX === 2 ? 2.2 : 1.1) * k, l = g.roots[0], r = g.roots[1];
        var tl = Math.max(0, (yf - l.y0) / l.len), tr = Math.max(0, (yf - r.y0) / r.len);
        var xa = rAx(l, tl) + rHw(l, tl) * .9, xb = rAx(r, tr) - rHw(r, tr) * .9;
        extra += path('xr-pdl', dense([[xa, yf - .4 * k], [xb, yf - .4 * k], [(xa + xb) / 2 + (xb - xa) * .22, yf + dep * .75], [(xa + xb) / 2, yf + dep], [(xa + xb) / 2 - (xb - xa) * .22, yf + dep * .75]], true, 4), false, 'opacity:.85'); }
    });
    var s = path('xr-bone', top.concat([[top[top.length - 1][0], yBottom], [top[0][0], yBottom]]));
    function yTop(x){ for(var i = 1; i < top.length; i++) if(x <= top[i][0]){ var a = top[i - 1], b = top[i], t = (x - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * t; } return top[top.length - 1][1]; }
    var r = rnd(seed), yMin = Math.min.apply(null, top.map(function(p){ return p[1]; }));
    for(var i = 0; i < (tb || 230); i++){ var cx = r() * w, cy = yMin + r() * (yBottom - yMin), rx = 1.5 + r() * 5, ry = 1 + r() * 2.6, a = Math.round(r() * 180), cl = r() < .55 ? 'xr-tb' : 'xr-tb2';
      if(cy < yTop(cx) + 3 || cy > yBottom - 2) continue;
      s += '<ellipse class="' + cl + '" cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" transform="rotate(' + a + ' ' + f1(cx) + ' ' + f1(cy) + ')"/>'; }
    s += path('xr-cortex', top.slice(1, -1), true);
    return s + extra;
  }
  function rowXR(list, x0, occ, k){
    var x = x0, gs = [];
    /* o.at: the tooth's left edge in px, from its place along the arch (the bitewings and the series' films); otherwise
       the teeth follow one another, a missing tooth's width left as a gap */
    list.forEach(function(o){ var d = XT[o.t]; o.k = k; o.occ = occ; if(o.at != null) x = o.at; else x += (o.gap || 0) * k; o.x = x + d.cw * k / 2; gs.push(xrTooth(o)); x += d.cw * k - .15 * k; });
    return gs;
  }
  function filmBG(gs, w, h, seed, tb){
    var s = '<rect class="xr-soft" x="0" y="' + f1(gs[0].top - 1.2 * gs[0].k) + '" width="' + w + '" height="' + f1(h) + '"/>';
    s += boneSVG(gs, w, h + 60, seed, tb);
    gs.forEach(function(g){ s += socketSVG(g, (g.o.pdl || .2) + (g.o.lam || .22), 'xr-lam'); });
    gs.forEach(function(g){ s += socketSVG(g, g.o.pdl || .2, 'xr-pdl'); });
    /* a periapical lesion (apical periodontitis; Cohen's Pathways of the Pulp, White and Pharoah): the PDL space widens
       down the apical third and opens into a round radiolucency around the apex, the lamina dura gone there; darker at
       its middle and fading into the bone at its edge (the cortical plates still lie over it, so it is not as dark as soft
       tissue). The apex sits inside it. */
    gs.forEach(function(g){ if(!(g.o.lesion || g.o.apdl) || g.o.implant) return; var rr = (g.o.lesion || 0) / 2 * g.k, pdl = g.o.pdl || .2;
      /* a missed canal's lesion sits at its own root's apex */
      var mi = g.o.eo && g.o.eo.missed ? g.roots.map(function(r, i){ return rootName(g, i); }).indexOf(g.o.eo.missed) : -1;
      g.roots.forEach(function(r, ri){ if(mi >= 0 && ri !== mi) return;
        /* the PDL space, normal at the root's middle, widening smoothly to about .9 mm at the apex */
        var L = [], R = [], N = 12, i, t, wd;
        for(i = 0; i <= N; i++){ t = .5 + .5 * i / N; wd = (pdl + .7 * Math.pow((t - .5) / .5, 1.6)) * g.k; L.push([rAx(r, t) - rHw(r, t) - wd, r.y0 + t * r.len]); R.unshift([rAx(r, t) + rHw(r, t) + wd, r.y0 + t * r.len]); }
        var ax = rAx(r, 1), ay = r.y0 + r.len, ar = r.wa + (pdl + .7) * g.k;
        for(i = 1; i < 8; i++){ var th = Math.PI - i * Math.PI / 8; L.push([ax + Math.cos(th) * ar, ay + Math.sin(th) * ar]); }
        s += path('xr-pdl xr-apdl', L.concat(R));
        if(!g.o.lesion) return;
        var cy = ay + rr * .22;
        [1.25, 1.1, .95, .8, .65].forEach(function(f){ s += '<ellipse class="xr-lesion" cx="' + f1(ax) + '" cy="' + f1(cy) + '" rx="' + f1(rr * f) + '" ry="' + f1(rr * .86 * f) + '"/>'; });
      }); });
    gs.forEach(function(g){ (g.o.fx || []).forEach(function(f){ if(f.type === 'vrf') s += vrfSVG(g, f); }); });
    return s;
  }
  /* a vertical root fracture (Cohen's; White and Pharoah): a "J-shaped" radiolucency, bone lost in a narrow band down one side
     of the fractured root from the crest, joining a radiolucency round its apex and turning a little way up the other side;
     soft-edged, in three layers like a lesion */
  function vrfSVG(g, f){
    var k = g.k, ri = f.root ? Math.max(0, g.roots.map(function(r, i){ return rootName(g, i); }).indexOf(f.root)) : (CAT(g.o.n).pos >= 6 ? 0 : 0), r = g.roots[ri];
    if(!r) return '';
    var sgT = f.side === 'd' ? 1 : -1, sg = g.sg * sgT, c = crestLR(g), crest = sg < 0 ? c[0] : c[1], t0 = Math.max(.05, (crest - r.y0) / r.len + .02), s = '';
    [[1.35, .45], [1, .7], [.7, .9]].forEach(function(L){ var wsc = L[0], A = [], B = [], i, t;
      for(i = 0; i <= 12; i++){ t = t0 + (1 - t0) * i / 12; var wd = (.35 + .55 * Math.pow((t - t0) / (1 - t0), .8)) * k * wsc, x = rAx(r, t) + sg * rHw(r, t);
        A.push([x + sg * (wd + .15 * k), r.y0 + t * r.len]); B.unshift([x + sg * .1 * k, r.y0 + t * r.len]); }
      var ax = rAx(r, 1), ay = r.y0 + r.len, rr = r.wa + .75 * k * wsc;
      for(i = 0; i <= 8; i++){ var th = (sg > 0 ? 0 : Math.PI) + sg * i * Math.PI / 8 * -1; A.push([ax + Math.cos(th) * rr, ay + Math.abs(Math.sin(th)) * rr]); }
      for(i = 10; i >= 7; i--){ t = i / 10; A.push([rAx(r, t) - sg * (rHw(r, t) + (.12 + .5 * (t - .7)) * k * wsc), r.y0 + t * r.len]); }
      for(i = 7; i <= 10; i++){ t = i / 10; A.push([rAx(r, t) - sg * (rHw(r, t) + .05 * k), r.y0 + t * r.len]); }
      s += path('xr-vrf', dense(A, false, 2).concat(B), false, 'opacity:' + L[1]); });
    return s;
  }
  /* a periapical film of the case's teeth: bone levels, defects, furcations, restorations and implants from the model */
  /* one row of a film: the teeth in viewer order, crowns up, the occlusal edges at occ; { inner (bg + teeth), bg, teeth, w, h,
     up, ts }. A film of an upper row is flipped crowns down by its caller. o.tb: how many trabeculae (fewer on the small films
     of a series); o.at(n): a tooth's left edge in px, from its place along the arch (a missing one then leaves its own
     space); o.w: the film's width */
  function filmRow(spec, teeth, k, occ, h, o){
    o = o || {}; var ts = teethOf(spec, teeth), up = isUpper(ts[0].n);
    var list = [], seed = 0, width = 0, gapFirst = 0;
    ts.forEach(function(t, i){
      var d = t.d, mr = mesialRight(t.n), x = { t:typeOf(t.n), m:mr, n:t.n };
      seed += +t.n * (i + 3);
      width += d.cw;
      if(o.at) x.at = o.at(t.n);
      /* a pontic stands in its missing tooth's place: drawn like a tooth with no root */
      /* v2.2: a root tip under the healed ridge (meeting the neighbors' crests, a little concave over the socket), alone or under
         a pontic */
      if(t.missing && (t.pontic || t.rtip)){ if(t.pontic) x.pontic = t.pontic; if(t.cant) x.cant = true; x.bone = [0, 0]; if(t.rtip) x.rtip = t.rtip; list.push(x); return; }
      /* v2.4: a denture's tooth: films are taken with the denture out, so its place is the healed edentulous ridge, its crest
         resorbed below the neighbors' (the denture's ridge, mm; 1.5 by default: the first months' loss after an extraction) */
      if(t.missing && t.dent){ x.ridge = ridgeOf(spec, t.n); list.push(x); return; }
      if(t.missing){ if(o.at) return; if(list.length) list[list.length - 1].gapAfter = (list[list.length - 1].gapAfter || 0) + d.cw; else gapFirst += d.cw; return; }
      /* bone loss % of root length -> mm below the normal crest (1.5 mm below the CEJ); an implant's bone is in mm
         below its platform, which sits at that crest line */
      var bm = t.implant ? (t.bone.m || 0) : Math.max(0, boneMM(t, 'm') - 1.5), bd = t.implant ? (t.bone.d || 0) : Math.max(0, boneMM(t, 'd') - 1.5);
      x.bone = [bm, bd]; x.vdef = [t.vdef.m || 0, t.vdef.d || 0]; x.furcX = t.furcX;
      x.crown = t.crown; x.endo = t.endo; x.amalgam = t.amalgam; x.calc = t.calc; x.lift = t.raw.lift || 0; x.halo = t.halo;
      if(t.resto.length) x.resto = t.resto; if(t.caries.length) x.caries = t.caries; if(t.lesion) x.lesion = t.lesion;
      if(t.crownMat) x.crownMat = t.crownMat; if(t.margin.open || t.margin.overhang) x.margin = t.margin; if(t.eo) x.eo = t.eo;
      if(t.apdl) x.apdl = true; if(t.fx.length) x.fx = t.fx; if(t.abut) x.abut = true;
      if(t.od) x.od = t.od; if(t.splint) x.splint = true;
      if(t.wing){ x.wing = t.wing; var wm = nbr(t.n, true); x.wingSide = wm && tooth(spec, wm).pontic ? 'm' : 'd'; }
      if(t.retained) x.retained = true; if(t.rsp.length) x.rsp = t.rsp;
      if(t.mob >= 2) x.pdl = .34;
      if(t.implant){ x.implant = t.implant; x.cover = !!t.implant.cover; }
      list.push(x);
    });
    list.forEach(function(x, i){ if(i && list[i - 1].gapAfter) x.gap = list[i - 1].gapAfter; else if(!i && gapFirst) x.gap = gapFirst; });
    var w = o.w || Math.round(width * k + 48);
    if(!list.length){ var empty = '<rect class="xr-soft" x="0" y="0" width="' + w + '" height="' + h + '"/><rect class="xr-bone" x="0" y="' + f1(occ + 9 * k) + '" width="' + w + '" height="' + h + '"/>';
      return { inner:empty, bg:empty, teeth:'', w:w, h:h, up:up, ts:ts }; }
    var gs = rowXR(list, 20, occ, k), bg = filmBG(gs.filter(function(g){ return !g.o.pontic || g.o.rtip; }), w, h, seed, o.tb), teethSVG = gs.map(toothSVG).join('') + connectorsSVG(gs);
    /* bg and teeth apart too: a bitewing lays both rows' backgrounds down before either row's teeth, so the cusps meet */
    return { inner:bg + teethSVG, bg:bg, teeth:teethSVG, w:w, h:h, up:up, ts:ts };
  }
  function filmSVG(cls, w, h, label, inner, dotTop){
    var dotP = dotTop ? [w - 16, 9] : [w - 16, h - 9];
    return '<svg class="xr dc-film' + (cls ? ' ' + cls : '') + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '"><rect class="xr-film" x="0" y="0" width="' + w + '" height="' + h + '" rx="14"/>' + inner + '<circle class="xr-dot" cx="' + dotP[0] + '" cy="' + dotP[1] + '" r="3"/></svg>';
  }
  function names(ts){ return ts.map(function(t){ return '#' + t.n; }).join(', '); }
  function ridgeOf(spec, n){ var d = (spec.dentures || {})[archOf(n)]; return d && d.ridge != null ? d.ridge : RIDGE; }
  /* v2.4: a partial denture's front bounded spaces: each a run of the teeth it replaces, every one an incisor or canine, with a
     tooth standing at both ends (Kennedy's spaces that aren't free ends); and the labial flange over them, as given or by the ridge */
  function frontSpaces(spec, ar){ var K = kennedyOf(spec, ar), nums = archNums(ar); if(!K) return [];
    function stands(n){ var t = tooth(spec, n); return (!t.missing || t.pontic) && !t.od; }
    return K.spaces.filter(function(sp){ var a = nums.indexOf(sp[0]), b = nums.indexOf(sp[sp.length - 1]);
      return sp.every(function(n){ return posOf(n) <= 3; }) && nums.slice(0, a).some(stands) && nums.slice(b + 1).some(stands); }); }
  function flangeOf(spec, ar){ var d = (spec.dentures || {})[ar] || {}, r = d.ridge != null ? d.ridge : RIDGE;
    return d.flange || (r <= FLANGE_NONE ? 'none' : r <= FLANGE_PARTIAL ? 'partial' : 'full'); }
  /* a periapical film of the case's teeth (or the figure's): bone levels, defects, furcations, restorations, caries,
     periapical lesions and implants from the model */
  I.film = function(spec, o){
    spec = prep(spec); o = o || {}; var k = o.k || 9, h = o.h || Math.round(30 * k);
    var R = filmRow(spec, o.teeth, k, 2.6 * k, h, o), inner = R.inner;
    if(R.up) inner = '<g transform="translate(0 ' + h + ') scale(1 -1)">' + inner + '</g>';
    var label = o.aria || ('Periapical radiograph of ' + (R.up ? 'upper' : 'lower') + ' teeth ' + names(R.ts) + (R.up ? ', shown crowns down' : ''));
    return filmSVG('', R.w, h, label, inner, !R.up);
  };
  /* a bitewing (White and Pharoah): the crowns of both arches of one side on one horizontal film with the teeth closed on
     the bite tab (the tab itself is radiolucent and doesn't show), the bone crest of both arches and the roots' cervical
     third; the posterior teeth only, for proximal caries and the crest, not the apices. Each tooth sits at its place along
     the arch (the library's archMM, the upper arch set for a Class I occlusion), so the upper and lower contacts are
     staggered and the cusps interdigitate across the occlusal plane; the soft tissue and bone run the film's whole width.
     On a full-mouth case the teeth on either side of the listed ones show where the film's edge cuts them; on a case that
     lists only its own teeth the film stops at them. o.win: the film's span along the arch in mm; o.teeth: upper and lower
     premolars and molars of one side, e.g. ['2','3','4','5','28','29','30','31'] */
  var BW_H = 30.5, PA_POST = [36, 30.5], PA_ANT = [23, 37], PA_OCC = 2.5;
  function inWindow(win, upper, occl){
    var out = [], a = upper ? 1 : 17;
    for(var n = a; n < a + 16; n++){ var sp = TL.archMM(n, occl); if(sp[1] > win[0] + .4 && sp[0] < win[1] - .4) out.push(String(n)); }
    return out;
  }
  function bitewingInner(spec, teeth, k, tb, o){
    o = o || {};
    var up = teeth.filter(isUpper), lo = teeth.filter(function(n){ return !isUpper(n); }), hb = Math.round(BW_H / 2 * k), occ = -.25 * k;   /* the cusps overlap about .5 mm across the plane */
    var win = o.win;
    if(!win){ var a = Infinity, b = -Infinity;
      teeth.forEach(function(n){ var sp = TL.archMM(n, true); a = Math.min(a, sp[0]); b = Math.max(b, sp[1]); });
      var m = Math.max(1.5, (31 - (b - a)) / 2); win = [a - m, b + m]; }
    var w = Math.round((win[1] - win[0]) * k), all = spec.full || o.all;
    function row(list, upper){
      var ts = all ? inWindow(win, upper, true) : list;
      return filmRow(spec, ts.length ? ts : list, k, occ, hb, { tb:tb, w:w, at:function(n){ return (TL.archMM(n, true)[0] - win[0]) * k; } });
    }
    var U = row(up, true), L = row(lo, false), flip = '<g transform="translate(0 ' + hb + ') scale(1 -1)">', down = '<g transform="translate(0 ' + hb + ')">';
    var inner = flip + U.bg + '</g>' + down + L.bg + '</g>' + flip + U.teeth + '</g>' + down + L.teeth + '</g>';
    return { inner:inner, w:w, h:2 * hb, ts:teethOf(spec, up).concat(teethOf(spec, lo)) };
  }
  I.bitewing = function(spec, o){
    spec = prep(spec); o = o || {}; var k = o.k || 9, teeth = (o.teeth || spec.teeth).map(String);
    var B = bitewingInner(spec, teeth, k, o.tb);
    var label = o.aria || ('Bitewing radiograph of ' + names(B.ts) + ': the upper crowns above, the lower below, the teeth closed together, the bone crest on both');
    return filmSVG('dc-bw', B.w, B.h, label, B.inner, true);
  };
  /* a full-mouth series as it is mounted (the patient's right on your left, as if facing the patient): 14 periapicals and 4
     bitewings. Each film is a window onto its arch at true size: posterior periapicals and the bitewings landscape (36 by
     30.5 mm, a size 2 film's proportions), anterior periapicals portrait (23 by 37 mm), the crowns 2.5 mm from the occlusal edge and the apices well inside it.
     The windows overlap as a real series' do: the molar film from the second premolar back, the premolar film from the
     canine to the first molar, the canine film the lateral to the first premolar, the incisor film across the midline; the
     molar bitewing from the second premolars back, the premolar bitewing from the canines. Upper films on top, crowns down,
     their occlusal edges toward the middle; the bitewings under the posterior films; lower films below. A film's edge cuts
     the teeth it only partly covers. Every tooth comes from the record (a full-mouth case: one the case says nothing about
     is healthy). */
  function paWins(upper){
    var c = function(n){ var sp = TL.archMM(n); return (sp[0] + sp[1]) / 2; }, P = upper ? ['4', '6'] : ['29', '27'], pw = PA_POST[0], aw = PA_ANT[0];
    var p2 = c(P[0]), cn = c(P[1]);
    var right = [[p2 - pw, p2, 1], [cn + 1 - pw, cn + 1, 1], [cn - aw / 2, cn + aw / 2, 0]];
    var mid = [[-aw / 2, aw / 2, 0]], left = right.map(function(x){ return [-x[1], -x[0], x[2]]; }).reverse();
    return right.concat(mid, left);
  }
  function bwWins(){
    var c = function(n){ var sp = TL.archMM(n, true); return (sp[0] + sp[1]) / 2; }, pw = PA_POST[0], p2 = c('4'), cn = c('6');
    var right = [[p2 - pw, p2], [cn + 2 - pw, cn + 2]];
    return right.concat(right.map(function(x){ return [-x[1], -x[0]]; }).reverse());
  }
  /* rounded film corners over a nested film (an inner svg clips to a square): the mount's color outside each arc */
  function corners(w, h, r){
    return '<path class="dc-mount" d="M0 0H' + r + 'A' + r + ' ' + r + ' 0 0 0 0 ' + r + 'Z M' + w + ' 0V' + r + 'A' + r + ' ' + r + ' 0 0 0 ' + (w - r) + ' 0Z M' + w + ' ' + h + 'H' + (w - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + w + ' ' + (h - r) + 'Z M0 ' + h + 'V' + (h - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + r + ' ' + h + 'Z"/>';
  }
  I.fmx = function(spec, o){
    spec = prep(spec); o = o || {}; var k = 6, M = 4, G = 3, s = '';
    var colW = [PA_POST[0], PA_POST[0], PA_ANT[0], PA_ANT[0], PA_ANT[0], PA_POST[0], PA_POST[0]], colX = [], x = M;
    colW.forEach(function(cw){ colX.push(x); x += cw + G; });
    var W = x - G + M, rowH = PA_ANT[1], y1 = M, y2 = y1 + rowH + G, y3 = y2 + BW_H + G, H = y3 + rowH + M;
    function film(xmm, ymm, wpx, hpx, inner, cls){
      return '<svg class="' + cls + '" x="' + f1(xmm * k) + '" y="' + f1(ymm * k) + '" width="' + wpx + '" height="' + hpx + '" viewBox="0 0 ' + wpx + ' ' + hpx + '"><rect class="xr-film" x="0" y="0" width="' + wpx + '" height="' + hpx + '"/>' + inner + corners(wpx, hpx, 12) + '</svg>';
    }
    [true, false].forEach(function(upper){
      paWins(upper).forEach(function(win, i){
        var fs = win[2] ? PA_POST : PA_ANT, wpx = Math.round(fs[0] * k), hpx = Math.round(fs[1] * k);
        var R = filmRow(spec, inWindow(win, upper), k, PA_OCC * k, hpx, { tb:70, w:wpx, at:function(n){ return (TL.archMM(n)[0] - win[0]) * k; } });
        var inner = upper ? '<g transform="translate(0 ' + hpx + ') scale(1 -1)">' + R.inner + '</g>' : R.inner;
        /* upper films sit on the middle (their occlusal edges down), lower films hang from it */
        s += film(colX[i], upper ? y1 + rowH - fs[1] : y3, wpx, hpx, inner, 'dc-pa');
      });
    });
    bwWins().forEach(function(win, i){
      var B = bitewingInner(spec, [], k, 50, { win:win, all:true }), col = [0, 1, 5, 6][i];
      s += film(colX[col], y2, B.w, B.h, B.inner, 'dc-bwc');
    });
    /* the mount's orientation marks, in the space between the premolar bitewings */
    var mx0 = colX[2] * k, mx1 = (colX[4] + colW[4]) * k, my = (y2 + BW_H / 2) * k;
    s += txt(mx0 + 10, my + 9, 'R', 'dc-mlab') + txt(mx1 - 10, my + 9, 'L', 'dc-mlab', 'end') +
      txt((mx0 + mx1) / 2, my - 4, 'Patient\'s right on your left', 'dc-mnote', 'middle') + txt((mx0 + mx1) / 2, my + 14, 'Upper films above, lower below', 'dc-mnote', 'middle');
    var label = o.aria || 'Full-mouth series: 14 periapical films and 4 bitewings, mounted with the patient\'s right on your left; upper films on top with their crowns down, the bitewings under the back teeth\'s films, lower films below';
    return '<svg class="xr dc-film dc-fmx" viewBox="0 0 ' + f1(W * k) + ' ' + f1(H * k) + '" role="img" aria-label="' + esc(label) + '"><rect class="dc-mount" x="0" y="0" width="' + f1(W * k) + '" height="' + f1(H * k) + '" rx="14"/>' + s + '</svg>';
  };

  /* ---------- the odontogram: the whole mouth, each tooth as five surfaces ----------
     Upper teeth #1-16 across the top, lower #32-17 across the bottom, the patient's right on your left; each tooth's facial
     surface toward the outside of the chart (up for the upper row, down for the lower), its mesial toward the midline, and
     what belongs to the root drawn outside the box, toward the apex, as on an anatomic chart: a root canal filling a line
     up the root, a periapical lesion a ring at its end, an implant a screw. Restorations fill their surfaces by material,
     caries is red with a hatch (so it never rests on color alone), a crown rings the tooth and shades all five surfaces, a
     missing tooth is crossed out. Two layouts from the same marks: a row an arch, or a row a quadrant at twice the size,
     and the page shows the one that fits its width (cases.css: a phone gets the quadrants). Furcations and mobility are
     left to the chart. */
  var OD = { cw:28, r:10, q:4.4, pad:14, row:52 };
  /* diagonal hatch lines clipped to a convex polygon (no pattern fill: the drawings carry no ids) */
  function hatch(poly, gap){
    var cs = poly.map(function(p){ return p[0] - p[1]; }), lo = Math.min.apply(null, cs), hi = Math.max.apply(null, cs), d = '';
    for(var c = lo + gap / 2; c < hi; c += gap){
      var hits = [];
      for(var i = 0; i < poly.length; i++){ var a = poly[i], b = poly[(i + 1) % poly.length], fa = a[0] - a[1] - c, fb = b[0] - b[1] - c;
        if(fa === fb || fa * fb > 0) continue; var t = fa / (fa - fb); hits.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      if(hits.length >= 2){ hits.sort(function(p, q){ return p[0] - q[0]; }); var u = hits[0], v = hits[hits.length - 1];
        if(Math.abs(u[0] - v[0]) + Math.abs(u[1] - v[1]) > .8) d += 'M' + f1(u[0]) + ' ' + f1(u[1]) + 'L' + f1(v[0]) + ' ' + f1(v[1]); }
    }
    return d ? '<path class="dc-o-hatch" d="' + d + '"/>' : '';
  }
  /* one tooth: its box centered at cx, top at y0 (an upper tooth: the number and the root side above the box) */
  function odoTooth(spec, n, cx, y0, up){
    var t = tooth(spec, n), r = OD.r, q = OD.q, out = '', fy = up ? -1 : 1, mx = mesialRight(n) ? 1 : -1;
    var cy = up ? y0 + 42 : y0 + r, edge = up ? cy - r : cy + r, dir = up ? -1 : 1;   /* edge: the box's root side; dir: toward the apex */
    out += txt(cx, up ? y0 + 9 : y0 + 49, n, 'dc-onum', 'middle');
    var P = { O:[[cx - q, cy - q], [cx + q, cy - q], [cx + q, cy + q], [cx - q, cy + q]],
      F:[[cx - r, cy + fy * r], [cx + r, cy + fy * r], [cx + q, cy + fy * q], [cx - q, cy + fy * q]],
      L:[[cx - r, cy - fy * r], [cx + r, cy - fy * r], [cx + q, cy - fy * q], [cx - q, cy - fy * q]],
      M:[[cx + mx * r, cy - r], [cx + mx * r, cy + r], [cx + mx * q, cy + q], [cx + mx * q, cy - q]],
      D:[[cx - mx * r, cy - r], [cx - mx * r, cy + r], [cx - mx * q, cy + q], [cx - mx * q, cy - q]] };
    function key(x){ return x === 'B' ? 'F' : x === 'I' ? 'O' : x; }
    var fill = {}, car = {}, rec = {}, tmp = {}, seal = {}, ind = false;
    t.resto.forEach(function(rs){ rs.s.split('').forEach(function(x){ fill[key(x)] = oneOf(rs.mat, RMAT, 'dc-o-') + (rs.type === 'veneer' ? ' dc-o-ven' : ''); if(rs.mat === 'temporary') tmp[key(x)] = 1; }); if(rs.type === 'inlay' || rs.type === 'onlay') ind = true; });
    t.caries.forEach(function(cr){ if(cr.recurrent) rec[key(cr.s)] = 1; else car[key(cr.s)] = cr.depth; });
    t.seal.split('').forEach(function(x){ if(x) seal[key(x)] = 1; });
    var cm = t.crownMat || t.pontic, LET = { gold:'G', pfm:'P', zirconia:'Z', lithium:'L', ssc:'S', provisional:'T' };
    /* v2.2: a root tip, charted as the convention has it: what is gone crossed out, the root that remains drawn solid with a bar
       across it where it ends (a retained root's bar at the cervix; a root tip's down the root, by its length) */
    var tipF = t.rtip ? Math.max(.15, Math.min(.55, (t.rtip.len || 4) / t.d.rl)) : 0, tipBar = 1.5 + 11.5 * (1 - tipF);
    function tipMark(y1){ var yb = edge + dir * y1; return '<path class="dc-o-rbar" d="M' + f1(cx - 3.6) + ' ' + f1(yb) + 'h7.2"/><path class="dc-o-rroot" d="M' + f1(cx) + ' ' + f1(yb) + 'V' + f1(edge + dir * 13.5) + '"/>'; }
    function boxX(){ return '<path class="dc-ox" d="M' + f1(cx - r - 1) + ' ' + f1(cy - r - 1) + 'l' + (2 * r + 2) + ' ' + (2 * r + 2) + 'm0 ' + (-2 * r - 2) + 'l' + (-2 * r - 2) + ' ' + (2 * r + 2) + '"/>'; }
    if(t.abut || t.pontic){ var rn = up ? +n + 1 : +n - 1, ln = up ? +n - 1 : +n + 1, by = up ? cy + r + 3.5 : cy - r - 3.5;
      [[rn, 1], [ln, -1]].forEach(function(e){ var m = e[0]; if(m < 1 || m > 32 || !adjacent(n, m)) return; var u = tooth(spec, String(m)); if(!(((u.pontic || u.abut) && (u.pontic || t.pontic) && !(u.pontic && t.pontic && (u.cant || t.cant))) || (u.splint && t.splint))) return;
        out += '<path class="dc-o-bar" d="M' + f1(cx) + ' ' + f1(by) + 'h' + f1(e[1] * OD.cw / 2) + '"/>'; }); }
    /* v2.4: a denture's tooth (one it replaces, or one over an overdenture abutment): a dashed outline round the box, and the
       denture's base as a pink band on the root side, joining its teeth */
    var dMark = (t.dent || t.od) ? '<path class="dc-o-base" d="M' + f1(cx - OD.cw / 2) + ' ' + f1(edge + dir * 2.4) + 'h' + OD.cw + '"/><rect class="dc-o-dent" x="' + f1(cx - r - 2.5) + '" y="' + f1(cy - r - 2.5) + '" width="' + (2 * r + 5) + '" height="' + (2 * r + 5) + '" rx="4"/>' : '';
    if(t.missing && t.dent) return out + dMark + ['O', 'F', 'L', 'M', 'D'].map(function(x){ return path('dc-osurf dc-o-gone', P[x]); }).join('') + boxX() + (t.rtip ? '<path class="dc-o-root" d="M' + f1(cx) + ' ' + f1(edge + dir * 4) + 'V' + f1(edge + dir * tipBar) + '"/>' + tipMark(tipBar) : '');
    if(t.missing && t.pontic){
      ['O', 'F', 'L', 'M', 'D'].forEach(function(x){ out += path('dc-osurf dc-o-crowned' + (cm === 'gold' ? ' dc-o-gold' : ''), P[x]); });
      out += '<rect class="dc-o-crown" x="' + f1(cx - r - 2) + '" y="' + f1(cy - r - 2) + '" width="' + (2 * r + 4) + '" height="' + (2 * r + 4) + '" rx="3.5"/>' + txt(cx, cy + 2.6, LET[cm] || '', 'dc-olet', 'middle');
      /* the charting convention for a pontic: its crown drawn (the box, crowned and lettered) and its root crossed out, an X from
         the box to where the root would end */
      var py0 = edge + dir * 1.5, py1 = edge + dir * (t.rtip ? tipBar - 1 : 13);
      return out + '<path class="dc-ox dc-o-nroot" d="M' + f1(cx - 4) + ' ' + f1(py0) + 'L' + f1(cx + 4) + ' ' + f1(py1) + 'M' + f1(cx + 4) + ' ' + f1(py0) + 'L' + f1(cx - 4) + ' ' + f1(py1) + '"/>' + (t.rtip ? tipMark(tipBar) : '');
    }
    if(t.missing){
      ['O', 'F', 'L', 'M', 'D'].forEach(function(x){ out += path('dc-osurf dc-o-gone', P[x]); });
      return out + boxX() + (t.rtip ? '<path class="dc-o-root" d="M' + f1(cx) + ' ' + f1(edge + dir * 2) + 'V' + f1(edge + dir * tipBar) + '"/>' + tipMark(tipBar) : '');
    }
    if(t.retained){
      ['O', 'F', 'L', 'M', 'D'].forEach(function(x){ out += path('dc-osurf dc-o-gone', P[x]); });
      out += boxX() + tipMark(1.5);
    }
    /* an implant under its cover screw (v2.3): no crown yet, so its surfaces are drawn as a missing tooth's, with the implant's
       mark under a flat cap (the cover screw) */
    var sub = t.implant && t.implant.cover, crowned = t.crown || (t.implant && !sub);
    if(sub) ['O', 'F', 'L', 'M', 'D'].forEach(function(x){ out += path('dc-osurf dc-o-gone', P[x]); });
    /* v2.4: an overdenture abutment: the crown gone (its surfaces drawn as gone, no X: the root stays), a dome at the cervix in its
       seal's color, under the denture's dashed tooth */
    if(t.od){ out += dMark; ['O', 'F', 'L', 'M', 'D'].forEach(function(x){ out += path('dc-osurf dc-o-gone', P[x]); });
      out += '<path class="dc-o-od dc-o-' + (t.od === 'gi' ? 'gi' : t.od === 'composite' ? 'composite' : 'amalgam') + '" d="M' + f1(cx - 4.4) + ' ' + f1(edge + dir * .2) + 'Q' + f1(cx) + ' ' + f1(edge - dir * 5.6) + ' ' + f1(cx + 4.4) + ' ' + f1(edge + dir * .2) + 'Z"/>'; }
    if(!t.retained && !sub && !t.od) ['O', 'F', 'L', 'M', 'D'].forEach(function(x){
      out += path('dc-osurf' + (crowned ? ' dc-o-crowned' : '') + (t.crownMat === 'gold' ? ' dc-o-gold' : '') + (fill[x] ? ' ' + fill[x] : seal[x] ? ' dc-o-sealant' : '') + (car[x] ? ' dc-o-caries' : ''), P[x]);
      if(car[x]) out += hatch(P[x], 2.8);
      if(rec[x]) out += hatch(P[x], 2.8).replace('dc-o-hatch', 'dc-o-hatch dc-o-hatch-r');
      /* a temporary filling: its surface stippled */
      if(tmp[x] && !car[x]){ var mx0 = 0, my0 = 0; P[x].forEach(function(p){ mx0 += p[0] / 4; my0 += p[1] / 4; }); out += dot('dc-o-dots', mx0 - 1.3, my0 - .6, .75) + dot('dc-o-dots', mx0 + 1.3, my0 + .6, .75); } });
    if(ind) out += '<rect class="dc-o-ind" x="' + f1(cx - q - 1.6) + '" y="' + f1(cy - q - 1.6) + '" width="' + f1(2 * q + 3.2) + '" height="' + f1(2 * q + 3.2) + '" rx="1"/>';
    if(t.crownMat) out += txt(cx, cy + 2.6, LET[t.crownMat], 'dc-olet', 'middle');
    t.fx.forEach(function(f){
      if(f.type === 'crown' || f.type === 'cusp') out += '<path class="dc-o-fx" d="M' + f1(cx - r + 1.5) + ' ' + f1(cy - 2) + 'l3.4 -3l3 4l3.2 -3.6l3.2 4l3 -3.2"/>';
      if(f.type === 'crack') out += '<path class="dc-o-crack" d="M' + f1(cx - r + 1) + ' ' + f1(cy) + 'H' + f1(cx + r - 1) + '"/>';
      if(f.type === 'vrf') out += '<path class="dc-o-fx" d="M' + f1(cx + 2.5) + ' ' + f1(edge + dir * 1.5) + 'l-2.4 ' + f1(dir * 2.6) + 'l2.4 ' + f1(dir * 2.6) + 'l-2.4 ' + f1(dir * 2.6) + 'l2.4 ' + f1(dir * 2.6) + '"/>';
      if(f.type === 'hrf') out += '<path class="dc-o-fx" d="M' + f1(cx - 4.5) + ' ' + f1(edge + dir * 8) + 'l3 -1.6l3 3.2l3 -3.2"/>'; });
    if(crowned) out += '<rect class="dc-o-crown" x="' + f1(cx - r - 2) + '" y="' + f1(cy - r - 2) + '" width="' + (2 * r + 4) + '" height="' + (2 * r + 4) + '" rx="3.5"/>';
    /* v2.4: a resin-bonded wing: its lingual surface and the proximal next to its pontic in the framework's color; a partial
       denture's clasp outside the facial surface (a circumferential clasp an arc from the side it starts on, an RPI's I-bar a bar
       rising to the facial's middle) and its rests (an occlusal rest a triangle in the marginal ridge, a cingulum rest a half disc
       on the lingual, an incisal rest a notch in the incisal edge) */
    if(t.wing){ var pm = nbr(n, true), pSide = pm && tooth(spec, pm).pontic ? 'M' : 'D';
      [P.L, P[pSide]].forEach(function(pp){ out += path('dc-osurf dc-o-wing' + (t.wing === 'zirconia' ? ' dc-o-wing-z' : ''), pp); }); }
    if(t.clasp){ var bM2 = nbr(n, true), bD2 = nbr(n, false), dM2 = bM2 && tooth(spec, bM2).dent, dD2 = bD2 && tooth(spec, bD2).dent, sx = (dD2 && !dM2 ? -mx : dM2 && !dD2 ? mx : t.rest === 'd' ? -mx : mx), yf = cy + fy * r;
      if(t.clasp === 'rpi') out += '<path class="dc-o-clasp" d="M' + f1(cx - .5 * mx) + ' ' + f1(yf + fy * 8.5) + 'V' + f1(yf + fy * 1.6) + '"/>';
      else out += '<path class="dc-o-clasp" d="M' + f1(cx + sx * (r + 1.6)) + ' ' + f1(cy) + 'Q' + f1(cx + sx * (r + 1.6)) + ' ' + f1(yf + fy * 2.6) + ' ' + f1(cx) + ' ' + f1(yf + fy * 2.6) + 'T' + f1(cx - sx * r * .75) + ' ' + f1(yf + fy * 1.4) + '"/>'; }
    if(t.rest){ String(t.rest).replace('md', 'md').split('').forEach(function(sd){ if(sd !== 'm' && sd !== 'd') return; var ex = cx + (sd === 'm' ? mx : -mx) * q, ix = ex - (sd === 'm' ? mx : -mx) * 3.6;
        if(t.rest === 'm' || t.rest === 'd' || t.rest === 'md') out += '<path class="dc-o-rest" d="M' + f1(ex) + ' ' + f1(cy - 2.6) + 'L' + f1(ix) + ' ' + f1(cy) + 'L' + f1(ex) + ' ' + f1(cy + 2.6) + 'Z"/>'; });
      if(t.rest === 'cingulum'){ var ly = cy - fy * q; out += '<path class="dc-o-rest" d="M' + f1(cx - 3) + ' ' + f1(ly) + 'A3 3 0 0 ' + (fy > 0 ? 1 : 0) + ' ' + f1(cx + 3) + ' ' + f1(ly) + 'Z"/>'; }
      if(t.rest === 'incisal') out += '<path class="dc-o-rest" d="M' + f1(cx - 2.4) + ' ' + f1(cy - fy * q) + 'L' + f1(cx) + ' ' + f1(cy) + 'L' + f1(cx + 2.4) + ' ' + f1(cy - fy * q) + 'Z"/>'; }
    if(t.implant){ var sy = edge + dir * 3;
      out += '<path class="dc-o-impl" d="M' + f1(cx) + ' ' + f1(sy) + 'v' + f1(dir * 11) + '"/><path class="dc-o-impl dc-o-thread" d="' +
        [0, 3.5, 7, 10.5].map(function(dy, i){ var hw = 4.2 - i * .7; return 'M' + f1(cx - hw) + ' ' + f1(sy + dir * dy) + 'h' + f1(2 * hw); }).join('') + '"/>';
      if(sub) out += '<path class="dc-o-cover" d="M' + f1(cx - 4.6) + ' ' + f1(edge + dir * 1.2) + 'h9.2"/>'; }
    if(t.endo) out += '<path class="dc-o-endo" d="M' + f1(cx) + ' ' + f1(edge + dir * 2) + 'v' + f1(dir * 11) + '"/>';
    if(t.eo && t.eo.post) out += '<path class="dc-o-post" d="M' + f1(cx) + ' ' + f1(edge + dir * 1.5) + 'v' + f1(dir * 5.5) + '"/>';
    if(t.eo && t.eo.sep) out += '<path class="dc-o-sep" d="M' + f1(cx - 3) + ' ' + f1(edge + dir * 10.5) + 'h6"/>';
    if((t.lesion || t.rsp.length) && !t.endo && !t.retained) out += '<path class="dc-o-root" d="M' + f1(cx) + ' ' + f1(edge + dir * 2) + 'v' + f1(dir * 11) + '"/>';
    if(t.lesion) out += dot('dc-o-lesion', cx, edge + dir * 15.6, 3.1);
    /* resorption (v2.2): a small diamond on the root where it is: internal by its third, external cervical at the cervix (beside the
       root on the mesial or distal), apical at the root's end, replacement by its third and side */
    t.rsp.forEach(function(x){ var y = x.type === 'cervical' ? 3 : x.type === 'apical' ? 12.6 : { cervical:4, middle:7.5, apical:11 }[x.at || 'middle'];
      var sd = x.type === 'cervical' ? (x.side || 'm') : x.type === 'replacement' ? (x.side || 'md') : '', xo = sd === 'm' ? mx * 3.4 : sd === 'd' ? -mx * 3.4 : 0, yy = edge + dir * y, x0 = cx + xo;
      out += '<path class="dc-o-rsp" d="M' + f1(x0) + ' ' + f1(yy - 2.5) + 'l2.5 2.5l-2.5 2.5l-2.5 -2.5Z"/>'; });
    return out;
  }
  function odoRow(spec, nums, x0, y0, up){ var s = ''; nums.forEach(function(n, i){ s += odoTooth(spec, String(n), x0 + i * OD.cw + OD.cw / 2, y0, up); }); return s; }
  function range(a, b){ var o = []; if(a <= b) for(var i = a; i <= b; i++) o.push(i); else for(var j = a; j >= b; j--) o.push(j); return o; }
  I.odontogram = function(spec, o){
    spec = prep(spec); o = o || {}; var cw = OD.cw, pad = OD.pad, R = OD.row;
    var label = o.aria || 'Odontogram of the whole mouth: each tooth drawn as five surfaces; missing teeth crossed out; restorations, caries, crowns, implants, root canal fillings and periapical lesions marked';
    /* wide: one row an arch */
    var W = 16 * cw + 2 * pad, gapY = 14, H = 2 * R + gapY + 6, mid = 3 + R + gapY / 2, w = '';
    w += '<rect class="dc-paper" x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/>';
    w += '<path class="dc-mid" d="M' + (W / 2) + ' 4V' + (H - 4) + 'M' + (pad + 4) + ' ' + mid + 'H' + (W - pad - 4) + '"/>';
    w += txt(pad / 2 + 1, mid + 3.5, 'R', 'dc-oside', 'middle') + txt(W - pad / 2 - 1, mid + 3.5, 'L', 'dc-oside', 'middle');
    w += odoRow(spec, range(1, 16), pad, 3, true) + odoRow(spec, range(32, 17), pad, 3 + R + gapY, false);
    var wide = '<svg class="dc-odo dc-odo-w" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + w + '</svg>';
    /* narrow: a row a quadrant, each named at its outer end, the midline marked at its inner end */
    var Wn = 8 * cw + 2 * pad, lab = 16, rows = [['Upper right', range(1, 8), true, 'r'], ['Upper left', range(9, 16), true, 'l'], ['Lower right', range(32, 25), false, 'r'], ['Lower left', range(24, 17), false, 'l']];
    var y = 2, n = '', ys = [];
    rows.forEach(function(rw, i){
      if(i === 2) y += 8;
      var right = rw[3] === 'r', midX = right ? Wn - pad + 1 : pad - 1;
      n += txt(right ? pad : Wn - pad, y + 9, rw[0], 'dc-oq', right ? 'start' : 'end') + txt(right ? Wn - pad : pad, y + 9, 'midline', 'dc-oqm', right ? 'end' : 'start');
      ys.push(y + lab);
      n += '<path class="dc-mid" d="M' + midX + ' ' + (y + lab + 2) + 'V' + (y + lab + R - 2) + '"/>';
      n += odoRow(spec, rw[1], pad, y + lab, rw[2]);
      y += lab + R + 9;
    });
    var Hn = y - 3, occl = (ys[1] + R + ys[2] - lab) / 2;
    var narrow = '<svg class="dc-odo dc-odo-n" viewBox="0 0 ' + Wn + ' ' + Hn + '" role="img" aria-label="' + esc(label + ', one quadrant to a row') + '">' +
      '<rect class="dc-paper" x="0" y="0" width="' + Wn + '" height="' + Hn + '" rx="10"/><path class="dc-mid" d="M' + pad + ' ' + f1(occl) + 'H' + (Wn - pad) + '"/>' + n + '</svg>';
    return '<div class="dc-ow">' + wide + narrow + odoKey(odoHas(spec)) + odoText(spec) + '</div>';
  };
  /* the key, drawn with the chart's own marks */
  /* which of v2.1's marks the record has (the key shows those only) */
  function odoHas(spec){
    var h = {};
    for(var n = 1; n <= 32; n++){ var t = tooth(spec, String(n));
      if(t.crownMat) h.letters = 1; if(t.pontic || t.abut) h.bridge = 1; if(t.eo && t.eo.post) h.post = 1; if(t.eo && t.eo.sep) h.sep = 1;
      t.resto.forEach(function(r){ if(r.mat === 'ceramic') h.ceramic = 1; if(r.type === 'inlay' || r.type === 'onlay') h.ind = 1; if(r.type === 'veneer') h.ven = 1; });
      t.caries.forEach(function(c){ if(c.recurrent) h.rec = 1; });
      t.fx.forEach(function(f){ h[f.type === 'crack' ? 'crack' : 'fx'] = 1; });
      if(t.retained) h.retained = 1; if(t.rtip) h.rtip = 1; if(t.rsp.length) h.rsp = 1; if(t.seal) h.seal = 1; if(t.implant && t.implant.cover) h.cover = 1;
      if(t.dent) h.dent = 1; if(t.clasp) h[t.clasp === 'rpi' ? 'ibar' : 'clasp'] = 1; if(t.rest) h.rest = 1; if(t.od) h.od = 1; if(t.wing) h.wing = 1; if(t.cant) h.cant = 1;
      t.resto.forEach(function(r){ if(r.mat === 'temporary') h.temp = 1; }); }
    return h;
  }
  function odoKey(has){
    has = has || {};
    var sq = [[2, 2], [14, 2], [14, 14], [2, 14]];
    function k(inner, label){ return '<span class="dc-ok"><svg class="dc-oks" viewBox="0 0 16 16" aria-hidden="true">' + inner + '</svg>' + label + '</span>'; }
    return '<div class="pchart-key dc-okey">' +
      k(path('dc-osurf dc-o-amalgam', sq), 'amalgam') + k(path('dc-osurf dc-o-composite', sq), 'composite') + k(path('dc-osurf dc-o-gold', sq), 'gold') +
      k(path('dc-osurf dc-o-caries', sq) + hatch(sq, 3.2), 'caries') +
      k(path('dc-osurf dc-o-crowned', [[4, 4], [12, 4], [12, 12], [4, 12]]) + '<rect class="dc-o-crown" x="1.5" y="1.5" width="13" height="13" rx="2.5"/>', 'crown') +
      k('<path class="dc-o-endo" d="M8 1.5V14.5"/>', 'root canal filling') +
      k('<path class="dc-o-root" d="M8 1V8"/>' + dot('dc-o-lesion', 8, 11.5, 3.1), 'periapical lesion') +
      k('<path class="dc-o-impl" d="M8 1.5V14.5"/><path class="dc-o-impl dc-o-thread" d="M3.5 3h9M4.3 6.5h7.4M5 10h6M5.8 13.5h4.4"/>', 'implant') +
      k('<path class="dc-ox" d="M2.5 2.5L13.5 13.5M13.5 2.5L2.5 13.5"/>', 'missing') +
      (has.ceramic ? k(path('dc-osurf dc-o-ceramic', sq), 'ceramic') : '') +
      (has.ind ? k(path('dc-osurf', sq) + '<rect class="dc-o-ind" x="4" y="4" width="8" height="8" rx="1"/>', 'inlay or onlay') : '') +
      (has.ven ? k(path('dc-osurf dc-o-ceramic dc-o-ven', sq), 'veneer') : '') +
      (has.rec ? k(path('dc-osurf dc-o-amalgam', sq) + hatch(sq, 3.2).replace('dc-o-hatch', 'dc-o-hatch dc-o-hatch-r'), 'recurrent caries') : '') +
      (has.seal ? k(path('dc-osurf dc-o-sealant', sq), 'sealant') : '') +
      (has.temp ? k(path('dc-osurf dc-o-temporary', sq) + dot('dc-o-dots', 6, 7, .9) + dot('dc-o-dots', 10, 9, .9), 'temporary filling') : '') +
      (has.cover ? k('<path class="dc-o-cover" d="M3 2H13"/><path class="dc-o-impl" d="M8 3.5V14.5"/><path class="dc-o-impl dc-o-thread" d="M4.3 5h7.4M5 8.5h6M5.8 12h4.4"/>', 'implant under its cover screw (not yet uncovered, no crown)') : '') +
      (has.retained ? k('<path class="dc-ox" d="M2 1.5L9 7.5M9 1.5L2 7.5"/><path class="dc-o-rbar" d="M11 3.5h4.5"/><path class="dc-o-rroot" d="M13.2 3.5V15"/>', 'retained root (crown gone, root kept)') : '') +
      (has.rtip ? k('<path class="dc-o-root" d="M8 1V9"/><path class="dc-o-rbar" d="M4.4 9.5h7.2"/><path class="dc-o-rroot" d="M8 9.5V15"/>', 'root tip left in the bone') : '') +
      (has.rsp ? k('<path class="dc-o-root" d="M8 1V15"/><path class="dc-o-rsp" d="M8 5.5l2.5 2.5l-2.5 2.5l-2.5 -2.5Z"/>', 'resorption') : '') +
      (has.letters ? '<span class="dc-ok dc-ok-t">crown letters: G gold, P porcelain-fused-to-metal, Z zirconia, L lithium disilicate, S stainless steel, T provisional (temporary)</span>' : '') +
      (has.bridge ? k('<path class="dc-o-bar" d="M1 8H15"/>', 'bridge (a bar joins its units)') + k(path('dc-osurf dc-o-crowned', [[4, 1.5], [12, 1.5], [12, 7.5], [4, 7.5]]) + '<path class="dc-ox dc-o-nroot" d="M5.5 9L10.5 15M10.5 9L5.5 15"/>', 'pontic (crown drawn, root crossed out: the tooth is missing)') : '') +
      (has.dent ? k('<path class="dc-o-base" d="M0 14H16"/><rect class="dc-o-dent" x="1.5" y="1.5" width="13" height="10" rx="2.5"/><path class="dc-ox" d="M4 4L12 9.5M12 4L4 9.5"/>', 'denture tooth (pink band: its base)') : '') +
      (has.clasp ? k('<rect class="dc-o-crown" x="5" y="1.5" width="9" height="9" rx="2"/><path class="dc-o-clasp" d="M3 6Q3 13.5 9 13.5T14 12.5"/>', 'clasp') : '') +
      (has.ibar ? k('<rect class="dc-o-crown" x="3.5" y="1.5" width="9" height="9" rx="2"/><path class="dc-o-clasp" d="M8 15.5V11.8"/>', 'I-bar (an RPI clasp\'s arm)') : '') +
      (has.rest ? k('<rect class="dc-o-crown" x="1.5" y="1.5" width="13" height="13" rx="2.5"/><path class="dc-o-rest" d="M12 5.2L8.4 8L12 10.8Z"/>', 'rest') : '') +
      (has.od ? k('<path class="dc-osurf dc-o-gone" d="M3 1.5H13V8H3Z"/><path class="dc-o-od dc-o-amalgam" d="M3.6 10Q8 4.6 12.4 10Z"/><path class="dc-o-endo" d="M8 10V15.5"/>', 'overdenture abutment (root-filled, cut to a dome, sealed)') : '') +
      (has.wing ? k(path('dc-osurf', sq) + path('dc-osurf dc-o-wing', [[2, 9], [14, 9], [14, 14], [2, 14]]), 'resin-bonded wing (bonded to the lingual)') : '') +
      (has.post ? k('<path class="dc-o-endo" d="M8 1.5V14.5"/><path class="dc-o-post" d="M8 1.5V7"/>', 'post') : '') +
      (has.sep ? k('<path class="dc-o-endo" d="M8 1.5V14.5"/><path class="dc-o-sep" d="M5 11H11"/>', 'separated instrument') : '') +
      (has.fx ? k('<path class="dc-o-fx" d="M1.5 9l3 -3l3 4l3 -4l3.5 3.5"/>', 'fracture') : '') +
      (has.crack ? k('<path class="dc-o-crack" d="M1.5 8H14.5"/>', 'crack') : '') +
      '<span class="dc-okey-t">Upper teeth on top. Each tooth\'s facial side faces out and its mesial the midline; the marks beyond a tooth sit on its root, toward the apex. The patient\'s right is on your left.</span></div>';
  }
  function rspWords(x){ var sd = { m:'mesial', d:'distal', f:'facial', l:'lingual', md:'mesial and distal' };
    return x.type === 'internal' ? 'internal resorption (' + (x.at || 'middle') + ' third' + (x.root ? ', ' + x.root + ' root' : '') + ')' :
      x.type === 'cervical' ? 'external cervical resorption (Heithersay class ' + (x.heithersay || 2) + ', ' + sd[x.side || 'm'] + ')' :
      x.type === 'apical' ? 'external apical root resorption (' + (x.mm == null ? 2 : x.mm) + ' mm)' : 'replacement resorption (ankylosis, ' + sd[x.side || 'md'] + ', ' + (x.at || 'middle') + ' third)'; }
  /* the same record as text, for a screen reader and for anyone who can't read the small squares */
  function odoText(spec){
    var miss = [], notes = [];
    for(var n = 1; n <= 32; n++){ var t = tooth(spec, String(n)), c = CAT(n), bits = [];
      if(t.missing){ miss.push('#' + n);
        var tipW = t.rtip ? 'a root tip (about ' + (t.rtip.len || 4) + ' mm of the ' + (t.rtip.root || filmRoots(n)[0]) + ' root) left in the bone' : '';
        if(t.pontic) notes.push('#' + n + ': ' + (t.cant ? 'cantilevered ' : '') + 'pontic (' + String(CROWN_NAME[t.pontic] || t.pontic).replace(' crown', '') + ')' + (t.cant ? ', held from one side' : '') + (tipW ? ', ' + tipW + ' under it' : ''));
        else if(tipW) notes.push('#' + n + ': ' + tipW);
        continue; }
      if(t.retained) bits.push('retained root (the crown lost to decay)');
      if(t.od) bits.push('overdenture abutment (root-filled, cut to a dome, sealed with ' + SEAL_NAME[t.od] + ')');
      if(t.wing) bits.push('resin-bonded bridge retainer (a ' + (t.wing === 'zirconia' ? 'zirconia' : 'metal') + ' wing bonded to its lingual)');
      if(t.implant) bits.push('implant' + (t.implant.cover ? ' under its cover screw (no crown yet)' : t.implant.retention ? ' (' + t.implant.retention + '-retained)' : ''));
      if(t.crown) bits.push((t.abut ? 'bridge abutment' + (t.splint ? ' (splinted to the abutment beside it)' : '') + ', ' : '') + (t.crownMat ? CROWN_NAME[t.crownMat] || t.crownMat + ' crown' : 'crown'));
      if(t.margin.open) bits.push('open crown margin ' + String(t.margin.open).toUpperCase());
      if(t.margin.overhang) bits.push('overhanging crown margin ' + String(t.margin.overhang).toUpperCase());
      if(t.seal) bits.push(t.seal + ' sealant');
      t.resto.forEach(function(r){ bits.push(r.s + ' ' + r.mat + (r.temp ? ' (' + (TEMP_NAME[r.temp] || r.temp) + ')' : '') + (r.type && r.type !== 'direct' ? ' ' + r.type : '') + (r.overhang ? ', overhang ' + String(r.overhang).toUpperCase() : '') + (r.open ? ', open margin ' + String(r.open).toUpperCase() : '')); });
      t.caries.forEach(function(r){ bits.push((r.recurrent ? 'recurrent caries ' : r.root ? (r.arrested ? 'arrested ' : '') + 'root caries ' : r.stage === 'white-spot' ? (r.arrested ? 'brown spot ' : 'white-spot lesion ') : (r.arrested ? 'arrested caries ' : 'caries ')) + r.s + ' (' + r.depth + ')'); });
      if(t.endo){ var e = t.eo || {}; bits.push('root canal filling' + (e.fill && e.fill !== 'adequate' ? ' (' + (e.fill === 'long' ? 'overfilled' : e.fill === 'voids' ? 'with voids' : 'short') + ')' : ''));
        if(e.post) bits.push((e.post === 'cast' ? 'cast post and core' : e.post + ' post') + (e.core && e.core !== 'cast' ? ', ' + e.core + ' core' : ''));
        else if(e.core) bits.push(e.core + ' core');
        if(e.sep) bits.push('separated instrument in the ' + e.sep + ' root'); if(e.missed) bits.push('the ' + e.missed + ' canal not filled'); }
      if(t.apdl) bits.push('widened apical PDL');
      if(t.lesion) bits.push('periapical lesion');
      t.rsp.forEach(function(x){ bits.push(rspWords(x)); });
      t.fx.forEach(function(f){ bits.push(f.type === 'crown' ? 'crown fracture (' + f.depth + ')' : f.type === 'cusp' ? 'fractured ' + f.cusp + ' cusp' : f.type === 'crack' ? 'cracked tooth' : f.type === 'vrf' ? 'vertical root fracture' : 'horizontal root fracture (' + f.at + ' third)'); });
      if(bits.length) notes.push('#' + n + ': ' + bits.join(', '));
    }
    /* v2.4: each denture in words: what it replaces, its clasps, rests and major connector (never its Kennedy class) */
    var dz = Object.keys(spec.dentures || {}).map(function(ar){ var d = spec.dentures[ar], A = ar.charAt(0).toUpperCase() + ar.slice(1), nums = archNums(ar), ods = nums.filter(function(m){ return tooth(spec, m).od; });
      if(d.type === 'complete') return A + ' complete denture' + (ods.length ? ' (an overdenture, over #' + ods.join(' and #') + ')' : '');
      var cl = nums.filter(function(m){ return tooth(spec, m).clasp; }).map(function(m){ return '#' + m + ' (' + (tooth(spec, m).clasp === 'rpi' ? 'RPI' : 'circumferential') + ')'; });
      var rs = nums.filter(function(m){ return tooth(spec, m).rest; }).map(function(m){ return '#' + m + ' (' + REST_NAME[tooth(spec, m).rest] + ')'; });
      return A + ' removable partial denture replacing #' + (d.replaces || []).join(', #') + (cl.length ? '; clasps on ' + cl.join(', ') : '') + (rs.length ? '; rests on ' + rs.join(', ') : '') + (d.connector ? '; ' + CONNECTOR_NAME[d.connector] : ''); });
    return '<details class="dc-otext"><summary>The chart as text</summary><p>' + (miss.length ? 'Missing: ' + miss.join(', ') + '. ' : 'No teeth missing. ') + (dz.length ? esc(dz.join('. ')) + '. ' : '') + esc(notes.join('; ')) + (notes.length ? '.' : '') + '</p></details>';
  }

  /* a fractured crown or buccal cusp on the drawn view: the piece gone, the fracture face's dentin showing (deeper than the
     enamel), and the pulp a red point where it is exposed */
  function viewFx(cr, f, d, V, tcls){
    var Lm = fxLine(d, f), A = V([Lm[0]])[0], B = V([Lm[1]])[0], keep = V([[0, .5]])[0], k = Math.hypot(B[0] - A[0], B[1] - A[1]) / Math.hypot(Lm[1][0] - Lm[0][0], Lm[1][1] - Lm[0][1]);
    var cut = clipHalf(cr, A, B, keep, .14 * k), s = '';
    if(f.type === 'crown' && f.depth === 'enamel') return path(tcls, cut);
    var L = Math.hypot(B[0] - A[0], B[1] - A[1]), nx = -(B[1] - A[1]) / L, ny = (B[0] - A[0]) / L, sk = sideOf(A, B, keep) > 0 ? 1 : -1, o = -1.1 * k * sk;
    s += path(tcls + ' io-fxd', cut) + path(tcls, clipHalf(cr, [A[0] - nx * o, A[1] - ny * o], [B[0] - nx * o, B[1] - ny * o], keep, .14 * k));
    if(f.depth === 'pulp'){ var hp = V([TL.hornsMM(d)[f.side === 'd' ? 1 : 0]])[0], t = ((hp[0] - A[0]) * (B[0] - A[0]) + (hp[1] - A[1]) * (B[1] - A[1])) / (L * L);
      s += dot('io-pulp', A[0] + (B[0] - A[0]) * t - nx * o * .45, A[1] + (B[1] - A[1]) * t - ny * o * .45, .55 * k); }
    return s;
  }
  /* what of a restoration shows from the buccal (Sturdevant's outlines): a Class V; a Class III or IV (a Class III placed from the
     lingual, as most are, faint through the labial enamel; a lingual surface not at all); an onlay over the buccal cusps; a buccal
     groove extension (OB); and of a Class II's proximal box only a sliver at the crown's outline, where its buccal wall clears the
     contact into the buccal embrasure (its gingival floor, an overhang or an open margin lie under the papilla) */
  function viewResto(t, r, V){
    var n = t.n, cat = CAT(n), ty = typeOf(n), F = cat.surfaces[3], fs = r.s.indexOf(F) >= 0, o = { per:4, mat:r.mat, type:r.type };
    var cls = 'io-r' + oneOf(r.mat, RMAT, ' io-r-') + (r.mat === 'temporary' ? oneOf(r.temp, TEMPS, ' io-t-') : ''), out = '';
    if(posOf(n) <= 3){
      var vis = r.s.replace(/L/g, ''); if(!vis) return '';
      var faint = !fs && !/I/.test(r.s);
      TL.restoParts(ty, vis, o).shapes.forEach(function(p){ out += path(cls + (faint ? ' io-r-faint' : ''), V(p)); });
      return out;
    }
    var onlay = r.type === 'onlay', hasO = /O/.test(r.s) || (/M/.test(r.s) && /D/.test(r.s)) || onlay;
    if(onlay) out += path(cls, V(TL.restoParts(ty, 'O', o).shapes[0]));
    [['M', -1], ['D', 1]].forEach(function(e){ if(r.s.indexOf(e[0]) >= 0){ var b = boxSliver(ty, e[0], e[1], o); if(b) out += path(cls, V(b)); } });
    if(fs && !onlay){ var sh = TL.restoParts(ty, hasO ? 'O' + F : F, o).shapes; out += path(cls, V(sh[sh.length - 1])); }
    return out;
  }
  function boxSliver(ty, side, sg, o){
    var slot = TL.restoParts(ty, side, o).shapes[0]; if(!slot) return null;
    var ys = slot.map(function(p){ return p[1]; }), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var arc = TL.sideArc(TL.crownLoop(XT[ty], 4), sg, y0, y1); if(arc.length < 2) return null;
    var inner = arc.map(function(p, i){ var u = i / (arc.length - 1); return [p[0] - sg * (.32 + .3 * Math.sin(Math.PI * Math.min(1, u * 1.3))), p[1]]; });
    return arc.concat(inner.reverse());
  }
  /* ---------- decay seen from the buccal ----------
     Each lesion in the tooth's own mm (mesial at -x, the CEJ at 0, the crown toward +y), placed by the gingival margin the chart
     gives, from these sources (drawn anew):
     - a smooth-surface (cervical, Class V) lesion forms where plaque stays, along the gingival margin, so it is a crescent in the
       gingival third that follows the margin's curve, wider mesiodistally than tall (Fejerskov's Dental Caries; Sturdevant's,
       Class V lesions). ICDAS's visual codes: an active white spot is opaque, chalky and matte (codes 1-2), an arrested one brown
       and shiny; a cavity (codes 5-6) shows dentin, light to mid brown and soft when active, dark brown to black and hard when
       arrested, ringed by chalky demineralized enamel;
     - root caries (Nyvad and Fejerskov's criteria; Banting's root caries index): only on an exposed root, between the CEJ and the
       gingival margin, a shallow lesion that spreads along the CEJ more than it deepens; active yellowish to light brown and
       soft, arrested dark brown to black and hard;
     - recurrent caries at a buccal margin (Sturdevant's; Mjor's secondary caries studies, mostly at the gingival margin): a
       brown-gray band in the tooth along a Class V's or a veneer's gingival edge, or on the root just apical to a crown's margin;
     - a proximal lesion: hidden from the buccal on a premolar or molar (seen from the occlusal as a shadow under the marginal
       ridge, or on a bitewing); on an incisor or canine one into the dentin shows as a gray shadow through the labial enamel by
       the contact (Sturdevant's, Class III detection), fainter than the lesion; an occlusal or lingual lesion not at all.
     Returns { layers:[{ cls, pts }], visible } or null; visible: some of it lies above the gingival margin (answerable() uses it) */
  function gumMM(t){ var a = t.d.cw * .34, c = t.d.cej || 0, y0 = -t.rec.f[0], y1 = -t.rec.f[1] - c, y2 = -t.rec.f[2];
    return function(x){ var u = Math.max(-1.15, Math.min(1.15, x / a)); return y1 + u * (y2 - y0) / 2 + u * u * ((y0 + y2) / 2 - y1); }; }
  function cejMM(t){ var v = t.d.cv / 2, c = t.d.cej || 0; return function(x){ return -c * Math.max(0, 1 - (x / v) * (x / v)); }; }
  function band(x0, x1, lo, hi, N){ var a = [], b = [];
    for(var i = 0; i <= N; i++){ var u = i / N, x = x0 + (x1 - x0) * u; a.push([x, lo(x, u)]); b.push([x, hi(x, u)]); }
    return a.concat(b.reverse()); }
  function prof(u, e){ return Math.pow(Math.max(0, Math.sin(Math.PI * u)), e); }
  function buccalLesion(t, c){
    var cat = CAT(t.n), F = cat.surfaces[3], d = t.d, gm = gumMM(t), cj = cejMM(t), r = rnd(+t.n * 31 + c.s.charCodeAt(0)), L = [];
    var wob = [r(), r(), r()], W = function(u){ return 1 + .07 * Math.sin(u * 9 + wob[0] * 6) + .03 * Math.sin(u * 19 + wob[1] * 6); };
    var arr = c.arrested ? ' io-arr' : '', ant = posOf(t.n) <= 3;
    if(c.s === 'M' || c.s === 'D'){
      if(!ant || c.recurrent || c.root || c.depth === 'enamel' || t.crown) return null;
      var sg = c.s === 'M' ? -1 : 1, h = d.ch, yc = TL.CONTACT[typeOf(t.n)][sg < 0 ? 0 : 1] * h - .7, deep = c.depth === 'pulp';
      var rx = deep ? 1.15 : .8, ry = deep ? 1.6 : 1.15, xs = TL.sideAt(TL.crownLoop(d, 4).C, yc, sg) - sg * rx * .8, e = [];
      for(var i = 0; i < 20; i++){ var a = i / 20 * Math.PI * 2; e.push([xs + Math.cos(a) * rx * W(i / 20), yc + Math.sin(a) * ry]); }
      L.push({ cls:'io-prox' + (deep ? ' io-prox-deep' : ''), pts:e });
      return { layers:L, visible:true };
    }
    if(c.s !== F) return null;
    var N = 18;
    if(c.recurrent){
      var dep = c.depth === 'enamel' ? .45 : c.depth === 'pulp' ? 1.1 : .8;
      if(t.crown){ var hw0 = d.cv * .38, len = dep + .5;
        L.push({ cls:'io-rec', pts:band(-hw0, hw0, function(x){ return cj(x) + .18; }, function(x, u){ return cj(x) + .18 - len * prof(u, .45) * W(u); }, N) }); }
      else { var vr = t.resto.filter(function(q){ return q.s.indexOf(F) >= 0; })[0]; if(!vr) return null;
        var sh = TL.restoParts(typeOf(t.n), F, { per:4, type:vr.type === 'veneer' ? 'veneer' : 'direct' }).shapes[0]; if(!sh) return null;
        L.push({ cls:'io-rec', pts:marginBand(sh, vr.type === 'veneer' ? 1.3 : .62, dep, W) }); }
    } else if(c.root){
      var hw = d.cv * .44, deepR = c.depth === 'pulp', H = deepR ? 2.6 : 1.8, xs2 = [];
      for(var j = 0; j <= 40; j++){ var x = -hw + 2 * hw * j / 40; if(cj(x) - gm(x) > .55) xs2.push(x); }
      if(xs2.length < 3) return null;
      var xa = xs2[0], xb = xs2[xs2.length - 1], top = function(x){ return cj(x) - .05; }, bot = function(x, u){ return top(x) - Math.min(cj(x) - gm(x) - .3, H) * prof(u, .35) * W(u); };
      L.push({ cls:'io-rc' + arr, pts:band(xa, xb, top, bot, N) });
      if(deepR) L.push({ cls:'io-rc-deep' + arr, pts:band(xa + (xb - xa) * .3, xb - (xb - xa) * .3, function(x){ return top(x) - .25; }, function(x, u){ return top(x) - .25 - Math.min(cj(x) - gm(x) - .8, H * .6) * prof(u, .5); }, 10) });
    } else {
      var ws = c.stage ? c.stage === 'white-spot' : c.depth === 'enamel', T = ws ? [.38, 1.4] : c.depth === 'enamel' ? [.24, 1.0] : c.depth === 'pulp' ? [.36, 2.6] : [.32, 1.9];
      var lo = function(x){ return Math.max(gm(x) - .35, cj(x) + .1); }, hw1 = d.cw * T[0];
      var cres = function(hw2, H2, lift, e){ return band(-hw2, hw2, function(x){ return lo(x) + lift; }, function(x, u){ return lo(x) + lift + H2 * prof(u, e) * W(u); }, N); };
      if(ws){ L.push({ cls:'io-ws io-ws-edge' + arr, pts:cres(hw1 + .35, T[1] + .4, -.05, .5) }); L.push({ cls:'io-ws' + arr, pts:cres(hw1, T[1], .05, .45) }); }
      else {
        if(!c.arrested) L.push({ cls:'io-cav-rim', pts:cres(hw1 + .4, T[1] + .55, -.05, .5) });
        L.push({ cls:'io-cav' + arr, pts:cres(hw1, T[1], .1, .55) });
        if(c.depth === 'pulp') L.push({ cls:'io-cav-deep' + arr, pts:cres(hw1 * .45, T[1] * .5, .3, .7) });
      }
    }
    if(!L.length) return null;
    var vis = L.some(function(l){ return l.pts.some(function(p){ return p[1] > gm(p[0]) + .25; }); });
    return { layers:L, visible:vis };
  }
  /* a band along the gingival part of a restoration's outline (below yCut mm above its lowest point), just outside it */
  function marginBand(pts, cut, w, W){
    var ys = pts.map(function(p){ return p[1]; }), y0 = Math.min.apply(null, ys), yc = y0 + cut, n = pts.length;
    var cx = pts.reduce(function(a, p){ return a + p[0]; }, 0) / n, cy = ys.reduce(function(a, y){ return a + y; }, 0) / n;
    var st = -1; for(var i = 0; i < n; i++) if(pts[i][1] >= yc && pts[(i + 1) % n][1] < yc){ st = (i + 1) % n; break; }
    if(st < 0) st = 0;
    var run = []; for(var j = 0; j < n; j++){ var p = pts[(st + j) % n]; if(p[1] >= yc && run.length) break; if(p[1] < yc) run.push(p); }
    if(run.length < 2) run = pts.slice();
    var out = run.map(function(p, i){ var u = run.length > 1 ? i / (run.length - 1) : .5, dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1, f = w * prof(u, .4) * W(u);
      return [p[0] + dx / l * f, p[1] + dy / l * f]; });
    var inn = run.map(function(p){ var dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] - dx / l * .12, p[1] - dy / l * .12]; });
    return inn.concat(out.reverse());
  }
  /* what the view shows of a tooth's decay, in words (its label) */
  function lesionWords(t, c){
    var F = CAT(t.n).surfaces[3];
    if(c.recurrent) return 'recurrent caries at ' + (t.crown ? 'the crown\'s' : 'the restoration\'s') + ' buccal margin';
    if(c.root) return (c.arrested ? 'arrested ' : '') + 'root caries on the exposed root';
    if(c.s !== F) return 'a shadow through the labial enamel by the ' + (c.s === 'M' ? 'mesial' : 'distal') + ' contact';
    var ws = c.stage ? c.stage === 'white-spot' : c.depth === 'enamel';
    return ws ? (c.arrested ? 'a brown spot' : 'a white-spot lesion') + ' at the cervical third' : (c.arrested ? 'an arrested' : 'a') + ' cavitated lesion at the cervical third';
  }
  /* a retained root's stump shows on the view when the gingival margin sits apical to its broken top somewhere on the facial */
  function stumpShows(t){ return Math.max(t.rec.f[0], t.rec.f[1], t.rec.f[2]) > -.9; }
  I.buccalLesion = function(spec, n, c){ spec = prep(spec); return buccalLesion(tooth(spec, String(n)), c); };
  /* ---------- the drawn buccal view ---------- */
  /* v2.4: a denture on the drawn view (the sources are in this file's header): its pink acrylic base over the ridge, festooned
     around its denture teeth and running toward the vestibule (across the whole view for a complete denture, over each run of
     replaced teeth for a partial), its teeth, and a partial denture's cobalt-chromium framework: each clasp's buccal arm (a
     circumferential clasp from the rest's side, over the occlusal third, down to its tip in the cervical third at the far line
     angle, below the height of contour; an RPI's I-bar rising from the vestibule to the cervical third at mid-buccal, its distal
     proximal plate and mesial rest), and an occlusal rest where it crosses the marginal ridge. x in mm from the tooth's middle,
     + distal; y in mm above its CEJ */
  /* the ridge's edge below the CEJ (mm) where a tooth is missing: resorbed under a denture */
  function gapMM(spec, t){ return t.missing && (spec.dentures || {})[archOf(t.n)] ? ridgeOf(spec, t.n) + .3 : 1.2; }
  function viewDenture(spec, den, cols, occ, dir, k, kt, W, up, siteMy, contact, gumAt){
    var s = '', full = den.type === 'complete', fr, under, over;
    function geo(c){ var sg = c.mr ? -1 : 1, cej = occ + dir * c.d.ch * k; return { cej:cej, V:function(pts){ return pts.map(function(p){ return [c.cx + sg * p[0] * k, cej - dir * p[1] * k]; }); }, X:function(px){ return c.cx + sg * px * k; } }; }
    /* a front bounded space's flange (Faigenblum 2023): none, the tooth gum-fitted on the ridge; partial, a collar 1 mm past it;
       full, into the vestibule */
    var ar = archOf(cols[0].t.n), fl = full ? 'full' : flangeOf(spec, ar), fsp = {};
    if(!full) frontSpaces(spec, ar).forEach(function(sp){ sp.forEach(function(n){ fsp[n] = 1; }); });
    function open(n){ return fl === 'none' && !!fsp[n]; }
    fr = full ? { under:'', over:'' } : viewFrame(spec, cols, dir, k, geo, open); under = fr.under; over = fr.over;
    var runs = [], cur = null;
    /* the denture's teeth: those it replaces, and one over each overdenture abutment (the base covers the abutment) */
    function dt(t){ return t.dent || t.od; }
    cols.forEach(function(c, i){ var on = dt(c.t) || (full && c.t.missing); if(on){ if(!cur){ cur = { a:i, b:i }; runs.push(cur); } else cur.b = i; } else cur = null; });
    /* the denture's teeth (a gum-fitted one is the view's: it stands in the gum as a pontic does), then the base over their necks */
    cols.forEach(function(c){ if(!dt(c.t) || open(c.t.n)) return; var G = geo(c), o = dense(crownMM(c.d), true, 4).map(function(p){ return G.V([p])[0]; });
      s += path('io-tooth io-dt' + (up ? '' : ' low'), o); });
    /* the base over each run: its top carved like gingiva over each denture tooth's neck (a festoon 1 mm over the cervical line
       at mid-facial, a papilla up to the contact between teeth);
       against an abutment it meets the tooth's gingival margin at its proximal surface and runs down it; its flange's border is a
       smooth rounded line, into the vestibule for a free-end or complete base (the ridge's depth and 4.3 mm more, a light line
       inside the border for its rolled edge), and over a bounded space a short collar just past the ridge's crest */
    runs.forEach(function(r){ var A = cols[r.a], B = cols[r.b], Lc = r.a > 0 ? cols[r.a - 1] : null, Rc = r.b < cols.length - 1 ? cols[r.b + 1] : null, top = [], i;
      if(open(A.t.n) && open(B.t.n)) return;
      var cA = occ + dir * A.d.ch * k, cB = occ + dir * B.d.ch * k, xl = Lc ? Lc.cx + Lc.d.cv / 2 * k : -6, xr = Rc ? Rc.cx - Rc.d.cv / 2 * k : W + 6;
      var front = !!(fsp[A.t.n] && fsp[B.t.n]);
      /* over a front space the base fills the cervical embrasure beside each abutment too, up its proximal to a papilla short of
         the contact, as between two denture teeth */
      function sideAt(c, y, sd){ var pts = geo(c).V(dense(crownMM(c.d), true, 4)), best = null;
        for(var q = 0; q < pts.length; q++){ var a = pts[q], b = pts[(q + 1) % pts.length]; if((a[1] - y) * (b[1] - y) > 0 || a[1] === b[1]) continue;
          var x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); if(best == null || sd * (x - best) > 0) best = x; } return best; }
      function abPap(ab, dn, sd){ var ca = contact(ab, sd), cb = contact(dn, -sd), py = (ca[1] + cb[1]) / 2 + dir * .4 * k,
          cap = (occ + dir * ab.d.ch * k + occ + dir * dn.d.ch * k) / 2 - dir * 2.9 * k, yt = dir > 0 ? Math.max(py, cap) : Math.min(py, cap),
          y0 = siteMy(ab, sd > 0 ? 2 : 0) + dir * .3 * k, out = [];
        for(var q = 1; q < 8; q++){ var y = y0 + (yt - y0) * q / 8, x = sideAt(ab, y, sd); if(x != null) out.push([x, y]); }
        out.push([(ca[0] + cb[0]) / 2, yt]); return out; }
      top.push(Lc ? [xl, siteMy(Lc, 2) + dir * .3 * k] : [xl, cA - dir * .4 * k]);
      if(front && Lc) top = top.concat(abPap(Lc, A, 1));
      for(i = r.a; i <= r.b; i++){ var c = cols[i], cj = occ + dir * c.d.ch * k, L = c.cx - c.d.cw / 2 * k, R = c.cx + c.d.cw / 2 * k;
        if(!dt(c.t)){ top.push([L, cj + dir * .2 * k], [R, cj + dir * .2 * k]); continue; }
        if(i === r.a && !Lc) top.push([L, cj - dir * 2.2 * k]);
        top.push([c.cx - c.d.cw * .32 * k, cj - dir * 1.5 * k], [c.cx, cj - dir * 1 * k], [c.cx + c.d.cw * .32 * k, cj - dir * 1.5 * k]);
        var nc = cols[i + 1];
        if(i < r.b && dt(nc.t)){ var ca = contact(c, 1), cb = contact(nc, -1), py = (ca[1] + cb[1]) / 2 + dir * .4 * k, cap = (cj + occ + dir * nc.d.ch * k) / 2 - dir * 2.9 * k;
          top.push([(ca[0] + cb[0]) / 2, dir > 0 ? Math.max(py, cap) : Math.min(py, cap)]); }
        else if(i < r.b || !Rc) top.push([R, cj - dir * 2.2 * k]); }
      if(front && Rc) top = top.concat(abPap(Rc, B, -1).reverse());
      top.push(Rc ? [xr, siteMy(Rc, 0) + dir * .3 * k] : [xr, cB - dir * .4 * k]);
      var e = dense(top, false, 5), g = 0, j;
      for(i = r.a; i <= r.b; i++) g = Math.max(g, gapMM(spec, cols[i].t));
      /* over a bounded space a short flange: a rounded collar from one abutment's margin to the other's, just deep enough to
         cover the ridge (a front space's partial flange 1 mm past it, Faigenblum's; a back tooth's .9) */
      if(Lc && Rc){ var wd = xr - xl, off = (front ? 1 : .9) * k, y0 = siteMy(Lc, 2) + dir * .3 * k, y1 = siteMy(Rc, 0) + dir * .3 * k, D2 = 0, cup = [];
        function tl(x){ return y0 + (y1 - y0) * (x - xl) / wd; }
        function fe(x){ var u = 2 * (x - xl) / wd - 1; return Math.sqrt(Math.max(0, 1 - u * u)); }
        /* a half-ellipse below the line between the two margins, as deep as it must be to cover the ridge (and off past it) */
        /* a front space's full flange (Faigenblum's, where the ridge has resorbed) covers the ridge's labial face into the sulcus,
           2.2 mm past the deepest point of the crest: its sides run straight down from the abutments' margins,
           its corners round, its border a shallow curve with a light line inside it for its rolled edge, and a soft light ridge
           down from each tooth's neck for the root eminence the acrylic is carved with */
        if(front && fl === 'full'){ var deep = null, sp = 0, bot = [], bd = [];
          for(j = 0; j <= 40; j++){ var xq = xl + wd * j / 40, gq = gumAt(xq); if(gq != null && (deep == null || dir * (gq - deep) > 0)) deep = gq; }
          var yb = (deep == null ? (cA + cB) / 2 + dir * g * k : deep) + dir * 2.2 * k, rc = Math.min(2.6 * k, wd * .24);
          function bz(p0, p1, p2, p3, out){ for(var q = 1; q <= 10; q++){ var t = q / 10, m = 1 - t;
            out.push([m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]); } }
          function rnd2(cx, cy, a0, a1){ for(var q = 1; q <= 8; q++){ var a = a0 + (a1 - a0) * q / 8; bot.push([cx + rc * Math.cos(a), cy + dir * rc * Math.sin(a)]); } }
          bz([xr, y1], [xr, y1 + (yb - y1) * .45], [xr + sp, yb - dir * rc - (yb - y1) * .25], [xr + sp, yb - dir * rc], bot);
          rnd2(xr + sp - rc, yb - dir * rc, 0, Math.PI / 2);
          for(j = 1; j < 16; j++){ var uu = j / 16; bd.push([xr + sp - rc - (wd + 2 * sp - 2 * rc) * uu, yb + dir * .3 * k * Math.sin(Math.PI * uu)]); }
          bot = bot.concat(bd); rnd2(xl - sp + rc, yb - dir * rc, Math.PI / 2, Math.PI);
          bz([xl - sp, yb - dir * rc], [xl - sp, yb - dir * rc - (yb - y0) * .25], [xl, y0 + (yb - y0) * .45], [xl, y0], bot);
          s += path('io-base', e.concat(bot)) + path('io-base-hi', bd.map(function(p){ return [p[0], p[1] - dir * .9 * k]; }), true);
          for(i = r.a; i <= r.b; i++){ var ce = cols[i], cj2 = occ + dir * ce.d.ch * k + dir * .4 * k, len = dir * (yb - cj2) * .62;
            if(len > 2 * k) s += path('io-base-hi io-emin', [[ce.cx, cj2], [ce.cx + .15 * k, cj2 + dir * len * .5], [ce.cx, cj2 + dir * len]], true); }
          return; }
        for(j = 2; j <= 38; j++){ var xs = xl + wd * j / 40, gs = gumAt(xs); if(gs != null) D2 = Math.max(D2, dir * (gs + dir * off - tl(xs)) / fe(xs)); }
        for(j = 1; j < 30; j++){ var xx = xr - wd * j / 30; cup.push([xx, tl(xx) + dir * D2 * fe(xx)]); }
        s += path('io-base', e.concat(cup));
        return; }
      var D = (g + 4.3) * k, yb = (dir > 0 ? Math.max(cA, cB) : Math.min(cA, cB)) + dir * D, rc = Math.min(2.6 * k, (xr - xl) * .3, D * .45), bot = [];
      function arc(cx, cy, a0, a1){ for(var q = 0; q <= 8; q++){ var a = a0 + (a1 - a0) * q / 8; bot.push([cx + rc * Math.cos(a), cy + dir * rc * Math.sin(a)]); } }
      if(Rc){ bot.push([xr, yb - dir * rc]); arc(xr - rc, yb - dir * rc, 0, Math.PI / 2); }
      var b0 = Rc ? xr - rc : xr, b1 = Lc ? xl + rc : xl, border = [];
      for(j = 0; j <= 16; j++){ var u = j / 16; border.push([b0 + (b1 - b0) * u, yb + dir * .5 * k * Math.sin(Math.PI * u)]); }
      bot = bot.concat(border);
      if(Lc){ arc(xl + rc, yb - dir * rc, Math.PI / 2, Math.PI); bot.push([xl, yb - dir * rc]); }
      s += path('io-base', e.concat(bot));
      s += path('io-base-hi', border.slice(1, -1).map(function(p){ return [p[0], p[1] - dir * .9 * k]; }), true); });
    return under + s + over;
  }
  /* v2.4: a partial denture's cobalt-chromium framework on the drawn view, as two layers: what lies against the teeth's proximal
     surfaces (a clasp's minor connector, the RPI's proximal plate) and the I-bar's approach, drawn before the denture teeth and
     the base so they cover it where they lie over it; then what lies on the buccal and occlusal surfaces (the clasp arms, the
     rests). Each part is a tapered, round-ended bar with a highlight along it, following the crown's own outline: an occlusal
     rest in the marginal ridge shows from the buccal only where it crosses the occlusal embrasure, over the crown's corner; an
     incisal rest caps the incisal angle; a circumferential arm leaves its shoulder above the height of contour by the rest and
     ends in the gingival third at the far line angle, 1.6 mm wide tapering to 0.8; an I-bar's approach runs 3.5 mm below the
     gingival margin (Krol 1973; McCracken's: 3-4 mm) and turns up at the middle of the buccal, crossing the margin at a right
     angle, to its tip in the gingival third */
  function viewFrame(spec, cols, dir, k, geo, open){
    var under = '', over = '';
    function metal(pts, w0, w1, G, caps){ var c = G.V(pts), n = c.length, L = [], R = [], H = [], i;
      if(n < 2) return '';
      for(i = 0; i < n; i++){ var a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / (n - 1)) * k / 2, nx = -dy / l, ny = dx / l;
        L.push([c[i][0] + nx * w, c[i][1] + ny * w]); R.push([c[i][0] - nx * w, c[i][1] - ny * w]);
        var up = ny < 0 ? 1 : -1; H.push([c[i][0] + up * nx * w * .38, c[i][1] + up * ny * w * .38, w]); }
      function cap(p, q, sgn){ var o = [], cx = (p[0] + q[0]) / 2, cy = (p[1] + q[1]) / 2, r = Math.hypot(p[0] - q[0], p[1] - q[1]) / 2, a0 = Math.atan2(p[1] - cy, p[0] - cx);
        for(var j = 1; j < 8; j++){ var a = a0 + sgn * Math.PI * j / 8; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
      var e = c[n - 1], f = c[n - 2], turn = ((e[0] - f[0]) * (L[n - 1][1] - e[1]) - (e[1] - f[1]) * (L[n - 1][0] - e[0])) > 0 ? 1 : -1;
      var shape = L.concat(cap(L[n - 1], R[n - 1], -turn), R.reverse());
      if(caps === 2) shape = shape.concat(cap(R[R.length - 1], L[0], -turn));
      var hi = []; H.forEach(function(h, j){ if(j > 0 && j < n - 1) hi.push(h); });
      var hp = hi.map(function(h){ return [h[0], h[1]]; }), hw = hi.map(function(h){ return h[2] * .3; }), hL = [], hR = [];
      for(i = 0; i < hp.length; i++){ var a2 = hp[Math.max(0, i - 1)], b2 = hp[Math.min(hp.length - 1, i + 1)], ex = b2[0] - a2[0], ey = b2[1] - a2[1], l2 = Math.hypot(ex, ey) || 1, ww = hw[i] * Math.sin(Math.PI * (i + .5) / hp.length);
        hL.push([hp[i][0] - ey / l2 * ww, hp[i][1] + ex / l2 * ww]); hR.unshift([hp[i][0] + ey / l2 * ww, hp[i][1] - ex / l2 * ww]); }
      return path('io-clasp', shape) + (hp.length > 1 ? path('io-clasp-hi', hL.concat(hR)) : ''); }
    function curve(P, n){ var o = []; for(var i = 0; i <= n; i++){ var u = i / n, a = 1 - u; o.push([a * a * a * P[0][0] + 3 * a * a * u * P[1][0] + 3 * a * u * u * P[2][0] + u * u * u * P[3][0], a * a * a * P[0][1] + 3 * a * a * u * P[1][1] + 3 * a * u * u * P[2][1] + u * u * u * P[3][1]]); } return o; }
    /* the crown's outline (mm, x + distal, y above the CEJ): where it is at a height on one side, and its points near a corner,
       pushed out a little from the crown's middle so the metal lies over the enamel's edge */
    function rim(d){ return dense(crownMM(d), true, 6); }
    function sideX(d, sd, y){ var o = rim(d), best = sd * d.cv / 2; for(var i = 0; i < o.length; i++){ var a = o[i], b = o[(i + 1) % o.length];
      if(a[1] === b[1] || (a[1] - y) * (b[1] - y) > 0) continue; var x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); if(sd * x > sd * best) best = x; } return best; }
    function corner(d, sd, x0, x1, y0, out){ var cy = d.ch * .45, o = rim(d).filter(function(p){ return sd * p[0] >= x0 * d.cw / 2 && sd * p[0] <= x1 * d.cw / 2 && p[1] >= y0 * d.ch; });
      o.sort(function(a, b){ return sd * a[0] - sd * b[0]; });
      return o.map(function(p){ var dx = p[0], dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * out, p[1] + dy / l * out]; }); }
    function down(d, sd, y0, y1, out){ var o = []; for(var j = 0; j <= 8; j++){ var y = y0 + (y1 - y0) * j / 8; o.push([(y >= 0 ? sideX(d, sd, y) : sd * d.cv / 2) + sd * out, y]); } return o; }
    cols.forEach(function(c){ var t = c.t; if(t.missing || (!t.clasp && !t.rest)) return; var G = geo(c), d = c.d, hw = d.cw / 2, ch = d.ch, post = posOf(t.n) >= 4;
      var dM = nbr(t.n, true), dD = nbr(t.n, false), bM = dM && tooth(spec, dM).dent && !open(dM), bD = dD && tooth(spec, dD).dent && !open(dD);
      var rs = String(t.rest || ''), gm = gumMM(t)(0), gum = gumMM(t);
      /* a connector down a proximal surface ends hidden in the base, 1.2 mm past that side's margin */
      function inBase(sd){ return gum(sd * d.cw * .34) - 1.2; }
      /* occlusal rests over the corner of the crown by the marginal ridge */
      if(post) [['m', -1], ['d', 1]].forEach(function(e){ if(rs.indexOf(e[0]) >= 0) over += metal(corner(d, e[1], .42, .95, .74, .3), .95, .85, G, 2); });
      /* an incisal rest caps the incisal angle (a mandibular canine's distoincisal) */
      if(rs === 'incisal') over += metal(corner(d, 1, .1, .7, .8, .3), .95, .85, G, 2);
      if(t.clasp === 'rpi'){ var sd = bD ? 1 : -1, xi = -sd * .12 * hw, ya = gm - 3.5, rb = 1.8;
        /* the proximal plate on the guide plane next to the base, into the base below */
        under += metal(down(d, sd, ch * .86, inBase(sd), .42), 1.15, 1.3, G, 0);
        /* the I-bar: from under the base, its approach 3.5 mm below the margin, a smooth bend, up to its tip */
        var ib = curve([[sd * (hw + 4), ya - .5], [sd * (hw + 1.6), ya - .1], [xi + sd * (rb + .8), ya], [xi + sd * rb, ya]], 8)
          .concat(curve([[xi + sd * rb, ya], [xi + sd * rb * .45, ya], [xi, ya + rb * .55], [xi, ya + rb]], 6).slice(1))
          .concat(curve([[xi, ya + rb], [xi, ya + rb + 1.5], [xi, ch * .24], [xi, ch * .33]], 6).slice(1));
        under += metal(ib, 2, 1.25, G, 1); }
      else if(t.clasp){ var so = bD && !bM ? 1 : bM && !bD ? -1 : rs === 'd' ? 1 : -1;
        /* next to the base, the minor connector down the proximal into it (elsewhere it crosses the occlusal embrasure to the
           lingual, behind the tooth); the arm from its shoulder, level at first, dipping into the undercut in its last third */
        if(so > 0 ? bD : bM) under += metal(down(d, so, ch * .8, inBase(so), .38), 1.1, 1.25, G, 0);
        var x0 = sideX(d, so, ch * .74), x3 = sideX(d, -so, ch * .34);
        over += metal(curve([[x0 - so * .25, ch * .74], [so * hw * .05, ch * .73], [-so * hw * .6, ch * .62], [x3 + so * .55, ch * .34]], 16), 1.6, .8, G, 1); } });
    return { under:under, over:over };
  }
  I.view = function(spec, o){
    spec = prep(spec); o = o || {}; var ts = teethOf(spec, o.teeth), up = isUpper(ts[0].n), k = o.k || 8.2, g = spec.gingiva || {};
    var look = g.look || 'healthy', edema = g.edema != null ? g.edema : (look === 'inflamed' ? 1 : 0);
    var n = ts.length, w = 0; ts.forEach(function(t){ w += t.d.cw * k - .2 * k; });
    var W = Math.round(w + 60), H = 230, occ = up ? H - 62 : 62, dir = up ? -1 : 1;   /* occ: the incisal edges; dir +1 = roots go down (lower) */
    var s = '<rect class="io-bg" x="0" y="0" width="' + W + '" height="' + H + '" rx="14"/>';
    s += '<rect class="io-mucosa dc-mucosa' + (look === 'inflamed' ? ' dc-inflamed' : '') + '" x="0" y="' + (up ? 0 : occ) + '" width="' + W + '" height="' + (up ? occ : H - occ) + '"/>';
    var x = 30, cols = [];
    ts.forEach(function(t){ var d = t.d, mr = mesialRight(t.n), cx = x + d.cw * k / 2; cols.push({ t:t, cx:cx, d:d, mr:mr }); x += d.cw * k - .2 * k; });
    /* mucogingival junction: the attached gingiva is lighter; its width from the spec (mm), 4 by default */
    var kt = (g.kt != null ? g.kt : 4) * k, mgj = [];
    cols.forEach(function(c){ var cej = occ + dir * c.d.ch * k; mgj.push([c.cx - c.d.cw * k / 2, cej + dir * (kt + .6 * k)], [c.cx, cej + dir * (kt - .3 * k)]); });
    mgj.push([W + 5, mgj[mgj.length - 1][1]]); mgj.unshift([-5, mgj[0][1]]);
    var mg = dense(mgj, false, 5);
    s += path('io-gum dc-attached' + (look === 'inflamed' ? ' dc-inflamed' : look === 'fibrotic' ? ' dc-fibrotic' : ''), mg.concat([[W + 5, occ], [-5, occ]]));
    /* v2.4: the gingiva over a gap (a missing tooth, or an implant under its cover screw). One smooth ridge for each run of
       missing teeth: its crest a line between the neighbors' CEJs, as far below them as the ridge has resorbed (gapMM), sagging a
       little between two teeth; from a neighbor's facial margin it slopes down into the ridge over 4.2 mm, or 1.6 times the drop
       if more (5 beside an overdenture abutment, whose root keeps its bone, so it stands on a mound; a single gap is one U), so the tooth beside a gap has no papilla on that side and the gum never
       steps. Past the ridge, toward the occlusal plane, is the mouth (dark), not the attached gingiva; over an overdenture
       abutment's dome too */
    /* v2.4: with a partial denture in, a front space's gum-fitted teeth (Faigenblum's open face: flange none) stand on the ridge as
       a bridge's pontics do, each with its own margin where the ridge's crest is (the neighbors' mid-facial margins, and past them
       as far as the ridge has resorbed), its papillae four fifths as tall as a tooth's; with the denture out, the ridge */
    var vden = (spec.dentures || {})[archOf(ts[0].n)], gf = {};
    if(vden && !o.out && vden.type !== 'complete' && flangeOf(spec, archOf(ts[0].n)) === 'none')
      frontSpaces(spec, archOf(ts[0].n)).forEach(function(sp){ sp.forEach(function(n){ gf[n] = 1; }); });
    function gapCol(c){ return (c.t.missing && !c.t.pontic && !gf[c.t.n]) || !!(c.t.implant && c.t.implant.cover); }
    function gfMargin(c){ var i = cols.indexOf(c), a = i, b = i, ms = [];
      while(a > 0 && gf[cols[a - 1].t.n]) a--; while(b < cols.length - 1 && gf[cols[b + 1].t.n]) b++;
      [cols[a - 1], cols[b + 1]].forEach(function(nb){ if(nb && !nb.t.missing) ms.push(siteMy(nb, 1)); });
      var y = ms.length ? (ms[0] + ms[ms.length - 1]) / 2 : occ + dir * c.d.ch * k - dir * 2 * k;
      return y + dir * (vden.ridge != null ? vden.ridge : RIDGE) * k; }
    function siteMy(c, j){ var cej = occ + dir * c.d.ch * k; if(gf[c.t.n]) return gfMargin(c) - (j === 1 ? 0 : dir * .2 * k); if(c.t.missing) return cej - dir * .3 * k;
      var rec = c.t.rec.f[siteOrder(c.t.n)[j]]; return cej + dir * rec * k + (c.t.implant ? dir * PLAT * k : j === 1 ? dir * (c.d.cej || 0) * k : 0); }
    function smooth(u){ return u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u); }
    var gaps = [];
    cols.forEach(function(c, i){ if(!gapCol(c)) return; var r = gaps[gaps.length - 1]; if(r && r.b === i - 1) r.b = i; else gaps.push({ a:i, b:i }); });
    gaps.forEach(function(r){
      var L = r.a > 0 ? cols[r.a - 1] : null, R = r.b < cols.length - 1 ? cols[r.b + 1] : null, g = 0, m = 0, i;
      for(i = r.a; i <= r.b; i++){ g = Math.max(g, gapMM(spec, cols[i].t)); m += (occ + dir * cols[i].d.ch * k) / (r.b - r.a + 1); }
      /* the crest is measured from the neighbors' mid-facial margins, where the socket's tissue stood before it healed (Tan 2012's
         1.24 mm is from there; with no neighbor in the view, 2 mm over the gap teeth's CEJs, the default margin) */
      var cL = L ? siteMy(L, 1) : null, cR = R ? siteMy(R, 1) : null;
      if(cL == null) cL = cR != null ? cR : m - dir * 2 * k; if(cR == null) cR = cL;
      r.xa = L ? L.cx + L.d.cw * .34 * k : -6; r.xb = R ? R.cx - R.d.cw * .34 * k : W + 6; r.L = L; r.R = R; r.g = g;
      var span = r.xb - r.xa, ya = L ? siteMy(L, 2) : 0, yb = R ? siteMy(R, 0) : 0;
      var rl = Math.min(Math.max((L && L.t.od ? 5 : 4.2) * k, L ? Math.abs(ya - cL - dir * g * k) * 1.6 : 0), span * .5);
      var rr = Math.min(Math.max((R && R.t.od ? 5 : 4.2) * k, R ? Math.abs(yb - cR - dir * g * k) * 1.6 : 0), span * .5);
      r.y = function(x){ var t = Math.max(0, Math.min(1, (x - r.xa) / span)), crest = cL + (cR - cL) * t + dir * (g + (L && R ? .35 * Math.sin(Math.PI * t) : 0)) * k, y = crest;
        if(L) y += (ya - crest) * (1 - smooth((x - r.xa) / rl));
        if(R) y += (yb - crest) * (1 - smooth((r.xb - x) / rr));
        return y; };
      r.pts = []; var steps = Math.max(6, Math.round(span / (.7 * k)));
      for(i = 0; i <= steps; i++){ var x = r.xa + span * i / steps; r.pts.push([x, r.y(x)]); } });
    /* the free gingiva: its margin follows recession at the three facial sites (negative recession: margin on the crown,
       swollen); calculus and plaque along the margin. Between two teeth the papilla: the margin scallops up from each
       tooth's line angles to a tip in the gingival embrasure, its sides steepening as they hug the crowns (the scallop is
       deepest in front, its bone 2.1-4.1 mm higher between the teeth than at mid-facial: Becker, Ochsenbein, Tibbetts and
       Becker, J Clin Periodontol 1997;24:727; the papilla fills the embrasure short of the contact: Tarnow, Magner and
       Fletcher, J Periodontol 1992;63:995): its tip 3.4 mm above the line angles' margin between incisors and
       canines, 2.4 between premolars and 1.8 between molars, at least half a millimeter short of the contact; lower when
       swollen (blunted), beside an implant (Tarnow et al., J Periodontol 2003;74:1785: lower still between two), and beside a root with no crown; a
       receded line angle takes the papilla down with it. At either end of the view the next tooth's half papilla */
    var edge = [], marks = '';
    function crowned(c){ return !gapCol(c) && !c.t.od && !c.t.retained; }
    function contact(c, side){ var sg = c.mr ? -1 : 1, cej = occ + dir * c.d.ch * k, best = null;
      (c.t.missing ? TL.ponticMM(typeOf(c.t.n), { per:4 }) : crownMM(c.d)).forEach(function(p){ if(!best || side * sg * p[0] > side * sg * best[0]) best = p; });
      return [c.cx + sg * best[0] * k, cej - dir * best[1] * k]; }
    function rise(n){ var p = posOf(n); return p <= 3 ? 3.4 : p <= 5 ? 2.4 : 1.8; }
    function margins(c){ var cej = occ + dir * c.d.ch * k;
      if(gf[c.t.n]) return [0, 1, 2].map(function(j){ return siteMy(c, j); });
      if(c.t.missing) return [cej - dir * .3 * k, cej - dir * .45 * k, cej - dir * .3 * k];
      return [0, 1, 2].map(function(j){ return siteMy(c, j); }); }
    function sx(c, j){ return c.cx + (j - 1) * c.d.cw * .34 * k; }
    function tipOf(a, b, half){ var T = Math.min(rise(a.t.n), rise((b || a).t.n)) * (edema ? .62 : 1);
      [a, b].forEach(function(c){ if(!c) return; if(c.t.implant) T *= b && a.t.implant && b.t.implant ? .78 : .86; if(c.t.retained || c.t.od) T *= .5; if(c.t.missing) T *= .8; });
      var xt = b ? (a.cx + a.d.cw / 2 * k + b.cx - b.d.cw / 2 * k) / 2 : half > 0 ? a.cx + a.d.cw / 2 * k : a.cx - a.d.cw / 2 * k;
      var base = b ? (margins(a)[2] + margins(b)[0]) / 2 : margins(a)[half > 0 ? 2 : 0], yt = base - dir * T * k;
      if(b && crowned(a) && crowned(b)){ var ca = contact(a, 1), cb = contact(b, -1), cy = (ca[1] + cb[1]) / 2 + dir * .5 * k; if(dir * (yt - cy) < 0) yt = cy; }
      /* how round its tip is: a back tooth's broader, a swollen one's broadest */
      var rd = Math.min(.85, (posOf(a.t.n) > 3 || (b && posOf(b.t.n) > 3) ? .55 : .3) + (edema ? .3 : 0));
      return [xt, yt, rd]; }
    /* each tooth's margin is one U from tip to tip through its mid-facial margin, steepest at the tips; the papilla is two such
       halves meeting at its tip */
    var P = edema ? 1.8 : 2.2, US = [1, .95, .88, .78, .62, .42, .2, 0];
    function scal(u, rd){ var g = Math.pow(u, P); return g + (rd || 0) * (1 - g) * smooth((u - .7) / .3); }
    function half(c, Z, t, out){ var sd = t[0] > c.cx ? 1 : -1, w = Math.abs(t[0] - c.cx);
      US.forEach(function(u){ out.push([c.cx + sd * u * w, Z + (t[1] - Z) * scal(u, t[2])]); }); return out; }
    function yOn(c, Z, t, x){ var u = Math.min(1, Math.abs(x - c.cx) / Math.abs(t[0] - c.cx)); return Z + (t[1] - Z) * scal(u, t[2]); }
    cols.forEach(function(c, i){
      var d = c.d, so = siteOrder(c.t.n), pv = cols[i - 1], nx = cols[i + 1], m = margins(c), Z = m[1];
      if(gapCol(c)){ gaps.forEach(function(r){ if(r.a === i) edge.push.apply(edge, r.pts.slice(r.L ? 1 : 0, r.R ? -1 : r.pts.length)); }); return; }
      var tl = pv && !gapCol(pv) ? tipOf(pv, c) : !pv ? tipOf(c, null, -1) : null, tr = nx && !gapCol(nx) ? tipOf(c, nx) : !nx ? tipOf(c, null, 1) : null;
      /* beside a gap the U stops at the line angle's margin, where the ridge's slope begins (its far tip set so the U passes
         through that margin, so the gum never notches the crown there) */
      var hl = tl || [sx(c, 0) - (sx(c, 0) - c.cx) * .47, Z + (m[0] - Z) / scal(1 / 1.47)], hr = tr || [sx(c, 2) + (sx(c, 2) - c.cx) * .47, Z + (m[2] - Z) / scal(1 / 1.47)];
      /* at the view's start, the half papilla of the tooth before it, mirrored from this tooth's own */
      if(!pv){ edge.push([-6, Z]); half(c, Z, tl, []).reverse().forEach(function(p){ var q = 2 * tl[0] - p[0]; if(q > -6) edge.push([q, p[1]]); }); }
      /* on a gap's side the margin rises from mid-facial to the line angle's in a smooth S, level where the ridge's slope takes over,
         so the gum rounds the line angle instead of peaking there */
      function gapHalf(xe, ye){ var out = []; for(var q = 0; q <= 8; q++){ var u = q / 8; out.push([c.cx + (xe - c.cx) * u, Z + (ye - Z) * smooth(u)]); } return out; }
      var Lh = tl ? half(c, Z, hl, []).slice(1) : gapHalf(sx(c, 0), m[0]).reverse(), Rh = tr ? half(c, Z, hr, []).reverse().slice(1) : gapHalf(sx(c, 2), m[2]).slice(1);
      edge.push.apply(edge, Lh.concat(Rh));
      if(!c.t.missing) so.forEach(function(si, j){ var x = sx(c, j), my = j === 1 ? Z : yOn(c, Z, j ? hr : hl, x);
        if(c.t.bop.f[si]) marks += dot('dc-blood', x, my + dir * 2.2, 2.4);
        if(c.t.pus.f[si]) marks += dot('dc-pusdrop', x + 4, my + dir * 5, 2.8);
        if(c.t.plaque.f[si]) marks += path('dc-plaque', [[x - 4, my - dir * .2 * k], [x + 4, my - dir * .2 * k], [x + 3, my - dir * 1.1 * k], [x - 3, my - dir * 1.0 * k]]); });
      if(!nx){ half(c, Z, tr, []).forEach(function(p){ var q = 2 * tr[0] - p[0]; if(q < W + 6 && q > tr[0]) edge.push([q, p[1]]); }); edge.push([W + 6, Z]); }
    });
    /* a missing tooth at either end of the view: the gingiva still runs to the view's edge */
    if(edge.length){ if(edge[0][0] > -6) edge.unshift([-6, edge[0][1]]); var lp = edge[edge.length - 1]; if(lp[0] < W + 6) edge.push([W + 6, lp[1]]); }
    /* v2.4: past the gum, toward the occlusal plane, is the mouth (dark): one shape whose edge is the gum's own (drawn over it,
       so no seam), seen above each contact between two crowns (the incisal and occlusal embrasures), past the last tooth at
       either end of the view, and over a gap down to its ridge. The crowns are drawn over it */
    var e = dense(edge, false, 5), oc = occ - dir * 14;
    function gumAt(x){ for(var j = 1; j < e.length; j++){ var a = e[j - 1], b = e[j]; if(a[0] !== b[0] && (a[0] - x) * (b[0] - x) <= 0) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]); } return null; }
    s += path('io-bg', [[-6, oc]].concat(e, [[W + 6, oc]]));
    /* teeth: the labial crown outline, roots behind the gum (seen where there is recession) */
    cols.forEach(function(c){
      var d = c.d, sg = c.mr ? -1 : 1, cej = occ + dir * d.ch * k;
      function X(px){ return c.cx + sg * px * k; }
      function V(pts){ return pts.map(function(p){ return [X(p[0]), cej - dir * p[1] * k]; }); }
      if(c.t.missing && c.t.pontic){ s += path('io-tooth pfm' + oneOf(c.t.pontic, CROWNS, ' cr-') + (up ? '' : ' low'), V(TL.ponticMM(typeOf(c.t.n), { per:4 }))); return; }
      /* a gum-fitted denture tooth: a pontic's outline, its ridge lap carried to a millimeter past its margin, under the gum */
      if(gf[c.t.n]){ var Y0 = d.ch * .4, yr = dir * (cej - siteMy(c, 1)) / k - 1.05;
        s += path('io-tooth io-dt' + (up ? '' : ' low'), V(dense(TL.ponticMM(typeOf(c.t.n), { per:4 }), true, 4).map(function(p){ return [p[0], p[1] < Y0 ? Y0 - (Y0 - p[1]) * (Y0 - yr) / (Y0 + 1.05) : p[1]]; }))); return; }
      if(c.t.missing || (c.t.implant && c.t.implant.cover)) return;
      /* an implant (v2.3): the abutment and the implant's threaded body behind the mucosa, seen where the margin has receded past the
         crown's margin (the platform 1.1 mm apical to it, as on the film; its recession is measured from the platform) */
      if(c.t.implant){ var im = c.t.implant, hw = im.w / 2 * k, pf = cej + dir * PLAT * k, ab = Math.min(hw * .84, d.cv / 2 * k * .9), body = [], j;
        s += path('io-impl io-abut', [[c.cx - ab * .9, cej - dir * .4 * k], [c.cx + ab * .9, cej - dir * .4 * k], [c.cx + ab, pf], [c.cx - ab, pf]]);
        for(j = 0; j <= 10; j++){ var u = j / 10, yy = pf + dir * u * im.len * k, tw = hw * (1 - .2 * u * u); body.push([c.cx + tw, yy]); body.unshift([c.cx - tw, yy]); }
        s += path('io-impl', body);
        for(j = .7; j < im.len - .5; j += .8){ var ty = pf + dir * j * k, tw2 = hw * (1 - .2 * Math.pow(j / im.len, 2));
          s += path('io-thread', [[c.cx - tw2, ty], [c.cx + tw2, ty + dir * .3 * k]], true); } }
      if(!c.t.implant){
        var roots = mkRoots(d, X, k, cej).map(function(r){ return { a0:r.a0, a1:r.a1, w0:r.w0, wa:r.wa, y0:cej, len:dir * r.len }; });
        roots.forEach(function(r){ var pts = rootOutline({ a0:r.a0, a1:r.a1, w0:r.w0, wa:r.wa, y0:0, len:Math.abs(r.len) }, 0, 0, 0).map(function(p){ return [p[0], cej + dir * p[1]]; }); s += path('io-root', pts); });
        if(d.tr){ var tp = trunkPts(roots.map(function(r){ return { a0:r.a0, a1:r.a1, w0:r.w0, wa:r.wa, y0:0, len:Math.abs(r.len) }; }), sg, 0, -1, d.tr * k, k); if(tp) s += path('io-root', tp.map(function(p){ return [p[0], cej + dir * p[1]]; })); }
      }
      var cr = dense(crownMM(d), true, 4).map(function(p){ return [X(p[0]), cej - dir * p[1] * k]; });
      /* a retained root (v2.2): the stump about a millimeter above the CEJ, its broken top soft and brown with decay (often under the
         gingiva: the chart's recession says) */
      /* v2.4: an overdenture abutment: its dome above the gingiva, the seal's edge at its top (under a denture that is in, the base
         covers it) */
      if(c.t.od){ var dm = [], i3; for(i3 = 0; i3 <= 16; i3++){ var a3 = Math.PI * i3 / 16; dm.push([-d.cv / 2 * Math.cos(a3), domeMM(a3)]); }
        s += path('io-tooth io-od' + (up ? '' : ' low'), V(dm.concat([[d.cv / 2, -3], [-d.cv / 2, -3]])));
        s += path('io-r io-r-' + (c.t.od === 'gi' ? 'gi' : c.t.od), V(TL.filletClosed([[-1.1, DOME - .55], [1.1, DOME - .55], [.9, DOME - .08], [-.9, DOME - .08]], .3))); return; }
      if(c.t.retained){ var stub = clipHalf(cr, V([[-9, .9]])[0], V([[9, .9]])[0], V([[0, -2]])[0], .22 * k);
        s += path('io-tooth io-stump' + (up ? '' : ' low'), stub) + path('io-cav', clipHalf(stub, V([[-9, .4]])[0], V([[9, .4]])[0], V([[0, 3]])[0], .15 * k)); return; }
      var ven = c.t.resto.some(function(r){ return r.type === 'veneer'; }), fx = c.t.fx.filter(function(f){ return f.type === 'crown' || (f.type === 'cusp' && /B/.test(f.cusp)); })[0];
      var tcls = 'io-tooth' + (c.t.crown || c.t.implant ? ' pfm' : '') + (up ? '' : ' low') + oneOf(c.t.crownMat, CROWNS, ' cr-') + (ven ? ' cr-veneer' : '');
      if(!fx) s += path(tcls, cr);
      else s += viewFx(cr, fx, d, V, tcls);
      c.t.resto.forEach(function(r){ if(r.type !== 'veneer') s += viewResto(c.t, r, V); });
      /* v2.2: a mandibular molar's buccal pit sealant, an opaque white line in the buccal groove's pit; external cervical resorption on
         the facial, once under the enamel, a pink spot through the cervical crown (above the margin where it shows) */
      if(/B/.test(c.t.seal)){ var gx = typeOf(c.t.n) === 'manM1' ? -d.cw / 2 * .27 : 0, h = d.ch; s += path('io-seal', V(TL.filletClosed([[gx - .36, h * .46], [gx + .36, h * .46], [gx + .2, h * .9], [gx - .2, h * .9]], .3))); }
      c.t.rsp.forEach(function(x){ if(x.type !== 'cervical' || x.side !== 'f' || (x.heithersay || 2) < 2 || c.t.crown) return;
        var gy = Math.max(.2, gumMM(c.t)(0)) + 1.15; [[1.3, 'io-pink io-pink-edge'], [1, 'io-pink']].forEach(function(L){ var e = [];
          for(var i = 0; i < 20; i++){ var a = i / 20 * Math.PI * 2; e.push([Math.cos(a) * d.cv * .2 * L[0], gy + Math.sin(a) * .75 * L[0]]); }
          s += path(L[1], V(e)); }); });
      /* decay seen from the buccal, drawn under the free gingiva (which covers what is subgingival) */
      c.t.caries.forEach(function(cr){ var L = buccalLesion(c.t, cr); if(L) L.layers.forEach(function(l){ s += path(l.cls, V(l.pts)); }); });
      if(c.t.implant) s += path('io-margin', [[c.cx - d.cv / 2 * k, cej], [c.cx + d.cv / 2 * k, cej]], true);
    });
    var base = up ? -5 : H + 5;
    s += path('io-gum dc-free' + (look === 'inflamed' ? ' dc-inflamed' : look === 'fibrotic' ? ' dc-fibrotic' : ''), e.concat([[e[e.length - 1][0], base], [e[0][0], base]]));
    if(look !== 'inflamed' && g.stippling !== false){ var r = rnd(7 + n), cejM = 0; cols.forEach(function(c){ cejM += (occ + dir * c.d.ch * k) / n; });
      /* v2.4: stipple only on the gum, clear of its edge (over a gap the ridge sits lower than the teeth's margins) */
      for(var i = 0; i < 70; i++){ var px = 20 + r() * (W - 40), py = cejM + dir * (.6 * k + r() * (kt - .8 * k)), gy = gumAt(px);
        if(gy != null && dir * (py - gy) < .8 * k) continue;
        s += dot('dc-stipple', px, py, .9); } }
    s += marks;
    /* supragingival calculus (Newman and Carranza): a yellow-tan deposit on the cervical third, hugging the margin, thickest
       toward the interproximal line angles, its crown-side edge irregular. It follows the margin across the facial and tapers
       off where the margin climbs a papilla, so it never runs up a proximal surface as a thin strip */
    cols.forEach(function(c, ci){ if(!c.t.calc || c.t.missing || c.t.implant) return;
      var cej = occ + dir * c.d.ch * k, ms = siteOrder(c.t.n).map(function(si, j){ return cej + dir * c.t.rec.f[si] * k + (j === 1 ? dir * (c.d.cej || 0) * k : 0); });
      var lim = dir > 0 ? Math.min.apply(null, ms) - 1.1 * k : Math.max.apply(null, ms) + 1.1 * k;
      var l = c.cx - c.d.cw / 2 * k + 2, r2 = c.cx + c.d.cw / 2 * k - 2, run = [], best = -1;
      e.forEach(function(p, i){ var ok = p[0] >= l && p[0] <= r2 && (dir > 0 ? p[1] >= lim : p[1] <= lim);
        if(ok){ if(!run.length || run[run.length - 1].i !== i - 1) run.push({ i:i, pts:[] }); run[run.length - 1].i = i; run[run.length - 1].pts.push(p); } });
      run.forEach(function(r, j){ if(best < 0 || Math.abs(mean(r.pts) - c.cx) < Math.abs(mean(run[best].pts) - c.cx)) best = j; });
      var low = best < 0 ? [] : run[best].pts; if(low.length < 4) return;
      var x0 = low[0][0], x1 = low[low.length - 1][0];
      var hi = low.map(function(p){ var u = (p[0] - x0) / (x1 - x0 || 1), end = Math.min(1, u / .16, (1 - u) / .16), taper = end * end * (3 - 2 * end);
        var th = k * (.4 + .75 * Math.pow(Math.abs(u - .5) * 2, 1.6)) * (1 + .2 * Math.sin(u * 17 + ci * 2.1) + .1 * Math.sin(u * 43 + ci)) * taper;
        return [p[0], p[1] - dir * th]; });
      s += path('dc-calc', low.map(function(p){ return [p[0], p[1] + dir * .4]; }).concat(dense(hi, false, 2).reverse())); });
    function mean(pts){ return pts.reduce(function(a, p){ return a + p[0]; }, 0) / pts.length; }
    var den = (spec.dentures || {})[up ? 'upper' : 'lower'], dIn = den && !o.out;
    if(dIn) s += viewDenture(spec, den, cols, occ, dir, k, kt, W, up, siteMy, contact, gumAt);
    cols.forEach(function(c){ s += txt(c.cx, up ? H - 10 : 18, '#' + c.t.n, 'io-lab', 'middle'); });
    var seen = []; ts.forEach(function(t){ if(t.missing || t.implant) return; t.caries.forEach(function(cr){ var L = buccalLesion(t, cr); if(L && L.visible) seen.push('#' + t.n + ', ' + lesionWords(t, cr)); });
      if(t.retained && stumpShows(t)) seen.push('#' + t.n + ', a retained root at the gingiva'); if(/B/.test(t.seal)) seen.push('#' + t.n + ', a buccal pit sealant');
      if(t.od && !dIn) seen.push('#' + t.n + ', a root cut down to a dome, its canal sealed'); if(t.clasp && dIn) seen.push('#' + t.n + ', the denture\'s ' + (t.clasp === 'rpi' ? 'I-bar' : 'clasp')); });
    if(den) seen.unshift(dIn ? 'the ' + (den.type === 'complete' ? 'complete' : 'partial') + ' denture in' : 'the denture out');
    ts.forEach(function(t){ if(!t.implant || t.implant.cover) return; var r = Math.max(t.rec.f[0], t.rec.f[1], t.rec.f[2]);
      if(r > .6) seen.push('#' + t.n + ', the implant\'s threads showing above the mucosa'); else if(r > -PLAT) seen.push('#' + t.n + ', the abutment showing above the mucosa'); });
    var label = o.aria || ('Drawn ' + (up ? 'upper' : 'lower') + ' buccal view of ' + ts.map(function(t){ return '#' + t.n; }).join(', ') + ': the gingiva ' + (look === 'inflamed' ? 'red and swollen' : look === 'fibrotic' ? 'pale and fibrotic' : 'pink and stippled') + ', drawn from the chart' + (seen.length ? '; seen: ' + seen.join('; ') : ''));
    return '<svg class="io dc-view" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + s + '</svg>';
  };

  /* ---------- the figures a question shows: list = [{kind, title, note, hide, lingual, teeth}] ----------
     kind: chart | film | view (one arch: the case's teeth, or the figure's own teeth), bitewing (the premolars and molars
     of one side, both arches), fmx (the full-mouth series) or odontogram (the whole mouth) */
  var KINDS = { chart:'Periodontal chart', film:'Periapical radiograph', view:'Clinical view (drawn)', bitewing:'Bitewing radiograph', fmx:'Full-mouth series', odontogram:'Odontogram' };
  var WIDE = { chart:1, fmx:1, odontogram:1 };
  I.KINDS = Object.keys(KINDS);
  I.figures = function(spec, list){
    spec = prep(spec);
    var out = '';
    (list || []).forEach(function(f){
      var body = f.kind === 'chart' ? I.chart(spec, f) : f.kind === 'film' ? I.film(spec, f) : f.kind === 'view' ? I.view(spec, f) :
        f.kind === 'bitewing' ? I.bitewing(spec, f) : f.kind === 'fmx' ? I.fmx(spec, f) : f.kind === 'odontogram' ? I.odontogram(spec, f) : '';
      if(!body) return;
      /* the series stays at a size its films can be read at, and scrolls sideways on a phone */
      if(f.kind === 'fmx') body = '<div class="dc-scroll">' + body + '</div><p class="dc-scroll-hint">Scroll sideways for the whole series.</p>';
      /* v2.4: films are taken with a denture out (it would hide the ridge, and its framework would shadow the teeth); a view says
         whether its arch's denture is in */
      var dens = spec.dentures || {}, ft = figTeeth(spec, f), dn = ft.some(function(n){ return dens[archOf(n)]; }), dw = '';
      if(dn && (f.kind === 'film' || f.kind === 'bitewing' || f.kind === 'fmx')) dw = 'Taken with the denture out.';
      if(dn && f.kind === 'view') dw = f.out ? 'The denture taken out.' : 'The denture in.';
      out += '<figure class="pimg dc-fig' + (WIDE[f.kind] ? ' wide' : '') + '"><figcaption><b>' + esc(KINDS[f.kind]) + '</b>' + (f.title ? ' · ' + esc(f.title) : '') + '</figcaption>' + body + (f.note || dw ? '<div class="pimg-cap">' + esc([dw, f.note].filter(Boolean).join(' ')) + '</div>' : '') + '</figure>';
    });
    if(!out) return '';
    return '<div class="pimg-grid dc-figs">' + out + '</div><div class="pimg-note dc-note">Drawn for this hub from the case\'s numbers to show the findings; not a patient image or a real radiograph. Tooth sizes and shapes are averages (Wheeler).</div>';
  };

  /* ---------- the Patient Box rows, from the same record ----------
     A case with no box of its own gets these, so the age, smoking, HbA1c and teeth a question shows are the numbers the
     key was worked out from. spec: age, sex ('woman' | 'man'), smoke (cigarettes a day; 0 = doesn't smoke), hba1c,
     medical, cc (the chief complaint, in the patient's words), mouth.teeth / lost / involved. */
  I.rows = function(spec){
    spec = prep(spec); var r = [], m = spec.mouth || {};
    if(spec.age != null) r.push(['Patient', spec.age + '-year-old ' + (spec.sex || 'patient')]);
    if(spec.cc) r.push(['Chief complaint', '"' + spec.cc + '"']);
    if(spec.medical) r.push(['Medical history', spec.medical]);
    if(spec.hba1c != null) r.push(['HbA1c', spec.hba1c + '%']);
    if(spec.smoke != null) r.push(['Tobacco', spec.smoke ? spec.smoke + ' cigarettes a day' : 'Does not smoke']);
    if(m.teeth != null) r.push(['Teeth', m.teeth + ' present' + (m.lost ? '; ' + m.lost + ' lost to periodontitis' : m.lost === 0 ? '; none lost to periodontitis' : '')]);
    if(m.involved != null && m.teeth != null) r.push(['Teeth involved', m.involved + ' of ' + m.teeth + ' have attachment loss']);
    if(m.stage4 && m.stage4.length) r.push(['Also', m.stage4.join('; ')]);
    /* v2.3: each implant's history, which its diagnosis is read against: the crown and how it is held, when it was delivered, and
       the baseline film (the bone then, in mm below the platform), or that there are no earlier records; a healing one's cover
       screw. Never what the film or the chart shows today */
    allOf(spec).forEach(function(t){ if(!t.implant || t.missing) return; var im = t.implant, b = im.baseline, bits = [];
      if(im.cover) bits.push((im.weeks != null ? 'placed ' + im.weeks + ' week' + (im.weeks === 1 ? '' : 's') + ' ago' : 'placed') + ', under its cover screw (not yet uncovered)');
      else {
        bits.push((im.retention ? im.retention + '-retained ' : '') + (t.crownMat ? String(CROWN_NAME[t.crownMat] || t.crownMat + ' crown').replace(/ \(temporary\)/, '') : 'crown') + (t.abut ? ' (a bridge abutment)' : '') + (im.years != null ? ', delivered ' + (im.years ? im.years + ' year' + (im.years === 1 ? '' : 's') + ' ago' : 'this year') : ''));
        bits.push(b ? 'on the film taken when the crown was delivered (the baseline), the bone was ' + (b.m === b.d ? f1(b.m) + ' mm' : f1(b.m) + ' mm mesially and ' + f1(b.d) + ' mm distally') + ' below the platform' : 'no earlier films or probings to compare with');
      }
      r.push(['Implant #' + t.n, bits.join('; ')]); });
    /* v2.4: each denture: what it is, how long it has been worn, and a partial denture's teeth (never its Kennedy class, its clasps or
       its major connector, which the pictures show and a question may ask); the floor of the mouth's depth, which the lower
       connector is chosen by */
    Object.keys(spec.dentures || {}).forEach(function(ar){ var d = spec.dentures[ar]; if(!d) return; var A = ar.charAt(0).toUpperCase() + ar.slice(1);
      var yrs = d.years != null ? ', worn ' + (d.years ? d.years + ' year' + (d.years === 1 ? '' : 's') : 'since this year') : '';
      if(d.type === 'complete') r.push([A + ' denture', 'complete denture' + yrs]);
      else r.push([A + ' denture', 'removable partial denture (a cast cobalt-chromium framework, acrylic base and denture teeth)' + yrs + (d.replaces && d.replaces.length ? '; replaces #' + d.replaces.join(', #') : '')]);
      if(d.floor != null) r.push(['Floor of the mouth', d.floor + ' mm below the lingual gingival margins of the lower front teeth']); });
    /* v2.2: the case's clinical tests, one row a test, each tooth's result in words */
    TESTS.forEach(function(ty){ var xs = (spec.tests || []).filter(function(x){ return x && x.test === ty; }); if(!xs.length) return;
      r.push([{ bite:'Bite test', transillumination:'Transillumination', percussion:'Percussion' }[ty], xs.map(function(x){ return '#' + x.tooth + ': ' + testWords(x); }).join('; ')]); });
    return r;
  };
  function testWords(x){
    if(x.test === 'bite'){ if(x.result !== 'positive') return 'no pain on biting';
      var c = CAT(x.tooth), up = c && c.arch === 'upper', L = up ? 'palatal' : 'lingual', nm = { MB:'mesiobuccal', DB:'distobuccal', ML:'mesio' + L, DL:'disto' + L, B:'buccal', L:L };
      return 'pain on biting' + (x.cusp ? ' on the ' + (nm[x.cusp] || x.cusp) + ' cusp' : '') + (x.release ? ', sharpest on release' : ''); }
    if(x.test === 'transillumination') return x.result === 'positive' ? 'the light stops at a line across the crown; beyond it the tooth stays dark' : 'the light passes evenly through the crown';
    return x.result === 'metallic' ? 'a high, metallic sound' : x.result === 'tender' ? 'tender' : 'normal, not tender';
  }
  I.caseRows = function(c){ return c ? (c.box || I.rows(c.spec)) : []; };

  /* ---------- checks on what a question shows ---------- */
  function present(spec, teeth){ return (teeth || []).map(String).filter(function(n){ return !tooth(spec, n).missing; }); }
  function figTeeth(spec, f){
    if(f.kind === 'fmx' || f.kind === 'odontogram'){ var a = []; for(var i = 1; i <= 32; i++) a.push(String(i)); return a; }
    return (f.teeth || spec.teeth || []).map(String);
  }
  /* the pictures themselves: known kinds, one arch where a view needs one, a bitewing only of premolars and molars and of
     both arches, and a full-mouth view that agrees with the counts the box gives */
  I.checkFigs = function(spec, figs){
    spec = prep(spec); var P = [], m = spec.mouth || {};
    (figs || []).forEach(function(f, i){
      var w = 'figure ' + (i + 1) + ' (' + f.kind + '): ';
      if(!KINDS[f.kind]){ P.push(w + 'unknown picture kind'); return; }
      Object.keys(f.hide || {}).forEach(function(h){ if(['cal', 'furc', 'mob'].indexOf(h) < 0) P.push(w + 'hide.' + h + ' is not something a chart can hide'); });
      var ts = figTeeth(spec, f);
      ts.forEach(function(n){ if(!CAT(n)) P.push(w + 'tooth ' + n + ' is not a universal number'); });
      if(f.kind === 'chart' || f.kind === 'film' || f.kind === 'view'){
        var a = ts.map(isUpper); if(a.some(Boolean) && !a.every(Boolean)) P.push(w + 'the teeth are not all in one arch');
        /* v2.4: a film or the view of a complete denture's arch shows the ridge (or the denture); a chart has nothing to probe */
        if(!present(spec, ts).length && (f.kind === 'chart' || !ts.some(function(n){ return tooth(spec, n).dent; }))) P.push(w + 'every tooth in it is missing');
      }
      if(f.out != null){ if(f.kind !== 'view') P.push(w + 'out (the denture taken out) is the view\'s: a film is taken with it out anyway');
        else if(!(spec.dentures || {})[ts.length && isUpper(ts[0]) ? 'upper' : 'lower']) P.push(w + 'out: there is no denture in this arch to take out'); }
      if(f.kind === 'bitewing'){
        ts.forEach(function(n){ var c = CAT(n); if(c && c.films.indexOf('bitewing') < 0) P.push(w + 'a bitewing of #' + n + ' (the ' + c.name + '): bitewings show premolars and molars'); });
        if(!ts.some(isUpper) || ts.every(isUpper)) P.push(w + 'a bitewing shows both arches: list upper and lower teeth');
        var sides = ts.map(function(n){ return CAT(n) && CAT(n).side; }); if(sides.some(function(x){ return x !== sides[0]; })) P.push(w + 'a bitewing shows one side');
      }
      if(f.kind === 'fmx' || f.kind === 'odontogram'){
        /* an implant replaces a tooth: it isn't one of the teeth present, and a tooth lost to periodontitis may be under one (v2.3) */
        var gone = 0, imps = 0; for(var j = 1; j <= 32; j++){ var tj = tooth(spec, String(j)); if(tj.missing) gone++; else if(tj.implant) imps++; }
        if(!spec.full) P.push(w + 'a full-mouth view needs full:true and every tooth in the record (missing ones by the missing module)');
        if(m.teeth != null && m.teeth !== 32 - gone - imps) P.push(w + 'the box says ' + m.teeth + ' teeth present; the record has ' + (32 - gone - imps) + (imps ? ' (and ' + imps + ' implant' + (imps > 1 ? 's' : '') + ')' : ''));
        if(m.lost != null && m.lost > gone + imps) P.push(w + m.lost + ' teeth lost to periodontitis, but only ' + (gone + imps) + ' are missing or replaced by implants');
      }
    });
    return P;
  };
  /* answerable from what's shown: each question says what its key rests on (q.rests: stage, grade, extent, rt, furc, impl,
     kind), and this fails when the figures and rows it shows don't include it. The twin of hide, which stops a picture
     from giving the answer away. */
  var RESTS = ['stage', 'grade', 'extent', 'rt', 'furc', 'impl', 'kind', 'endo', 'fracture', 'resto', 'caries', 'roottip', 'resorption', 'sealant', 'denture', 'kennedy'];
  I.RESTS = RESTS;
  I.answerable = function(spec, figs, rows, rests){
    spec = prep(spec); figs = figs || []; rows = rows || []; var P = [], D = I.derive(spec), m = spec.mouth || {};
    var rowText = rows.map(function(r){ return r.join(': '); }).join(' | ');
    function row(re){ return re.test(rowText); }
    function inFig(kinds, n, test){ return figs.some(function(f){ return kinds.indexOf(f.kind) >= 0 && figTeeth(spec, f).indexOf(String(n)) >= 0 && (!test || test(f)); }); }
    function chart(n, test){ return inFig(['chart'], n, test); }
    function film(n){ return inFig(['film', 'bitewing', 'fmx'], n); }
    var anyChart = figs.some(function(f){ return f.kind === 'chart'; });
    (rests || []).forEach(function(k){
      if(RESTS.indexOf(k) < 0){ P.push('rests: "' + k + '" is not one of ' + RESTS.join(', ')); return; }
      if(k === 'kind' && !anyChart) P.push('kind: health, gingivitis or periodontitis needs the chart (CAL and bleeding)');
      if(k === 'stage'){
        if(D.kind !== 'periodontitis'){ if(!anyChart) P.push('stage: no attachment loss is only seen on the chart, and none is shown'); return; }
        var sev = (D.sCAL === D.severity && chart(D.maxInterdental.tooth)) || (D.sRBL === D.severity && D.maxRBL.tooth && film(D.maxRBL.tooth));
        if(!sev) P.push('stage: the severity rests on interdental CAL at #' + D.maxInterdental.tooth + ' (' + D.maxInterdental.v + ' mm) or bone loss at #' + (D.maxRBL.tooth || '?') + ' (' + D.maxRBL.pct + '%), and neither is shown');
        if(D.stage === 4 && (m.lost >= 5 || (m.stage4 && m.stage4.length))){
          if(!row(/lost|stage 4|bite|chewing|ridge|mobil|drift|flar/i)) P.push('stage: Stage 4 rests on teeth lost or the complexity it adds, and no row gives it');
        } else if(D.stage > D.severity){
          var shown = (D.maxPD.v >= 6 && chart(D.maxPD.tooth)) || (D.vertical >= 3 && film(D.verticalTooth)) ||
            (D.furc >= 2 && (chart(D.furcTooth, function(f){ return !(f.hide && f.hide.furc); }) || (film(D.furcTooth) && tooth(spec, D.furcTooth).furcX >= 2))) ||
            (m.lost && row(/lost/i));
          if(!shown) P.push('stage: Stage ' + D.stage + ' rests on ' + D.triggers.join(' or ') + ', and none of it is shown');
        }
      }
      if(k === 'grade'){
        var smokeRow = row(/tobacco|smok|cigar/i), a1cRow = row(/hba1c|a1c|glyc|diabet/i);
        if(D.modifiers.length){
          if(!(((spec.smoke || 0) >= 10 && smokeRow) || ((spec.hba1c || 0) >= 7 && a1cRow))) P.push('grade: Grade C rests on ' + D.modifiers.join(' or ') + ', and no row gives it');
        } else {
          if(D.maxRBL.pct > 0 && !film(D.maxRBL.tooth)) P.push('grade: the grade rests on bone loss for age, and the film of #' + D.maxRBL.tooth + ' is not shown');
          if(!row(/patient|age|year-old/i)) P.push('grade: the grade rests on bone loss for age, and no row gives the age');
          if(spec.smoke != null && !smokeRow) P.push('grade: no row says whether the patient smokes, so Grade C can\'t be ruled out');
          if(spec.hba1c != null && !a1cRow) P.push('grade: no row gives the HbA1c, so Grade C can\'t be ruled out');
        }
      }
      if(k === 'extent' && !row(/involv|extent|of \d+ teeth/i)) P.push('extent: localized or generalized rests on how many teeth are involved, and no row gives it');
      if(k === 'rt') Object.keys(D.rt).forEach(function(n){ if(!chart(n)) P.push('rt: the recession type of #' + n + ' needs its chart (facial recession and interdental CAL)'); });
      if(k === 'furc' && D.furc && !(chart(D.furcTooth, function(f){ return !(f.hide && f.hide.furc); }) || (film(D.furcTooth) && tooth(spec, D.furcTooth).furcX))) P.push('furc: the furcation of #' + D.furcTooth + ' is not shown');
      /* v2.3: an implant's diagnosis rests on its film (the bone today), on what it is compared with (the baseline film, or the word
         that there are no earlier records, in a row or a picture's note) and, unless it failed, on bleeding or suppuration (its chart
         or a row); one under its cover screw on its film alone */
      if(k === 'impl'){ var notes = figs.map(function(f){ return f.note || ''; }).join(' | ');
        if(!Object.keys(D.impl).length) P.push('impl: the record has no implant');
        Object.keys(D.impl).forEach(function(n){ var ti = tooth(spec, n), im = ti.implant, dd = D.impl[n], hist = rowText + ' | ' + notes;
          if(!film(n)) P.push('impl: the implant at #' + n + ' needs its film');
          if(im.cover) return;
          if(im.baseline ? !/baseline|earlier film|previous film|prior film|when the crown was delivered|at delivery|1-year|one-year|year after/i.test(hist) : !/no (earlier|previous|prior|baseline)|no records/i.test(hist))
            P.push('impl: #' + n + '\'s diagnosis is read against ' + (im.baseline ? 'its baseline film, and no row or note gives the bone then' : 'the rule for a patient without records, and no row or note says there are none'));
          if(dd.dx !== 'failed implant' && !(chart(n) || row(/bleed|bop|suppur|\bpus\b|exudat/i))) P.push('impl: #' + n + '\'s bleeding or suppuration on probing (or that there is none) needs its chart or a row'); }); }
      /* v2.1: endodontic findings need a periapical (film or full-mouth series: a bitewing stops short of the apices); fractures
         each by what shows them (a crack on no film at all: a row with the bite test or transillumination, or the odontogram; a
         vertical root fracture on a periapical or as its narrow pocket on the chart; a horizontal one on a periapical; a crown
         or cusp fracture on any film, the drawn view or the odontogram); restorations, crowns and bridges on a film or the
         odontogram (or the view for what shows from the buccal), and a margin's overhang, gap or recurrent caries on a film */
      var all = allOf(spec).filter(function(t){ return !t.missing || t.pontic; });
      function pa(n){ return inFig(['film', 'fmx'], n); }
      function xr(n){ return inFig(['film', 'bitewing', 'fmx'], n); }
      function odo(n){ return inFig(['odontogram'], n); }
      function vw(n){ return inFig(['view'], n); }
      if(k === 'endo'){ var en = all.filter(function(t){ return t.endo || t.lesion || t.apdl; });
        if(!en.length) P.push('endo: the record has no endodontic finding');
        en.forEach(function(t){ if(!pa(t.n)) P.push('endo: #' + t.n + '\'s root canal filling, lesion or PDL needs a periapical (film or fmx)'); }); }
      if(k === 'fracture'){ var fxs = all.filter(function(t){ return t.fx.length; });
        if(!fxs.length) P.push('fracture: the record has no fracture');
        fxs.forEach(function(t){ t.fx.forEach(function(f){ var n = t.n;
          if(f.type === 'crack' && !(odo(n) || row(/bite|biting|release|crack|transillum|wedg|chew/i))) P.push('fracture: a cracked tooth (#' + n + ') shows on no film; give the bite test or transillumination in a row, or the odontogram');
          if(f.type === 'vrf' && !(pa(n) || chart(n))) P.push('fracture: #' + n + '\'s vertical root fracture needs its periapical or its chart (the narrow pocket)');
          if(f.type === 'hrf' && !pa(n)) P.push('fracture: #' + n + '\'s horizontal root fracture needs its periapical');
          if(f.type === 'crown' && !(xr(n) || vw(n) || odo(n))) P.push('fracture: #' + n + '\'s crown fracture needs a film, the view or the odontogram');
          if(f.type === 'cusp' && !(xr(n) || odo(n) || (/B/.test(f.cusp) && vw(n)))) P.push('fracture: #' + n + '\'s fractured cusp needs a film or the odontogram' + (/B/.test(f.cusp) ? ', or the view' : '')); }); }); }
      if(k === 'resto'){ var rs = all.filter(function(t){ return t.crown || t.resto.length || t.pontic || t.amalgam; });
        /* v2.4: a resin-bonded bridge's wing is on the lingual: a film (the metal's or zirconia's shadow) or the odontogram */
        all.forEach(function(t){ if(t.wing && !(xr(t.n) || odo(t.n))) P.push('resto: #' + t.n + '\'s resin-bonded wing is on the lingual: it needs a film or the odontogram'); });
        if(!rs.length) P.push('resto: the record has no restoration');
        rs.forEach(function(t){ var n = t.n, margin = t.margin.open || t.margin.overhang || t.resto.some(function(r){ return r.overhang || r.open; }) || t.caries.some(function(c){ return c.recurrent && (c.s === 'M' || c.s === 'D'); });
          var bm = t.caries.filter(function(c){ return c.recurrent && c.s !== 'M' && c.s !== 'D'; });
          if(margin && !xr(n)) P.push('resto: #' + n + '\'s margin (an overhang, an open margin or recurrent caries) needs a film');
          else if(!margin && !(xr(n) || odo(n) || vw(n))) P.push('resto: #' + n + '\'s restoration needs a film, the odontogram or the view');
          bm.forEach(function(c){ var L = buccalLesion(t, c); if(!((vw(n) && L && L.visible) || odo(n))) P.push('resto: #' + n + '\'s recurrent caries at its buccal margin needs the view (with the margin above the gingiva) or the odontogram'); }); }); }
      /* decay: a buccal lesion (cervical, white spot, root caries, recurrent at a buccal margin) rests on the view where it shows above
         the gingiva, or the odontogram (a white spot's or root lesion's look only on the view); a proximal lesion on a film or the
         odontogram (the view only for an incisor's or canine's into the dentin, its shadow through the labial enamel); an occlusal one
         on a film once in the dentin, or the odontogram; a lingual one on the odontogram; else a row that gives the clinical finding */
      if(k === 'caries'){ var cs = all.filter(function(t){ return t.caries.length && !t.missing; });
        if(!cs.length) P.push('caries: the record has no caries');
        var exam = row(/explor|tactile|soft|leathery|chalky|white spot|cavit|discolor|visual exam|icdas/i);
        cs.forEach(function(t){ var n = t.n, F = CAT(n).surfaces[3]; t.caries.forEach(function(c){
          var L = buccalLesion(t, c), onView = vw(n) && L && L.visible, what = '#' + n + '\'s ' + (c.recurrent ? 'recurrent ' : c.root ? 'root ' : '') + 'caries on ' + c.s;
          if(c.s === F){ var look = c.root || c.stage === 'white-spot' || c.arrested;
            if(!(onView || (!look && (odo(n) || exam)))) P.push('caries: ' + what + (vw(n) && L && !L.visible ? ' is under the gingiva on the view: give it in a row or the odontogram' : ' needs the view' + (look ? ' (its look is the finding)' : ', the odontogram or a row'))); }
          else if(c.s === 'M' || c.s === 'D'){ if(c.recurrent || c.root ? !xr(n) : !(xr(n) || odo(n) || onView)) P.push('caries: ' + what + ' is a film finding' + (c.recurrent || c.root ? '' : ' (or the odontogram)') + ': the buccal view doesn\'t show it');
            /* proximal root caries (v2.2): a film shows the lesion, not whether it is active or arrested */
            if(c.root && c.arrested && !row(/hard|shiny|arrest|leathery|soft|explor|tactile/i)) P.push('caries: ' + what + ' is arrested, and a film can\'t tell that: give the clinical finding (hard, shiny, dark) in a row'); }
          else if(c.s === 'O' || c.s === 'I'){ if(!(odo(n) || exam || (c.depth !== 'enamel' && xr(n)))) P.push('caries: ' + what + ' needs ' + (c.depth === 'enamel' ? 'the odontogram or a row (no film shows it)' : 'a film or the odontogram')); }
          else if(!(odo(n) || exam)) P.push('caries: ' + what + ' (lingual) needs the odontogram or a row'); }); }); }
      /* v2.2: a root tip in the bone on a periapical or the odontogram; a retained root on any film, the odontogram or the view where
         its stump is above the gingiva; resorption on a periapical (external cervical on any film: a bitewing reaches the cervix);
         a sealant on the odontogram, a row, or the view for a buccal pit's (no film shows one) */
      if(k === 'roottip'){ var tips = allOf(spec).filter(function(t){ return t.retained || t.rtip; });
        if(!tips.length) P.push('roottip: the record has no root tip or retained root');
        tips.forEach(function(t){ var n = t.n;
          if(t.rtip && !(pa(n) || odo(n))) P.push('roottip: #' + n + '\'s root tip is in the bone: it needs a periapical (film or fmx) or the odontogram');
          if(t.retained && !(xr(n) || odo(n) || (vw(n) && stumpShows(t)))) P.push('roottip: #' + n + '\'s retained root needs a film, the odontogram, or the view with its stump above the gingiva'); }); }
      if(k === 'resorption'){ var rz = allOf(spec).filter(function(t){ return !t.missing && t.rsp.length; });
        if(!rz.length) P.push('resorption: the record has no resorption');
        rz.forEach(function(t){ t.rsp.forEach(function(x){ var ok = x.type === 'cervical' ? xr(t.n) : pa(t.n);
          if(!ok) P.push('resorption: #' + t.n + '\'s ' + rspWords(x) + ' needs ' + (x.type === 'cervical' ? 'a film' : 'a periapical (film or fmx): a bitewing stops short of the root')); }); }); }
      if(k === 'sealant'){ var sl = allOf(spec).filter(function(t){ return !t.missing && t.seal; });
        if(!sl.length) P.push('sealant: the record has no sealant');
        sl.forEach(function(t){ if(!(odo(t.n) || row(/sealant|sealed/i) || (/B/.test(t.seal) && vw(t.n)))) P.push('sealant: #' + t.n + '\'s sealant shows on no film: give the odontogram or a row' + (/B/.test(t.seal) ? ', or the view (its buccal pit)' : '')); }); }
      /* v2.4: a denture shows in its row, on the odontogram or on the view with it in; its clasps and rests on the view with it in
         (the buccal side: a clasp's arm, an occlusal or incisal rest; a cingulum rest is on the lingual, so only the odontogram) or the odontogram; an overdenture abutment on a periapical, the odontogram or
         the view with the denture out; the Kennedy class on what shows the whole arch (the odontogram, the full-mouth series, or a
         view of every tooth of it) */
      var dens = spec.dentures || {}, D2 = Object.keys(dens);
      function vwIn(n){ return inFig(['view'], n, function(f){ return !f.out; }); }
      function vwOut(n){ return inFig(['view'], n, function(f){ return !!f.out; }); }
      if(k === 'denture'){ if(!D2.length) P.push('denture: the record has no denture');
        D2.forEach(function(ar){ var nums = archNums(ar);
          if(!(row(new RegExp(ar + ' denture', 'i')) || nums.some(function(n){ return odo(n) || vwIn(n); }))) P.push('denture: the ' + ar + ' denture shows in no row or picture');
          nums.forEach(function(n){ var t = tooth(spec, n);
            if(t.clasp && !(vwIn(n) || odo(n))) P.push('denture: #' + n + '\'s clasp needs the view with the denture in, or the odontogram');
            else if(t.rest && !t.clasp && !((vwIn(n) && t.rest !== 'cingulum') || odo(n))) P.push('denture: #' + n + '\'s ' + (t.rest === 'cingulum' ? 'cingulum rest is on the lingual: give the odontogram' : 'rest needs the view with the denture in, or the odontogram'));
            if(t.od && !(pa(n) || odo(n) || vwOut(n))) P.push('denture: #' + n + '\'s overdenture abutment needs a periapical, the odontogram or the view with the denture out'); }); }); }
      if(k === 'kennedy'){ var kd = D2.filter(function(ar){ return dens[ar].type === 'partial'; });
        if(!kd.length) P.push('kennedy: the record has no partial denture');
        kd.forEach(function(ar){ var nums = archNums(ar);
          if(!(figs.some(function(f){ return f.kind === 'odontogram' || f.kind === 'fmx' || (f.kind === 'view' && nums.every(function(n){ return figTeeth(spec, f).indexOf(n) >= 0; })); })))
            P.push('kennedy: the ' + ar + ' arch\'s class rests on every tooth of it: give the odontogram, the full-mouth series or a view of the whole arch'); }); }
    });
    return P;
  };
  /* the numbers an explanation quotes: q.says = { maxInterdental:7, stage:3, ... }; each must be what the record gives and
     must appear in the question's text, so the explanation can't drift from the picture */
  I.got = function(spec){
    var d = I.derive(spec);
    var kn = {}; Object.keys(d.kennedy).forEach(function(a){ kn[a] = d.kennedy[a].text; });
    return { kind:d.kind, stage:d.stage, grade:d.grade, extent:d.extent, dx:d.dx, rt:d.rt, impl:d.impl, kennedy:kn, triggers:d.triggers, ratio:d.ratio,
      maxInterdental:d.maxInterdental.v, maxRBL:d.maxRBL.pct, maxPD:d.maxPD.v, bopPct:d.bopPct, extentPct:d.extentPct };
  };
  I.checkSays = function(spec, q){
    var P = [], g = I.got(spec), text = [q.stem, q.ex, q.why, q.choices, q.exp].map(function(x){ return x == null ? '' : typeof x === 'string' ? x : JSON.stringify(x); }).join(' ');
    Object.keys(q.says || {}).forEach(function(k){
      var v = q.says[k];
      if(!(k in g)){ P.push('says.' + k + ': not something the record works out'); return; }
      if(JSON.stringify(g[k]) !== JSON.stringify(v)) P.push('says.' + k + ': the text quotes ' + JSON.stringify(v) + ', the record gives ' + JSON.stringify(g[k]));
      var sv = String(v), re = typeof v === 'number' ? new RegExp('(^|[^0-9.])' + sv.replace('.', '\\.') + '($|[^0-9])') : null;
      if(re ? !re.test(text) : text.toLowerCase().indexOf(sv.toLowerCase()) < 0) P.push('says.' + k + ': ' + sv + ' is not in the question\'s text');
    });
    return P;
  };
  /* the hooks a hub calls: q.pcase names a case in its PCASES; q.pfig picks this question's pictures (and hides a row
     that would give its answer away); the case's box rows (its own, or the record's) go in front of the question's own */
  I.pboxFigures = function(q, cases){ var c = q && q.pcase && cases && cases[q.pcase]; return c ? I.figures(c.spec, q.pfig || c.figs) : ''; };
  I.boxRows = function(q, cases){ var c = q && q.pcase && cases && cases[q.pcase]; return (c && !q._boxFolded ? I.caseRows(c) : []).concat(q && q.pbox || []); };
  I.foldBox = function(questions, cases){ (questions || []).forEach(function(q){ var c = q.pcase && cases && cases[q.pcase]; if(c && !q._boxFolded){ q.pbox = I.caseRows(c).concat(q.pbox || []); q._boxFolded = true; } }); };
  /* "In the notes" buttons under an explanation: q.ref = [{ label, go }], go as window.SH_GOTO takes it */
  I.refHTML = function(q){
    if(!q || !q.ref || !q.ref.length) return '';
    return '<div class="qx-ref"><span class="qx-ref-lab">In the notes:</span>' + q.ref.filter(Boolean).map(function(r){ return '<button type="button" class="qx-ref-btn" data-go="' + esc(JSON.stringify(r.go || {})) + '">' + esc(r.label) + '</button>'; }).join('') + '</div>';
  };
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('.qx-ref-btn'); if(!b || !b.getAttribute('data-go')) return;
    var go; try { go = JSON.parse(b.getAttribute('data-go')); } catch(err){ return; }
    if(window.shTrack) window.shTrack('case:ref');
    if(window.SH_GOTO) window.SH_GOTO(go);
  });
  I.derivedText = function(spec){ return I.derive(spec).dx; };
  I.XT = XT;
  I.teeth = TL;
  I._ = { teethOf:teethOf, expand:expand, viewOrder:viewOrder, typeOf:typeOf, siteOrder:siteOrder, crownMM:crownMM, rootsMM:rootsMM, boneMM:boneMM };
  window.shCases = I; window.DCASE = I;
})();
