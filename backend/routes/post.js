import express from 'express';
import { getAllProduct, updateProduct, deleteProduct, 
        createProduct, getProductByName, saleProduct, getSoldProduct, 
        expireProductController, getExpiredProductsController, getInventorySummaryController} from '../controller/productPost.js';
const router = express.Router();

router.get("/products/expired", getExpiredProductsController); // get expire product 

router.get("/products/inventory-summary", getInventorySummaryController ) // get overrall 
router.get('/products/name/:name', getProductByName); // get product by name
router.get("/products/sales", getSoldProduct); // d
router.post("/products/sale", saleProduct); // P_name, quantity 

router.get("/products", getAllProduct);

router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/products", createProduct);

router.post("/products/expire", expireProductController);


export default router;