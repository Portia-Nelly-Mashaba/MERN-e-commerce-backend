const express = require('express');

const router = express.Router();

const Products = require('../models/productsModel');
const { default: Product } = require('../../MERN-Market-Place/src/components/Product');

// router.get('/getProducts', (req, res) => {
//     Product.find({})
//     .then(products => res.json(products))
//     .catch(err => res.json(err)) 
// });

router.get('/getProducts', (req, res) => {
    Product.find({})
        .then(docs => res.json({ data: docs }))
        .catch(err => res.status(400).json({ message: 'Something went wrong', error: err }));
});

module.exports= router