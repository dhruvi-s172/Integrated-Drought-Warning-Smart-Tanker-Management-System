// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Truck, 
  AlertTriangle, 
  FileText, 
  MessageSquare,
  Droplets,
  Users,
  TrendingDown,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cn } from './utils';
import { Village, Tanker, DashboardStats } from './types';

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200",
      active ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon: Icon, trend, color }: { title: string, value: string | number, icon: any, trend?: string, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          trend.startsWith('+') ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
        )}>
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [villages, setVillages] = useState<Village[]>([]);
  const [tankers, setTankers] = useState<Tanker[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hierarchy, setHierarchy] = useState<LocationHierarchy | null>(null);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newTanker, setNewTanker] = useState({
    registration_no: '',
    capacity_liters: 10000,
    assigned_state: '',
    assigned_district: '',
    assigned_block: '',
    assigned_village_id: '',
    source_point: '',
    status: 'Available'
  });

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Namaste! I am your JalSetu AI assistant. I can help you analyze drought patterns, optimize tanker routes, and predict water stress in your district.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchVillages();
    fetchTankers();
    fetchAlerts();
    fetchHierarchy();
  }, [selectedState, selectedDistrict]);

  const [selectedTanker, setSelectedTanker] = useState<Tanker | null>(null);

  const fetchHierarchy = async () => {
    const res = await fetch('/api/locations/hierarchy');
    const data = await res.json();
    setHierarchy(data);
  };

  const handleRegisterTanker = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tankers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTanker)
    });
    if (res.ok) {
      setShowRegisterModal(false);
      fetchTankers();
    }
  };

  const fetchStats = async () => {
    const url = new URL('/api/dashboard/stats', window.location.origin);
    if (selectedState) url.searchParams.append('state', selectedState);
    if (selectedDistrict) url.searchParams.append('district', selectedDistrict);
    const res = await fetch(url.toString());
    const data = await res.json();
    setStats(data);
  };

  const fetchVillages = async () => {
    const url = new URL('/api/villages', window.location.origin);
    if (selectedState) url.searchParams.append('state', selectedState);
    if (selectedDistrict) url.searchParams.append('district', selectedDistrict);
    const res = await fetch(url.toString());
    const data = await res.json();
    setVillages(data);
  };

  const fetchTankers = async () => {
    const url = new URL('/api/tankers', window.location.origin);
    if (selectedState) url.searchParams.append('state', selectedState);
    if (selectedDistrict) url.searchParams.append('district', selectedDistrict);
    const res = await fetch(url.toString());
    const data = await res.json();
    setTankers(data);
  };

  const fetchAlerts = async () => {
    const url = new URL('/api/alerts', window.location.origin);
    if (selectedState) url.searchParams.append('state', selectedState);
    if (selectedDistrict) url.searchParams.append('district', selectedDistrict);
    const res = await fetch(url.toString());
    const data = await res.json();
    setAlerts(data);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-blue-500 p-2 rounded-lg">
            <Droplets className="text-white" size={24} />
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">JalSetu</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={MapIcon} label="GIS Mapping" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          <SidebarItem icon={Truck} label="Tanker Fleet" active={activeTab === 'tankers'} onClick={() => setActiveTab('tankers')} />
          <SidebarItem icon={AlertTriangle} label="Alert Center" active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} />
          <SidebarItem icon={FileText} label="Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
          <SidebarItem icon={MessageSquare} label="AI Assistant" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
        </nav>

        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-2">System Health</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">All Systems Nominal</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-bottom border-slate-100 px-8 py-6 sticky top-0 z-10 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
              <p className="text-slate-500 text-sm">District-Level Water Governance Platform</p>
            </div>
            
            {/* Location Selector */}
            <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <select 
                value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); }}
                className="bg-transparent text-sm font-bold px-3 py-2 outline-none border-r border-slate-200"
              >
                <option value="">All States</option>
                {hierarchy?.states.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
              </select>
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-sm font-bold px-3 py-2 outline-none"
              >
                <option value="">All Districts</option>
                {hierarchy?.districts.filter(d => !selectedState || d.state === selectedState).map(d => (
                  <option key={d.district} value={d.district}>{d.district}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowRegisterModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <Truck size={16} />
              Register Tanker
            </button>
          </div>
        </header>

        {/* Tanker Details Modal */}
        {selectedTanker && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-bold">{selectedTanker.registration_no}</h3>
                  <p className="text-sm text-slate-500">Detailed Fleet Analytics</p>
                </div>
                <button onClick={() => setSelectedTanker(null)} className="text-slate-400 hover:text-slate-600">
                  <AlertTriangle size={24} className="rotate-45" />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Capacity</p>
                    <p className="text-lg font-bold">{selectedTanker.capacity_liters} L</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Current Load</p>
                    <p className="text-lg font-bold">{selectedTanker.current_load_percentage}%</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <p className="text-slate-400 text-xs font-bold uppercase mb-1">Status</p>
                    <p className="text-lg font-bold text-blue-600">{selectedTanker.status}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900">Operational Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-500 text-sm">Source Point</span>
                      <span className="font-bold text-sm">{selectedTanker.source_point || 'Main Reservoir'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-500 text-sm">Fuel Efficiency</span>
                      <span className="font-bold text-sm">2.4 km/L</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-500 text-sm">Total Deliveries</span>
                      <span className="font-bold text-sm">124</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                      <span className="text-slate-500 text-sm">Cost/Liter</span>
                      <span className="font-bold text-sm">₹0.12</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-2">Predictive Maintenance Alert</h4>
                  <p className="text-sm text-blue-700">Next service due in 450km. Brake pad wear detected at 65%.</p>
                </div>

                <button 
                  onClick={() => setSelectedTanker(null)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold">Register New Water Tanker</h3>
                <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">
                  <AlertTriangle size={24} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleRegisterTanker} className="p-8 grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Tanker Number</label>
                  <input 
                    required
                    placeholder="e.g. MH-24-AB-1234"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newTanker.registration_no}
                    onChange={e => setNewTanker({...newTanker, registration_no: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Capacity (Liters)</label>
                  <input 
                    required
                    type="number"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={newTanker.capacity_liters}
                    onChange={e => setNewTanker({...newTanker, capacity_liters: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Assigned State</label>
                  <select 
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none"
                    value={newTanker.assigned_state}
                    onChange={e => setNewTanker({...newTanker, assigned_state: e.target.value})}
                  >
                    <option value="">Select State</option>
                    {hierarchy?.states.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Assigned District</label>
                  <select 
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none"
                    value={newTanker.assigned_district}
                    onChange={e => setNewTanker({...newTanker, assigned_district: e.target.value})}
                  >
                    <option value="">Select District</option>
                    {hierarchy?.districts.filter(d => d.state === newTanker.assigned_state).map(d => (
                      <option key={d.district} value={d.district}>{d.district}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Source Point</label>
                  <input 
                    required
                    placeholder="Water Reservoir Name"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none"
                    value={newTanker.source_point}
                    onChange={e => setNewTanker({...newTanker, source_point: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                  <select 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none"
                    value={newTanker.status}
                    onChange={e => setNewTanker({...newTanker, status: e.target.value as any})}
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="col-span-2 pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                    Confirm Registration
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Villages" value={stats?.totalVillages || 0} icon={Users} color="bg-blue-500" />
                  <StatCard title="Critical (Red Alert)" value={stats?.criticalVillages || 0} icon={AlertTriangle} trend="+2 this week" color="bg-red-500" />
                  <StatCard title="Active Tankers" value={stats?.activeTankers || 0} icon={Truck} color="bg-orange-500" />
                  <StatCard title="Water Gap (Liters)" value={(stats?.waterGapLiters || 0).toLocaleString()} icon={TrendingDown} color="bg-indigo-500" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <Activity size={20} className="text-blue-500" />
                      Water Stress Index Trends
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'Jan', wsi: 45 },
                          { name: 'Feb', wsi: 52 },
                          { name: 'Mar', wsi: 68 },
                          { name: 'Apr', wsi: 85 },
                          { name: 'May', wsi: 92 },
                          { name: 'Jun', wsi: 70 },
                        ]}>
                          <defs>
                            <linearGradient id="colorWsi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area type="monotone" dataKey="wsi" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWsi)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <TrendingDown size={20} className="text-red-500" />
                      Groundwater Depletion Velocity
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Block A', rate: -1.2 },
                          { name: 'Block B', rate: -0.8 },
                          { name: 'Block C', rate: -2.1 },
                          { name: 'Block D', rate: -1.5 },
                          { name: 'Block E', rate: -0.5 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Recent Alerts Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold">Critical Risk Villages</h3>
                    <button className="text-blue-600 text-sm font-bold hover:underline">View All Alerts</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                          <th className="px-6 py-4">Village Name</th>
                          <th className="px-6 py-4">District</th>
                          <th className="px-6 py-4">Water Stress Index</th>
                          <th className="px-6 py-4">Risk Level</th>
                          <th className="px-6 py-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {alerts.map((alert, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium">{alert.name}</td>
                            <td className="px-6 py-4 text-slate-500">{alert.district}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full",
                                      alert.risk_level === 'Red' ? "bg-red-500" : "bg-orange-500"
                                    )} 
                                    style={{ width: `${alert.water_stress_index}%` }} 
                                  />
                                </div>
                                <span className="text-sm font-bold">{alert.water_stress_index.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold",
                                alert.risk_level === 'Red' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                              )}>
                                {alert.risk_level}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-all">
                                Deploy Tanker
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-slate-200 shadow-lg relative"
              >
                {/* @ts-ignore */}
                <MapContainer center={[18.4088, 76.5604]} zoom={8} style={{ height: '100%', width: '100%' }}>
                  <MapController center={
                    villages.length > 0 
                      ? [villages[0].latitude, villages[0].longitude] 
                      : [18.4088, 76.5604]
                  } />
                  {/* @ts-ignore */}
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {villages.map(v => (
                    /* @ts-ignore */
                    <CircleMarker 
                      key={v.id}
                      center={[v.latitude, v.longitude]}
                      radius={10}
                      pathOptions={{
                        fillColor: v.risk_level === 'Red' ? '#ef4444' : v.risk_level === 'Orange' ? '#f97316' : '#10b981',
                        color: '#fff',
                        weight: 2,
                        fillOpacity: 0.8
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold text-lg mb-1">{v.name}</h4>
                          <p className="text-sm text-slate-500 mb-2">{v.district}, {v.state}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 p-2 rounded">
                              <p className="text-slate-400 uppercase font-bold">WSI</p>
                              <p className="font-bold text-blue-600">{v.water_stress_index.toFixed(1)}%</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <p className="text-slate-400 uppercase font-bold">Rainfall</p>
                              <p className="font-bold text-red-600">{v.rainfall_deviation}%</p>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                  {tankers.map(t => (
                    /* @ts-ignore */
                    <Marker 
                      key={t.id} 
                      position={[t.current_lat, t.current_lng]}
                      icon={new L.DivIcon({
                        className: 'custom-div-icon',
                        html: `<div class="bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-4.83-1.587A2 2 0 0 0 14 13.088V18"/><path d="M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg></div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                      })}
                    >
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-bold">{t.registration_no}</h4>
                          <p className="text-sm text-slate-500">Capacity: {t.capacity_liters}L</p>
                          <p className="text-sm font-bold text-blue-600 mt-1">{t.status}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                  {/* Simulated Path for active tanker */}
                  <Polyline 
                    positions={[
                      [18.4088, 76.5604],
                      [18.4288, 76.5804],
                      [18.4488, 76.6004],
                      [18.4688, 76.6204]
                    ]}
                    pathOptions={{ color: '#3b82f6', weight: 4, dashArray: '10, 10' }}
                  />
                </MapContainer>
                
                {/* Map Legend */}
                <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur p-4 rounded-xl shadow-xl z-[1000] border border-slate-200">
                  <h5 className="text-xs font-bold uppercase text-slate-400 mb-3">Risk Intensity</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">Critical (Red)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-orange-500" />
                      <span className="text-sm font-medium">Watch (Orange)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium">Safe (Green)</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tankers' && (
              <motion.div 
                key="tankers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Fleet Management</h3>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all">
                    <Truck size={18} />
                    Register New Tanker
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tankers.filter(t => (!selectedState || t.assigned_state === selectedState) && (!selectedDistrict || t.assigned_district === selectedDistrict)).map(t => (
                    <div key={t.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-50 p-3 rounded-xl">
                          <Truck className="text-blue-600" size={24} />
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          t.status === 'Available' ? "bg-emerald-100 text-emerald-700" : 
                          t.status === 'In Transit' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{t.registration_no}</h4>
                      <p className="text-slate-500 text-sm mb-1">Capacity: {t.capacity_liters.toLocaleString()} Liters</p>
                      <p className="text-slate-400 text-xs font-medium mb-4">Assigned: {t.assigned_block}, {t.assigned_district}</p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Current Load</span>
                          <span className="font-bold">{t.current_load_percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.current_load_percentage}%` }} />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setActiveTab('map'); }}
                          className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
                        >
                          Track Live
                        </button>
                        <button 
                          onClick={() => setSelectedTanker(t)}
                          className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Central Alert Center</h3>
                  <div className="flex gap-2">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Critical: {alerts.filter(a => a.type === 'Critical').length}</span>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Warning: {alerts.filter(a => a.type === 'Warning').length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {alerts.map(alert => (
                    <div key={alert.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-all cursor-pointer">
                      <div className={cn(
                        "p-4 rounded-xl",
                        alert.type === 'Critical' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                      )}>
                        <AlertTriangle size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-900">{alert.message}</h4>
                          <span className="text-xs text-slate-400 font-medium">{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-500">{alert.village_name ? `Village: ${alert.village_name}, ` : ''}District: {alert.district}</p>
                      </div>
                      <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
                        Take Action
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div 
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-bold">Operational Performance Report</h3>
                      <p className="text-sm text-slate-500">Daily Analytics Summary</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
                        <FileText size={16} />
                        Export CSV
                      </button>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2">
                        <FileText size={16} />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                      <p className="text-blue-600 text-xs font-bold uppercase mb-1">Total Delivered</p>
                      <p className="text-2xl font-bold text-slate-900">450,000 L</p>
                    </div>
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                      <p className="text-emerald-600 text-xs font-bold uppercase mb-1">Efficiency Score</p>
                      <p className="text-2xl font-bold text-slate-900">92.4%</p>
                    </div>
                    <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                      <p className="text-indigo-600 text-xs font-bold uppercase mb-1">Avg. Delivery Time</p>
                      <p className="text-2xl font-bold text-slate-900">42 Mins</p>
                    </div>
                  </div>

                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Mon', vol: 45000 },
                        { name: 'Tue', vol: 52000 },
                        { name: 'Wed', vol: 48000 },
                        { name: 'Thu', vol: 61000 },
                        { name: 'Fri', vol: 55000 },
                        { name: 'Sat', vol: 42000 },
                        { name: 'Sun', vol: 38000 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                        <Tooltip />
                        <Bar dataKey="vol" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}
            {activeTab === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                    <MessageSquare className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">JalSetu AI Assistant</h3>
                    <p className="text-xs text-slate-500 font-medium">Powered by Gemini 3.1 Pro • Decision Support System</p>
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto space-y-6">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        msg.role === 'ai' ? "bg-blue-100 text-blue-600" : "bg-slate-800 text-white"
                      )}>
                        {msg.role === 'ai' ? <Droplets size={20} /> : <Users size={20} />}
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl max-w-[80%] shadow-sm",
                        msg.role === 'ai' ? "bg-slate-100 rounded-tl-none text-slate-700" : "bg-blue-600 rounded-tr-none text-white"
                      )}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <Droplets className="text-blue-600 animate-bounce" size={20} />
                      </div>
                      <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    className="relative"
                  >
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about drought predictions, tanker status, or water policy..."
                      className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                    <button 
                      type="submit"
                      disabled={isTyping}
                      className="absolute right-3 top-3 bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                      <TrendingDown className="rotate-90" size={20} />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
