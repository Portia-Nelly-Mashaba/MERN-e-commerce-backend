const express = require("express");
const {v4 : uuidv4} = require('uuid')
const mongoose = require("mongoose");
const cors = require("cors");


const app = express();
app.use(cors());
app.use(express.json());
const stripe = require('stripe')('sk_test_51Q7FFuLlrdPxaQ2hHK8avgVK1zUI94dMFdO4TKxU4rWjN0IMSRVVe9DNO3W7Y2puupztbrAhwgNA2XzJOu3lslxO00VanU0pZS')

const productsModel = require("./models/productsModel");
const userModel = require("./models/userModel");
const orderModel = require("./models/orderModel");

app.get("/", (req, res) => {
  res.send("this is from backend");
});

mongoose
  .connect(
    "mongodb+srv://pnpnelly:PfdxkAYMl9G3flOn@backend.gdsq2.mongodb.net/?retryWrites=true&w=majority&appName=backend"
  )
  .then(() => {
    console.log("Connected to database!");
    app.listen(5000, () => {
      console.log("Server is running on port 5000");
    });
  })
  .catch(() => {
    console.log("Connection failed!");
  });

//Products API
app.get("/getproducts", (req, res) => {
  productsModel
    .find({})
    .then((docs) => res.send(docs))
    .catch((err) =>
      res.status(400).json({ message: "Something went wrong", error: err })
    );
});


//Products API
app.post("/addproduct", async (req, res) => {
  try {
    const { product } = req.body;

    // Create a new product instance from productsModel
    const newProduct = new productsModel({
      name: product.name,
      price: product.price,
      description: product.description,
      countInStock: product.countInStock,
      image: product.image,
      category: product.category,
    });

    // Save the product and await the Promise
    await newProduct.save();
    res.send('Product added successfully');
  } catch (err) {
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});


// update
app.put("/editproduct/:id", async (req, res) => {
  try {
    const { product } = req.body;  

    
    const updatedProduct = await productsModel.findByIdAndUpdate(
      req.params.id,  
      {
        name: product.name,
        price: product.price,
        description: product.description,
        countInStock: product.countInStock,
        image: product.image,
        category: product.category,
      },
      { new: true } 
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (err) {
    res.status(400).json({ message: 'Something went wrong', error: err.message });
  }
});




app.delete('/deleteproduct/:id', (req, res) => {
  const id = req.params.id;
  productsModel.findByIdAndDelete(id)
      .then((doc) => res.json({ message: 'Product deleted successfully', doc }))
      .catch((err) => res.status(400).json({ message: 'Error deleting product', error: err }));
});


// app.post('/getproductbyid', (req, res) => {
//     const productId = req.body.productid;
//     productsModel.find({ _id: productId }, (err, docs) => {
//         if (!err) {
//             res.send(docs[0]);
//         } else {
//             console.error("Error finding product:", err); // Log the error
//             return res.status(400).json({ message: "Something went wrong", error: err });
//         }
//     });
// });
app.get("/getproductbyid/:id", (req, res) => {
  const id = req.params.id;

  productsModel
    .findById(id) // Pass `id` directly to findById
    .then((product) => {
      if (product) {
        res.json(product); // Send found user document
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    })
    .catch((err) => {
      console.error("Error finding product:", err);
      res.status(500).json({ message: "Something went wrong", error: err });
    });
});

// app.post('/register', (req, res) => {
//     userModel.create(req.body)
//         .then(user => res.json({ message: 'User Registration Success', user }))
//         .catch(err => res.status(500).json({ message: 'Something went wrong', error: err }));
// });

app.post("/register", (req, res) => {
  userModel
    .findOne({ email: req.body.email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      userModel
        .create(req.body)
        .then((user) =>
          res.json({ message: "User Registration Success", user })
        )
        .catch((err) =>
          res.status(500).json({ message: "Something went wrong", error: err })
        );
    })
    .catch((err) =>
      res.status(500).json({ message: "Database error", error: err })
    );
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
  
    userModel
      .findOne({ email })
      .then((user) => {
        if (!user) {
          return res.status(400).json({ message: "User not found" });
        }
  
        if (user.password !== password) {
          return res.status(400).json({ message: "Invalid credentials" });
        }
        const userData = {
            name: user.name,
            _id: user._id,
            email: user.email
          };
    
          res.json({ message: "Login successful", user: userData });
        })
        .catch((err) => res.status(500).json({ message: "Database error", error: err }));
    });

    //orders
  
    app.post('/placeorder', async (req, res) => {
        const { token, totalPrice, currentUser, cartItems } = req.body;
    
        try {
            // Create a customer in Stripe
            const customer = await stripe.customers.create({
                email: token.email,
                source: token.id,
            });
    
            // Create a charge
            const payment = await stripe.charges.create({
                amount: Math.round(totalPrice * 100), // Amount in cents
                currency: 'zar',
                customer: customer.id,
                receipt_email: token.email,
            }, {
                idempotencyKey: uuidv4()
            });
    
            // If payment was successful, proceed with order creation
            if (payment) {
                // Create order document
                const order = new orderModel({
                    userid: currentUser.user._id,
                    name: currentUser.user.name,
                    email: currentUser.user.email,
                    orderItems: cartItems,
                    shippingAddress: {
                        address: token.card.address_line1,
                        city: token.card.address_city,
                        country: token.card.address_country,
                        postalCode: token.card.address_zip,
                    },
                    orderAmount: totalPrice,
                    transactionId: payment.id, // `payment.source.id` may be undefined; use `payment.id`
                    status: 'order placed',
                });
    
                // Save order using async/await
                await order.save();
    
                // Send success response
                res.status(200).json({ message: 'Order Placed Successfully' });
            } else {
                res.status(400).json({ message: 'Payment Failed' });
            }
        } catch (err) {
            console.error("Stripe Payment Error:", err);
            res.status(500).json({ message: 'Payment processing error', error: err.message });
        }
    });

    app.get('/getordersbyuserid/:userid', async (req, res) => {
      const { userid } = req.params;
  
      try {
          const orders = await orderModel.find({ userid });
          res.status(200).json(orders);
      } catch (err) {
          console.error('Error fetching orders:', err);
          res.status(500).json({ message: 'Something went wrong' });
      }
  });

  
  
  app.get("/getorderbyid/:orderid", async (req, res) => {
    const { orderid } = req.params;  // Accessing orderid from the URL parameter

    try {
        const order = await orderModel.findById(orderid);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ message: 'Something went wrong' });
    }
});


  

    // app.get('/getordersbyuserid', (req, res) =>{
    //   const userid = req.body.userid

    //   orderModel.find({userid :userid}, (err, docs)=>{
    //     if(err){
    //       return res.status(400).json({ message: 'Something went wrong'})
    //     }
    //     else{
    //       res.send(docs);
    //     }
    //   })
    // })



