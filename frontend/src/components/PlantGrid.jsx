import React from 'react';
import PlantCard from './PlantCard';

const DUMMY_PLANTS = [
  {
    id: 1,
    name: 'Snake Plant',
    type: 'Cactus',
    description: 'Perfect for beginners. Thrives on neglect and purifies indoor air effectively.',
    price: '$24.99',
    image: 'https://images.unsplash.com/photo-1593482892290-f54927ae1b7e?auto=format&fit=crop&w=600&q=80',
    tags: ['Low Light', 'Air Purifying'],
  },
  {
    id: 2,
    name: 'Monstera Deliciosa',
    type: 'Monstera',
    description: 'The famous Swiss Cheese plant. Brings a tropical jungle vibe to any bright room.',
    price: '$45.00',
    image: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=600&q=80',
    tags: ['Bright Light', 'Trending'],
  },
  {
    id: 3,
    name: 'Peace Lily',
    type: 'Peace Lily',
    description: 'Elegant white blooms. Excellent at removing toxins and loves high humidity.',
    price: '$32.00',
    image: 'https://images.unsplash.com/photo-1597554909776-50d4eb073b64?auto=format&fit=crop&w=600&q=80',
    tags: ['High Humidity', 'Blooms'],
  },
  {
    id: 4,
    name: 'Boston Fern',
    type: 'Fern',
    description: 'Lush, feathery fronds. Requires consistent moisture and indirect sunlight.',
    price: '$18.50',
    image: 'https://images.unsplash.com/photo-1611075677573-0ff76cd09d7c?auto=format&fit=crop&w=600&q=80',
    tags: ['Pet Friendly', 'Moisture Lover'],
  }
];

const PlantGrid = ({ onSelectPlant }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {DUMMY_PLANTS.map((plant) => (
        <PlantCard key={plant.id} plant={plant} onSelect={onSelectPlant} />
      ))}
    </div>
  );
};

export default PlantGrid;
