import bcrypt from 'bcryptjs';
import UserModel, { IUserDocument } from "../models/User"

export const findUserByUsername = async (username: string): Promise<IUserDocument | null> => {
    try {
        return await UserModel.findOne({ username });
    } catch (error) {
        console.error('Error finding user by username:', error);
        return null;
    }
};

export const findUserById = async (id: string): Promise<IUserDocument | null> => {
    try {
        return await UserModel.findById(id);
    } catch (error) {
        console.error('Error finding user by ID:', error);
        return null;
    }
};

export const createUser = async (username: string, password: string): Promise<IUserDocument | null> => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserModel({ username, password: hashedPassword });
        return await user.save();
    } catch (error) {
        console.error('Error creating user:', error);
        return null;
    }
};
