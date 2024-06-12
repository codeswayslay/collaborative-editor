import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
    username: string;
    password: string;
}

const UserSchema = new Schema<IUserDocument>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const UserModel = mongoose.model<IUserDocument>('User', UserSchema);

export default UserModel;