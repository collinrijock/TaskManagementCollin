import { Moon, Sun } from 'lucide-react';
import { Button } from './Button';
import useDarkMode from '../../hooks/useDarkMode';
import { cn } from '../../lib/utils';

export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useDarkMode();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className={cn(
        "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all",
        darkMode && "-rotate-90 scale-0"
      )} />
      <Moon className={cn(
        "absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all",
        darkMode && "rotate-0 scale-100"
      )} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}