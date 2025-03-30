import React, { useState } from "react";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ApiService from "../../services/ApiService";

const UpdateProfile = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  // Initialize form state with user data
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    dob: user?.dob || "",
    gender: user?.gender || "Male",
    profileImage: user?.profileImage || "", // Stores Base64 or file URL
    file: null, // Stores actual file object for upload
  });

  // Handle text field updates
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, file }); // Store actual file object

      // Convert to Base64 for preview
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profileImage: reader.result }));
      };
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create FormData for submission
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("dob", formData.dob);
    formDataToSend.append("gender", formData.gender);

    // Append image file if updated
    if (formData.file) {
      formDataToSend.append("image", formData.file);
    }

    try {
      const response = await axios.post(
        `${ApiService.getBaseUrl()}/update-account`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true, // ✅ Include credentials (JWT in cookie)
        }
      );

      setUser(response.data.user); // ✅ Update user context
      navigate("/"); // ✅ Redirect after update
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(error.response?.data?.error || "Failed to update profile.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 text-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Update Profile</h2>
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <label className="block mb-2">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-700"
          required
        />

        {/* Email (Disabled) */}
        <label className="block mt-4 mb-2">Email</label>
        <input
          type="email"
          value={formData.email}
          disabled
          className="w-full p-2 rounded bg-gray-700 opacity-50 cursor-not-allowed"
        />

        {/* Date of Birth */}
        <label className="block mt-4 mb-2">Date of Birth</label>
        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-700"
          required
        />

        {/* Gender */}
        <label className="block mt-4 mb-2">Gender</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full p-2 rounded bg-gray-700"
          required
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        {/* Profile Image Upload */}
        <label className="block mt-4 mb-2">Upload Profile Photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full p-2 rounded bg-gray-700"
        />

        {/* Show Image Preview */}
        {formData.profileImage && (
          <img
            src={formData.profileImage}
            alt="Profile Preview"
            className="mt-4 w-24 h-24 rounded-full object-cover mx-auto"
          />
        )}

        {/* Submit Button */}
        <button className="mt-4 p-2 w-full bg-blue-500 rounded hover:bg-blue-600">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default UpdateProfile;
