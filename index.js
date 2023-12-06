// Imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// Import models
const userModel = require("./models/UserModel");
const productModel = require("./models/ProductModel");

// Connect to express app
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB and Express
mongoose
  .connect("mongodb+srv://aup-oss:aup123@aup-oss.o7zk4nq.mongodb.net/", {
    useNewURLParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running with MongoDB");
    });
  })
  .catch((err) => {
    console.log("Unable to connect to server/MongoDB", err);
  });

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/products";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${file.fieldname}_${timestamp}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
});

// Routes
// User Login
app.post("/login", async (req, res) => {
  try {
    const { idNum, pwd } = req.body;

    const user = await userModel.findOne({ idNum: idNum });
    if (!user) {
      return res.status(400).json({ error: "No record found" });
    }
    const isMatch = await bcrypt.compare(pwd, user.pwd);
    if (!isMatch) {
      return res.status(400).json({ error: "The password is incorrect" });
    }
    const token = jwt.sign({ _id: user._id }, "secretkey", {
      expiresIn: "1h",
    });
    res
      .status(201)
      .json({ token: token, user: user, message: "Login Success" });
  } catch (error) {
    res.status(500).json({ error: "Failed to login user\n" + error });
  }
});
// User Register
app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, idNum, email, pwd } = req.body;
    const hashedPwd = await bcrypt.hash(pwd, 10);
    const newUser = new userModel({
      firstName,
      lastName,
      idNum,
      email,
      pwd: hashedPwd,
    });
    await newUser.save();
    res.status(201).json({ newUser, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user\n" + error });
  }
});

app.get("/register", async (req, res) => {
  try {
    const user = await userModel.find();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Unable to get users" });
  }
});

// Product Page
// Add Product
app.post("/products", upload.single("image"), async (req, res) => {
  console.log(req.body);
  const { label, price, totalQuantity, category } = req.body;
  const photo = req.file.filename;
  try {
    const newProduct = new productModel({
      photo: photo,
      label,
      price,
      totalQuantity,
      category,
    });
    await newProduct.save();
    res
      .status(201)
      .json({ newProduct, message: "Product created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to create product\n" + error });
  }
});

// View Product
app.get("/get-products", async (req, res) => {
  try {
    const products = await productModel.find({});
    res.status(200).json({ message: "success", products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to get products\n" + error });
  }
});

// Update Product


// Delete Product


// Cart Page
// Add to Cart


// View Cart


// Update Cart


// Delete Cart


// Payment Page
// View Payment


// History Page
// View History
