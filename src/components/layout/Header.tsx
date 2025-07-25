import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from "../ui/ThemeToggle";
import { useAuthStore } from '../../stores/useAuthStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { Button } from '../ui/Button';

export default function Header() {
  const { user, logout } = useAuthStore();
  const clearTasks = useTaskStore((state) => state.clearStore);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearTasks();
    navigate('/');
  };

  return (
    <header className="border-b bg-card">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to={user ? "/dashboard" : "/"} className="font-bold text-xl text-card-foreground">📋 Tasker</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm font-medium hidden sm:inline">{user.email}</span>
              <Button variant="ghost" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium hover:underline">Login</Link>
              <Link to="/signup" className="text-sm font-medium hover:underline">Sign Up</Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}