const fs = require("fs");
const { getRequestObjectHeaders } = require("./header.js");
const { getHTMLDoc } = require("./homePage.js");
const { getDetailsOfAllCourses, getDetailsOfEachCourse } = require("./courseDetails.js");
const { getURLAndDaysLeft } = require("./url.js");

async  function scrape() {
  const header = await getRequestObjectHeaders();
  const doc = await getHTMLDoc("https://couponscorpion.com", header);//Consists of actual html document.
  const threeDetails = await getDetailsOfAllCourses(await doc);
  const courses = await getDetailsOfEachCourse(threeDetails, header);
  const fiveDetails = await getURLAndDaysLeft(await courses, header);
  /*fs.writeFile('./courses.json', JSON.stringify(await fiveDetails), (err)=> {
    if(err)
      console.log("Error is:", err);
    else
      console.log("JSON Response is written successfully into a JSON file :)");
  });
  console.table(await fiveDetails);*/
  const data = await fiveDetails
  console.log(data)
  return data
}

module.exports=scrape