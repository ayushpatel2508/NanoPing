import express from "express";
import { updateProfile, changePassword, deleteAccount } from "../controllers/userController.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";

const router = express.Router();

router.use(isLoggedIn);

router.put("/profile", updateProfile);
router.post("/change-password", changePassword);
router.delete("/account", deleteAccount);

export default router;
