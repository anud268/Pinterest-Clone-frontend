import axios from 'axios';
import { useFormik } from 'formik';
import { useEffect, useState, useCallback } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { GoHomeFill } from 'react-icons/go';
import { HiOutlineArrowLeftStartOnRectangle } from 'react-icons/hi2';
import { IoCloseSharp } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import Scrollbar from 'react-scrollbars-custom';

const API_BASE_URL = 'http://localhost:3500';

export default function AdminExplore() {
  const [cards, setCards] = useState([]);
  const [category, setCategory] = useState([]);
  const [showCategory, setShowCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectCat,setSelectCat] = useState('')

  const formik = useFormik({
    initialValues: {
      image: '',
      title: '',
      subtitle: '',
      imagePreview: '',
    },
    validate: (values) => {
      const errors = {};
      if (!values.image) errors.image = 'Image is required';
      if (!values.title) errors.title = 'Title is required';
      if (!values.subtitle) errors.subtitle = 'Description is required';
      return errors;
    },
    onSubmit: (values) => {
      handleSubmitExplore(values);
    },
  });

  const handleSubmitExplore = async (values) => {
    try {
      setLoading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('image', values.image);
      formData.append('title', values.title);
      formData.append('subtitle', values.subtitle);

      const { data } = await axios.post(`${API_BASE_URL}/setexplore`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Update cards state more efficiently
      setCards((prev) => {
        const filtered = prev.filter((card) => card._id !== data._id);
        return [data, ...filtered];
      });
      
      formik.resetForm();
      setSelectCat('')
      formik.setFieldValue('image', '');
    } catch (error) {
      console.error('Error uploading explore data:', error);
      setError('Failed to upload explore data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/fetchcat`);
      setCategory(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    }
  }, []);

  const fetchCards = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/fetchcards`);
      setCards(data);
    } catch (error) {
      console.error('Error fetching cards:', error);
      setError('Failed to load cards');
    }
  }, []);

  const removeCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to remove this card?')) {
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/removecards`, { cardId });
      setCards(cards.filter((card) => card._id !== cardId));
    } catch (error) {
      console.error('Error removing card:', error);
      setError('Failed to remove card. Please try again.');
    }
  };

  const handleImageChange = (event) => {
    const file = event.currentTarget.files[0];
    formik.setFieldValue('image', file);

    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        formik.setFieldError('image', 'File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        formik.setFieldError('image', 'Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        formik.setFieldValue('imagePreview', reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      formik.setFieldValue('imagePreview', '');
    }
  };

  const handleCategorySelect = (categoryName) => {
    formik.setFieldValue('title', categoryName);
    setShowCategory(false);
  };

  useEffect(() => {
    fetchCards();
    fetchCategories();
  }, [fetchCards, fetchCategories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategory && !event.target.closest('.category-dropdown')) {
        setShowCategory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCategory]);

  return (
    <Scrollbar style={{ width: "100vw", height: '100vh', background:"gray",  }}>
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      <div className="bg-stone-950 text-xl min-h-screen w-80 pt-10 border-r border-white/20 flex-shrink-0">
        <nav className="fixed w-80">
          <Link to="/home" className="block">
            <div className="pl-20 p-5 font-bold hover:bg-blue-200/10 cursor-pointer transition-colors flex items-center text-white">
              <HiOutlineArrowLeftStartOnRectangle  className="mr-3" />
              Home
            </div>
          </Link>
          <Link to="/admin" className="block">
            <div className="pl-20 p-5 font-bold hover:bg-blue-200/10 cursor-pointer transition-colors text-white">
              Posts
            </div>
          </Link>
          <Link to="/admin/userlist" className="block">
            <div className="pl-20 p-5 font-bold hover:bg-blue-200/10 cursor-pointer transition-colors text-white">
              User List
            </div>
          </Link>
          <Link to="/admin/explore" className="block">
            <div className="pl-20 p-5 font-bold bg-blue-200/20 cursor-pointer text-white">
              Explore
            </div>
          </Link>
          <Link to="/admin/tags" className="block">
            <div className="pl-20 p-5 font-bold hover:bg-blue-200/10 cursor-pointer transition-colors text-white">
              Tags
            </div>
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-neutral-950 overflow-auto">
        <div className="w-full min-h-screen py-10 px-4">
          {/* Form Section */}
          <div className="flex items-center justify-center mb-10">
            <div className="bg-neutral-900 w-full max-w-2xl p-8 rounded-xl shadow-lg">
              <h2 className="text-3xl font-bold text-center text-gray-100 mb-8">
                Create Explore Card
              </h2>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={formik.handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-gray-100 font-medium mb-3">
                    Upload Image *
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    className="block w-full text-sm text-gray-100 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer border border-gray-600 rounded-lg bg-neutral-800"
                    onChange={handleImageChange}
                  />
                  {formik.errors.image && (
                    <p className="text-red-400 text-sm mt-2">{formik.errors.image}</p>
                  )}
                  {formik.values.imagePreview && (
                    <div className="mt-4 relative">
                      <img
                        src={formik.values.imagePreview}
                        alt="Preview"
                        className="rounded-lg w-full max-h-64 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          formik.setFieldValue('image', '');
                          formik.setFieldValue('imagePreview', '');
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      >
                        <IoCloseSharp size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="relative category-dropdown">
                  <label className="block text-gray-100 font-medium mb-3">
                    Category *
                  </label>
                  <div
                    onClick={() => setShowCategory(!showCategory)}
                    className="cursor-pointer bg-neutral-800 border border-gray-600 rounded-lg h-12 px-4 flex justify-between items-center text-gray-100 hover:border-gray-500 transition-colors"
                  >
                    <input
                      type="text"
                      name="title"
                      value={selectCat}
                      onChange={formik.handleChange}
                      placeholder="Select or type category"
                      className="w-full bg-transparent focus:outline-none cursor-pointer text-gray-100 placeholder-gray-400"
                      readOnly={showCategory}
                    />
                    <FaChevronDown className={`transition-transform ${showCategory ? 'rotate-180' : ''}`} />
                  </div>
                  {formik.errors.title && (
                    <p className="text-red-400 text-sm mt-2">{formik.errors.title}</p>
                  )}

                  {showCategory && (
                    <div className="absolute z-20 bg-neutral-800 border border-gray-600 rounded-lg mt-2 max-h-60 overflow-y-auto w-full shadow-xl">
                      {category.length > 0 ? (
                        category.map((cat, index) => (
                          <div
                            key={cat._id || index}
                            onClick={() => {handleCategorySelect(cat.category),setSelectCat(cat.category)}}
                            className="p-3 hover:bg-neutral-700 cursor-pointer text-gray-100 border-b border-gray-700 last:border-b-0 transition-colors"
                          >
                            {cat.category}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-400">No categories available</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-100 font-medium mb-3">
                    Description *
                  </label>
                  <textarea
                    name="subtitle"
                    placeholder="Write a short description..."
                    rows={4}
                    onChange={formik.handleChange}
                    value={formik.values.subtitle}
                    className="w-full p-4 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-neutral-800 text-gray-100 placeholder-gray-400 resize-vertical"
                  />
                  {formik.errors.subtitle && (
                    <p className="text-red-400 text-sm mt-2">{formik.errors.subtitle}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 !bg-blue-600 hover:!bg-blue-700 disabled:!bg-blue-600/50 text-white rounded-lg font-semibold transition-colors min-w-32"
                  >
                    {loading ? 'Uploading...' : 'Create Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="px-4">
            <h3 className="text-2xl font-bold text-gray-100 mb-6">
              Explore Cards ({cards.length})
            </h3>
            
            {cards.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No explore cards yet</p>
                <p className="text-gray-500">Create your first card using the form above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {cards.map((card, index) => (
                  <div
                    key={card._id || index}
                    className="relative bg-neutral-900 rounded-lg shadow-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={card.image}
                        alt={card.title || `Card ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMzMzMyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
                        }}
                      />
                      <button
                        onClick={() => removeCard(card._id)}
                        className="absolute top-2 right-2 !bg-white hover:!bg-gray-200 text-black !rounded-full !p-1 shadow/100 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
                        title="Remove card"
                      >
                        <IoCloseSharp size={16} />
                      </button>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-100 truncate mb-1">
                        {card.title}
                      </h4>
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </Scrollbar>
  );
}