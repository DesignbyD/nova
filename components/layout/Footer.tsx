import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { footerNav } from "@/lib/nav";
import { siteConfig } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-paper-deep">
      <Container className="grid gap-12 py-14 lg:grid-cols-[1.5fr_2fr] lg:py-20">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 font-serif text-lg leading-relaxed text-ink-soft">{siteConfig.description}</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
          {footerNav.map((group) => (
            <div key={group.heading}>
              <h2 className="text-sm font-semibold text-muted">{group.heading}</h2>
              <ul className="mt-4 flex flex-col">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-block py-1.5 text-[0.9375rem] transition-colors hover:text-accent">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Container>
      <div className="border-t border-line">
        <Container className="py-6 text-sm text-muted">
          &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}
