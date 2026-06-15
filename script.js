// ─────────────────────────────────────────────────────────
//  WHERE STATE LIVES
//  `tasks` is the single source of truth — an array of
//  objects shaped like: { id, text, done }
//  Every change updates this array, saves it to
//  localStorage, then calls render() to rebuild the DOM.
// ─────────────────────────────────────────────────────────

// Load tasks from localStorage, or start with an empty array
// if the user has never been here before.
let tasks = loadTasks();

// Grab references to the DOM elements we'll use repeatedly.
const taskInput = document.getElementById('task-input');
const addBtn    = document.getElementById('add-btn');
const taskList  = document.getElementById('task-list');
const counter   = document.getElementById('counter');
const emptyMsg  = document.getElementById('empty-msg');


// ─── LOAD / SAVE ──────────────────────────────────────────

// Read the task array from localStorage.
// JSON.parse converts the stored string back into a JS array.
// If nothing is stored yet, return an empty array.
function loadTasks() {
  const stored = localStorage.getItem('tasks');
  return stored ? JSON.parse(stored) : [];
}

// Write the current task array into localStorage.
// JSON.stringify converts the array into a string (localStorage
// can only hold strings, not complex objects).
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}


// ─── RENDER ───────────────────────────────────────────────

// Rebuild the entire list from the `tasks` array.
// Called after every change so the UI always matches state.
function render() {
  // Clear whatever is currently in the list.
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    // No tasks — show the empty-state message, hide the counter.
    emptyMsg.style.display = 'block';
    counter.textContent = '';
    return;
  }

  // We have tasks — hide the empty-state message.
  emptyMsg.style.display = 'none';

  // Count how many tasks are NOT yet done.
  const remaining = tasks.filter(t => !t.done).length;
  counter.textContent = remaining === 1
    ? '1 task left'
    : `${remaining} tasks left`;

  // Build a <li> element for each task and add it to the list.
  tasks.forEach(task => {
    // Create the <li> and mark it as done if needed.
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id; // store the task id on the element

    // Checkbox — checked state mirrors task.done.
    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.done;
    // When the checkbox is toggled, call toggleDone with this task's id.
    checkbox.addEventListener('change', () => toggleDone(task.id));

    // Label — the task text.
    const label = document.createElement('span');
    label.className   = 'task-label';
    label.textContent = task.text;

    // Delete button — calls deleteTask with this task's id.
    const deleteBtn = document.createElement('button');
    deleteBtn.className   = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title       = 'Delete task';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    // Assemble the pieces and add to the list.
    li.appendChild(checkbox);
    li.appendChild(label);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}


// ─── ACTIONS ──────────────────────────────────────────────

// Read the input, create a new task object, add it to the
// array, save, and re-render.
function addTask() {
  const text = taskInput.value.trim(); // remove leading/trailing whitespace
  if (!text) return; // do nothing if the input is blank

  // Each task needs a unique id. Date.now() gives us a
  // millisecond timestamp — good enough for a simple app.
  const newTask = {
    id:   Date.now(),
    text: text,
    done: false,
  };

  tasks.push(newTask);
  saveTasks();
  render();

  // Clear the input and return focus to it for quick entry.
  taskInput.value = '';
  taskInput.focus();
}

// Flip the `done` flag of the task with the given id,
// then save and re-render.
function toggleDone(id) {
  // Find the task in the array and flip its done flag.
  tasks = tasks.map(task =>
    task.id === id ? { ...task, done: !task.done } : task
  );
  saveTasks();
  render();
}

// Remove the task with the given id from the array,
// then save and re-render.
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  render();
}


// ─── EVENT LISTENERS ──────────────────────────────────────

// "Add" button click → add the task.
addBtn.addEventListener('click', addTask);

// Pressing Enter inside the input → add the task.
taskInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    addTask();
  }
});


// ─── INITIAL RENDER ───────────────────────────────────────

// Run once when the page loads to show any saved tasks.
render();
