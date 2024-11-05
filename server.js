const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const productsModel = require('./models/productsModel');

app.get('/', (req, res) => {
    res.send('this is from backend');
});

mongoose.connect('mongodb+srv://pnpnelly:PfdxkAYMl9G3flOn@backend.gdsq2.mongodb.net/?retryWrites=true&w=majority&appName=backend')
.then(() => {
    console.log('Connected to database!');
    app.listen(5000, () => {
        console.log('Server is running on port 5000')
    })
})
.catch(() =>{
    console.log('Connection failed!');
    
})

//Products API
app.get('/getproducts', (req, res) => {
    productsModel.find({})
        .then(docs => res.send(docs ))
        .catch(err => res.status(400).json({ message: 'Something went wrong', error: err }));
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
app.get('/getproductbyid/:id', (req, res) => {
    const id = req.params.id;
    
    productsModel.findById(id)  // Pass `id` directly to findById
        .then((user) => {
            if (user) {
                res.json(user);  // Send found user document
            } else {
                res.status(404).json({ message: "Product not found" });
            }
        })
        .catch((err) => {
            console.error("Error finding product:", err);
            res.status(500).json({ message: "Something went wrong", error: err });
        });
});
    



