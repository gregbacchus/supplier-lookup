import * as readline from 'readline';
import * as faker from 'faker';
import {Readable} from 'stream';

export interface Supplier {
  id: number;
  name: string;
}

/**
 * As the supplier file is CSV-link, but not actually CSV we will do a quick and dirty parsing
 */
export class SupplierParser {
  /**
   * Load from suppliernames file
   */
  static parseFile(input: Readable): Promise<Supplier[]> {
    return new Promise(function (resolve) {
      const reader = readline.createInterface({input});
      const lines: Supplier[] = [];
      reader.on('line', line => {
        const comma = line.indexOf(',');
        if (comma === -1) return;

        const id = line.slice(0, comma);
        if (!Number(id)) return;

        lines.push({id, name: line.slice(comma+1)});
      });
      reader.on('close', () => {
        resolve(lines);
      })
    });
  }

  /**
   * Generate random suppliers
   */
  static generate(count: number) {
    const lines: Supplier[] = [];
    for (let i = 0; i < count; i++) {
      lines.push({
        id: i,
        name: faker.company.companyName()
      });
    }
    return lines;
  }
}
