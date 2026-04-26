import express from "express";
import mongoose from "mongoose";
import createSignature from "./utility/Hashing.js";
import handleEsewaSuccess from "./middleware/handleEsewaSuccess.js";
import connectDatabase from "./connectDatabase.js";
import Product from "./Product.js";
import Order from "./Order.js";

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
app.post("/api/createOrder", async (req, res) => {
  console.log(req.body);
  try {
    // Ensure amount is a properly formatted string with 2 decimals
    const safeAmount = Number(req.body.amount).toFixed(2);

    // Ensure transaction_uuid is highly unique to prevent 409 Conflict
    var currentTime = new Date();
    var timeFormatted = moment(currentTime).format("YYYYMMDDHHmmss") + "-" + Math.floor(Math.random() * 100000);

    const signature = createSignature(
      `total_amount=${safeAmount},transaction_uuid=${timeFormatted},product_code=EPAYTEST`
    );

    const order = new Order({
      transaction_uuid: timeFormatted,
      amount: safeAmount,
      products: req.body.products || []
    });
    await order.save();

    const backendUrl = `${req.protocol}://${req.get('host')}`;
    const formData = {
      amount: safeAmount,
      failure_url: "https://hamrooshop.netlify.app/payment-failed",
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: "EPAYTEST",
      signature: signature,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: `${backendUrl}/api/esewa/verify`,
      tax_amount: "0",
      total_amount: safeAmount,
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

// Admin endpoints for product management

// Create new product
app.post("/api/admin/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: savedProduct
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating product",
      error: error.message
    });
  }
});

// Update product by ID
app.put("/api/admin/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating product",
      error: error.message
    });
  }
});

// Delete product by ID
app.delete("/api/admin/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message
    });
  }
});

app.get("/api/esewa/verify", async (req, res) => {
  try {
    const { data } = req.query; // eSewa sends a base64 encoded 'data' query parameter

    // 1. Decode the base64 string from eSewa
    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));

    // 2. Check if the payment was actually completed
    if (decodedData.status === 'COMPLETE') {

      // 3. Find the pending order in your database using the transaction_uuid eSewa returns
      const order = await Order.findOne({ transaction_uuid: decodedData.transaction_uuid });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // 4. DECREASE THE STOCK IN THE DATABASE
      // Added a check so if refreshed, stock won't decrease twice
      if (order.status !== 'Completed') {
        for (const item of order.products) {
          if (item.product && item.quantity) {
            let query = {};
            if (mongoose.Types.ObjectId.isValid(item.product)) {
              query = { _id: item.product };
            } else {
              query = { id: Number(item.product) || item.product };
            }
            await Product.findOneAndUpdate(
              query,
              { $inc: { stock: -item.quantity } }
            );
          }
        }

        // 5. Mark the order as Paid/Completed
        order.paymentStatus = 'Paid';
        order.status = 'Completed';
        await order.save();
      }

      // 6. Redirect the user back to the frontend success page
      return res.redirect('https://hamrooshop.netlify.app/success');
    } else {
      return res.redirect('https://hamrooshop.netlify.app/payment-failed');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Verification Failed");
  }
});

app.listen(process.env.PORT, () => {
  console.log(`App listening on port ${process.env.PORT}`);
});
