import express from "express"
import passport from "passport";
import { IUserDocument } from "../models/User"
import { createUser } from "../services/userService";
import "../services/authService";

const router = express.Router();

router.get("/login", (req, res) => {
    res.render("login");
})

router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: IUserDocument, info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', 'The username or password is invalid');
            return res.redirect("/login");
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect("/document-list");
        });
    })(req, res, next);
});

router.get("/register", (req, res) => {
    res.render("register");
})

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (username.length < 1 || password.length < 1) {
        req.flash('error', 'Username and password must be provided');
        return res.redirect('/register');
    }

    try {
        const user = await createUser(username, password);
        req.login(user as IUserDocument, (err) => {
            if (err) {
                req.flash('error', 'Something went wrong with your registration.');
                console.error(err);
                return res.redirect('/register');
            }
            return res.redirect('/document-list');
        });
    } catch (err) {
        req.flash('error', 'Username probably already exists.');
        console.error(err);
        res.redirect('/register');
    }
});

router.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/login");
    });
});

export = router;