import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/States";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        title="This page isn't here"
        description="The link may be broken, or the page may have moved."
        action={<ButtonLink href="/">Back to home</ButtonLink>}
      />
    </Container>
  );
}
