import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sequelize from "../ulits/database.js";

// compared against when the user does not exist, so the response time does not reveal which usernames are real
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 10);
const isHash = (s) => typeof s === "string" && /^\$2[aby]\$/.test(s);

export const login = async (req, res) => {
  const { username, password } = req.body ?? {};

  // only plain text is accepted (blocks tricks like sending an object instead of a string)
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const [user] = await sequelize.query(
      "SELECT id, username, password FROM userschema WHERE username = $1 LIMIT 1",
      { bind: [username.trim()], type: sequelize.QueryTypes.SELECT }
    );

    // passwords are stored hashed; an old plain-text row is accepted once and upgraded to a hash
    let ok = false;
    if (user && isHash(user.password)) ok = await bcrypt.compare(password, user.password);
    else if (user) {
      ok = user.password === password;
      if (ok) await sequelize.query("UPDATE userschema SET password = $1 WHERE id = $2", { bind: [await bcrypt.hash(password, 10), user.id] });
    } else await bcrypt.compare(password, DUMMY_HASH);

    if (!ok) return res.status(401).json({ message: "Wrong username or password." });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ message: "Login successful", token, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Something went wrong on the server. Please try again." });
  }
};
