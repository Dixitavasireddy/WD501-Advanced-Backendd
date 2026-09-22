'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const { User } = require('../models');


// ==================================================
// LOCAL STRATEGY
// ==================================================

passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },

        async (email, password, done) => {

            try {

                // ------------------------------------------
                // VALIDATE INPUT
                // ------------------------------------------

                if (
                    !email ||
                    !password
                ) {

                    return done(
                        null,
                        false,
                        {
                            message:
                                'Email and password are required'
                        }
                    );
                }


                // ------------------------------------------
                // NORMALIZE EMAIL
                // ------------------------------------------

                const normalizedEmail =
                    email
                        .trim()
                        .toLowerCase();


                // ------------------------------------------
                // FIND USER
                // ------------------------------------------

                const user =
                    await User.findOne({

                        where: {
                            email:
                                normalizedEmail
                        }
                    });


                // ------------------------------------------
                // USER NOT FOUND
                // ------------------------------------------

                if (!user) {

                    return done(
                        null,
                        false,
                        {
                            message:
                                'Invalid email or password'
                        }
                    );
                }


                // ------------------------------------------
                // CHECK PASSWORD
                // ------------------------------------------

                const passwordMatch =
                    await bcrypt.compare(
                        password,
                        user.password
                    );


                // ------------------------------------------
                // INVALID PASSWORD
                // ------------------------------------------

                if (!passwordMatch) {

                    return done(
                        null,
                        false,
                        {
                            message:
                                'Invalid email or password'
                        }
                    );
                }


                // ------------------------------------------
                // AUTHENTICATION SUCCESS
                // ------------------------------------------

                return done(
                    null,
                    user
                );

            } catch (error) {

                console.error(
                    'Passport authentication error:',
                    error
                );


                return done(
                    error
                );
            }
        }
    )
);


// ==================================================
// SERIALIZE USER
// ==================================================
//
// Only the user's ID is stored in the session.
// The password is NEVER stored in the session.
//

passport.serializeUser(
    (user, done) => {

        done(
            null,
            user.id
        );
    }
);


// ==================================================
// DESERIALIZE USER
// ==================================================
//
// Passport retrieves the user from the database
// using the ID stored in the session.
//

passport.deserializeUser(
    async (id, done) => {

        try {

            // ------------------------------------------
            // FIND USER
            // ------------------------------------------

            const user =
                await User.findByPk(id);


            // ------------------------------------------
            // USER NO LONGER EXISTS
            // ------------------------------------------

            if (!user) {

                return done(
                    null,
                    false
                );
            }


            // ------------------------------------------
            // USER FOUND
            // ------------------------------------------

            return done(
                null,
                user
            );

        } catch (error) {

            console.error(
                'Passport deserialization error:',
                error
            );


            return done(
                error
            );
        }
    }
);


// ==================================================
// EXPORT
// ==================================================

module.exports = passport;