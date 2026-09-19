const express = require('express');
const path = require('path');

const { Todo } = require('./models');

const app = express();

// ==================================================
// Middleware
// ==================================================

app.use(express.json());

// Serve static files from public folder
app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

// Configure EJS
app.set('view engine', 'ejs');

app.set(
    'views',
    path.join(__dirname, 'views')
);

// ==================================================
// GET /todos
// Display all todos
// ==================================================

app.get('/todos', async (req, res) => {
    try {

        const todos = await Todo.findAll({
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

        todos.forEach((todo) => {

            const dueDate = new Date(
                todo.dueDate
            );

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
        });

        res.render(
            'index',
            {
                overdue,
                dueToday,
                dueLater
            }
        );

    } catch (error) {

        console.error(
            'Error loading todos:',
            error
        );

        res.status(500).send(
            'Error loading todos: ' +
            error.message
        );
    }
});

// ==================================================
// POST /todos
// Create a new todo
// ==================================================

app.post('/todos', async (req, res) => {
    try {

        const {
            title,
            dueDate
        } = req.body;

        // Validate title
        if (
            !title ||
            title.trim() === ''
        ) {
            return res.status(400).json({
                error: 'Todo title is required'
            });
        }

        // Validate due date
        if (!dueDate) {
            return res.status(400).json({
                error: 'Due date is required'
            });
        }

        // Create Todo
        const todo = await Todo.create({
            title: title.trim(),
            dueDate: dueDate,
            completed: false
        });

        // Return created Todo
        res.status(201).json(todo);

    } catch (error) {

        console.error(
            'Error creating todo:',
            error
        );

        res.status(500).json({
            error: error.message
        });
    }
});

// ==================================================
// DELETE /todos/:id
// Delete an existing todo
// ==================================================

app.delete(
    '/todos/:id',
    async (req, res) => {

        try {

            const deletedCount =
                await Todo.destroy({
                    where: {
                        id: req.params.id
                    }
                });

            res.json(
                deletedCount > 0
            );

        } catch (error) {

            console.error(
                'Error deleting todo:',
                error
            );

            res.status(500).json({
                error: error.message
            });
        }
    }
);

// ==================================================
// Export app
// ==================================================

module.exports = app;