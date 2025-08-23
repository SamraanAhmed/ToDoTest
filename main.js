const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

// Load saved tasks
document.addEventListener("DOMContentLoaded", loadTasks);

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addTask();
  }
});

function addTask() {
  const taskText = taskInput.value.trim();
  if (!taskText) return;

  createTaskElement(taskText, false);
  taskInput.value = "";
  saveTasks();
}

function createTaskElement(taskText, completed = false) {
  const li = document.createElement("li");
  if (completed) li.classList.add("completed");

  const span = document.createElement("span");
  span.textContent = taskText;
  span.classList.add("task-text");
  span.addEventListener("click", () => {
    li.classList.toggle("completed");
    saveTasks();
  });

  const buttonContainer = document.createElement("div");
  buttonContainer.classList.add("task-buttons");

  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.classList.add("edit");
  editBtn.addEventListener("click", () => editTask(li, span));

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.classList.add("delete");
  deleteBtn.addEventListener("click", () => {
    li.remove();
    saveTasks();
  });

  buttonContainer.appendChild(editBtn);
  buttonContainer.appendChild(deleteBtn);
  li.appendChild(span);
  li.appendChild(buttonContainer);
  taskList.appendChild(li);

  return li;
}

function editTask(li, span) {
  const currentText = span.textContent;
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentText;
  input.classList.add("edit-input");

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "✓";
  saveBtn.classList.add("save");
  saveBtn.title = "Save (Enter)";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "✕";
  cancelBtn.classList.add("cancel");
  cancelBtn.title = "Cancel (Escape)";

  const editActions = document.createElement("div");
  editActions.classList.add("edit-actions");
  editActions.appendChild(saveBtn);
  editActions.appendChild(cancelBtn);

  const editContainer = document.createElement("div");
  editContainer.classList.add("edit-container");
  editContainer.appendChild(input);
  editContainer.appendChild(editActions);

  // Add editing class and hide task buttons
  li.classList.add("editing");
  const taskButtons = li.querySelector(".task-buttons");
  taskButtons.style.display = "none";

  // Replace span with edit container
  li.replaceChild(editContainer, span);

  // Focus and select input with slight delay for better UX
  setTimeout(() => {
    input.focus();
    input.select();
  }, 50);

  function saveEdit() {
    const newText = input.value.trim();
    if (newText && newText !== currentText) {
      span.textContent = newText;
      saveTasks();
    }
    exitEditMode();
  }

  function cancelEdit() {
    exitEditMode();
  }

  function exitEditMode() {
    li.classList.remove("editing");
    taskButtons.style.display = "flex";
    li.replaceChild(span, editContainer);
  }

  saveBtn.addEventListener("click", saveEdit);
  cancelBtn.addEventListener("click", cancelEdit);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  });

  // Auto-save if user clicks outside (blur event)
  input.addEventListener("blur", (e) => {
    // Small delay to allow clicking save/cancel buttons
    setTimeout(() => {
      if (li.classList.contains("editing")) {
        saveEdit();
      }
    }, 150);
  });
}

function saveTasks() {
  const tasks = [];
  taskList.querySelectorAll("li").forEach(li => {
    const textElement = li.querySelector(".task-text");
    if (textElement) {
      tasks.push({
        text: textElement.textContent,
        completed: li.classList.contains("completed")
      });
    }
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem("tasks")) || [];
  saved.forEach(task => {
    createTaskElement(task.text, task.completed);
  });
}
