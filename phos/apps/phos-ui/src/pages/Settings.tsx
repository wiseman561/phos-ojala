import { useEffect, useState } from 'react';
import { getServiceInfo, Services } from '../lib/api';
import type { ServiceInfo } from '../lib/types';

export default function Settings() {
  const [infos, setInfos] = useState<Record<string, ServiceInfo | null>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const entries = await Promise.all(
          Object.entries(Services).map(async ([key, path]) => {
            try {
              const info = await getServiceInfo(path);
              return [key, info as ServiceInfo] as const;
            } catch {
              return [key, null] as const;
            }
          })
        );
        if (!cancelled) {
          setInfos(Object.fromEntries(entries));
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load service info');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="panel">
      <h2>Settings</h2>
      <p>Manage your profile and preferences.</p>
      <h3 className="mt">Service Versions</h3>
      {error && <p style={{ color: '#ff6b6b' }}>Error: {error}</p>}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Name</th>
              <th>Version</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(Services).map(([key, path]) => {
              const info = infos[key];
              return (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{info?.name ?? '-'}</td>
                  <td>{info?.version ?? '-'}</td>
                  <td>{info ? 'reachable' : 'unavailable'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="mt">Service Docs & Health</h3>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Swagger</th>
              <th>Health</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(Services).map(([key, path]) => (
              <tr key={key}>
                <td>{key}</td>
                <td><a href={`${path}/swagger`} target="_blank" rel="noreferrer">{path}/swagger</a></td>
                <td><a href={`${path}/healthz`} target="_blank" rel="noreferrer">{path}/healthz</a></td>
                <td><a href={`${path}/info`} target="_blank" rel="noreferrer">{path}/info</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
