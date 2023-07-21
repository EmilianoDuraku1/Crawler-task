import * as cheerio from "cheerio";

declare module cheerio {
  interface Cheerio {
    attribs: { [key: string]: string };
  }
}
