import express from "express";
import createSignature from "./utility/Hashing.js";
import handleEsewaSuccess from "./middleware/handleEsewaSuccess.js";
import connectDatabase from "./connectDatabase.js";
import Product from "./Product.js";

const app = express();

import cors from "cors";
import bodyParser from "body-parser";
import moment from "moment/moment.js";
import { config } from "dotenv";
config({ path: "./config/config.env" });

connectDatabase();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.get("/", (req, res) => {
  res.send("Connected to server of khaijushop");
});
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
// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments();

    res.json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      count: products.length,
      total: total,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message
    });
  }
});

// Get single product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message
    });
  }
});
// app.get("/api/esewa/success", handleEsewaSuccess, (req, res) => {
//   res.send("success");
// });

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}`);
});
