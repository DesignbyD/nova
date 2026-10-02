import { ProductGridSkeletons } from "@/components/shop/ProductGrid";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <Container className="py-10 sm:py-14">
      <div role="status" aria-label="Loading the shop">
        <Skeleton className="h-14 w-64" />
        <Skeleton className="mt-4 h-6 w-96 max-w-full" />
      </div>
      <Skeleton className="mt-10 h-16 w-full" />
      <div className="mt-10">
        <ProductGridSkeletons />
      </div>
    </Container>
  );
}
