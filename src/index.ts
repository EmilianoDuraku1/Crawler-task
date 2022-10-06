import * as fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as urlParser from "url";

const seenUrls = {};
const seenImg = {};

const getUrl = (link, host, protocol) => {
  if (link.includes("http")) {
    return link;
  } else if (link.startsWith("/")) {
    return `${protocol}//${host}${link}`;
    } else {
      return `${protocol}//${host}/${link}`;
  }
};

const crawl = async ({ url, ignore }) => {
  if (seenUrls[url]) return;
  seenUrls[url] = true;
  console.log("crawling Links", { url });

  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  const links = $("a")
    .map((i, link) => link.attribs.href)
    .get();
  const imageUrls = $("img")
    .map((i, link) => link.attribs.src)
    .get();
  if (seenImg[url]) return;
  seenImg[url] = true;
  console.log("crawling imagesLink", { imageUrls });

  // This function is to save pictures in a folder in project
  // But doesn't work.
  const { host, protocol } = urlParser.parse(url);
  imageUrls.forEach((imageUrl) => {
    fetch(getUrl(imageUrl, host, protocol)).then((response) => {
      const filename = path.basename(imageUrl);
      const dest = fs.createWriteStream(`images/${filename}`);
      response.body.pipe(dest);
    });
  });

  links
    .filter((link) => link.includes(host) && !link.includes(ignore))
    .forEach((link) => {
      crawl({
        url: getUrl(link, host, protocol),
        ignore,
      });
    });
};

crawl({
  url: "https://www.eucerin.nl/",
  ignore: "/search",
});
