import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-[90vh] grid place-items-center text-center p-4 bg-[radial-gradient(var(--color-secondary)_1px,transparent_0)] [background-size:16px_16px]">
      <div>
        <h1 className="text-5xl md:text-6xl font-bold">Welcome to Tasker</h1>
        <p className="mt-4 text-lg md:text-xl text-foreground/80 max-w-2xl">
          The simple, fun, and effective way to manage your daily tasks. Get organized and boost your productivity.
        </p>
        <div className="mt-8">
          <Button variant="accent" size="lg">
            <Link to="/signup">Get Started for Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}