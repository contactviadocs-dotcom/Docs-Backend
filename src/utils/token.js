import { generateToken } from "../utils/generateToken.js";

const token = generateToken(user._id);
res.json({ token });
