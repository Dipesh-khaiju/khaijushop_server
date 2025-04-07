import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
  },
  comment: String,
  date: {
    type: Date,
    default: Date.now,
  },
  reviewerName: String,
  reviewerEmail: String,
});

const dimensionsSchema = new mongoose.Schema({
  width: Number,
  height: Number,
  depth: Number,
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discountPercentage: Number,
  rating: Number,
  stock: Number,
  tags: [String],
  brand: {
    type: String,
    required: true,
  },
  weight: Number,
  dimensions: dimensionsSchema,
  warrantyInformation: String,
  shippingInformation: String,
  availabilityStatus: String,
  reviews: [reviewSchema],
  images: [String],
  thumbnail: {
    type: String,
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);
export default Product;
