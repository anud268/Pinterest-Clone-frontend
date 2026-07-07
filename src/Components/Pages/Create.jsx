import React, { useState, useCallback, useEffect } from "react";
import Navbar from "../Part/Navbar";
import Sidebar from "../Part/Sidebar";
import { useFormik } from "formik";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { showSidebar } from "../Redex/Slice/navbarSlice";
import { IoCloseSharp, IoImageOutline } from "react-icons/io5";
import { FiMapPin, FiLink, FiTag } from "react-icons/fi";
import Scrollbar from "react-scrollbars-custom";

const API_BASE_URL = "http://localhost:3500";

export default function Create() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const pic = useSelector((state) => state.pic);
  const userId = user._id;

  const location = useLocation();
  const isEditMode = Boolean(location.state?._id);
  const postId = location.state?._id;

  useEffect(() => {
    if (isEditMode && location.state?.tags) {
      setSelectedTags(location.state.tags);
    }
  }, [isEditMode, location.state]);

  const formik = useFormik({
    initialValues: {
      image: "",
      title: location.state?.postTitle || "",
      description: location.state?.postDescription || "",
      url: location.state?.url || "",
      location: location.state?.location || "",
      imagePreview: location.state?.postImage || "",
    },
    enableReinitialize: true,
    validate: (values) => {
      const errors = {};
      if (!values.title.trim()) errors.title = "Title is required";
      if (!values.description.trim()) errors.description = "Description is required";
      if (values.url && !isValidUrl(values.url)) {
        errors.url = "Please enter a valid URL";
      }
      if (!values.image && !values.imagePreview) {
        errors.image = "Image is required";
      }
      return errors;
    },
    onSubmit: (values) => {
      if (isEditMode) {
        handleUpdate(values, postId);
      } else {
        handleUpload(values, userId);
      }
    },
  });

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // CREATE POST
  const handleUpload = async (values, userId) => {
    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("image", values.image);
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("url", values.url);
      formData.append("location", values.location);
      formData.append("tags", selectedTags);
      formData.append("userId", userId);

      const { data } = await axios.post(`${API_BASE_URL}/upload`, formData);

      if (data.success) {
        navigate("/home");
      } else {
        setError("Failed to create post. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("An error occurred while creating your post.");
    } finally {
      setLoading(false);
    }
  };

  // UPDATE POST
  const handleUpdate = async (values, postId) => {
    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("url", values.url);
      formData.append("location", values.location);
      formData.append("tags", selectedTags);
      if (values.image) {
        formData.append("image", values.image);
      }

      const { data } = await axios.post(`${API_BASE_URL}/update/${postId}`, formData);

      if (data.success) {
        navigate("/home");
      } else {
        setError("Failed to update post.");
      }
    } catch (error) {
      console.error("Update error:", error);
      setError("An error occurred while updating your post.");
    } finally {
      setLoading(false);
    }
  };

  // TAG SEARCH
  const fetchTags = useCallback(
    async (searchValue) => {
      if (!searchValue.trim()) {
        setAvailableTags([]);
        return;
      }
      try {
        const { data } = await axios.get(`${API_BASE_URL}/applytag/${searchValue}`);
        const matchedTags = [];
        data.forEach((doc) => {
          doc.tags.forEach((tag) => {
            if (
              tag.toLowerCase().includes(searchValue.toLowerCase()) &&
              !selectedTags.includes(tag)
            ) {
              matchedTags.push(tag);
            }
          });
        });
        const uniqueMatchedTags = [...new Set(matchedTags)];
        setAvailableTags(uniqueMatchedTags);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    },
    [selectedTags]
  );

  const handleTagInputChange = (e) => {
    const value = e.target.value;
    setTagInput(value);
    fetchTags(value);
  };

  const addTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setTagInput("");
      setAvailableTags([]);
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const handleImageChange = (event) => {
    const file = event.currentTarget.files[0];
    formik.setFieldValue("image", file);

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        formik.setFieldError("image", "File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        formik.setFieldError("image", "Please select a valid image file");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        formik.setFieldValue("imagePreview", reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      formik.setFieldValue("imagePreview", "");
    }
  };

  const clearForm = () => {
    formik.resetForm();
    setSelectedTags([]);
    setTagInput("");
    setAvailableTags([]);
    setError("");
  };

  const isBlocked = user.adminblock === true;
  const defaultUserImage = "/assets/a4121c3d85669215955a4723cd8ca.jpg";

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh' }}>
      <div onClick={() => dispatch(showSidebar(false))} className="w-full min-h-screen bg-neutral-50/50">
        <div className="flex max-w-7xl mx-auto pl-16 sm:pl-20 pr-4 sm:pr-8 py-8">
          <div className="fixed top-0 left-0 z-20">
            <Sidebar section='create' />
          </div>

          <div className="flex-1 max-w-4xl mx-auto py-6">
            <div className="bg-white border border-neutral-200/60 shadow-md rounded-3xl overflow-hidden">

              {/* Header Panel */}
              <div className="border-b border-neutral-100 px-8 py-5 flex items-center justify-between bg-white">
                <h1 className="text-xl font-bold text-neutral-800 tracking-tight">
                  {isEditMode ? "Edit Pin" : "Create Pin"}
                </h1>
                {isBlocked && (
                  <span className="text-xs font-semibold bg-red-100 text-red-700 px-3.5 py-1.5 rounded-full border border-red-200">
                    Account Blocked
                  </span>
                )}
              </div>

              {error && (
                <div className="mx-8 mt-6 bg-red-50/60 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl text-sm flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="text-xs font-bold text-red-600 hover:text-red-800 underline border-0 bg-transparent cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {isBlocked && (
                <div className="mx-8 mt-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-center text-sm font-semibold">
                  Your account is blocked by the administrator. Creating new pins is disabled.
                </div>
              )}

              <form onSubmit={formik.handleSubmit} className="p-8">
                <div className="grid md:grid-cols-5 gap-8 items-start">

                  {/* Left Column: Image Uploader (Covers 2 columns of the grid) */}
                  <div className="md:col-span-2 space-y-4">
                    <label className="block text-sm font-bold text-neutral-700">
                      Pin Image <span className="text-red-500">*</span>
                    </label>

                    {(!isEditMode || !formik.values.imagePreview) && (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          name="image"
                          className="hidden"
                          id="image-upload"
                          onChange={handleImageChange}
                          disabled={isBlocked}
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center justify-center w-full h-[360px] border-2 border-dashed border-neutral-300 rounded-2xl hover:border-blue-500 hover:bg-neutral-50/80 transition-all duration-300 bg-neutral-50"
                        >
                          <div className="p-4 bg-white rounded-full shadow-sm mb-3 text-neutral-400 group-hover:scale-105 transition-transform duration-200">
                            <IoImageOutline size={28} />
                          </div>
                          <span className="text-neutral-700 text-sm font-semibold">
                            Choose a file
                          </span>
                          <span className="text-neutral-400 text-xs mt-1 text-center px-4 leading-relaxed">
                            We recommend high-quality images under 5MB
                          </span>
                        </label>
                      </div>
                    )}

                    {formik.values.imagePreview && (
                      <div className="relative mt-2 rounded-2xl overflow-hidden shadow-sm border border-neutral-200 bg-neutral-100 group">
                        <img
                          src={formik.values.imagePreview}
                          alt="Uploaded Pin Preview"
                          className="w-full max-h-[360px] object-cover rounded-2xl animate-fade-in"
                        />
                        {!isBlocked && (
                          <button
                            type="button"
                            onClick={() => {
                              formik.setFieldValue("image", "");
                              formik.setFieldValue("imagePreview", "");
                            }}
                            className="absolute top-3 right-3 p-2 bg-stone-900/80 hover:bg-stone-950 text-white rounded-full transition-colors shadow-md border-0 cursor-pointer"
                            title="Remove image"
                          >
                            <IoCloseSharp size={18} />
                          </button>
                        )}
                      </div>
                    )}

                    {formik.errors.image && (
                      <p className="text-red-500 text-xs font-semibold mt-1.5">{formik.errors.image}</p>
                    )}
                  </div>

                  {/* Right Column: Pin Details Form (Covers 3 columns of the grid) */}
                  <div className="md:col-span-3 space-y-6">

                    {/* Creator Info */}
                    <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-150 p-3 rounded-2xl">
                      <img
                        src={pic || defaultUserImage}
                        alt={user.fullname}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                        onError={(e) => { e.target.src = defaultUserImage }}
                      />
                      <div>
                        <span className="block text-xs text-neutral-400 font-bold uppercase tracking-wider">Creator</span>
                        <span className="block text-sm font-bold text-neutral-800 leading-tight">{user.fullname}</span>
                      </div>
                    </div>

                    {/* Pin Title */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        placeholder="Add your title"
                        onChange={formik.handleChange}
                        value={formik.values.title}
                        disabled={isBlocked}
                        className="w-full border-b border-neutral-200 hover:border-neutral-300 focus:border-blue-600 pb-2.5 outline-none text-lg font-bold text-neutral-800 placeholder-neutral-300 transition-colors bg-transparent"
                      />
                      {formik.errors.title && (
                        <p className="text-red-500 text-xs font-semibold mt-1">{formik.errors.title}</p>
                      )}
                    </div>

                    {/* Pin Description */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        placeholder="Tell everyone what your Pin is about"
                        rows="3"
                        onChange={formik.handleChange}
                        value={formik.values.description}
                        disabled={isBlocked}
                        className="w-full border-b border-neutral-200 hover:border-neutral-300 focus:border-blue-600 pb-2 outline-none text-sm text-neutral-700 placeholder-neutral-300 transition-colors bg-transparent resize-none leading-relaxed"
                      />
                      {formik.errors.description && (
                        <p className="text-red-500 text-xs font-semibold mt-1">{formik.errors.description}</p>
                      )}
                    </div>

                    {/* Website Destination Link */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        <FiLink size={12} />
                        Destination Link
                      </label>
                      <input
                        type="url"
                        name="url"
                        placeholder="Add a destination link (https://...)"
                        onChange={formik.handleChange}
                        value={formik.values.url}
                        disabled={isBlocked}
                        className="w-full border-b border-neutral-200 hover:border-neutral-300 focus:border-blue-600 pb-2 outline-none text-sm text-neutral-700 placeholder-neutral-300 transition-colors bg-transparent font-medium"
                      />
                      {formik.errors.url && (
                        <p className="text-red-500 text-xs font-semibold mt-1">{formik.errors.url}</p>
                      )}
                    </div>

                    {/* Tags Search & Selection */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        <FiTag size={12} />
                        Tags
                      </label>

                      {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {selectedTags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold"
                            >
                              <span>{tag}</span>
                              {!isBlocked && (
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="p-0.5 hover:bg-blue-100 text-blue-900 rounded-full border-0 bg-transparent cursor-pointer flex items-center justify-center"
                                >
                                  <IoCloseSharp size={12} />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search or add tags (Press Enter to add custom tag)"
                          value={tagInput}
                          onChange={handleTagInputChange}
                          onKeyPress={handleKeyPress}
                          disabled={isBlocked}
                          className="w-full border-b border-neutral-200 hover:border-neutral-300 focus:border-blue-600 pb-2 outline-none text-sm text-neutral-700 placeholder-neutral-300 transition-colors bg-transparent"
                        />
                        {availableTags.length > 0 && (
                          <div className="absolute z-10 w-full mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                            {availableTags.map((tag, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => addTag(tag)}
                                className="w-full text-left px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-semibold transition-colors border-0 border-b border-neutral-100 last:border-b-0 cursor-pointer"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Field */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                        <FiMapPin size={12} />
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        placeholder="Add a location"
                        onChange={formik.handleChange}
                        value={formik.values.location}
                        disabled={isBlocked}
                        className="w-full border-b border-neutral-200 hover:border-neutral-300 focus:border-blue-600 pb-2 outline-none text-sm text-neutral-700 placeholder-neutral-300 transition-colors bg-transparent"
                      />
                    </div>

                  </div>
                </div>

                {/* Form Buttons Panel */}
                <div className="flex justify-between items-center mt-10 pt-6 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={clearForm}
                    disabled={isBlocked}
                    className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full font-semibold text-sm transition-all cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isBlocked}
                    className={`px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm shadow-sm hover:shadow transition-all min-w-32 border-0 cursor-pointer ${loading || isBlocked ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                  >
                    {loading
                      ? isEditMode
                        ? "Updating..."
                        : "Posting..."
                      : isEditMode
                        ? "Update Pin"
                        : "Create Pin"}
                  </button>
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </Scrollbar>
  );
}
