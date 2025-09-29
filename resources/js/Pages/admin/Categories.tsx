import React from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { Category, ApiResponse } from '@/app/types/domain';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import Modal from '@/app/components/ui/Modal';
import ImageUploader from '@/app/components/ui/ImageUploader';
import { toastLoading, toastSuccess, toastError } from '@/app/utils/toast';

export default function Categories() {
  const [search, setSearch] = React.useState('');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [image, setImage] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const qc = useQueryClient();

  // Sorting & Pagination state
  const [sortKey, setSortKey] = React.useState<keyof Category>('id');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const toggleSort = (key: keyof Category) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin.categories', search],
    queryFn: async () => apiGet<ApiResponse<Category[]>>('/admin/categories', { params: { search } }).then(r => r.data),
    staleTime: 1000 * 30,
  });

  const categories = data || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Name is required');
      const payload = { name: name.trim(), slug: slug.trim() || undefined } as any;
      await apiPost<ApiResponse<Category>>('/admin/categories', payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin.categories'] });
      setOpenCreate(false);
      setName('');
      setSlug('');
      setError(null);
      toastSuccess('Category created');
    },
  });

  // Edit modal state and mutation
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editId, setEditId] = React.useState<number | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editSlug, setEditSlug] = React.useState('');
  const [editError, setEditError] = React.useState<string | null>(null);
  const startEdit = (c: Category) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setOpenEdit(true);
  };
  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editName.trim()) throw new Error('Name is required');
      await apiPut<ApiResponse<Category>>(`/admin/categories/${editId}`, { name: editName.trim(), slug: editSlug.trim() || undefined });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin.categories'] });
      setOpenEdit(false);
      setEditId(null);
      toastSuccess('Category updated');
    },
  });

  // Delete state and mutation
  const [openDelete, setOpenDelete] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setOpenDelete(true);
  };
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiDelete<ApiResponse<{}>>(`/admin/categories/${deleteId}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin.categories'] });
      setOpenDelete(false);
      setDeleteId(null);
      toastSuccess('Category deleted');
    },
  });

  // Derive sorted + paginated list
  const sorted = React.useMemo(() => {
    const copy = [...categories];
    copy.sort((a: any, b: any) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === vb) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return copy;
  }, [categories, sortKey, sortDir]);

  const total = sorted.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const currentPage = Math.min(page, lastPage);
  const start = (currentPage - 1) * perPage;
  const paged = sorted.slice(start, start + perPage);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Manage Categories</h1>
          <Button onClick={() => setOpenCreate(true)}>New Category</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('id')}># {sortKey==='id' ? (sortDir==='asc'?'↑':'↓') : ''}</th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('name')}>Name {sortKey==='name' ? (sortDir==='asc'?'↑':'↓') : ''}</th>
                    <th className="py-2 pr-4 cursor-pointer" onClick={() => toggleSort('slug')}>Slug {sortKey==='slug' ? (sortDir==='asc'?'↑':'↓') : ''}</th>
                    <th className="py-2 pr-4">Active</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td className="py-3 pr-4"><Skeleton className="h-4 w-8" /></td>
                        <td className="py-3 pr-4"><Skeleton className="h-4 w-40" /></td>
                        <td className="py-3 pr-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-3 pr-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="py-3 pr-4 text-right"><Skeleton className="h-8 w-20 ml-auto" /></td>
                      </tr>
                    ))
                  ) : sorted.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">No categories found</td>
                    </tr>
                  ) : (
                    paged.map((c) => (
                      <tr key={c.id} className="border-t border-white/10">
                        <td className="py-3 pr-4">{c.id}</td>
                        <td className="py-3 pr-4 font-medium">{c.name}</td>
                        <td className="py-3 pr-4">{c.slug}</td>
                        <td className="py-3 pr-4">{c.active ? 'Yes' : 'No'}</td>
                        <td className="py-3 pr-4 text-right">
                          <div className="inline-flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => startEdit(c)}>Edit</Button>
                            <Button variant="danger" size="sm" onClick={() => confirmDelete(c.id)}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">Showing {start + 1}-{Math.min(start + perPage, total)} of {total}</div>
              <div className="flex items-center gap-2">
                <select className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</Button>
                <div className="text-sm">{currentPage} / {lastPage}</div>
                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={currentPage === lastPage}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create Category">
          <div className="space-y-3">
            <Input label="Name" placeholder="e.g. Pizzas" value={name} onChange={(e) => setName(e.target.value)} error={error?.includes('Name') ? error : undefined} />
            <Input label="Slug" placeholder="e.g. pizzas" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Category Image</label>
              <ImageUploader value={null} onChange={(file) => setImage(file)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  setError(null);
                  try {
                    await toastLoading(createMutation.mutateAsync(), { loading: 'Creating...', success: 'Created!', error: 'Failed' });
                  } catch (e: any) {
                    setError(e?.message || 'Failed to create');
                  }
                }}
                disabled={createMutation.isPending || !name.trim()}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Edit Category">
          <div className="space-y-3">
            <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} error={editError?.includes('Name') ? editError : undefined} />
            <Input label="Slug" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpenEdit(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  setEditError(null);
                  try {
                    await toastLoading(editMutation.mutateAsync(), { loading: 'Saving...', success: 'Saved!', error: 'Failed' });
                  } catch (e: any) {
                    setEditError(e?.message || 'Failed to save');
                  }
                }}
                disabled={editMutation.isPending || !editName.trim()}
              >
                {editMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <Modal open={openDelete} onClose={() => setOpenDelete(false)} title="Delete Category">
          <div className="space-y-3">
            <p>Are you sure you want to delete this category? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setOpenDelete(false)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await toastLoading(deleteMutation.mutateAsync(), { loading: 'Deleting...', success: 'Deleted!', error: 'Failed' });
                  } catch {}
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
