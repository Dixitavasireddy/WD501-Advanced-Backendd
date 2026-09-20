'use strict';

const express = require('express');
const path = require('path');
const session = require('express-session');

const {
    csrfSync
} = require('csrf-sync');

const {
    Todo
} = require('./models');

const app = express();

// ==================================================
// BASIC MIDDLEWARE
// ==================================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ==================================================
// STATIC FILES
// ==================================================

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

// ==================================================
// SESSION
// ==================================================

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            'todo-app-secret',

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            sameSite: 'lax',

            secure:
                process.env.NODE_ENV === 'production'
        }
    })
);

// ==================================================
// CSRF CONFIGURATION
// ==================================================

const {
    generateToken,
    csrfSynchronisedProtection
} = csrfSync({
    getTokenFromRequest: (req) => {

        // Form requests
        if (
            req.is(
                'application/x-www-form-urlencoded'
            )
        ) {
            return req.body._csrf;
        }

        // JSON / Fetch / AJAX requests
        return req.headers['x-csrf-token'];
    }
});

// ==================================================
// CSRF PROTECTION
// ==================================================

app.use(
    csrfSynchronisedProtection
);

// ==================================================
// EJS CONFIGURATION
// ==================================================

app.set(
    'view engine',
    'ejs'
);

app.set(
    'views',
    path.join(__dirname, 'views')
);

// ==================================================
// GET /
// ==================================================

app.get(
    '/',
    (req, res) => {

        res.redirect('/todos');

    }
);

// ==================================================
// GET /todos
// ==================================================

app.get(
    '/todos',
    async (req, res) => {

        try {

            // --------------------------------------
            // Get all todos
            // --------------------------------------

            const todos =
                await Todo.findAll({
                    order: [
                        ['dueDate', 'ASC'],
                        ['id', 'ASC']
                    ]
                });

            // --------------------------------------
            // Get today's date
            // --------------------------------------

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            // --------------------------------------
            // Active todos
            // --------------------------------------

            const activeTodos =
                todos.filter(
                    (todo) =>
                        !todo.completed
                );

            const overdue = [];
            const dueToday = [];
            const dueLater = [];

            // --------------------------------------
            // Categorize active todos
            // --------------------------------------

            activeTodos.forEach(
                (todo) => {

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

                    // Overdue
                    if (
                        dueDate < today
                    ) {

                        overdue.push(todo);

                    }

                    // Due Today
                    else if (
                        dueDate.getTime() ===
                        today.getTime()
                    ) {

                        dueToday.push(todo);

                    }

                    // Due Later
                    else {

                        dueLater.push(todo);

                    }

                }
            );

            // --------------------------------------
            // Completed todos
            // --------------------------------------

            const completed =
                todos.filter(
                    (todo) =>
                        todo.completed
                );

            // --------------------------------------
            // Generate CSRF token
            // --------------------------------------

            const csrfToken =
                generateToken(
                    req,
                    res
                );

            // --------------------------------------
            // Render page
            // --------------------------------------

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

// ==================================================
// POST /todos
// CREATE TODO
// ==================================================

app.post(
    '/todos',
    async (req, res) => {

        try {

            const {
                title,
                dueDate
            } = req.body;

            // --------------------------------------
            // Validate input
            // --------------------------------------

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

            // --------------------------------------
            // Create Todo
            // --------------------------------------

            const todo =
                await Todo.create({

                    title:
                        title.trim(),

                    dueDate,

                    completed: false

                });

            // --------------------------------------
            // Return created Todo
            // --------------------------------------

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

// ==================================================
// PUT /todos/:id
// COMPLETE / INCOMPLETE TODO
// ==================================================

app.put(
    '/todos/:id',
    async (req, res) => {

        try {

            // --------------------------------------
            // Convert ID
            // --------------------------------------

            const id =
                Number(
                    req.params.id
                );

            // --------------------------------------
            // Validate ID
            // --------------------------------------

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

            // --------------------------------------
            // Get completed value
            // --------------------------------------

            const {
                completed
            } = req.body;

            // --------------------------------------
            // Validate completed
            // --------------------------------------

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

            // --------------------------------------
            // Find Todo
            // --------------------------------------

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

            // --------------------------------------
            // Update completion
            // --------------------------------------

            todo.completed =
                completed;

            await todo.save();

            // --------------------------------------
            // Return updated Todo
            // --------------------------------------

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

// ==================================================
// DELETE /todos/:id
// ==================================================

app.delete(
    '/todos/:id',
    async (req, res) => {

        try {

            // --------------------------------------
            // Convert ID
            // --------------------------------------

            const id =
                Number(
                    req.params.id
                );

            // --------------------------------------
            // Validate ID
            // --------------------------------------

            if (
                !Number.isInteger(id) ||
                id <= 0
            ) {

                return res
                    .status(400)
                    .json(false);
            }

            // --------------------------------------
            // Delete Todo
            // --------------------------------------

            const deletedCount =
                await Todo.destroy({
                    where: {
                        id
                    }
                });

            // --------------------------------------
            // IMPORTANT
            //
            // Existing Jest tests expect:
            //
            // Existing Todo  -> true
            // Missing Todo    -> false
            //
            // Both return HTTP 200.
            // --------------------------------------

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

// ==================================================
// CSRF ERROR HANDLER
// ==================================================

app.use(
    (err, req, res, next) => {

        if (
            err &&
            err.code === 'EBADCSRFTOKEN'
        ) {

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

// ==================================================
// START SERVER
// ==================================================

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

// ==================================================
// EXPORT APP FOR JEST / SUPERTEST
// ==================================================

module.exports = app;