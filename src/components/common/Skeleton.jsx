import { memo } from 'react';
import { cn } from '../../utils/cn';

function Skeleton({ className }) {
  return (
    <div className={cn('skeleton', className)} />
  );
}

export default memo(Skeleton);
