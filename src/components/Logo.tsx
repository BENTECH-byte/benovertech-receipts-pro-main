import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "light" | "dark";
  showText?: boolean;
};

export const Logo = ({ className, variant = "light", showText = true }: LogoProps) => {
  const textColor = variant === "light" ? "text-foreground" : "text-ink";
  const subColor = variant === "light" ? "text-muted-foreground" : "text-ink/60";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-10 w-10 shrink-0">
        <div className="absolute inset-0 rounded-2xl bg-gradient-gold shadow-gold" />
        <div className="absolute inset-[2px] rounded-[14px] bg-ink flex items-center justify-center">
          <span className="text-gold font-black text-base tracking-tighter display-font">B</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-gradient-purple ring-2 ring-background" />
      </div>
      {showText && (
        <div className="leading-none">
          <div className={cn("text-[13px] font-bold tracking-[0.18em]", textColor)}>BENOVERTECH</div>
          <div className={cn("text-[11px] font-medium tracking-[0.32em]", subColor)}>GADGETS</div>
        </div>
      )}
    </div>
  );
};
