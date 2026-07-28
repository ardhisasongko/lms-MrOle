import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Book, FileText, Headphones, Microphone, PenNib,
  CaretRight, GraduationCap,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { useCategories } from '../hooks/useCategories';
import { DIFFICULTY_LABEL } from '../utils/constants';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/feedback/ErrorState';
import toast from 'react-hot-toast';

const iconMap = {
  BookOpen, Book, FileText, Headphones, Microphone, PenNib,
};

const difficulties = ['easy', 'medium', 'hard'];

const difficultyMeta = {
  easy: { icon: GraduationCap, label: DIFFICULTY_LABEL.easy },
  medium: { icon: BookOpen, label: DIFFICULTY_LABEL.medium },
  hard: { icon: PenNib, label: DIFFICULTY_LABEL.hard },
};

export default function Practice() {
  const navigate = useNavigate();
  const { categories, loading, error } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const handleSelectCategory = (id) => {
    if (selectedCategory === id) {
      setSelectedCategory(null);
      setSelectedDifficulty('');
    } else {
      setSelectedCategory(id);
      setSelectedDifficulty('');
    }
  };

  const handleStart = () => {
    if (!selectedCategory || !selectedDifficulty) {
      toast.error('Pilih kategori dan tingkat kesulitan');
      return;
    }
    navigate(`/practice/${selectedCategory}?difficulty=${selectedDifficulty}`);
  };

  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Latihan Soal
        </h1>
        <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          Pilih kategori dan tingkat kesulitan untuk memulai.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, idx) => {
            const Icon = iconMap[cat.icon] || BookOpen;
            const isSelected = selectedCategory === cat.id;
            return (
              <Card
                key={cat.id}
                className={`
                  cursor-pointer select-none
                  transition-all duration-300 ease-spring
                  hover:-translate-y-0.5
                  ${isSelected ? 'ring-2 ring-primary-400/70' : 'ring-1 ring-black/[0.03] dark:ring-white/[0.05]'}
                `.trim()}
                style={{ transitionDelay: `${idx * 40}ms` }}
                hover={false}
              >
                <div onClick={() => handleSelectCategory(cat.id)}>
                  <CardContent className="flex items-center gap-3.5 py-[18px]">
                    <div className={`
                      w-11 h-11 rounded-xl flex items-center justify-center
                      transition-all duration-300 ease-spring
                      ${isSelected
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 scale-110'
                        : 'bg-primary-50/50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500'
                      }
                    `.trim()}>
                      <Icon className="w-5.5 h-5.5" weight={isSelected ? 'fill' : 'regular'} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[0.9375rem] text-gray-900 dark:text-gray-100 truncate">
                        {cat.name}
                      </p>
                      <p className="text-[0.8125rem] text-gray-400 dark:text-gray-500 leading-snug line-clamp-2">
                        {cat.description}
                      </p>
                    </div>
                  </CardContent>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-spring ${
                    isSelected ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden min-h-0">
                    <div className="border-t border-black/[0.04] dark:border-white/[0.06] mx-5 sm:mx-6" />
                    <div className="px-5 sm:px-6 py-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {difficulties.map((d) => {
                          const DiffIcon = difficultyMeta[d].icon;
                          const isActive = selectedDifficulty === d;
                          return (
                            <button
                              key={d}
                              onClick={(e) => { e.stopPropagation(); setSelectedDifficulty(d); }}
                              className={`
                                inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                                transition-all duration-300 ease-spring
                                active:scale-[0.97]
                                ${isActive
                                  ? 'bg-primary-500 text-white shadow-clay-lg scale-[1.02]'
                                  : 'bg-primary-50/60 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 hover:bg-primary-100/60 dark:hover:bg-gray-600/40 hover:text-gray-800 dark:hover:text-gray-100'
                                }
                              `.trim()}
                            >
                              <DiffIcon className="w-4 h-4" weight={isActive ? 'fill' : 'regular'} />
                              {DIFFICULTY_LABEL[d]}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleStart(); }}
                        disabled={!selectedDifficulty}
                        size="sm"
                        className="gap-2"
                      >
                        Mulai Kerjakan
                        <CaretRight className="w-4 h-4" weight="bold" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
