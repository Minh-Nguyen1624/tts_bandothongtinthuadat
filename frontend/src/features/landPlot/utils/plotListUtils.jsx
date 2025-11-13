import axios from "axios";
// import { API_URL } from "../../constants/API_URL";
import { API_URL } from "../../../constants/API_URL";

export const searchPlotList = async (
  so_to,
  so_thua,
  setPlotListInfo,
  setFormData,
  setIsSearchingPlotList
) => {
  if (!so_to || !so_thua) {
    setPlotListInfo(null);
    setFormData((prev) => ({
      ...prev,
      dien_tich: "",
    }));
    return;
  }

  setIsSearchingPlotList(true);

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found. Please log in.");
    }

    // console.log("🔍 Searching EXACT PlotList with:", { so_to, so_thua });

    const response = await axios.get(`${API_URL}/api/plotlists`, {
      params: {
        so_to,
        so_thua,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // console.log("📊 PlotList API Response:", response.data);

    if (response.data.success && response.data.data.length > 0) {
      const exactPlotList = response.data.data.find(
        (plot) =>
          String(plot.so_to) === String(so_to) &&
          String(plot.so_thua) === String(so_thua)
      );

      // console.log("🎯 Exact match found:", exactPlotList);

      if (exactPlotList) {
        setPlotListInfo(exactPlotList);
        setFormData((prev) => ({
          ...prev,
          dien_tich:
            exactPlotList.dien_tich != null
              ? String(exactPlotList.dien_tich)
              : "",
        }));
      } else {
        // console.log("❌ No EXACT PlotList match found");
        setPlotListInfo(null);
        setFormData((prev) => ({
          ...prev,
          dien_tich: "",
        }));
      }
    } else {
      // console.log("❌ No PlotList found at all");
      setPlotListInfo(null);
      setFormData((prev) => ({
        ...prev,
        dien_tich: "",
      }));
    }
  } catch (error) {
    console.error("❌ Error fetching plot list:", error);
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized: Please check your authentication token.");
    }
    setPlotListInfo(null);
    setFormData((prev) => ({
      ...prev,
      dien_tich: "",
    }));
  } finally {
    setIsSearchingPlotList(false);
  }
};
