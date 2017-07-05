import * as _ from 'underscore';
import {OcrPhrase} from './ocr';

/**
 * Tool for extracting known fields from invoice
 */
export class Document {
  constructor(readonly phrases: OcrPhrase[]) {
  }

  static from(phrases: OcrPhrase[]): Document {
    return new Document(phrases);
  }

  static distance(phrase: OcrPhrase, top: number, left: number): number {
    return Math.sqrt((phrase.top - top) ^ 2 + (phrase.left - left) ^ 2);
  }

  /**
   * Get the nearest phrase if the line number is known
   */
  getFieldByLine(page: number, line: number, left: number): string | null {
    const phrasesOnLine = _.filter(this.phrases,
      phrase => phrase.page === page && phrase.line === line);

    if (!phrasesOnLine.length) return null;

    phrasesOnLine.sort((a, b) => Document.distance(a, a.top, left) - Document.distance(b, b.top, left));
    return phrasesOnLine[0].words.join(' ');
  }

  /**
   * Get the nearest phrase to given location
   */
  getField(page: number, top: number, left: number, validator?: (OcrPhrase) => boolean): string | null {
    const phrasesOnPage = _.filter(this.phrases,
      phrase => phrase.page === page);

    if (!phrasesOnPage.length) return null;

    phrasesOnPage.sort((a, b) => Document.distance(a, top, left) - Document.distance(b, top, left));
    if (!validator) return phrasesOnPage[0].words.join(' ');

    for (const candidate of phrasesOnPage) {
      if (validator(candidate)) return candidate.words.join(' ');
    }
    return null;
  }
}
