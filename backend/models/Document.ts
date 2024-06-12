import mongoose, { Schema, Document } from "mongoose";

export interface IDocument extends Document {
    type: string;
    name: string;
    data: string;
    userId: string;
}

const DocumentSchema: Schema = new Schema({
    type: { type: String, required: true },
    name: { type: String, required: true },
    data: { type: String, required: false },
    userId: { type: String, required: true }
});

const DocumentModel = mongoose.model<IDocument>("Document", DocumentSchema);

export default DocumentModel;
