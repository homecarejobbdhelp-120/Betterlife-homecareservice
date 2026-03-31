import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { supabase } from "./lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  image_url: string | null;
  created_at?: string;
};

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  created_at?: string;
};

const emptyProductForm = {
  name: "",
  description: "",
  price: "",
  image_url: "",
};

const emptyBannerForm = {
  title: "",
  subtitle: "",
  image_url: "",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "banners">("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [saving, setSaving] = useState(false);

  const [productForm, setProductForm] = useState(emptyProductForm);
  const [bannerForm, setBannerForm] = useState(emptyBannerForm);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }

      setCheckingAuth(false);
      await Promise.all([fetchProducts(), fetchBanners()]);
    };

    init();
  }, [navigate]);

  const totalProducts = useMemo(() => products.length, [products]);
  const totalBanners = useMemo(() => banners.length, [banners]);

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    clearAlerts();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setProducts((data as Product[]) || []);
    }

    setLoadingProducts(false);
  };

  const fetchBanners = async () => {
    setLoadingBanners(true);
    clearAlerts();

    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setBanners((data as Banner[]) || []);
    }

    setLoadingBanners(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    setSaving(true);

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      price: productForm.price.trim() || null,
      image_url: productForm.image_url.trim() || null,
    };

    if (!payload.name) {
      setError("Product name is required.");
      setSaving(false);
      return;
    }

    let result;

    if (editingProductId) {
      result = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingProductId);
    } else {
      result = await supabase.from("products").insert([payload]);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(
        editingProductId
          ? "Product updated successfully."
          : "Product added successfully."
      );
      setProductForm(emptyProductForm);
      setEditingProductId(null);
      await fetchProducts();
    }

    setSaving(false);
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();
    setSaving(true);

    const payload = {
      title: bannerForm.title.trim(),
      subtitle: bannerForm.subtitle.trim() || null,
      image_url: bannerForm.image_url.trim() || null,
    };

    if (!payload.title) {
      setError("Banner title is required.");
      setSaving(false);
      return;
    }

    let result;

    if (editingBannerId) {
      result = await supabase
        .from("banners")
        .update(payload)
        .eq("id", editingBannerId);
    } else {
      result = await supabase.from("banners").insert([payload]);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(
        editingBannerId
          ? "Banner updated successfully."
          : "Banner added successfully."
      );
      setBannerForm(emptyBannerForm);
      setEditingBannerId(null);
      await fetchBanners();
    }

    setSaving(false);
  };

  const handleEditProduct = (product: Product) => {
    clearAlerts();
    setActiveTab("products");
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      image_url: product.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditBanner = (banner: Banner) => {
    clearAlerts();
    setActiveTab("banners");
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      image_url: banner.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id: string) => {
    const ok = window.confirm("Are you sure you want to delete this product?");
    if (!ok) return;

    clearAlerts();

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Product deleted successfully.");
      if (editingProductId === id) {
        setEditingProductId(null);
        setProductForm(emptyProductForm);
      }
      await fetchProducts();
    }
  };

  const handleDeleteBanner = async (id: string) => {
    const ok = window.confirm("Are you sure you want to delete this banner?");
    if (!ok) return;

    clearAlerts();

    const { error } = await supabase.from("banners").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Banner deleted successfully.");
      if (editingBannerId === id) {
        setEditingBannerId(null);
        setBannerForm(emptyBannerForm);
      }
      await fetchBanners();
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          Checking admin session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-2">
              <LayoutDashboard className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">BetterLife Admin Dashboard</h1>
              <p className="text-sm text-slate-400">
                Manage products and homepage banners
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Products</p>
                <h2 className="mt-2 text-3xl font-bold">{totalProducts}</h2>
              </div>
              <div className="rounded-2xl bg-cyan-500/10 p-3">
                <Package className="h-7 w-7 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Banners</p>
                <h2 className="mt-2 text-3xl font-bold">{totalBanners}</h2>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3">
                <ImageIcon className="h-7 w-7 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => {
              clearAlerts();
              setActiveTab("products");
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "products"
                ? "bg-cyan-500 text-white"
                : "border border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            Products
          </button>

          <button
            onClick={() => {
              clearAlerts();
              setActiveTab("banners");
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === "banners"
                ? "bg-emerald-500 text-white"
                : "border border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            Banners
          </button>
        </div>

        {activeTab === "products" ? (
          <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingProductId ? "Edit Product" : "Add Product"}
                </h3>

                {editingProductId && (
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setProductForm(emptyProductForm);
                      clearAlerts();
                    }}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Price
                  </label>
                  <input
                    type="text"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="$99"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={productForm.image_url}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        image_url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      {editingProductId ? "Update Product" : "Add Product"}
                    </>
                  )}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Products List</h3>
                {loadingProducts && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {products.length === 0 && !loadingProducts ? (
                  <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-slate-400">
                    No products found.
                  </div>
                ) : (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-800">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-500">
                                <Package className="h-8 w-8" />
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-base font-semibold text-white">
                              {product.name}
                            </h4>
                            {product.price && (
                              <p className="mt-1 text-sm font-medium text-cyan-400">
                                {product.price}
                              </p>
                            )}
                            {product.description && (
                              <p className="mt-2 text-sm text-slate-400">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingBannerId ? "Edit Banner" : "Add Banner"}
                </h3>

                {editingBannerId && (
                  <button
                    onClick={() => {
                      setEditingBannerId(null);
                      setBannerForm(emptyBannerForm);
                      clearAlerts();
                    }}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              <form onSubmit={handleBannerSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Banner Title
                  </label>
                  <input
                    type="text"
                    value={bannerForm.title}
                    onChange={(e) =>
                      setBannerForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Subtitle
                  </label>
                  <textarea
                    rows={4}
                    value={bannerForm.subtitle}
                    onChange={(e) =>
                      setBannerForm((prev) => ({
                        ...prev,
                        subtitle: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={bannerForm.image_url}
                    onChange={(e) =>
                      setBannerForm((prev) => ({
                        ...prev,
                        image_url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      {editingBannerId ? "Update Banner" : "Add Banner"}
                    </>
                  )}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Banners List</h3>
                {loadingBanners && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {banners.length === 0 && !loadingBanners ? (
                  <div className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-slate-400">
                    No banners found.
                  </div>
                ) : (
                  banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-4">
                          <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-slate-800">
                            {banner.image_url ? (
                              <img
                                src={banner.image_url}
                                alt={banner.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-500">
                                <ImageIcon className="h-8 w-8" />
                              </div>
                            )}
                          </div>

                          <div>
                            <h4 className="text-base font-semibold text-white">
                              {banner.title}
                            </h4>
                            {banner.subtitle && (
                              <p className="mt-2 text-sm text-slate-400">
                                {banner.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditBanner(banner)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
  }
