/*const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");

async function getURLAndDaysLeft(threeDetails, headers){
    await puppeteer.use(stealthPlugin());
    const browser = await puppeteer.launch({ headless: false });
    const idPattern = /https:\/\/www\.udemy\.com\/api-\d+\.\d+\/courses\/(\d+)\/\?fields\[course\]=[a-zA-Z0-9_,]+$/;
    headers["origin"] = "https://www.udemy.com";
    delete headers["upgrade-insecure-requests"];//This header is against CORS policy so the server has rejected the scrapper's connection.
    headers["accept-encoding"] = "gzip, deflate, br, zstd";
    headers["accept"] = "text/html, text/css, application/javascript, application/json, text/plain; charset=utf-8, ";
    for(const obj of threeDetails) {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({...headers});
    try {
      console.log("For URL: ", obj["href"]);
      await page.setRequestInterception(true);
      const rejectRequestPattern = ["googlesyndication.com", "/*.doubleclick.net", "/*.amazon-adsystem.com", "/*.adnxs.com"];
      page.on("request", (request) => {
       if (rejectRequestPattern.find((pattern) => request.url().match(pattern))) {
         request.abort();
       } else {
         request.continue();
         }
      });
      await page.goto(obj["href"], {timeout:60000, waitUntil: ["networkidle0", "domcontentloaded"]});
      await page.waitForSelector("div.rh-outer-wrap > div.rh-container > div.rh-content-wrap.clearfix > div.main-side.rh-post-wrapper.single.clearfix > article > div.disablemobileborder.single_top_postproduct.pt20.pb20.border-top.border-grey-bottom.mb30.flowhidden.clearfix > div.right_st_postproduct.floatright.mobileblockdisplay > div > span.rh_button_wrapper > a", {timeout: 60000});
      await page.evaluate(async () => {
        document.querySelector("a[class='btn_offer_block re_track_btn']").setAttribute("target", "_self");
        document.querySelector("a[class='btn_offer_block re_track_btn']").scrollIntoView({behavior: 'smooth', block: 'end', inline: 'end'});
        while(document.querySelector("a[class='btn_offer_block re_track_btn']").getAttribute("href") == "javascript:void(0)") {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      });
      page.on("request", async (req) => {
        if(await req.url().match(idPattern)) {
          console.log("Request URL having course id is: ", await req.url());
          const matches = await req.url().match(idPattern);
          obj["courseId"] = matches[1];
          console.log("course id: ", obj["courseId"]);
          return;
        }
      });
      await page.locator("div.rh-outer-wrap > div.rh-container > div.rh-content-wrap.clearfix > div.main-side.rh-post-wrapper.single.clearfix > article > div.disablemobileborder.single_top_postproduct.pt20.pb20.border-top.border-grey-bottom.mb30.flowhidden.clearfix > div.right_st_postproduct.floatright.mobileblockdisplay > div > span.rh_button_wrapper > a", {visible : true}).click();
      await page.waitForNavigation();
      if(await page.url() == "https://www.udemy.com/"){
        console.log("cs course is not mapped with it's respective udemy course :(");
        await page.close();
      } else {
          obj["udemyLink"] = await page.url();
          obj["couponCode"] = await obj["udemyLink"].slice(await obj["udemyLink"].indexOf("couponCode=")+"couponCode=".length);
          console.log(await obj["udemyLink"]);
          console.log("cc :", await obj["couponCode"]);
          //throw new Error("Just for testing ;)");
          await page.locator("main div.buy-box--discount-expiration--mv7OV > div > span > b", {visible: true});
          await new Promise(resolve => setTimeout(resolve, 3000));//To complete all network requests to get required resources
          await page.waitForSelector("main div.buy-box--discount-expiration--mv7OV > div > span > b", {timeout: 5000});
          await page.evaluate( () => {
            document.querySelector("main div.buy-box--discount-expiration--mv7OV > div > span > b").scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
          });
          const timeLeft = await page.evaluate(() => {
            const element = document.querySelector("main div.buy-box--discount-expiration--mv7OV > div > span > b");
            return element ? element.innerHTML : 'FREE';
          });
          obj["expiresIn"] = await timeLeft;
          console.log("Expires In: ", await obj["expiresIn"]);
        }//else to get url and days iff cs course is mapped to it's respective udemy course.
    } catch(err) {
      if(await obj["courseId"] == undefined) {
        page.on("response", async (res) => {
          if(res.url().match(idPattern)) {
            console.log("Response status: ", res.status(), res.url());
            const matches = res.url().match(idPattern);
            obj["courseId"] = matches[1];
            console.log("From catch block, Course id is: ", obj["courseId"]);
            return;
          } else {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        });
      }
      await new Promise(resolve => setTimeout(resolve, 6000));//running through all those Network requests takes time.
      console.log("About to send API request with course id:", await obj["courseId"]);
      const clearPage = await browser.newPage();
      await clearPage.goto('about:blank');
      const client = await clearPage.target().createCDPSession();
      await client.send('Runtime.evaluate', {
        expression: `
          localStorage.clear();
          sessionStorage.clear();`
      });
      await client.send('Network.clearBrowserCookies');
      await client.send('Network.clearBrowserCache');
      await clearPage.close();
      const JSONPage = await browser.newPage();
      await JSONPage.setExtraHTTPHeaders({...headers});
      try {
        await JSONPage.goto(`https://www.udemy.com/api-2.0/course-landing-components/${await obj["courseId"]}/me/?couponCode=${obj["couponCode"]}&components=discount_expiration`, {waitUntil: 'networkidle0'});
        console.log("URL to get expiration time is:", await JSONPage.url());
        obj["expiresIn"] = await JSONPage.evaluate(() => {
          const preTag = document.querySelector("body pre").innerHTML;
          const date = JSON.parse(preTag);
          if(date["discount_expiration"]["data"]["is_enabled"] == true) {
            return date["discount_expiration"]["data"]["discount_deadline_text"];
          } else {
            return "FREE";
            }
        });
      } catch(err) {
        obj["expiresIn"] = "FREE";
      }
      console.log("expires after:", await obj["expiresIn"]);
      await JSONPage.close();
    } finally {
        if(obj["expiresIn"] == undefined) {
          obj["expiresIn"] = "FREE";
        }
        await page.close();
        const clearPage = await browser.newPage();
        await clearPage.goto('about:blank', { waitUntil: 'networkidle0' });
        const client = await clearPage.target().createCDPSession();
        await client.send('Runtime.evaluate', {
          expression: `
            localStorage.clear();
            sessionStorage.clear();`
          });
        await client.send('Network.clearBrowserCookies');
        await client.send('Network.clearBrowserCache');
        await clearPage.close();
  }
  }//For closed
  const fiveDetails = threeDetails.filter((obj) => obj.expiresIn != "FREE");
  await browser.close();
  return fiveDetails;
}

module.exports = { getURLAndDaysLeft };   */












const puppeteer = require("puppeteer-extra");
const stealthPlugin = require("puppeteer-extra-plugin-stealth");

async function clearData(browser) {
  const clearPage = await browser.newPage();
  await clearPage.goto('about:blank');
  const client = await clearPage.target().createCDPSession();
  await client.send('Runtime.evaluate', {
    expression: `
      localStorage.clear();
      sessionStorage.clear();`
  });
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
  await clearPage.close();
}

async function getURLAndDaysLeft(threeDetails, headers){
    await puppeteer.use(stealthPlugin());
    const browser = await puppeteer.launch({ headless: false });
    const idPattern = /https:\/\/www\.udemy\.com\/api-(\d+)\.(\d+)\/courses\/(\d+)\/\?fields\[course\]=[a-zA-Z0-9_,]+$/;
    const filePattern = /https:\/\/www\.udemy\.com\/api-(\d+)\.(\d+)\/course-landing-components\/(\d+)\/me\/\?couponCode=[A-Z0-9]+&components=[a-z_]+$/;
    headers["origin"] = "https://www.udemy.com";
    delete headers["upgrade-insecure-requests"];//This header is against CORS policy so the server has rejected the scrapper's connection.
    headers["accept-encoding"] = "gzip, deflate, br, zstd";
    headers["accept"] = "text/html, text/css, application/javascript, application/json, text/plain; charset=utf-8, */*";
    for(const obj of threeDetails) {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({...headers});
    try {
      console.log("For URL: ", obj["href"]);
      await page.setRequestInterception(true);
      const rejectRequestPattern = ["googlesyndication.com", "/*.doubleclick.net", "/*.amazon-adsystem.com", "/*.adnxs.com"];
      page.on("request", (request) => {
       if (rejectRequestPattern.find((pattern) => request.url().match(pattern))) {
         request.abort();
       } else {
         request.continue();
         }
      });
      await page.goto(obj["href"], {waitUntil: ["networkidle0", "domcontentloaded"]});
      await page.waitForSelector("div.rh-outer-wrap > div.rh-container > div.rh-content-wrap.clearfix > div.main-side.rh-post-wrapper.single.clearfix > article > div.disablemobileborder.single_top_postproduct.pt20.pb20.border-top.border-grey-bottom.mb30.flowhidden.clearfix > div.right_st_postproduct.floatright.mobileblockdisplay > div > span.rh_button_wrapper > a", {timeout: 60000});
      await page.evaluate(async () => {
        document.querySelector("a[class='btn_offer_block re_track_btn']").setAttribute("target", "_self");
        document.querySelector("a[class='btn_offer_block re_track_btn']").scrollIntoView({behavior: 'smooth', block: 'end', inline: 'end'});
        while(document.querySelector("a[class='btn_offer_block re_track_btn']").getAttribute("href") == "javascript:void(0)") {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      });
      page.on("request", async (req) => {
        if(await req.url().match(idPattern)) {
          console.log("Request URL having course id is: ", await req.url());
          const matches = await req.url().match(idPattern);
          obj["api-major-version"] = matches[1];
          obj["api-minor-version"] = matches[2];
          obj["courseId"] = matches[3];
          console.log("course id: ", await obj["courseId"]);
        } else if(await req.url().match(filePattern) && !obj["json-file's-url"]) {//Since there are many URLs with the same pattern and if this object exists, then there is no need to exec this else if block again.
          obj["json-file's-url"] = await req.url().match(filePattern)[0];//Gives the entire url.
          obj["json-file's-url"] = obj["json-file's-url"].slice(0, obj["json-file's-url"].indexOf("&components=")+"&components=".length) + "discount_expiration";
          console.log("JSON file's url is: ", await obj["json-file's-url"]);
        } 
      });
      await page.locator("div.rh-outer-wrap > div.rh-container > div.rh-content-wrap.clearfix > div.main-side.rh-post-wrapper.single.clearfix > article > div.disablemobileborder.single_top_postproduct.pt20.pb20.border-top.border-grey-bottom.mb30.flowhidden.clearfix > div.right_st_postproduct.floatright.mobileblockdisplay > div > span.rh_button_wrapper > a", {visible : true}).click();
      await page.waitForNavigation();
      if(await page.url() == "https://www.udemy.com/"){
        console.log("cs course is not mapped with it's respective udemy course :(");
        await page.close();
      } else {
          obj["udemyLink"] = await page.url();
          obj["couponCode"] = await obj["udemyLink"].slice(await obj["udemyLink"].indexOf("couponCode=")+"couponCode=".length);
          console.log("Udemy link is: ", await obj["udemyLink"]);
          console.log("cc :", await obj["couponCode"]);
          //throw new Error("Just for testing ;)");
          await page.locator("main div.buy-box--discount-expiration--mv7OV > div > span > b", {visible: true});
          await new Promise(resolve => setTimeout(resolve, 3000));//To complete all network requests to get required resources and to find those two URLs.
          await page.waitForSelector("main div.buy-box--discount-expiration--mv7OV > div > span > b", {timeout: 5000});
          await page.evaluate( () => {
            document.querySelector("main div.buy-box--discount-expiration--mv7OV > div > span > b").scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
          });
          const timeLeft = await page.evaluate(() => {
            const element = document.querySelector("main div.buy-box--discount-expiration--mv7OV > div > span > b");
            return element ? element.innerHTML : 'FREE';
          });
          obj["expiresIn"] = await timeLeft;
          console.log("Expires In: ", await obj["expiresIn"]);
        }//else to get url and days iff cs course is mapped to it's respective udemy course.
    } catch(err) {
      console.log("About to send API request with course id:", await obj["courseId"], "\nAPI's major version is:", obj["api-major-version"], "\nAPI's minor version is:", obj["api-minor-version"]);
      await clearData(await browser);
      const JSONPage = await browser.newPage();
      await JSONPage.setExtraHTTPHeaders({...headers});
      try {
        if(!obj["json-file's-url"]) {
          await JSONPage.goto(`https://www.udemy.com/api-${obj["api-major-version"]}.${obj["api-minor-version"]}/course-landing-components/${obj["courseId"]}/me/?couponCode=${obj["couponCode"]}&components=discount_expiration`, {waitUntil: 'networkidle0'});
        } else {
          await JSONPage.goto(obj["json-file's-url"], {waitUntil: "networkidle0"});
        }
        console.log("URL to get expiration time is:", await JSONPage.url());
        obj["expiresIn"] = await JSONPage.evaluate(() => {
          //const preTag = document.querySelector("body pre").innerHTML;
          const date = JSON.parse(document.querySelector("body pre").innerHTML);
          if(date["discount_expiration"]["data"]["is_enabled"] == true) {
            return date["discount_expiration"]["data"]["discount_deadline_text"];
          } else {
            return "FREE";
            }
        });
      } catch(err) {
        obj["expiresIn"] = "FREE";
      }
      console.log("expires after: ", await obj["expiresIn"]);
      await JSONPage.close();
    } finally {
        if(obj["expiresIn"] == undefined) {
          obj["expiresIn"] = "FREE";
        }
        if(page) {
          await page.close();
        }
        await clearData(await browser);
  }
  }//For closed
  const fiveDetails = threeDetails.filter((obj) => obj.expiresIn != "FREE");
  await browser.close();
  return fiveDetails;
}

module.exports = { getURLAndDaysLeft };