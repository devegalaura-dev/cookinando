import { Router } from "express";
import { getUsers, getUser, editUser, deleteUser } from "../controllers/userController";
import { authenticateToken } from "../middlewares/authMiddleware";
import { validateUpdateProfile } from "../middlewares/validators/userValidator";

const userRouter = Router();

userRouter.get("/", authenticateToken, getUsers);

userRouter.get("/:id", authenticateToken, getUser);

userRouter.put("/:id", authenticateToken, validateUpdateProfile, editUser);

userRouter.delete("/:id",authenticateToken, deleteUser);

export default userRouter;
