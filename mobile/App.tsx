console.log("🔥🔥🔥 NEW NOVA APP IS RUNNING 🔥🔥🔥");
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  LogOut,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  UserRound,
} from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./lib/supabase";
import { getProducts, type Product } from "./lib/api";

WebBrowser.maybeCompleteAuthSession();

const API_URL = process.env.EXPO_PUBLIC_API_URL;

type AppScreen =
  | "home"
  | "shop"
  | "cart"
  | "account"
  | "checkout"
  | "success";

type SessionUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
};

type SessionLike = {
  access_token: string;
  user: SessionUser;
};

type CartItem = {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  price: number;
  image: { src: string; alt: string } | null;
  maxQuantity?: number;
};

type CartResponse = {
  id: string;
  items: CartItem[];
};

type ApiCartResponse = {
  id: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      slug: string;
      name: string;
      price: number;
      images: Array<{ src: string; alt: string }>;
      stock: number;
    } | null;
  }>;
};

function normalizeCart(data: ApiCartResponse): CartResponse {
  return {
    id: data.id,
    items: data.items.flatMap((item) => {
      if (!item.product) return [];
      return [{
        productId: item.productId,
        quantity: item.quantity,
        name: item.product.name,
        slug: item.product.slug,
        price: Number(item.product.price),
        image: item.product.images?.[0] ?? null,
        maxQuantity: Math.min(10, Number(item.product.stock)),
      }];
    }),
  };
}

function getAssetUrl(src: string | undefined | null) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src)) return src;
  if (!API_URL) return src;
  return `${API_URL.replace(/\/$/, "")}/${src.replace(/^\//, "")}`;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
}

function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // The server validates this field as a UUID. Keep the fallback UUID-shaped
  // so checkout also works on Hermes/Android where randomUUID may be absent.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("Mobile API URL is not configured.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      "We couldn't reach NOVA right now. Please check your internet connection and try again.",
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data as { error?: string } | null;
    throw new Error(
      errorData?.error ?? `Request failed with status ${response.status}`,
    );
  }

  return data as T;
}

function clampQuantity(quantity: number, max: number) {
  return Math.max(1, Math.min(quantity, Math.max(1, max)));
}

function getUserName(user: SessionUser | null) {
  return (
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    ""
  );
}

export default function App() {
  console.log("🔥🔥🔥 THIS IS THE NEW NOVA APP.TSX 🔥🔥🔥");
  const [session, setSession] = useState<SessionLike | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [screen, setScreen] = useState<AppScreen>("home");

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [productError, setProductError] = useState("");

  const [cart, setCart] = useState<CartResponse>({
    id: "",
    items: [],
  });
  const [loadingCart, setLoadingCart] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);

  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutCity, setCheckoutCity] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const subtotal = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart.items],
  );

  const cartCount = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items],
  );

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session as SessionLike | null);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession as SessionLike | null);
      setLoadingAuth(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setCart({ id: "", items: [] });
      return;
    }

    void loadCart();
  }, [session]);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setProductError("");
      const result = await getProducts();
      setProducts(result);
    } catch (error) {
      setProductError(
        error instanceof Error
          ? error.message
          : "We couldn't load the products.",
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadCart() {
    if (!session) return;

    try {
      setLoadingCart(true);
      const result = await apiFetch<ApiCartResponse>("/api/cart");
      setCart(normalizeCart(result));
    } catch (error) {
      Alert.alert(
        "Cart",
        error instanceof Error
          ? error.message
          : "We couldn't load your cart.",
      );
    } finally {
      setLoadingCart(false);
    }
  }

  async function addCartItem(product: Product) {
    if (!session) {
      Alert.alert("Sign in required", "Please sign in before adding items.");
      return;
    }

    try {
      setCartBusy(true);

      const existing = cart.items.find(
        (item) => item.productId === product.id,
      );
      const nextQuantity = (existing?.quantity ?? 0) + 1;

      if (nextQuantity > 10 || nextQuantity > product.stock) {
        Alert.alert(
          "Quantity unavailable",
          `Only ${Math.min(10, product.stock)} of this item can be added.`,
        );
        return;
      }

      const result = await apiFetch<ApiCartResponse>("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          type: "add",
          productId: product.id,
          quantity: 1,
        }),
      });

      setCart(normalizeCart(result));
    } catch (error) {
      Alert.alert(
        "Couldn't add item",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setCartBusy(false);
    }
  }

  async function updateCartItem(productId: string, quantity: number) {
    if (quantity <= 0) {
      await removeCartItem(productId);
      return;
    }

    try {
      setCartBusy(true);

      const result = await apiFetch<ApiCartResponse>("/api/cart", {
        method: "PATCH",
        body: JSON.stringify({
          type: "setQuantity",
          productId,
          quantity: clampQuantity(quantity, 10),
        }),
      });

      setCart(normalizeCart(result));
    } catch (error) {
      Alert.alert(
        "Couldn't update cart",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setCartBusy(false);
    }
  }

  async function removeCartItem(productId: string) {
    try {
      setCartBusy(true);

      const result = await apiFetch<ApiCartResponse>("/api/cart", {
        method: "DELETE",
        body: JSON.stringify({ productId }),
      });

      setCart(normalizeCart(result));
    } catch (error) {
      Alert.alert(
        "Couldn't remove item",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setCartBusy(false);
    }
  }

  async function clearCart() {
    try {
      setCartBusy(true);

      const result = await apiFetch<ApiCartResponse>("/api/cart", {
        method: "DELETE",
        body: JSON.stringify({ clear: true }),
      });

      setCart(normalizeCart(result));
    } catch (error) {
      Alert.alert(
        "Couldn't clear cart",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setCartBusy(false);
    }
  }

  function startCheckout() {
    if (!session) {
      Alert.alert("Sign in required", "Please sign in before checking out.");
      return;
    }

    if (cart.items.length === 0) {
      Alert.alert("Your cart is empty", "Add something before checking out.");
      return;
    }

    setCheckoutName(getUserName(session.user));
    setCheckoutEmail(session.user.email ?? "");
    setCheckoutPhone("");
    setCheckoutAddress("");
    setCheckoutCity("");
    setCheckoutError("");
    setScreen("checkout");
  }

  async function handlePlaceOrder() {
    if (checkoutBusy) return;

    setCheckoutError("");

    const fullName = checkoutName.trim();
    const email = checkoutEmail.trim().toLowerCase();
    const phone = checkoutPhone.trim();
    const address = checkoutAddress.trim();
    const city = checkoutCity.trim();

    if (fullName.length < 2) {
      setCheckoutError("Please enter your full name.");
      return;
    }

    if (
      !email ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setCheckoutError("Please enter a valid email address.");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setCheckoutError("Please enter a valid phone number.");
      return;
    }

    if (address.length < 5) {
      setCheckoutError("Please enter your delivery address.");
      return;
    }

    if (city.length < 2) {
      setCheckoutError("Please enter your city.");
      return;
    }

    if (cart.items.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }

    try {
      setCheckoutBusy(true);

      const result = await apiFetch<{
        orderNumber?: string;
        accessToken?: string;
        total?: number;
        error?: string;
      }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: createIdempotencyKey(),
          customer: {
            fullName,
            email,
            phone,
            address,
            city,
          },
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!result.orderNumber) {
        throw new Error(
          result.error ??
            "The order was created but no order number was returned.",
        );
      }

      setOrderNumber(result.orderNumber);

      // The order has already been created successfully.
      // Clearing the shared cart is a separate step, so a temporary
      // cart-clearing failure must not make a successful order look failed.
      try {
        const cleared = await apiFetch<ApiCartResponse>("/api/cart", {
          method: "DELETE",
          body: JSON.stringify({ clear: true }),
        });
        setCart(normalizeCart(cleared));
      } catch {
        setCart({ id: cart.id, items: [] });
      }

      setScreen("success");
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "We couldn't place your order. Please try again.",
      );
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function signInWithGoogle() {
    try {
      const redirectTo = makeRedirectUri({
        scheme: "nova",
        path: "auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("Google sign-in URL was not returned.");

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
      );

      if (result.type === "success" && result.url) {
        const callbackUrl = result.url;
        const queryPart = callbackUrl.split("?")[1] ?? "";
        const query = queryPart.split("#")[0];
        const hash = callbackUrl.includes("#")
          ? callbackUrl.split("#")[1]
          : "";

        const params = new URLSearchParams(
          [query, hash].filter(Boolean).join("&"),
        );

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else {
          const code = params.get("code");

          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        }
      }
    } catch (error) {
      Alert.alert(
        "Google sign-in",
        error instanceof Error ? error.message : "Sign-in failed.",
      );
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setCart({ id: "", items: [] });
      setScreen("account");
    } catch {
      Alert.alert(
        "Couldn't sign out",
        "Please try again.",
      );
    }
  }

  async function refreshAll() {
    setRefreshing(true);

    await Promise.all([
      loadProducts(),
      session ? loadCart() : Promise.resolve(),
    ]);

    setRefreshing(false);
  }

  function renderProductCard(product: Product) {
    return (
      <View key={product.id} style={styles.productCard}>
        <View style={styles.productImagePlaceholder}>
          {getAssetUrl(product.images?.[0]?.src) ? (
            <Image
              source={{ uri: getAssetUrl(product.images[0].src)! }}
              style={styles.productImage}
              resizeMode="cover"
              accessibilityLabel={product.images[0].alt}
            />
          ) : (
            <Text style={styles.productImageText}>NOVA</Text>
          )}
        </View>

        <View style={styles.productCardBody}>
          {product.badge ? (
            <Text style={styles.productBadge}>{product.badge}</Text>
          ) : null}

          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <Text style={styles.productCategory}>{product.category}</Text>

          <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>

          <Pressable
            disabled={cartBusy || product.stock < 1}
            onPress={() => void addCartItem(product)}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
              (cartBusy || product.stock < 1) && styles.disabledButton,
            ]}
          >
            <Text style={styles.addButtonText}>
              {product.stock < 1 ? "OUT OF STOCK" : "ADD TO CART"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  function renderHome() {
    const featured = products.filter((product) => product.featured).slice(0, 4);

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshAll()}
          />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>NOVA MOBILE</Text>

          <Text style={styles.heroTitle}>
            Premium things. Simply chosen.
          </Text>

          <Text style={styles.heroText}>
            Shop the same NOVA store on your phone with the same account and
            shared cart.
          </Text>

          <Pressable
            onPress={() => setScreen("shop")}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>SHOP NOW</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured</Text>

          <Pressable onPress={() => setScreen("shop")}>
            <Text style={styles.linkText}>View all</Text>
          </Pressable>
        </View>

        {loadingProducts ? (
          <ActivityIndicator size="large" />
        ) : productError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{productError}</Text>

            <Pressable onPress={() => void loadProducts()}>
              <Text style={styles.linkText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          featured.map(renderProductCard)
        )}
      </ScrollView>
    );
  }

  function renderShop() {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshAll()}
          />
        }
      >
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Shop</Text>

          <Text style={styles.pageSubtitle}>
            Browse the NOVA catalogue.
          </Text>
        </View>

        {loadingProducts ? (
          <ActivityIndicator size="large" />
        ) : productError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{productError}</Text>

            <Pressable onPress={() => void loadProducts()}>
              <Text style={styles.linkText}>Try again</Text>
            </Pressable>
          </View>
        ) : products.length === 0 ? (
          <Text style={styles.mutedText}>No products found.</Text>
        ) : (
          products.map(renderProductCard)
        )}
      </ScrollView>
    );
  }

  function renderCart() {
    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refreshAll()}
          />
        }
      >
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>Your Cart</Text>

          <Text style={styles.pageSubtitle}>
            {cartCount} {cartCount === 1 ? "item" : "items"}
          </Text>
        </View>

        {!session ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sign in to use your cart</Text>

            <Text style={styles.mutedText}>
              Your NOVA cart is shared between the website and this mobile app.
            </Text>

            <Pressable
              onPress={() => setScreen("account")}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>SIGN IN</Text>
            </Pressable>
          </View>
        ) : loadingCart ? (
          <ActivityIndicator size="large" />
        ) : cart.items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>

            <Text style={styles.mutedText}>
              Add products from the shop and they will also appear on the NOVA
              website.
            </Text>

            <Pressable
              onPress={() => setScreen("shop")}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                CONTINUE SHOPPING
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {cart.items.map((item) => (
              <View key={item.productId} style={styles.cartItem}>
                <View style={styles.cartImagePlaceholder}>
                  {getAssetUrl(item.image?.src) ? (
                    <Image
                      source={{ uri: getAssetUrl(item.image?.src)! }}
                      style={styles.cartImage}
                      resizeMode="cover"
                      accessibilityLabel={item.image?.alt}
                    />
                  ) : (
                    <Text style={styles.productImageText}>N</Text>
                  )}
                </View>

                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName} numberOfLines={2}>
                    {item.name}
                  </Text>

                  <Text style={styles.cartItemPrice}>
                    {formatPrice(item.price)}
                  </Text>

                  <View style={styles.quantityRow}>
                    <Pressable
                      disabled={cartBusy}
                      onPress={() =>
                        void updateCartItem(
                          item.productId,
                          item.quantity - 1,
                        )
                      }
                      style={styles.quantityButton}
                    >
                      <Minus size={17} color="#111" />
                    </Pressable>

                    <Text style={styles.quantityText}>{item.quantity}</Text>

                    <Pressable
                      disabled={cartBusy}
                      onPress={() =>
                        void updateCartItem(
                          item.productId,
                          item.quantity + 1,
                        )
                      }
                      style={styles.quantityButton}
                    >
                      <Plus size={17} color="#111" />
                    </Pressable>

                    <Pressable
                      disabled={cartBusy}
                      onPress={() => void removeCartItem(item.productId)}
                      style={styles.removeButton}
                    >
                      <Trash2 size={16} color="#111" />
<Text style={styles.removeButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>

                <Text style={styles.totalValue}>
                  {formatPrice(subtotal)}
                </Text>
              </View>

              <Text style={styles.mutedText}>
                Secure checkout. Final stock is confirmed before your order is placed.
              </Text>

              <Pressable
                disabled={cartBusy}
                onPress={startCheckout}
                style={({ pressed }) => [
                  styles.checkoutButton,
                  pressed && styles.pressed,
                  cartBusy && styles.disabledButton,
                ]}
              >
                <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
              </Pressable>

              <Pressable
                disabled={cartBusy}
                onPress={() => void clearCart()}
                style={styles.clearCartButton}
              >
                <Text style={styles.clearCartText}>Clear cart</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  function renderCheckout() {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.pageHeading}>
            <Text style={styles.pageTitle}>Checkout</Text>

            <Text style={styles.pageSubtitle}>
              Complete your delivery details.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>
              Contact information
            </Text>

            <Text style={styles.inputLabel}>Full name</Text>

            <TextInput
              value={checkoutName}
              onChangeText={setCheckoutName}
              placeholder="Your full name"
              autoCapitalize="words"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Email address</Text>

            <TextInput
              value={checkoutEmail}
              onChangeText={setCheckoutEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Phone number</Text>

            <TextInput
              value={checkoutPhone}
              onChangeText={setCheckoutPhone}
              placeholder="+234..."
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>
              Delivery information
            </Text>

            <Text style={styles.inputLabel}>Address</Text>

            <TextInput
              value={checkoutAddress}
              onChangeText={setCheckoutAddress}
              placeholder="Delivery address"
              multiline
              style={[styles.input, styles.multilineInput]}
            />

            <Text style={styles.inputLabel}>City</Text>

            <TextInput
              value={checkoutCity}
              onChangeText={setCheckoutCity}
              placeholder="City"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Order summary</Text>

            {cart.items.map((item) => (
              <View key={item.productId} style={styles.summaryRow}>
                <Text style={styles.summaryName} numberOfLines={2}>
                  {item.name} × {item.quantity}
                </Text>

                <Text style={styles.summaryPrice}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            ))}

            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>

              <Text style={styles.summaryTotalValue}>
                {formatPrice(subtotal)}
              </Text>
            </View>
          </View>

          {checkoutError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{checkoutError}</Text>
            </View>
          ) : null}

          <Pressable
            disabled={checkoutBusy}
            onPress={() => void handlePlaceOrder()}
            style={({ pressed }) => [
              styles.checkoutButton,
              pressed && styles.pressed,
              checkoutBusy && styles.disabledButton,
            ]}
          >
            {checkoutBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkoutButtonText}>PLACE ORDER</Text>
            )}
          </Pressable>

          <Pressable
            disabled={checkoutBusy}
            onPress={() => setScreen("cart")}
            style={styles.backButton}
          >
            <View style={styles.backButtonRow}>
              <ArrowLeft size={18} color="#111" />
              <Text style={styles.backButtonText}>Back to cart</Text>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function renderSuccess() {
    return (
      <ScrollView contentContainerStyle={styles.successContainer}>
        <View style={styles.successIcon}>
          <CheckCircle2 size={46} color="#111" strokeWidth={1.8} />
        </View>

        <Text style={styles.successTitle}>Order confirmed</Text>

        <Text style={styles.successText}>
          Thank you for shopping with NOVA. Your order has been received.
        </Text>

        <View style={styles.orderNumberCard}>
          <Text style={styles.orderNumberLabel}>ORDER NUMBER</Text>

          <Text style={styles.orderNumber}>{orderNumber}</Text>
        </View>

        <Text style={styles.successText}>
          Your confirmation email will be sent to the email address you used at
          checkout.
        </Text>

        <Pressable
          onPress={() => setScreen("shop")}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>CONTINUE SHOPPING</Text>
        </Pressable>

        <Pressable
          onPress={() => setScreen("account")}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>VIEW ACCOUNT</Text>
        </Pressable>
      </ScrollView>
    );
  }

  function renderAccount() {
    if (!session) {
      return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.accountHero}>
            <Text style={styles.eyebrow}>NOVA ACCOUNT</Text>

            <Text style={styles.pageTitle}>Welcome back.</Text>

            <Text style={styles.pageSubtitle}>
              Sign in with Google to use your shared cart and account.
            </Text>

            <Pressable
              onPress={() => void signInWithGoogle()}
              style={styles.googleButton}
            >
              <Text style={styles.googleButtonText}>
                CONTINUE WITH GOOGLE
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.accountHero}>
          <Text style={styles.eyebrow}>NOVA ACCOUNT</Text>

          <Text style={styles.pageTitle}>You're signed in.</Text>

          <Text style={styles.pageSubtitle}>
            {session.user.email ?? "Your NOVA account"}
          </Text>
        </View>

        <View style={styles.accountCard}>
          <Text style={styles.accountCardTitle}>Shared cart</Text>

          <Text style={styles.mutedText}>
            {cartCount} {cartCount === 1 ? "item" : "items"} currently in your
            cart.
          </Text>

          <Pressable
            onPress={() => setScreen("cart")}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>VIEW CART</Text>
          </Pressable>
        </View>

        <View style={styles.accountCard}>
          <Text style={styles.accountCardTitle}>Account</Text>

          <Text style={styles.mutedText}>
            Signed in as {session.user.email ?? "your account"}.
          </Text>

          <Pressable
            onPress={() => void signOut()}
            style={styles.signOutButton}
          >
            <View style={styles.signOutRow}>
              <LogOut size={17} color="#111" />
              <Text style={styles.signOutText}>SIGN OUT</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  function renderCurrentScreen() {
    switch (screen) {
      case "shop":
        return renderShop();

      case "cart":
        return renderCart();

      case "account":
        return renderAccount();

      case "checkout":
        return renderCheckout();

      case "success":
        return renderSuccess();

      case "home":
      default:
        return renderHome();
    }
  }

  if (loadingAuth) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading NOVA…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.app}>
        <View style={styles.header}>
          <Pressable onPress={() => setScreen("home")}>
            <Text style={styles.logo}>NOVA</Text>
          </Pressable>

          <Pressable
            onPress={() => setScreen("cart")}
            style={styles.headerCart}
            accessibilityLabel="Open cart"
          >
            <ShoppingCart size={21} color="#111" strokeWidth={2} />
            <Text style={styles.headerCartText}>CART ({cartCount})</Text>
          </Pressable>
        </View>

        <View style={styles.content}>{renderCurrentScreen()}</View>

        {screen !== "checkout" && screen !== "success" ? (
          <View style={styles.bottomNav}>
            <Pressable onPress={() => setScreen("home")} style={styles.navItem}>
              <Home size={20} strokeWidth={screen === "home" ? 2.6 : 1.8} color="#111" />
              <Text style={[styles.navText, screen === "home" && styles.navTextActive]}>HOME</Text>
            </Pressable>

            <Pressable onPress={() => setScreen("shop")} style={styles.navItem}>
              <Store size={20} strokeWidth={screen === "shop" ? 2.6 : 1.8} color="#111" />
              <Text style={[styles.navText, screen === "shop" && styles.navTextActive]}>SHOP</Text>
            </Pressable>

            <Pressable onPress={() => setScreen("cart")} style={styles.navItem}>
              <View style={styles.navIconWrap}>
                <ShoppingBag size={20} strokeWidth={screen === "cart" ? 2.6 : 1.8} color="#111" />
                {cartCount > 0 ? (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.navText, screen === "cart" && styles.navTextActive]}>BAG</Text>
            </Pressable>

            <Pressable onPress={() => setScreen("account")} style={styles.navItem}>
              <UserRound size={20} strokeWidth={screen === "account" ? 2.6 : 1.8} color="#111" />
              <Text style={[styles.navText, screen === "account" && styles.navTextActive]}>ACCOUNT</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  flex: {
    flex: 1,
  },
  app: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  header: {
    height: 62,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 2,
  },
  headerCart: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerCartText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    paddingTop: 26,
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#777",
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 45,
    fontWeight: "700",
    letterSpacing: -1.5,
  },
  heroText: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    maxWidth: 500,
  },
  primaryButton: {
    marginTop: 22,
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 26,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#111",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  pageHeading: {
    paddingTop: 12,
    paddingBottom: 22,
  },
  pageTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 22,
    color: "#666",
  },
  productCard: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  productImagePlaceholder: {
    height: 190,
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImageText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#aaa",
  },
  productCardBody: {
    padding: 16,
  },
  productBadge: {
    alignSelf: "flex-start",
    marginBottom: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#111",
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  productName: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "600",
  },
  productCategory: {
    marginTop: 5,
    fontSize: 12,
    color: "#888",
  },
  productPrice: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "700",
  },
  addButton: {
    marginTop: 14,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  disabledButton: {
    opacity: 0.45,
  },
  errorBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff1f1",
    borderWidth: 1,
    borderColor: "#f0cccc",
  },
  errorText: {
    color: "#a40000",
    fontSize: 14,
    lineHeight: 20,
  },
  mutedText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#777",
  },
  emptyCard: {
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  emptyTitle: {
    fontSize: 21,
    fontWeight: "700",
  },
  cartItem: {
    flexDirection: "row",
    padding: 14,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cartImagePlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 14,
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  cartImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cartItemName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  cartItemPrice: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: "700",
  },
  quantityRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityButtonText: {
    fontSize: 18,
  },
  quantityText: {
    width: 35,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  removeButton: {
    marginLeft: 10,
    paddingVertical: 8,
  },
  removeButtonText: {
    fontSize: 12,
    color: "#888",
    textDecorationLine: "underline",
  },
  totalCard: {
    marginTop: 8,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#f7f7f7",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 21,
    fontWeight: "800",
  },
  checkoutButton: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  clearCartButton: {
    marginTop: 14,
    alignItems: "center",
    padding: 8,
  },
  clearCartText: {
    color: "#777",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  formCard: {
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  formSectionTitle: {
    marginBottom: 15,
    fontSize: 18,
    fontWeight: "700",
  },
  inputLabel: {
    marginTop: 12,
    marginBottom: 7,
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8d8d8",
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#111",
  },
  multilineInput: {
    minHeight: 90,
    paddingTop: 13,
    textAlignVertical: "top",
  },
  summaryRow: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  summaryName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: "#555",
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  summaryTotalRow: {
    marginTop: 6,
    paddingTop: 16,
    borderBottomWidth: 0,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  backButton: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  backButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  backButtonText: {
    fontSize: 13,
    color: "#666",
    textDecorationLine: "underline",
  },
  successContainer: {
    flexGrow: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  successIconText: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "500",
  },
  successTitle: {
    marginTop: 22,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  successText: {
    marginTop: 12,
    maxWidth: 440,
    fontSize: 15,
    lineHeight: 23,
    color: "#666",
    textAlign: "center",
  },
  orderNumberCard: {
    width: "100%",
    marginTop: 22,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#f7f7f7",
    alignItems: "center",
  },
  orderNumberLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#888",
  },
  orderNumber: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  accountHero: {
    paddingTop: 20,
    paddingBottom: 26,
  },
  googleButton: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  accountCard: {
    marginBottom: 14,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  accountCardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  signOutButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signOutText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  bottomNav: {
    height: 68,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#fff",
  },
  navIconWrap: {
    position: "relative",
    marginBottom: 3,
  },
  navBadge: {
    position: "absolute",
    top: -7,
    right: -10,
    minWidth: 15,
    height: 15,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  navBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#999",
  },
  navTextActive: {
    color: "#111",
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#777",
  },
});
