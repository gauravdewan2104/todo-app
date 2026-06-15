// Import the Supabase client from the CDN (ESM build).
// Because index.html loads this file with <script type="module">,
// the browser allows this import statement and fetches Supabase
// directly from the CDN — no npm or build step needed.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// ─────────────────────────────────────────────────────────
//  SUPABASE CONNECTION
//  These two values are visible to anyone who views the page
//  source — that is intentional and safe. SUPABASE_KEY is a
//  "publishable" (anon) key, designed to be public. Supabase's
//  Row Level Security policies on the server decide what this
//  key is actually allowed to do. Never paste a secret or
//  service-role key here.
// ─────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://pettsbkyhcbgavjnibhz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_JeHRddt9H4dtgeUxKGLUFQ_e5JUOk4j'

// createClient returns an object we use for every DB operation.
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── DOM REFS ─────────────────────────────────────────────
const taskInput = document.getElementById('task-input')
const addBtn    = document.getElementById('add-btn')
const taskList  = document.getElementById('task-list')
const counter   = document.getElementById('counter')
const emptyMsg  = document.getElementById('empty-msg')
const errorMsg  = document.getElementById('error-msg')

// ─── ERROR BANNER ─────────────────────────────────────────
// Show or hide the "Couldn't reach the database" message.
function showError() { errorMsg.style.display = 'block' }
function hideError() { errorMsg.style.display = 'none'  }

// ─── RENDER ───────────────────────────────────────────────
// Rebuild the task list from an array of task objects.
// Called after every successful database operation.
function render(tasks) {
  taskList.innerHTML = ''

  if (tasks.length === 0) {
    emptyMsg.style.display = 'block'
    counter.textContent = ''
    return
  }

  emptyMsg.style.display = 'none'

  const remaining = tasks.filter(t => !t.done).length
  counter.textContent = remaining === 1 ? '1 task left' : `${remaining} tasks left`

  tasks.forEach(task => {
    const li = document.createElement('li')
    li.className = 'task-item' + (task.done ? ' done' : '')

    const checkbox = document.createElement('input')
    checkbox.type    = 'checkbox'
    checkbox.checked = task.done
    // Pass the new desired state explicitly — avoids reading stale DOM state
    checkbox.addEventListener('change', () => toggleDone(task.id, !task.done))

    const label = document.createElement('span')
    label.className   = 'task-label'
    label.textContent = task.text

    const deleteBtn = document.createElement('button')
    deleteBtn.className   = 'delete-btn'
    deleteBtn.textContent = '×'
    deleteBtn.title       = 'Delete task'
    deleteBtn.addEventListener('click', () => deleteTask(task.id))

    li.appendChild(checkbox)
    li.appendChild(label)
    li.appendChild(deleteBtn)
    taskList.appendChild(li)
  })
}

// ─── LOAD & RENDER ────────────────────────────────────────
// Fetch every row from the "tasks" table (oldest first) and render.
// This is the central refresh — every write operation calls it
// afterwards so the UI always matches what's in the database.
async function loadAndRender() {
  // "await" pauses here until Supabase responds over the network.
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.log('Could not load tasks:', error)
    showError()
    return
  }

  hideError()
  render(data) // data is the array of rows Supabase returned
}

// ─── ACTIONS ──────────────────────────────────────────────

// Insert a new row into "tasks", then reload the full list.
async function addTask() {
  const text = taskInput.value.trim()
  if (!text) return

  // Wait for the network: send the new task to Supabase.
  const { error } = await supabase
    .from('tasks')
    .insert({ text, done: false })
    // id and created_at are filled in automatically by the database

  if (error) {
    console.log('Could not add task:', error)
    showError()
    return
  }

  taskInput.value = ''
  taskInput.focus()
  // Re-fetch so the new row's real id and created_at are used in the UI.
  await loadAndRender()
}

// Update the "done" column for a single row, then reload.
async function toggleDone(id, newDone) {
  // Wait for the network: update just this row's done field.
  const { error } = await supabase
    .from('tasks')
    .update({ done: newDone })
    .eq('id', id) // .eq means "WHERE id = ..." — targets only this row

  if (error) {
    console.log('Could not update task:', error)
    showError()
    return
  }

  await loadAndRender()
}

// Delete a single row from "tasks", then reload.
async function deleteTask(id) {
  // Wait for the network: remove this row from the database.
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    console.log('Could not delete task:', error)
    showError()
    return
  }

  await loadAndRender()
}

// ─── EVENTS ───────────────────────────────────────────────
addBtn.addEventListener('click', addTask)

taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask()
})

// ─── INIT ─────────────────────────────────────────────────
// Fetch and display tasks from the database as soon as the page loads.
loadAndRender()
