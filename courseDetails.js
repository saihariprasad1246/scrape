const cheerio = require("cheerio");
const axios = require("axios");

async function getDetailsOfAllCourses(page) {
  try {
    const $ = cheerio.load(String(page));
    //console.log(page);
    const threeDetails = [];
    $("div[class='rh-outer-wrap'] > div[class='rh-container def'] div[class='rh-post-wrapper'] > article[class='post mb0'] div[class='cs_notice'] > div[class='eq_grid pt5 rh-flex-eq-height col_wrap_three'] > article > div[class='meta_for_grid'] > div[class='cat_store_for_grid floatleft'] > div > span[class='cat_link_meta'] > a").each((i, cat) => {
      const category = cat.firstChild.data;
      //console.log("category: ", cat.firstChild);
      threeDetails.push({category});
    });//To get category of each course.
    $("div[class='rh-outer-wrap'] > div[class='rh-container def'] div[class='rh-post-wrapper'] > article[class='post mb0'] div[class='cs_notice'] > div[class='eq_grid pt5 rh-flex-eq-height col_wrap_three'] > article > div[class='info_in_dealgrid'] > figure > a > img").each((i, img) => {
      //console.log("image: ", img);
      threeDetails[i]["imgSrc"] = img.attribs["data-lazy-src"];
      threeDetails[i]["imgAlt"] = img.attribs["alt"];
    });
    $("div[class='rh-outer-wrap'] > div[class='rh-container def'] div[class='rh-post-wrapper'] > article[class='post mb0'] div[class='cs_notice'] > div[class='eq_grid pt5 rh-flex-eq-height col_wrap_three'] > article > div[class='info_in_dealgrid'] > figure > a").each((i, a) => {
      threeDetails[i]["href"] = a.attribs["href"];
      //console.log("a: ", a);
    });
    $("div[class='rh-outer-wrap'] > div[class='rh-container def'] div[class='rh-post-wrapper'] > article[class='post mb0'] div[class='cs_notice'] > div[class='eq_grid pt5 rh-flex-eq-height col_wrap_three'] > article > div[class='meta_for_grid'] > div[class='date_for_grid floatright'] > span[class='date_ago']").each((i, time) => {
      threeDetails[i]["uploadTime"] = time.lastChild.data.trim();
      //console.log("time: ", time);
    });
    $("div[class='rh-outer-wrap'] > div[class='rh-container def'] div[class='rh-post-wrapper'] > article[class='post mb0'] div[class='cs_notice'] > div[class='eq_grid pt5 rh-flex-eq-height col_wrap_three'] > article > div[class='info_in_dealgrid'] > figure > span").each((i, off) => {
      threeDetails[i]["type"] = off.lastChild.data;
      //console.log("off: ", off);
    });
    const details = threeDetails.filter((obj) => obj.imgSrc != undefined && obj.type !== "FREE");
    console.log("details: ", details, "No.of courses: ", details.length);
    return details;
    } catch(err) {
        console.log("Occured error while fetching details from home page is:", err.message);
    }
   };

async function getDetailsOfEachCourse(threeDetails, header){
  for(const obj of threeDetails) {
    try {
      const response = await axios({
        method: 'GET',
        headers: header,
        url: obj["href"]
      });
      const $ = cheerio.load(response['data']);
      obj["name"] = $("#title_single_area > div.rh-flex-grow1.single_top_main.mr20 > h1").text();
      obj["date"] = $("#title_single_area > div.rh-flex-grow1.single_top_main.mr20 > div.meta.post-meta > span").text();
      obj["description"] = $("div[class='rh-outer-wrap'] > div[class='rh-container'] > div[class='rh-content-wrap clearfix'] > div[class='main-side rh-post-wrapper single clearfix'] > article > p").text();
    } catch(err) {
      console.log("Occured error while fetching details for the course at URL:", obj["href"]);
      }
  }
  return threeDetails;
}

module.exports = { getDetailsOfAllCourses, getDetailsOfEachCourse };