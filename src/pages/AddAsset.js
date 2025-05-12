import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AddAsset = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    asset_code: "",
    department: "",
    cost_center: "",
    physical_location: "",
    asset_main_category: "",
    asset_sub_category: "",
    asset_description: "",
    serial_no: "",
    status: 11,
    manufacturer: "",
    mfg_number: "",
    mfg_serial: "",
    part_number: "",
    comments: ""
  });

  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios.get("https://api.task-target.com/one/api/departments/").then(res => setDepartments(res.data));
    axios.get("https://api.task-target.com/one/api/locations/").then(res => setLocations(res.data));
    axios.get("https://api.task-target.com/one/api/main-categories/").then(res => setMainCategories(res.data));
    axios.get("https://api.task-target.com/one/api/sub-categories/").then(res => setSubCategories(res.data));
    axios.get("https://api.task-target.com/one/api/descriptions/").then(res => setDescriptions(res.data));
    axios.get("https://api.task-target.com/one/api/statuses/").then(res => setStatuses(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "department") {
      const selectedDept = departments.find(d => String(d.department_id) === value);
      setFormData(prev => ({
        ...prev,
        department: value,
        cost_center: selectedDept ? selectedDept.cost_center || "" : ""
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    let requiredFields = [];

    if (step === 1) requiredFields = ["asset_main_category", "asset_sub_category", "asset_description","serial_no"];
    if (step === 3) requiredFields = ["department", "cost_center", "physical_location"];

    for (const field of requiredFields) {
      if (!formData[field]) {
        newErrors[field] = `${field.replaceAll("_", " ")} is required`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    try {
      const cleanedFormData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== "")
      );

      await axios.post("https://api.task-target.com/one/api/assets/", cleanedFormData, {
        headers: { "Content-Type": "application/json" }
      });
      navigate("/"); // Redirect to homepage if asset created successfully
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 400) {
        // Show toast notification for duplicate entry
        toast.error("The asset already exists.");
      } else {
        toast.error("The asset already exists");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <button onClick={() => navigate('/asset')} className="mb-4 text-blue-600 hover:underline">
        ← Back to Dashboard
      </button>

      <h2 className="text-xl font-bold mb-4">Add Asset (Step {step} of 3)</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1 */}
        {step === 1 && (
          <>
            <div>
              <label>Main Category</label>
              <select name="asset_main_category" value={formData.asset_main_category} onChange={handleChange} className="w-full p-2 border rounded cursor-pointer">
                <option value="">Select Main Category</option>
                {mainCategories.map(m => (
                  <option key={m.asset_main_category_id} value={m.asset_main_category_id}>{m.asset_main_category_name}</option>
                ))}
              </select>
              {errors.asset_main_category && <p className="text-red-500 text-sm">{errors.asset_main_category}</p>}
            </div>

            <div>
              <label>Sub Category</label>
              <select name="asset_sub_category" value={formData.asset_sub_category} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">Select Sub Category</option>
                {subCategories
                  .filter(sc => String(sc.asset_main_category) === String(formData.asset_main_category))
                  .map(s => (
                    <option key={s.asset_sub_category_id} value={s.asset_sub_category_id}>{s.asset_sub_category_name}</option>
                  ))}
              </select>
              {errors.asset_sub_category && <p className="text-red-500 text-sm">{errors.asset_sub_category}</p>}
            </div>

            <div>
              <label>Description</label>
              <select name="asset_description" value={formData.asset_description} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">Select Description</option>
                {descriptions
                  .filter(d => String(d.asset_sub_category) === String(formData.asset_sub_category))
                  .map(d => (
                    <option key={d.asset_description_id} value={d.asset_description_id}>{d.asset_description}</option>
                  ))}
              </select>
              {errors.asset_description && <p className="text-red-500 text-sm">{errors.asset_description}</p>}
            </div>

            <div>
            <label>Serial Number <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="serial_no"
              value={formData.serial_no}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${
                errors.serial_no ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter Serial Number"
            />
            {errors.serial_no && <p className="text-red-500 text-sm">{errors.serial_no}</p>}
          </div>

            <div className="flex justify-end pt-4">
              <button type="button" onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded">
                Next
              </button>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div>
              <label>Manufacturer</label>
              <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>

            <div>
              <label>MFG Serial</label>
              <input type="text" name="mfg_serial" value={formData.mfg_serial} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label>Part Number</label>
              <input type="text" name="part_number" value={formData.part_number} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>

            <div>
              <label>Comments</label>
              <textarea name="comments" value={formData.comments} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>

            <div className="flex justify-between pt-4">
              <button type="button" onClick={handleBack} className="px-4 py-2 bg-gray-300 rounded">Back</button>
              <button type="button" onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <div>
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                ))}
              </select>
              {errors.department && <p className="text-red-500 text-sm">{errors.department}</p>}
            </div>

            <div>
              <label>Cost Center</label>
              <input type="text" name="cost_center" value={formData.cost_center} readOnly className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed" />
              {errors.cost_center && <p className="text-red-500 text-sm">{errors.cost_center}</p>}
            </div>

            <div>
              <label>Physical Location</label>
              <select name="physical_location" value={formData.physical_location} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="">Select Location</option>
                {locations.map(loc => (
                  <option key={loc.physical_location_id} value={loc.physical_location_id}>{loc.physical_location_name}</option>
                ))}
              </select>
              {errors.physical_location && <p className="text-red-500 text-sm">{errors.physical_location}</p>}
            </div>

            <div className="flex justify-between pt-4">
              <button type="button" onClick={handleBack} className="px-4 py-2 bg-gray-300 rounded">Back</button>
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>
            </div>
          </>
        )}
      </form>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default AddAsset;
