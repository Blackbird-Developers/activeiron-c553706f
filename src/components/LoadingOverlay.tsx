import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

const FUN_FACTS = [
  "The average person spends 2.5 hours on social media daily 📱",
  "Meta ads reach over 3 billion people worldwide 🌍",
  "Video ads have 135% greater organic reach than photo posts 🎬",
  "The best time to post on Facebook is between 1-4 PM ⏰",
  "Instagram Stories have a 78% completion rate 📸",
  "Carousel ads have 72% higher click-through rates 🎠",
  "Mobile accounts for 98.5% of Facebook users 📲",
  "The first Facebook ad was sold in 2004 🚀",
  "Emojis in ads can increase CTR by 25% 😊",
  "Thursday is the best day for B2B Facebook ads 📊",
  "Users spend an average of 33 minutes on Instagram daily ⏱️",
  "Reels get 22% more engagement than standard videos 🎥",
  "80% of Instagram users follow at least one business 🏢",
  "Facebook has over 10 million active advertisers 💼",
  "Ad recall is 23% higher for video ads than static 🧠",
];

interface LoadingOverlayProps {
  isLoading: boolean;
  colorScheme?: "meta" | "google" | "mailchimp" | "shopify" | "default";
}

export function LoadingOverlay({ isLoading, colorScheme = "default" }: LoadingOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));

  // Simulate progress
  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Slow down as we approach 90%
        if (prev >= 90) return prev + 0.5;
        if (prev >= 70) return prev + 1;
        if (prev >= 50) return prev + 2;
        return prev + 3;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Rotate fun facts
  useEffect(() => {
    if (!isLoading) return;

    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 4000);

    return () => clearInterval(factInterval);
  }, [isLoading]);

  // Reset fact on new load
  useEffect(() => {
    if (isLoading) {
      setFactIndex(Math.floor(Math.random() * FUN_FACTS.length));
    }
  }, [isLoading]);

  if (!isLoading && progress >= 100) return null;

  const colorClasses = {
    meta: "bg-meta/20 text-meta-foreground",
    google: "bg-google-ads/20 text-google-ads-foreground",
    mailchimp: "bg-mailchimp/20 text-mailchimp-foreground",
    shopify: "bg-shopify/20 text-shopify-foreground",
    default: "bg-primary/20 text-foreground",
  };

  const progressColorClasses = {
    meta: "[&>div]:bg-meta",
    google: "[&>div]:bg-google-ads",
    mailchimp: "[&>div]:bg-mailchimp",
    shopify: "[&>div]:bg-shopify",
    default: "[&>div]:bg-primary",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
        <div className={`p-4 rounded-full ${colorClasses[colorScheme]}`}>
          <Sparkles className="h-8 w-8 animate-pulse" />
        </div>

        <div className="space-y-2 w-full">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Loading data...</span>
            <span className="font-medium">{Math.min(Math.round(progress), 100)}%</span>
          </div>
          <Progress 
            value={Math.min(progress, 100)} 
            className={`h-2 ${progressColorClasses[colorScheme]}`}
          />
        </div>

        <div className="space-y-2 animate-fade-in" key={factIndex}>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Did you know?</p>
          <p className="text-sm font-medium leading-relaxed">
            {FUN_FACTS[factIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
