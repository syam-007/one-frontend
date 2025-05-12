import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { saveAs } from "file-saver";
import axios from "axios";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ContentLoader from "react-content-loader";
import { PencilIcon, TrashIcon, CogIcon } from "@heroicons/react/solid";
const Dashboard = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });
  const [duplicates, setDuplicates] = useState([]);
  const fileInputRef = useRef(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);
  const [assetHistory, setAssetHistory] = useState([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false); // State to control modal visibility

  const [editFormData, setEditFormData] = useState({
    serial_no: "",
    part_number: "",
    mfg_serial: "",
    manufacturer: "",
    comments: "",
    status: "",
  });
  useEffect(() => {
    fetchAssets();
    fetchStatuses();
  }, []);
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://api.task-target.com/one/api/assets/");
      setAssets(response.data);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchStatuses = async () => {
    try {
      const response = await axios.get(
        "https://api.task-target.com/one/api/statuses/"
      );
      setStatuses(response.data); // Set the statuses in the state
    } catch (error) {
      console.error("Failed to fetch statuses:", error);
    }
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  const sortedAssets = [...assets].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key])
      return sortConfig.direction === "asc" ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key])
      return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
  const filteredAssets = sortedAssets.filter((asset) => {
    const matchesSearch = Object.values(asset)
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter
      ? asset.status_name === statusFilter
      : true;
    return matchesSearch && matchesStatus;
  });
  const uniqueStatuses = [...new Set(assets.map((asset) => asset.status_name))];
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(assets);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
    XLSX.writeFile(workbook, "assets.xlsx");
  };
  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(assets);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "assets.csv");
  };
  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "Cost Center",
      "Department",
      "Group",
      "Location",
      "Main Category",
      "Sub Category",
      "Description",
      "Status",
    ];
    const tableRows = assets.map((a) => [
      a.cost_center,
      a.department_name,
      a.asset_group_name,
      a.physical_location_name,
      a.main_category_name,
      a.sub_category_name,
      a.asset_description,
      a.status,
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
    });
    doc.save("assets.pdf");
  };
  const handleImportClick = () => fileInputRef.current.click();
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await axios.post(
        "https://api.task-target.com/one/api/assets/bulk-upload/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      alert(
        `Upload complete. Inserted: ${response.data.inserted_count}, Skipped: ${response.data.skipped_count}`
      );
      setDuplicates(response.data.duplicates || []);
      fetchAssets();
    } catch (error) {
      alert("Error uploading file");
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      event.target.value = null;
    }
  };
  const openDeleteModal = (asset) => {
    setAssetToDelete(asset);
    setDeleteModalVisible(true);
  };
  const closeDeleteModal = () => {
    setAssetToDelete(null);
    setDeleteModalVisible(false);
  };
  const confirmDelete = async () => {
    try {
      await axios.delete(
        `https://api.task-target.com/one/api/assets/${assetToDelete.asset_id}/`
      );
      toast.success("Asset deleted successfully");
      fetchAssets();
    } catch (error) {
      toast.error("Failed to delete asset");
    } finally {
      closeDeleteModal();
    }
  };
  const fetchAssetHistory = async (assetId) => {
    try {
      const response = await axios.get(
        `https://api.task-target.com/one/asset-history/${assetId}/`
      );
      const data = response.data;
      setAssetHistory(data);
      setHistoryModalVisible(true); // Open the modal after fetching history
    } catch (error) {
      console.error("Failed to fetch asset history:", error);
    }
  };
  const handleSave = () => {
    setEditModalVisible(false);
    setTimeout(() => {
      // After the modal has collapsed, you can trigger whatever logic you want
      console.log("Save operation completed");
    }, 500); // Duration should match the animation time
  };
  const openEditModal = (asset) => {
    const matchedStatus = statuses.find(
      (s) => s.asset_status_code === asset.status_name
    );
    setAssetToEdit(asset);
    setEditFormData({
      serial_no: asset.serial_no || "",
      part_number: asset.part_number || "",
      mfg_serial: asset.mfg_serial || "",
      manufacturer: asset.manufacturer || "",
      comments: asset.comments || "",
      status: matchedStatus?.asset_status_id || "",
    });
    setEditModalVisible(true);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSubmit = async () => {
    try {
      await axios.patch(
        `https://api.task-target.com/one/api/assets/${assetToEdit.asset_id}/`,
        editFormData
      );
      toast.success("Asset updated successfully");
      fetchAssets();
      setEditModalVisible(false);
    } catch (error) {
      toast.error("Failed to update asset");
      console.error(error.response?.data || error);
    }
  };
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredAssets.map((asset) => asset.asset_id);
      setSelectedAssets(allIds);
    } else {
      setSelectedAssets([]);
    }
  };
  const toggleSelectAsset = (assetId) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };
  const isAllSelected =
    filteredAssets.length > 0 &&
    selectedAssets.length === filteredAssets.length;
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Asset Management</h1>
      </header>
      {/* Actions */}
      <div className="bg-white rounded shadow p-4">
        {/* Search, Filter, Export */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg w-full sm:w-60 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map((status, idx) => (
                <option key={idx} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          {/* Buttons Section */}
          <div className="flex flex-wrap gap-2 justify-start md:justify-end relative">
            {/* Retire Selected Button */}
            {selectedAssets.length > 0 && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm"
                onClick={async () => {
                  try {
                    await axios.post(
                      "https://api.task-target.com/one/api/assets/bulk-retire/",
                      {
                        asset_ids: selectedAssets,
                      }
                    );
                    toast.success("Selected assets marked as retired.");
                    setSelectedAssets([]); // Clear selected assets
                    fetchAssets(); // Fetch updated list of assets
                  } catch (error) {
                    toast.error("Failed to retire selected assets");
                    console.error(error);
                  }
                }}
              >
                Delete Selected
              </button>
            )}
            {/* Import Button */}
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm"
              onClick={handleImportClick}
              disabled={uploading}
            >
              <Upload size={18} />
              {uploading ? "Uploading..." : "Import"}
            </button>
            <input
              type="file"
              accept=".xlsx, .xls"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            {/* Export Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm">
                <Download size={18} />
                Export
                <ChevronDown size={16} />
              </button>
              <div className="absolute right-0 z-10 mt-2 bg-white border rounded shadow w-40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition duration-300">
                <button
                  onClick={exportToExcel}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  Export as Excel
                </button>
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  Export as CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm"
                >
                  Export as PDF
                </button>
              </div>
            </div>
            {/* Add New Asset Button */}
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm"
              onClick={() => navigate("/add-asset")}
            >
              + Add New Asset
            </button>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="text-gray-500 border-b sticky top-0 bg-white z-10">
              <tr>
                <th className="py-2 px-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                {[
                  ["asset_code", "Asset Code"],
                  ["main_category_name", "Main Category"],
                  ["sub_category_name", "Sub Category"],
                  ["description_text", "Description"],
                  ["department_name", "Department"],
                  ["cost_center", "Cost Center"],
                  ["location_name", "Location"],
                  ["status_name", "Status"],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="py-2 cursor-pointer hover:underline"
                  >
                    {label}{" "}
                    {sortConfig.key === key
                      ? sortConfig.direction === "asc"
                        ? "▲"
                        : "▼"
                      : ""}
                  </th>
                ))}
                <th className="py-2 px-2 w-[120px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(15)
                    .fill()
                    .map((_, idx) => (
                      <tr key={idx} className="border-b">
                        {Array(8)
                          .fill()
                          .map((_, i) => (
                            <td key={i} className="py-2">
                              <ContentLoader width={100} height={15}>
                                <rect width="100%" height="100%" />
                              </ContentLoader>
                            </td>
                          ))}
                        <td className="px-2 w-[120px]">
                          <ContentLoader width={50} height={15}>
                            <rect width="100%" height="100%" />
                          </ContentLoader>
                        </td>
                      </tr>
                    ))
                : filteredAssets.map((asset, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.asset_id)}
                          onChange={() => toggleSelectAsset(asset.asset_id)}
                        />
                      </td>
                      <td>{asset.asset_code}</td>
                      <td>{asset.main_category_name}</td>
                      <td>{asset.sub_category_name}</td>
                      <td>{asset.description_text}</td>
                      <td>{asset.department_name}</td>
                      <td>{asset.cost_center}</td>
                      <td>{asset.location_name}</td>
                      <td>{asset.status_name}</td>
                      <td className="px-3 w-[120px] flex justify-evenly">
                        <button
                          onClick={() => openEditModal(asset)}
                          className="text-blue-600 hover:underline text-sm flex items-center"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(asset)}
                          className="text-red-600 hover:underline text-sm flex items-center"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        {/* Add a third button for the "set" action */}
                        <button
                          onClick={() => fetchAssetHistory(asset.asset_id)}
                          className="text-green-600 hover:underline text-sm flex items-center"
                        >
                          <CogIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {duplicates.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-300 p-4 rounded">
            <h2 className="text-red-700 font-semibold mb-2">
              Duplicate Entries Skipped:
            </h2>
            <ul className="text-sm text-red-600 list-disc list-inside">
              {duplicates.map((dup, idx) => (
                <li key={idx}>{JSON.stringify(dup)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {deleteModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h3 className="text-lg font-semibold mb-4">Delete Asset</h3>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete asset{" "}
              <strong>{assetToDelete?.asset_code}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {historyModalVisible && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"   style={{ animation: "fadeIn 0.3s ease-in-out" }}>
    <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-4xl max-h-[80%] overflow-hidden animate-fadeIn">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-2xl font-bold text-gray-800">Asset History</h3>
        <button
          onClick={() => setHistoryModalVisible(false)}
          className="text-gray-500 hover:text-gray-800 text-xl"
        >
          &times;
        </button>
      </div>
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full table-auto text-sm text-left">
          <thead className="sticky top-0 bg-gray-100 shadow text-gray-700 uppercase text-xs">
            <tr>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Old Data</th>
              <th className="py-3 px-4">New Data</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="text-gray-600">
            {assetHistory.map((historyItem, index) => (
              <tr key={index} className="hover:bg-gray-50 border-b align-top">
                <td className="py-2 px-4">{historyItem.action}</td>
                <td className="py-2 px-4 text-xs">
                  {historyItem.old_data && Object.entries(historyItem.old_data).length > 0 ? (
                    <ul className="space-y-1">
                      {Object.entries(historyItem.old_data).map(([key, value]) => (
                        <li key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="py-2 px-4 text-xs">
                  {historyItem.new_data && Object.entries(historyItem.new_data).length > 0 ? (
                    <ul className="space-y-1">
                      {Object.entries(historyItem.new_data).map(([key, value]) => (
                        <li key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="py-2 px-4 whitespace-nowrap">
                  {new Date(historyItem.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t flex justify-end">
        <button
          onClick={() => setHistoryModalVisible(false)}
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition" 
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* Edit Modal */}
      {editModalVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 transition-all duration-300 ease-in-out"
          style={{ animation: "fadeIn 0.3s ease-in-out" }}
        >
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-6xl h-auto max-h-[70vh] flex overflow-hidden">
            <div className="w-1/3 pr-6">
              {/* Read-Only Details */}
              <h3 className="text-lg font-semibold mb-4">Asset Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Asset Code:</strong> {assetToEdit?.asset_code}
                </div>
                <div>
                  <strong>Main Category:</strong>{" "}
                  {assetToEdit?.main_category_name}
                </div>
                <div>
                  <strong>Sub Category:</strong>{" "}
                  {assetToEdit?.sub_category_name}
                </div>
                <div>
                  <strong>Description:</strong> {assetToEdit?.description_text}
                </div>
                <div>
                  <strong>Department:</strong> {assetToEdit?.department_name}
                </div>
                <div>
                  <strong>Cost Center:</strong> {assetToEdit?.cost_center}
                </div>
                <div>
                  <strong>Location:</strong> {assetToEdit?.location_name}
                </div>
                <div>
                  <strong>Status:</strong> {assetToEdit?.status_name}
                </div>
              </div>
            </div>
            {/* Divider */}
            <div className="w-px bg-gray-300 mx-4" />
            {/* Editable Form */}
            <div className="w-2/3 pl-6 flex flex-col justify-between">
              <h3 className="text-lg font-semibold mb-4">Edit Fields</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { name: "serial_no", label: "Serial Number" },
                  { name: "part_number", label: "Part Number" },
                  { name: "mfg_serial", label: "MFG Serial" },
                  { name: "manufacturer", label: "Manufacturer" },
                  { name: "comments", label: "Comments" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      name={field.name}
                      value={editFormData[field.name] || ""}
                      onChange={handleEditChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg shadow-sm text-sm"
                    />
                  </div>
                ))}
                {/* Status dropdown */}
                <div key="status">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editFormData.status || ""}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg shadow-sm text-sm"
                  >
                    <option value="">Select Status</option>
                    {statuses.map((status) => (
                      <option
                        key={status.asset_status_id}
                        value={status.asset_status_id}
                      >
                        {status.asset_status_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModalVisible(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transform transition-all duration-200 ease-in-out hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transform transition-all duration-200 ease-in-out hover:scale-105"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
