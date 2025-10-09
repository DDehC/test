// src/utils/slug.js

// Turn a string (like a department name) into a URL-friendly "slug".
// Examples:
//   "Institutionen för matematik" → "institutionen-for-matematik"
//   "Handelshögskolan"            → "handelshogskolan"
//   "Språk, litteratur & kultur"  → "sprak-litteratur-kultur"
export function slugify(s) {
  return s
    .toLowerCase()                          // all lowercase
    .normalize("NFD")                       // split accented letters into base + accent
    .replace(/[\u0300-\u036f]/g, "")        // remove accents/diacritics
    .replace(/[åä]/g, "a").replace(/ö/g, "o") // special Swedish letters → a/o
    .replace(/\s+/g, "-")                   // spaces → dashes
    .replace(/[^\w-]/g, "");                // remove anything not letters/numbers/underscore/dash
}

// Do the reverse: turn a slug back into a readable string.
// Example:
//   "institutionen-for-matematik" → "institutionen for matematik"
export function unslugify(slug) {
  return slug.replace(/-/g, " ");           // dashes → spaces
}
