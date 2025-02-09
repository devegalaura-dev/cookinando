import { Request, Response } from "express";
import User from "../models/userModel";
import { AuthRequest } from "../interfaces/userInterface";
import bcrypt from "bcrypt";

export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const authUser = req.user;
  if (authUser?.role !== "admin") {
    res
      .status(403)
      .json({ error: "Access denied. Only admins can view the users." });
    return;
  }
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error retrieving users:", error.message);
      res.status(500).json({
        error:
          "An error occurred while retrieving the users. Please try again later.",
      });
    }
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ where: { id } });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: "User not found." });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error retrieving user:", error.message);
      res.status(500).json({
        error:
          "An error occurred while retrieving the user. Please try again later.",
      });
    }
  }
};

export const editUser = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, password, email, role } = req.body;

    let updatedData: {
      username?: string;
      email?: string;
      role?: string;
      password?: string;
    } = {
      username,
      email,
    };

    if (role !== undefined) {
      const authUser = req.user;
      if (role === "admin" && authUser?.role !== "admin") {
        res
          .status(403)
          .json({ error: "Access denied. Only admins can update user role." });
        return;
      }

      updatedData.role = role;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedData.password = hashedPassword;
    }

    const [updated] = await User.update(updatedData, { where: { id } });

    if (updated) {
      const updatedUser = await User.findOne({ where: { id } });
      res.status(200).json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error updating user:", error.message);
      res.status(500).json({
        error:
          "An error occurred while updating the user. Please try again later.",
        details: error.message,
      });
    }
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id } });
    if (deleted) {
      res.status(200).json({ message: "User successfully deleted." });
    } else {
      res.status(404).json({ message: "User not found." });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting user:", error.message);
      res.status(500).json({
        error:
          "An error occurred while deleting the user. Please try again later.",
        details: error.message,
      });
    }
  }
};
