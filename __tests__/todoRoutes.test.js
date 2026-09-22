
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../app');

const {
    Todo,
    User,
    sequelize
} = require('../models');


describe('Todo API', () => {


    // ============================================================
    // DATABASE SETUP
    // ============================================================

    beforeAll(async () => {

        await sequelize.sync({
            force: true
        });

    });


    afterAll(async () => {

        await sequelize.close();

    });


    beforeEach(async () => {

        await Todo.destroy({
            where: {},
            truncate: true
        });


        await User.destroy({
            where: {},
            truncate: true
        });

    });


    // ============================================================
    // TEST USER
    // ============================================================

    async function createTestUser(
        email = 'test@example.com'
    ) {

        const hashedPassword =
            await bcrypt.hash(
                'password123',
                10
            );


        return await User.create({

            first_name:
                'Test',

            last_name:
                'User',

            email:
                email,

            password:
                hashedPassword

        });

    }


    // ============================================================
    // GET CSRF TOKEN
    // ============================================================

    async function getCsrfToken(agent) {

        /*
         * Your auth.js must provide:
         *
         * GET /session/new
         *
         * This page must contain:
         *
         * const csrfToken = "....";
         */

        const response =
            await agent.get(
                '/session/new'
            );


        expect(
            response.statusCode
        ).toBe(200);


        const tokenMatch =
            response.text.match(
                /const csrfToken\s*=\s*['"]([^'"]+)['"]/
            );


        expect(
            tokenMatch
        ).not.toBeNull();


        return tokenMatch[1];
    }


    // ============================================================
    // LOGIN HELPER
    // ============================================================

    async function login(
        agent,
        user
    ) {

        /*
         * First load the login page.
         * This creates the session and CSRF token.
         */

        const csrfToken =
            await getCsrfToken(
                agent
            );


        /*
         * Submit login.
         */

        const loginResponse =
            await agent
                .post('/session')
                .set(
                    'x-csrf-token',
                    csrfToken
                )
                .send({

                    email:
                        user.email,

                    password:
                        'password123'

                });


        /*
         * Passport should redirect
         * after successful login.
         */

        expect([
            302,
            303
        ]).toContain(
            loginResponse.statusCode
        );


        return csrfToken;
    }


    // ============================================================
    // GET /todos
    // ============================================================

    test(
        'GET /todos should render the todo list page',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            await login(
                agent,
                user
            );


            await Todo.create({

                title:
                    'Complete Milestone 9',

                dueDate:
                    '2026-09-20',

                completed:
                    false,

                user_id:
                    user.id

            });


            const response =
                await agent.get(
                    '/todos'
                );


            expect(
                response.statusCode
            ).toBe(200);


            expect(
                response.headers['content-type']
            ).toMatch(/html/);


            expect(
                response.text
            ).toContain(
                'My Todo List'
            );


            expect(
                response.text
            ).toContain(
                'Complete Milestone 9'
            );

        }
    );


    // ============================================================
    // POST /todos WITHOUT CSRF
    // ============================================================

    test(
        'POST /todos should reject request without CSRF token',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            await login(
                agent,
                user
            );


            const response =
                await agent
                    .post('/todos')
                    .send({

                        title:
                            'CSRF Create Test',

                        dueDate:
                            '2026-09-20'

                    });


            expect(
                response.statusCode
            ).toBe(403);


            const todo =
                await Todo.findOne({

                    where: {
                        title:
                            'CSRF Create Test'
                    }

                });


            expect(
                todo
            ).toBeNull();

        }
    );


    // ============================================================
    // POST /todos WITH CSRF
    // ============================================================

    test(
        'POST /todos should accept a valid CSRF token',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            const csrfToken =
                await login(
                    agent,
                    user
                );


            const response =
                await agent
                    .post('/todos')
                    .set(
                        'x-csrf-token',
                        csrfToken
                    )
                    .send({

                        title:
                            'Valid CSRF Todo',

                        dueDate:
                            '2026-09-20'

                    });


            expect(
                response.statusCode
            ).toBe(201);


            expect(
                response.body.title
            ).toBe(
                'Valid CSRF Todo'
            );


            expect(
                response.body.completed
            ).toBe(false);


            const todo =
                await Todo.findByPk(
                    response.body.id
                );


            expect(
                todo
            ).not.toBeNull();


            expect(
                todo.title
            ).toBe(
                'Valid CSRF Todo'
            );


            expect(
                todo.user_id
            ).toBe(
                user.id
            );

        }
    );


    // ============================================================
    // PUT /todos/:id WITHOUT CSRF
    // ============================================================

    test(
        'PUT /todos/:id should reject request without CSRF token',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            await login(
                agent,
                user
            );


            const todo =
                await Todo.create({

                    title:
                        'CSRF Update Test',

                    dueDate:
                        '2026-09-20',

                    completed:
                        false,

                    user_id:
                        user.id

                });


            const response =
                await agent
                    .put(
                        `/todos/${todo.id}`
                    )
                    .send({

                        completed:
                            true

                    });


            expect(
                response.statusCode
            ).toBe(403);


            const unchangedTodo =
                await Todo.findByPk(
                    todo.id
                );


            expect(
                unchangedTodo
            ).not.toBeNull();


            expect(
                unchangedTodo.completed
            ).toBe(false);

        }
    );


    // ============================================================
    // PUT /todos/:id WITH CSRF
    // ============================================================

    test(
        'PUT /todos/:id should accept a valid CSRF token',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            const csrfToken =
                await login(
                    agent,
                    user
                );


            const todo =
                await Todo.create({

                    title:
                        'Valid CSRF Update',

                    dueDate:
                        '2026-09-20',

                    completed:
                        false,

                    user_id:
                        user.id

                });


            const response =
                await agent
                    .put(
                        `/todos/${todo.id}`
                    )
                    .set(
                        'x-csrf-token',
                        csrfToken
                    )
                    .send({

                        completed:
                            true

                    });


            expect(
                response.statusCode
            ).toBe(200);


            expect(
                response.body.completed
            ).toBe(true);


            const updatedTodo =
                await Todo.findByPk(
                    todo.id
                );


            expect(
                updatedTodo
            ).not.toBeNull();


            expect(
                updatedTodo.completed
            ).toBe(true);

        }
    );


    // ============================================================
    // DELETE /todos/:id WITHOUT CSRF
    // ============================================================

    test(
        'DELETE /todos/:id should reject request without CSRF token',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            await login(
                agent,
                user
            );


            const todo =
                await Todo.create({

                    title:
                        'CSRF Delete Test',

                    dueDate:
                        '2026-09-20',

                    completed:
                        false,

                    user_id:
                        user.id

                });


            const response =
                await agent
                    .delete(
                        `/todos/${todo.id}`
                    );


            expect(
                response.statusCode
            ).toBe(403);


            const existingTodo =
                await Todo.findByPk(
                    todo.id
                );


            expect(
                existingTodo
            ).not.toBeNull();

        }
    );


    // ============================================================
    // DELETE /todos/:id WITH CSRF
    // ============================================================

    test(
        'DELETE /todos/:id should delete an existing todo with valid CSRF token',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            const csrfToken =
                await login(
                    agent,
                    user
                );


            const todo =
                await Todo.create({

                    title:
                        'Todo to delete',

                    dueDate:
                        '2026-09-20',

                    completed:
                        false,

                    user_id:
                        user.id

                });


            const response =
                await agent
                    .delete(
                        `/todos/${todo.id}`
                    )
                    .set(
                        'x-csrf-token',
                        csrfToken
                    );


            expect(
                response.statusCode
            ).toBe(200);


            expect(
                response.body
            ).toBe(true);


            const deletedTodo =
                await Todo.findByPk(
                    todo.id
                );


            expect(
                deletedTodo
            ).toBeNull();

        }
    );


    // ============================================================
    // DELETE NON-EXISTING TODO
    // ============================================================

    test(
        'DELETE /todos/:id should return false when todo does not exist with valid CSRF token',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            const csrfToken =
                await login(
                    agent,
                    user
                );


            const response =
                await agent
                    .delete(
                        '/todos/999999'
                    )
                    .set(
                        'x-csrf-token',
                        csrfToken
                    );


            expect(
                response.statusCode
            ).toBe(200);


            expect(
                response.body
            ).toBe(false);

        }
    );


    // ============================================================
    // USER OWNERSHIP
    // ============================================================

    test(
        'User should not be able to update another user todo',
        async () => {

            const user1 =
                await createTestUser(
                    'first@example.com'
                );


            const user2 =
                await createTestUser(
                    'second@example.com'
                );


            const agent =
                request.agent(app);


            const csrfToken =
                await login(
                    agent,
                    user1
                );


            const todo =
                await Todo.create({

                    title:
                        'Another User Todo',

                    dueDate:
                        '2026-09-20',

                    completed:
                        false,

                    user_id:
                        user2.id

                });


            const response =
                await agent
                    .put(
                        `/todos/${todo.id}`
                    )
                    .set(
                        'x-csrf-token',
                        csrfToken
                    )
                    .send({

                        completed:
                            true

                    });


            expect([
                403,
                404
            ]).toContain(
                response.statusCode
            );


            const unchangedTodo =
                await Todo.findByPk(
                    todo.id
                );


            expect(
                unchangedTodo
            ).not.toBeNull();


            expect(
                unchangedTodo.completed
            ).toBe(false);

        }
    );


    // ============================================================
    // CSRF TOKEN GENERATION
    // ============================================================

    test(
        'GET /todos should generate a CSRF token',
        async () => {

            const user =
                await createTestUser();


            const agent =
                request.agent(app);


            await login(
                agent,
                user
            );


            const response =
                await agent.get(
                    '/todos'
                );


            expect(
                response.statusCode
            ).toBe(200);


            expect(
                response.text
            ).toMatch(
                /const csrfToken\s*=\s*['"]([^'"]+)['"]/
            );

        }
    );

});