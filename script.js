import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// These values are visible in the browser — that is safe for a publishable
// (anon) key. Supabase Row Level Security on the server controls what this
// key can actually read or write. Never put a secret/service-role key here.
const SUPABASE_URL = 'https://pettsbkyhcbgavjnibhz.supabase.co'
const SUPABASE_KEY = 'sb_publishable_JeHRddt9H4dtgeUxKGLUFQ_e5JUOk4j'

// The URL Supabase redirects back to after a successful Google login.
// Must match one of the "Redirect URLs" you add in your Supabase dashboard
// under Authentication → URL Configuration.
const SITE_URL = 'https://gauravdewan2104.github.io/todo-app'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─────────────────────────────────────────────────────────
//  DOM REFS — AUTH SCREEN
// ─────────────────────────────────────────────────────────
const authScreen   = document.getElementById('auth-screen')
const appScreen    = document.getElementById('app-screen')
const authEmail    = document.getElementById('auth-email')
const authPassword = document.getElementById('auth-password')
const loginBtn     = document.getElementById('login-btn')
const signupBtn    = document.getElementById('signup-btn')
const googleBtn    = document.getElementById('google-btn')
const authMsg      = document.getElementById('auth-msg')

// ─────────────────────────────────────────────────────────
//  DOM REFS — APP SCREEN
// ─────────────────────────────────────────────────────────
const userEmailSpan = document.getElementById('user-email')
const logoutBtn     = document.getElementById('logout-btn')
const taskInput     = document.getElementById('task-input')
const addBtn        = document.getElementById('add-btn')
const taskList      = document.getElementById('task-list')
const counter       = document.getElementById('counter')
const emptyMsg      = document.getElementById('empty-msg')
const errorMsg      = document.getElementById('error-msg')

// ─────────────────────────────────────────────────────────
//  SCREEN SWITCHING
//  These two functions are the only place that shows/hides
//  the auth screen vs the app screen.
// ─────────────────────────────────────────────────────────

// Show the login/signup form; clear any leftover message.
function showAuthScreen() {
  authScreen.style.display = 'block'
  appScreen.style.display  = 'none'
  authMsg.textContent      = ''
}

// Hide the login form and show the todo app.
// user is the Supabase user object; we use user.email for the user bar.
function showAppScreen(user) {
  authScreen.style.display    = 'none'
  appScreen.style.display     = 'block'
  userEmailSpan.textContent   = user.email
  loadAndRender() // fetch this user's tasks now that we know who they are
}

// ─────────────────────────────────────────────────────────
//  AUTH STATE HANDLER
//  Called once on page load (from getSession) and again
//  any time auth changes (from onAuthStateChange).
//  session is null when logged out, or holds user info when logged in.
// ─────────────────────────────────────────────────────────
function handleAuthState(session) {
  if (session) {
    showAppScreen(session.user)
  } else {
    showAuthScreen()
  }
}

// ─────────────────────────────────────────────────────────
//  AUTH ACTIONS
// ─────────────────────────────────────────────────────────

// Create a new account. Supabase sends a confirmation email
// unless your project has email confirmation disabled.
async function signUp() {
  const email    = authEmail.value.trim()
  const password = authPassword.value
  if (!email || !password) {
    setAuthMsg('Please enter an email and password.', true)
    return
  }

  setAuthMsg('') // clear any previous message

  // Wait for the network: create the account in Supabase Auth.
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    setAuthMsg(error.message, true)
    return
  }

  // If email confirmation is required, the user must verify before logging in.
  setAuthMsg('Account created! Check your email to confirm, then log in.')
}

// Verify credentials and start a session.
async function signIn() {
  const email    = authEmail.value.trim()
  const password = authPassword.value
  if (!email || !password) {
    setAuthMsg('Please enter an email and password.', true)
    return
  }

  setAuthMsg('')

  // Wait for the network: check credentials and get back a session.
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    setAuthMsg(error.message, true)
    // On success we do NOT manually call showAppScreen here —
    // onAuthStateChange fires automatically and calls handleAuthState for us.
  }
}

// Redirect the browser to Google's login page.
// When Google is done authenticating the user, it redirects back to
// SITE_URL. Supabase intercepts that redirect, exchanges the code for
// a session, then fires onAuthStateChange — which calls handleAuthState,
// which calls showAppScreen. No extra code needed here to handle the return.
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: SITE_URL },
  })
  if (error) setAuthMsg(error.message, true)
}

// End the current session on Supabase's servers and locally.
async function signOut() {
  // Wait for the network: invalidate the session token.
  const { error } = await supabase.auth.signOut()
  if (error) console.log('Sign-out error:', error)
  // onAuthStateChange fires next, which calls showAuthScreen() for us.
}

// Small helper so we don't repeat the color-setting logic.
// isError=true makes the message red; false makes it grey.
function setAuthMsg(text, isError = false) {
  authMsg.textContent  = text
  authMsg.style.color  = isError ? '#e53e3e' : '#555'
}

// ─────────────────────────────────────────────────────────
//  TASK ERROR BANNER
// ─────────────────────────────────────────────────────────
function showError() { errorMsg.style.display = 'block' }
function hideError() { errorMsg.style.display = 'none'  }

// ─────────────────────────────────────────────────────────
//  RENDER
//  Builds the task list from an array of rows returned by Supabase.
// ─────────────────────────────────────────────────────────
function render(tasks) {
  taskList.innerHTML = ''

  if (tasks.length === 0) {
    emptyMsg.style.display = 'block'
    counter.textContent    = ''
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

// ─────────────────────────────────────────────────────────
//  LOAD & RENDER
//  Fetches all tasks the logged-in user is allowed to see.
//  RLS on the server automatically filters rows by user_id —
//  we never pass user_id in the query ourselves.
// ─────────────────────────────────────────────────────────
async function loadAndRender() {
  // Wait for the network: Supabase returns only this user's rows (RLS enforces it).
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
  render(data)
}

// ─────────────────────────────────────────────────────────
//  TASK ACTIONS
//  user_id is NOT set manually here. The database column has
//  a DEFAULT of auth.uid() so Supabase fills it in from the
//  active session automatically. RLS then uses that column to
//  prevent any user from reading or writing another's rows.
// ─────────────────────────────────────────────────────────

async function addTask() {
  const text = taskInput.value.trim()
  if (!text) return

  // Wait for the network: insert one new row (user_id filled by DB default).
  const { error } = await supabase
    .from('tasks')
    .insert({ text, done: false })

  if (error) {
    console.log('Could not add task:', error)
    showError()
    return
  }

  taskInput.value = ''
  taskInput.focus()
  await loadAndRender()
}

async function toggleDone(id, newDone) {
  // Wait for the network: update just this row's done field.
  const { error } = await supabase
    .from('tasks')
    .update({ done: newDone })
    .eq('id', id)

  if (error) {
    console.log('Could not update task:', error)
    showError()
    return
  }

  await loadAndRender()
}

async function deleteTask(id) {
  // Wait for the network: remove the row. RLS ensures you can only
  // delete your own rows even if someone tampers with the id.
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

// ─────────────────────────────────────────────────────────
//  EVENTS
// ─────────────────────────────────────────────────────────
loginBtn.addEventListener('click', signIn)
signupBtn.addEventListener('click', signUp)
googleBtn.addEventListener('click', signInWithGoogle)
logoutBtn.addEventListener('click', signOut)

addBtn.addEventListener('click', addTask)
taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask()
})

// ─────────────────────────────────────────────────────────
//  INIT
//  Two calls work together to cover all cases:
//
//  1. onAuthStateChange — registers a listener that fires
//     every time auth state changes in the future: login,
//     logout, or a silent token refresh while the tab is open.
//
//  2. getSession — checks immediately whether a saved session
//     exists in localStorage (Supabase stores it there
//     automatically). This handles the "came back after closing
//     the tab" case before the listener has had a chance to fire.
// ─────────────────────────────────────────────────────────

// Listen for future auth events.
supabase.auth.onAuthStateChange((_event, session) => {
  handleAuthState(session)
})

// Check for an existing session right now, on page load.
// Wait for the network: Supabase verifies the stored token is still valid.
supabase.auth.getSession().then(({ data: { session } }) => {
  handleAuthState(session)
})
