import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../ulits/database.js";

const ExpireProduct = sequelize.define('expires', {
    exp_id : {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    },

    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
  }
   
}, {
    timestamps: false
})

export default ExpireProduct;