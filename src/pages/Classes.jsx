import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, PlusCircle, SignIn, UsersThree } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import Card, { CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import { useClasses } from '../hooks/useClasses';
import { isValidJoinCode } from '../utils/classes';
import { handleError } from '../utils/errors';
import { formatDate } from '../utils/format';

export function ClassesNotActiveState() {
  return (
    <Card>
      <CardContent className="py-12">
        <EmptyState
          icon={UsersThree}
          title="Mode Kelas Belum Diaktifkan"
          description="Fitur kelas sudah terpasang di website, tetapi tabelnya belum dibuat di server. Pemilik website perlu menjalankan satu file migrasi di Supabase SQL Editor untuk mengaktifkannya — setelah itu halaman ini langsung bisa dipakai."
        />
      </CardContent>
    </Card>
  );
}

export default function Classes() {
  const { classes, loading, error, notActive, createClass, joinClass } = useClasses();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const copyCode = async (joinCode) => {
    try {
      await navigator.clipboard.writeText(joinCode);
      toast.success(`Kode ${joinCode} tersalin — bagikan ke muridmu.`);
    } catch {
      toast.error('Gagal menyalin kode. Salin manual ya.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama kelas wajib diisi');
      return;
    }
    setCreating(true);
    try {
      const created = await createClass({ name, description });
      setName('');
      setDescription('');
      toast.success(`Kelas "${created?.name || name}" dibuat! Kode gabung: ${created?.joinCode || ''}`);
      if (created?.id) navigate(`/classes/${created.id}`);
    } catch (err) {
      handleError(err, 'Gagal membuat kelas');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!isValidJoinCode(code)) {
      toast.error('Kode kelas harus 6 karakter (huruf/angka, tanpa 0/O/1/I/L).');
      return;
    }
    setJoining(true);
    try {
      const joined = await joinClass(code);
      toast.success(`Berhasil gabung ke kelas "${joined?.name || ''}"!`);
      setCode('');
      if (joined?.id) navigate(`/classes/${joined.id}`);
    } catch (err) {
      handleError(err, 'Gagal gabung kelas');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Kelas
        </h1>
        <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          Buat kelasmu sendiri dan bagikan kode gabungnya ke murid, atau gabung ke kelas
          gurumu dengan kode 6 karakter. Pemilik kelas bisa memberi tugas dan melihat
          leaderboard khusus anggotanya.
        </p>
      </div>

      {notActive ? (
        <ClassesNotActiveState />
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState icon={UsersThree} title="Gagal Memuat" description={error} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="py-5 space-y-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-primary-500" /> Buat Kelas Baru
                </h2>
                <form onSubmit={handleCreate} className="space-y-3">
                  <Input
                    label="Nama kelas"
                    placeholder="mis. Bahasa Inggris Kelas 8A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                  <Input
                    label="Deskripsi (opsional)"
                    placeholder="mis. Kelas semester ganjil 2026"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                  />
                  <Button type="submit" disabled={creating} className="w-full">
                    {creating ? 'Membuat…' : 'Buat Kelas'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-5 space-y-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <SignIn className="w-5 h-5 text-primary-500" /> Gabung dengan Kode
                </h2>
                <form onSubmit={handleJoin} className="space-y-3">
                  <Input
                    label="Kode gabung"
                    placeholder="mis. K7X2PD"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="uppercase tracking-[0.3em] font-semibold"
                  />
                  <p className="text-xs text-gray-400">
                    Minta kode 6 karakter ini ke gurumu / pemilik kelas.
                  </p>
                  <Button type="submit" variant="outline" disabled={joining} className="w-full">
                    {joining ? 'Bergabung…' : 'Gabung Kelas'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : classes.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={UsersThree}
                  title="Belum Ada Kelas"
                  description="Buat kelas pertamamu dengan formulir di atas, atau gabung ke kelas gurumu memakai kode gabung."
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {classes.map((c) => (
                <Card key={c.id}>
                  <CardContent className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <Link
                          to={`/classes/${c.id}`}
                          className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 break-words"
                        >
                          {c.name}
                        </Link>
                        {c.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{c.description}</p>
                        )}
                        <p className="text-xs text-gray-400">Dibuat {formatDate(c.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={c.membership === 'owner' ? 'primary' : 'secondary'} size="sm">
                          {c.membership === 'owner' ? 'Kelas Saya' : 'Anggota'}
                        </Badge>
                        {c.membership === 'owner' && (
                          <button
                            type="button"
                            onClick={() => copyCode(c.joinCode)}
                            className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            <Copy className="w-3.5 h-3.5" /> {c.joinCode}
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
