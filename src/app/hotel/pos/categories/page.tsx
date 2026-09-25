'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Plus, Edit, Trash2, Grid, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { categoriesApi, Category } from '@/lib/api/categories';
import { Modal } from '@/components/ui/Modal';
import { CategoryForm } from '@/components/forms/category-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';

export default function HotelPosCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMenuTypeFilter, setSelectedMenuTypeFilter] = useState('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.list(true);
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateOrUpdate = async (data: Partial<Category>) => {
    setMutationLoading(true);
    try {
      if (selectedCategory) {
        await categoriesApi.update(selectedCategory.id, data);
      } else {
        await categoriesApi.create(data);
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setMutationLoading(true);
    try {
      await categoriesApi.delete(selectedCategory.id);
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Delete failed:', error);
      alert(error.message || 'Failed to delete category');
    } finally {
      setMutationLoading(false);
    }
  };

  const filteredCategories = (categories || []).filter((cat: Category) => {
    const matchesSearch = cat.name?.toLowerCase().includes(search.toLowerCase()) ||
                         cat.description?.toLowerCase().includes(search.toLowerCase());
    const matchesMenuType = selectedMenuTypeFilter === 'all' || cat.menuType === selectedMenuTypeFilter;
    return matchesSearch && matchesMenuType;
  });

  const columns = [
    {
      header: 'Category Name',
      cell: (row: Category) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Grid size={14} />
          </div>
          <span className="text-sm font-bold section-heading uppercase tracking-tight text-white">
            {row.name}
            {row.parentId && (
              <span className="ml-2 text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                Subcategory
              </span>
            )}
          </span>
        </div>
      ),
      width: '400px'
    },
    {
      header: 'Description',
      cell: (row: Category) => (
        <span className="text-xs text-slate-400 line-clamp-1">{row.description || 'No description'}</span>
      ),
      width: '300px'
    },
    {
      header: 'Menu Type',
      cell: (row: Category) => (
        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
          row.menuType === 'BAR' 
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
            : row.menuType === 'CAFE'
              ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
              : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
        }`}>
          {row.menuType || 'RESTAURANT'}
        </span>
      ),
      width: '120px'
    },
    {
      header: 'Products',
      cell: (row: Category) => (
        <div className="flex items-center gap-2">
           <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">
            {row._count?.products || 0} ITEMS
          </span>
        </div>
      ),
      width: '120px'
    },
    {
      header: 'Status',
      cell: (row: Category) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
          row.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'
        }`}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      ),
      width: '150px'
    },
    {
      header: 'Actions',
      cell: (row: Category) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedCategory(row);
              setIsProductsOpen(true);
            }}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
            title="View Products"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedCategory(row);
              setIsFormOpen(true);
            }}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedCategory(row);
              setIsDeleteOpen(true);
            }}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      width: '150px'
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Restaurant Menu Categories"
        description="Group your restaurant, bar, and cafe menu items into categories"
        showBack
        backUrl="/hotel"
        actions={
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setIsFormOpen(true);
            }}
            className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-500/20 cursor-pointer"
          >
            <Plus size={16} className="mr-2" />
            ADD NEW CATEGORY
          </Button>
        }
      />

      <SearchToolbar
        value={search}
        onChange={setSearch}
        placeholder="Search by category name..."
        actions={
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setSelectedMenuTypeFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                selectedMenuTypeFilter === 'all'
                  ? 'bg-slate-800 text-pos-primary shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedMenuTypeFilter('RESTAURANT')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                selectedMenuTypeFilter === 'RESTAURANT'
                  ? 'bg-slate-800 text-indigo-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Restaurant
            </button>
            <button
              onClick={() => setSelectedMenuTypeFilter('BAR')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                selectedMenuTypeFilter === 'BAR'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bar
            </button>
            <button
              onClick={() => setSelectedMenuTypeFilter('CAFE')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                selectedMenuTypeFilter === 'CAFE'
                  ? 'bg-[#D2691E] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cafe
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={filteredCategories}
        loading={loading}
      />

      {/* Forms & Modals */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCategory ? 'Edit Category' : 'New Category'}
      >
        <CategoryForm
          initialData={selectedCategory || undefined}
          parentCategories={categories.filter(c => !c.parentId && c.id !== selectedCategory?.id)}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setIsFormOpen(false)}
          loading={mutationLoading}
        />
      </Modal>

      {isDeleteOpen && (
        <ConfirmDeleteModal
          title="Delete Category"
          message={`Are you sure you want to delete "${selectedCategory?.name}"? Items in this category might become unorganized.`}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
          loading={mutationLoading}
        />
      )}

      <Modal
        isOpen={isProductsOpen}
        onClose={() => setIsProductsOpen(false)}
        title={`Products in ${selectedCategory?.name}`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {selectedCategory?.products && selectedCategory.products.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {selectedCategory.products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500">NO IMG</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-200 group-hover:text-pos-primary transition-colors">{product.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{product.productType}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col">
                    <span className="text-sm font-black text-pos-primary">₹{product.sellingPrice}</span>
                    {product.sku && <span className="text-[9px] text-slate-400 font-mono">{product.sku}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <Grid className="text-slate-500" size={20} />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No products found in this category</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
