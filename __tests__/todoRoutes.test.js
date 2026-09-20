process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { Todo, sequelize } = require('../models');

describe('Todo API', () => {

  // ==================================================
  // DATABASE SETUP
  // ==================================================

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

  // ==================================================
  // GET /todos
  // ==================================================

  test('GET /todos should render the todo list page', async () => {

    await Todo.create({
      title: 'Complete Milestone 9',
      dueDate: '2026-09-20',
      completed: false
    });

    const response = await request(app)
      .get('/todos');

    expect(response.statusCode).toBe(200);

    expect(
      response.headers['content-type']
    ).toMatch(/html/);

    expect(response.text).toContain(
      'My Todo List'
    );

    expect(response.text).toContain(
      'Complete Milestone 9'
    );
  });

  // ==================================================
  // CSRF TOKEN HELPER
  // ==================================================

  async function getCsrfToken(agent) {

    const response = await agent
      .get('/todos');

    expect(response.statusCode).toBe(200);

    /*
     * The index.ejs page should contain:
     *
     * const csrfToken = 'TOKEN';
     */

    const tokenMatch = response.text.match(
      /const csrfToken\s*=\s*['"]([^'"]+)['"]/
    );

    expect(tokenMatch).not.toBeNull();

    return tokenMatch[1];
  }

  // ==================================================
  // POST /todos
  // ==================================================

  test('POST /todos should reject request without CSRF token', async () => {

    const agent = request.agent(app);

    /*
     * Create the session first.
     */
    await agent.get('/todos');

    const response = await agent
      .post('/todos')
      .send({
        title: 'CSRF Create Test',
        dueDate: '2026-09-20'
      });

    /*
     * Request must be rejected.
     */
    expect(response.statusCode).toBe(403);

    /*
     * Todo must not be created.
     */
    const todo = await Todo.findOne({
      where: {
        title: 'CSRF Create Test'
      }
    });

    expect(todo).toBeNull();
  });

  test('POST /todos should accept a valid CSRF token', async () => {

    const agent = request.agent(app);

    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .post('/todos')
      .set('x-csrf-token', csrfToken)
      .send({
        title: 'Valid CSRF Todo',
        dueDate: '2026-09-20'
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.title).toBe(
      'Valid CSRF Todo'
    );

    expect(response.body.completed).toBe(false);

    /*
     * Verify database record.
     */
    const todo = await Todo.findByPk(
      response.body.id
    );

    expect(todo).not.toBeNull();

    expect(todo.title).toBe(
      'Valid CSRF Todo'
    );
  });

  // ==================================================
  // PUT /todos/:id
  // ==================================================

  test('PUT /todos/:id should reject request without CSRF token', async () => {

    const agent = request.agent(app);

    /*
     * Establish session.
     */
    await agent.get('/todos');

    const todo = await Todo.create({
      title: 'CSRF Update Test',
      dueDate: '2026-09-20',
      completed: false
    });

    const response = await agent
      .put(`/todos/${todo.id}`)
      .send({
        completed: true
      });

    /*
     * Request must be rejected.
     */
    expect(response.statusCode).toBe(403);

    /*
     * Todo must remain incomplete.
     */
    const unchangedTodo = await Todo.findByPk(
      todo.id
    );

    expect(unchangedTodo).not.toBeNull();

    expect(unchangedTodo.completed).toBe(
      false
    );
  });

  test('PUT /todos/:id should accept a valid CSRF token', async () => {

    const agent = request.agent(app);

    const csrfToken = await getCsrfToken(agent);

    const todo = await Todo.create({
      title: 'Valid CSRF Update',
      dueDate: '2026-09-20',
      completed: false
    });

    const response = await agent
      .put(`/todos/${todo.id}`)
      .set('x-csrf-token', csrfToken)
      .send({
        completed: true
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.completed).toBe(
      true
    );

    /*
     * Verify database.
     */
    const updatedTodo = await Todo.findByPk(
      todo.id
    );

    expect(updatedTodo).not.toBeNull();

    expect(updatedTodo.completed).toBe(
      true
    );
  });

  // ==================================================
  // DELETE /todos/:id
  // ==================================================

  test('DELETE /todos/:id should reject request without CSRF token', async () => {

    const agent = request.agent(app);

    /*
     * Establish session.
     */
    await agent.get('/todos');

    const todo = await Todo.create({
      title: 'CSRF Delete Test',
      dueDate: '2026-09-20',
      completed: false
    });

    const response = await agent
      .delete(`/todos/${todo.id}`);

    /*
     * Request must be rejected.
     */
    expect(response.statusCode).toBe(403);

    /*
     * Todo must still exist.
     */
    const existingTodo = await Todo.findByPk(
      todo.id
    );

    expect(existingTodo).not.toBeNull();
  });

  test('DELETE /todos/:id should delete an existing todo with valid CSRF token', async () => {

    const agent = request.agent(app);

    const csrfToken = await getCsrfToken(agent);

    const todo = await Todo.create({
      title: 'Todo to delete',
      dueDate: '2026-09-20',
      completed: false
    });

    const response = await agent
      .delete(`/todos/${todo.id}`)
      .set('x-csrf-token', csrfToken);

    expect(response.statusCode).toBe(200);

    expect(response.body).toBe(true);

    /*
     * Verify deletion.
     */
    const deletedTodo = await Todo.findByPk(
      todo.id
    );

    expect(deletedTodo).toBeNull();
  });

  test('DELETE /todos/:id should return false when todo does not exist with valid CSRF token', async () => {

    const agent = request.agent(app);

    const csrfToken = await getCsrfToken(agent);

    const response = await agent
      .delete('/todos/999999')
      .set('x-csrf-token', csrfToken);

    expect(response.statusCode).toBe(200);

    expect(response.body).toBe(false);
  });

  // ==================================================
  // CSRF TOKEN GENERATION
  // ==================================================

  test('GET /todos should generate a CSRF token', async () => {

    const agent = request.agent(app);

    const response = await agent
      .get('/todos');

    expect(response.statusCode).toBe(200);

    /*
     * Verify that the page contains a CSRF token.
     */
    expect(response.text).toMatch(
      /const csrfToken\s*=\s*['"]([^'"]+)['"]/
    );
  });

});