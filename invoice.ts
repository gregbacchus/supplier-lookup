import {Readable} from 'stream';
import {OcrParser, OcrPhrase} from './ocr';

export interface InvoiceTemplate {
  getSupplierName(phrases: OcrPhrase[]): Promise<string | null>;
}

export class InvoiceProcessor {
  constructor(readonly ocr: OcrParser) {
  }

  async processInvoice(stream: Readable, template: InvoiceTemplate) {
    let start = Date.now();
    const words = await this.ocr.parseFile(stream);
    console.log(`Words loaded: ${words.length}, ${Date.now() - start}ms`);

    start = Date.now();
    const phrases = this.ocr.phrasify(words);
    console.log(`Phrases computed: ${phrases.length}, ${Date.now() - start}ms`);

    start = Date.now();
    const supplierName = await template.getSupplierName(phrases);
    console.log(`Supplier name: ${supplierName}, ${Date.now() - start}ms`);
  }
}
