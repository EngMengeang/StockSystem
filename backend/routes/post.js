import express from 'express';
import { getAllProduct, updateProduct, deleteProduct, 
        createProduct, getProductByName, saleProduct, getSoldProduct, 
        expireProductController, getExpiredProductsController, getInventorySummaryController} from '../controller/productPost.js';
import {login} from "../controller/authController.js"
const router = express.Router();
router.post("/login", login);
// inventory
router.get("/products/inventory-summary", getInventorySummaryController ) // get overrall 

// sale
router.get("/products/sales", getSoldProduct); // d
router.post("/products/sale", saleProduct); // P_name, quantity 

// products
router.get("/products", getAllProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/products", createProduct);
router.get('/products/name/:name', getProductByName); // get product by name

router.post("/products/expire", expireProductController);
router.get("/products/expired", getExpiredProductsController); // get expire product 



export default router;