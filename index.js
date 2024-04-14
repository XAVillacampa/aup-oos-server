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
const Refund = require("./models/RefundModel");
const Order = require("./models/OrderModel");

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
const verifyToken = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];
  // console.log("Extracted Token:", token, "\n");
  try {
    const decoded = jwt.verify(token, "secretkey");
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: No user found" });
    }
    req.user = user;
    // console.log("User Role: ", req.user.role);
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
        role: user.role,
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
    user.role = updatedUserData.role || user.role;
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
app.put("/update-cart-item/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { quantity } = req.body;
    const decoded = jwt.verify(
      req.header("Authorization").replace("Bearer ", ""),
      "secretkey"
    );

    const user = await User.findById(decoded._id);

    // Find the item in the user's cart
    const cartItem = user.cart.find((item) => String(item._id) === orderId);
    if (!cartItem) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    // Update the quantity of the item
    cartItem.quantity = quantity;
    await user.save();

    res.status(200).json({
      message: "Cart item quantity updated successfully",
      cart: user.cart,
    });
  } catch (error) {
    console.error("Error updating cart item quantity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
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
    // console.log(user.cart);
  } catch (error) {
    console.error("Error fetching user cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Cart

// Delete Cart
app.delete("/view-cart/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const decoded = jwt.verify(
      req.header("Authorization").replace("Bearer ", ""),
      "secretkey"
    );

    const user = await User.findById(decoded._id);

    // Remove the item from the user's cart
    user.cart = user.cart.filter((item) => String(item._id) !== orderId);
    await user.save();

    res.status(200).json({ message: "Item deleted from cart successfully" });
  } catch (error) {
    console.error("Error deleting item from cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Checkout Button update tempPrice
app.put("/update-temp-price", async (req, res) => {
  try {
    const { tempPrice } = req.body;
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "secretkey");
    const user = await User.findById(decoded._id); // Use _id instead of userId
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.tempPrice = tempPrice;
    await user.save();
    res.status(200).json({ message: "Temp price updated successfully" });
  } catch (error) {
    console.error("Error updating tempPrice:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//JUDE SPACE

app.put("/approve-refund/:id", async (req, res) => {
  try {
    const refundId = req.params.id;

    const refund = await Refund.findById(refundId);
    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    const order = await Order.findOne({
      transactionNumber: refund.transactionNumber,
    }).populate("itemsPurchased.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.itemsPurchased || order.itemsPurchased.length === 0) {
      throw new Error("No items found in the order to restore quantities");
    }

    await Promise.all(
      order.itemsPurchased.map(async (item) => {
        if (!item.product) {
          throw new Error(`Product ID ${item.product._id} not found in order`);
        }
        const product = await Product.findById(item.product._id);
        if (!product) {
          throw new Error(`Product not found with ID ${item.product._id}`);
        }
        product.totalQuantity += item.quantity;
        await product.save();
      })
    );

    refund.approval = "approved";
    await refund.save();

    res.status(200).json({
      message: "Refund request approved and product quantities updated",
      refund,
    });
  } catch (error) {
    console.error("Error approving refund and updating quantities:", error);
    res.status(500).json({
      error: "Failed to approve refund and update quantities",
      details: error.message,
    });
  }
});

// Update Product Quantities after Purchase
app.post("/decrement-product-quantities", async (req, res) => {
  try {
    const updates = req.body.itemsPurchased; // Expecting {productId, quantity} pairs

    await Promise.all(
      updates.map(async (update) => {
        const product = await Product.findById(update.product);
        if (!product) {
          throw new Error("Product not found");
        }
        product.totalQuantity -= update.quantity;
        if (product.totalQuantity < 0) {
          throw new Error("Insufficient stock");
        }
        await product.save();
      })
    );

    res
      .status(200)
      .json({ message: "Product quantities updated successfully" });
  } catch (error) {
    console.error("Error updating product quantities:", error);
    res.status(500).json({ error: "Failed to update product quantities" });
  }
});

app.get("/order-history", verifyToken, async (req, res) => {
  try {
    // Check if the logged-in user has the role to view all orders (e.g., admin or employee)
    if (!["admin", "employee"].includes(req.user.role)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const orders = await Order.find()
      .populate("userId")
      .populate("itemsPurchased.product");
    res.status(200).json(orders);
  } catch (error) {
    console.error("Failed to fetch order history:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

app.put("/reset-cart/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndUpdate(
      userId,
      { cart: [] },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Cart reset successfully", user });
  } catch (error) {
    console.error("Error resetting cart:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

//GET WEEKLY SALES

app.get("/weekly-sales", async (req, res) => {
  try {
    let currentDate = new Date();
    let startDate = new Date(currentDate);
    let endDate = new Date(currentDate);
    const currentDay = currentDate.getDay(); // Sunday - Saturday : 0 - 6

    // Adjust startDate to the previous Monday
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1; // If current day is Sunday, set diff to 6, otherwise currentDay - 1
    startDate.setDate(startDate.getDate() - diffToMonday);
    startDate.setHours(0, 0, 0, 0); // Set start of the day for startDate

    // Adjust endDate to the next Sunday
    const diffToSunday = currentDay === 0 ? 0 : 7 - currentDay; // If current day is Sunday, no adjustment needed
    endDate.setDate(endDate.getDate() + diffToSunday);
    endDate.setHours(23, 59, 59, 999); // Set end of the day for endDate

    const sales = await Order.aggregate([
      {
        $match: {
          status: "Complete",
          datePurchased: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    const totalSales = sales.length > 0 ? sales[0].totalSales : 0;
    console.log("Total Sales:", totalSales);

    res.status(200).json({ totalSales });
  } catch (error) {
    console.error("Error fetching weekly sales:", error);
    res.status(500).json({ error: "Failed to fetch weekly sales" });
  }
});

//Weekly Orders

app.get("/weekly-orders", async (req, res) => {
  try {
    let currentDate = new Date();
    let startDate = new Date(currentDate);
    let endDate = new Date(currentDate);
    const currentDay = currentDate.getDay(); // Sunday - Saturday : 0 - 6

    // Adjust startDate to the previous Monday
    const diffToMonday = currentDay === 0 ? 6 : currentDay - 1; // If current day is Sunday, set diff to 6, otherwise currentDay - 1
    startDate.setDate(startDate.getDate() - diffToMonday);
    startDate.setHours(0, 0, 0, 0); // Set start of the day for startDate

    // Adjust endDate to the next Sunday
    const diffToSunday = currentDay === 0 ? 0 : 7 - currentDay; // If current day is Sunday, no adjustment needed
    endDate.setDate(endDate.getDate() + diffToSunday);
    endDate.setHours(23, 59, 59, 999); // Set end of the day for endDate

    const orders = await Order.find({
      status: "Complete",
      datePurchased: { $gte: startDate, $lte: endDate },
    });

    const weeklyOrderCount = orders.length;
    console.log("Weekly Order Count:", weeklyOrderCount);

    res.status(200).json({ weeklyOrderCount });
  } catch (error) {
    console.error("Error fetching weekly orders:", error);
    res.status(500).json({ error: "Failed to fetch weekly orders" });
  }
});

// Payment Page
// View Payment

// History Page
//FOR ORDER HISTORY
app.post("/save-order-history", verifyToken, async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();
    res.status(201).json({ message: "Order history saved successfully" });
  } catch (error) {
    console.error("Error saving order history:", error);
    if (error.name === "ValidationError") {
      console.error("Validation errors:", error.errors); // Log the validation errors
      res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
    } else {
      res.status(500).json({ message: "Failed to save order history" });
    }
  }
});

// View Order History
app.get("/order-history/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!req.user._id.equals(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const orders = await Order.find({ userId: userId }).populate(
      "itemsPurchased.product"
    );
    res.status(200).json(orders);
  } catch (error) {
    console.error("Failed to fetch order history:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Update Order
app.put("/update-order/:orderId", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemsPurchased, status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { itemsPurchased, status },
      { new: true }
    ).populate("itemsPurchased.product");

    res
      .status(200)
      .json({ message: "Order updated successfully", updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// View Order History by Transaction Number
app.get(
  "/order-history-trn/:transactionNumber",
  verifyToken,
  async (req, res) => {
    try {
      const { transactionNumber } = req.params;
      const order = await Order.findOne({ transactionNumber }).populate(
        "itemsPurchased.product"
      );
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.status(200).json(order);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

// Refund Page
// Add Refund
app.post("/refund", async (req, res) => {
  try {
    const { transactionNumber, dateCancelled, reason, idNum } = req.body;
    // Save refund data to the database
    const refund = await Refund.create({
      transactionNumber,
      dateCancelled,
      reason,
      idNum,
    });
    res.status(201).json({ message: "Refund request submitted", refund });
  } catch (error) {
    console.error("Failed to submit refund:", error);
    res.status(500).json({ error: "Failed to submit refund" });
  }
});

// View Refund
app.get("/refund", async (req, res) => {
  try {
    // Fetch all refund documents from the database
    const refunds = await Refund.find({}).lean();
    for (let refund of refunds) {
      const order = await Order.findOne({
        transactionNumber: refund.transactionNumber,
      }).populate("itemsPurchased.product");
      if (order) {
        refund.itemsPurchased = order.itemsPurchased;
        refund.paymentMethod = order.paymentMethod;
      }
    }
    res
      .status(200)
      .json({ message: "Refund data retrieved successfully", refunds });
  } catch (error) {
    console.error("Error fetching refund data:", error);
    res.status(500).json({ error: "Failed to fetch refund data" });
  }
});

// Approve Refund
app.put("/approve-refund/:id", async (req, res) => {
  try {
    const refundId = req.params.id;

    // Update refund request status to "approved"
    const updatedRefund = await Refund.findByIdAndUpdate(
      refundId,
      { approval: "approved" },
      { new: true } // To get the updated refund request after the update operation
    );

    res.status(200).json({ message: "Refund request approved", updatedRefund });
  } catch (error) {
    console.error("Error approving refund:", error);
    res.status(500).json({ error: "Failed to approve refund" });
  }
});

// Decline Refund
app.put("/decline-refund/:id", async (req, res) => {
  try {
    const refundId = req.params.id;

    // Update refund request status to "declined"
    const updatedRefund = await Refund.findByIdAndUpdate(
      refundId,
      { approval: "declined" },
      { new: true } // To get the updated refund request after the update operation
    );

    res.status(200).json({ message: "Refund request declined", updatedRefund });
  } catch (error) {
    console.error("Error declining refund:", error);
    res.status(500).json({ error: "Failed to decline refund" });
  }
});
