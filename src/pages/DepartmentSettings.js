import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Upload } from 'lucide-react';
import { FaEdit, FaTrashAlt, FaUsers, FaCircle, FaCheckCircle, FaBan, FaSearch } from "react-icons/fa";

const DepartmentSettings = () => {
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentStatus, setDepartmentStatus] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [editingDepartmentId, setEditingDepartmentId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/departments/");
      const data = response.data.map(dept => ({
        id: dept.department_id,
        name: dept.department_name,
        cost_center: dept.cost_center,
        status: dept.status === 'A' ? 'Active' : dept.status === 'I' ? 'Inactive' : 'Retired'
      }));
      setDepartments(data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleDepartmentSubmit = async () => {
    if (!departmentName) {
      setError("Department Name is required.");
      return;
    }

    const payload = {
      department_name: departmentName,
      status: departmentStatus === 'Active' ? 'A' : departmentStatus === 'Inactive' ? 'I' : 'R',
    };

    try {
      if (editingDepartmentId) {
        await axios.put(`https://api.task-target.com/one/api/departments/${editingDepartmentId}/`, payload);
        setSuccessMessage("Department updated successfully!");
      } else {
        const exists = departments.some(
          dept => dept.name.toLowerCase() === departmentName.toLowerCase()
        );
        if (exists) {
          setError("A department with this name already exists.");
          return;
        }
        await axios.post("https://api.task-target.com/one/api/departments/", payload);
        setSuccessMessage("Department created successfully!");
      }

      fetchDepartments();
      resetForm();
    } catch (error) {
      console.error("Error submitting department:", error.response?.data || error.message);
      setError(
        error.response?.data?.department_name?.[0] || 'Failed to submit department. Please try again.'
      );
      setSuccessMessage('');
    }
  };

  const resetForm = () => {
    setDepartmentName('');
    setDepartmentStatus('Active');
    setEditingDepartmentId(null);
    setError('');
  };

  const handleEditDepartment = (dept) => {
    setDepartmentName(dept.name);
    setDepartmentStatus(dept.status);
    setEditingDepartmentId(dept.id);
  };

  const handleDeleteDepartment = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/departments/${id}/`);
      setSuccessMessage("Department deleted successfully!");
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      setError("Failed to delete department. Please try again.");
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const matchSearch = dept.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? dept.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (!rows.length || !rows[0].department_name || !rows[0].status) {
        setImportError("Invalid file format. Required columns: department_name and status.");
        return;
      }

      setImportError('');
      setShowImportModal(false);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let statusCode = row.status;

        if (!['A', 'I', 'R'].includes(statusCode)) {
          setImportError(`Invalid status "${row.status}" in row ${i + 2}. Use A, I, or R.`);
          return;
        }

        const importPayload = {
          department_name: row.department_name,
          status: statusCode,
        };

        try {
          await axios.post("https://api.task-target.com/one/api/departments/", importPayload);
        } catch (err) {
          console.error("Import error in row:", row, err);
        }
      }

      fetchDepartments();
      setSuccessMessage("Departments imported successfully.");
    };

    reader.readAsArrayBuffer(file);
  };

  const total = departments.length;
  const active = departments.filter(d => d.status === 'Active').length;
  const inactive = departments.filter(d => d.status === 'Inactive').length;
  const retired = departments.filter(d => d.status === 'Retired').length;

  return (
    <div className="p-6 space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FaUsers />} title="Total Departments" count={total} color="text-blue-600" />
        <StatCard icon={<FaCheckCircle />} title="Active" count={active} color="text-green-600" />
        <StatCard icon={<FaBan />} title="Inactive" count={inactive} color="text-yellow-600" />
        <StatCard icon={<FaCircle />} title="Retired" count={retired} color="text-gray-600" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Department List and Search */}
        <div className="flex-1 bg-white shadow-md rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold">Department Settings</h2>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 text-sm"
            >
              <Upload size={18} /> Import
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50">
            <div className="flex items-center gap-2">
              <FaSearch />
              <input
                type="text"
                className="p-2 border rounded-md w-48"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="p-2 border rounded-md w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full table-auto border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="border p-2 text-left text-sm bg-gray-100">Name</th>
                  <th className="border p-2 text-left text-sm bg-gray-100">Cost Center</th>
                  <th className="border p-2 text-left text-sm bg-gray-100">Status</th>
                  <th className="border p-2 text-left text-sm bg-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDepartments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="border p-2">{dept.name}</td>
                    <td className="border p-2">{dept.cost_center || '-'}</td>
                    <td className="border p-2">{dept.status}</td>
                    <td className="border p-2">
                      <div className="flex gap-2">
                        <IconButton
                          icon={<FaEdit size={14} />}
                          color="blue"
                          onClick={() => handleEditDepartment(dept)}
                        />
                        <IconButton
                          icon={<FaTrashAlt size={14} />}
                          color="red"
                          onClick={() => {
                            setDepartmentToDelete(dept.id);
                            setShowDeleteModal(true);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Form */}
        <div className="w-full lg:w-80 bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold mb-6">{editingDepartmentId ? 'Update' : 'Create'} Department</h3>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          {successMessage && <p className="text-green-600 text-sm mb-2">{successMessage}</p>}
          <input
            className="w-full p-3 border rounded-md mb-4"
            type="text"
            placeholder="Department Name"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
          />
          <select
            className="w-full p-3 border rounded-md mb-4"
            value={departmentStatus}
            onChange={(e) => setDepartmentStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Retired">Retired</option>
          </select>
          <button
            className={`w-full py-3 rounded-md text-white ${
              editingDepartmentId ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleDepartmentSubmit}
          >
            {editingDepartmentId ? 'Update Department' : 'Create Department'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          title="Delete Department"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            handleDeleteDepartment(departmentToDelete);
            setShowDeleteModal(false);
          }}
        >
          Are you sure you want to delete this department?
        </Modal>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <Modal
          title="Import Departments"
          onCancel={() => {
            setShowImportModal(false);
            setImportError('');
          }}
        >
          {importError && <div className="text-red-600 mb-2">{importError}</div>}
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        </Modal>
      )}
    </div>
  );
};

// Helper components
const StatCard = ({ icon, title, count, color }) => (
  <div className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between">
    <div className={`text-2xl ${color}`}>{icon}</div>
    <div>
      <h4 className="text-xs font-semibold">{title}</h4>
      <span className="text-lg font-bold">{count}</span>
    </div>
  </div>
);

const IconButton = ({ icon, color, onClick }) => (
  <button
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center bg-${color}-100 hover:bg-${color}-600 text-${color}-600 hover:text-white rounded-full transition`}
  >
    {icon}
  </button>
);

const Modal = ({ title, children, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="mb-4">{children}</div>
      <div className="flex justify-end gap-3">
        <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={onCancel}>
          Cancel
        </button>
        {onConfirm && (
          <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={onConfirm}>
            Confirm
          </button>
        )}
      </div>
    </div>
  </div>
);

export default DepartmentSettings;
