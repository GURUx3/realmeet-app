import { type VariantProps } from "class-variance-authority";
import { ArrowRightIcon } from "lucide-react";
import { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import { Badge } from "../../ui/badge";
import { Button, buttonVariants } from "../../ui/button";
import Glow from "../../ui/glow";
import { Mockup, MockupFrame } from "../../ui/mockup";
import Screenshot from "../../ui/screenshot";
import { Section } from "../../ui/section";

interface HeroButtonProps {
  href: string;
  text: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  icon?: ReactNode;
  iconRight?: ReactNode;
}

interface HeroProps {
  title?: string;
  description?: string;
  mockup?: ReactNode | false;
  badge?: ReactNode | false;
  buttons?: HeroButtonProps[] | false;
  className?: string;
}

export default function Hero({
  title = "Meetings that actually lead to decisions.",
  description = "Plan discussions with clear agendas, make decisions through structured voting, and keep outcomes documented — all in one shared workspace.",
  mockup = (
    <Screenshot
      srcLight="/dashboard-light.png"
      srcDark="/dashboard-dark.png"
      alt="RealMeet dashboard preview"
      width={1248}
      height={765}
      className="w-full"
    />
  ),
  badge = (
    <Badge variant="outline" className="animate-appear">
      <span className="text-muted-foreground text-xs">
        Introducing RealMeet
      </span>
    </Badge>
  ),
  buttons = [
    {
      href: "/dashboard",
      text: "Get Started",
      variant: "default",
    },
  ],
  className,
}: HeroProps) {
  return (
    <Section
      className={cn(
        "fade-bottom overflow-hidden pb-0 sm:pb-0 md:pb-0",
        className,
      )}
    >
      <div className="max-w-container mx-auto flex flex-col gap-12 pt-16 sm:gap-20">
        <div className="flex flex-col items-center gap-5 text-center sm:gap-8">
          {badge !== false && badge}

          <h1 className="animate-appear relative z-10 bg-linear-to-r from-foreground to-foreground dark:to-muted-foreground bg-clip-text text-transparent text-4xl leading-tight font-semibold text-balance drop-shadow-2xl sm:text-6xl md:text-7xl">
            {title}
          </h1>

          <p className="animate-appear relative z-10 max-w-[640px] text-sm leading-relaxed font-medium text-muted-foreground opacity-0 delay-100 sm:text-base">
            {description}
          </p>

          {buttons !== false && buttons.length > 0 && (
            <div className="animate-appear relative z-10 flex gap-4 opacity-0 delay-300">
              {buttons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.variant ?? "default"}
                  size="lg"
                  asChild
                >
                  <a href={button.href}>
                    {button.icon}
                    {button.text}
                    {button.iconRight}
                  </a>
                </Button>
              ))}
            </div>
          )}

          {mockup !== false && (
            <div className="relative w-full pt-12">
              <MockupFrame
                size="small"
                className="animate-appear opacity-0 delay-700"
              >
                <Mockup
                  type="responsive"
                  className="w-full rounded-xl border-0 bg-background/90"
                >
                  {mockup}
                </Mockup>
              </MockupFrame>
              <Glow
                variant="top"
                className="animate-appear-zoom opacity-0 delay-1000"
              />
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
