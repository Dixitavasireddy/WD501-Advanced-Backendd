class TodoList {
  constructor() {
    this.todos = [];
  }

  addTodo(title, dueDate) {
    const todo = {
      id: this.todos.length + 1,
      title: title,
      completed: false,
      dueDate: new Date(dueDate),
    };

    this.todos.push(todo);
    return todo;
  }

  completeTodo(id) {
    const todo = this.todos.find((todo) => todo.id === id);

    if (todo) {
      todo.completed = true;
    }

    return todo;
  }

  getOverdueItems(today = new Date()) {
    return this.todos.filter(
      (todo) => !todo.completed && todo.dueDate < today
    );
  }

  getDueTodayItems(today = new Date()) {
    return this.todos.filter(
      (todo) =>
        !todo.completed &&
        todo.dueDate.toDateString() === today.toDateString()
    );
  }

  getDueLaterItems(today = new Date()) {
    return this.todos.filter(
      (todo) => !todo.completed && todo.dueDate > today
    );
  }

  toDisplayableList() {
    return this.todos.map((todo) => ({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      dueDate: todo.dueDate.toDateString(),
    }));
  }
}

module.exports = TodoList;