import express from 'express';
import { getAllProduct, getProductById, updateProduct, deleteProduct, 
        createProduct, getProductByName, saleProduct, getSoldProduct, 
        expireProductController, getExpiredProductsController, getInventorySummaryController} from '../controller/productPost.js';
const router = express.Router();

router.get("/products/expired", getExpiredProductsController);
router.get("/products/inventory-summary", getInventorySummaryController )
router.get('/products/name/:name', getProductByName);
router.get("/products/sales", getSoldProduct);
router.post("/products/sale", saleProduct);

router.get("/products", getAllProduct);
router.get("/products/:id", getProductById);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/products", createProduct);

router.post("/products/expire", expireProductController);


export default router;