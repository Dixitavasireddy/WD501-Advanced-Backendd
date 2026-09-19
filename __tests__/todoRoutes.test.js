process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { Todo, sequelize } = require('../models');

describe('Todo API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Todo.destroy({
      where: {},
      truncate: true
    });
  });

  test('GET /todos should return all todos', async () => {
    await Todo.create({
      title: 'Complete Milestone 6',
      dueDate: '2026-09-20',
      completed: false
    });

    const response = await request(app)
      .get('/todos');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Complete Milestone 6');
  });

  test('DELETE /todos/:id should delete an existing todo', async () => {
    const todo = await Todo.create({
      title: 'Todo to delete',
      dueDate: '2026-09-20',
      completed: false
    });

    const response = await request(app)
      .delete(`/todos/${todo.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(true);

    const deletedTodo = await Todo.findByPk(todo.id);

    expect(deletedTodo).toBeNull();
  });

  test('DELETE /todos/:id should return false when todo does not exist', async () => {
    const response = await request(app)
      .delete('/todos/999999');

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(false);
  });
});