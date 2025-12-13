import { parseDocxResume } from './lib/parsers/docx';
import * as fs from 'fs';
import * as path from 'path';

async function readDocx() {
  try {
    const filePath = String.raw`C:\Users\DavidKamau\Downloads\David Kaniaru Kamau_BURN_HOD_IT (1).docx`;

    console.log('Reading file:', filePath);

    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], path.basename(filePath), {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const result = await parseDocxResume(file);

    console.log('\n=== PARSED RESUME CONTENT ===\n');
    console.log(JSON.stringify(result, null, 2));

    // Also save to a file
    fs.writeFileSync(
      'parsed_optimized_resume.json',
      JSON.stringify(result, null, 2)
    );

    console.log('\n=== Content saved to: parsed_optimized_resume.json ===');
  } catch (error) {
    console.error('Error parsing DOCX:', error);
  }
}

readDocx();
