import Product from "../product.js";
import ImportProduct from "../importProduct.js";
import ExpireProduct from "../expireProduct.js";
import Sale from "../sale.js";
import Stock from "../stock.js";
import Category from "../category.js";

// Associations
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products', onDelete: 'SET NULL' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

Product.hasMany(ImportProduct, { foreignKey: 'p_id', as: 'ImportProduct', onDelete: 'CASCADE' });
ImportProduct.belongsTo(Product, { foreignKey: 'p_id', onDelete: 'CASCADE' });

Product.hasMany(ExpireProduct, { foreignKey: 'p_id', as: 'ExpireProduct', onDelete: 'CASCADE' });
ExpireProduct.belongsTo(Product, { foreignKey: 'p_id', onDelete: 'CASCADE' });

// Sales are history: a product that has sales can no longer be deleted (it is deactivated instead).
Sale.belongsTo(Product, { foreignKey: 'p_id', as: 'product', onDelete: 'RESTRICT' });
Product.hasMany(Sale, { foreignKey: 'p_id', as: 'sale', onDelete: 'RESTRICT' });

Product.hasOne(Stock, { foreignKey: 'p_id', as: 'Stock', onDelete: 'CASCADE' });
Stock.belongsTo(Product, { foreignKey: 'p_id', onDelete: 'CASCADE' });

export { Category };
