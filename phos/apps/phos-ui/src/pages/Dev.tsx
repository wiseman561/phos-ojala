import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const services = [
  { name: 'labs', base: '/api/labs' },
  { name: 'nutrition', base: '/api/nutrition' },
  { name: 'genome', base: '/api/genome' },
  { name: 'microbiome', base: '/api/microbiome' },
  { name: 'sleep', base: '/api/sleep' },
  { name: 'core', base: '/api/core' },
  { name: 'audit-log', base: '/api/audit-logs' },
  { name: 'billing', base: '/api/billing' },
  { name: 'fhir', base: '/api/fhir' }
];

export default function Dev() {
  const infos = useQuery({
    queryKey: ['dev-infos'],
    queryFn: async () => {
      const out: Record<string, any> = {};
      for (const s of services) {
        try {
          const res = await axios.get(`${s.base}/api/info`);
          out[s.name] = res.data;
        } catch {}
      }
      return out;
    }
  });

  return (
    <div className="panel">
      <h2>Developer Tools</h2>
      <ul>
        {services.map(s => (
          <li key={s.name}>
            <a href={`${s.base}/swagger`} target="_blank" rel="noreferrer">{s.name} Swagger</a>
            {' '}| <a href={`${s.base}/healthz`} target="_blank" rel="noreferrer">healthz</a>
          </li>
        ))}
      </ul>
      <pre>{JSON.stringify(infos.data ?? {}, null, 2)}</pre>
    </div>
  );
}


