/* The dashboard's hubs: where a hub is added, dated or archived (edit this file by hand).
   classes     each class's name and the line its drawn scene says when tapped
   hubs        every hub with a card: its class, title, exams (name, label, date, the check-in's hours and extra questions,
               and askAgain: a round, "yyyy-mm-dd", that shows the check-in pop-up once more to every device that showed it
               and never sent it; seeing it after the round is set counts as that round's showing), its "updated" date, what it covers, and any archiveOn / hideCardOn override
   archived    hubs kept only for their recaps
   checkinHour, archiveHour, cardDays, debriefDays   when "Check in" shows on exam day, when a hub archives itself (10 pm
               on its last exam day), how many days it then counts as archived before hidden (the dashboard draws no card for
               either since 2026-11-14), and how long the check-in pop-up still goes out
   surveyAgain { "<survey id>": "yyyy-mm-dd" }: a round that shows that survey's pop-up once more to everyone who said
               "Later" to it (it waits in their Inbox until answered)
   labels      short names
   Read by widget/dash.js (the dashboard), review/ (the admin page) and the tools (tools/release/lib.js hubData()). */
window.SH_DASH_DATA = {
 "classes": {
  "ros": {
   "name": "Review of Systems",
   "egg": "Every system reviewed. Vitals within normal limits."
  },
  "implants": {
   "name": "PCD Implants",
   "egg": "Osseointegrated. Primary stability: excellent."
  },
  "spc": {
   "name": "Special Patient Care",
   "egg": "Hands on belly. Counting to ten."
  },
  "hemeendo": {
   "name": "Hematology & Endocrinology",
   "egg": "Negative feedback: every question you answer lowers exam-day cortisol."
  },
  "gi": {
   "name": "GI & Musculoskeletal",
   "egg": "Peristalsis activated. Moving right along."
  },
  "fixedpros": {
   "name": "PCD Fixed Pros",
   "egg": "Film thickness under 25 microns. Fully seated."
  },
  "occlusion": {
   "name": "Occlusion",
   "egg": "Freeway space: 2-6 mm. Plenty of room to study."
  },
  "perio": {
   "name": "Periodontology",
   "egg": "Probing depths 1-2-3, no bleeding on probing."
  }
 },
 "hubs": [
  {
   "id": "review-of-systems",
   "cls": "ros",
   "title": "Review of Systems Hub",
   "code": "Review of Systems · Mock boards",
   "exams": [
    {
     "name": "Review of Systems Mock Board 1",
     "label": "Mock 1",
     "date": "2026-12-03",
     "code": "Review of Systems · Mock 1",
     "checkinHour": 12,
     "promptHour": 12
    },
    {
     "name": "Review of Systems Mock Board 2",
     "label": "Mock 2",
     "date": "2026-12-10",
     "code": "Review of Systems · Mock 2",
     "checkinHour": 12,
     "promptHour": 12
    }
   ],
   "updated": "2026-11-20",
   "desc": "Every course on the two mock board exams (Thu Dec 3 and Thu Dec 10, 8:00 am to noon, 200 questions each): Head & Neck Anatomy, Dental Anatomy & Occlusion, Fundamentals I and II, Oral Microbiology, Neuroscience, Cardio & Respiratory, Renal, Heme & Endo, MSK & GI, Ethics & Professionalism, Evidence-Based Dentistry, Radiology and Emergencies in the Dental Clinic. Each course is a section cut into short parts: high-yield notes with a Plain English version, a cram list, board-style questions with patient boxes and every choice explained, High Likelihood Exam Questions, review tables and a 200-question timed mock.",
   "stateKey": "ros-state-v1"
  },
  {
   "id": "heme-endo-exam3",
   "cls": "hemeendo",
   "title": "Heme & Endo Exam 3 Hub",
   "code": "Heme & Endo · Exam 3",
   "exams": [
    {
     "name": "Hematology & Endocrinology Exam 3",
     "label": "Exam",
     "date": "2026-11-20",
     "code": "Heme & Endo · Exam 3",
     "checkinHour": 10,
     "promptHour": 10
    }
   ],
   "updated": "2026-11-18",
   "desc": "Dr. Taylor's Lecture A (dental endocrinology, moved here from Exam 2), L17 Pregnancy and lactation, L18 Estrogens and androgens, L19 Introduction to hematology, L20 Lymphomas and leukemias, and Dr. Dal Zotto's L21 and L22, the pathology of the male and female reproductive systems. The exam is Fri Nov 20, 8:00-9:30 am (35 questions, new material only). Its own home page with your countdown and progress, notes in three reading levels with narration, 24 interactive diagrams, Patient Box cases, two-statement, true/false, numbered and which-statement questions with every choice explained, High Likelihood Exam Questions, exam hints from the recordings, review tables with side-by-side look-alikes, a mock exam and the Cycle Arcade.",
   "stateKey": "hee3-state-v1",
   "podcast": {
    "name": "Timmy Time",
    "sub": "The last-minute review, 52 min"
   }
  },
  {
   "id": "pcd-implants-exam1",
   "cls": "implants",
   "title": "PCD Implants Exam 1 Hub",
   "code": "PCD Implants · Exam 1",
   "exams": [
    {
     "name": "PCD Implants Exam 1",
     "label": "Exam",
     "date": "2026-11-06",
     "code": "PCD Implants · Exam 1",
     "checkinHour": 20,
     "promptHour": 20,
     "checkinClosed": true,
     "extraQs": [
      {
       "id": "pbox_better",
       "kind": "scale",
       "prompt": "Were the new Patient Box cases for this hub better than the Patient Box questions you had before?",
       "ends": [
        "Worse",
        "About the same",
        "Better"
       ],
       "none": "I didn't get to them"
      },
      {
       "id": "diagrams",
       "kind": "scale",
       "prompt": "How helpful were the diagrams and the drawings of the seven implant types?",
       "ends": [
        "Not helpful",
        "Very helpful"
       ],
       "none": "I didn't use them"
      },
      {
       "id": "helped",
       "kind": "multi",
       "prompt": "Which of these helped you study? Tick any.",
       "only": "None of these",
       "options": [
        "How the class answered each choice",
        "Why each choice",
        "Practice questions starting with the lectures I'd practiced least",
        "High likelihood questions",
        "Pinned questions",
        "Timmy Time",
        "None of these"
       ]
      },
      {
       "id": "changes",
       "kind": "choice",
       "prompt": "The hub kept changing up to exam day: new Patient Box drawings, redrawn implant pictures, reworded questions. How was that?",
       "options": [
        "Good: keep improving it right up to the exam",
        "Fine, I hardly noticed",
        "Too much: I'd rather it held still the last few days"
       ]
      }
     ]
    }
   ],
   "updated": "2026-11-03",
   "desc": "All nine lectures: the evolution of implants, the implant-tissue interface, biomechanics, implant terminology, prefabricated abutments, Dr. Givan's imaging and CBCT study guide, implant surgery, and guided vs freehand surgery. The exam is on Canvas Fri Nov 6, 7 am-8 pm (40 questions, one hour). Its own home page with your countdown and progress, notes in two reading levels with narration, 11 interactive diagrams, multiple-choice, multiple-answer, matching, true/false, two-statement and numbered-statement questions, exam hints, a mock exam and the Osseo Arcade.",
   "stateKey": "pcdimpl-state-v1",
   "podcast": {
    "name": "Timmy Time",
    "sub": "The last-minute review, 48 min"
   }
  },
  {
   "id": "heme-endo-exam2",
   "cls": "hemeendo",
   "title": "Heme & Endo Exam 2 Hub",
   "code": "Heme & Endo · Exam 2",
   "exams": [
    {
     "name": "Hematology & Endocrinology Exam 2",
     "label": "Exam",
     "date": "2026-11-13",
     "code": "Heme & Endo · Exam 2",
     "checkinHour": 12,
     "promptHour": 12,
     "checkinClosed": true
    }
   ],
   "archiveOn": {
    "date": "2026-11-13",
    "hour": 12
   },
   "updated": "2026-11-10",
   "desc": "Lectures 11-16: diabetes pharmacology, endocrine pathology (both hours), male and female reproductive histology and physiology, plus an Exam 1 refresher for the 5 old questions (L16 is the last lecture on Exam 2: Dr. Taylor's Lecture A, L17 and L18 aren't on it). The exam is Fri Nov 13, 10:00-11:30 am (50 questions: 8 on L11, 9 on L12, 7 each on L13-L16, 5 on Exam 1). Its own home page with your countdown and progress, notes in two reading levels with narration, animated diagrams, Patient Box lab-value cases, two-statement, true/false and numbered-statement questions with every choice explained, High Likelihood Exam Questions, exam hints from the recordings, review tables with side-by-side look-alikes, a 50-question mock and the Cycle Arcade.",
   "stateKey": "hee2-state-v1",
   "podcast": {
    "name": "Timmy Time",
    "sub": "The last-minute review, 52 min"
   }
  },
  {
   "id": "heme-endo-exam1",
   "cls": "hemeendo",
   "title": "Heme & Endo Exam 1 Hub",
   "code": "Heme & Endo · Exam 1",
   "exams": [
    {
     "name": "Hematology & Endocrinology Exam 1",
     "label": "Exam",
     "date": "2026-10-30",
     "code": "Heme & Endo · Exam 1",
     "checkinHour": 9,
     "promptHour": 9,
     "checkinClosed": true,
     "checkinUntil": {
      "date": "2026-11-06",
      "hour": 22
     }
    }
   ],
   "updated": "2026-10-27",
   "desc": "Lectures 1-10: endocrine histology, the hypothalamus and pituitary, growth, thyroid, the endocrine pancreas, the adrenal gland, corticosteroid and thyroid drugs, and calcium and phosphate. Its own home page with your countdown and progress by lecture, notes in two reading levels with narration, two-statement, true/false and numbered-statement questions, exam hints from the recordings, a 55-question mock and the Feedback Loop Arcade.",
   "stateKey": "endo1-state-v1",
   "archiveOn": {
    "date": "2026-11-03",
    "hour": 22
   },
   "hideCardOn": {
    "date": "2026-11-06",
    "hour": 22
   },
   "podcast": {
    "name": "Timmy Time",
    "sub": "The last-minute review, 53 min"
   }
  },
  {
   "id": "msk-exam4",
   "cls": "gi",
   "title": "Musculoskeletal Exam 4 Hub",
   "code": "GI & MSK · Exam 4",
   "exams": [
    {
     "name": "Musculoskeletal Exam 4",
     "label": "Exam",
     "date": "2026-10-16",
     "checkinClosed": true
    }
   ],
   "updated": "2026-10-08",
   "hideCardOn": "2026-10-21",
   "desc": "Skin histology, dermatological pharmacology, dermatopathology, skeletal muscle, and neuromuscular junction drugs. Notes in two reading levels, Patient Box and two-statement questions, exam hints from the recordings, a timed mock exam, review tables and the Skin Deep Arcade.",
   "stateKey": "msk4-state-v1",
   "podcast": {
    "name": "Timmy Time",
    "sub": "The last-minute review, 42 min"
   }
  },
  {
   "id": "pcd-exam3",
   "cls": "fixedpros",
   "title": "PCD Fixed Pros Exam 3 Hub",
   "code": "PCD Fixed Pros · Exam 3",
   "exams": [
    {
     "name": "PCD Fixed Pros didactic Exam 3",
     "label": "Exam",
     "date": "2026-10-15",
     "checkinHour": 20,
     "checkinClosed": true
    }
   ],
   "updated": "2026-10-08",
   "hideCardOn": "2026-10-21",
   "desc": "Cement and cementation, bonding dental ceramics, removing a crown, onlays, laminate veneers, color in fixed prosthodontics and James Bradley's glaze-and-contacts video. Notes in two reading levels, drawn diagrams, matching and Patient Box questions built on the Exam 3 hint list, exam hints from the recordings, a timed mock and the Bond Street Arcade.",
   "stateKey": "pcd3-state-v1"
  },
  {
   "id": "occlusion",
   "cls": "occlusion",
   "title": "Occlusion Final Hub",
   "code": "Occlusion · Final",
   "exams": [
    {
     "name": "Occlusion midterm",
     "label": "Midterm",
     "date": "2026-10-21",
     "code": "Occlusion · Midterm",
     "checkinHour": 19,
     "promptHour": 19,
     "checkinClosed": true,
     "extraQs": [
      {
       "id": "diagrams",
       "kind": "scale",
       "prompt": "How helpful were the hub's diagrams?",
       "ends": [
        "Not helpful",
        "Very helpful"
       ]
      },
      {
       "id": "pbox_img",
       "kind": "scale",
       "prompt": "How helpful were the Patient Box questions with pictures (charts, films, casts)?",
       "ends": [
        "Not helpful",
        "Very helpful"
       ]
      }
     ]
    },
    {
     "name": "Occlusion final",
     "label": "Final",
     "date": "2026-11-16",
     "code": "Occlusion · Final",
     "checkinHour": 20,
     "promptHour": 20,
     "askAgain": "2026-11-17"
    }
   ],
   "updated": "2026-11-12",
   "desc": "Now for the final (Mon Nov 16, 6:30-7:45 pm, not comprehensive): L6 Occlusal Instrumentation (articulators, the facebow and the CR, MIP and eccentric records), L7 Malocclusion and Dysfunction (TMD, splints, mobility, wear and bruxism), L8 Denture Occlusion (balanced, non-balanced and lingualized dentures; support, stability and retention), L9 Noncarious Cervical Lesions (Dr. Lawson: abrasion, abfraction and erosion; pH vs buffering capacity) and L10 Occlusion and the Periodontium (Dr. Abou-Arraj: occlusal trauma, mobility and when to adjust the occlusion). The midterm lectures stay for review: basic occlusion and the fence post, TMJ anatomy and the muscles, chewing, swallowing and speech, occlusal concepts, and applying occlusion. Notes in two reading levels, drawn diagrams, Patient Box questions, exam hints from the recordings, a timed mock and the Freeway Space Arcade.",
   "stateKey": "occl-state-v1",
   "podcast": {
    "name": "Timmy Time",
    "sub": "The final review, 48 min"
   }
  },
  {
   "id": "msk-exam3",
   "cls": "gi",
   "title": "Musculoskeletal Exam 3 Hub",
   "code": "GI & MSK · Exam 3",
   "exams": [
    {
     "name": "Musculoskeletal Exam 3",
     "label": "Exam",
     "date": "2026-10-02",
     "checkinClosed": true
    }
   ],
   "updated": "2026-09-23",
   "desc": "Nutrition, joints, cartilage and bone, bone development, autoimmune disease, hereditary bone disorders, bone drugs, and tumors. Grouped review tables for every drug, hormone, cell type and disease, a timed mock exam, and the Bone Zone Arcade of quick mini games.",
   "stateKey": "msk3-state-v1"
  },
  {
   "id": "perio",
   "cls": "perio",
   "title": "Periodontology D2 Compendium",
   "code": "Periodontology · Full unit",
   "exams": [
    {
     "name": "Periodontology midterm (S1-4)",
     "label": "Midterm",
     "date": "2026-10-01",
     "code": "Periodontology · Midterm",
     "promptHour": 10,
     "checkinClosed": true
    },
    {
     "name": "Periodontology final",
     "label": "Final",
     "date": "2026-11-19",
     "code": "Periodontology · Final",
     "promptHour": 13,
     "askAgain": "2026-11-19"
    }
   ],
   "archiveOn": {
    "date": "2026-11-19",
    "hour": 13
   },
   "updated": "2026-09-25",
   "desc": "Diagnosis and classification, incisions, flaps and sutures, risk assessment and prognosis, Phase I therapy and instrumentation, resective surgery and furcations, regeneration, implants, host modulation, and plastic surgery. Review tables, a timed mock exam and the Pocket Arcade.",
   "stateKey": "perio-d2-compendium-state-v1"
  }
 ],
 "archived": [
  {
   "id": "hepatobiliary",
   "cls": "gi",
   "title": "GI Exam 2 Hub",
   "code": "GI & MSK · Exam 2",
   "stateKey": "hbh-state-v1",
   "exams": [
    {
     "name": "GI Exam 2",
     "label": "Exam",
     "date": "2026-09-18",
     "checkinClosed": true
    }
   ],
   "hideCardOn": "2026-10-06"
  },
  {
   "id": "special-patient-care",
   "cls": "spc",
   "title": "Special Patient Care Hub",
   "code": "Special Patient Care",
   "stateKey": "spc-state-v1",
   "exams": [
    {
     "name": "Special Patient Care exam",
     "label": "Due",
     "date": "2026-11-13",
     "code": "Special Patient Care",
     "checkinClosed": true
    }
   ],
   "archiveOn": {
    "date": "2026-11-06",
    "hour": 0
   },
   "hideCardOn": {
    "date": "2026-11-06",
    "hour": 0
   }
  }
 ],
 "checkinHour": 8,
 "archiveHour": 22,
 "cardDays": 10,
 "debriefDays": 60,
 "surveyAgain": {
  "4": "2026-11-17"
 },
 "labels": {
  "genetics": "Genetics",
  "hepatobiliary": "Hepatobiliary",
  "fixed-pros": "Fixed Pros",
  "gi-exam1": "GI Exam 1",
  "perio": "Perio",
  "msk-exam3": "MSK Exam 3",
  "msk-exam4": "MSK Exam 4",
  "occlusion": "Occlusion",
  "pcd-exam3": "PCD Exam 3",
  "heme-endo-exam1": "Heme & Endo 1",
  "heme-endo-exam2": "Heme & Endo 2",
  "heme-endo-exam3": "Heme & Endo 3",
  "review-of-systems": "Review of Systems",
  "special-patient-care": "Special Patient Care",
  "pcd-implants-exam1": "PCD Implants 1"
 }
};
