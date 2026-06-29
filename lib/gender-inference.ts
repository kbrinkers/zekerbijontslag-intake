/**
 * Lichtgewicht Nederlandse naam → geslacht inferentie.
 *
 * Gebruikt de npm-package `gender-guesser` (Engelstalige heuristiek) met
 * een handmatige override-lijst voor veelvoorkomende Nederlandse en Arabische
 * namen die niet goed worden herkend.
 *
 * Installeer: npm install gender-guesser
 */

// @ts-expect-error — geen officiële typen voor gender-guesser
import genderGuesser from "gender-guesser";

type GenderResult = "man" | "vrouw" | "onbekend";

/** Namen die gender-guesser verkeerd of niet herkent */
const OVERRIDE_NL: Record<string, GenderResult> = {
  // Mannen
  daan: "man", bram: "man", thijs: "man", joep: "man", sven: "man",
  luuk: "man", niels: "man", ruben: "man", arjen: "man", bas: "man",
  cas: "man", finn: "man", floris: "man", gijs: "man", hidde: "man",
  huub: "man", jaap: "man", koos: "man", lenn: "man", maarten: "man",
  noud: "man", pim: "man", rik: "man", sjors: "man", tijs: "man",
  wout: "man", yannick: "man", stef: "man",
  // Islamitische mannennamen
  mohammed: "man", omar: "man", youssef: "man", tariq: "man",
  ibrahim: "man", bilal: "man", hamza: "man",
  // Vrouwen
  anouk: "vrouw", fien: "vrouw", lotte: "vrouw", roos: "vrouw",
  fleur: "vrouw", noor: "vrouw", lies: "vrouw", inge: "vrouw",
  maud: "vrouw", britt: "vrouw", merel: "vrouw", elke: "vrouw",
  femke: "vrouw", hilde: "vrouw", ilse: "vrouw", jolien: "vrouw",
  katrien: "vrouw", lieske: "vrouw", nathalie: "vrouw",
  // Islamitische vrouwennamen
  fatima: "vrouw", aisha: "vrouw", nadia: "vrouw", samira: "vrouw",
  leila: "vrouw", yasmine: "vrouw", amina: "vrouw", khadija: "vrouw",
};

/**
 * Leidt geslacht af uit een voornaam.
 * Geeft "onbekend" als er geen betrouwbare inferentie mogelijk is.
 */
export function inferGender(fullName: string): {
  geslacht: GenderResult;
  basis: "naam-inferentie" | "onbekend";
} {
  if (!fullName?.trim()) return { geslacht: "onbekend", basis: "onbekend" };

  const firstName = fullName.trim().split(/\s+/)[0].toLowerCase();

  // Eigen override-lijst eerst
  if (OVERRIDE_NL[firstName]) {
    return { geslacht: OVERRIDE_NL[firstName], basis: "naam-inferentie" };
  }

  // gender-guesser (internationale heuristiek)
  const raw: string = genderGuesser.guess(firstName) as string;

  if (raw === "male" || raw === "mostly_male") {
    return { geslacht: "man", basis: "naam-inferentie" };
  }
  if (raw === "female" || raw === "mostly_female") {
    return { geslacht: "vrouw", basis: "naam-inferentie" };
  }

  return { geslacht: "onbekend", basis: "onbekend" };
}
