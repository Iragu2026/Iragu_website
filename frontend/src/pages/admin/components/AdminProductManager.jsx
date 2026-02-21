import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  clearAdminProductsError,
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  uploadAdminProductImages,
  updateAdminProduct,
} from "../../../features/admin/adminProductsSlice.js";

const SALWAR_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
const SAREE_SUBCATEGORY_OPTIONS = [
  "Kalamkari",
  "Chettinad",
  "Mul Cotton",
  "Mul Cotton Printed",
  "Linen",
  "Mangalagiri",
  "Chanderi",
  "Kota Cotton",
  "Hand Embroidery",
];
const SAREE_OCCASION_OPTIONS = [
  "Casual Wear",
  "Festive Wear",
  "Office Wear",
  "Wedding",
];
const SALWAR_OCCASION_OPTIONS = [
  "Casual Wear",
  "Festive Wear",
  "Office Wear",
  "Wedding",
];
const COLOUR_OPTIONS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#6B7280" },
  { name: "Light Grey", hex: "#D1D5DB" },
  { name: "Charcoal", hex: "#374151" },
  { name: "Navy Blue", hex: "#1E3A8A" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Sky Blue", hex: "#38BDF8" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Turquoise", hex: "#14B8A6" },
  { name: "Green", hex: "#16A34A" },
  { name: "Dark Green", hex: "#14532D" },
  { name: "Olive", hex: "#4D7C0F" },
  { name: "Mint", hex: "#86EFAC" },
  { name: "Lime", hex: "#84CC16" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Mustard", hex: "#CA8A04" },
  { name: "Gold", hex: "#D4AF37" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Coral", hex: "#FB7185" },
  { name: "Peach", hex: "#FDBA74" },
  { name: "Red", hex: "#DC2626" },
  { name: "Maroon", hex: "#7F1D1D" },
  { name: "Wine", hex: "#7C2D12" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Rose Pink", hex: "#F472B6" },
  { name: "Magenta", hex: "#DB2777" },
  { name: "Purple", hex: "#9333EA" },
  { name: "Lavender", hex: "#C4B5FD" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Brown", hex: "#78350F" },
  { name: "Chocolate", hex: "#5C4033" },
  { name: "Coffee", hex: "#6F4E37" },
  { name: "Beige", hex: "#D4A373" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Off White", hex: "#FAF9F6" },
  { name: "Khaki", hex: "#C3B091" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Copper", hex: "#B87333" },
  { name: "Indigo", hex: "#4F46E5" },
];
const MAX_COLOUR_SUGGESTIONS = 10;
const SALWAR_TYPE_OPTIONS = [
  "Suit Set",
  "Coord Set",
  "Kurta",
  "Short Top",
  "Duppatta",
  "Stole",
];
const SALWAR_OPTIONS_BY_TYPE = {
  "Suit Set": [
    "Cotton",
    "Handblock Printed Cotton",
    "Kota Cotton",
    "Silk Cotton",
    "Kalamkari",
    "Chikankari",
    "Festive Wear",
  ],
  "Coord Set": ["Cotton", "Kalamkari", "Chikankari", "Ajrak"],
  Kurta: ["Cotton", "Kalamkari", "Chikankari", "Ajrak"],
  "Short Top": ["Cotton", "Kalamkari", "Ajrak"],
  Duppatta: ["Cotton", "Kota Cotton"],
  Stole: ["Cotton"],
};
const SALWAR_OPTION_SET = new Set(
  Object.values(SALWAR_OPTIONS_BY_TYPE).flat()
);

const normalizeColourName = (value) => String(value || "").trim().toLowerCase();
const COLOUR_OPTION_BY_KEY = new Map(
  COLOUR_OPTIONS.map((opt) => [
    normalizeColourName(opt.name),
    { name: opt.name, hex: opt.hex },
  ])
);

function findColourDefinition(rawName) {
  const key = normalizeColourName(rawName);
  if (!key) return null;
  const found = COLOUR_OPTION_BY_KEY.get(key);
  if (found) return found;
  return { name: String(rawName || "").trim(), hex: "" };
}

const emptyImage = () => ({
  public_id: "",
  url: "",
});

function parseSubCategoryList(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function formatSubCategory(value) {
  return parseSubCategoryList(value).join(", ");
}

function normalizeColorImages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => ({
      colorName: String(entry?.colorName || "").trim(),
      images: Array.isArray(entry?.images)
        ? entry.images
            .map((img) => ({
              public_id: String(img?.public_id || img?.publicId || "").trim(),
              url: String(img?.url || "").trim(),
              key: String(img?.key || "").trim(),
            }))
            .filter((img) => Boolean(img.url))
        : [],
    }))
    .filter((entry) => entry.colorName && entry.images.length > 0);
}

function flattenColorImages(colorImages) {
  return normalizeColorImages(colorImages).flatMap((entry) => entry.images);
}

function buildColorImagesFromLegacy(product) {
  const existing = normalizeColorImages(product?.colorImages);
  if (existing.length) return existing;
  const legacyImages = Array.isArray(product?.images) ? product.images : [];
  if (!legacyImages.length) return [];
  const firstColor =
    (Array.isArray(product?.colors) ? product.colors : []).find((c) => c?.name)
      ?.name || "Default";
  return [
    {
      colorName: firstColor,
      images: legacyImages
        .map((img) => ({
          public_id: String(img?.public_id || img?.publicId || "").trim(),
          url: String(img?.url || "").trim(),
          key: String(img?.key || "").trim(),
        }))
        .filter((img) => Boolean(img.url)),
    },
  ].filter((entry) => entry.images.length > 0);
}

const normalizeSizeKey = (value) => String(value || "").trim().toLowerCase();

function normalizeSizes(value) {
  const unique = new Map();
  (Array.isArray(value) ? value : [])
    .map((size) => String(size || "").trim())
    .filter(Boolean)
    .forEach((size) => {
      unique.set(normalizeSizeKey(size), size);
    });
  return Array.from(unique.values());
}

function normalizeSizePieces(value) {
  const unique = new Map();
  (Array.isArray(value) ? value : []).forEach((entry) => {
    const size = String(entry?.size || "").trim();
    const pieces = Number(entry?.pieces);
    if (!size || !Number.isFinite(pieces)) return;
    unique.set(normalizeSizeKey(size), {
      size,
      pieces: Math.max(0, Math.floor(pieces)),
    });
  });
  return Array.from(unique.values());
}

function syncSizesAndPieces(sizes, sizePieces) {
  const normalizedSizes = normalizeSizes(sizes);
  const normalizedSizePieces = normalizeSizePieces(sizePieces);
  const sourceSizes = normalizedSizes.length
    ? normalizedSizes
    : normalizedSizePieces.map((entry) => entry.size);
  const piecesMap = new Map(
    normalizedSizePieces.map((entry) => [
      normalizeSizeKey(entry.size),
      entry.pieces,
    ])
  );
  return {
    sizes: sourceSizes,
    sizePieces: sourceSizes.map((size) => ({
      size,
      pieces: Number(piecesMap.get(normalizeSizeKey(size)) ?? 0),
    })),
  };
}

function getSizePiecesValue(sizePieces, size) {
  const key = normalizeSizeKey(size);
  const entry = (Array.isArray(sizePieces) ? sizePieces : []).find(
    (item) => normalizeSizeKey(item?.size) === key
  );
  if (!entry) return "";
  return entry.pieces ?? "";
}

function setSizePiecesValue(sizePieces, size, value) {
  const key = normalizeSizeKey(size);
  const nextValue = String(value ?? "");
  const current = Array.isArray(sizePieces) ? sizePieces : [];
  const withoutCurrent = current.filter(
    (entry) => normalizeSizeKey(entry?.size) !== key
  );
  return [...withoutCurrent, { size, pieces: nextValue }];
}

function buildEmptyProduct(category) {
  return {
    category,
    name: "",
    description: "",
    price: "",
    stock: "",
    subCategory: "",
    subCategoryValues: [],
    salwarType: "",
    salwarOptionValues: [],
    colorImages: [],
    selectedUploadColor: "",
    fabric: "",
    length: "",
    occasionCsv: "",
    occasionValues: [],
    isNewArrival: false,
    isBestSeller: false,
    isFeatured: false,
    isOffer: false,
    sizes: [],
    sizePieces: [],
    washCare: "",
    shippingInfo: "",
    disclaimer: "",
    images: [emptyImage()],
    colors: [],
  };
}

function normalizeProductPayload(form) {
  const normalizedCategory = String(form.category || "").trim();
  const isSaree = normalizedCategory.toLowerCase() === "saree";
  const isSalwar = normalizedCategory.toLowerCase() === "salwar";

  const occasion =
    isSaree
      ? Array.from(
          new Set(
            (Array.isArray(form.occasionValues) ? form.occasionValues : []).filter((v) => SAREE_OCCASION_OPTIONS.includes(v)
            )
          )
        )
      : isSalwar
      ? Array.from(
          new Set(
            (Array.isArray(form.occasionValues) ? form.occasionValues : []).filter((v) => SALWAR_OCCASION_OPTIONS.includes(v)
            )
          )
        )
      : String(form.occasionCsv || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

  const sizes = normalizeSizes(form.sizes);
  const syncedSizesAndPieces = syncSizesAndPieces(sizes, form.sizePieces);
  const normalizedSizes =
    isSalwar ? syncedSizesAndPieces.sizes : sizes;
  const normalizedSizePieces =
    isSalwar ? syncedSizesAndPieces.sizePieces : [];

  const images = (form.images || [])
    .map((im, idx) => ({
      public_id:
        im.public_id?.trim() ||
        `manual_${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}`,
      url: im.url?.trim(),
    }))
    .filter((im) => Boolean(im.url));

  const colors = (form.colors || [])
    .map((c) => ({ name: c.name?.trim(), hex: c.hex?.trim() || "" }))
    .filter((c) => Boolean(c.name));

  const normalizedColorImages = normalizeColorImages(form.colorImages);
  const flatImages = flattenColorImages(normalizedColorImages);
  const mergedColors = Array.from(
    new Set([
      ...colors.map((c) => c.name),
      ...normalizedColorImages.map((c) => c.colorName),
    ])
  ).map((name) => {
    const existing = colors.find((c) => c.name === name);
    return existing || { name, hex: "" };
  });

  const normalizedSubCategory = isSaree
      ? Array.from(
          new Set(
            parseSubCategoryList(form.subCategoryValues).filter((v) => SAREE_SUBCATEGORY_OPTIONS.includes(v)
            )
          )
        ).join(", ")
      : isSalwar
      ? String(form.salwarType || form.subCategory || "").trim()
      : form.subCategory?.trim() || "";

  let normalizedFabric = form.fabric?.trim() || "";
  let normalizedOccasion = occasion;

  if (isSalwar) {
    const selectedType = String(form.salwarType || "").trim();
    const allowed = SALWAR_OPTIONS_BY_TYPE[selectedType] || [];
    const selectedOptions = Array.from(
      new Set(
        parseSubCategoryList(form.salwarOptionValues).filter((v) => allowed.includes(v)
        )
      )
    );
    const selectedFabricValues = selectedOptions.filter(
      (v) => v !== "Festive Wear"
    );
    const selectedOccasions = selectedOptions
      .filter((v) => v === "Festive Wear")
      .map((v) => v.trim());

    const existingFabricTokens = parseSubCategoryList(form.fabric);
    const extraFabricValues = existingFabricTokens.filter(
      (v) => !SALWAR_OPTION_SET.has(v)
    );

    normalizedFabric = Array.from(
      new Set([...selectedFabricValues, ...extraFabricValues])
    ).join(", ");
    normalizedOccasion = Array.from(
      new Set([...(Array.isArray(occasion) ? occasion : []), ...selectedOccasions])
    );
  }

  return {
    category: normalizedCategory,
    name: form.name?.trim(),
    description: form.description?.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
    subCategory: normalizedSubCategory,
    fabric: normalizedFabric,
    length: form.length?.trim() || "",
    occasion: normalizedOccasion,
    isNewArrival: Boolean(form.isNewArrival),
    isBestSeller: Boolean(form.isBestSeller),
    isFeatured: Boolean(form.isFeatured),
    isOffer: Boolean(form.isOffer),
    sizes: normalizedSizes,
    sizePieces: normalizedSizePieces,
    washCare: form.washCare?.trim() || "",
    shippingInfo: form.shippingInfo?.trim() || "",
    disclaimer: form.disclaimer?.trim() || "",
    images: flatImages.length > 0 ? flatImages : images,
    colorImages: normalizedColorImages,
    colors: mergedColors,
  };
}

export default function AdminProductManager({ category, title }) {
  const dispatch = useDispatch();
  const { productsByCategory, loading, error, saving, deleting, uploadingImages } = useSelector(
    (s) => s.adminProducts
  );

  const products = useMemo(
    () => productsByCategory?.[category] || [],
    [productsByCategory, category]
  );
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // product object or null
  const [form, setForm] = useState(() => buildEmptyProduct(category));
  const [uploadColourOpen, setUploadColourOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminProducts({ category }));
  }, [dispatch, category]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAdminProductsError());
    }
  }, [error, dispatch]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter((p) => {
      const hay = `${p.name || ""} ${formatSubCategory(p.subCategory)} ${p.fabric || ""}`.toLowerCase();
      return hay.includes(query);
    });
  }, [products, q]);

  const uploadColourSuggestions = useMemo(() => {
    const query = normalizeColourName(form.selectedUploadColor);
    const options = COLOUR_OPTIONS.filter((opt) => {
      if (!query) return true;
      return normalizeColourName(opt.name).includes(query);
    });
    return options.slice(0, MAX_COLOUR_SUGGESTIONS);
  }, [form.selectedUploadColor]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildEmptyProduct(category));
    setModalOpen(true);
  };

  const openEdit = (p) => {
    const syncedSizesAndPieces = syncSizesAndPieces(
      Array.isArray(p.sizes) ? p.sizes : [],
      Array.isArray(p.sizePieces) ? p.sizePieces : []
    );
    setEditing(p);
    setForm({
      category: category,
      name: p.name || "",
      description: p.description || "",
      price: String(p.price ?? ""),
      stock: String(p.stock ?? ""),
      subCategory: typeof p.subCategory === "string" ? p.subCategory : "",
      subCategoryValues: parseSubCategoryList(p.subCategory).filter((v) => SAREE_SUBCATEGORY_OPTIONS.includes(v)
      ),
      salwarType: SALWAR_TYPE_OPTIONS.includes(p.subCategory)
        ? p.subCategory
        : "",
      salwarOptionValues: [
        ...parseSubCategoryList(p.fabric).filter((v) => SALWAR_OPTION_SET.has(v)),
        ...(Array.isArray(p.occasion)
          ? p.occasion.filter((v) => v === "Festive Wear")
          : []),
      ],
      colorImages: buildColorImagesFromLegacy(p),
      selectedUploadColor:
        (Array.isArray(p.colors) ? p.colors : []).find((c) => c?.name)?.name || "",
      fabric: p.fabric || "",
      length: p.length || "",
      occasionCsv: Array.isArray(p.occasion) ? p.occasion.join(", ") : "",
      occasionValues: Array.isArray(p.occasion) ? p.occasion : [],
      isNewArrival: Boolean(p.isNewArrival),
      isBestSeller: Boolean(p.isBestSeller),
      isFeatured: Boolean(p.isFeatured),
      isOffer: Boolean(p.isOffer),
      sizes: syncedSizesAndPieces.sizes,
      sizePieces: syncedSizesAndPieces.sizePieces.map((entry) => ({
        size: entry.size,
        pieces: String(entry.pieces ?? 0),
      })),
      washCare: p.washCare || "",
      shippingInfo: p.shippingInfo || "",
      disclaimer: p.disclaimer || "",
      images: Array.isArray(p.images) && p.images.length ? p.images : [emptyImage()],
      colors: Array.isArray(p.colors) ? p.colors : [],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const preventNumberWheelChange = (event) => {
    const target = event.target;
    if (
      target &&
      target.tagName === "INPUT" &&
      String(target.type || "").toLowerCase() === "number"
    ) {
      target.blur();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Please fill name and description");
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (form.stock === "" || Number(form.stock) < 0) {
      toast.error("Please enter a valid stock value");
      return;
    }
    if (category === "Salwar" && !String(form.salwarType || "").trim()) {
      toast.error("Please select Salwar type");
      return;
    }
    if (
      category === "Salwar" &&
      parseSubCategoryList(form.salwarOptionValues).length === 0
    ) {
      toast.error("Please select at least one Salwar option");
      return;
    }
    if (category === "Salwar" && (!Array.isArray(form.sizes) || form.sizes.length === 0)) {
      toast.error("Please select at least one size");
      return;
    }
    if (category === "Salwar") {
      const selectedSizes = normalizeSizes(form.sizes);
      for (const size of selectedSizes) {
        const rawPieces = getSizePiecesValue(form.sizePieces, size);
        if (rawPieces === "" || rawPieces === null || rawPieces === undefined) {
          toast.error(`Enter pieces available for size ${size}`);
          return;
        }
        const pieces = Number(rawPieces);
        if (!Number.isInteger(pieces) || pieces < 0) {
          toast.error(`Pieces for size ${size} must be a non-negative whole number`);
          return;
        }
      }
    }

    const payload = normalizeProductPayload(form);
    if (!payload.images.length) {
      toast.error("Please upload at least one product image");
      return;
    }
    if (!payload.colors.length) {
      toast.error("Please add at least one colour name");
      return;
    }

    try {
      if (editing?._id) {
        await dispatch(updateAdminProduct({ id: editing._id, updates: payload })).unwrap();
        toast.success("Product updated");
      } else {
        await dispatch(createAdminProduct(payload)).unwrap();
        toast.success("Product created");
      }
      await dispatch(fetchAdminProducts({ category })).unwrap();
      closeModal();
    } catch (err) {
      toast.error(err || "Failed to save product");
    }
  };

  const handleUploadImages = async (filesList) => {
    const selectedColorDef = findColourDefinition(form.selectedUploadColor);
    const colorName = String(selectedColorDef?.name || "").trim();
    const files = Array.from(filesList || []);
    if (!colorName) {
      toast.error("Select a colour before uploading images");
      return;
    }
    if (!files.length) {
      toast.error("Please choose one or more image files");
      return;
    }
    try {
      const uploaded = await dispatch(
        uploadAdminProductImages({ colorName, files })
      ).unwrap();
      setForm((prev) => {
        const current = normalizeColorImages(prev.colorImages);
        const index = current.findIndex((c) => c.colorName === colorName);
        if (index >= 0) {
          current[index] = {
            ...current[index],
            images: [...current[index].images, ...(uploaded.images || [])],
          };
        } else {
          current.push({ colorName, images: uploaded.images || [] });
        }
        const hasColor = (prev.colors || []).some(
          (c) => normalizeColourName(c.name) === normalizeColourName(colorName)
        );
        return {
          ...prev,
          selectedUploadColor: colorName,
          colorImages: current,
          colors: hasColor ? prev.colors : [...(prev.colors || []), selectedColorDef],
        };
      });
      toast.success(`${files.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err || "Failed to upload images");
    }
  };

  const pickUploadColour = (name) => {
    const selected = findColourDefinition(name);
    if (!selected?.name) return;
    setForm((prev) => ({
      ...prev,
      selectedUploadColor: selected.name,
    }));
    setUploadColourOpen(false);
  };

  const removeColorImage = (colorName, imageIndex) => {
    setForm((prev) => {
      const nextColorImages = normalizeColorImages(prev.colorImages)
        .map((entry) => normalizeColourName(entry.colorName) === normalizeColourName(colorName)
            ? {
                ...entry,
                images: entry.images.filter((_, idx) => idx !== imageIndex),
              }
            : entry
        )
        .filter((entry) => entry.images.length > 0);

      const activeColourKeys = new Set(
        nextColorImages.map((entry) => normalizeColourName(entry.colorName))
      );

      return {
        ...prev,
        colorImages: nextColorImages,
        colors: (prev.colors || []).filter((c) => activeColourKeys.has(normalizeColourName(c.name))
        ),
        selectedUploadColor: activeColourKeys.has(normalizeColourName(prev.selectedUploadColor))
          ? prev.selectedUploadColor
          : "",
      };
    });
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const ok = window.confirm("Delete this product? This cannot be undone.");
    if (!ok) return;
    try {
      await dispatch(deleteAdminProduct(id)).unwrap();
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err || "Failed to delete product");
    }
  };

  const firstImage = (p) => p?.images?.[0]?.url || "/images/new_arrival1.png";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1f1f1f]">{title}</h2>
          <p className="mt-0.5 text-sm text-[#6b6b6b]">
            Create, update, and manage your {category.toLowerCase()} products.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
          style={{ background: "var(--brand-ink)" }}
        >
          <FiPlus size={14} />
          Create
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, subcategory, fabric…"
          className="w-full max-w-md rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
         name="search-by-name-subcategory-fabric" id="search-by-name-subcategory-fabric" aria-label="Search by name, subcategory, fabric…" />
        <div className="text-sm text-[#6b6b6b]">
          {loading ? "Loading…" : `${filtered.length} products`}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-black/10">
        <div className="grid grid-cols-[64px_1.3fr_1fr_0.7fr_0.8fr_120px] gap-4 bg-black/[0.03] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
          <div>Image</div>
          <div>Name</div>
          <div>Fabric / Subcategory</div>
          <div className="text-right">Price</div>
          <div className="text-right">Stock</div>
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-md bg-black/[0.03]" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="divide-y divide-black/5">
            {filtered.map((p) => (
              <div
                key={p._id}
                className="grid grid-cols-[64px_1.3fr_1fr_0.7fr_0.8fr_120px] items-center gap-4 px-5 py-4"
              >
                <div className="h-12 w-12 overflow-hidden rounded-md border border-black/10 bg-[#fbf7f0]">
                  <img
                    src={firstImage(p)}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f1f1f]">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6b6b6b] truncate">
                    ID: {String(p._id).slice(-10)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#1f1f1f]">
                    {p.fabric || "-"}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6b6b6b] truncate">
                    {formatSubCategory(p.subCategory) || "-"}
                  </p>
                </div>
                <div className="text-right text-sm font-semibold text-[#1f1f1f]">
                  Rs. {Number(p.price || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-right text-sm text-[#1f1f1f]">
                  {p.stock ?? 0}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white p-2 text-[#4a4a4a] transition hover:bg-black/[0.03]"
                    title="Edit"
                  >
                    <FiEdit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p._id)}
                    className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white p-2 text-[#4a4a4a] transition hover:bg-black/[0.03]"
                    title="Delete"
                    disabled={deleting}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-[#6b6b6b]">No products found.</p>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-[71] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-[#1f1f1f]">
                  {editing ? "Edit Product" : "Create Product"}
                </p>
                <p className="text-xs text-[#9a9a9a]">Category: {category}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-2 text-[#6b6b6b] hover:bg-black/[0.03]"
                aria-label="Close"
              >
                <FiX size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              onWheelCapture={preventNumberWheelChange}
              className="max-h-[78vh] overflow-y-auto"
            >
              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="Product name"
                    required
                   name="product-name" id="product-name" aria-label="Product name" />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    className="min-h-[100px] w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="Product description"
                    required
                   name="product-description" id="product-description" aria-label="Product description" />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="e.g. 3499"
                    required
                   name="e-g-3499" id="e-g-3499" aria-label="e.g. 3499" />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="e.g. 10"
                    required
                   name="e-g-10" id="e-g-10" aria-label="e.g. 10" />
                </div>

                <div
                  className={
                    category === "Saree" || category === "Salwar"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Subcategory
                  </label>
                  {category === "Saree" ? (
                    <>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {SAREE_SUBCATEGORY_OPTIONS.map((sub) => {
                          const checked = Array.isArray(form.subCategoryValues)
                            ? form.subCategoryValues.includes(sub)
                            : false;
                          return (
                            <label
                              key={sub}
                              className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-[#4a4a4a]"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const on = e.target.checked;
                                  setForm((p) => {
                                    const current = Array.isArray(p.subCategoryValues)
                                      ? p.subCategoryValues
                                      : [];
                                    const next = on
                                      ? Array.from(new Set([...current, sub]))
                                      : current.filter((x) => x !== sub);
                                    return { ...p, subCategoryValues: next };
                                  });
                                }}
                               name="checkbox" id="checkbox" aria-label="input field" />
                              {sub}
                            </label>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-[#9a9a9a]">
                        Selected: {formatSubCategory(form.subCategoryValues) || "None"}
                      </p>
                    </>
                  ) : category === "Salwar" ? (
                    <select
                      value={form.salwarType}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setForm((p) => ({
                          ...p,
                          salwarType: nextType,
                          subCategory: nextType,
                          salwarOptionValues: [],
                        }));
                      }}
                      className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                     name="select-field" id="select-field" aria-label="select field">
                      <option value="">Select salwar type</option>
                      {SALWAR_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.subCategory}
                      onChange={(e) => setForm((p) => ({ ...p, subCategory: e.target.value }))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                      placeholder="e.g. Churidar"
                     name="e-g-churidar" id="e-g-churidar" aria-label="e.g. Churidar" />
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Fabric
                  </label>
                  {category === "Salwar" ? (
                    <>
                      {form.salwarType ? (
                        <>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(SALWAR_OPTIONS_BY_TYPE[form.salwarType] || []).map(
                              (option) => {
                                const checked = Array.isArray(
                                  form.salwarOptionValues
                                )
                                  ? form.salwarOptionValues.includes(option)
                                  : false;
                                return (
                                  <label
                                    key={option}
                                    className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-[#4a4a4a]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        const on = e.target.checked;
                                        setForm((p) => {
                                          const current = Array.isArray(
                                            p.salwarOptionValues
                                          )
                                            ? p.salwarOptionValues
                                            : [];
                                          const next = on
                                            ? Array.from(
                                                new Set([...current, option])
                                              )
                                            : current.filter((x) => x !== option);
                                          return {
                                            ...p,
                                            salwarOptionValues: next,
                                          };
                                        });
                                      }}
                                     name="checkbox-2" id="checkbox-2" aria-label="input field" />
                                    {option}
                                  </label>
                                );
                              }
                            )}
                          </div>
                          <p className="mt-2 text-xs text-[#9a9a9a]">
                            Selected:{" "}
                            {parseSubCategoryList(form.salwarOptionValues).join(", ") ||
                              "None"}
                          </p>
                        </>
                      ) : (
                        <p className="rounded-lg border border-dashed border-black/15 px-4 py-3 text-sm text-[#9a9a9a]">
                          Select Salwar type first.
                        </p>
                      )}
                    </>
                  ) : (
                    <input
                      value={form.fabric}
                      onChange={(e) => setForm((p) => ({ ...p, fabric: e.target.value }))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                      placeholder="e.g. Pure Cotton"
                     name="e-g-pure-cotton" id="e-g-pure-cotton" aria-label="e.g. Pure Cotton" />
                  )}
                </div>

                {category === "Saree" ? (
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Length
                    </label>
                    <input
                      value={form.length}
                      onChange={(e) => setForm((p) => ({ ...p, length: e.target.value }))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                      placeholder='e.g. 6.25 meters'
                     name="e-g-6-25-meters" id="e-g-6-25-meters" aria-label="e.g. 6.25 meters" />
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Occasions
                  </label>
                  {category === "Saree" || category === "Salwar" ? (
                    <>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(category === "Saree"
                          ? SAREE_OCCASION_OPTIONS
                          : SALWAR_OCCASION_OPTIONS
                        ).map((occ) => {
                          const checked = Array.isArray(form.occasionValues)
                            ? form.occasionValues.includes(occ)
                            : false;
                          return (
                            <label
                              key={occ}
                              className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-[#4a4a4a]"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const on = e.target.checked;
                                  setForm((p) => {
                                    const current = Array.isArray(p.occasionValues)
                                      ? p.occasionValues
                                      : [];
                                    const next = on
                                      ? Array.from(new Set([...current, occ]))
                                      : current.filter((x) => x !== occ);
                                    return { ...p, occasionValues: next };
                                  });
                                }}
                               name="checkbox-3" id="checkbox-3" aria-label="input field" />
                              {occ}
                            </label>
                          );
                        })}
                      </div>
                      <p className="mt-2 text-xs text-[#9a9a9a]">
                        Selected: {(Array.isArray(form.occasionValues) ? form.occasionValues : []).join(", ") || "None"}
                      </p>
                    </>
                  ) : (
                    <input
                      value={form.occasionCsv}
                      onChange={(e) => setForm((p) => ({ ...p, occasionCsv: e.target.value }))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                      placeholder="e.g. Casual Wear, Festive Wear"
                     name="e-g-casual-wear-festive-wear" id="e-g-casual-wear-festive-wear" aria-label="e.g. Casual Wear, Festive Wear" />
                  )}
                </div>

                {category === "Salwar" ? (
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Sizes
                    </label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {SALWAR_SIZES.map((sz) => {
                        const checked = Array.isArray(form.sizes)
                          ? form.sizes.includes(sz)
                          : false;
                        return (
                          <label
                            key={sz}
                            className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-[#4a4a4a]"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setForm((p) => {
                                  const current = Array.isArray(p.sizes)
                                    ? p.sizes
                                    : [];
                                  const next = on
                                    ? Array.from(new Set([...current, sz]))
                                    : current.filter((x) => x !== sz);
                                  const nextSizePieces = on
                                    ? setSizePiecesValue(
                                        p.sizePieces,
                                        sz,
                                        getSizePiecesValue(p.sizePieces, sz)
                                      )
                                    : (Array.isArray(p.sizePieces)
                                        ? p.sizePieces
                                        : []
                                      ).filter(
                                        (entry) =>
                                          normalizeSizeKey(entry?.size) !==
                                          normalizeSizeKey(sz)
                                      );
                                  return {
                                    ...p,
                                    sizes: next,
                                    sizePieces: nextSizePieces,
                                  };
                                });
                              }}
                             name="checkbox-4" id="checkbox-4" aria-label="input field" />
                            {sz}
                          </label>
                        );
                      })}
                    </div>
                    {Array.isArray(form.sizes) && form.sizes.length > 0 ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        {normalizeSizes(form.sizes).map((size) => (
                          <label
                            key={`pieces-${size}`}
                            className="rounded-lg border border-black/10 bg-white px-3 py-2.5"
                          >
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6b6b6b]">
                              {size} pieces
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={getSizePiecesValue(form.sizePieces, size)}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  sizePieces: setSizePiecesValue(
                                    p.sizePieces,
                                    size,
                                    e.target.value
                                  ),
                                }))
                              }
                              className="mt-1 w-full rounded border border-black/10 px-2.5 py-2 text-sm outline-none transition focus:border-[color:var(--brand)]"
                              placeholder="0"
                              name={`pieces-${size.toLowerCase()}`}
                              id={`pieces-${size.toLowerCase()}`}
                              aria-label={`${size} pieces`}
                            />
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="sm:col-span-2 flex flex-wrap gap-3">
                  {[
                    ["isNewArrival", "New Arrival"],
                    ["isBestSeller", "Best Seller"],
                    ["isFeatured", "Featured"],
                    ["isOffer", "Offer"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm text-[#4a4a4a]"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(form[key])}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))
                        }
                       name="checkbox-5" id="checkbox-5" aria-label="input field" />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Wash care
                  </label>
                  <input
                    value={form.washCare}
                    onChange={(e) => setForm((p) => ({ ...p, washCare: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="e.g. Dry clean only"
                   name="e-g-dry-clean-only" id="e-g-dry-clean-only" aria-label="e.g. Dry clean only" />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                    Shipping info
                  </label>
                  <input
                    value={form.shippingInfo}
                    onChange={(e) => setForm((p) => ({ ...p, shippingInfo: e.target.value }))
                    }
                    className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                    placeholder="e.g. Ships in 2-3 business days"
                   name="e-g-ships-in-2-3-business-days" id="e-g-ships-in-2-3-business-days" aria-label="e.g. Ships in 2-3 business days" />
                </div>

                {(category === "Saree" || category === "Salwar") ? (
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Disclaimer
                    </label>
                    <textarea
                      value={form.disclaimer}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, disclaimer: e.target.value }))
                      }
                      className="min-h-[90px] w-full rounded-lg border border-black/10 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--brand)]"
                      placeholder="e.g. Color may vary slightly due to studio lighting and display settings."
                      name="product-disclaimer"
                      id="product-disclaimer"
                      aria-label="Product disclaimer"
                    />
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                      Product Images (Upload by Colour)
                    </label>
                  </div>
                  <div className="mt-2 space-y-3 rounded-lg border border-black/10 p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                      <div className="relative">
                        <input
                          value={form.selectedUploadColor}
                          onChange={(e) => setForm((p) => ({
                              ...p,
                              selectedUploadColor: e.target.value,
                            }))
                          }
                          onFocus={() => setUploadColourOpen(true)}
                          onBlur={() => {
                            setTimeout(() => setUploadColourOpen(false), 100);
                          }}
                          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[color:var(--brand)]"
                          placeholder="Search colour for upload (e.g. teal)"
                         name="search-colour-for-upload-e-g-teal" id="search-colour-for-upload-e-g-teal" aria-label="Search colour for upload (e.g. teal)" />
                        {uploadColourOpen && uploadColourSuggestions.length > 0 ? (
                          <div className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-black/10 bg-white shadow-md">
                            {uploadColourSuggestions.map((opt) => (
                              <button
                                key={`${opt.name}-${opt.hex}`}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  pickUploadColour(opt.name);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#2a2a2a] transition hover:bg-black/[0.03]"
                              >
                                <span
                                  className="inline-block h-3.5 w-3.5 rounded-full border border-black/10"
                                  style={{ backgroundColor: opt.hex }}
                                />
                                {opt.name}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingImages}
                        onChange={(e) => {
                          handleUploadImages(e.target.files);
                          e.target.value = "";
                        }}
                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded file:border-0 file:bg-black/5 file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                       name="file" id="file" aria-label="input field" />
                    </div>
                    {uploadingImages ? (
                      <p className="text-xs text-[#6b6b6b]">Uploading images...</p>
                    ) : null}
                    <p className="text-xs text-[#9a9a9a]">
                      Enter or select a colour, then upload images. Colour tags are managed automatically.
                    </p>
                    {normalizeColorImages(form.colorImages).map((entry) => (
                      <div key={entry.colorName}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b6b6b]">
                          {entry.colorName} ({entry.images.length})
                        </p>
                        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
                          {entry.images.map((img, idx) => (
                            <div
                              key={`${entry.colorName}-${img.public_id || img.url}-${idx}`}
                              className="relative overflow-hidden rounded-md border border-black/10 bg-white"
                            >
                              <img
                                src={img.url}
                                alt={`${entry.colorName} ${idx + 1}`}
                                className="h-20 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeColorImage(entry.colorName, idx)}
                                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded bg-white/90 text-[#4a4a4a] shadow-sm hover:bg-white"
                                title="Remove"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-black/5 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded border border-black/10 bg-white px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#4a4a4a] transition hover:bg-black/[0.03]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "var(--brand-ink)" }}
                >
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
