const todoList = () => {
  const all = [];

  const add = (todoItem) => {
    all.push(todoItem);
  };

  const markAsComplete = (index) => {
    all[index].completed = true;
  };

  const overdue = () => {
    const today = new Date().toISOString().split("T")[0];

    return all.filter((item) => item.dueDate < today);
  };

  const dueToday = () => {
    const today = new Date().toISOString().split("T")[0];

    return all.filter((item) => item.dueDate === today);
  };

  const dueLater = () => {
    const today = new Date().toISOString().split("T")[0];

    return all.filter((item) => item.dueDate > today);
  };

  const toDisplayableList = (list) => {
    return list
      .map((item) => {
        const checkbox = item.completed ? "[x]" : "[ ]";

        if (item.dueDate === new Date().toISOString().split("T")[0]) {
          return `${checkbox} ${item.title}`;
        }

        return `${checkbox} ${item.title} ${item.dueDate}`;
      })
      .join("\n");
  };

  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};

// DO NOT CHANGE ANYTHING BELOW THIS LINE.

const todos = todoList();

const formattedDate = (d) => {
  return d.toISOString().split("T")[0];
};

const dateToday = new Date();

const today = formattedDate(dateToday);

const yesterday = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() - 1)),
);

const tomorrow = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() + 1)),
);

todos.add({
  title: "Submit assignment",
  dueDate: yesterday,
  completed: false,
});

todos.add({
  title: "Pay rent",
  dueDate: today,
  completed: true,
});

todos.add({
  title: "Service Vehicle",
  dueDate: today,
  completed: false,
});

todos.add({
  title: "Pay electric bill",
  dueDate: tomorrow,
  completed: false,
});

console.log("My Todo-list\n\n");

console.log("Overdue");

const overdues = todos.overdue();
const formattedOverdues = todos.toDisplayableList(overdues);

console.log(formattedOverdues);

console.log("\n\n");

console.log("Due Today");

const itemsDueToday = todos.dueToday();
const formattedItemsDueToday = todos.toDisplayableList(itemsDueToday);

console.log(formattedItemsDueToday);

console.log("\n\n");

console.log("Due Later");

const itemsDueLater = todos.dueLater();
const formattedItemsDueLater = todos.toDisplayableList(itemsDueLater);

console.log(formattedItemsDueLater);

console.log("\n\n");