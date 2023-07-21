// import * as fetch from "node-fetch";
// import * as cheerio from "cheerio";
// const fs = require("fs");
// const path = require("path");
// const urlParser = require("url");

// const seenUrls = {};
// const seenImg = {};
// //Put here page Url
// const pageUrl = "https://www.nivea.de/produkte/nur-bei-nivea/parfum";

// const getUrl = (link, host, protocol) => {
//   if (link.includes("http")) {
//     return link;
//   } else if (link.startsWith("/")) {
//     return `${protocol}//${host}${link}`;
//   } else {
//     return `${protocol}//${host}/${link}`;
//   }
// };

// const crawl = async ({ url, ignore }) => {
//   if (seenUrls[url]) return;
//   seenUrls[url] = true;

//   const response = await fetch(url);
//   const html = await response.text();
//   const $ = cheerio.load(html);
//   const links = $("a")
//     .map((i, link) => pageUrl + link.attribs.href)
//     .get();

//   console.log("crawling anchorLink", links);

//   const imageUrls = $("img")
//     .map((i, link) => link.attribs.src)
//     .get();
//   if (seenImg[url]) return;
//   seenImg[url] = true;
//   console.log("crawling imagesLink", { imageUrls });

//   // This function is to save pictures in a folder in project
//   // But doesn't work
//   // const { host, protocol } = urlParser.parse(url);
//   // imageUrls.forEach((imageUrl) => {
//   //   fetch(getUrl(imageUrl, host, protocol)).then((response) => {
//   //     const filename = path.basename(imageUrl);
//   //     const dest = fs.createWriteStream(`images/${filename}`);
//   //     response.body.pipe(dest);
//   //   });
//   // });

//   const saveImage = async (imageUrl, host, protocol) => {
//     try {
//       const response = await fetch(getUrl(imageUrl, host, protocol));
//       const filename = path.basename(imageUrl);
//       const dest = fs.createWriteStream(`images/${filename}`);
//       response.body.pipe(dest);
//       console.log(`Image ${filename} saved successfully.`);
//     } catch (error) {
//       console.error(`Error saving image ${imageUrl}:`, error.message);
//     }
//   };

//   links
//     .filter((link) => link.includes(host) && !link.includes(ignore))
//     .forEach((link) => {
//       crawl({
//         url: getUrl(link, host, protocol),
//         ignore,
//       });
//     });

//   imageUrls.forEach(async (imageUrl) => {
//     if (!seenImg[imageUrl]) {
//       seenImg[imageUrl] = true;
//       await saveImage(imageUrl, host, protocol);
//     }
//   });
// };

// const { host, protocol } = urlParser.parse(pageUrl);

// crawl({
//   url: pageUrl,
//   ignore: "/search",
// });
import fetch, { Response } from "node-fetch";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";
import urlParser from "url";

const seenUrls: { [url: string]: boolean } = {};
const seenImg: { [url: string]: boolean } = {};
// Put the page URL here
const pageUrl = "https://www.nivea.de";

const getUrl = (link: string, host: string, protocol: string) => {
  if (link.includes("http")) {
    return link;
  } else if (link.startsWith("/")) {
    return `${protocol}//${host}${link}`;
  } else {
    return `${protocol}//${host}/${link}`;
  }
};

const sanitizeFilename = (filename: string) => {
  // Get the image extension (jpg, jpeg, png, gif, ashx, etc.)
  const extensionMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? extensionMatch[1] : "";

  // Remove unwanted text and symbols after the image extension
  const sanitizedFilename = filename.replace(
    new RegExp(`\\.${extension}.*$`, "i"),
    `.${extension}`
  );

  // Replace any other non-alphanumeric characters with underscores
  return sanitizedFilename.replace(/[^a-zA-Z0-9-_.]/g, "_");
};

const saveImage = async (imageUrl: string, host: string, protocol: string) => {
  try {
    const response: Response = await fetch(getUrl(imageUrl, host, protocol));
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const filename = path.basename(imageUrl);
    const sanitizedFilename = sanitizeFilename(filename);
    const dest = fs.createWriteStream(path.join("images", sanitizedFilename));
    response.body.pipe(dest);

    await new Promise((resolve) => {
      dest.on("finish", resolve);
    });

    console.log(`Image ${sanitizedFilename} saved successfully.`);
  } catch (error: any) {
    console.error(`Error saving image ${imageUrl}:`, error.message);
  }
};

const crawl = async ({ url, ignore }: { url: string; ignore: string }) => {
  if (seenUrls[url]) return;
  seenUrls[url] = true;

  const { host, protocol } = urlParser.parse(url);
  const response: Response = await fetch(url);
  const html: string = await response.text();
  const $ = cheerio.load(html);
  const links = $("a")
    .map((i, link) =>
      getUrl($(link).attr("href") || "", host || "", protocol || "")
    )
    .get();

  console.log("crawling anchorLink", links);

  const imageUrls = $("img")
    .map((i, link) =>
      getUrl($(link).attr("src") || "", host || "", protocol || "")
    )
    .get();

  links
    .filter((link) => link.includes(host || "") && !link.includes(ignore))
    .forEach(async (link) => {
      await crawl({
        url: link,
        ignore,
      });
    });

  // The image saving part
  imageUrls.forEach(async (imageUrl) => {
    if (!seenImg[imageUrl]) {
      seenImg[imageUrl] = true;
      await saveImage(imageUrl, host || "", protocol || "");
    }
  });
};

const { host, protocol } = urlParser.parse(pageUrl);
crawl({
  url: pageUrl,
  ignore: "/search",
});
