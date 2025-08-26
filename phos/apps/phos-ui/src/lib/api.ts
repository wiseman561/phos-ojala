import axios from 'axios';
import { LabInterpretRequest, LabInterpretResponse, NutritionAnalyzeRequest, NutritionAnalyzeResponse, RecommendationResponse, ServiceInfo } from './types';

// Seed a fake token for now
if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
	localStorage.setItem('token', 'dev-token');
}

export const api = axios.create({
	baseURL: '/api',
});

// Attach Authorization header if token available
api.interceptors.request.use((config) => {
	const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
	if (token) {
		config.headers = config.headers ?? {};
		(config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}
	return config;
});

export async function postLabInterpret(payload: LabInterpretRequest): Promise<LabInterpretResponse> {
	const res = await api.post('/labs/interpret', payload);
	return res.data as LabInterpretResponse;
}

export async function postNutritionAnalyze(payload: NutritionAnalyzeRequest): Promise<NutritionAnalyzeResponse> {
	const res = await api.post('/nutrition/analyze', payload);
	return res.data as NutritionAnalyzeResponse;
}

export async function getRecommendations(userId: string): Promise<RecommendationResponse> {
	const res = await api.get('/core/recommendations', { params: { userId } });
	return res.data as RecommendationResponse;
}

export async function getServiceInfo(path: string): Promise<ServiceInfo> {
	const res = await api.get(`${path}/info`);
	return res.data as ServiceInfo;
}

export const Services = {
	labs: '/labs',
	nutrition: '/nutrition',
	genome: '/genome',
	microbiome: '/microbiome',
	sleep: '/sleep',
	core: '/core',
};
