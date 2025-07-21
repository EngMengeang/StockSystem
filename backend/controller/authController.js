import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sequelize from '../ulits/db.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    // Query from your table 'userschema' (which is your actual table name)
    const [results] = await sequelize.query(
      'SELECT * FROM userschema WHERE username = $1 LIMIT 1',
      {
        bind: [username],
        type: sequelize.QueryTypes.SELECT
      }
    );

    const user = results;

   
    if (user.username !== username){
        return res.status(401).json({ message: 'Invalid username or password.' });
    }
    if (user.password !== password){
        return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
