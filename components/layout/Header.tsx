import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { UserIcon } from "@/components/ui/icons";
import { CartButton } from "./CartButton";
import { headerAction } from "./headerStyles";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { SearchDialog } from "./SearchDialog";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <Container className="flex h-16 items-center lg:h-[4.5rem]">
        <Logo />
        <nav aria-label="Primary" className="ml-10 hidden lg:block">
          <NavLinks />
        </nav>
        <div className="ml-auto flex items-center gap-0.5">
          <SearchDialog />
          <Link href="/account" className={`${headerAction} hidden sm:inline-flex`} aria-label="Account">
            <UserIcon />
            <span className="hidden lg:inline">Account</span>
          </Link>
          <CartButton count={0} />
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
