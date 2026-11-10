import { DataTypes } from "sequelize";
import sequelize from "../ulits/database.js";

// Products are grouped by category (one row per category instead of repeating text on every product).
const Category = sequelize.define('categories', {
  category_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(80), allowNull: false },
}, { timestamps: false, indexes: [{ unique: true, fields: ['name'], name: 'categories_name_unique' }] });

export default Category;
