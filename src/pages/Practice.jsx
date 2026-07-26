import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Book, FileText, Headphones, Microphone, PenNib,
  CaretRight,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import { useCategories } from '../hooks/useCategories';
import { DIFFICULTY_LABEL } from '../utils/constants';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/feedback/ErrorState';
import toast from 'react-hot-toast';

const iconMap = {
  BookOpen, Book, FileText, Headphones, Microphone, PenNib,
};

const difficulties = ['easy', 'medium', 'hard'];

export default function Practice() {
  const navigate = useNavigate();
  const { categories, loading, error } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const handleStart = () => {
    if (!selectedCategory || !selectedDifficulty) {
      toast.error('Pilih kategori dan tingkat kesulitan');
      return;
    }
    navigate(`/practice/${selectedCategory}?difficulty=${selectedDifficulty}`);
  };

  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Latihan Soal</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Pilih kategori dan tingkat kesulitan.</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || BookOpen;
            const isSelected = selectedCategory === cat.id;
            return (
              <Card
                key={cat.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary-500 border-primary-500' : ''
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{cat.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedCategory && (
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tingkat Kesulitan</h2>
            <div className="flex flex-wrap gap-3">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                    selectedDifficulty === d
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {DIFFICULTY_LABEL[d]}
                </button>
              ))}
            </div>
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cta-500 text-white rounded-2xl font-medium hover:bg-cta-600 shadow-clay transition-all duration-150"
            >
              Mulai Kerjakan
              <CaretRight className="w-4 h-4" />
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
