import { useState } from "react";
import { Search, Github } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export default function RepoInput({ onSubmit, loading, defaultValue = "" }) {
  const [url, setUrl] = useState(defaultValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <Card 
      className="border overflow-hidden relative"
      data-testid="repo-input-card"
    >
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1648611648035-805e9ae87437?crop=entropy&cs=srgb&fm=jpg&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <CardContent className="p-6 relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Github className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Connect Repository</h2>
            <p className="text-sm text-muted-foreground">
              Enter a public GitHub repository URL to analyze Conductor progress
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" 
              strokeWidth={1.5}
            />
            <Input
              type="text"
              placeholder="https://github.com/owner/repository"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 h-11"
              data-testid="repo-url-input"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading || !url.trim()}
            className="h-11 px-6"
            data-testid="analyze-button"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
