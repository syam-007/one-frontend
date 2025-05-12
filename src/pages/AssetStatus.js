import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";

const AssetStatus = () => {
  const [statuses, setStatuses] = useState([]);
  const [assetStatusCode, setAssetStatusCode] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const API_URL = "https://api.task-target.com/one/api/statuses/";

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const response = await axios.get(API_URL);
      setStatuses(response.data);
    } catch (error) {
      console.error("Failed to fetch statuses:", error);
    }
  };

  const handleSubmit = async () => {
    if (!assetStatusCode.trim()) {
      setError("Status code is required.");
      return;
    }

    try {
      const payload = { asset_status_code: assetStatusCode.trim() };

      if (editingId) {
        await axios.put(`${API_URL}${editingId}/`, payload);
        setSuccessMessage("Status updated successfully.");
      } else {
        await axios.post(API_URL, payload);
        setSuccessMessage("Status created successfully.");
      }

      setAssetStatusCode("");
      setEditingId(null);
      setError("");
      fetchStatuses();
    } catch (error) {
      console.error("Error saving status:", error);
      setError("Failed to save status.");
    }
  };

  const handleEdit = (status) => {
    setAssetStatusCode(status.asset_status_code);
    setEditingId(status.asset_status_id);
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-8">
      {/* Left: Table */}
      <div className="flex-1 bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b text-xl font-semibold">Asset Status List</div>
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Status Code</th>
              <th className="border p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status) => (
              <tr key={status.asset_status_id} className="hover:bg-gray-50">
                <td className="border p-2">{status.asset_status_code}</td>
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleEdit(status)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-80 bg-white p-6 shadow-md rounded-lg">
        <h3 className="text-xl font-semibold mb-4">
          {editingId ? "Update" : "Create"} Asset Status
        </h3>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        {successMessage && <div className="text-green-600 text-sm mb-3">{successMessage}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Status Code</label>
          <input
            type="text"
            value={assetStatusCode}
            onChange={(e) => setAssetStatusCode(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter status code"
          />
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-2 text-white rounded ${editingId ? "bg-red-600" : "bg-blue-600"} hover:opacity-90`}
        >
          {editingId ? "Update" : "Create"}
        </button>
      </div>
    </div>
  );
};

export default AssetStatus;
