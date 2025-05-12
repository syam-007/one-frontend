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

const AssetSubCategorySettings = () => {
  const [subCategories, setSubCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subUniqueKey, setSubUniqueKey] = useState("");
  const [selectedMainCategory, setSelectedMainCategory] = useState("");
  const [subCategoryStatus, setSubCategoryStatus] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("A");
  const [editingSubCategoryId, setEditingSubCategoryId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchMainCategories();
    fetchSubCategories();
  }, []);

  const fetchMainCategories = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/main-categories/");
      setMainCategories(response.data);
    } catch (error) {
      console.error("Error fetching main categories:", error);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/sub-categories/");
      const rawData = response.data;

      const data = rawData.map((sub) => ({
        id: sub.asset_sub_category_id,
        name: sub.asset_sub_category_name,
        mainCategoryId: sub.asset_main_category,
        uniqueKey: sub.sub_unique_key,
        status: sub.status,
      }));

      setSubCategories(data);
    } catch (error) {
      console.error("Error fetching sub categories:", error);
    }
  };

  const handleSubmit = async () => {
    

    const payload = {
      asset_sub_category_name: subCategoryName,
      sub_unique_key: "",
      asset_main_category: selectedMainCategory,
      status: subCategoryStatus,
    };

    try {
      if (editingSubCategoryId) {
        payload.sub_unique_key = subUniqueKey;
        await axios.put(
          `https://api.task-target.com/one/api/sub-categories/${editingSubCategoryId}/`,
          payload
        );
        setSuccessMessage("Sub Category updated successfully!");
      } else {
        await axios.post("https://api.task-target.com/one/api/sub-categories/", payload);
        setSuccessMessage("Sub Category created successfully!");
      }

      fetchSubCategories();
      resetForm();
    } catch (error) {
      console.error("Submit error:", error);
      setError("Failed to save sub category");
    }
  };

  const resetForm = () => {
    setSubCategoryName("");
    setSubUniqueKey("");
    setSelectedMainCategory("");
    setSubCategoryStatus("A");
    setEditingSubCategoryId(null);
    setError("");
    setSuccessMessage("");
  };

  const handleEdit = (sub) => {
    setSubCategoryName(sub.name);
    setSubUniqueKey(sub.uniqueKey);
    setSelectedMainCategory(sub.mainCategoryId);
    setSubCategoryStatus(sub.status);
    setEditingSubCategoryId(sub.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/sub-categories/${id}/`);
      setSuccessMessage("Sub Category deleted successfully!");
      fetchSubCategories();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to delete sub category");
    }
  };

  const filteredSubCategories = subCategories.filter((sub) => {
    const matchSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? sub.status === statusFilter : true;
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
  
      const nameIndex = headers.indexOf("sub_category");
      const statusIndex = headers.indexOf("status");
      const mainCatIndex = headers.indexOf("main_category");
  
      if (nameIndex === -1 || statusIndex === -1 || mainCatIndex === -1) {
        setImportError("Invalid file format. Required columns: sub_category, main_category, status");
        return;
      }
  
      const formData = new FormData();
      formData.append("file", file); // Send the original file
  
      try {
        const response = await axios.post(
          "https://api.task-target.com/one/api/sub-categories/bulk-upload/",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
  
        const { inserted, duplicates_skipped, missing_main_categories } = response.data;
        setSuccessMessage(`Import completed. Inserted: ${inserted.length}`);
  
        if (duplicates_skipped.length || missing_main_categories.length) {
          let errors = "";
          if (duplicates_skipped.length)
            errors += `${duplicates_skipped.length} duplicates skipped.\n`;
          if (missing_main_categories.length)
            errors += `Missing main categories: ${missing_main_categories.join(", ")}`;
          setImportError(errors);
        }
      } catch (err) {
        console.error("Import error:", err);
        setImportError("Failed to import subcategories.");
      }
  
      setShowImportModal(false);
      fetchSubCategories();
    };
  
    reader.readAsArrayBuffer(file);
  };
  

  const total = subCategories.length;
  const active = subCategories.filter((c) => c.status === "A").length;
  const inactive = subCategories.filter((c) => c.status === "I").length;
  const retired = subCategories.filter((c) => c.status === "R").length;

  return (
    <div className="p-6 space-y-8">
      {/* Statistics Cards */}
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
            <h2 className="text-xl font-semibold">Asset Sub Categories</h2>
            
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between gap-4 p-4 bg-gray-50">
            <div className="flex items-center gap-2">
              <FaSearch />
              <input
                type="text"
                placeholder="Search"
                className="border p-2 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
            
            <div>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            </div>
          </div>


        <div className="overflow-y-auto max-h-[400px]">
          {/* Table */}
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Main Category</th>
                <th className="border p-2">Subcategory</th>
                <th className="border p-2">Unique Key</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubCategories.map((sub) => {
                const mainCategory = mainCategories.find(
                  (mc) => mc.asset_main_category_id === sub.mainCategoryId
                );
                return (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {mainCategory?.asset_main_category_name || "N/A"}
                    </td>
                    <td className="border p-2">{sub.name}</td>
                    <td className="border p-2 read-only-cell">{sub.uniqueKey}</td>
                    <td className="border p-2">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="border p-2">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleEdit(sub)}
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => {
                            setSubCategoryToDelete(sub.id);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaTrashAlt size={16} />
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
        <div className="w-full lg:w-80 bg-white p-6 shadow-md rounded-lg">
          <h3 className="text-xl font-semibold mb-6">
            {editingSubCategoryId ? "Update" : "Create"} Sub Category
          </h3>
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
          {successMessage && (
            <div className="text-green-600 text-sm mb-4">{successMessage}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Main Category
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedMainCategory}
              onChange={(e) => setSelectedMainCategory(e.target.value)}
              disabled={!!editingSubCategoryId}
            >
              <option value="">Select Main Category</option>
              {mainCategories.map((category) => (
                <option
                  key={category.asset_main_category_id}
                  value={category.asset_main_category_id}
                >
                  {category.asset_main_category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Subcategory Name
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={subCategoryName}
              onChange={(e) => setSubCategoryName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Unique Key
            </label>
            <input
              type="text"
              className={`w-full p-2 border rounded-md ${editingSubCategoryId ? 'bg-gray-200 cursor-not-allowed' : ''}`}
              value={subUniqueKey}
              onChange={(e) => setSubUniqueKey(e.target.value)}
              readOnly={!!editingSubCategoryId}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Status</label>
            <select
              className="w-full p-2 border rounded-md"
              value={subCategoryStatus}
              onChange={(e) => setSubCategoryStatus(e.target.value)}
            >
              <option value="A">Active</option>
              <option value="I">Inactive</option>
              <option value="R">Retired</option>
            </select>
          </div>

          <button
            className={`w-full py-2 px-4 rounded-md text-white ${
              editingSubCategoryId ? "bg-blue-600" : "bg-green-600"
            } hover:opacity-90`}
            onClick={handleSubmit}
          >
            {editingSubCategoryId ? "Update" : "Create"} Sub Category
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Import Sub Categories</h3>
            {importError && <div className="text-red-600 text-sm mb-3">{importError}</div>}
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleImport} 
              className="mb-4"
            />
            <p className="text-sm text-gray-600 mb-4">
              Excel format required columns: sub_category, sub_unique_key, status, main_category
            </p>
            <div className="flex justify-end">
              <button 
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowImportModal(false)}
              >
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
            <h3 className="text-lg font-semibold mb-4">Delete Sub Category</h3>
            <p className="mb-4">Are you sure you want to delete this sub category?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => {
                  handleDelete(subCategoryToDelete);
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

// Helper Components
const StatCard = ({ icon, label, value, color }) => (
  <div className={`bg-white shadow-md rounded-lg p-4 flex items-center justify-between`}>
    <div className={`text-${color}-600 text-2xl`}>{icon}</div>
    <div className="text-right">
      <h4 className="text-xs font-semibold text-gray-500">{label}</h4>
      <span className="text-xl font-bold">{value}</span>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusConfig = {
    A: { color: "green", label: "Active" },
    I: { color: "yellow", label: "Inactive" },
    R: { color: "gray", label: "Retired" },
  };

  const { color, label } = statusConfig[status] || {};

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}
    >
      {label}
    </span>
  );
};

export default AssetSubCategorySettings;