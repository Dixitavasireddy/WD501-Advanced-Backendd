const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const { csrfSync } = require('csrf-sync');

const { Todo } = require('./models');
const authRoutes = require('./routes/auth');

const app = express();

/* =========================================================
   CONFIGURATION
   ========================================================= */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

/* =========================================================
   BODY PARSING
   ========================================================= */

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

/* =========================================================
   STATIC FILES
   ========================================================= */

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

/* =========================================================
   SESSION
   ========================================================= */

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            'todo-app-secret-change-this',

        resave: false,

        saveUninitialized: true,

        proxy:
            process.env.NODE_ENV === 'production',

        cookie: {
            httpOnly: true,

            secure:
                process.env.NODE_ENV === 'production',

            sameSite: 'lax',

            maxAge:
                24 * 60 * 60 * 1000
        }
    })
);

/* =========================================================
   PASSPORT
   ========================================================= */

require('./config/passport');

app.use(passport.initialize());
app.use(passport.session());

/* =========================================================
   FLASH
   ========================================================= */

app.use(flash());

/* =========================================================
   CSRF CONFIGURATION
   ========================================================= */

const {
    generateToken,
    csrfSynchronisedProtection
} = csrfSync({
    getTokenFromRequest: (req) => {
        if (
            req.body &&
            typeof req.body._csrf === 'string'
        ) {
            return req.body._csrf;
        }

        return (
            req.headers['x-csrf-token'] ||
            req.headers['csrf-token'] ||
            req.headers['xsrf-token'] ||
            req.headers['x-xsrf-token']
        );
    },

    storeTokenInState: (req, token) => {
        req.session.csrfToken = token;
    },

    getTokenFromState: (req) => {
        return req.session.csrfToken;
    }
});

/* =========================================================
   GLOBAL LOCALS + CSRF TOKEN
   ========================================================= */

app.use(
    (req, res, next) => {
        res.locals.messages = req.flash();

        res.locals.currentUser =
            req.user || null;

        res.locals.csrfToken =
            generateToken(req);

        next();
    }
);

/* =========================================================
   CSRF PROTECTION
   ========================================================= */

app.use(
    csrfSynchronisedProtection
);

/* =========================================================
   AUTH ROUTES
   ========================================================= */

app.use(
    '/',
    authRoutes
);

/* =========================================================
   AUTHENTICATION MIDDLEWARE
   ========================================================= */

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    req.flash(
        'error',
        'Please sign in to continue.'
    );

    return res.redirect('/login');
}

/* =========================================================
   HOME
   ========================================================= */

app.get(
    '/',
    (req, res) => {

        /*
         * If already logged in,
         * go to Todo Manager.
         */
        if (req.isAuthenticated()) {
            return res.redirect('/todos');
        }

        /*
         * If not logged in,
         * START WITH CREATE ACCOUNT.
         */
        return res.redirect('/signup');
    }
);

/* =========================================================
   GET /todos
   ========================================================= */

app.get(
    '/todos',
    ensureAuthenticated,
    async (req, res) => {
        try {
            const todos =
                await Todo.findAll({
                    where: {
                        user_id: req.user.id
                    },

                    order: [
                        ['dueDate', 'ASC'],
                        ['id', 'ASC']
                    ]
                });

            const today = new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            const overdue = [];
            const dueToday = [];
            const dueLater = [];
            const completed = [];

            for (const todo of todos) {

                if (todo.completed) {
                    completed.push(todo);
                    continue;
                }

                const dueDate =
                    new Date(todo.dueDate);

                dueDate.setHours(
                    0,
                    0,
                    0,
                    0
                );

                if (dueDate < today) {
                    overdue.push(todo);

                } else if (
                    dueDate.getTime() ===
                    today.getTime()
                ) {
                    dueToday.push(todo);

                } else {
                    dueLater.push(todo);
                }
            }

            return res.render(
                'index',
                {
                    overdue,
                    dueToday,
                    dueLater,
                    completed,
                    csrfToken:
                        res.locals.csrfToken
                }
            );

        } catch (error) {

            console.error(
                'Error loading todos:',
                error
            );

            return res
                .status(500)
                .send(
                    'Error loading todos'
                );
        }
    }
);

/* =========================================================
   CREATE TODO
   POST /todos
   ========================================================= */

app.post(
    '/todos',
    ensureAuthenticated,
    async (req, res) => {
        try {

            const {
                title,
                dueDate
            } = req.body;

            if (
                typeof title !== 'string' ||
                !title.trim() ||
                !dueDate
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Title and due date are required'
                    });
            }

            const todo =
                await Todo.create({
                    title: title.trim(),
                    dueDate,
                    completed: false,
                    user_id: req.user.id
                });

            return res
                .status(201)
                .json(todo);

        } catch (error) {

            console.error(
                'Error creating todo:',
                error
            );

            return res
                .status(400)
                .json({
                    error:
                        error.message
                });
        }
    }
);

/* =========================================================
   UPDATE TODO
   PUT /todos/:id
   ========================================================= */

app.put(
    '/todos/:id',
    ensureAuthenticated,
    async (req, res) => {
        try {

            const id =
                Number(req.params.id);

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Invalid Todo ID'
                    });
            }

            const {
                completed
            } = req.body;

            if (
                typeof completed !== 'boolean'
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'completed must be a boolean'
                    });
            }

            const todo =
                await Todo.findOne({
                    where: {
                        id,
                        user_id:
                            req.user.id
                    }
                });

            if (!todo) {
                return res
                    .status(404)
                    .json({
                        error:
                            'Todo not found'
                    });
            }

            todo.completed =
                completed;

            await todo.save();

            return res
                .status(200)
                .json(todo);

        } catch (error) {

            console.error(
                'Error updating todo:',
                error
            );

            return res
                .status(500)
                .json({
                    error:
                        error.message
                });
        }
    }
);

/* =========================================================
   DELETE TODO
   DELETE /todos/:id
   ========================================================= */

app.delete(
    '/todos/:id',
    ensureAuthenticated,
    async (req, res) => {
        try {

            const id =
                Number(req.params.id);

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            'Invalid Todo ID'
                    });
            }

            const deletedCount =
                await Todo.destroy({
                    where: {
                        id,
                        user_id:
                            req.user.id
                    }
                });

            return res
                .status(200)
                .json(
                    deletedCount > 0
                );

        } catch (error) {

            console.error(
                'Error deleting todo:',
                error
            );

            return res
                .status(500)
                .json({
                    error:
                        error.message
                });
        }
    }
);

/* =========================================================
   CSRF ERROR HANDLER
   ========================================================= */

app.use(
    (err, req, res, next) => {

        if (
            err &&
            err.code === 'EBADCSRFTOKEN'
        ) {

            console.error(
                'CSRF validation failed:',
                {
                    method:
                        req.method,

                    url:
                        req.originalUrl,

                    hasSession:
                        !!req.session,

                    hasRequestToken:
                        !!(
                            req.headers[
                                'x-csrf-token'
                            ] ||
                            req.headers[
                                'csrf-token'
                            ] ||
                            req.body?._csrf
                        ),

                    hasSessionToken:
                        !!(
                            req.session &&
                            req.session.csrfToken
                        )
                }
            );

            return res
                .status(403)
                .json({
                    error:
                        'Invalid or missing CSRF token'
                });
        }

        return next(err);
    }
);

/* =========================================================
   GENERAL ERROR HANDLER
   ========================================================= */

app.use(
    (err, req, res, next) => {

        console.error(
            'Unhandled application error:',
            err
        );

        return res
            .status(500)
            .json({
                error:
                    'Internal server error'
            });
    }
);

/* =========================================================
   START SERVER
   ========================================================= */

if (require.main === module) {

    const PORT =
        process.env.PORT || 3000;

    app.listen(
        PORT,
        () => {
            console.log(
                'Server running on port ' + PORT
            );
        }
    );
}

/* =========================================================
   EXPORT
   ========================================================= */

module.exports = app;