import { type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";
import { SignedIn, SignedOut, UserButton, SignUpButton, SignInButton } from "@clerk/nextjs";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

import LaunchUI from "../../logos/launch-ui";
import { Button, buttonVariants } from "../../ui/button";
import {
  Navbar as NavbarComponent,
  NavbarLeft,
  NavbarRight,
} from "../../ui/navbar";

interface NavbarProps {
  logo?: ReactNode;
  name?: string;
  homeUrl?: string;
  className?: string;
}

export default function Navbar({
  logo = <LaunchUI />,
  name = "RealMeet",
  homeUrl = siteConfig.url,
  className,
}: Omit<NavbarProps, "actions">) {
  return (
    <header className={cn("sticky top-0 z-50 px-4", className)}>
      <div className="fade-bottom bg-background/15 absolute left-0 h-24 w-full backdrop-blur-lg" />
      <div className="max-w-container relative mx-auto">
        <NavbarComponent>
          {/* LEFT */}
          <NavbarLeft>
            <a
              href={homeUrl}
              className="flex items-center gap-2 text-xl font-bold"
            >
              {logo}
              <span>{name}</span>
            </a>
          </NavbarLeft>

          {/* RIGHT */}
          <NavbarRight>
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Sign Up
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button variant="default">Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </NavbarRight>
        </NavbarComponent>
      </div>
    </header>
  );
}
