import React, { useState, useMemo, ChangeEvent, JSX } from 'react';
import './App.css';
import { dataDistance, NameToDistance } from './lib/distance_models'; // Import distance data and type

// Type definitions
interface DistanceData {
  label: string;
  meters: number;
}

interface PaceData {
    label: string;
    seconds: number;
}

// Helper function to format seconds into hh:mm:ss or mm:ss
function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds <= 0) {
    return '--:--';
  }
  let hours: number = Math.floor(totalSeconds / 3600);
  let minutes: number = Math.floor((totalSeconds % 3600) / 60);
  let seconds: number = Math.round(totalSeconds % 60);

  if (seconds === 60) {
      minutes += 1;
      seconds = 0;
  }
  if (minutes === 60) {
      hours += 1;
      minutes = 0;
  }

  const paddedSeconds: string = String(seconds).padStart(2, '0');
  const paddedMinutes: string = String(minutes).padStart(2, '0');

  if (hours > 0) {
    const paddedHours: string = String(hours).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  } else {
    return `${paddedMinutes}:${paddedSeconds}`;
  }
}

// Helper function to calculate time in seconds for a distance at a given pace
function calculateTime(distanceMeters: number, paceSecondsPerKm: number): number {
  if (paceSecondsPerKm <= 0) return NaN;
  const speedMetersPerSecond: number = 1000 / paceSecondsPerKm;
  return distanceMeters / speedMetersPerSecond;
}


// Component
function App(): JSX.Element {
  // State for pace configuration
  const [maxPaceMin, setMaxPaceMin] = useState<number>(7); // Default Max: 7:00/km
  const [maxPaceSec, setMaxPaceSec] = useState<number>(0);
  const [minPaceMin, setMinPaceMin] = useState<number>(3); // Default Min: 3:00/km
  const [minPaceSec, setMinPaceSec] = useState<number>(0);
  const [paceIntervalSec, setPaceIntervalSec] = useState<number>(15); // Default Interval: 15s

  // VMA state - kept but unused for now as requested
  const [vma, setVma] = useState<string>('');

  // Use distances from the imported model
  const distances: DistanceData[] = useMemo(() => {
    // Extract label and meters from the imported dataDistance object
    // Add type assertion for distInfo
    return Object.values(dataDistance).map((distInfo: NameToDistance) => ({
        label: distInfo.label, // Use the label provided in dataDistance
        meters: distInfo.distance
    }));
    // If you specifically need the order from the Enum, you could map over Object.keys(DistanceIntermediairesEnum)
    // and look up in dataDistance, but Object.values(dataDistance) is simpler if order isn't critical.
  }, []); // Empty dependency array means this runs once

  // Generate paces based on state using useMemo
  const paces: PaceData[] = useMemo(() => {
    const generatedPaces: PaceData[] = [];
    const maxTotalSeconds: number = maxPaceMin * 60 + maxPaceSec;
    const minTotalSeconds: number = minPaceMin * 60 + minPaceSec;
    const interval: number = paceIntervalSec;

    // Define absolute limits
    const absoluteMinSeconds = 2 * 60; // 2:00/km
    const absoluteMaxSeconds = 9 * 60; // 9:00/km

    if (maxTotalSeconds < minTotalSeconds || interval <= 0 || maxTotalSeconds < absoluteMinSeconds || minTotalSeconds > absoluteMaxSeconds) {
      return []; // Invalid range or interval
    }

    // Clamp the iteration range to absolute limits
    const startSeconds = Math.min(maxTotalSeconds, absoluteMaxSeconds);
    const endSeconds = Math.max(minTotalSeconds, absoluteMinSeconds);


    for (let currentSeconds = startSeconds; currentSeconds >= endSeconds; currentSeconds -= interval) {
      const currentMin: number = Math.floor(currentSeconds / 60);
      const currentSec: number = currentSeconds % 60;
      generatedPaces.push({
        label: `${currentMin}:${String(currentSec).padStart(2, '0')}`,
        seconds: currentSeconds
      });
    }

     // Ensure the exact minimum pace (endSeconds) is included if within absolute limits and not caught by loop steps
     if (endSeconds >= absoluteMinSeconds && !generatedPaces.some(p => p.seconds === endSeconds)) {
        const minMin = Math.floor(endSeconds / 60);
        const minSec = endSeconds % 60;
         generatedPaces.push({ label: `${minMin}:${String(minSec).padStart(2, '0')}`, seconds: endSeconds });
     }
     // Ensure the exact maximum pace (startSeconds) is included if within absolute limits and not caught by loop steps, and different from min
      if (startSeconds <= absoluteMaxSeconds && startSeconds !== endSeconds && !generatedPaces.some(p => p.seconds === startSeconds)) {
        const maxMin = Math.floor(startSeconds / 60);
        const maxSec = startSeconds % 60;
         generatedPaces.push({ label: `${maxMin}:${String(maxSec).padStart(2, '0')}`, seconds: startSeconds });
     }


    // Sort paces descending by seconds (slowest first)
    generatedPaces.sort((a, b) => b.seconds - a.seconds);
    return generatedPaces;

  }, [maxPaceMin, maxPaceSec, minPaceMin, minPaceSec, paceIntervalSec]);


  // Helper options for selects
  const minuteOptions: number[] = Array.from({ length: 8 }, (_, i) => 2 + i); // 2 to 9
  const secondOptions: number[] = [0, 15, 30, 45];
  const intervalOptions: number[] = Array.from({ length: 30 }, (_, i) => 1 + i); // 1 to 30


  // Handlers for pace inputs
  const handleMaxPaceMinChange = (e: ChangeEvent<HTMLSelectElement>) => setMaxPaceMin(parseInt(e.target.value, 10));
  const handleMaxPaceSecChange = (e: ChangeEvent<HTMLSelectElement>) => setMaxPaceSec(parseInt(e.target.value, 10));
  const handleMinPaceMinChange = (e: ChangeEvent<HTMLSelectElement>) => setMinPaceMin(parseInt(e.target.value, 10));
  const handleMinPaceSecChange = (e: ChangeEvent<HTMLSelectElement>) => setMinPaceSec(parseInt(e.target.value, 10));
  const handleIntervalChange = (e: ChangeEvent<HTMLSelectElement>) => setPaceIntervalSec(parseInt(e.target.value, 10));
  // Handler for VMA (unused for display logic now)
  const handleVmaChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVma(e.target.value);
  };


  return (
    <div className="App">
      <h1>Calculateur d'Allure</h1>

       {/* VMA Input - Kept but doesn't affect table */}
       <div className="vma-input">
        <label htmlFor="vma">Votre VMA (km/h): </label>
        <input
          type="number"
          id="vma"
          value={vma}
          onChange={handleVmaChange}
          placeholder="ex: 15"
        />
         {vma && parseFloat(vma) > 0 && <span> (Allure VMA: {formatTime(3600 / parseFloat(vma))}/km)</span>}
      </div>

       {/* Pace Configuration */}
      <div className="pace-config">
        <h3>Configurer l'affichage des allures</h3>
        <div className="config-row">
           <label>Allure Max (lente):</label>
           <div> {/* Wrap selects for better control */}
            <select value={maxPaceMin} onChange={handleMaxPaceMinChange}>
              {minuteOptions.map(min => <option key={`max-min-${min}`} value={min}>{min}</option>)}
            </select>
            <span>:</span>
            <select value={maxPaceSec} onChange={handleMaxPaceSecChange}>
              {secondOptions.map(sec => <option key={`max-sec-${sec}`} value={sec}>{String(sec).padStart(2, '0')}</option>)}
            </select>
            <span> min/km (max 9:00)</span>
           </div>
        </div>
         <div className="config-row">
           <label>Allure Min (rapide):</label>
           <div>
            <select value={minPaceMin} onChange={handleMinPaceMinChange}>
              {minuteOptions.map(min => <option key={`min-min-${min}`} value={min}>{min}</option>)}
            </select>
            <span>:</span>
            <select value={minPaceSec} onChange={handleMinPaceSecChange}>
              {secondOptions.map(sec => <option key={`min-sec-${sec}`} value={sec}>{String(sec).padStart(2, '0')}</option>)}
            </select>
             <span> min/km (min 2:00)</span>
            </div>
        </div>
         <div className="config-row">
            <label htmlFor="interval">Intervalle (secondes):</label>
            <div>
                <select id="interval" value={paceIntervalSec} onChange={handleIntervalChange}>
                    {intervalOptions.map(sec => <option key={`interval-${sec}`} value={sec}>{sec}s</option>)}
                </select>
            </div>
        </div>
      </div>


      <h2>Tableau des Temps par Allure</h2>
      {paces.length > 0 ? (
        <div className="table-container">
            <table>
            <thead>
                <tr>
                <th>Allure (min/km)</th>
                {distances.map(dist => (
                    <th key={dist.label}>{dist.label}</th>
                ))}
                </tr>
            </thead>
            <tbody>
                {paces.map(pace => (
                <tr key={pace.seconds}>
                    <td>{pace.label}</td>
                    {distances.map(dist => (
                    <td key={`${pace.seconds}-${dist.meters}`}>
                        {formatTime(calculateTime(dist.meters, pace.seconds))}
                    </td>
                    ))}
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        ) : (
            <p className="info-message">Configuration d'allure invalide. Vérifiez que l'allure max est plus lente que l'allure min et dans les limites (2:00-9:00).</p>
        )}
    </div>
  );
}

export default App;