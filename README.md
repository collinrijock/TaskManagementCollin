# Tasker - A Full-Stack Task Management App

- **Tech Stack:** On the frontend we use React with TypeScript, and on the backend we use a super barebones Express server. For styling I chose Tailwind CSS since I'm very familiar with it and it lets me build out the UI flexibly and quickly. Ideally I would build out my own components system with Tailwind to minimize the total amount of CSS I have to write, in this repo I ended up doing that with a button component.
- **User Authentication:** The auth is  simple, only authenticating at the login step. We use bcrypt to store encrypted passwords in the db.
- **Task Management:** Create, read, update, and delete tasks.
- **Task Lists:** We use a task list to abstract the todo list away from the user.
- **Task Statuses:** Cycle tasks through 'incomplete', 'pending', and 'complete' states.
- **Drag & Drop:** You can drag and drop tasks to reorder them.
- **Search & Filter:** Search tasks by title, description, status, or filter by tags.
- **Light & Dark Mode:** Super easy to implement with tailwind 3.x, just brought over a hook I use across all my projects.
- **Responsive Design:** Works on desktop and mobile. Added padding to the bottom for onscreen keyboards on phones.
- **State Management:** We use Zustand for state management, which is simple and I like the syntax. Using hooks for everything is a nice way to keep the code clean and easy to read. We use a custom hook for the auth state, and a custom hook for the task state.
- **TypeScript:** Using full stack TypeScript for the frontend and backend is a great idea, especially in a monorepo where you no longer have to write types in 2 places. However, for the sake of time I just used JS on the backend and TS on the frontend. Ideally the backend would also be TS and consume the same types as the frontend.
- **Testing:** We use Jest for unit testing, and I'm familiar with the library and like incorporating it into my github workflows. I didnt get to e2e tests, I wouldve used Playwright for that. Our unit tests are simple and leverage the zustand store hooks to test the state changes. Ideally the tests have nothing to do with the frontend and just ping our backend APIs but I did this for time. I wouldnt do this in a real project since the state management in the frontend should be completely decoupled from the backend, and the purpose of the unit tests is to ensure the robustness of the backend.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/collinrijock/TaskManagementCollin.git
    cd TaskManagementCollin
    ```

2.  **Install dependencies:**
    This will install both frontend and backend dependencies listed in `package.json`.

    ```bash
    npm install
    ```

3.  **Run the development servers:**
    This command will runt both the backend Express server and the frontend Vite development server concurrently.

    ```bash
    npm start
    ```

4.  **Open the app:**
    Open your browser and open the URL (`http://localhost:5173`). You should see the Tasker landing page.

**Running tests:**

```bash
npm run test
```
