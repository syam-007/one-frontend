import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  FaEdit,
  FaTrashAlt,
  FaUsers,
  FaCircle,
  FaCheckCircle,
  FaBan,
  FaSearch,
} from "react-icons/fa";
import { Upload } from "lucide-react";

const PhysicalLocationSettings = () => {
  const [locations, setLocations] = useState([]);
  const [locationName, setLocationName] = useState("");
  const [locationStatus, setLocationStatus] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("A");
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/locations/");
      let rawData = response.data;
  
      // Make sure it's an array
      if (!Array.isArray(rawData)) {
        rawData = [rawData];
      }
  
      const data = rawData.map((location) => ({
        id: location.physical_location_id ,
        name: location.physical_location_name || "Unnamed",
        status: location.status || "A",
      }));
  
      setLocations(data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleSubmit = async () => {
    if (!locationName) {
      setError("Location Name is required.");
      return;
    }
  
    const payload = {
      physical_location_name: locationName,
      status: locationStatus,
    };
  
    try {
      if (editingLocationId) {
        await axios.put(
          `https://api.task-target.com/one/api/locations/${editingLocationId}/`,
          payload
        );
        setSuccessMessage("Location updated successfully!");
      } else {
        await axios.post("https://api.task-target.com/one/api/locations/", payload);
        setSuccessMessage("Location created successfully!");
      }
  
      fetchLocations();
      resetForm();
    } catch (error) {
      console.error("Submit error:", error);
      setError("Failed to save location.");
    }
  };
  

  const resetForm = () => {
    setLocationName("");
    setLocationStatus("A");
    setEditingLocationId(null);
    setError("");
    setSuccessMessage("");
  };

  const handleEdit = (loc) => {
    setLocationName(loc.name);
    setLocationStatus(loc.status);
    setEditingLocationId(loc.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/locations/${id}/`);
      setSuccessMessage("Location deleted successfully!");
      fetchLocations();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete location.");
    }
  };

  const filteredLocations = locations.filter((location) => {
    const matchSearch = location.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? location.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const [headerRow, ...dataRows] = rows;
  
      const headers = headerRow.map((h) => h.trim().toLowerCase());
      const nameIndex = headers.indexOf("location");
      const statusIndex = headers.indexOf("status");
  
      if (nameIndex === -1 || statusIndex === -1) {
        setImportError("Invalid file format. Required: physical_location_name, status");
        return;
      }
  
      let duplicates = 0;
  
      const promises = dataRows.map(async (row) => {
        const locationName = row[nameIndex]?.trim();
        const status = row[statusIndex]?.trim().toUpperCase() || "A";
  
        const exists = locations.some(
          (loc) => loc.name.toLowerCase() === locationName.toLowerCase()
        );
  
        if (!exists && locationName) {
          try {
            await axios.post("https://api.task-target.com/one/api/locations/", {
              physical_location_name: locationName,
              status,
            });
          } catch (err) {
            console.error("Import error:", err);
          }
        } else {
          duplicates++;
        }
      });
  
      await Promise.all(promises);
      setShowImportModal(false);
      setSuccessMessage("Import completed.");
      if (duplicates > 0) {
        setImportError(`${duplicates} duplicate entries were skipped.`);
      }
  
      fetchLocations(); // Refresh list
    };
  
    reader.readAsArrayBuffer(file);
  };
  

  const total = locations.length;
  const active = locations.filter((l) => l.status === "A").length;
  const inactive = locations.filter((l) => l.status === "I").length;
  const retired = locations.filter((l) => l.status === "R").length;

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FaUsers />} label="Total" value={total} color="blue" />
        <StatCard icon={<FaCheckCircle />} label="Active" value={active} color="green" />
        <StatCard icon={<FaBan />} label="Inactive" value={inactive} color="yellow" />
        <StatCard icon={<FaCircle />} label="Retired" value={retired} color="gray" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-white shadow-md rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold">Physical Locations</h2>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50">
            <div className="flex items-center gap-2">
              <FaSearch />
              <input
                type="text"
                placeholder="Search"
                className="border p-2 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="border p-2 rounded-md"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="A">Active</option>
              <option value="I">Inactive</option>
              <option value="R">Retired</option>
            </select>
          </div>

          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="border p-2">{loc.name}</td>
                  <td className="border p-2">{loc.status === "A" ? "Active" : loc.status === "I" ? "Inactive" : loc.status === "R" ? "Retired" : "Unknown"}</td>
                  <td className="border p-2">
                    <div className="flex gap-2 justify-center">
                      <button className="btn-icon blue" onClick={() => handleEdit(loc)}>
                        <FaEdit size={14} />
                      </button>
                      <button
                        className="btn-icon red"
                        onClick={() => {
                          setLocationToDelete(loc.id);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-full lg:w-80 bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold mb-6">{editingLocationId ? "Update" : "Create"} Location</h3>
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
          {successMessage && <div className="text-green-600 text-sm mb-4">{successMessage}</div>}

          <div className="mb-4">
            <label className="block text-sm font-semibold">Location Name</label>
            <input
              type="text"
              className="w-full p-3 border rounded-md"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Status</label>
            <select
              className="w-full p-3 border rounded-md"
              value={locationStatus}
              onChange={(e) => setLocationStatus(e.target.value)}
            >
              <option value="A">Active</option>
              <option value="I">Inactive</option>
              <option value="R">Retired</option>
            </select>
          </div>
          <button
            className={`w-full text-white py-3 rounded-md ${editingLocationId ? "bg-red-600" : "bg-blue-600"} hover:opacity-90`}
            onClick={handleSubmit}
          >
            {editingLocationId ? "Update" : "Create"} Location
          </button>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Import Locations</h3>
            {importError && <div className="text-red-600 text-sm mb-3">{importError}</div>}
            <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="mb-4" />
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Delete Location</h3>
            <p className="mb-4">Are you sure you want to delete this location?</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => {
                  handleDelete(locationToDelete);
                  setShowDeleteModal(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white shadow-md rounded-lg p-4 flex items-center justify-between`}>
    <div className={`text-${color}-600`}>{icon}</div>
    <div>
      <h4 className="text-xs font-semibold">{label} Locations</h4>
      <span className="text-lg font-bold">{value}</span>
    </div>
  </div>
);

export default PhysicalLocationSettings;