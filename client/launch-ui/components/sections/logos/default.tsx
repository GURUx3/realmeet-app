import { ReactNode } from "react";

import { siteConfig } from "@/config/site";

import Figma from "../../logos/figma";
import React from "../../logos/react";
import ShadcnUi from "../../logos/shadcn-ui";
import Tailwind from "../../logos/tailwind";
import TypeScript from "../../logos/typescript";
// import NextJs from "../../logos/nextjs"; // ⬅️
import { Badge } from "../../ui/badge";
import Logo from "../../ui/logo";
import { Section } from "../../ui/section";

interface LogosProps {
  title?: string;
  badge?: ReactNode | false;
  logos?: ReactNode[] | false;
  className?: string;
}

export default function Logos({
  title = "Built with Next.js, Tailwind, and modern frontend tooling",
  badge = (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Tech stack
    </Badge>
  ),
  logos = [
    // <Logo key="nextjs" image={NextJs} name="Next.js" />,
    <Logo key="react" image={React} name="React" />,
    <Logo
      key="typescript"
      image={TypeScript}
      name="TypeScript"
    />,
    <Logo key="tailwind" image={Tailwind} name="Tailwind CSS" />,
    <Logo key="shadcn" image={ShadcnUi} name="shadcn/ui" />,
    <Logo key="figma" image={Figma} name="Figma" />,
  ],
  className,
}: LogosProps) {
  return (
    <Section className={className}>
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          {badge !== false && badge}
          <h2 className="text-base font-semibold text-foreground sm:text-2xl">
            {title}
          </h2>
        </div>

        {logos !== false && logos.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-90">
            {logos}
          </div>
        )}
      </div>
    </Section>
  );
}
