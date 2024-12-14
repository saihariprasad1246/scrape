const mongoose  = require("mongoose");

async function connectDatabase(){
    try{

        const connect  = await mongoose.connect("mongodb://localhost:27017/scarapeddata");
        return true

    }catch(err){
        console.log(err);
        return false
    }
}

module.exports = connectDatabase