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

const AssetGroupSettings = () => {
  const [assetGroups, setAssetGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupStatus, setGroupStatus] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("A");
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  useEffect(() => {
    fetchAssetGroups();
  }, []);

  const fetchAssetGroups = async () => {
    try {
      const response = await axios.get(
        "https://api.task-target.com/one/api/group-masters/"
      );
      const data = response.data.map((group) => ({
        id: group.asset_group_id,
        name: group.asset_group_name,
        status: group.status,
      }));
      setAssetGroups(data);
    } catch (error) {
      console.error("Error fetching asset groups:", error);
    }
  };

  const handleSubmit = async () => {
    if (!groupName) {
      setError("Asset Group Name is required.");
      return;
    }

    const payload = {
      asset_group_name: groupName,
      status: groupStatus,
    };

    try {
      if (editingGroupId) {
        await axios.put(
          `https://api.task-target.com/one/api/group-masters/${editingGroupId}/`,
          payload
        );
        setSuccessMessage("Asset group updated successfully!");
      } else {
        const exists = assetGroups.find(
          (g) => g.name.toLowerCase() === groupName.toLowerCase()
        );
        if (exists) {
          setError("An asset group with this name already exists.");
          return;
        }

        await axios.post("https://api.task-target.com/one/api/group-masters/", payload);
        setSuccessMessage("Asset group created successfully!");
      }

      fetchAssetGroups();
      resetForm();
    } catch (error) {
      console.error("Submit error:", error);
      setError("Failed to save asset group.");
    }
  };

  const resetForm = () => {
    setGroupName("");
    setGroupStatus("A");
    setEditingGroupId(null);
    setError("");
    setSuccessMessage("");
  };

  const handleEdit = (group) => {
    setGroupName(group.name);
    setGroupStatus(group.status);
    setEditingGroupId(group.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/group-masters/${id}/`);
      setSuccessMessage("Asset group deleted successfully!");
      fetchAssetGroups();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete asset group.");
    }
  };

  const filteredGroups = assetGroups.filter((group) => {
    const matchSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? group.status === statusFilter : true;
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
      const nameIndex = headers.indexOf("asset_group_name");
      const statusIndex = headers.indexOf("status");

      if (nameIndex === -1 || statusIndex === -1) {
        setImportError("Invalid file format. Required: asset_group_name, status");
        return;
      }

      let duplicates = 0;
      const promises = dataRows.map(async (row) => {
        const groupName = row[nameIndex]?.trim();
        const status = row[statusIndex]?.trim().toUpperCase() || "A";

        const exists = assetGroups.some(
          (group) => group.name.toLowerCase() === groupName.toLowerCase()
        );

        if (!exists && groupName) {
          try {
            await axios.post("https://api.task-target.com/one/api/group-masters/", {
              asset_group_name: groupName,
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
      fetchAssetGroups();
    };

    reader.readAsArrayBuffer(file);
  };

  const total = assetGroups.length;
  const active = assetGroups.filter((g) => g.status === "A").length;
  const inactive = assetGroups.filter((g) => g.status === "I").length;
  const retired = assetGroups.filter((g) => g.status === "R").length;

  return (
    <div className="p-6 space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FaUsers />} label="Total" value={total} color="blue" />
        <StatCard icon={<FaCheckCircle />} label="Active" value={active} color="green" />
        <StatCard icon={<FaBan />} label="Inactive" value={inactive} color="yellow" />
        <StatCard icon={<FaCircle />} label="Retired" value={retired} color="gray" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Table Section */}
        <div className="flex-1 bg-white shadow-md rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold">Asset Group Settings</h2>
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
              {filteredGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="border p-2">{group.name}</td>
                  <td className="border p-2"> {group.status === "A"
                          ? "Active"
                          : group.status === "I"
                          ? "Inactive"
                          : group.status === "R"
                          ? "Retired"
                          : "Unknown"}</td>
                  <td className="border p-2">
                    <div className="flex gap-2 justify-center">
                      <button className="btn-icon blue" onClick={() => handleEdit(group)}>
                        <FaEdit size={14} />
                      </button>
                      <button
                        className="btn-icon red"
                        onClick={() => {
                          setGroupToDelete(group.id);
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

        {/* Form Section */}
        <div className="w-full lg:w-80 bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold mb-6">
            {editingGroupId ? "Update" : "Create"} Asset Group
          </h3>
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
          {successMessage && <div className="text-green-600 text-sm mb-4">{successMessage}</div>}

          <div className="mb-4">
            <label className="block text-sm font-semibold">Asset Group Name</label>
            <input
              type="text"
              className="w-full p-3 border rounded-md"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold">Status</label>
            <select
              className="w-full p-3 border rounded-md"
              value={groupStatus}
              onChange={(e) => setGroupStatus(e.target.value)}
            >
              <option value="A">Active</option>
              <option value="I">Inactive</option>
              <option value="R">Retired</option>
            </select>
          </div>
          <button
            className={`w-full text-white py-3 rounded-md ${
              editingGroupId ? "bg-red-600" : "bg-blue-600"
            } hover:opacity-90`}
            onClick={handleSubmit}
          >
            {editingGroupId ? "Update" : "Create"} Asset Group
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Import Asset Groups</h3>
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

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Delete Asset Group</h3>
            <p className="mb-4">Are you sure you want to delete this asset group?</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => {
                  handleDelete(groupToDelete);
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
      <h4 className="text-xs font-semibold">{label} Groups</h4>
      <span className="text-lg font-bold">{value}</span>
    </div>
  </div>
);

export default AssetGroupSettings;
