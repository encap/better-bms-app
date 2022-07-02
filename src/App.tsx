import { useState } from 'react';
import './App.css';
import main from './ble-poc';

function App() {
  const [loading, setLoading] = useState(false);
  const [voltage, setVoltage] = useState<number | null>(null);

  return (
    <div
      className='App'
      onClick={() => {
        setLoading(true);
        main((v) => {
          setVoltage(v);
          setLoading(false);
        });
      }}
    >
      {loading ? (
        <h2>{'Loading...'}</h2>
      ) : voltage ? (
        <>
          <h1>
            {voltage.toFixed(3)}
            {'V'}
          </h1>
        </>
      ) : (
        <h2>{'Click to connect'}</h2>
      )}
    </div>
  );
}

export default App;
