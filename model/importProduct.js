import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../ulits/database.js";

const ImportProduct = sequelize.define('imports', {
    imp_id : {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER
    }, 

    imp_quantity : {
        type : DataTypes.INTEGER, 
        allowNull: false, 
        
    }

}, {
    timestamps: false
   
})

export default ImportProduct;