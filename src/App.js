import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';

import {
  Menu,
  X,
  Bell,
  Maximize2,
  User,
  Home,
  BarChart2,
  Settings,
  Package,
  Users,
  Building,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import AddAsset from './pages/AddAsset';
import AssetSettings from './pages/AssetSettings';
import EmployeeSettings from './pages/EmployeeSettings';
import DepartmentSettings from './pages/DepartmentSettings';
import LoginPage from './pages/LoginPage';

import CostCenterSettings from './pages/CostCenterSettings';
import AssetGroup from './pages/AssetGroup';
import PhysicalLocation from './pages/PhysicalLocation';
import AssetMainCategory from './pages/AssetMainCategory';
import AssetSubCategory from './pages/AssetSubCategory';
import AssetDescription from './pages/AssetDescription';
import Category from './pages/Category';
import AssetStatus from './pages/AssetStatus';
import SubDepartmentForm from './pages/subDepartment ';
import PhysicalLocationDetails from './pages/PhysicalLocationDetails';


function Layout({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();

  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openSettings, setOpenSettings] = useState(false); // Track if settings are open
  const [openAssetSettings, setOpenAssetSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // Dark mode state

  if (!token && location.pathname !== '/login') {
    window.location.href = '/login';
    return null;
  }


  const toggleCollapse = () => setCollapsed(!collapsed);

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Apply the dark mode globally
  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div
        className={`fixed z-40 inset-y-0 left-0 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative w-${collapsed ? '20' : '64'} flex flex-col`}
      >
        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {!collapsed && <span className="text-xl font-bold">Asset Manager</span>}
          <button
            onClick={toggleCollapse}
            className="md:inline-block hidden text-gray-600 hover:text-black"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-3 text-sm">
          <Link
            to="/asset"
            className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600 ${
              location.pathname === '/asset' ? 'font-semibold text-blue-600' : ''
            }`}
          >
            <Home size={20} />
            {!collapsed && <span>Asset</span>}
          </Link>

          {/* Reports */}
          <Link
            to="#"
            className={`flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
          >
            <BarChart2 size={20} />
            {!collapsed && <span>Reports</span>}
          </Link>

          {/* Settings */}
          <div>
            <button
              onClick={() => setOpenSettings(!openSettings)} // Toggling settings
              className={`flex items-center w-full gap-3 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
            >
              <Settings size={20} />
              {!collapsed && <span>Settings</span>}
              {!collapsed && (
                <span className="ml-auto">
                  {openSettings ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              )}
            </button>

            {/* Settings Submenu */}
            <div
              className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                openSettings ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div>
                <button
                  onClick={() => setOpenAssetSettings(!openAssetSettings)} // Toggle Asset Settings submenu
                  className={`flex items-center w-full gap-3 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600 mt-2`}
                >
                  <Package size={20} />
                  {!collapsed && <span>Asset Settings</span>}
                  {!collapsed && (
                    <span className="ml-auto">
                      {openAssetSettings ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  )}
                </button>

                {/* Asset Settings Submenu */}
                <div
                  className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                    openAssetSettings ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <Link
                    to="/settings/asset/department"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <Building size={18} />
                    {!collapsed && <span>Department</span>}
                  </Link>
                  <Link
                    to="/settings/asset/subdepartment"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <Building size={18} />
                    {!collapsed && <span>Sub-Department</span>}
                  </Link>
                
                
                  <Link
                    to="/settings/asset/cost-center"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <DollarSign size={18} />
                    {!collapsed && <span>Cost Center</span>}
                  </Link>
                  <Link
                    to="/settings/asset/category"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <DollarSign size={18} />
                    {!collapsed && <span>Category</span>}
                  </Link>
                  <Link
                    to="/settings/asset/asset-group"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <DollarSign size={18} />
                    {!collapsed && <span>Asset Group</span>}
                  </Link>
                  <Link
                    to="/settings/asset/physical-location"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <Home size={18} />
                    {!collapsed && <span>Physical Location</span>}
                  </Link>
                  <Link
                    to="/settings/asset/physical-location-detail"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <Home size={18} />
                    {!collapsed && <span>Physical Location-detail</span>}
                  </Link>
                  <Link
                    to="/settings/asset/main-category"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <Package size={18} />
                    {!collapsed && <span>Main Category</span>}
                  </Link>
                  <Link
                    to="/settings/asset/sub-category"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <Package size={18} />
                    {!collapsed && <span>Sub Category</span>}
                  </Link>
                  <Link
                    to="/settings/asset/description"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <BarChart2 size={18} />
                    {!collapsed && <span>Asset Description</span>}
                  </Link>
                  <Link
                    to="/settings/asset/status"
                    className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
                  >
                    <Settings size={18} />
                    {!collapsed && <span>Asset Status</span>}
                  </Link>
                </div>
              </div>

              {/* Employee Settings */}
              <Link
                to="/settings/employee"
                className={`flex items-center gap-3 mt-2 ${darkMode ? 'text-white' : 'text-gray-700'} hover:text-blue-600`}
              >
                <Users size={20} />
                {!collapsed && <span>Employee Settings</span>}
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <div className="flex flex-col flex-1 min-h-screen">
        <header className={`shadow-md p-4 flex justify-between items-center md:ml-0 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <button
              className={`text-gray-600 hover:text-black ${darkMode ? 'text-white' : ''}`}
              onClick={handleFullScreen}
            >
              <Maximize2 size={20} />
            </button>
            <button className={`text-gray-600 hover:text-black ${darkMode ? 'text-white' : ''}`}>
              <Bell size={20} />
            </button>
            <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center`}>
              <User size={18} className={darkMode ? 'text-white' : 'text-black'} />
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4">{children}</main>

        <footer className={`shadow-inner text-center text-sm p-3 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
          © 2025 Asset Manager. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function App() {
  const token = localStorage.getItem('token');
  return (
      <Router>
        <Routes>
          {/* Login route should be outside the Layout */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
  
          {/* Protected routes inside Layout */}
          {token && (
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/asset" element={<Dashboard />} />
                    <Route path="/add-asset" element={<AddAsset />} />
                    <Route path="/settings/asset" element={<AssetSettings />} />
                    <Route path="/settings/employee" element={<EmployeeSettings />} />
                    <Route path="/settings/asset/department" element={<DepartmentSettings />} />
                    <Route path="/settings/asset/subdepartment" element={<SubDepartmentForm />} />
                    <Route path="/settings/asset/cost-center" element={<CostCenterSettings />} />
                    <Route path="/settings/asset/category" element={<Category />} />
                    <Route path="/settings/asset/asset-group" element={<AssetGroup />} />
                    <Route path="/settings/asset/physical-location" element={<PhysicalLocation />} />
                    <Route path="/settings/asset/physical-location-detail" element={<PhysicalLocationDetails />} />
                    <Route path="/settings/asset/main-category" element={<AssetMainCategory />} />
                    <Route path="/settings/asset/sub-category" element={<AssetSubCategory />} />
                    <Route path="/settings/asset/description" element={<AssetDescription />} />
                    <Route path="/settings/asset/status" element={<AssetStatus />} />
                  </Routes>
                </Layout>
              }
            />
          )}
        </Routes>
      </Router>
    );
}

export default App;
