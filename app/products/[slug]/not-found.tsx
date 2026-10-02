import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/States";

export default function ProductNotFound() {
  return (
    <Container className="py-16 sm:py-24">
      <EmptyState
        title="We couldn't find that product"
        description="It may have been removed, or the link may be mistyped."
        action={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
      />
    </Container>
  );
}
