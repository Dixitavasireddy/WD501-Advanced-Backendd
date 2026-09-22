'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

    class Todo extends Model {

        // ==========================================
        // Milestone 5
        // Add a new Todo
        // ==========================================

        static async addTask(params) {

            return await Todo.create({
                title: params.title,
                dueDate: params.dueDate,
                completed: false,
                user_id: params.user_id
            });

        }

        // ==========================================
        // Milestone 5
        // Display Todo list for CLI
        // ==========================================

        static async showList() {

            const todos = await Todo.findAll({
                order: [
                    ['dueDate', 'ASC'],
                    ['id', 'ASC']
                ]
            });

            console.log('My Todo-list');
            console.log();

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

                } else if (
                    dueDate.getTime() === today.getTime()
                ) {

                    dueToday.push(todo);

                } else {

                    dueLater.push(todo);

                }

            });

            // ==========================================
            // OVERDUE
            // ==========================================

            console.log('Overdue');
            console.log();

            overdue.forEach((todo) => {

                console.log(
                    `${todo.id}. [${todo.completed ? 'x' : ' '}] ${todo.title.trim()} ${formatDate(todo.dueDate)}`
                );

            });

            // ==========================================
            // DUE TODAY
            // ==========================================

            console.log();
            console.log('Due Today');
            console.log();

            dueToday.forEach((todo) => {

                console.log(
                    `${todo.id}. [${todo.completed ? 'x' : ' '}] ${todo.title.trim()}`
                );

            });

            // ==========================================
            // DUE LATER
            // ==========================================

            console.log();
            console.log('Due Later');
            console.log();

            dueLater.forEach((todo) => {

                console.log(
                    `${todo.id}. [${todo.completed ? 'x' : ' '}] ${todo.title.trim()} ${formatDate(todo.dueDate)}`
                );

            });

        }

        // ==========================================
        // Milestone 9
        // Set Todo completion status
        // ==========================================

        async setCompletionStatus(completed) {

            if (typeof completed !== 'boolean') {

                throw new Error(
                    'completed must be a boolean'
                );

            }

            this.completed = completed;

            await this.save();

            return this;

        }

        // ==========================================
        // Milestone 10
        // Todo belongs to User
        // ==========================================

        static associate(models) {

            Todo.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user'
            });

        }

    }

    // ==========================================
    // Todo Model Definition
    // ==========================================

    Todo.init(
        {
            title: {

                type: DataTypes.STRING,

                allowNull: false,

                validate: {

                    notNull: {
                        msg: 'Todo title is required'
                    },

                    notEmpty: {
                        msg: 'Todo title cannot be empty'
                    },

                    len: {
                        args: [5, 255],
                        msg: 'Todo title must be between 5 and 255 characters'
                    }

                }

            },

            dueDate: {

                type: DataTypes.DATE,

                allowNull: false

            },

            completed: {

                type: DataTypes.BOOLEAN,

                allowNull: false,

                defaultValue: false

            },

            user_id: {

                type: DataTypes.INTEGER,

                allowNull: false

            }

        },
        {
            sequelize,

            modelName: 'Todo',

            tableName: 'todos',

            timestamps: true
        }
    );

    return Todo;
};


// ==============================================
// Format Date
// ==============================================

function formatDate(date) {

    const d = new Date(date);

    const year =
        d.getFullYear();

    const month =
        String(d.getMonth() + 1).padStart(2, '0');

    const day =
        String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}