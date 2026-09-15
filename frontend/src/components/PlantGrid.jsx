import React, { useEffect, useState } from 'react';
import PlantCard from './PlantCard';
import { getPlantCatalogue } from '../services/api';

const PlantGrid = ({ selectedPlants, onTogglePlant, activeFilter = 'All Plants' }) => {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPlants = async () => {
      try {
        const catalogue = await getPlantCatalogue();
        const mapped = catalogue.map((plant) => ({
          id: plant.id,
          image: plant.image_url,
          name: plant.common_name,
          description: plant.description,
          tags: [
            plant.category || 'Indoor',
            plant.difficulty || 'Moderate',
            ...(plant.aliases || []).slice(0, 2)
          ]
        }));
        setPlants(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPlants();
  }, []);

  if (loading) {
    return <div className="py-24 text-center text-gray-500">Loading plant catalogue…</div>;
  }

  if (error) {
    return <div className="py-24 text-center text-red-500">Error loading plant catalogue: {error}</div>;
  }

  const filteredPlants = plants.filter((plant) => {
    if (activeFilter === 'All Plants') return true;
    return plant.tags.some(
      (tag) => tag.toLowerCase() === activeFilter.toLowerCase()
    );
  });

  return (
    <div>
      {filteredPlants.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No plants match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              isSelected={selectedPlants.some((p) => p.id === plant.id)}
              onToggle={() => onTogglePlant(plant)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantGrid;