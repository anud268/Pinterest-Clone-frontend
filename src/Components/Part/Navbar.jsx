import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { FaCaretDown } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import { addPost } from '../Redex/Slice/PostSlice'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [types, setTypes] = useState(['Title', 'Location', 'User'])
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [searchError, setSearchError] = useState('')
  const [select, setSelect] = useState('Title')
  const [open, setOpen] = useState(false)

  const searchRef = useRef()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const navigate = useNavigate()

  // Clear search
  const searchInput = () => {
    searchRef.current.value = ''
    searchRef.current.focus()
  }

  // Search handler
  const searchTerms = async (value) => {
    try {
      const searchValue = value;
      const userId = user._id;

      if (searchValue === '') {
        setSearchSuggestions([]);
        setSearchError('');
        return;
      }

      const { data } = await axios.get('http://localhost:3500/searchterms', {
        params: { searchValue, select, userId },
      });
      console.log(data, 'lllllllllll');


      if (data.length === 0 && searchValue != '') {
        setSearchSuggestions([]);
        setSearchError('No search found');
        return;
      } else if (searchValue == '') {
        setSearchSuggestions([]);
      }

      if (select === 'Tag') {
        const matchedTags = [];

        data.forEach((tagString) => {
          try {
            const parsedTags = JSON.parse(tagString); // convert string to array
            if (Array.isArray(parsedTags)) {
              parsedTags.forEach((tag) => {
                if (tag.toLowerCase().includes(searchValue.toLowerCase())) {
                  matchedTags.push(tag);
                }
              });
            }
          } catch (err) {
            console.warn('Skipped invalid tag string:', tagString);
          }
        });

        // Final result: one single flat array with unique tag values
        const uniqueMatchedTags = [...new Set(matchedTags)];
        setSearchSuggestions(uniqueMatchedTags);
      } else {
        setSearchSuggestions(data);
      }

      setSearchError('');
    } catch (error) {
      console.log('Search error:', error);
    }
  };

  console.log(searchSuggestions, 'kkkkkkk');

  // Final search submit
  const finalSearch = async (value) => {
    try {
      const searchValue = value
      const { data } = await axios.post('http://localhost:3500/finalsearch', {
        searchValue,
        select,
      })
      console.log(data, 'final search');

      navigate('/home')
      dispatch(addPost(data))
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    searchTerms('')
  }, [])

  return (
    <div className="w-screen absolute z-10 flex bg-gray-50 p-2 pl-22 px-8 gap-4 shadow-lg overflow-y-auto max-h-150">
      {/* Logo */}
      <div className="w-13 content-start">
        <img
          src="/assets/white & blue pinterest icon.png"
          alt="Pinterest Logo"
          title="Pinterest-Clone"
          className="top-0"
        />

      </div>

      {/* Search Section */}
      <div className="w-screen">
        <div className="flex w-full">
          <div className="w-full">
            <input
              id='search'
              type="search"
              onChange={(e) => searchTerms(e.target.value)}
              ref={searchRef}
              placeholder="Search..."
              className="w-full bg-gray-200 rounded-tl-full rounded-bl-full h-10 text-black pl-3 focus:outline-none"
            />

            {/* Suggestions Box */}
            {searchSuggestions?.length > 0 ? (
              <div className="p-2">
                <button
                  onClick={() => {
                    searchInput()
                    setSearchSuggestions([])
                  }}
                  className="!bg-white !border-2 !border-blue-100 shadow text-black m-1"
                >
                  Clear Search
                </button>

                {searchSuggestions.map((result, i) => (
                  <div
                    key={i}
                    onClick={() => setSearchSuggestions([])}
                    className="text-blue-800 p-2 m-1 pl-4 border-2 border-gray-200 hover:bg-gray-200 rounded-full font-semibold cursor-pointer"
                  >
                    {select === 'User' ? (
                      <Link to={`/profile/${result._id}`}>
                        <p>{result.fullname}</p>
                      </Link>
                    ) : (
                      <p onClick={() => finalSearch(result)}>{result}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : searchError ? (
              <div className="text-blue-800 p-2 m-1 pl-4 border-2 border-gray-200 hover:bg-gray-200 rounded-full font-semibold cursor-pointer">
                {searchError}
              </div>
            ) : null}
          </div>

          {/* Dropdown for search type */}
          <div
            onClick={() => setOpen(!open)}
            className="cursor-pointer text-black border-l-2 w-32 h-10 flex bg-gray-200 rounded-tr-full rounded-br-full"
          >
            <p className="p-1 content-center">
              <FaCaretDown />
            </p>
            <p className="p-1 content-center">{select}</p>
          </div>
        </div>

        {/* Dropdown options */}
        {open && (
          <div className="fixed z-50 top-16 right-12 py-4 bg-white rounded-xl shadow border-2 border-blue-100">
            {types.map((type, i) => (
              <div key={i}>
                <p
                  onClick={() => {
                    setOpen(false)
                    setSelect(type)
                    searchInput()
                    setSearchSuggestions([])
                  }}
                  className="text-black hover:bg-indigo-100 px-4 p-1 rounded cursor-pointer"
                >
                  {select === type ? (
                    <span className="text-blue-700">{type}</span>
                  ) : (
                    <span>{type}</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
