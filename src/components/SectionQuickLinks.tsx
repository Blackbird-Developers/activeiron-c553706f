import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SectionLink {
  id: string;
  label: string;
  color?: string;
}

interface SectionQuickLinksProps {
  sections: SectionLink[];
}

export function SectionQuickLinks({ sections }: SectionQuickLinksProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {sections.map(({ id, label, color }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
            activeId === id
              ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
              : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
          )}
          style={activeId === id && color ? { 
            backgroundColor: `${color}15`, 
            borderColor: `${color}40`,
            color 
          } : undefined}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
