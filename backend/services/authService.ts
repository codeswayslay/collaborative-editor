import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { findUserByUsername, findUserById } from './userService';
import UserModel, { IUserDocument } from "../models/User"

passport.use(new LocalStrategy(async (username, password, done) => {
    console.log("finding user with username: " + username + ", and password: " + password)
    const user = await findUserByUsername(username);
    if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
}));


passport.serializeUser((user, done) => {
    console.log("to serialize with user:", user)
    const userInStore = user as IUserDocument;
    done(null, userInStore._id);
});

passport.deserializeUser(async (id: string, done) => {
    console.log("to deserialize with id:", id);
    try {
        const user = await findUserById(id);
        if (!user) {
            return done(new Error('User not found'));
        }
        done(null, user);
    } catch (err) {
        done(err);
    }
});
