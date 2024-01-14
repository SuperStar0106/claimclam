"use client";
import { useState, ChangeEvent, FormEvent, useEffect } from "react";

interface ApiResponse {
  items: Array<{
    id: number;
    title: string;
    description: string;
    images: {
      default: string;
      featured: string;
      thumbnail: string;
      wide: string;
    };
  }>;
}

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLastPage, setIsLastPage] = useState<boolean>(false);
  const limit = 10;

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const fetchData = async (page: number) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (inputValue) {
        queryParams.append("search", inputValue);
      }

      const response = await fetch(
        `http://localhost:8080/api/podcasts?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result: ApiResponse = await response.json();
      setData(result);
      setIsLastPage(result.items.length < limit);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchData(currentPage);
  };

  const handleNext = () => {
    if (!isLastPage) {
      setCurrentPage(currentPage + 1);
      fetchData(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      fetchData(currentPage - 1);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchData(currentPage);
    }, 500);

    return () => clearTimeout(handle);
  }, [inputValue, currentPage]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-10 bg-gray-800 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm ">
        <h1 className="font-serif text-5xl text-center text-indigo-600 mb-10">
          Podcast
        </h1>
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="relative w-full">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10a4 4 0 114-4 4 4 0 01-4 4zm6 2a10 10 0 104 4H14v-4h4z"
              />
            </svg>
            <input
              className="block w-full rounded-md border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
              type="text"
              placeholder="Search..."
              value={inputValue}
              onChange={handleInputChange}
            />
          </div>
        </form>
        {isLoading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
        {data && data.items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2">
            {data.items.map((item) => (
              <div className="bg-white rounded-lg shadow-md dark:bg-gray-800 overflow-hidden transform transition duration-500 hover:scale-105">
                <img
                  src={`${item.images.thumbnail}`}
                  alt=""
                  className="object-cover w-full h-64"
                />
                <div className="p-5">
                  <h2 className="mb-2 text-xl font-bold tracking-tight text-gray-700 dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mb-3 font-normal text-gray-700 dark:text-gray-300">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !isLoading &&
          data && <div className="text-gray-600">No data found.</div>
        )}
        <div className="flex justify-center mt-6">
          <button
            className="border border-indigo-600 text-indigo-600 mx-2 rounded p-2 hover:bg-indigo-600 hover:text-white transition-colors duration-300"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button
            className="border border-indigo-600 text-indigo-600 mx-2 rounded p-2 hover:bg-indigo-600 hover:text-white transition-colors duration-300"
            onClick={handleNext}
            disabled={isLastPage}
          >
            Next
          </button>
        </div>
        {error && <div className="text-red-500">Error: {error}</div>}
      </div>
    </main>
  );
}
