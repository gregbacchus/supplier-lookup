import * as _ from 'underscore';
import * as fs from 'fs';
import {OcrParser, OcrPhrase} from './ocr';
import {Document} from './document';
import {Supplier, SupplierParser} from './suppliers';
import {InvoiceProcessor, InvoiceTemplate} from './invoice';

const ocr = new OcrParser();

class SimpleTemplate implements InvoiceTemplate {
  constructor() {
  }

  async getSupplierName(phrases: OcrPhrase[]): Promise<string | null> {
    const document = Document.from(phrases);
    // search page 1, line 4
    const supplier = document.getFieldByLine(1, 4, 5);
    if (supplier) {
      console.log(`Found at line: ${supplier.line}, left: ${supplier.left}`);
      return supplier.text();
    }
    return null;
  }
}

class VerifiedTemplate implements InvoiceTemplate {
  map: object;

  constructor(readonly suppliers: Supplier[]) {
    this.map = _.indexBy(suppliers, supplier => supplier.name.toLowerCase());
  }

  async getSupplierName(phrases: OcrPhrase[]): Promise<string | null> {
    const document = Document.from(phrases);
    // search near the top, left of page 1
    const supplier = document.getField(1, 0, 0, candidate =>
      this.map.hasOwnProperty(candidate.text().toLowerCase())
    );
    if (supplier) {
      console.log(`Found at line: ${supplier.line}, left: ${supplier.left}`);
      return supplier.text();
    }
    return null;
  }
}

async function main() {
  let start = Date.now();
  let suppliers = await SupplierParser.parseFile(fs.createReadStream('./inputs/suppliernames.txt'));
  console.log(`Suppliers loaded: ${suppliers.length}, ${Date.now() - start}ms`);

  const simpleTemplate = new SimpleTemplate();
  const verifiedTemplate = new VerifiedTemplate(suppliers);

  const processor = new InvoiceProcessor(ocr);

  console.log('# Simple method');
  await processor.processInvoice(fs.createReadStream('./inputs/invoice.txt'), simpleTemplate);

  console.log('# Verified supplier method');
  await processor.processInvoice(fs.createReadStream('./inputs/invoice.txt'), verifiedTemplate);

  console.log('. done');
}

main().catch(console.error);
