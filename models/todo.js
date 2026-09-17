'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {

    static async addTask(params) {
      return await Todo.create({
        title: params.title,
        dueDate: params.dueDate,
        completed: false
      });
    }

    static async showList() {
      const todos = await Todo.findAll({
        order: [['dueDate', 'ASC'], ['id', 'ASC']]
      });

      console.log('My Todo-list');
      console.log();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdue = [];
      const dueToday = [];
      const dueLater = [];

      todos.forEach(todo => {
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

      console.log('Overdue');
      console.log();

      overdue.forEach(todo => {
        console.log(
          `${todo.id}. [${todo.completed ? 'x' : ' '}] ${todo.title.trim()} ${formatDate(todo.dueDate)}`
        );
      });

      console.log();
      console.log('Due Today');
      console.log();

      dueToday.forEach(todo => {
        console.log(
          `${todo.id}. [${todo.completed ? 'x' : ' '}] ${todo.title.trim()}`
        );
      });

      console.log();
      console.log('Due Later');
      console.log();

      dueLater.forEach(todo => {
        console.log(
          `${todo.id}. [${todo.completed ? 'x' : ' '}] ${todo.title.trim()} ${formatDate(todo.dueDate)}`
        );
      });
    }

    static async markAsComplete(id) {
      const todo = await Todo.findByPk(id);

      if (!todo) {
        throw new Error(`Todo with id ${id} not found`);
      }

      todo.completed = true;

      await todo.save();

      return todo;
    }
  }

  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },

      dueDate: {
        type: DataTypes.DATE,
        allowNull: false
      },

      completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'Todo'
    }
  );

  return Todo;
};

function formatDate(date) {
  const d = new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}