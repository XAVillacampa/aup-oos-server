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
const User = require("./models/UserModel");
const Product = require("./models/ProductModel");

// Connect to express app
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB and Express
mongoose
  .connect(
    "mongodb+srv://aup-oss:aup123@aup-oss.o7zk4nq.mongodb.net/?retryWrites=true&w=majority&appName=aup-oss"
  )
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running with MongoDB");
    });
  })
  .catch((err) => {
    console.log("Unable to connect to server/MongoDB\n", err);
  });

// Middleware
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), "secretkey");
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({ error: "Unauthorized: Invalid token" });
  }
};

app.use("/add-to-cart", verifyToken);
app.use("/view-cart", verifyToken);

// Routes
// User Login
app.post("/login", async (req, res) => {
  try {
    const { idNum, pwd } = req.body;

    const user = await User.findOne({ idNum: idNum });
    if (!user) {
      return res.status(400).json({ error: "No record found" });
    }
    const isMatch = await bcrypt.compare(pwd, user.pwd);
    if (!isMatch) {
      return res.status(400).json({ error: "The password is incorrect" });
    }
    const token = jwt.sign(
      {
        _id: user._id,
        idNum: user.idNum,
        email: user.email,
        cart: user.cart,
      },
      "secretkey"
    );
    res
      .status(201)
      .json({ token: token, user: user, message: "Login Success" });
  } catch (error) {
    res.status(500).json({ error: "Failed to login user\n" + error });
  }
});

app.get("/user", async (req, res) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "secretkey");
    const user = await User.findById(decoded._id);
    res.status(200).json(user);
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
    console.log(error);
  }
});
// User Register
app.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, idNum, email, phoneNumber, pwd } = req.body;
    const hashedPwd = await bcrypt.hash(pwd, 10);
    const newUser = new User({
      firstName,
      lastName,
      idNum,
      email,
      phoneNumber,
      pwd: hashedPwd,
    });
    await newUser.save();
    res.status(201).json({ newUser, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create user\n" + error });
  }
});

//GET REGISTERED USERS
app.get("/register", async (req, res) => {
  try {
    const user = await User.find();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: "Unable to get users" });
  }
});

//Update User data
app.put("/update-user/:id", async (req, res) => {
  const userId = req.params.id;
  const updatedUserData = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user properties with the new data
    user.firstName = updatedUserData.firstName || user.firstName;
    user.lastName = updatedUserData.lastName || user.lastName;
    user.email = updatedUserData.email || user.email;
    user.phoneNumber = updatedUserData.phoneNumber || user.phoneNumber;
    user.pwd = updatedUserData.pwd
      ? await bcrypt.hash(updatedUserData.pwd, 10)
      : user.pwd;

    // Save the updated user data
    await user.save();

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/delete-user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user\n" + error });
  }
});

// Product Page
// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "public/product-images";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${path.basename(
      originalName,
      extension
    )}_${timestamp}${extension}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
});

app.use(
  "/product-images",
  express.static(path.join(__dirname, "public/product-images"))
);

// Add Product
app.post("/add-products", upload.single("image"), async (req, res) => {
  const { label, price, totalQuantity, category } = req.body;
  const photo = req.file.filename;

  try {
    const newProduct = new Product({
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
    console.error(error);
    res.status(500).json({ error: "Failed to create product\n" + error });
  }
});

// View Product
app.get("/get-products", async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ message: "success", products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to get products\n" + error });
  }
});

// app.get("/get-products/:productId", async (req, res) => {
//   try {
//     const productId = req.params.productId;
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ error: "Product not found" });
//     }

//     res.status(200).json({ message: "Success", product });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: "Failed to get product" });
//   }
// });

// Update Product
app.put("/update-product/:id", upload.single("image"), async (req, res) => {
  const productId = req.params.id;
  const { label, price, totalQuantity, category } = req.body;
  const photo = req.file ? req.file.filename : undefined;

  try {
    const updatedFields = {
      label,
      price,
      totalQuantity,
      category,
    };

    if (photo) {
      updatedFields.photo = photo;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedFields,
      { new: true } // To get the updated product after the update operation
    );

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete Product
app.delete("/delete-products", async (req, res) => {
  try {
    const { productIds } = req.body; // Get the product IDs from the request body

    // Delete multiple products based on the received IDs
    await Product.deleteMany({ _id: { $in: productIds } });

    res.status(200).json({ message: "Products deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete products\n" + error });
  }
});

// Cart Page
// Add to Cart
app.post("/add-to-cart", async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const decoded = jwt.verify(
      req.header("Authorization").replace("Bearer ", ""),
      "secretkey"
    );

    const user = await User.findById(decoded._id);

    // Check if product exists and has enough quantity
    const product = await Product.findById(productId);
    if (!product || product.totalQuantity < quantity) {
      return res
        .status(404)
        .json({ message: "Product not found or insufficient quantity" });
    }

    user.cart = user.cart || [];
    // Add product to user's cart
    const existingCartItem = user.cart.find(
      (item) => String(item.product) === productId
    );
    if (existingCartItem) {
      existingCartItem.quantity += quantity;
    } else {
      user.cart.push({ product: productId, quantity });
    }
    const cart = user.cart;
    await user.save();

    res
      .status(200)
      .json({ message: "Product added to cart successfully", cart });
    console.log(cart);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
    console.log(error);
  }
});

// View Cart
app.get("/view-cart", async (req, res) => {
  try {
    // Ensure req.user contains the correct user data with cart field
    const user = await User.findById(req.user._id).populate("cart.product");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res
      .status(200)
      .json({ cart: user.cart, message: "Cart viewed successfully" });
    console.log(user.cart);
  } catch (error) {
    console.error("Error fetching user cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Cart

// Delete Cart

// Payment Page
// View Payment

// History Page
// View History
