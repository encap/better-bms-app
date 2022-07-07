import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Device, DeviceStatus } from 'interfaces/device';

export type DeviceContextType = {
  device: Device | null;
  setDevice: (deviceInstance: Device) => void;
  status: DeviceStatus;
  setStatus: (status: DeviceStatus) => void;
};

const DeviceContext = createContext<DeviceContextType>({
  device: null,
  status: 'disconnected',
} as DeviceContextType);

export function useDevice() {
  return useContext(DeviceContext);
}

type DeviceProviderProps = {
  children: ReactNode;
};

const DeviceProvider = ({ children }: DeviceProviderProps) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [status, setStatus] = useState<DeviceStatus>('disconnected');

  const contextValue = useMemo(
    () => ({ device, status, setDevice, setStatus }),
    [device, status, setDevice, setStatus]
  );

  return <DeviceContext.Provider value={contextValue}>{children}</DeviceContext.Provider>;
};

export default DeviceProvider;
