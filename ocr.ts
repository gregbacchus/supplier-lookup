import * as _ from 'underscore';
import * as readline from 'readline';
import {Readable} from 'stream';
import looseJson = require('loose-json');

export interface ParserOptions {
  gapFactor: number;
}

const defaultOptions: ParserOptions = {gapFactor: 1};

/**
 * Single recognised word from OCR file
 */
export interface OcrWord {
  pos_id: number;
  cspan_id: number;
  rspan_id: number;
  right: number;
  word: string;
  line_id: number;
  top: number;
  height: number;
  width: number;
  left: number;
  page_id: number;
  word_id: number;
}

/**
 * Group of words
 */
export interface OcrPhrase {
  page: number;
  line: number;
  words: string[];
  top: number;
  left: number;
  right: number;
}

/**
 * As the input file is JSON-like, but non-JSON, we have to work a little bit of magic to parse it
 */
export class OcrParser {
  private options: ParserOptions;

  constructor(options?: ParserOptions) {
    this.options = _.defaults({}, options, defaultOptions);
  }

  /**
   * Parse JSON-like example file into objects
   */
  parseFile(input: Readable): Promise<OcrWord[]> {
    return new Promise(function (resolve) {
      const reader = readline.createInterface({input});
      const lines: OcrWord[] = [];
      reader.on('line', line => {
        lines.push(looseJson(line));
      });
      reader.on('close', () => {
        resolve(lines);
      })
    });
  }

  /**
   * Convert set of recognised words into phrases
   */
  phrasify(words: OcrWord[]): OcrPhrase[] {
    const pages = _.groupBy(words, word => word.page_id);

    let phrases: OcrPhrase[] = [];
    for (const pageId of OcrParser.sortedKeys(pages)) {
      phrases = phrases.concat(this.getPagePhrases(Number(pageId), pages[pageId]));
    }
    return phrases;
  }

  private static sortedKeys(dict: object): string[] {
    return Object.keys(dict).sort((a, b) => Number(a) - Number(b));
  }

  private getPagePhrases(page: number, pageWords: OcrWord[]): OcrPhrase[] {
    const lines = _.groupBy(pageWords, word => word.line_id);

    let phrases: OcrPhrase[] = [];
    for (const lineId of OcrParser.sortedKeys(lines)) {
      phrases = phrases.concat(this.getLinePhrases(page, Number(lineId), lines[lineId]));
    }
    return phrases;
  }

  private getLinePhrases(page: number, line: number, lineWords: OcrWord[]): OcrPhrase[] {
    lineWords.sort((a, b) => a.left - b.left);

    const phrases: OcrPhrase[] = [];
    let phrase: OcrPhrase | null = null;
    for (const word of lineWords) {
      const gap = word.height * this.options.gapFactor; // just something here, can probably be smarter

      // if the gap is too large between this and the last, end the phrase
      if (phrase && word.left - phrase.right > gap) {
        // output
        phrases.push(phrase);
        // reset
        phrase = null;
      }

      if (!phrase) {
        // start new phrase if necessary
        phrase = {
          page,
          line,
          words: [word.word],
          top: word.top,
          left: word.left,
          right: word.left + word.width
        };
      } else {
        // extend existing phrase
        phrase.words.push(word.word);
        phrase.right = word.left + word.width;
      }
    }
    // output the last phrase on the line
    if (phrase) {
      phrases.push(phrase);
    }
    return phrases;
  }
}
