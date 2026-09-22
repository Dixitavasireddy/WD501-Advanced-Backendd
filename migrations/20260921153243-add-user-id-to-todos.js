'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {

    async up(queryInterface, Sequelize) {

        await queryInterface.addColumn(
            'todos',
            'user_id',
            {
                type: Sequelize.INTEGER,
                allowNull: true,

                references: {
                    model: 'Users',
                    key: 'id'
                },

                onUpdate: 'CASCADE',

                onDelete: 'CASCADE'
            }
        );

    },

    async down(queryInterface, Sequelize) {

        await queryInterface.removeColumn(
            'todos',
            'user_id'
        );

    }

};