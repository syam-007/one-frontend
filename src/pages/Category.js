import React, { useEffect, useState } from "react";
import axios from "axios";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterMain, setFilterMain] = useState("");
  const [filterSub, setFilterSub] = useState("");
  const [filterDesc, setFilterDesc] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchCategories = async () => {
    try {
      const res = await axios.get("https://api.task-target.com/one/api/upload-assets/all-category/");
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const flattenCategories = () => {
    const rows = [];
    categories.forEach((main) => {
      main.subcategories.forEach((sub) => {
        sub.descriptions.forEach((desc) => {
          rows.push({
            mainCategory: main.asset_main_category_name,
            mainStatus: main.status,
            subCategory: sub.asset_sub_category_name,
            subStatus: sub.status,
            description: desc.asset_description,
            descStatus: desc.status,
          });
        });
      });
    });
    return rows;
  };

  const filteredRows = flattenCategories()
    .filter((row) =>
      row.mainCategory.toLowerCase().includes(filterMain.toLowerCase()) &&
      row.subCategory.toLowerCase().includes(filterSub.toLowerCase()) &&
      row.description.toLowerCase().includes(filterDesc.toLowerCase()) &&
      (searchTerm === "" ||
        row.mainCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.subCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const fieldA = a[sortField].toLowerCase();
      const fieldB = b[sortField].toLowerCase();
      if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleFileUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setProgress(0);

      await axios.post("https://api.task-target.com/one/api/upload-assets/upload-assets-excel/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        },
      });

      fetchCategories();
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setShowModal(false);
      }, 1500);
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.error || "Unknown error"));
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".xlsx")) {
      handleFileUpload(file);
    } else {
      toast.error("Please upload a valid .xlsx file.");
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".xlsx")) {
      handleFileUpload(file);
    } else {
      toast.error("Please select a valid .xlsx file.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <ToastContainer />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Asset Category</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          <Upload size={16} /> Import Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mt-4">
        <input
          type="text"
          placeholder="Search..."
          className="border p-2 rounded-md w-full sm:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* <input
          type="text"
          placeholder="Filter by Main Category"
          className="border p-2 rounded-md w-full sm:w-64"
          value={filterMain}
          onChange={(e) => setFilterMain(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by Sub Category"
          className="border p-2 rounded-md w-full sm:w-64"
          value={filterSub}
          onChange={(e) => setFilterSub(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by Description"
          className="border p-2 rounded-md w-full sm:w-64"
          value={filterDesc}
          onChange={(e) => setFilterDesc(e.target.value)}
        /> */}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto bg-white shadow-md rounded-2xl mt-6">
        <table className="min-w-full text-sm text-gray-700 border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-100 text-left text-xs uppercase tracking-wider text-gray-600">
            <tr>
              <th className="p-3 cursor-pointer" onClick={() => handleSort("mainCategory")}>Main Category</th>
              <th className="p-3">Main Status</th>
              <th className="p-3 cursor-pointer" onClick={() => handleSort("subCategory")}>Sub Category</th>
              <th className="p-3">Sub Status</th>
              <th className="p-3 cursor-pointer" onClick={() => handleSort("description")}>Description</th>
              <th className="p-3">Description Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 border-b">
                  <td className="p-3">{row.mainCategory}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.mainStatus === "A" ? "bg-green-100 text-green-700" :
                      row.mainStatus === "I" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {row.mainStatus === "A" ? "Active" : row.mainStatus === "I" ? "Inactive" : "Retired"}
                    </span>
                  </td>
                  <td className="p-3">{row.subCategory}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.subStatus === "A" ? "bg-green-100 text-green-700" :
                      row.subStatus === "I" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {row.subStatus === "A" ? "Active" : row.subStatus === "I" ? "Inactive" : "Retired"}
                    </span>
                  </td>
                  <td className="p-3">{row.description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.descStatus === "A" ? "bg-green-100 text-green-700" :
                      row.descStatus === "I" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {row.descStatus === "A" ? "Active" : row.descStatus === "I" ? "Inactive" : "Retired"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">No data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div
            className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative animate-fade-in"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              onClick={() => {
                setShowModal(false);
                setShowSuccess(false);
              }}
            >
              <X size={20} />
            </button>

            {!showSuccess ? (
              <>
                <h3 className="text-lg font-semibold mb-4 text-center">Upload Excel File</h3>
                <div
                  className={`border-dashed border-2 rounded-md p-6 text-center transition ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                >
                  <p className="mb-2">Drag and drop Excel file here or click to browse</p>
                  <label
                    htmlFor="excel-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-md bg-white hover:bg-gray-100"
                  >
                    <Upload className="w-4 h-4" /> Choose File
                  </label>
                  <input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>

                {uploading && (
                  <div className="mt-6 text-center">
                    <p className="mb-2 text-sm text-gray-700">Uploading: {progress}%</p>
                    <div className="w-full bg-gray-200 h-3 rounded overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-green-600 animate-fade-in-up">
                <CheckCircle2 size={48} />
                <p className="mt-2 font-semibold text-lg">Upload Successful!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;
