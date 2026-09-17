const argv = require("minimist")(process.argv.slice(2));
const db = require("./models/index");

const markAsComplete = async (id) => {
  try {
    await db.Todo.markAsComplete(id);
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  const { id } = argv;

  if (id === undefined) {
    throw new Error("Need to pass an id");
  }

  const todoId = Number(id);

  if (!Number.isInteger(todoId)) {
    throw new Error("The id needs to be an integer");
  }

  await markAsComplete(todoId);
  await db.Todo.showList();
})();