import dynamic from 'next/dynamic';

// Player Components with Loading Skeletons
export const PlayerRadar = dynamic(() => import('./player/PlayerRadar'), {
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>,
  ssr: false
});

export const PlayerTable = dynamic(() => import('./player/PlayerTable'), {
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>
});

// Admin Components with Loading Skeletons
export const AdminPlayerFilters = dynamic(() => import('./player/AdminPlayerFilters'), {
  loading: () => <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
});

export const MultiSelectFilter = dynamic(() => import('./filters/multi-select-filter'), {
  loading: () => {
    return <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>;
  }
});

export const AdminPageLayout = dynamic(() => import('./layout/admin-page-layout'), {
  loading: () => {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }
});

// Heavy Chart Components (for future use)
export const PlayerBeeswarm = dynamic(() => import('./player/PlayerBeeswarm'), {
  loading: () => {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  },
  ssr: false
});

export const PlayerLollipop = dynamic(() => import('./player/PlayerLollipop'), {
  loading: () => {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  },
  ssr: false
});