const connectDatabase = require("./models/Connect");
const scrape = require("./scrapeCS")
const Coupon = require("./models/CouponSchema");
const mongoose  = require('mongoose')

async function insertdata(element){
    //const model = new mongoose.model(element.category,CouponSchema);
    const data= await Coupon.create(element)
    return data

}

async function StartExecution(){
    try{
        const result = await connectDatabase()
        if(!result){
            return
        }
        const data = await scrape();
        //const response  = await Coupon.insertMany(data)
        data.forEach(async(element) => {

            const response  = await insertdata(element)
            console.dir(response)
           
            
        });
        //console.log(response)

    }catch(err){
        console.log(err);
    }
}

StartExecution()
