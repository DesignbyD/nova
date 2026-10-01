"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog, Drawer } from "@/components/ui/Dialog";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { Skeleton, ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";

const variants: ButtonVariant[] = ["primary", "accent", "secondary", "ghost", "link"];
const sizes: ButtonSize[] = ["sm", "md", "lg"];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16" aria-labelledby={id}>
      <h2 id={id} className="text-title font-semibold">
        {title}
      </h2>
      <div className="mt-6 border-t border-line pt-8">{children}</div>
    </section>
  );
}

export function DesignDemos() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [saving, setSaving] = useState(false);

  function fakeSave() {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1800);
  }

  return (
    <>
      <Section id="buttons" title="Buttons">
        <div className="flex flex-col gap-6">
          {sizes.map((size) => (
            <div key={size} className="flex flex-wrap items-center gap-3">
              {variants.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant === "link" ? "Link button" : `${variant} ${size}`}
                </Button>
              ))}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="accent" loading={saving} onClick={fakeSave}>
              {saving ? "Saving" : "Click to see loading"}
            </Button>
            <Button disabled>Disabled</Button>
            <Spinner label="Loading" className="size-8 text-accent" />
          </div>
        </div>
      </Section>

      <Section id="forms" title="Forms">
        <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
          <TextField label="Full name" name="name" autoComplete="name" placeholder="Ada Okoro" />
          <TextField label="Email" name="email" type="email" hint="We'll send your order confirmation here." />
          <TextField label="Phone" name="phone" type="tel" error="Enter a phone number with at least 7 digits." defaultValue="12" />
          <SelectField label="Category" defaultValue="">
            <option value="" disabled>
              Choose a category
            </option>
            <option>Desk</option>
            <option>Home</option>
          </SelectField>
          <TextField label="Disabled field" disabled defaultValue="Not editable" />
          <TextArea label="Delivery notes" optional wrapperClassName="sm:col-span-2" />
        </div>
      </Section>

      <Section id="badges" title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="accent">New</Badge>
          <Badge tone="success">Delivered</Badge>
          <Badge tone="warning">Low stock</Badge>
          <Badge tone="danger">Cancelled</Badge>
          <Badge tone="outline">Sold out</Badge>
        </div>
      </Section>

      <Section id="alerts" title="Alerts and notifications">
        <div className="grid max-w-3xl gap-3">
          <Alert tone="info" title="Free delivery over $150">Add a little more to qualify.</Alert>
          <Alert tone="success" title="Order placed">A confirmation is on its way to your inbox.</Alert>
          <Alert tone="warning" title="Only 2 left">Stock is limited for this item.</Alert>
          <Alert tone="danger" title="Payment details missing" action={<Button size="sm" variant="secondary">Review details</Button>}>
            Complete the highlighted fields to continue.
          </Alert>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast({ title: "Added to cart", description: "Studio Lamp, quantity 1", tone: "success" })}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => toast({ title: "Couldn't update cart", description: "Try again in a moment.", tone: "danger" })}>
            Error toast
          </Button>
          <Button variant="secondary" onClick={() => toast({ title: "Link copied" })}>
            Info toast
          </Button>
        </div>
      </Section>

      <Section id="overlays" title="Modal and drawer">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>Open drawer</Button>
        </div>
        <Dialog
          open={modal}
          onClose={() => setModal(false)}
          title="Remove item?"
          description="This will take the item out of your cart."
        >
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModal(false)}>Keep item</Button>
            <Button onClick={() => setModal(false)}>Remove</Button>
          </div>
        </Dialog>
        <Drawer
          open={drawer}
          onClose={() => setDrawer(false)}
          title="Cart"
          footer={<Button variant="accent" size="lg" fullWidth>Checkout</Button>}
        >
          <EmptyState title="Your cart is empty" description="Items you add will appear here." className="py-8" />
        </Drawer>
      </Section>

      <Section id="cards" title="Cards and product tiles">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ProductCard href="#" name="Studio Lamp" category="Lighting" price={148} badge="New" />
          <ProductCard href="#" name="Ceramic Carafe" category="Tableware" price={64} />
          <ProductCard href="#" name="Field Notebook" category="Desk" price={28} soldOut />
          <Card interactive className="flex flex-col justify-between">
            <p className="font-medium">Generic card</p>
            <p className="mt-2 font-serif text-muted">Surface, hairline border, restrained radius, no default shadow.</p>
          </Card>
        </div>
      </Section>

      <Section id="loading" title="Loading, empty and error states">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
          <div className="flex flex-col gap-3 sm:col-span-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card padding="none">
            <EmptyState
              title="No products match your search"
              description="Try a different word, or browse everything we make."
              action={<Button variant="secondary">Browse all products</Button>}
            />
          </Card>
          <Card padding="none">
            <ErrorState onRetry={() => toast({ title: "Retrying", tone: "info" })} />
          </Card>
        </div>
      </Section>
    </>
  );
}
