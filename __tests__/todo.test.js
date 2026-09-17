const TodoList = require("../todo");

describe("Todo List", () => {
  let todoList;

  beforeEach(() => {
    todoList = new TodoList();
  });

  test("should create a new todo", () => {
    const todo = todoList.addTodo("Complete assignment", "2026-09-20");

    expect(todo.title).toBe("Complete assignment");
    expect(todo.completed).toBe(false);
  });

  test("should mark a todo as completed", () => {
    const todo = todoList.addTodo("Complete assignment", "2026-09-20");

    todoList.completeTodo(todo.id);

    expect(todo.completed).toBe(true);
  });

  test("should retrieve overdue items", () => {
    todoList.addTodo("Overdue task", "2026-09-15");
    todoList.addTodo("Future task", "2026-09-20");

    const overdueItems = todoList.getOverdueItems(
      new Date("2026-09-17")
    );

    expect(overdueItems).toHaveLength(1);
    expect(overdueItems[0].title).toBe("Overdue task");
  });

  test("should retrieve items due today", () => {
    todoList.addTodo("Today's task", "2026-09-17");
    todoList.addTodo("Future task", "2026-09-20");

    const dueTodayItems = todoList.getDueTodayItems(
      new Date("2026-09-17")
    );

    expect(dueTodayItems).toHaveLength(1);
    expect(dueTodayItems[0].title).toBe("Today's task");
  });

  test("should retrieve items due later", () => {
    todoList.addTodo("Today's task", "2026-09-17");
    todoList.addTodo("Future task", "2026-09-20");

    const dueLaterItems = todoList.getDueLaterItems(
      new Date("2026-09-17")
    );

    expect(dueLaterItems).toHaveLength(1);
    expect(dueLaterItems[0].title).toBe("Future task");
  });
});