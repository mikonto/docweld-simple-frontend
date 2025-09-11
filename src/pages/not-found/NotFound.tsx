import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Displays a 404 error page when users navigate to non-existent routes
export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-main-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            404 - Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-center">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => navigate('/')} className="w-full">
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}