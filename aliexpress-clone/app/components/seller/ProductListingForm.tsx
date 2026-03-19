/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Search,
  PackagePlus,
  Upload,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Eye,
  EyeOff,
  Info,
  Store,
  Percent,
  Rocket,
  Check,
  TrendingUp,
} from 'lucide-react';

interface ProductFormData {
  title: string;
  description: string;
  category: string;
  basePrice: string;
  profitMargin: string;
  stock: string;
  images: File[];
  sku: string;
}

interface CatalogProduct {
  externalId: number;
  title: string;
  description: string;
  category: string;
  basePrice: number;
  discountPercentage?: number;
  stock: number;
  brand: string;
  rating: number;
  thumbnail: string;
  images: string[];
}

type CatalogResponse = {
  success: boolean;
  data?: {
    products: CatalogProduct[];
    total: number;
    skip: number;
    limit: number;
  };
  error?: string;
};

const CATALOG_PAGE_SIZE = 12;
const MARGIN_MIN = 15;
const MARGIN_MAX = 25;
const MARGIN_PRESETS = [15, 20, 25] as const;
const CATEGORY_OPTIONS = [
  { label: 'Beauty', value: 'beauty' },
  { label: 'Fragrances', value: 'fragrances' },
  { label: 'Groceries', value: 'groceries' },
  { label: 'Furniture', value: 'furniture' },
  { label: 'Home Decoration', value: 'home-decoration' },
  { label: 'Kitchen Accessories', value: 'kitchen-accessories' },
  { label: 'Laptops', value: 'laptops' },
  { label: 'Mens Shirts', value: 'mens-shirts' },
  { label: 'Mens Shoes', value: 'mens-shoes' },
  { label: 'Mens Watches', value: 'mens-watches' },
  { label: 'Mobile Accessories', value: 'mobile-accessories' },
  { label: 'Motorcycle', value: 'motorcycle' },
  { label: 'Skin Care', value: 'skin-care' },
  { label: 'Smartphones', value: 'smartphones' },
  { label: 'Sports Accessories', value: 'sports-accessories' },
  { label: 'Sunglasses', value: 'sunglasses' },
  { label: 'Tablets', value: 'tablets' },
  { label: 'Tops', value: 'tops' },
  { label: 'Vehicle', value: 'vehicle' },
  { label: 'Womens Bags', value: 'womens-bags' },
  { label: 'Womens Dresses', value: 'womens-dresses' },
  { label: 'Womens Jewellery', value: 'womens-jewellery' },
  { label: 'Womens Shoes', value: 'womens-shoes' },
  { label: 'Womens Watches', value: 'womens-watches' },
];

export default function ProductListingForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    category: 'electronics',
    basePrice: '',
    profitMargin: '20',
    stock: '',
    images: [],
    sku: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [productMargins, setProductMargins] = useState<Record<number, number>>({});
  const [visibleProducts, setVisibleProducts] = useState<Set<number>>(new Set());
  const [publishOrder, setPublishOrder] = useState<number[]>([]);

  const redirectToDashboard = () => {
    window.setTimeout(() => {
      router.push('/seller/dashboard');
    }, 400);
  };

  const totalCatalogPages = Math.max(1, Math.ceil(catalogTotal / CATALOG_PAGE_SIZE));

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      try {
        setIsCatalogLoading(true);
        const params = new URLSearchParams({
          limit: `${CATALOG_PAGE_SIZE}`,
          skip: `${(catalogPage - 1) * CATALOG_PAGE_SIZE}`,
        });

        if (catalogQuery.trim()) {
          params.set('search', catalogQuery.trim());
        } else if (selectedCategories.length === 1) {
          params.set('category', selectedCategories[0]);
        }

        const response = await fetch(`/api/seller/catalog?${params.toString()}`);
        const data = (await response.json()) as CatalogResponse;

        if (!response.ok || !data.success || !data.data) {
          throw new Error(data.error || 'Failed to load supplier catalog');
        }

        setCatalogProducts(data.data.products);
        setCatalogTotal(data.data.total);
      } catch (error) {
        console.error('Catalog load error:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load supplier catalog');
      } finally {
        setIsCatalogLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [catalogPage, catalogQuery, selectedCategories]);

  const filteredProducts = useMemo(() => {
    if (selectedCategories.length === 0) return catalogProducts;
    return catalogProducts.filter((product) => selectedCategories.includes(product.category));
  }, [catalogProducts, selectedCategories]);

  const totalProductsShown = filteredProducts.length;

  const selectedMarginProducts = useMemo(
    () => catalogProducts.filter((product) => selectedProducts.has(product.externalId)),
    [catalogProducts, selectedProducts]
  );

  const selectedProductMap = useMemo(() => {
    return new Map(selectedMarginProducts.map((product) => [product.externalId, product]));
  }, [selectedMarginProducts]);

  const arrangedProducts = useMemo(() => {
    if (publishOrder.length === 0) return selectedMarginProducts;
    return publishOrder
      .map((id) => selectedProductMap.get(id))
      .filter((product): product is CatalogProduct => Boolean(product));
  }, [publishOrder, selectedMarginProducts, selectedProductMap]);

  const toggleCategory = (value: string) => {
    setSelectedCategories((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const selectAllCategories = () => {
    setSelectedCategories(CATEGORY_OPTIONS.map((category) => category.value));
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'basePrice' || name === 'profitMargin') {
      const basePrice = parseFloat(name === 'basePrice' ? value : formData.basePrice);
      const margin = parseFloat(name === 'profitMargin' ? value : formData.profitMargin);

      if (!Number.isNaN(basePrice) && !Number.isNaN(margin)) {
        const sellingPrice = basePrice + (basePrice * margin) / 100;
        setCalculatedPrice(Number(sellingPrice.toFixed(2)));
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newImages = Array.from(files);
    if (formData.images.length + newImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setFormData((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const profitPerUnit = useMemo(
    () => calculatedPrice - parseFloat(formData.basePrice || '0'),
    [calculatedPrice, formData.basePrice]
  );

  const stockValue = useMemo(() => {
    const parsed = parseInt(formData.stock || '0', 10);
    return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
  }, [formData.stock]);

  const estimatedStockProfit = useMemo(() => {
    return Number((profitPerUnit * stockValue).toFixed(2));
  }, [profitPerUnit, stockValue]);

  const marginValue = useMemo(() => {
    const parsed = parseFloat(formData.profitMargin || '20');
    if (Number.isNaN(parsed)) return 20;
    return Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, parsed));
  }, [formData.profitMargin]);

  const applyMargin = (margin: number) => {
    const basePrice = parseFloat(formData.basePrice || '0');
    const safeMargin = Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, margin));
    setFormData((prev) => ({ ...prev, profitMargin: `${safeMargin}` }));
    if (!Number.isNaN(basePrice) && basePrice > 0) {
      const sellingPrice = basePrice + (basePrice * safeMargin) / 100;
      setCalculatedPrice(Number(sellingPrice.toFixed(2)));
    }
  };

  const getProductMargin = (externalId: number) => {
    return productMargins[externalId] ?? 20;
  };

  const applyMarginToProduct = (externalId: number, margin: number) => {
    const safeMargin = Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, margin));
    setProductMargins((prev) => ({ ...prev, [externalId]: safeMargin }));
  };

  const applyMarginToAllSelected = (margin: number) => {
    const safeMargin = Math.min(MARGIN_MAX, Math.max(MARGIN_MIN, margin));
    if (selectedMarginProducts.length === 0) {
      applyMargin(safeMargin);
      return;
    }
    setProductMargins((prev) => {
      const next = { ...prev };
      for (const product of selectedMarginProducts) {
        next[product.externalId] = safeMargin;
      }
      return next;
    });
  };

  const estimatedSelectedStockProfit = useMemo(() => {
    if (selectedMarginProducts.length === 0) return estimatedStockProfit;
    const total = selectedMarginProducts.reduce((sum, product) => {
      const margin = getProductMargin(product.externalId);
      const profit = (product.basePrice * margin) / 100;
      return sum + profit * product.stock;
    }, 0);
    return Number(total.toFixed(2));
  }, [selectedMarginProducts, productMargins, estimatedStockProfit]);

  const selectedPresetMargin = useMemo(() => {
    if (selectedMarginProducts.length === 0) return marginValue;
    const first = getProductMargin(selectedMarginProducts[0].externalId);
    const allSame = selectedMarginProducts.every((product) => getProductMargin(product.externalId) === first);
    return allSame ? first : null;
  }, [selectedMarginProducts, productMargins, marginValue]);

  const visibleSelectedCount = visibleProducts.size;

  const saveMarginArrangement = async () => {
    if (selectedMarginProducts.length === 0) {
      await handleSubmit(new Event('submit') as unknown as React.FormEvent);
      return;
    }
    setPublishOrder(selectedMarginProducts.map((product) => product.externalId));
    setVisibleProducts(new Set());
    setWizardStep(4);
  };

  const toggleProductVisibility = (id: number) => {
    setVisibleProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllVisibleProducts = () => {
    setVisibleProducts(new Set(arrangedProducts.map((product) => product.externalId)));
  };

  const publishProductsByIds = async (ids: number[]) => {
    const token = localStorage.getItem('token');

    if (ids.length === 0) {
      toast.error('No products selected to publish');
      return;
    }

    const publishQueue = Array.from(new Set(ids))
      .map((id) => {
        const product = selectedProductMap.get(id);
        if (!product) return null;
        return { id, product };
      })
      .filter((item): item is { id: number; product: CatalogProduct } => Boolean(item));

    if (publishQueue.length === 0) {
      toast.error('No products selected to publish');
      return;
    }

    setIsBulkPublishing(true);
    let successCount = 0;
    let failCount = 0;
    const successfulIds: number[] = [];

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const queue = [...publishQueue];
      const workerCount = Math.min(4, queue.length);
      const workers = Array.from({ length: workerCount }, () => (async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) break;

          const controller = new AbortController();
          const timeout = window.setTimeout(() => controller.abort(), 15000);

          try {
            const response = await fetch('/api/seller/products/import', {
              method: 'POST',
              credentials: 'include',
              headers,
              signal: controller.signal,
              body: JSON.stringify({
                ...next.product,
                profitMargin: getProductMargin(next.id),
              }),
            });

            let data: { success?: boolean; error?: string } | null = null;
            try {
              data = (await response.json()) as { success?: boolean; error?: string };
            } catch {
              data = null;
            }

            if (!response.ok || !data?.success) {
              failCount++;
              continue;
            }

            successCount++;
            successfulIds.push(next.id);
          } catch {
            failCount++;
          } finally {
            window.clearTimeout(timeout);
          }
        }
      })());

      await Promise.all(workers);
    } finally {
      setIsBulkPublishing(false);
    }

    setPublishedCount((current) => current + successCount);

    if (successfulIds.length > 0) {
      setSelectedProducts((prev) => {
        const next = new Set(prev);
        successfulIds.forEach((id) => next.delete(id));
        return next;
      });
      setVisibleProducts((prev) => {
        const next = new Set(prev);
        successfulIds.forEach((id) => next.delete(id));
        return next;
      });
      setPublishOrder((prev) => prev.filter((id) => !successfulIds.includes(id)));
    }

    if (failCount === 0) {
      toast.success(`${successCount} product${successCount !== 1 ? 's' : ''} published to your store!`);
      redirectToDashboard();
      if (arrangedProducts.length === successCount) {
        setWizardStep(2);
      }
    } else {
      toast.error(`${successCount} published, ${failCount} failed.`);
    }
  };

  const toggleProductSelection = (id: number) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllProducts = () => {
    setSelectedProducts(new Set(filteredProducts.map((p) => p.externalId)));
  };

  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  const goToMarginsStep = () => {
    if (selectedProducts.size === 0 && filteredProducts.length > 0) {
      setSelectedProducts(new Set(filteredProducts.map((product) => product.externalId)));
      toast.success('Products auto-selected for margin setup');
    }
    setWizardStep(3);
  };

  const bulkPublishSelected = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be signed in as a seller');
      return;
    }
    const toPublish = filteredProducts.filter((p) => selectedProducts.has(p.externalId));
    if (toPublish.length === 0) {
      toast.error('No products selected');
      return;
    }
    setIsBulkPublishing(true);
    let successCount = 0;
    let failCount = 0;
    for (const product of toPublish) {
      try {
        const response = await fetch('/api/seller/products/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(product),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error);
        successCount++;
      } catch {
        failCount++;
      }
    }
    setIsBulkPublishing(false);
    setPublishedCount((c) => c + successCount);
    setSelectedProducts(new Set());
    if (failCount === 0) {
      toast.success(`${successCount} product${successCount !== 1 ? 's' : ''} published to your store!`);
      setWizardStep(4);
      redirectToDashboard();
    } else {
      toast.error(`${successCount} published, ${failCount} failed.`);
    }
  };

  const fillFromCatalog = (product: CatalogProduct) => {
    setWizardStep(3);
    setFormData({
      title: product.title,
      description: product.description,
      category: product.category,
      basePrice: `${product.basePrice}`,
      profitMargin: formData.profitMargin || '20',
      stock: `${product.stock}`,
      images: [],
      sku: `CAT-${product.externalId}`,
    });
    setCalculatedPrice(Number((product.basePrice * 1.2).toFixed(2)));
    toast.success('Product moved to margin step');
  };

  const importCatalogProduct = async (product: CatalogProduct) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('You must be signed in as a seller');
      return;
    }

    try {
      setImportingId(product.externalId);
      const response = await fetch('/api/seller/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(product),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish catalog product');
      }

      setPublishedCount((current) => current + 1);
      setWizardStep(4);
      toast.success('Catalog product published to your store');
      redirectToDashboard();
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish catalog product');
    } finally {
      setImportingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Product title is required');
      return;
    }
    if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
      toast.error('Valid base price is required');
      return;
    }
    if (!formData.stock || parseInt(formData.stock, 10) < 0) {
      toast.error('Stock quantity is required');
      return;
    }

    setIsLoading(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      submitFormData.append('category', formData.category);
      submitFormData.append('basePrice', formData.basePrice);
      submitFormData.append('profitMargin', formData.profitMargin);
      submitFormData.append('sellingPrice', calculatedPrice.toString());
      submitFormData.append('stock', formData.stock);
      submitFormData.append('sku', formData.sku);

      formData.images.forEach((image) => {
        submitFormData.append('images', image);
      });

      const token = localStorage.getItem('token');
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitFormData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish product');
      }

      setPublishedCount((current) => current + 1);
      setWizardStep(4);
      toast.success('Product published successfully');
      redirectToDashboard();
      setFormData({
        title: '',
        description: '',
        category: 'electronics',
        basePrice: '',
        profitMargin: '20',
        stock: '',
        images: [],
        sku: '',
      });
      setCalculatedPrice(0);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred while creating the product');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Categories' },
    { id: 2, label: 'Products' },
    { id: 3, label: 'Margins' },
    { id: 4, label: 'Publish' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f3f5f9] px-4 py-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900">My Products</h1>
          <p className="text-sm text-slate-500">Add and manage products for your store catalog.</p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-3xl font-bold text-slate-800">{catalogTotal.toLocaleString()}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Products</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{publishedCount}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">Published</p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">Add Products</h2>
            <p className="text-xs text-slate-500">Browse, select, set margins, and publish products to your store.</p>
          </div>

          <div className="px-5 py-5">
            <div className="mb-6 flex items-center justify-center gap-6">
              {steps.map((step, index) => {
                const isActive = wizardStep === step.id;
                const isDone = wizardStep > step.id;
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setWizardStep(step.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : isActive
                          ? 'border-slate-800 bg-slate-800 text-white'
                          : 'border-slate-200 bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check size={14} /> : step.id}
                    </button>
                    <span className={`text-xs font-semibold ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.label}
                    </span>
                    {index < steps.length - 1 && <span className="h-px w-6 bg-slate-200" />}
                  </div>
                );
              })}
            </div>

            {wizardStep === 1 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs text-slate-500">{selectedCategories.length} of {CATEGORY_OPTIONS.length} selected</p>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={selectAllCategories} className="text-slate-600 hover:text-slate-900">Select All</button>
                    <span className="text-slate-300">|</span>
                    <button type="button" onClick={clearCategories} className="text-slate-600 hover:text-slate-900">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  {CATEGORY_OPTIONS.map((category) => {
                    const selected = selectedCategories.includes(category.value);
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => toggleCategory(category.value)}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${
                          selected
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${selected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                          {selected ? <Check size={10} /> : ''}
                        </span>
                        {category.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="rounded-md bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    Next: Browse Products
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div>
                {/* Toolbar */}
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={catalogQuery}
                      onChange={(event) => {
                        setCatalogQuery(event.target.value);
                        setCatalogPage(1);
                      }}
                      placeholder="Search products"
                      className="w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-500">{totalProductsShown} products</p>
                    <button
                      type="button"
                      onClick={selectAllProducts}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
                    >
                      Select All
                    </button>
                    {selectedProducts.size > 0 && (
                      <button
                        type="button"
                        onClick={deselectAllProducts}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-slate-400"
                      >
                        Deselect
                      </button>
                    )}
                  </div>
                </div>

                {/* Bulk publish banner */}
                {selectedProducts.size > 0 && (
                  <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-sm font-semibold text-blue-700">
                      {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                    </p>
                    <button
                      type="button"
                      onClick={bulkPublishSelected}
                      disabled={isBulkPublishing}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <PackagePlus size={14} />
                      {isBulkPublishing ? 'Publishing...' : `Publish Selected (${selectedProducts.size})`}
                    </button>
                  </div>
                )}

                {isCatalogLoading ? (
                  <div className="py-8 text-center text-sm text-slate-500">Loading products...</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProducts.has(product.externalId);
                      return (
                        <div
                          key={product.externalId}
                          className={`relative overflow-hidden rounded-lg border bg-white transition ${
                            isSelected ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
                          }`}
                        >
                          {/* Checkbox overlay */}
                          <button
                            type="button"
                            onClick={() => toggleProductSelection(product.externalId)}
                            className="absolute left-2 top-2 z-10"
                          >
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 text-white transition ${
                                isSelected ? 'border-blue-600 bg-blue-600' : 'border-white bg-white/70'
                              }`}
                            >
                              {isSelected && <Check size={11} />}
                            </span>
                          </button>
                          <img src={product.thumbnail} alt={product.title} className="h-40 w-full object-cover" />
                          <div className="space-y-2 p-3">
                            <h3 className="line-clamp-2 text-sm font-semibold text-slate-800">{product.title}</h3>
                            <p className="text-xs text-slate-500">${product.basePrice.toFixed(2)} | Stock {product.stock}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => fillFromCatalog(product)}
                                className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-700"
                              >
                                <Upload size={13} />
                                Customize
                              </button>
                              <button
                                type="button"
                                onClick={() => importCatalogProduct(product)}
                                disabled={importingId === product.externalId}
                                className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-800 px-2 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                <PackagePlus size={13} />
                                {importingId === product.externalId ? 'Publishing' : 'Publish'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCatalogPage((page) => Math.max(1, page - 1))}
                    disabled={catalogPage === 1}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs disabled:opacity-50"
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </button>
                  <span className="text-xs text-slate-500">Page {catalogPage} of {totalCatalogPages}</span>
                  <button
                    type="button"
                    onClick={() => setCatalogPage((page) => Math.min(totalCatalogPages, page + 1))}
                    disabled={catalogPage >= totalCatalogPages}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="mt-5 flex justify-between">
                  <button type="button" onClick={() => setWizardStep(1)} className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">
                    Back
                  </button>
                  <button type="button" onClick={goToMarginsStep} className="rounded-md bg-slate-700 px-4 py-2 text-xs font-semibold text-white">
                    Next: Set Margins
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                  <div className="mb-4 text-center">
                    <h3 className="text-4xl font-semibold text-slate-900">Set Profit Margins</h3>
                    <p className="mt-1 text-sm text-slate-500">Slide to set your markup on each product. Range: {MARGIN_MIN}% - {MARGIN_MAX}%.</p>
                  </div>

                  <div className="mb-3 flex flex-col gap-3 rounded-lg bg-slate-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <TrendingUp size={16} className="text-emerald-600" />
                      Est. profit on full stock:
                      <span className="font-bold text-emerald-700">${estimatedSelectedStockProfit.toFixed(2)}</span>
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Set all:</span>
                      {MARGIN_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => applyMarginToAllSelected(preset)}
                          className={`rounded-full border px-3 py-1 font-semibold transition ${
                            selectedPresetMargin === preset
                              ? 'border-slate-800 bg-slate-800 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedMarginProducts.length > 0 ? (
                    <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                      {selectedMarginProducts.map((product) => {
                        const margin = getProductMargin(product.externalId);
                        const buyerPrice = Number((product.basePrice * (1 + margin / 100)).toFixed(2));
                        const unitProfit = Number((buyerPrice - product.basePrice).toFixed(2));
                        return (
                          <div key={product.externalId} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <img src={product.thumbnail} alt={product.title} className="h-10 w-10 rounded-md object-cover" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-800">{product.title}</p>
                                  <p className="text-xs text-slate-500">
                                    Base: ${product.basePrice.toFixed(2)}
                                    {product.discountPercentage && product.discountPercentage > 0 ? (
                                      <span className="ml-2 font-semibold text-rose-500">-{product.discountPercentage.toFixed(0)}%</span>
                                    ) : null}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-semibold text-slate-800">{margin.toFixed(1)}%</p>
                                <p className="text-sm font-bold text-slate-900">${buyerPrice.toFixed(2)}</p>
                                <p className="text-[11px] text-slate-400">Buyer pays: ${(buyerPrice - unitProfit).toFixed(2)}</p>
                                <p className="text-xs font-medium text-emerald-600">+${unitProfit.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                              <span>{MARGIN_MIN}%</span>
                              <span>{MARGIN_MAX}%</span>
                            </div>
                            <input
                              type="range"
                              min={MARGIN_MIN}
                              max={MARGIN_MAX}
                              step={0.1}
                              value={margin}
                              onChange={(event) => applyMarginToProduct(product.externalId, Number(event.target.value))}
                              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-300"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                        <div className="mb-3 text-sm font-semibold text-indigo-700">Product details</div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Product title" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                          <input name="sku" value={formData.sku} onChange={handleInputChange} placeholder="SKU" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                          <input name="basePrice" type="number" value={formData.basePrice} onChange={handleInputChange} placeholder="Base price" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                          <input name="stock" type="number" value={formData.stock} onChange={handleInputChange} placeholder="Stock" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
                          <select name="category" value={formData.category} onChange={handleInputChange} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                            {CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                          <input
                            name="profitMargin"
                            type="number"
                            min={MARGIN_MIN}
                            max={MARGIN_MAX}
                            value={formData.profitMargin}
                            onChange={(event) => applyMargin(Number(event.target.value || 0))}
                            placeholder="Margin %"
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" rows={3} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      </div>

                      <div className="rounded-lg border-2 border-dashed border-slate-300 p-4">
                        <input type="file" id="images" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                        <label htmlFor="images" className="block cursor-pointer text-center text-sm text-slate-600">Upload product images</label>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {formData.images.map((image, index) => (
                            <div key={`${image.name}-${index}`} className="relative overflow-hidden rounded-md border border-slate-200">
                              <img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} className="h-24 w-full object-cover" />
                              <button type="button" onClick={() => removeImage(index)} className="absolute right-1 top-1 rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white">X</button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between">
                        <button type="button" onClick={() => setWizardStep(2)} className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Back</button>
                        <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                          <Rocket size={14} />
                          {isLoading ? 'Publishing...' : 'Publish Product'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {selectedMarginProducts.length > 0 && (
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setWizardStep(2)} className="rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Back</button>
                    <button
                      type="button"
                      onClick={saveMarginArrangement}
                      disabled={isBulkPublishing}
                      className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {isBulkPublishing ? 'Saving...' : 'Save & Arrange'}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {wizardStep === 4 && selectedMarginProducts.length > 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-4xl font-semibold text-slate-900">Arrange &amp; Publish</h3>
                  <p className="mt-1 text-sm text-slate-500">Drag to reorder. Toggle which products are visible in your store.</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  <p className="inline-flex items-center gap-2 font-medium">
                    <Info size={14} />
                    Drag rows to reorder. Toggle individual visibility, or use Publish All to enable every product at once.
                  </p>
                  <button
                    type="button"
                    onClick={selectAllVisibleProducts}
                    className="rounded-full border border-[#173b62] bg-white px-3 py-1.5 text-xs font-semibold text-[#173b62]"
                  >
                    Select All
                  </button>
                </div>

                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                  {arrangedProducts.map((product, index) => {
                    const isVisible = visibleProducts.has(product.externalId);
                    const margin = getProductMargin(product.externalId);
                    const buyerPrice = Number((product.basePrice * (1 + margin / 100)).toFixed(2));
                    return (
                      <div key={product.externalId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <GripVertical size={15} className="text-slate-300" />
                          <span className="w-4 text-xs font-semibold text-slate-400">{index + 1}</span>
                          <img src={product.thumbnail} alt={product.title} className="h-10 w-10 rounded-md object-cover" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">{product.title}</p>
                            <p className="text-xs font-semibold text-slate-500">
                              ${buyerPrice.toFixed(2)}
                              <span className="ml-2 text-slate-400">{margin.toFixed(1)}% margin</span>
                              <span className="ml-2 text-amber-500">★ {product.rating.toFixed(1)}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleProductVisibility(product.externalId)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isVisible
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                          {isVisible ? 'Visible' : 'Hidden'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setWizardStep(3)} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
                    <ChevronLeft size={14} />
                    Back
                  </button>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-500"><span className="font-semibold text-slate-700">{visibleSelectedCount}</span> of {arrangedProducts.length} selected</p>
                    <button
                      type="button"
                      onClick={() => publishProductsByIds(arrangedProducts.map((product) => product.externalId))}
                      disabled={isBulkPublishing || arrangedProducts.length === 0}
                      className="rounded-xl bg-[#173b62] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isBulkPublishing ? 'Publishing...' : 'Publish All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => publishProductsByIds(Array.from(visibleProducts))}
                      disabled={isBulkPublishing || visibleSelectedCount === 0}
                      className="rounded-xl bg-[#d4b56a] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {isBulkPublishing ? 'Publishing...' : 'Publish Selected'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 4 && selectedMarginProducts.length === 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check size={18} />
                </div>
                <h3 className="text-lg font-semibold text-emerald-800">Product Published</h3>
                <p className="mt-1 text-sm text-emerald-700">Your product has been published to your store successfully.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button type="button" onClick={() => setWizardStep(2)} className="rounded-md border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-800">
                    Publish Another
                  </button>
                  <button type="button" onClick={() => setWizardStep(1)} className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white">
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
