// Imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("./models/UserModel");

// Connect to express app
const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB and Express
mongoose
  .connect("mongodb://127.0.0.1:27017/aup-oos", {
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
    // .then((user) => {
    //   if (user) {
    //     if (user.pwd === pwd) {
    //       res.json("Login Success");
    //     } else {
    //       res.json("The password is incorrect");
    //     }
    //   } else {
    //     res.json("No record found");
    //   }
    // });
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

    // userModel
    //   .create(req.body)
    //   .then((user) => {
    //     res.json(user);
    //   })
    //   .catch((err) => res.json(err));
  } catch (error) {
    res.status(500).json({ error: "Failed to create user\n" + error });
  }
});
