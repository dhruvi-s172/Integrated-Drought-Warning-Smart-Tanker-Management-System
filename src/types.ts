import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Village {
  id: number;
  name: string;
  block: string;
  district: string;
  state: string;
  population: number;
  latitude: number;
  longitude: number;
  water_source: string;
  base_water_demand: number;
  risk_level: 'Green' | 'Orange' | 'Red';
  water_stress_index: number;
  rainfall_deviation: number;
  groundwater_level: number;
}

export interface Tanker {
  id: number;
  registration_no: string;
  capacity_liters: number;
  current_load_percentage: number;
  assigned_state: string;
  assigned_district: string;
  assigned_block: string;
  assigned_village_id?: number;
  source_point: string;
  status: 'Available' | 'In Transit' | 'Delivering' | 'Maintenance';
  current_lat: number;
  current_lng: number;
  last_updated: string;
}

export interface Alert {
  id: number;
  type: 'Critical' | 'Warning' | 'Info';
  message: string;
  location_id?: number;
  village_name?: string;
  district?: string;
  tanker_id?: number;
  tanker_no?: string;
  timestamp: string;
  status: string;
}

export interface LocationHierarchy {
  states: { state: string }[];
  districts: { state: string, district: string }[];
  blocks: { district: string, block: string }[];
  villages: { id: number, name: string, block: string, district: string, state: string }[];
}

export interface UsageReport {
  registration_no: string;
  total_volume: number;
  trips: number;
  total_fuel: number;
}

export interface DashboardStats {
  totalVillages: number;
  criticalVillages: number;
  activeTankers: number;
  waterGapLiters: number;
}
