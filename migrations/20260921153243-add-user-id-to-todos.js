'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'todos',
      'user_id',
      {
        type: Sequelize.INTEGER,
        allowNull: false,

        references: {
          model: 'users',
          key: 'id'
        },

        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      'todos',
      'user_id'
    );
  }
};