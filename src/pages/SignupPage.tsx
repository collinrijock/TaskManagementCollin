import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import api from '../lib/api';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { useTaskStore } from '../stores/useTaskStore';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { setTaskLists, clearStore } = useTaskStore((state) => ({
    setTaskLists: state.setTaskLists,
    clearStore: state.clearStore,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/signup', {
        email,
        password,
        createdAt: new Date().toISOString(),
      });

      const { user, taskList } = response.data;

      // Clear any data from a previous session before logging in
      clearStore();

      // Log the user in and set their initial task list
      login(user);
      setTaskLists([taskList]);

      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(err.response.data.message || 'Failed to sign up.');
        } else if (err.request) {
          setError('Signup service not found. Is the server running?');
        } else {
          setError('An unexpected error occurred during signup.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    }
  };

  return (
    <div className="min-h-[90vh] grid place-items-center p-4 bg-[radial-gradient(var(--color-secondary)_1px,transparent_0)] [background-size:16px_16px]">
      <div className="container p-4 md:p-8 max-w-md">
        <h1 className="text-4xl font-bold mb-4">Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-card text-card-foreground border-input"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md bg-card text-card-foreground border-input"
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>
        <p className="text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}