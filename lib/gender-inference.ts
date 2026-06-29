/**
 * Lichtgewicht Nederlandse naam naar geslacht inferentie.
 * Geen externe dependencies.
 */

type GenderResult = "man" | "vrouw" | "onbekend";

const MANNENNAMEN = new Set([
  "adam","alexander","arjan","arjen","bas","bram","cas","chris","daan",
  "david","dennis","dirk","elias","erik","finn","floris","frank","gijs",
  "hans","henk","hidde","hugo","huub","jaap","jan","jasper","jeroen",
  "job","joep","joost","joris","kevin","klaas","koen","lars","lenn",
  "leon","luc","lukas","luuk","maarten","marc","mark","martijn","max",
  "michiel","milan","noud","niels","noah","piet","pim","ralph","remco",
  "rik","rob","robin","ruben","sander","sebastiaan","simon","sjors",
  "stef","sven","thomas","thijs","tijs","tim","tom","victor","vincent",
  "willem","wout","yannick","ahmed","ali","bilal","hamza","ibrahim",
  "ismail","khalid","mehmet","mohammed","mohammad","omar","rachid",
  "rayan","samir","tariq","walid","youssef","yusuf","zakaria",
  "aaron","ben","brian","daniel","edward","george","henry","jack","james",
  "jason","john","jonathan","joseph","joshua","liam","matthew","michael",
  "nathan","nicholas","patrick","peter","richard","robert","ryan",
  "samuel","scott","sean","steven","william",
]);

const VROUWENNAMEN = new Set([
  "amber","amira","anouk","bianca","britt","charlotte","elena","elke",
  "emma","esther","eva","femke","fien","fleur","floor","hannah","hilde",
  "ilse","inge","iris","jolien","julia","katrien","laura","lies","lieske",
  "lieke","linda","lisa","lotte","manon","maud","merel","monique",
  "nathalie","nina","noor","roos","rosa","sarah","silke","sofie","sonja",
  "stephanie","vera","wendy","yasmin","aisha","amina","fatima","hafsa",
  "khadija","laila","leila","maryam","nadia","nour","samira","sanaa",
  "soumaya","yasmina","yasmine","zineb","alice","anna","caroline",
  "claire","emily","jennifer","jessica","kate","katherine","marie",
  "mary","michelle","nicole","olivia","rachel","rebecca","sandra",
  "sophie","victoria",
]);

export function inferGender(fullName: string): {
  geslacht: GenderResult;
  basis: "naam-inferentie" | "onbekend";
} {
  if (!fullName?.trim()) return { geslacht: "onbekend", basis: "onbekend" };
  const firstName = fullName.trim().split(/\s+/)[0].toLowerCase();
  if (MANNENNAMEN.has(firstName)) return { geslacht: "man", basis: "naam-inferentie" };
  if (VROUWENNAMEN.has(firstName)) return { geslacht: "vrouw", basis: "naam-inferentie" };
  if (firstName.endsWith("je") || firstName.endsWith("ien") ||
      firstName.endsWith("ine") || firstName.endsWith("ette")) {
    return { geslacht: "vrouw", basis: "naam-inferentie" };
  }
  return { geslacht: "onbekend", basis: "onbekend" };
}
