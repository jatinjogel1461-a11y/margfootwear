import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { formatINR } from "@/lib/products";
import type { AdminProduct } from "@/lib/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/products")({
  component: AdminProductsPage,
});

const CATEGORIES = ["men", "women", "kids"] as const;
const SUB_CATEGORIES = ["Running", "Casual", "Sports", "Lifestyle", "Training"] as const;

function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
  });

  // Add form state
  const [addForm, setAddForm] = useState({
    id: "",
    name: "",
    category: "men",
    sub: "Running",
    price: "",
    stock: "20",
    description: "",
  });

  const { data: products, isLoading, error } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AdminProduct[];
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load products");
    }
  }, [error]);

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setEditForm({
      name: p.name,
      price: String(p.price),
      stock: p.stock !== undefined && p.stock !== null ? String(p.stock) : "0",
      description: p.description ?? "",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const { error: err } = await supabase
      .from("products")
      .update({
        name: editForm.name.trim(),
        price: Number(editForm.price),
        stock: Number(editForm.stock || 0),
        description: editForm.description.trim(),
      })
      .eq("id", editing.id);
    setSaving(false);

    if (err) {
      toast.error(err.message || "Failed to update product");
      return;
    }

    toast.success("Product updated");
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug =
      addForm.id.trim() ||
      "sv-" +
        addForm.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

    setSaving(true);
    const { error: err } = await supabase.from("products").insert({
      id: slug,
      name: addForm.name.trim(),
      category: addForm.category,
      sub: addForm.sub,
      price: Number(addForm.price),
      stock: Number(addForm.stock || 0),
      description: addForm.description.trim(),
    });
    setSaving(false);

    if (err) {
      toast.error(err.message || "Failed to add product");
      return;
    }

    toast.success("Product added");
    setAdding(false);
    setAddForm({
      id: "",
      name: "",
      category: "men",
      sub: "Running",
      price: "",
      stock: "20",
      description: "",
    });
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    const { error: err } = await supabase.from("products").delete().eq("id", deleting.id);
    setSaving(false);

    if (err) {
      toast.error(err.message || "Failed to delete product");
      return;
    }

    toast.success(`Deleted ${deleting.name}`);
    setDeleting(null);
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage catalog items, pricing, and stock.</p>
        </div>

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-full bg-neon text-neon-foreground font-semibold px-4 py-2 text-sm hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-neon" />
        </div>
      ) : !products || products.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center space-y-2">
          <Package className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No products in database.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-background/50">
                  <td className="py-3 px-4">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">{p.id}</div>
                  </td>
                  <td className="py-3 px-4 capitalize text-muted-foreground">
                    {p.category} · {p.sub}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">
                    {formatINR(Number(p.price || 0))}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {p.stock !== undefined && p.stock !== null ? p.stock : "—"}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      aria-label={`Edit ${p.name}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border hover:border-neon hover:text-neon text-xs mr-2 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(p)}
                      aria-label={`Delete ${p.name}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border hover:border-destructive hover:text-destructive text-xs transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Edit {editing?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Name</span>
              <input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-neon"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Price (₹)</span>
                <input
                  required
                  type="number"
                  min={1}
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-neon"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Stock</span>
                <input
                  required
                  type="number"
                  min={0}
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-neon"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Description</span>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-neon"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-full border border-border text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-full bg-neon text-neon-foreground font-semibold text-sm disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-display">Add Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Name</span>
                <input
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Marg Pulse Max"
                  className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-neon"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">ID (slug, optional)</span>
                <input
                  value={addForm.id}
                  onChange={(e) => setAddForm({ ...addForm, id: e.target.value })}
                  placeholder="sv-pulse-max"
                  className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-neon"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Category</span>
                <select
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm capitalize focus:outline-none focus:border-neon"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Sub-category</span>
                <select
                  value={addForm.sub}
                  onChange={(e) => setAddForm({ ...addForm, sub: e.target.value })}
                  className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-neon"
                >
                  {SUB_CATEGORIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Price (₹)</span>
                <input
                  required
                  type="number"
                  min={1}
                  value={addForm.price}
                  onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                  className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-neon"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Stock</span>
                <input
                  required
                  type="number"
                  min={0}
                  value={addForm.stock}
                  onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
                  className="w-full min-h-[40px] rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono focus:outline-none focus:border-neon"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Description</span>
              <textarea
                rows={3}
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:border-neon"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="px-4 py-2 rounded-full border border-border text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-full bg-neon text-neon-foreground font-semibold text-sm disabled:opacity-50"
              >
                {saving ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
