import * as fs from 'fs';
import {OcrParser} from './ocr';
import {Document} from './document';

const ocr = new OcrParser();

// read the sample file
const stream = fs.createReadStream('./inputs/invoice.txt');

// process the file
ocr.parseFile(stream)
  .then(words => ocr.phrasify(words))
  .then(phrases => Document.from(phrases))
  .then(document => document.getFieldByLine(1, 4, 5))
  .then(console.log)
  .catch(console.error);
