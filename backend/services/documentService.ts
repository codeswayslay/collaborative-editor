import DocumentModel, { IDocument } from "../models/Document";

export const findDocumentById = async (id: string): Promise<IDocument | null> => {
    try {
        const document = await DocumentModel.findById(id).exec();
        return document;
    } catch (error) {
        console.error('Error finding document by ID:', error);
        return null;
    }
};

export const saveDocument = async (type: string, name: string, data: string, userId: string): Promise<IDocument | null> => {
    try {
        const document = new DocumentModel({ type, name, data, userId });
        const savedDocument = await document.save();
        return savedDocument;
    } catch (error) {
        console.error('Error saving document:', error);
        return null;
    }
};

export const getDocumentById = async (id: string): Promise<IDocument | null> => {
    try {
        const document = await DocumentModel.findById(id).exec();
        return document;
    } catch (error) {
        console.error('Error retrieving document by ID:', error);
        return null;
    }
};

export const getDocumentsByUserId = async (userId: string): Promise<IDocument[]> => {
    try {
        const documents = await DocumentModel.find({ userId }).exec();
        return documents;
    } catch (error) {
        console.error('Error retrieving documents by user ID:', error);
        return [];
    }
};

export const updateDocumentById = async (id: string, data: string): Promise<IDocument | null> => {
    try {
        const updatedDocument = await DocumentModel.findByIdAndUpdate(
            id,
            { data },
            { new: true }
        ).exec();
        return updatedDocument;
    } catch (error) {
        console.error('Error updating document:', error);
        return null;
    }
};
