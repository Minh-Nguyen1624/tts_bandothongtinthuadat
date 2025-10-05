// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import axios from "axios";
// import "../css/HomePage.css";
// import HeroSection from "../Components/HeroSection";
// import FeaturesSection from "../Components/FeaturesSection";
// import Sidebar from "../Components/Sidebar";
// import ContentHeader from "../Components/ContentHeader";
// import DataTable from "../Components/DataTable";

// const API_URL = "http://127.0.0.1:8000";
// const tabs = ["users", "units", "teams", "land_plots", "plotlists"];

// const HomePage = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [currentType, setCurrentType] = useState("users");

//   const token = localStorage.getItem("token");

//   // Cache để lưu trữ dữ liệu đã tải
//   const [dataCache, setDataCache] = useState({});

//   // Hàm fetch data với cache
//   const fetchData = useCallback(
//     async (type) => {
//       if (!token) {
//         console.warn("No token found. Please login first.");
//         return;
//       }

//       // Kiểm tra cache trước
//       if (dataCache[type]) {
//         console.log(`Using cached data for ${type}:`, dataCache[type]);
//         setData(dataCache[type]);
//         return;
//       }

//       setLoading(true);
//       setError(null);

//       try {
//         console.log(`Fetching data for ${type}...`);
//         const response = await axios.get(`${API_URL}/api/${type}`, {
//           headers: { Authorization: `Bearer ${token}` },
//           timeout: 10000,
//         });

//         console.log(`Response for ${type}:`, response.data);

//         // THÊM DEBUG: Kiểm tra cấu trúc dữ liệu
//         const responseData = response.data;
//         console.log(`Response structure for ${type}:`, {
//           hasData: !!responseData.data,
//           dataIsArray: Array.isArray(responseData.data),
//           dataLength: Array.isArray(responseData.data)
//             ? responseData.data.length
//             : "N/A",
//           fullResponse: responseData,
//         });

//         const newData = responseData?.data ?? responseData ?? [];
//         console.log(`Processed data for ${type}:`, newData);

//         setData(newData);

//         // Lưu vào cache
//         setDataCache((prev) => ({
//           ...prev,
//           [type]: newData,
//         }));
//       } catch (err) {
//         console.error(`Fetch error for ${type}:`, err);
//         setError(err.response?.data?.message || err.message || "Có lỗi xảy ra");
//       } finally {
//         setLoading(false);
//       }
//     },
//     [token, dataCache]
//   );

//   // Effect để fetch data khi type thay đổi
//   useEffect(() => {
//     console.log(`Current type changed to: ${currentType}`);
//     fetchData(currentType);
//   }, [currentType, fetchData]);

//   // Xử lý thay đổi tab
//   const handleTabChange = useCallback((tab) => {
//     console.log(`Tab changed to: ${tab}`);
//     setCurrentType(tab);
//   }, []);

//   // Memoize headers để tránh re-render không cần thiết
//   const tableHeaders = useMemo(() => {
//     const headersMap = {
//       users: ["ID", "Tên", "Email", "Đơn vị", "Nhóm", "Trạng thái"],
//       units: ["ID", "Tên", "Loại", "Mã"],
//       teams: ["ID", "Tên", "Đơn vị", "Mô tả", "Trạng thái"],
//       land_plots: [
//         "ID",
//         "Tên Chủ",
//         "Số Tờ",
//         "Số Thửa",
//         "Ký hiệu Mục Đích Sử Dụng",
//         "Phường/Xã",
//         "Trạng thái",
//       ],
//       plotlists: [
//         "ID",
//         "Tên danh sách",
//         "Số tờ",
//         "Số thửa",
//         "Địa chỉ thửa đất",
//         "Xã",
//         "Diện tích",
//       ],
//     };

//     const headers = headersMap[currentType] || headersMap.users;
//     console.log(`Headers for ${currentType}:`, headers);
//     return headers;
//   }, [currentType]);

//   // Memoize số lượng items
//   const itemsCount = useMemo(() => {
//     console.log(`Data count for ${currentType}:`, data.length);
//     return data.length;
//   }, [data, currentType]);

//   return (
//     <>
//       <div className="homepage">
//         <HeroSection />
//         <FeaturesSection />
//       </div>

//       {/* Data Management Section */}
//       <section className="data-section">
//         <Sidebar
//           currentType={currentType}
//           onTabChange={handleTabChange}
//           itemsCount={itemsCount}
//           tabs={tabs}
//         />

//         {/* Main Content */}
//         <div className="main-content">
//           <ContentHeader currentType={currentType} itemsCount={itemsCount} />
//           <DataTable
//             data={data}
//             loading={loading}
//             error={error}
//             currentType={currentType}
//             tableHeaders={tableHeaders}
//             onRetry={() => fetchData(currentType)}
//           />
//         </div>
//       </section>
//     </>
//   );
// };

// export default React.memo(HomePage);

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import "../css/HomePage.css";
import HeroSection from "../Components/HeroSection";
import FeaturesSection from "../Components/FeaturesSection";
import Sidebar from "../Components/Sidebar";
import ContentHeader from "../Components/ContentHeader";
import DataTable from "../Components/DataTable";

const API_URL = "http://127.0.0.1:8000";
const tabs = ["land_plots"]; // Chỉ giữ lại land_plots

const HomePage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentType, setCurrentType] = useState("land_plots"); // Mặc định là land_plots

  const token = localStorage.getItem("token");

  // Cache để lưu trữ dữ liệu đã tải
  const [dataCache, setDataCache] = useState({});

  // Hàm fetch data với cache
  const fetchData = useCallback(
    async (type) => {
      if (!token) {
        console.warn("No token found. Please login first.");
        return;
      }

      // Kiểm tra cache trước
      if (dataCache[type]) {
        console.log(`Using cached data for ${type}:`, dataCache[type]);
        setData(dataCache[type]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching data for ${type}...`);
        const response = await axios.get(`${API_URL}/api/${type}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });

        console.log(`Response for ${type}:`, response.data);

        // THÊM DEBUG: Kiểm tra cấu trúc dữ liệu
        const responseData = response.data;
        console.log(`Response structure for ${type}:`, {
          hasData: !!responseData.data,
          dataIsArray: Array.isArray(responseData.data),
          dataLength: Array.isArray(responseData.data)
            ? responseData.data.length
            : "N/A",
          fullResponse: responseData,
        });

        const newData = responseData?.data ?? responseData ?? [];
        console.log(`Processed data for ${type}:`, newData);

        setData(newData);

        // Lưu vào cache
        setDataCache((prev) => ({
          ...prev,
          [type]: newData,
        }));
      } catch (err) {
        console.error(`Fetch error for ${type}:`, err);
        setError(err.response?.data?.message || err.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    },
    [token, dataCache]
  );

  // Effect để fetch data khi type thay đổi
  useEffect(() => {
    console.log(`Current type changed to: ${currentType}`);
    fetchData(currentType);
  }, [currentType, fetchData]);

  // Xử lý thay đổi tab
  const handleTabChange = useCallback((tab) => {
    console.log(`Tab changed to: ${tab}`);
    setCurrentType(tab);
  }, []);

  // Memoize headers để tránh re-render không cần thiết
  const tableHeaders = useMemo(() => {
    const headersMap = {
      land_plots: [
        "STT",
        "Tên chủ",
        "Số tờ",
        "Số thửa",
        "Ký hiệu mục đích sử dụng",
        "Phường/Xã",
      ],
    };

    const headers = headersMap[currentType] || headersMap.land_plots;
    console.log(`Headers for ${currentType}:`, headers);
    return headers;
  }, [currentType]);

  // Memoize số lượng items
  const itemsCount = useMemo(() => {
    console.log(`Data count for ${currentType}:`, data.length);
    return data.length;
  }, [data, currentType]);

  return (
    <>
      <div className="homepage">
        <HeroSection />
        <FeaturesSection />
      </div>

      {/* Data Management Section */}
      <section className="data-section">
        <Sidebar
          currentType={currentType}
          onTabChange={handleTabChange}
          itemsCount={itemsCount}
          tabs={tabs}
        />

        {/* Main Content */}
        <div className="main-content">
          <ContentHeader currentType={currentType} itemsCount={itemsCount} />
          <DataTable
            data={data}
            loading={loading}
            error={error}
            currentType={currentType}
            tableHeaders={tableHeaders}
            onRetry={() => fetchData(currentType)}
          />
        </div>
      </section>
    </>
  );
};

export default React.memo(HomePage);
