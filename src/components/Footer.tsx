import React from "react";
import { Logo } from "./Logo";
import { links, content, legal, socials } from "../constants/footer_links";

export const Footer = () => {
  return (
    <div className="border-t border-neutral-100 dark:border-neutral-800 px-8 pt-20 pb-32 relative bg-[rgb(var(--background-primary))] dark:bg-[rgb(var(--text-primary))]">
      <div className="max-w-7xl mx-auto text-sm text-neutral-500 dark:text-neutral-400 flex sm:flex-row flex-col justify-between items-start">
        <div>
          <div className="mr-4 md:flex mb-4">
            <Logo />
          </div>
          <div>Copyright © 2024 Libra Innovation GmbH</div>
          <div className="mt-2">All rights reserved</div>
        </div>
        <div className="grid grid-cols-4 gap-10 items-start mt-10 md:mt-0">
          <div className="flex justify-center space-y-4 flex-col mt-4">
            {links.map((link) => (
              <a
                key={link.name}
                className="transition-colors hover:text-black text-muted dark:text-muted-dark dark:hover:text-neutral-400 text-xs sm:text-sm"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex justify-center space-y-4 flex-col mt-4">
            {content.map((link) => (
              <a
                key={link.name}
                className="transition-colors hover:text-black text-muted dark:text-muted-dark dark:hover:text-neutral-400 text-xs sm:text-sm"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex justify-center space-y-4 flex-col mt-4">
            {legal.map((link) => (
              <a
                key={link.name}
                className="transition-colors hover:text-black text-muted dark:text-muted-dark dark:hover:text-neutral-400 text-xs sm:text-sm"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex justify-center space-y-4 flex-col mt-4">
            {socials.map((link) => (
              <a
                key={link.name}
                className="transition-colors hover:text-black text-muted dark:text-muted-dark dark:hover:text-neutral-400 text-xs sm:text-sm"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
