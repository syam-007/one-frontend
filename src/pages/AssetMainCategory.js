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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AssetMainCategorySettings = () => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [uniqueKey, setUniqueKey] = useState("");
  const [categoryStatus, setCategoryStatus] = useState("A");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("A");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/main-categories/");
      let rawData = response.data;

      if (!Array.isArray(rawData)) rawData = [rawData];

      const data = rawData.map((category) => ({
        id: category.asset_main_category_id,
        name: category.asset_main_category_name || "Unnamed",
        uniqueKey: category.main_unique_key,
        status: category.status || "A",
      }));

      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async () => {
    if (!categoryName) {
      setError("Category Name is required.");
      return;
    }

    const payload = {
      asset_main_category_name: categoryName,
      main_unique_key: uniqueKey,
      status: categoryStatus,
    };

    try {
      if (editingCategoryId) {
        await axios.put(
          `https://api.task-target.com/one/api/main-categories/${editingCategoryId}/`,
          payload
        );
        toast.success("Category updated successfully!");
      } else {
        await axios.post("https://api.task-target.com/one/api/main-categories/", payload);
        toast.success("Category created successfully!");
      }

      fetchCategories();
      resetForm();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save category.");
    }
  };

  const resetForm = () => {
    setCategoryName("");
    setUniqueKey("");
    setCategoryStatus("A");
    setEditingCategoryId(null);
    setError("");
    setSuccessMessage("");
  };

  const handleEdit = (cat) => {
    setCategoryName(cat.name);
    setUniqueKey(cat.uniqueKey);
    setCategoryStatus(cat.status);
    setEditingCategoryId(cat.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/main-categories/${id}/`);
      toast.warning("Category deleted successfully!");
      fetchCategories();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete category.");
    }
  };

  const filteredCategories = categories.filter((category) => {
    const matchSearch = category.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? category.status === statusFilter : true;
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
      const nameIndex = headers.indexOf("asset_main_category");
      const statusIndex = headers.indexOf("status");

      if (nameIndex === -1 || statusIndex === -1) {
        setImportError("Invalid file format. Required: asset_main_category, status");
        return;
      }

      let duplicates = 0;

      const promises = dataRows.map(async (row) => {
        const categoryName = row[nameIndex]?.trim();
        const status = row[statusIndex]?.trim().toUpperCase() || "A";

        const exists = categories.some(
          (cat) => cat.name.toLowerCase() === categoryName?.toLowerCase()
        );

        if (!exists && categoryName) {
          try {
            await axios.post("https://api.task-target.com/one/api/main-categories/", {
              asset_main_category_name: categoryName,
              status,
            });
          } catch (err) {
            console.error("Import error:", err.response?.data || err.message);
          }
        } else {
          duplicates++;
        }
      });

      await Promise.all(promises);
      setShowImportModal(false);
      toast.success("Import completed.");
      if (duplicates > 0) {
        toast.warn(`${duplicates} duplicate entries were skipped.`);
      }

      fetchCategories();
    };

    reader.readAsArrayBuffer(file);
  };

  const total = categories.length;
  const active = categories.filter((c) => c.status === "A").length;
  const inactive = categories.filter((c) => c.status === "I").length;
  const retired = categories.filter((c) => c.status === "R").length;

  return (
    <div className="p-6 space-y-8">
      <ToastContainer position="bottom-right" autoClose={2000} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<FaUsers />} label="Total" value={total} color="blue" />
        <StatCard icon={<FaCheckCircle />} label="Active" value={active} color="green" />
        <StatCard icon={<FaBan />} label="Inactive" value={inactive} color="yellow" />
        <StatCard icon={<FaCircle />} label="Retired" value={retired} color="gray" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 bg-white shadow-md rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-semibold">Asset Main Categories</h2>
          </div>

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

          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Main Category</th>
                <th className="border p-2">Unique Key</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="border p-2">{cat.name}</td>
                  <td className="border p-2">{cat.uniqueKey}</td>
                  <td className="border p-2">
                    {cat.status === "A" ? "Active" : cat.status === "I" ? "Inactive" : "Retired"}
                  </td>
                  <td className="border p-2">
                    <div className="flex gap-2 justify-center">
                      <button className="btn-icon blue" onClick={() => handleEdit(cat)}>
                        <FaEdit size={14} />
                      </button>
                      <button
                        className="btn-icon red"
                        onClick={() => {
                          setCategoryToDelete(cat.id);
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
          <h3 className="text-xl font-semibold mb-6">{editingCategoryId ? "Update" : "Create"} Category</h3>
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

          <div className="mb-4">
            <label className="block text-sm font-semibold">Category Name</label>
            <input
              type="text"
              className="w-full p-3 border rounded-md"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
          </div>

          {editingCategoryId && (
            <div className="mb-4">
              <label className="block text-sm font-semibold">Unique Key</label>
              <input
                type="text"
                className="w-full p-3 border rounded-md bg-gray-100"
                value={uniqueKey}
                readOnly
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold">Status</label>
            <select
              className="w-full p-3 border rounded-md"
              value={categoryStatus}
              onChange={(e) => setCategoryStatus(e.target.value)}
            >
              <option value="A">Active</option>
              <option value="I">Inactive</option>
              <option value="R">Retired</option>
            </select>
          </div>

          <button
            className={`w-full text-white py-3 rounded-md ${
              editingCategoryId ? "bg-red-600" : "bg-blue-600"
            } hover:opacity-90`}
            onClick={handleSubmit}
          >
            {editingCategoryId ? "Update" : "Create"} Category
          </button>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Import Categories</h3>
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
            <h3 className="text-lg font-semibold mb-4">Delete Category</h3>
            <p className="mb-4">Are you sure you want to delete this category?</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => {
                  handleDelete(categoryToDelete);
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
      <h4 className="text-xs font-semibold">{label} Categories</h4>
      <span className="text-lg font-bold">{value}</span>
    </div>
  </div>
);

export default AssetMainCategorySettings;
