const fs = require('fs');

function getPastDateString(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
// dont forget to add , for multiple conversion
const languages = [
//  { code: 'en', csv: './words-en.csv', out: './guessword-dict-english.js', name: 'englishDict' }
  { code: 'de', csv: './words-de.csv', out: './guessword-dict-german.js', name: 'germanDict' }
//  { code: 'fa', csv: './words-fa.csv', out: './guessword-dict-persian.js', name: 'persianDict' }
];

const permanentLaunchDate = "2026-08-01"; 

languages.forEach(lang => {
  if (!fs.existsSync(lang.csv)) {
    console.log(`Skipping ${lang.code}: CSV file not found.`);
    return;
  }

  const fileContent = fs.readFileSync(lang.csv, 'utf8');
  const words = fileContent
    .split(/\r?\n/)
    .map(line => {
      let trimmed = line.trim();
      if (lang.code === 'de') {
        return trimmed.replace(/ß/g, 'ẞ').toUpperCase();
      }
      return trimmed.toUpperCase();
    })
    .filter(line => line.length === 5 && !line.startsWith('#'));

  const jsContent = `export const ${lang.name} = {\n  startDate: "${permanentLaunchDate}",\n  answers: ${JSON.stringify(words, null, 2)},\n  validGuesses: ${JSON.stringify(words, null, 2)},\n};\n`;

  fs.writeFileSync(lang.out, jsContent, 'utf8');
  console.log(`Successfully updated ${lang.out} with ${words.length} words!`);
});