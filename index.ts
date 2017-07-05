import * as _ from 'underscore';
import * as fs from 'fs';
import {OcrParser} from './ocr';
import {Document} from './document';
import {SupplierParser} from './suppliers';

const ocr = new OcrParser();

// read the sample file
const invoiceStream = fs.createReadStream('./inputs/invoice.txt');
const supplierStream = fs.createReadStream('./inputs/suppliernames.txt');

async function processFiles() {
  let start = Date.now();
  const words = await ocr.parseFile(invoiceStream);
  console.log(`Words loaded: ${words.length}, ${Date.now() - start}ms`);

  start = Date.now();
  const phrases = ocr.phrasify(words);
  console.log(`Phrases computed: ${phrases.length}, ${Date.now() - start}ms`);

  start = Date.now();
  const document = Document.from(phrases);
  const supplierName1 = document.getFieldByLine(1, 4, 5);
  console.log(`Supplier name by position: ${supplierName1}, ${Date.now() - start}ms`);

  start = Date.now();
  const suppliers = await SupplierParser.parseFile(supplierStream);
  // const suppliers = SupplierParser.generate(100000);
  console.log(`Suppliers loaded: ${suppliers.length}, ${Date.now() - start}ms`);

  start = Date.now();
  const map = _.indexBy(suppliers, supplier => supplier.name.toLowerCase());
  const supplierName2 = document.getField(1, 0, 0, candidate =>
    map.hasOwnProperty(candidate.words.join(' ').toLowerCase())
  );
  console.log(`Validated supplier name: ${supplierName2}, ${Date.now() - start}ms`);
}

processFiles().catch(console.error);
