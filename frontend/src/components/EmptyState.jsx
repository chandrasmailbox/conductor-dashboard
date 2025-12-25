import { FolderSearch, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export default function EmptyState({ 
  title = "No data", 
  description = "No data available.", 
  showRetry = false, 
  onRetry 
}) {
  return (
    <Card className="border relative overflow-hidden" data-testid="empty-state">
      {/* Background texture */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1709334197341-122c6fd5ae1d?crop=entropy&cs=srgb&fm=jpg&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <CardContent className="relative flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <FolderSearch className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
        
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
