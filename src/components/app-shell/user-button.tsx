import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@/lib/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Sparkles } from 'lucide-react';

export function UserButton({ afterSignOutUrl = '/' }: { afterSignOutUrl?: string }) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(afterSignOutUrl);
  };

  const initials = user?.firstName
    ? user.firstName.substring(0, 2).toUpperCase()
    : 'IQ';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
        aria-label="User menu"
      >
        <Avatar className="h-9 w-9 border border-border ring-1 ring-primary/20">
          <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="flex flex-col space-y-1 p-2 border-b border-border/60 mb-1">
          <p className="text-sm font-semibold leading-none text-foreground">
            {user?.fullName || 'Candidate'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.primaryEmailAddress?.emailAddress || 'candidate@interviewiq.ai'}
          </p>
        </div>
        <DropdownMenuItem onClick={() => navigate('/dashboard')}>
          <User className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/setup')}>
          <Sparkles className="mr-2 h-4 w-4 text-primary" />
          <span>New Practice Round</span>
        </DropdownMenuItem>
        <div className="my-1 border-t border-border/60" />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
