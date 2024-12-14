const axios = require("axios");

async function getHTMLDoc(url, header) {
  try {
  console.log("Current Headers: ", header);
  header["accept-encoding"] = "gzip";
  const response = await axios({
    url: url,
    headers: header,
  });
  return await response['data'];//Returns actual html file.
  }// Try closed.
  catch(err) {
   console.log("Occured error while fetching home page is:", err.message);
  }//Catch closed.
}//Function to connect with server cs and then get html document closed.

module.exports = { getHTMLDoc };