import { Link } from 'react-router-dom';
import { Brand, Button } from '../../components/ui';

export default function Unauthorized() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <Brand className="text-4xl text-forest" />
        <h1 className="mt-8 font-display text-3xl font-bold">You do not have access to this page</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-mute">Your role does not include this area. Return to your workspace or sign in with a different account.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/dashboard"><Button>Back to workspace</Button></Link>
          <Link to="/login"><Button variant="outline">Sign in</Button></Link>
        </div>
      </div>
    </div>
  );
}
