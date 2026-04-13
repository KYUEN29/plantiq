import React from 'react';
import PlantCard from './PlantCard';

import MoneyPlantImg from '../assets/plants/money-plant.png';
import SnakePlantImg from '../assets/plants/snake-plant.png';
import TulsiImg from '../assets/plants/tulsi.png';
import AloeVeraImg from '../assets/plants/aloe-vera.png';
import MonsteraImg from '../assets/plants/monstera.png';
import PeaceLilyImg from '../assets/plants/peace-lily.png';
import SpiderPlantImg from '../assets/plants/spider-plant.png';
import ArecaPalmImg from '../assets/plants/areca-palm.png';
import FernImg from '../assets/plants/fern.png';
import JadePlantImg from '../assets/plants/jade-plant.png';

export const DUMMY_PLANTS = [
  { id: 1, name: 'Money Plant', type: 'Epipremnum', description: 'Lucky charm. Extremely durable and tolerates neglect well.', image: MoneyPlantImg, tags: ['Low Maintenance', 'Low Light'] },
  { id: 2, name: 'Snake Plant', type: 'Sansevieria', description: 'Stiff, upright leaves. Purifies air at night making it great for bedrooms.', image: SnakePlantImg, tags: ['Air Purifying', 'Low Light'] },
  { id: 3, name: 'Tulsi', type: 'Ocimum tenuiflorum', description: 'Holy basil. Highly aromatic and widely used in traditional medicine.', image: TulsiImg, tags: ['Herbal', 'Direct Sun'] },
  { id: 4, name: 'Aloe Vera', type: 'Aloe', description: 'Succulent with soothing gel. Prefers bright light and dry soil.', image: AloeVeraImg, tags: ['Medicinal', 'Low Water', 'Succulents'] },
  { id: 5, name: 'Monstera', type: 'Monstera deliciosa', description: 'Famous Swiss Cheese Plant with large, fenestrated leaves.', image: MonsteraImg, tags: ['Bright Light', 'Trending'] },
  { id: 6, name: 'Peace Lily', type: 'Spathiphyllum', description: 'Elegant white blooms. Excellent at communicating when thirsty.', image: PeaceLilyImg, tags: ['Air Purifying', 'Low Light'] },
  { id: 7, name: 'Spider Plant', type: 'Chlorophytum', description: 'Arching leaves and hanging spiderettes. Extremely adaptable.', image: SpiderPlantImg, tags: ['Pet Friendly', 'Air Purifying'] },
  { id: 8, name: 'Areca Palm', type: 'Dypsis lutescens', description: 'Feathery fronds that bring a soft, tropical feel to any bright room.', image: ArecaPalmImg, tags: ['High Humidity', 'Air Purifying'] },
  { id: 9, name: 'Fern', type: 'Nephrolepis', description: 'Lush, feathery fronds requiring consistent moisture.', image: FernImg, tags: ['High Humidity', 'Low Light', 'Pet Friendly'] },
  { id: 10, name: 'Jade Plant', type: 'Crassula', description: 'Tree-like succulent. Believed to bring financial luck.', image: JadePlantImg, tags: ['Low Water', 'Succulents', 'Longevity'] }
];

// AI Recommended = the top-rated beginner-friendly & high-impact plants
const AI_RECOMMENDED_IDS = [2, 4, 5, 7]; // Snake Plant, Aloe Vera, Monstera, Spider Plant

const PlantGrid = ({ selectedPlants, onTogglePlant, activeFilter = 'All Plants' }) => {
  const filteredPlants = DUMMY_PLANTS.filter(plant => {
    if (activeFilter === 'All Plants') return true;
    if (activeFilter === 'AI Recommended') return AI_RECOMMENDED_IDS.includes(plant.id);
    // Match filter name against plant tags
    return plant.tags.some(tag => tag.toLowerCase() === activeFilter.toLowerCase());
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
              isSelected={selectedPlants.some(p => p.id === plant.id)}
              onToggle={() => onTogglePlant(plant)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantGrid;

