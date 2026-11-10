import { DataTypes } from "sequelize";
import sequelize from "../ulits/database.js";

const ExpireProduct = sequelize.define('expires', {
  exp_id: { primaryKey: true, autoIncrement: true, type: DataTypes.INTEGER },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }, // when it was written off
}, { timestamps: false, indexes: [{ fields: ['createdAt'] }] });

export default ExpireProduct;
