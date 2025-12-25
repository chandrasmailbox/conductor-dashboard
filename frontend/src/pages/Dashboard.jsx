import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Header from "../components/Header";
import RepoInput from "../components/RepoInput";
import ProgressOverview from "../components/ProgressOverview";
import StageTimeline from "../components/StageTimeline";
import TaskTable from "../components/TaskTable";
import ActivityFeed from "../components/ActivityFeed";
import CompletionChart from "../components/CompletionChart";
import EmptyState from "../components/EmptyState";

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repoUrl, setRepoUrl] = useState("https://github.com/chandrasmailbox/conductor-todo");

  const analyzeRepo = async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/api/repo/analyze`, {
        repo_url: url,
      });
      setProgress(response.data);
      toast.success("Repository analyzed successfully");
    } catch (err) {
      const message = err.response?.data?.detail || "Failed to analyze repository";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = () => {
    if (repoUrl) {
      analyzeRepo(repoUrl);
    }
  };

  const handleRepoSubmit = (url) => {
    setRepoUrl(url);
    analyzeRepo(url);
  };

  // Auto-load on mount with default repo
  useEffect(() => {
    if (repoUrl) {
      analyzeRepo(repoUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      <Header onSync={handleSync} loading={loading} hasData={!!progress} />
      
      <main className="container mx-auto px-6 md:px-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Repo Input - Full Width */}
          <div className="col-span-12">
            <RepoInput 
              onSubmit={handleRepoSubmit} 
              loading={loading} 
              defaultValue={repoUrl}
            />
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-12 flex items-center justify-center py-20"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground">Analyzing repository...</p>
                </div>
              </motion.div>
            ) : error && !progress ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-12"
              >
                <EmptyState 
                  title="Unable to analyze repository"
                  description={error}
                  showRetry
                  onRetry={handleSync}
                />
              </motion.div>
            ) : progress ? (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6"
              >
                {/* Progress Overview - Left Side */}
                <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-6">
                  <ProgressOverview progress={progress} />
                  <CompletionChart progress={progress} />
                </div>

                {/* Stage Timeline - Right Side */}
                <div className="col-span-12 md:col-span-8 lg:col-span-9">
                  <StageTimeline phases={progress.phases} />
                </div>

                {/* Task Table - Bottom Left */}
                <div className="col-span-12 lg:col-span-8">
                  <TaskTable phases={progress.phases} />
                </div>

                {/* Activity Feed - Bottom Right */}
                <div className="col-span-12 lg:col-span-4">
                  <ActivityFeed commits={progress.commits} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-12"
              >
                <EmptyState 
                  title="No repository analyzed"
                  description="Enter a GitHub repository URL above to analyze its Conductor progress."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
