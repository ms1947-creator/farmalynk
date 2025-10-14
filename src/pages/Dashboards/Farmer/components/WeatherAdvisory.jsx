// farmer/components/WeatherAdvisory.jsx

import React, { useState, useEffect } from 'react';
// FIX: Added FaSpinner and FaSeedling to the imports
import { FaCloudSun, FaTint, FaTemperatureHigh, FaWind, FaExclamationCircle, FaSpinner, FaSeedling } from 'react-icons/fa';

// Placeholder function to simulate fetching weather and generating advisory
// In a real app, this would use Axios to call a Weather API (e.g., OpenWeatherMap)
const fetchWeatherAndAdvisory = (location, crops) => {
    return new Promise(resolve => {
        setTimeout(() => {
            const isRainy = Math.random() < 0.4;
            const temp = (25 + Math.random() * 10).toFixed(1);
            const wind = (5 + Math.random() * 10).toFixed(1);
            
            const advisory = [];
            
            if (isRainy) {
                advisory.push({ type: 'warning', text: "Expect heavy rainfall. Ensure drainage channels are clear to prevent waterlogging." });
                if (crops.includes('Wheat') || crops.includes('Rice')) {
                    advisory.push({ type: 'action', text: "Do NOT apply fertilizers or pesticides for the next 48 hours." });
                }
            } else if (temp > 32) {
                advisory.push({ type: 'action', text: "High temperatures expected. Increase irrigation frequency for all crops, especially during midday." });
            } else if (crops.includes('Red Dal')) {
                advisory.push({ type: 'tip', text: "Red Dal: Weather is stable. Check for early signs of pod borer pests." });
            } else {
                 advisory.push({ type: 'tip', text: "Favorable weather conditions for routine field maintenance." });
            }

            resolve({
                currentWeather: {
                    condition: isRainy ? 'Heavy Rain' : 'Sunny & Hot',
                    icon: isRainy ? '🌧️' : '☀️',
                    temp,
                    humidity: (60 + Math.random() * 20).toFixed(0),
                    wind,
                },
                advisories: advisory
            });
        }, 1500);
    });
};

function WeatherAdvisory({ farmerData }) {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Ensure farmerData has valid location and crops properties before calling
        const location = farmerData.location || 'Unknown Location';
        const crops = farmerData.crops || [];
        
        fetchWeatherAndAdvisory(location, crops)
            .then(data => {
                setWeatherData(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [farmerData.location, farmerData.crops]);

    if (loading) {
        // Line 92 fix: FaSpinner is now imported
        return <p className="text-center py-10 text-lg text-gray-500"><FaSpinner className="animate-spin inline mr-2" /> Fetching latest advisory...</p>;
    }
    
    if (!weatherData) return <div className="p-6 text-red-600">Failed to load weather data.</div>;

    const { currentWeather, advisories } = weatherData;

    return (
        <div className="grid grid-cols-3 gap-6">
            
            {/* Weather Card */}
            <div className="col-span-1 p-6 bg-white rounded-xl shadow-lg border-l-4 border-blue-500 flex flex-col items-center justify-center">
                <p className="text-6xl mb-3">{currentWeather.icon}</p>
                <p className="text-3xl font-extrabold text-gray-800">{currentWeather.condition}</p>
                <p className="text-6xl font-extrabold text-blue-600 my-4">
                    {currentWeather.temp}°C
                </p>
                <div className="flex justify-around w-full text-gray-600 text-sm">
                    <span className="flex items-center"><FaTint className="mr-1 text-blue-400" /> {currentWeather.humidity}% Humidity</span>
                    <span className="flex items-center"><FaWind className="mr-1 text-gray-400" /> {currentWeather.wind} km/h Wind</span>
                </div>
                <p className="mt-3 text-sm text-gray-500">Location: {farmerData.location}</p>
            </div>

            {/* Advisory List */}
            <div className="col-span-2 p-6 bg-white rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-3">Crop Advisory for Your Farm</h3>
                
                <div className="space-y-4">
                    {advisories.map((adv, index) => (
                        <div 
                            key={index} 
                            className={`p-4 rounded-lg shadow-sm flex items-start ${
                                adv.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-600' :
                                adv.type === 'action' ? 'bg-red-50 border-l-4 border-red-600' :
                                'bg-green-50 border-l-4 border-green-600'
                            }`}
                        >
                            <span className="mr-3 text-lg flex-shrink-0">
                                {adv.type === 'warning' ? <FaExclamationCircle className="text-yellow-600 mt-1" /> :
                                 adv.type === 'action' ? <FaExclamationCircle className="text-red-600 mt-1" /> :
                                 <FaSeedling className="text-green-600 mt-1" />} 
                                 {/* Line 118 fix: FaSeedling is now imported */}
                            </span>
                            <p className="text-gray-700 font-medium">{adv.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WeatherAdvisory;