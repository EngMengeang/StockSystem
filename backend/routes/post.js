import express from 'express';
import { getAllProduct, updateProduct, deleteProduct, 
        createProduct, getProductByName, saleProduct, getSoldProduct, 
        expireProductController, getExpiredProductsController, getInventorySummaryController, getOverviewController, getInventoryAnalyticsController, saleBatchController, importProductsController, getCategoriesController, createCategoryController} from '../controller/productPost.js';
import {login} from "../controller/authController.js"
import { requireAuth } from "../middleware/authen.js";
const router = express.Router();

// public: sign in, and a simple "is the server up" check
router.post("/login", login);
router.get("/health", (req, res) => res.json({ status: "ok" }));

// everything below needs a valid login token
router.use(requireAuth);

// bulk input
router.post("/sales/batch", saleBatchController);
router.post("/products/import", importProductsController);
// categories
router.get("/categories", getCategoriesController);
router.post("/categories", createCategoryController);
// overview page data
router.get("/analytics/overview", getOverviewController);
router.get("/analytics/inventory", getInventoryAnalyticsController);
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