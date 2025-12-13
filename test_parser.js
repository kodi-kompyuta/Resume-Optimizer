const fs = require('fs');
const { parseDOCX } = require('./lib/parsers/docx.ts');

async function test() {
  const buffer = fs.readFileSync('C:\\Users\\DavidKamau\\Downloads\\David Kaniaru Kamau 2412.docx');
  const text = await parseDOCX(buffer);

  console.log('=== PARSED TEXT ===');
  console.log(text);
  console.log('\n=== FIRST 1000 CHARS ===');
  console.log(text.substring(0, 1000));

  // Save to file
  fs.writeFileSync('parsed_resume.txt', text);
  console.log('\n✓ Saved to parsed_resume.txt');
}

test().catch(console.error);
