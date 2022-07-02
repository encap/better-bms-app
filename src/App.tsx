import { useState } from 'react';
import './App.css';
import main from './ble-poc';

function App() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    voltage: number;
    power: number;
    current: number;
  } | null>(null);

  return (
    <div
      className='App'
      onClick={() => {
        setLoading(true);
        main((d) => {
          setData(d);
          setLoading(false);
        });
      }}
    >
      {loading ? (
        <h2>{'Loading...'}</h2>
      ) : data ? (
        <>
          <h1>
            {String(data.voltage.toFixed(5)).slice(0, 6)}
            {'V'}
            <br />
            {String(data.current.toFixed(5)).slice(0, 6)}
            {'A'}
            <br />
            {String(data.power.toFixed(5)).slice(0, 6)}
            {'W'}
          </h1>
        </>
      ) : (
        <h2>{'Click to connect'}</h2>
      )}
    </div>
  );
}

export default App;
