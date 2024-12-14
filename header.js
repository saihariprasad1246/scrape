const env = require("dotenv");
const fs = require("fs");
const Math = require("mathjs");
const axios = require("axios");

//env.config();//Now the API key is accessible.

async function getRequestObjectHeaders() {
 try {
  /*const scrapeOps = {
    method: 'GET',
    url: `http://headers.scrapeops.io/v1/browser-headers?api_key=${process.env.scrapeOpsAPIKey}`,
  };
  const sopsResult = await axios(scrapeOps);//Returns all headers in one JSON object as an array of key 'result'.
  const headers = await sopsResult['data']['result'];
  for(const header of headers) {
    if(!header["sec-ch-ua"])
      header["sec-ch-ua"] = '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"';
    if(!header["sec-fetch-site"])
      header["sec-fetch-site"] = "same-site";
    if(!header["sec-fetch-mode"])
      header["sec-fetch-mode"] = "navigate";
    if(!header["sec-fetch-dest"])
      header["sec-fetch-dest"] = "document";
    if(!header["sec-fetch-user"])
      header["sec-fetch-user"] = "?1";
    header["accept-language"] = "en-US";
  }//By having headers like these, Udemy's server willnot redirect the request to Cloudfare's interstitial waiting room.
  fs.writeFileSync('./headers.json', JSON.stringify(await headers), {encoding: "utf-8"});*///Uncomment this only when new headers are availble in ScrapeOps.io website.
  const data = fs.readFileSync('./headers.json', {encoding: "utf-8"});
  const headersArray = JSON.parse(data); 
  const randomHeader = headersArray[Math.floor(Math.random() * headersArray.length)];
  return randomHeader;
 }
 catch(err) {
  console.log(err.message);
 }
}

module.exports = { getRequestObjectHeaders };