import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";

import { supabase } from "./lib/supabase";
import { getProducts, Product } from "./lib/api";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({
  scheme: "nova",
  path: "auth/callback",
});

type AuthMode = "login" | "signup";
type Screen = "home" | "shop" | "cart" | "account";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [screen, setScreen] = useState<Screen>("home");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [productsError, setProductsError] = useState("");

  const [search, setSearch] = useState("");

  /*
   * Check whether the user is already signed in.
   */
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Load products after the user is signed in.
   */
  useEffect(() => {
    if (session) {
      loadProducts();
    }
  }, [session]);

  async function loadProducts() {
    try {
      setProductsLoading(true);
      setProductsError("");

      const data = await getProducts();

      setProducts(data);
    } catch (error) {
      console.error(error);

      setProductsError(
        error instanceof Error
          ? error.message
          : "Could not load products.",
      );
    } finally {
      setProductsLoading(false);
    }
  }

  async function refreshProducts() {
    try {
      setRefreshing(true);

      const data = await getProducts();

      setProducts(data);
      setProductsError("");
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }

  /*
   * Email login / signup.
   */
  async function handleEmailAuth() {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing information",
        "Enter your email and password.",
      );
      return;
    }

    try {
      setBusy(true);

      if (authMode === "login") {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          throw error;
        }

        Alert.alert(
          "Account created",
          "Check your email if confirmation is required.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Authentication error",
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  /*
   * Google login.
   */
  async function handleGoogleAuth() {
    try {
      setBusy(true);

      const { data, error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: {
              prompt: "select_account",
            },
          },
        });

      if (error) {
        throw error;
      }

      if (!data.url) {
        throw new Error(
          "Google sign-in URL was not created.",
        );
      }

      const result =
        await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );

      if (result.type === "success") {
        const url = result.url;

        const hash = url.split("#")[1];

        if (hash) {
          const params = new URLSearchParams(hash);

          const accessToken =
            params.get("access_token");

          const refreshToken =
            params.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) {
              throw sessionError;
            }
          }
        }
      }
    } catch (error) {
      Alert.alert(
        "Google sign-in failed",
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  /*
   * Forgot password.
   */
  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert(
        "Enter your email",
        "Enter your email address first.",
      );
      return;
    }

    try {
      setBusy(true);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
        );

      if (error) {
        throw error;
      }

      Alert.alert(
        "Password reset",
        "Check your email for the reset link.",
      );
    } catch (error) {
      Alert.alert(
        "Reset failed",
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  /*
   * Sign out.
   */
  async function handleLogout() {
    await supabase.auth.signOut();

    setScreen("home");
  }

  /*
   * Search products.
   */
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name
          .toLowerCase()
          .includes(query) ||
        product.category
          .toLowerCase()
          .includes(query) ||
        product.description
          .toLowerCase()
          .includes(query)
      );
    });
  }, [products, search]);

  /*
   * Featured products.
   */
  const featuredProducts = useMemo(() => {
    return products.filter(
      (product) => product.featured,
    );
  }, [products]);

  /*
   * Loading screen.
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <StatusBar barStyle="dark-content" />

        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading NOVA...
        </Text>
      </SafeAreaView>
    );
  }

  /*
   * Login screen.
   */
  if (!session) {
    return (
      <SafeAreaView style={styles.authScreen}>
        <StatusBar barStyle="dark-content" />

        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>NOVA</Text>

          <Text style={styles.authTitle}>
            {authMode === "login"
              ? "Welcome back."
              : "Create your account."}
          </Text>

          <Text style={styles.authSubtitle}>
            {authMode === "login"
              ? "Sign in to continue shopping."
              : "Create your NOVA account to get started."}
          </Text>

          <View style={styles.authCard}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#888"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              style={styles.input}
            />

            <Pressable
              style={styles.primaryButton}
              onPress={handleEmailAuth}
              disabled={busy}
            >
              <Text style={styles.primaryButtonText}>
                {busy
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
              </Text>
            </Pressable>

            {authMode === "login" && (
              <Pressable
                style={styles.forgotButton}
                onPress={handleForgotPassword}
                disabled={busy}
              >
                <Text style={styles.forgotText}>
                  Forgot password?
                </Text>
              </Pressable>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />

              <Text style={styles.dividerText}>
                OR
              </Text>

              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={styles.googleButton}
              onPress={handleGoogleAuth}
              disabled={busy}
            >
              <Text style={styles.googleButtonText}>
                Continue with Google
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() =>
              setAuthMode(
                authMode === "login"
                  ? "signup"
                  : "login",
              )
            }
          >
            <Text style={styles.switchText}>
              {authMode === "login"
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * HOME
   */
  function HomeScreen() {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProducts}
          />
        }
      >
        <Header />

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>
            CURATED OBJECTS
          </Text>

          <Text style={styles.heroTitle}>
            Things made{"\n"}to be kept.
          </Text>

          <Text style={styles.heroText}>
            Thoughtful everyday objects for your
            space, your desk and everything you
            carry.
          </Text>

          <Pressable
            style={styles.heroButton}
            onPress={() => setScreen("shop")}
          >
            <Text style={styles.heroButtonText}>
              Shop all products
            </Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Featured
          </Text>

          <Pressable
            onPress={() => setScreen("shop")}
          >
            <Text style={styles.viewAll}>
              View all
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              compact
            />
          ))}
        </ScrollView>
      </ScrollView>
    );
  }

  /*
   * SHOP
   */
  function ShopScreen() {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProducts}
          />
        }
      >
        <Header />

        <View style={styles.shopTitleRow}>
          <Text style={styles.shopTitle}>
            Shop
          </Text>

          <Text style={styles.productCount}>
            {filteredProducts.length} products
          </Text>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor="#888"
          style={styles.searchInput}
        />

        {productsLoading &&
        products.length === 0 ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" />

            <Text style={styles.loadingText}>
              Loading products...
            </Text>
          </View>
        ) : productsError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>
              Couldn't load products
            </Text>

            <Text style={styles.errorText}>
              {productsError}
            </Text>

            <Pressable
              style={styles.heroButton}
              onPress={loadProducts}
            >
              <Text style={styles.heroButtonText}>
                Try again
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  /*
   * CART
   *
   * This is intentionally a placeholder for now.
   * We will connect it to /api/cart next.
   */
  function CartScreen() {
    return (
      <View style={styles.emptyScreen}>
        <Text style={styles.emptyTitle}>
          Your cart
        </Text>

        <Text style={styles.emptyText}>
          Your shared website and mobile cart will
          appear here next.
        </Text>

        <Pressable
          style={styles.heroButton}
          onPress={() => setScreen("shop")}
        >
          <Text style={styles.heroButtonText}>
            Continue shopping
          </Text>
        </Pressable>
      </View>
    );
  }

  /*
   * ACCOUNT
   */
  function AccountScreen() {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
      >
        <Header />

        <View style={styles.accountCard}>
          <Text style={styles.accountLabel}>
            SIGNED IN AS
          </Text>

          <Text style={styles.accountEmail}>
            {session.user.email}
          </Text>

          <View style={styles.accountDivider} />

          <Pressable
            style={styles.signOutButton}
            onPress={handleLogout}
          >
            <Text style={styles.signOutText}>
              Sign out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  /*
   * Choose which screen to display.
   */
  function renderScreen() {
    if (screen === "home") {
      return <HomeScreen />;
    }

    if (screen === "shop") {
      return <ShopScreen />;
    }

    if (screen === "cart") {
      return <CartScreen />;
    }

    return <AccountScreen />;
  }

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.main}>
        {renderScreen()}
      </View>

      <View style={styles.bottomNav}>
        <NavButton
          label="Home"
          active={screen === "home"}
          onPress={() => setScreen("home")}
        />

        <NavButton
          label="Shop"
          active={screen === "shop"}
          onPress={() => setScreen("shop")}
        />

        <NavButton
          label="Cart"
          active={screen === "cart"}
          onPress={() => setScreen("cart")}
        />

        <NavButton
          label="Account"
          active={screen === "account"}
          onPress={() => setScreen("account")}
        />
      </View>
    </SafeAreaView>
  );
}

/*
 * Header
 */
function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.logoSmall}>
        NOVA
      </Text>

      <Text style={styles.headerLabel}>
        Store
      </Text>
    </View>
  );
}

/*
 * Product card
 */
function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const imagePath = product.images?.[0]?.src;

  const imageUrl = imagePath
    ? imagePath.startsWith("http")
      ? imagePath
      : `https://nova-martshop.vercel.app${imagePath}`
    : null;

  const soldOut = product.stock <= 0;

  return (
    <View
      style={[
        styles.productCard,
        compact && styles.compactProductCard,
      ]}
    >
      <View style={styles.productImageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              NOVA
            </Text>
          </View>
        )}

        {product.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {product.badge}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text
          style={styles.productName}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        <Text style={styles.productCategory}>
          {product.category}
        </Text>

        <View style={styles.productBottom}>
          <Text style={styles.productPrice}>
            ${product.price}
          </Text>

          {soldOut ? (
            <Text style={styles.soldOutText}>
              Sold out
            </Text>
          ) : !compact ? (
            <Pressable
              style={styles.addButton}
              onPress={() =>
                Alert.alert(
                  "Cart coming next",
                  `${product.name} will be connected to your shared cart next.`,
                )
              }
            >
              <Text style={styles.addButtonText}>
                Add
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/*
 * Bottom navigation button
 */
function NavButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.navButton}
      onPress={onPress}
    >
      <Text
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#F7F6F2",
  },

  main: {
    flex: 1,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F6F2",
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },

  authScreen: {
    flex: 1,
    backgroundColor: "#F7F6F2",
  },

  authContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  logo: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 5,
    color: "#171717",
    marginBottom: 42,
  },

  authTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "700",
    color: "#171717",
  },

  authSubtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: "#666",
    marginTop: 10,
    marginBottom: 26,
  },

  authCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E6E3DD",
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#DDD9D1",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#171717",
    marginBottom: 12,
    backgroundColor: "#FAFAF8",
  },

  primaryButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  forgotButton: {
    alignItems: "center",
    marginTop: 16,
  },

  forgotText: {
    color: "#555",
    fontSize: 14,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E2DC",
  },

  dividerText: {
    fontSize: 12,
    color: "#999",
  },

  googleButton: {
    height: 54,
    borderWidth: 1,
    borderColor: "#DAD7D0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#171717",
  },

  switchText: {
    textAlign: "center",
    color: "#555",
    marginTop: 22,
    fontSize: 14,
  },

  screen: {
    flex: 1,
    backgroundColor: "#F7F6F2",
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 24,
  },

  logoSmall: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: 3,
    color: "#171717",
  },

  headerLabel: {
    fontSize: 14,
    color: "#777",
    marginLeft: 9,
  },

  hero: {
    backgroundColor: "#171717",
    borderRadius: 26,
    padding: 24,
    minHeight: 390,
    justifyContent: "flex-end",
    marginBottom: 34,
  },

  eyebrow: {
    color: "#B9B5AC",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 14,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 40,
    lineHeight: 43,
    fontWeight: "700",
  },

  heroText: {
    color: "#C8C5BE",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 16,
    marginBottom: 24,
  },

  heroButton: {
    backgroundColor: "#171717",
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  heroButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#171717",
  },

  viewAll: {
    fontSize: 14,
    color: "#555",
  },

  horizontalList: {
    gap: 14,
    paddingBottom: 8,
  },

  shopTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  shopTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#171717",
  },

  productCount: {
    fontSize: 13,
    color: "#777",
  },

  searchInput: {
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E1DB",
    borderRadius: 13,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#171717",
    marginBottom: 20,
  },

  centerBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  errorBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E4E1DB",
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#171717",
  },

  errorText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#666",
    marginTop: 8,
    marginBottom: 18,
  },

  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },

  productCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8E5DF",
  },

  compactProductCard: {
    width: 220,
  },

  productImageContainer: {
    height: 190,
    backgroundColor: "#ECE9E2",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E1D8",
  },

  imagePlaceholderText: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 3,
    color: "#777",
  },

  badge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#171717",
  },

  productInfo: {
    padding: 13,
  },

  productName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#171717",
  },

  productCategory: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
    textTransform: "capitalize",
  },

  productBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#171717",
  },

  addButton: {
    backgroundColor: "#171717",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  soldOutText: {
    color: "#999",
    fontSize: 11,
    fontWeight: "600",
  },

  emptyScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#F7F6F2",
  },

  emptyTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#171717",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 15,
    lineHeight: 23,
    color: "#777",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
  },

  accountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E2DC",
  },

  accountLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#999",
  },

  accountEmail: {
    fontSize: 18,
    fontWeight: "600",
    color: "#171717",
    marginTop: 8,
  },

  accountDivider: {
    height: 1,
    backgroundColor: "#E8E5DF",
    marginVertical: 22,
  },

  signOutButton: {
    height: 50,
    borderWidth: 1,
    borderColor: "#D8D4CC",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  signOutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#171717",
  },

  bottomNav: {
    height: 72,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E7E4DE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 8,
  },

  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  navLabel: {
    fontSize: 12,
    color: "#999",
  },

  navLabelActive: {
    color: "#171717",
    fontWeight: "700",
  },
});