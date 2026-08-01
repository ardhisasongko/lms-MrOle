import { useState } from 'react';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import Card, { CardContent, CardHeader } from './Card';
import Button from './Button';
import Skeleton from './Skeleton';
import EmptyState from '../feedback/EmptyState';
import ConfirmModal from '../feedback/ConfirmModal';

/**
 * Reusable CRUD table with list, inline form, and delete confirmation.
 *
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page subtitle
 * @param {React.ElementType} props.icon - Empty state icon
 * @param {string} props.emptyTitle - Empty state title
 * @param {string} props.emptyDesc - Empty state description
 * @param {Array} props.items - Array of items to display
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.renderItem - (item) => ReactNode for list rendering
 * @param {Function} props.renderForm - ({ form, setForm, editing, onSubmit, onCancel }) => ReactNode
 * @param {Function} props.onCreate - async (form) => void
 * @param {Function} props.onUpdate - async (id, form) => void
 * @param {Function} props.onDelete - async (id) => void
 * @param {Function} props.resetForm - () => default form object
 * @param {string} props.deleteTitle - Confirm modal title
 * @param {string} props.deleteMessage - Confirm modal message
 * @param {string} props.addLabel - Add button label
 */
export default function CrudTable({
  title, description, icon: Icon, emptyTitle, emptyDesc,
  items, loading, renderItem, renderForm,
  onCreate, onUpdate, onDelete, resetForm,
  deleteTitle, deleteMessage, addLabel = 'Tambah',
}) {
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(() => resetForm());

  const handleAdd = () => {
    setEditing(null);
    setForm(resetForm());
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditing(item.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditing(null);
    setShowForm(false);
    setForm(resetForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let succeeded;
    if (editing) {
      succeeded = await onUpdate(editing, form);
    } else {
      succeeded = await onCreate(form);
    }
    if (succeeded !== false) handleCancel();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
        {!editing && !showForm && (
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" /> {addLabel}
          </Button>
        )}
      </div>

      {(editing || showForm) && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {editing ? 'Edit' : 'Baru'}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {renderForm({ form, setForm, editing, onSubmit: handleSubmit, onCancel: handleCancel })}
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState icon={Icon} title={emptyTitle} description={emptyDesc} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">{renderItem(item)}</div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { handleEdit(item); setForm(item); }}
                      className="inline-flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    ><PencilSimple className="w-4 h-4" /> Edit</button>
                    <button
                      onClick={() => setDeleteTarget(item.id)}
                      className="inline-flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    ><Trash className="w-4 h-4" /> Hapus</button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title={deleteTitle}
        message={deleteMessage}
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
