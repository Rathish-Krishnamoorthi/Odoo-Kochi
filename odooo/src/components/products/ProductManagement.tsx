import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Product, ProductVariant } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Package, Plus, Search, Check, Layers, Tag } from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showVariantModal, setShowVariantModal] = useState<Product | null>(null);

  // New Product Form State
  const [name, setName] = useState<string>('');
  const [productCode, setProductCode] = useState<string>('');
  const [type, setType] = useState<'SOFTWARE' | 'SERVICE' | 'ADD_ON' | 'OTHER'>('SOFTWARE');
  const [salesPrice, setSalesPrice] = useState<string>('2499');
  const [costPrice, setCostPrice] = useState<string>('500');
  const [description, setDescription] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [variantsList, setVariantsList] = useState<Array<{ name: string; variantCode: string; additionalPrice: number; description: string }>>([
    { name: 'Standard Edition', variantCode: 'VAR-STD', additionalPrice: 0, description: 'Default single tenant package' }
  ]);

  // Add Variant Form State
  const [varName, setVarName] = useState<string>('');
  const [varCode, setVarCode] = useState<string>('');
  const [varAddPrice, setVarAddPrice] = useState<string>('560');
  const [varDesc, setVarDesc] = useState<string>('');

  const fetchProducts = async () => {
    try {
      const data = await apiRequest<Product[]>('/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddVariantRow = () => {
    setVariantsList(prev => [
      ...prev,
      { name: '', variantCode: `VAR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`, additionalPrice: 0, description: '' }
    ]);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          productCode,
          type,
          salesPrice: Number(salesPrice),
          costPrice: Number(costPrice),
          description,
          internalNotes,
          variants: variantsList.filter(v => v.name.trim().length > 0)
        })
      });
      setShowCreateModal(false);
      setName('');
      setProductCode('');
      setDescription('');
      await fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVariantModal) return;
    try {
      await apiRequest(`/products/${showVariantModal.id}/variants`, {
        method: 'POST',
        body: JSON.stringify({
          name: varName,
          variantCode: varCode,
          additionalPrice: Number(varAddPrice),
          description: varDesc
        })
      });
      setShowVariantModal(null);
      setVarName('');
      setVarCode('');
      setVarDesc('');
      await fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.product_code.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'ALL' || p.type === selectedType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Products & Subscription Variants
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure base software products, services, add-ons, and edition variants.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by product name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
          />
        </div>

        {/* Clean segmented type filter (interactive functional button tab) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {['ALL', 'SOFTWARE', 'SERVICE', 'ADD_ON'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedType === t
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No products matching filters.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(product => (
              <div key={product.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-slate-500">{product.product_code}</span>
                      <h3 className="text-sm font-bold text-slate-900">{product.name}</h3>
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {product.type}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Status: <span className="text-emerald-700 font-semibold">{product.status}</span>
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-xs text-slate-600 max-w-2xl">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Base Sales Price</span>
                      <div className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                        ₹{Number(product.sales_price).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400">Cost: ₹{Number(product.cost_price).toFixed(2)}</span>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => setShowVariantModal(product)}
                        className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Variant
                      </button>
                    )}
                  </div>
                </div>

                {/* Variants List Section */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/60 p-3 rounded-lg">
                    <div className="text-[11px] font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" /> Configured Product Variants:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {product.variants.map(v => {
                        const finalPrice = product.sales_price + v.additional_price;
                        return (
                          <div key={v.id} className="bg-white p-2.5 rounded-md border border-slate-200 text-xs shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">{v.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">{v.variant_code}</span>
                            </div>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-[11px] text-slate-500">
                                {v.additional_price > 0 ? `+ ₹${v.additional_price.toFixed(2)}` : 'Base Price'}
                              </span>
                              <span className="font-mono font-bold text-indigo-700 tabular-nums">
                                ₹{finalPrice.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create New Software Product</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Business Software"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Product Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PRD-BSW"
                    value={productCode}
                    onChange={e => setProductCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Product Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="SOFTWARE">Software</option>
                    <option value="SERVICE">Service</option>
                    <option value="ADD_ON">Add-on</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={salesPrice}
                    onChange={e => setSalesPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={e => setCostPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Comprehensive description of product functionality and features..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Variants Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">Initial Product Variants</span>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Variant Row
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {variantsList.map((vr, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg">
                      <input
                        type="text"
                        placeholder="Variant Name (e.g. Odoo)"
                        value={vr.name}
                        onChange={e => {
                          const updated = [...variantsList];
                          updated[idx].name = e.target.value;
                          setVariantsList(updated);
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Additional Price (₹)"
                        value={vr.additionalPrice}
                        onChange={e => {
                          const updated = [...variantsList];
                          updated[idx].additionalPrice = Number(e.target.value);
                          setVariantsList(updated);
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Variant Code"
                        value={vr.variantCode}
                        onChange={e => {
                          const updated = [...variantsList];
                          updated[idx].variantCode = e.target.value;
                          setVariantsList(updated);
                        }}
                        className="px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Variant for {showVariantModal.name}</h3>
                <span className="text-[11px] text-slate-400">Base Sales Price: ₹{showVariantModal.sales_price}</span>
              </div>
              <button onClick={() => setShowVariantModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateVariant} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Variant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Odoo or Enterprise Multi-Branch"
                  value={varName}
                  onChange={e => setVarName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Additional Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={varAddPrice}
                    onChange={e => setVarAddPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Variant Code</label>
                  <input
                    type="text"
                    placeholder="VAR-ODOO"
                    value={varCode}
                    onChange={e => setVarCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex justify-between">
                <span>Calculated Total Product Price:</span>
                <span className="font-mono font-bold text-indigo-700">
                  ₹{(showVariantModal.sales_price + Number(varAddPrice || 0)).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={varDesc}
                  onChange={e => setVarDesc(e.target.value)}
                  placeholder="e.g. Connector and sync module for ERP..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Create Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
