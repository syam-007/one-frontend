import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Upload } from 'lucide-react';
import { FaEdit, FaTrashAlt, FaUsers, FaCircle, FaCheckCircle, FaBan, FaSearch } from "react-icons/fa";

const CostCenterSettings = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [costCenterName, setCostCenterName] = useState('');
  const [costCenterStatus, setCostCenterStatus] = useState('A');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [editingCostCenterId, setEditingCostCenterId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [costCenterToDelete, setCostCenterToDelete] = useState(null);

  useEffect(() => {
    fetchCostCenters();
    fetchDepartments();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/cost-centers/");
      const data = response.data.map(cc => ({
        id: cc.cost_center_id,
        name: cc.cost_center_name,
        status:
          cc.status === "A" ? "Active" :
          cc.status === "I" ? "Inactive" :
          cc.status === "R" ? "Retired" : "Unknown",
        department: cc.department_name
      }));
      setCostCenters(data);
    } catch (error) {
      console.error("Error fetching cost centers:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/departments/");
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleSubmit = async () => {
    if (!costCenterName) {
      setError("Cost Center Name is required.");
      return;
    }

    if (!selectedDepartment) {
      setError("Department is required.");
      return;
    }

    const payload = {
      cost_center_name: costCenterName,
      status: costCenterStatus === 'Active' ? 'A' : costCenterStatus === 'Inactive' ? 'I' : 'R',
      department: selectedDepartment
    };

    try {
      if (editingCostCenterId) {
        await axios.put(`https://api.task-target.com/one/api/cost-centers/${editingCostCenterId}/`, payload);
        setSuccessMessage("Cost center updated successfully!");
      } else {
        const exists = costCenters.find(cc => cc.name.toLowerCase() === costCenterName.toLowerCase());
        if (exists) {
          setError("A cost center with this name already exists.");
          return;
        }

        await axios.post("https://api.task-target.com/one/api/cost-centers/", payload);
        setSuccessMessage("Cost center created successfully!");
      }

      fetchCostCenters();
      resetForm();
    } catch (error) {
      console.error("Submit error:", error);
      setError('Failed to save cost center.');
    }
  };

  const resetForm = () => {
    setCostCenterName('');
    setCostCenterStatus('A');
    setSelectedDepartment('');
    setEditingCostCenterId(null);
    setError('');
  };

  const handleEdit = (cc) => {
    setCostCenterName(cc.name);
    setCostCenterStatus(cc.status);
    setSelectedDepartment(cc.department);
    setEditingCostCenterId(cc.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/cost-centers/${id}/`);
      setSuccessMessage("Cost center deleted successfully!");
      fetchCostCenters();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete cost center.");
    }
  };

  const filteredCostCenters = costCenters.filter(cc => {
    const matchSearch = cc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? cc.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const total = costCenters.length;
  const active = costCenters.filter(cc => cc.status === 'Active').length;
  const inactive = costCenters.filter(cc => cc.status === 'Inactive').length;
  const retired = costCenters.filter(cc => cc.status === 'Retired').length;

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
            <h2 className="text-xl font-semibold">Cost Center Settings</h2>
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
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Cost Center</th>
                <th className="border p-2">Department</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCostCenters.map((cc) => (
                <tr key={cc.id} className="hover:bg-gray-50">
                  <td className="border p-2">{cc.name}</td>
                  <td className="border p-2">{cc.department}</td>
                  <td className="border p-2">{cc.status}</td>
                  <td className="border p-2">
                    <div className="flex gap-2 justify-center">
                      <button className="btn-icon blue" onClick={() => handleEdit(cc)}>
                        <FaEdit size={14} />
                      </button>
                      <button className="btn-icon red" onClick={() => {
                        setCostCenterToDelete(cc.id);
                        setShowDeleteModal(true);
                      }}>
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create / Update Form */}
        <div className="w-full lg:w-80 bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold mb-6">{editingCostCenterId ? 'Update' : 'Create'} Cost Center</h3>
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
          {successMessage && <div className="text-green-600 text-sm mb-4">{successMessage}</div>}

          <div className="mb-4">
            <label className="block text-sm font-semibold">Cost Center Name</label>
            <input
              type="text"
              className="w-full p-3 border rounded-md"
              value={costCenterName}
              onChange={(e) => setCostCenterName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold">Status</label>
            <select
              className="w-full p-3 border rounded-md"
              value={costCenterStatus}
              onChange={(e) => setCostCenterStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold">Department</label>
            <select
              className="w-full p-3 border rounded-md"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.department_name}</option>
              ))}
            </select>
          </div>

          <button
            className={`w-full text-white py-3 rounded-md ${editingCostCenterId ? 'bg-red-600' : 'bg-blue-600'} hover:opacity-90`}
            onClick={handleSubmit}
          >
            {editingCostCenterId ? 'Update' : 'Create'} Cost Center
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Delete Cost Center</h3>
            <p className="mb-4">Are you sure you want to delete this cost center?</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => {
                handleDelete(costCenterToDelete);
                setShowDeleteModal(false);
              }}>Delete</button>
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
      <h4 className="text-xs font-semibold">{label} Cost Centers</h4>
      <span className="text-lg font-bold">{value}</span>
    </div>
  </div>
);

export default CostCenterSettings;
