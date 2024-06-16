import express from "express";
import {
    findDocumentById,
    saveDocument,
    getDocumentById,
    getDocumentsByUserId,
    updateDocumentById
} from "../services/documentService";
import UserModel, { IUserDocument } from "../models/User"
import { IDocument } from "../models/Document";

const router = express.Router();

router.get("/editor", async (req, res, next) => {
    const { id } = req.query;
    const doc = await findDocumentById(id as string);
    if (!doc) {
        return res.render('error', { message: 'Invalid document ID' });
    }

    // Fetch user details
    const user = req.isAuthenticated() ? req.user as IUserDocument : null;
    if (!user) {
        return res.redirect("/login");
    }

    res.render('editor', {
        username: user.username,
        userId: user._id,
        documentId: id,
        ownerId: (doc as IDocument).userId
    });
});

router.get("/document-list", async (req, res, next) => {
    if (req.isAuthenticated()) {
        const documents = await getDocumentsByUserId(String((req.user as IUserDocument)._id));
        res.render('document-list', { documents });
    } else {
        res.redirect('/login');
    }
});

router.post('/create-document', async (req, res) => {
    const { documentName } = req.body;
    console.log("document name:", documentName);
    if (req.isAuthenticated()) {
        await saveDocument('content', documentName, '', String((req.user as IUserDocument)._id));
        res.redirect('/document-list');
    } else {
        res.redirect('/login');
    }
});

export = router;