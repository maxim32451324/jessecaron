/**
 * The photograph that stands for each training page — used as the page's own hero
 * and as its card on the training index.
 *
 * It lives here rather than in either route because both routes need the same map,
 * and the two copies they used to keep had already started to matter: adding a page
 * meant remembering to add it twice, and a card with no image renders as a black
 * rectangle rather than as an error anyone would notice.
 *
 * Basenames only — `localImg()` resolves them through `lib/image-manifest.json`, and
 * `scripts/check-images.mjs` fails the build if one of them is not on disk.
 */
export const TRAINING_HERO: Record<string, string> = {
  "personal-training": "Reactiesnelheid-Trainen-Stroboscoop-Bril.jpg",
  "functionele-snelheid-trainen": "Sprintsnelheid-Voetbal.jpg",
  "functionele-kracht-trainen": "Functionele-Kracht-Training-Voetbal.jpg",
  loopscholing: "Functionele-Looptraining-voor-Voetbal.jpg",
  groepstrainingen: "Groepstraining-Team-Jesse-Caron.jpg",
  "zomerstop-training": "Startsnelheid-Trainen-Voetbal-1.jpg",
  snelheidsmetingen: "Handelingssnelheid-Trainen-Voetbal-Smartgoals-Oefeningen.jpg",
  sportmassage: "Sportmassage-Groeipijnen-Stephany-Suykerbuyk.jpg",
  oefeningen: "Reactietraining-Hand-Oog-Coordinatie-Oefeningen.jpg",
  // The two pages harvested in Phase 1 keep the images their own old pages led with:
  // the "snelheid meten" illustration (already on black, so it survives the hero's
  // darkening) and the FlickmyHouse kit hand-over at the schoolsport training.
  data: "Jesse-Caron-Snelheid-Meten-Voetbal-Bewegingswetenschapper-Illustratie.jpg",
  "schoolsport-vereniging":
    "Jesse-Caron-Schoolsport-Vereniging-Rotterdam-Atletiek-Sponsor-e1483972103718.jpg",
};
