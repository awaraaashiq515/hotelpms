'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Plus, Edit, Trash2, Grid } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { categoriesApi, Category } from '@/lib/api/categories';
import { Modal } from '@/components/ui/Modal';
import { CategoryForm } from '@/components/forms/category-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesApi.list();
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

  const filteredCategories = (categories || []).filter((cat: Category) =>
    cat.name?.toLowerCase().includes(search.toLowerCase()) ||
    cat.description?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Category Name',
      cell: (row: Category) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <Grid size={14} />
          </div>
          <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">
            {row.name}
          </span>
        </div>
      ),
      width: '400px'
    },
    {
      header: 'Description',
      cell: (row: Category) => (
        <span className="text-xs text-gray-500 line-clamp-1">{row.description || 'No description'}</span>
      ),
      width: '300px'
    },
    {
      header: 'Status',
      cell: (row: Category) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${row.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'
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
              setIsFormOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-pos-primary transition-colors"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              setSelectedCategory(row);
              setIsDeleteOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
      width: '120px'
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categories"
        subtitle="Group your menu items into categories"
        showBack
        actions={
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setIsFormOpen(true);
            }}
            className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200"
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
    </div>
  );
}