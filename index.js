import express from "express"
import createSignature from "./utility/Hashing.js";
import handleEsewaSuccess from "./middleware/handleEsewaSuccess.js";
const app = express();


import cors from "cors"
import bodyParser from "body-parser";
import moment from "moment/moment.js";
import { config } from "dotenv";
config({path:"./config/config.env"});

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.get("/",(req,res)=>{
  res.send("Connected to server of khaijushop")

})
// Create order Here
app.post("/api/createOrder", (req, res) => {
  console.log(req.body);
  try {
    var currentTime = new Date();
        var timeFormatted = moment(currentTime).format("YYYYMMDDHHmmss");
        const signature = createSignature(
          `total_amount=${req.body.amount},transaction_uuid=${timeFormatted},product_code=EPAYTEST`
        );
    const formData = {
      amount: req.body.amount,
      failure_url: "https://khaijushop.netlify.app",
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: "EPAYTEST",
      signature: signature,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: "https://khaijushop.netlify.app/cart",
      tax_amount: "0",
      total_amount: req.body.amount,
      transaction_uuid: timeFormatted,
    };
    res.json({
      message: "Order Created Successfully",
      Product: req.body,
      formData,
    });
  } catch (error) {
    console.log(error);
    return res.json({ message: "Error Occured" });
  }
});

// app.get("/api/esewa/success", handleEsewaSuccess, (req, res) => {
//   res.send("success");
// });

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}`);
});