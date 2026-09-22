'use strict';

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {

    static associate(models) {
      User.hasMany(models.Todo, {
        foreignKey: 'user_id',
        as: 'todos'
      });
    }

  }

  User.init(
    {
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'First name is required'
          },
          notEmpty: {
            msg: 'First name cannot be empty'
          }
        }
      },

      last_name: {
        type: DataTypes.STRING,
        allowNull: true
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: {
            msg: 'Email is required'
          },
          notEmpty: {
            msg: 'Email cannot be empty'
          },
          isEmail: {
            msg: 'Please provide a valid email address'
          }
        }
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Password is required'
          },
          notEmpty: {
            msg: 'Password cannot be empty'
          }
        }
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users'
    }
  );

  return User;
};