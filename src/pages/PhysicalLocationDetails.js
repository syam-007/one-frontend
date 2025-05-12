import React, { useEffect, useState } from "react";
import axios from "axios";

const PhysicalLocationDetails = () => {
  const [details, setDetails] = useState([]);
  const [detailName, setDetailName] = useState("");
  const [masterId, setMasterId] = useState("");
  const [status, setStatus] = useState("A");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const response = await axios.get("https://api.task-target.com/one/api/location-details/");
      let data = response.data;
      if (!Array.isArray(data)) data = [data];

      setDetails(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!detailName || !masterId) {
      setError("All fields are required.");
      return;
    }

    const payload = {
      physical_location_detail_name: detailName,
      physical_location_master: parseInt(masterId),
      status,
    };

    try {
      if (editingId) {
        await axios.put(`https://api.task-target.com/one/api/location-details/${editingId}/`, payload);
        setSuccessMessage("Detail updated successfully!");
      } else {
        await axios.post("https://api.task-target.com/one/api/location-details/", payload);
        setSuccessMessage("Detail created successfully!");
      }

      resetForm();
      fetchDetails();
    } catch (err) {
      console.error("Submit error:", err);
      setError("Submission failed.");
    }
  };

  const handleEdit = (item) => {
    setDetailName(item.physical_location_detail_name);
    setMasterId(item.physical_location_master);
    setStatus(item.status);
    setEditingId(item.physical_location_detail_id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/location-details/${id}/`);
      fetchDetails();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const resetForm = () => {
    setDetailName("");
    setMasterId("");
    setStatus("A");
    setEditingId(null);
    setError("");
    setSuccessMessage("");
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-semibold">Physical Location Details</h2>

      {error && <p className="text-red-600">{error}</p>}
      {successMessage && <p className="text-green-600">{successMessage}</p>}

      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">{editingId ? "Edit" : "Create"} Detail</h3>
        <input
          type="text"
          placeholder="Detail Name"
          className="w-full p-2 border rounded mb-4"
          value={detailName}
          onChange={(e) => setDetailName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Master Location ID"
          className="w-full p-2 border rounded mb-4"
          value={masterId}
          onChange={(e) => setMasterId(e.target.value)}
        />
        <select
          className="w-full p-2 border rounded mb-4"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="A">Active</option>
          <option value="I">Inactive</option>
          <option value="R">Retired</option>
        </select>
        <button
          className={`w-full py-2 rounded text-white ${editingId ? "bg-red-600" : "bg-blue-600"}`}
          onClick={handleSubmit}
        >
          {editingId ? "Update" : "Create"} Detail
        </button>
      </div>

      <div className="bg-white p-4 shadow-md rounded">
        <h3 className="text-lg font-semibold mb-3">Details List</h3>
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Master ID</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {details.map((item) => (
              <tr key={item.physical_location_detail_id}>
                <td className="border p-2">{item.physical_location_detail_name}</td>
                <td className="border p-2">{item.physical_location_master}</td>
                <td className="border p-2">{item.status}</td>
                <td className="border p-2 flex gap-2 justify-center">
                  <button className="text-blue-600" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button className="text-red-600" onClick={() => handleDelete(item.physical_location_detail_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PhysicalLocationDetails;
