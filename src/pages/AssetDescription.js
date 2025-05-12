import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaBan,
  FaSearch,
} from "react-icons/fa";

const AssetDescriptionSettings = () => {
  const [descriptions, setDescriptions] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [descriptionName, setDescriptionName] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [status, setStatus] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchDescriptions();
    fetchSubCategories();
  }, []);

  const fetchDescriptions = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/descriptions/");
      const data = response.data.map((desc) => ({
        id: desc.asset_description_id,
        name: desc.asset_description,
        subCategoryId: desc.asset_sub_category,
        uniqueKey: desc.description_unique_key,
        status: desc.status,
      }));

      setDescriptions(data);
    } catch (error) {
      console.error("Error fetching descriptions:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/sub-categories/");
      setSubCategories(response.data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const handleSubmit = async () => {
    const payload = {
      asset_description: descriptionName,
      asset_sub_category: selectedSubCategory,
      status,
    };

    try {
      if (editingId) {
        await axios.put(`https://api.task-target.com/one/api/descriptions/${editingId}/`, payload);
        setSuccessMessage("Description updated successfully!");
      } else {
        await axios.post("https://api.task-target.com/one/api/descriptions/", payload);
        setSuccessMessage("Description created successfully!");
      }
      fetchDescriptions();
      resetForm();
    } catch (error) {
      console.error("Submit error:", error);
      setError("Failed to save description.");
    }
  };

  const resetForm = () => {
    setDescriptionName("");
    setSelectedSubCategory("");
    setStatus("A");
    setEditingId(null);
    setError("");
    setSuccessMessage("");
  };

  const handleEdit = (desc) => {
    setDescriptionName(desc.name);
    setSelectedSubCategory(desc.subCategoryId);
    setStatus(desc.status);
    setEditingId(desc.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/descriptions/${id}/`);
      setSuccessMessage("Description deleted successfully!");
      fetchDescriptions();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete description.");
    }
  };

  const filteredDescriptions = descriptions.filter((desc) => {
    const name = desc.name || "";
    const subCategoryName = subCategories.find((sub) => sub.asset_sub_category_id === desc.subCategoryId)?.asset_sub_category_name || "";
    
    const matchDescription = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubCategory = subCategoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? desc.status === statusFilter : true;

    return (matchDescription || matchSubCategory) && matchStatus;
  });

  return (
    <div className="p-6 space-y-8">
      {/* Layout: Two Columns */}
      <div className="flex gap-8">
        {/* Table Section */}
        <div className="flex-1">
          {/* Search and Filter */}
          <div className="flex gap-4 items-center mb-4">
            <div className="flex items-center gap-2">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by Description or Subcategory"
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

          {/* Scrollable Table */}
          <div className="overflow-y-auto max-h-[500px]">
            <table className="min-w-full table-auto border-collapse bg-white shadow-md rounded-lg">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="border p-2">Description</th>
                  <th className="border p-2">Sub Category</th>
                  <th className="border p-2">Unique Key</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDescriptions.map((desc) => {
                  const sub = subCategories.find((s) => s.asset_sub_category_id === desc.subCategoryId);
                  return (
                    <tr key={desc.id} className="hover:bg-gray-50">
                      <td className="border p-2">{desc.name}</td>
                      <td className="border p-2">{sub?.asset_sub_category_name || "N/A"}</td>
                      <td className="border p-2">{desc.uniqueKey}</td>
                      <td className="border p-2"><StatusBadge status={desc.status} /></td>
                      <td className="border p-2">
                        <div className="flex gap-2 justify-center">
                          <button className="text-blue-600" onClick={() => handleEdit(desc)}>
                            <FaEdit />
                          </button>
                          <button className="text-red-600" onClick={() => handleDelete(desc.id)}>
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 max-w-md">
          <div className="bg-white p-6 shadow-md rounded-lg">
            <h3 className="text-xl font-semibold mb-4">
              {editingId ? "Update" : "Create"} Asset Description
            </h3>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            {successMessage && <p className="text-green-600 mb-2">{successMessage}</p>}

            {/* Horizontal Form Layout */}
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Sub Category</label>
              <select
                className="w-full border p-2 rounded"
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
              >
                <option value="">Select Sub Category</option>
                {subCategories.map((sub) => (
                  <option key={sub.asset_sub_category_id} value={sub.asset_sub_category_id}>
                    {sub.asset_sub_category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Description Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded"
                value={descriptionName}
                onChange={(e) => setDescriptionName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select
                className="w-full border p-2 rounded"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="A">Active</option>
                <option value="I">Inactive</option>
                <option value="R">Retired</option>
              </select>
            </div>

            <button
              className={`w-full py-2 rounded text-white ${editingId ? "bg-blue-600" : "bg-green-600"} hover:opacity-90`}
              onClick={handleSubmit}
            >
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusMap = {
    A: { label: "Active", color: "green" },
    I: { label: "Inactive", color: "yellow" },
    R: { label: "Retired", color: "gray" },
  };

  const { label, color } = statusMap[status] || { label: "Unknown", color: "red" };

  return (
    <span
      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold bg-${color}-100 text-${color}-800`}
    >
      {label}
    </span>
  );
};

export default AssetDescriptionSettings;
