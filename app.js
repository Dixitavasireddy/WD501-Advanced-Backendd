const express = require('express');
const { Todo } = require('./models');

const app = express();

app.use(express.json());

// GET /todos
// Returns all todos from the database
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.findAll({
      order: [['dueDate', 'ASC'], ['id', 'ASC']]
    });

    res.json(todos);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// DELETE /todos/:id
// Deletes a todo and returns true/false
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