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
  const supplier1 = document.getFieldByLine(1, 4, 5);
  console.log(`Supplier by position: ${supplier1}, ${Date.now() - start}ms`);

  start = Date.now();
  let suppliers = await SupplierParser.parseFile(supplierStream);
  console.log(`Suppliers loaded: ${suppliers.length}, ${Date.now() - start}ms`);

  // start = Date.now();
  // const fakerSupplierCount = 100000;
  // suppliers = suppliers.concat(SupplierParser.generate(fakerSupplierCount));
  // console.log(`Added lots more fake suppliers: ${fakerSupplierCount}, ${Date.now() - start}ms`);

  start = Date.now();
  const map = _.indexBy(suppliers, supplier => supplier.name.toLowerCase());
  const supplier2 = document.getField(1, 0, 0, candidate =>
    map.hasOwnProperty(candidate.text().toLowerCase())
  );
  console.log(`Validated supplier: ${supplier2}, ${Date.now() - start}ms`);
}

processFiles().catch(console.error);
