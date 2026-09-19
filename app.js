const express = require('express');
const { Todo } = require('./models');

const app = express();

app.use(express.json());

// Configure EJS
app.set('view engine', 'ejs');

// GET /todos
// Fetches all todos and renders them using EJS.
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.findAll({
      order: [['dueDate', 'ASC'], ['id', 'ASC']]
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = [];
    const dueToday = [];
    const dueLater = [];

    todos.forEach((todo) => {
      const dueDate = new Date(todo.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        overdue.push(todo);
      } else if (dueDate.getTime() === today.getTime()) {
        dueToday.push(todo);
      } else {
        dueLater.push(todo);
      }
    });

    res.render('index', {
      overdue,
      dueToday,
      dueLater
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// DELETE /todos/:id
// Deletes a todo and returns true/false.
app.delete('/todos/:id', async (req, res) => {
  try {
    const deletedCount = await Todo.destroy({
      where: {
        id: req.params.id
      }
    });

    res.json(deletedCount > 0);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = app;