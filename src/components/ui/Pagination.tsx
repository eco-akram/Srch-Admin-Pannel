import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Previous
      </button>
      
      <div className="flex space-x-1">
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          // Show ellipsis for many pages
          if (totalPages > 5) {
            if (totalPages <= 7) {
              // For relatively few pages, show all
              return i + 1;
            } else if (currentPage <= 3) {
              // Near start
              return i < 4 ? i + 1 : i === 4 ? '...' : totalPages;
            } else if (currentPage >= totalPages - 2) {
              // Near end
              return i === 0 ? 1 : i === 1 ? '...' : totalPages - 4 + i;
            } else {
              // Middle
              return i === 0 ? 1 : i === 1 ? '...' : i === 3 ? '...' : i === 4 ? totalPages : currentPage + i - 2;
            }
          }
          return i + 1;
        }).map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={page === '...'}
            className={`w-8 h-8 rounded ${
              currentPage === page 
                ? 'bg-blue-500 text-white' 
                : page === '...'
                  ? 'border text-gray-400'
                  : 'border hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}