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
                completed: false
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

            // Get today's date
            const today = new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            // Divide todos into sections
            const overdue = [];
            const dueToday = [];
            const dueLater = [];

            todos.forEach((todo) => {

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
            });

            // ==========================================
            // Overdue
            // ==========================================

            console.log('Overdue');
            console.log();

            overdue.forEach((todo) => {

                console.log(
                    `${todo.id}. [${todo.completed ? 'x' : ' '}] ${todo.title.trim()} ${formatDate(todo.dueDate)}`
                );

            });

            // ==========================================
            // Due Today
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
            // Due Later
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
        //
        // Usage:
        //
        // await todo.setCompletionStatus(true);
        //
        // true  -> completed
        // false -> incomplete
        //
        // ==========================================

        async setCompletionStatus(completed) {

            // Validate that completed is a boolean
            if (typeof completed !== 'boolean') {

                throw new Error(
                    'completed must be a boolean'
                );
            }

            // Update the current Todo instance
            this.completed = completed;

            // Save the change to database
            await this.save();

            return this;
        }
    }

    // ==========================================
    // Todo Model Definition
    // ==========================================

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


// ==============================================
// Format Date
// ==============================================

function formatDate(date) {

    const d = new Date(date);

    const year =
        d.getFullYear();

    const month =
        String(d.getMonth() + 1)
            .padStart(2, '0');

    const day =
        String(d.getDate())
            .padStart(2, '0');

    return `${year}-${month}-${day}`;
}