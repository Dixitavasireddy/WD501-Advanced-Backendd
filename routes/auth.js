const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const { User } = require('../models');

const router = express.Router();


// ==================================================
// GET LOGIN PAGE
// ==================================================

router.get('/login', (req, res) => {

    if (req.isAuthenticated()) {
        return res.redirect('/todos');
    }

    return res.render('login', {
        csrfToken: res.locals.csrfToken
    });
});


// ==================================================
// GET LOGIN PAGE FOR TESTS / ALTERNATIVE ROUTE
// ==================================================

router.get('/session/new', (req, res) => {

    if (req.isAuthenticated()) {
        return res.redirect('/todos');
    }

    return res.render('login', {
        csrfToken: res.locals.csrfToken
    });
});


// ==================================================
// POST LOGIN
// ==================================================

router.post(
    '/session',

    /*
     * Save CSRF token BEFORE Passport authentication.
     *
     * Passport can regenerate the session during login,
     * so we preserve the existing CSRF token.
     */
    (req, res, next) => {

        const csrfToken =
            req.body?._csrf ||
            req.headers['x-csrf-token'] ||
            req.headers['csrf-token'] ||
            req.headers['xsrf-token'] ||
            req.headers['x-xsrf-token'];

        req.loginCsrfToken = csrfToken;

        next();
    },

    passport.authenticate(
        'local',
        {
            failureRedirect: '/login',
            failureFlash: true
        }
    ),

    (req, res) => {

        /*
         * Restore CSRF token after Passport
         * authentication/session regeneration.
         */
        if (
            req.session &&
            req.loginCsrfToken
        ) {
            req.session.csrfToken =
                req.loginCsrfToken;
        }

        req.flash(
            'success',
            'Signed in successfully.'
        );

        return res.redirect('/todos');
    }
);


// ==================================================
// GET SIGNUP PAGE
// ==================================================

router.get('/signup', (req, res) => {

    if (req.isAuthenticated()) {
        return res.redirect('/todos');
    }

    return res.render('signup', {
        csrfToken: res.locals.csrfToken
    });
});


// ==================================================
// POST SIGNUP
// ==================================================

router.post('/signup', async (req, res) => {

    try {

        const {
            first_name,
            last_name,
            email,
            password,
            confirm_password
        } = req.body;


        // ------------------------------------------
        // BASIC VALIDATION
        // ------------------------------------------

        if (
            !first_name ||
            !first_name.trim() ||
            !email ||
            !email.trim() ||
            !password ||
            !confirm_password
        ) {

            req.flash(
                'error',
                'First name, email, password and confirm password are required.'
            );

            return res.redirect('/signup');
        }


        // ------------------------------------------
        // PASSWORD MATCH VALIDATION
        // ------------------------------------------

        if (
            password !== confirm_password
        ) {

            req.flash(
                'error',
                'Passwords do not match.'
            );

            return res.redirect('/signup');
        }


        // ------------------------------------------
        // PASSWORD LENGTH VALIDATION
        // ------------------------------------------

        if (password.length < 5) {

            req.flash(
                'error',
                'Password must be at least 5 characters.'
            );

            return res.redirect('/signup');
        }


        // ------------------------------------------
        // NORMALIZE EMAIL
        // ------------------------------------------

        const normalizedEmail =
            email.trim().toLowerCase();


        // ------------------------------------------
        // CHECK EXISTING USER
        // ------------------------------------------

        const existingUser =
            await User.findOne({
                where: {
                    email: normalizedEmail
                }
            });


        if (existingUser) {

            req.flash(
                'error',
                'An account with this email already exists.'
            );

            return res.redirect('/signup');
        }


        // ------------------------------------------
        // HASH PASSWORD WITH BCRYPT
        // ------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // ------------------------------------------
        // CREATE USER
        // ------------------------------------------

        await User.create({

            first_name:
                first_name.trim(),

            last_name:
                last_name
                    ? last_name.trim()
                    : null,

            email:
                normalizedEmail,

            password:
                hashedPassword
        });


        // ------------------------------------------
        // DO NOT LOGIN AUTOMATICALLY
        // ------------------------------------------
        /*
         * IMPORTANT:
         *
         * We intentionally DO NOT call:
         *
         * req.login(user, ...)
         *
         * The user must manually login after
         * creating the account.
         */

        req.flash(
            'success',
            'Account created successfully. Please login.'
        );

        return res.redirect('/login');


    } catch (error) {

        console.error(
            'Signup error:',
            error
        );

        req.flash(
            'error',
            'Unable to create account.'
        );

        return res.redirect('/signup');
    }
});


// ==================================================
// LOGOUT
// ==================================================

router.post(
    '/logout',

    (req, res, next) => {

        if (!req.isAuthenticated()) {
            return res.redirect('/login');
        }


        req.logout(
            (error) => {

                if (error) {
                    return next(error);
                }


                req.session.destroy(
                    (sessionError) => {

                        if (sessionError) {

                            console.error(
                                'Session destruction error:',
                                sessionError
                            );
                        }


                        res.clearCookie(
                            'connect.sid'
                        );

                        return res.redirect(
                            '/login'
                        );
                    }
                );
            }
        );
    }
);


module.exports = router;