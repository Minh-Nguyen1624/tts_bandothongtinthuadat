import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
  useRef,
} from "react";
import { FaStickyNote } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { notification } from "antd";
// import "../css/landPlotAdd.css";
import "../landPlot/css/landPlotAdd.css";
import LandPlotAddHeader from "../../features/landPlot/Components/LandPlotAddHeader";
import LandPlotAddForm from "../../features/landPlot/Components/LandPlotAddForm";
import LandUseDetailsSection from "../../features/landPlot/Components/LandUseDetailsAddSection";
import GeometrySection from "../../features/landPlot/Components/GeometryAddSection";
import FormActions from "../../features/landPlot/Components/FormAddActions";
// import { validateForm } from "./utils/validationAddUtils";
// import { searchPlotList } from "./utils/plotListUtils";
import useLandPlotForm from "../../hooks/useLandPlotForm";

const LandPlotAdd = memo(
  ({
    show,
    onClose,
    onSubmit,
    loading,
    phuongXaOptions,
    plotListOptions = [],
    fetchLandPlots,
  }) => {
    const [formData, setFormData] = useState({
      ten_chu: "",
      so_to: "",
      so_thua: "",
      ky_hieu_mdsd: [],
      dien_tich: "",
      phuong_xa: "",
      ghi_chu: "",
      plot_list_id: "",
      geom: null,
      status: "available",
      land_use_details: [],
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showGeometryInput, setShowGeometryInput] = useState(false);
    const [plotListInfo, setPlotListInfo] = useState(null);
    const [isSearchingPlotList, setIsSearchingPlotList] = useState(false);
    const [autoDistributeEnabled, setAutoDistributeEnabled] = useState(true);

    const searchTimeoutRef = useRef(null);
    const formDataRef = useRef(formData);

    useEffect(() => {
      formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
      if (show) {
        setFormData({
          ten_chu: "",
          so_to: "",
          so_thua: "",
          ky_hieu_mdsd: [],
          dien_tich: "",
          phuong_xa: "",
          ghi_chu: "",
          plot_list_id: "",
          geom: null,
          status: "available",
          land_use_details: [],
        });
        setErrors({});
        setTouched({});
        setShowGeometryInput(false);
        setPlotListInfo(null);
        setAutoDistributeEnabled(true);
      }
    }, [show]);

    const {
      searchPlotList,
      validateForm,
      handleInputChange,
      handleLandUseDetailChange,
      bulkUpdateLandUseDetails,
      addLandUseDetail,
      calculateRemainingArea,
      removeLandUseDetail,
      autoDistributeArea,
      handleGeometryChange,
      formatGeometryJSON,
      handleBlur,
      toggleGeometryInput,
      toggleAutoDistribute,
      handleSubmit,
    } = useLandPlotForm({
      formData,
      setFormData,
      errors,
      setErrors,
      touched,
      setTouched,
      showGeometryInput,
      setShowGeometryInput,
      plotListInfo,
      setPlotListInfo,
      isSearchingPlotList,
      setIsSearchingPlotList,
      autoDistributeEnabled,
      setAutoDistributeEnabled,
      searchTimeoutRef,
      formDataRef,
      onSubmit,
      fetchLandPlots,
      onClose,
    });

    useEffect(() => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchPlotList(formData.so_to, formData.so_thua);
      }, 500);

      return () => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [formData.so_to, formData.so_thua, searchPlotList]);

    const totalLandUseArea = useMemo(() => {
      return formData.land_use_details.reduce((sum, detail) => {
        return sum + (parseFloat(detail.dien_tich) || 0);
      }, 0);
    }, [formData.land_use_details]);

    const remainingArea = useMemo(() => {
      return calculateRemainingArea(formData);
    }, [formData, calculateRemainingArea]);

    const areaDifference = useMemo(() => {
      const totalArea = parseFloat(formData.dien_tich) || 0;
      return Math.abs(totalLandUseArea - totalArea);
    }, [totalLandUseArea, formData.dien_tich]);

    const hasAreaMismatch = useMemo(() => {
      return areaDifference > 0.01;
    }, [areaDifference]);

    if (!show) return null;

    return (
      <div className="blue-modal-overlay">
        <div className="blue-modal-content large-modal">
          <LandPlotAddHeader onClose={onClose} loading={loading} />

          <form onSubmit={handleSubmit} className="blue-land-form">
            <LandPlotAddForm
              formData={formData}
              errors={errors}
              touched={touched}
              handleInputChange={handleInputChange}
              handleBlur={handleBlur}
              loading={loading}
              isSearchingPlotList={isSearchingPlotList}
              plotListInfo={plotListInfo}
              plotListOptions={plotListOptions}
              autoDistributeEnabled={autoDistributeEnabled}
            />

            <LandUseDetailsSection
              formData={formData}
              errors={errors}
              loading={loading}
              autoDistributeEnabled={autoDistributeEnabled}
              toggleAutoDistribute={toggleAutoDistribute}
              handleLandUseDetailChange={handleLandUseDetailChange}
              addLandUseDetail={addLandUseDetail}
              removeLandUseDetail={removeLandUseDetail}
              autoDistributeArea={autoDistributeArea}
              totalLandUseArea={totalLandUseArea}
              remainingArea={remainingArea}
              hasAreaMismatch={hasAreaMismatch}
              areaDifference={areaDifference}
            />

            <GeometrySection
              formData={formData}
              errors={errors}
              touched={touched}
              showGeometryInput={showGeometryInput}
              handleGeometryChange={handleGeometryChange}
              formatGeometryJSON={formatGeometryJSON}
              toggleGeometryInput={toggleGeometryInput}
              handleBlur={handleBlur}
              loading={loading}
            />

            <div className="form-row">
              <div className="form-group full-width">
                <label className="blue-field-label">
                  <FaStickyNote className="label-icon" />
                  Ghi chú
                </label>
                <textarea
                  name="ghi_chu"
                  value={formData.ghi_chu}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder="Nhập ghi chú (nếu có)"
                  className="blue-textarea"
                  disabled={loading}
                  rows={3}
                />
              </div>
            </div>

            <FormActions
              onClose={onClose}
              loading={loading}
              handleSubmit={handleSubmit}
            />
          </form>
        </div>
      </div>
    );
  }
);

export default LandPlotAdd;
