import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrashAlt } from "react-icons/fa";

const SubDepartmentSettings = () => {
  const [subDepartments, setSubDepartments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subDepartmentName, setSubDepartmentName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("A");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubDepartments();
    fetchDepartments();
  }, []);

  const fetchSubDepartments = async () => {
    try {
      const res = await axios.get("https://api.task-target.com/one/api/sub-departments/");
      setSubDepartments(res.data);
    } catch (err) {
      console.error("Error fetching sub-departments:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("https://api.task-target.com/one/api/departments/");
      setDepartments(res.data);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const handleSubmit = async () => {
    if (!subDepartmentName || !departmentId) {
      setError("Sub-department name and department are required.");
      return;
    }

    const payload = {
      sub_department_name: subDepartmentName,
      department: departmentId,
      status,
    };

    try {
      if (editingId) {
        await axios.put(`https://api.task-target.com/one/api/sub-departments/${editingId}/`, payload);
        setMessage("Sub-department updated successfully!");
      } else {
        await axios.post("https://api.task-target.com/one/api/sub-departments/", payload);
        setMessage("Sub-department created successfully!");
      }

      resetForm();
      fetchSubDepartments();
    } catch (err) {
      console.error("Error submitting:", err);
      setError("Failed to save sub-department.");
    }
  };

  const handleEdit = (sub) => {
    setSubDepartmentName(sub.sub_department_name);
    setDepartmentId(sub.department);
    setStatus(sub.status);
    setEditingId(sub.sub_department_id);
    setMessage("");
    setError("");
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.task-target.com/one/api/sub-departments/${id}/`);
      fetchSubDepartments();
      setMessage("Deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete.");
    }
  };

  const resetForm = () => {
    setSubDepartmentName("");
    setDepartmentId("");
    setStatus("A");
    setEditingId(null);
    setError("");
  };

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-6">
      {/* Left: Table */}
      <div className="flex-1 bg-white p-4 shadow-md rounded-lg overflow-auto">
        <h2 className="text-xl font-semibold mb-4">Sub-Departments</h2>
        <table className="w-full table-auto text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Sub-Department</th>
              <th className="border p-2 text-left">Department</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subDepartments.map((sub) => (
              <tr key={sub.sub_department_id} className="hover:bg-gray-50">
                <td className="border p-2">{sub.sub_department_name}</td>
                <td className="border p-2">
                  {
                    departments.find((d) => d.department_id === sub.department)
                      ?.department_name || "Unknown"
                  }
                </td>
                <td className="border p-2">
                  {sub.status === "A" ? "Active" : sub.status === "I" ? "Inactive" : "Retired"}
                </td>
                <td className="border p-2">
                  <div className="flex gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleEdit(sub)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(sub.sub_department_id)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right: Form */}
      <div className="w-full lg:w-80 bg-white p-6 shadow-md rounded-lg">
        <h3 className="text-xl font-semibold mb-6">
          {editingId ? "Edit" : "Create"} Sub-Department
        </h3>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}

        <input
          className="w-full p-3 border rounded-md mb-4"
          type="text"
          placeholder="Sub-Department Name"
          value={subDepartmentName}
          onChange={(e) => setSubDepartmentName(e.target.value)}
        />

        <select
          className="w-full p-3 border rounded-md mb-4"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.department_id} value={dept.department_id}>
              {dept.department_name}
            </option>
          ))}
        </select>

        <select
          className="w-full p-3 border rounded-md mb-4"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="A">Active</option>
          <option value="I">Inactive</option>
          <option value="R">Retired</option>
        </select>

        <button
          className={`w-full py-3 rounded-md text-white ${
            editingId ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={handleSubmit}
        >
          {editingId ? "Update" : "Create"} Sub-Department
        </button>
      </div>
    </div>
  );
};

export default SubDepartmentSettings;
