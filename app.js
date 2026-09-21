'use strict';

const express = require('express');
const path = require('path');
const session = require('express-session');
const { csrfSync } = require('csrf-sync');

const { Todo } = require('./models');

const app = express();

/*
==================================================
RENDER / HTTPS PROXY
==================================================
*/
app.set('trust proxy', 1);

/*
==================================================
BODY PARSING
==================================================
*/
app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

/*
==================================================
STATIC FILES
==================================================
*/
app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

/*
==================================================
SESSION
==================================================
*/
app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            'todo-app-secret-change-this',

        resave: false,

        saveUninitialized: true,

        proxy: true,

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

/*
==================================================
CSRF
==================================================
*/
const {
    generateToken,
    csrfSynchronisedProtection
} = csrfSync({
    getTokenFromRequest: (req) => {

        /*
        HTML FORM
        */
        if (
            req.is(
                'application/x-www-form-urlencoded'
            )
        ) {
            return req.body._csrf;
        }

        /*
        FETCH / JSON
        */
        return (
            req.headers['x-csrf-token'] ||
            req.headers['csrf-token']
        );
    }
});

/*
==================================================
CSRF PROTECTION
==================================================
*/
app.use(
    csrfSynchronisedProtection
);

/*
==================================================
EJS
==================================================
*/
app.set(
    'view engine',
    'ejs'
);

app.set(
    'views',
    path.join(__dirname, 'views')
);

/*
==================================================
HOME
==================================================
*/
app.get(
    '/',
    (req, res) => {
        res.redirect('/todos');
    }
);

/*
==================================================
GET TODOS
==================================================
*/
app.get(
    '/todos',
    async (req, res) => {

        try {

            const todos =
                await Todo.findAll({
                    order: [
                        ['dueDate', 'ASC'],
                        ['id', 'ASC']
                    ]
                });

            /*
            ------------------------------------------
            TODAY
            ------------------------------------------
            */

            const today = new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            /*
            ------------------------------------------
            ACTIVE
            ------------------------------------------
            */

            const activeTodos =
                todos.filter(
                    todo => !todo.completed
                );

            const overdue = [];
            const dueToday = [];
            const dueLater = [];

            /*
            ------------------------------------------
            CATEGORIZE
            ------------------------------------------
            */

            activeTodos.forEach(
                todo => {

                    const dueDate =
                        new Date(
                            todo.dueDate
                        );

                    dueDate.setHours(
                        0,
                        0,
                        0,
                        0
                    );

                    if (
                        dueDate < today
                    ) {

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
            );

            /*
            ------------------------------------------
            COMPLETED
            ------------------------------------------
            */

            const completed =
                todos.filter(
                    todo => todo.completed
                );

            /*
            ------------------------------------------
            CSRF TOKEN
            ------------------------------------------
            */

            const csrfToken =
                generateToken(
                    req,
                    res
                );

            /*
            ------------------------------------------
            RENDER
            ------------------------------------------
            */

            return res.render(
                'index',
                {
                    overdue,
                    dueToday,
                    dueLater,
                    completed,
                    csrfToken
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
                    'Error loading todos: ' +
                    error.message
                );
        }
    }
);

/*
==================================================
CREATE TODO
==================================================
*/
app.post(
    '/todos',
    async (req, res) => {

        try {

            const {
                title,
                dueDate
            } = req.body;

            if (
                !title ||
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
                    title:
                        title.trim(),

                    dueDate,

                    completed: false
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
                .status(500)
                .json({
                    error:
                        error.message
                });
        }
    }
);

/*
==================================================
UPDATE TODO
==================================================
*/
app.put(
    '/todos/:id',
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );

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
                typeof completed !==
                'boolean'
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            'completed must be a boolean'
                    });
            }

            const todo =
                await Todo.findByPk(id);

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

/*
==================================================
DELETE TODO
==================================================
*/
app.delete(
    '/todos/:id',
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res
                    .status(200)
                    .json(false);
            }

            const deletedCount =
                await Todo.destroy({
                    where: {
                        id
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

/*
==================================================
CSRF ERROR HANDLER
==================================================
*/
app.use(
    (err, req, res, next) => {

        if (
            err &&
            err.code === 'EBADCSRFTOKEN'
        ) {

            console.error(
                'CSRF ERROR:',
                {
                    method:
                        req.method,

                    url:
                        req.originalUrl,

                    hasSession:
                        !!req.session,

                    hasToken:
                        !!(
                            req.headers[
                                'x-csrf-token'
                            ]
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

/*
==================================================
GENERAL ERROR HANDLER
==================================================
*/
app.use(
    (err, req, res, next) => {

        console.error(
            'Unhandled error:',
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

/*
==================================================
START SERVER
==================================================
*/
if (
    require.main === module
) {

    const PORT =
        process.env.PORT || 3000;

    app.listen(
        PORT,
        () => {

            console.log(
                `Server running on port ${PORT}`
            );

        }
    );
}

/*
==================================================
EXPORT
==================================================
*/
module.exports = app;