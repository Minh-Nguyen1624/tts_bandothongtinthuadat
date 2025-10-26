import axios from "axios";
import { API_URL } from "../../../constants/API_URL";
import { useImperativeHandle } from "react";

export const landPlotApi = {
  updateLandPlot: async (id, payload, token) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/land_plots/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response;
    } catch (error) {
      throw error;
    }
  },
  addLandPlot: async (payload, token) => {
    try {
      const response = await axios.post(`${API_URL}/api/land_plots`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const searchPlotListApi = async (so_to, so_thua) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }

  const response = await axios.get(`${API_URL}/api/plotlists`, {
    params: { so_to, so_thua },
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};
