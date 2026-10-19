import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ReportPotholePage1() {
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const handleNext = () => {
    navigate("/report4", {state: { photo } })
  }

  return (
    <div className="flex flex-col items-center p-4">
        <h1 className="text-xl font-bold mb-4">Capture Pothole</h1>

        <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setPhoto(URL.createObjectURL(e.target.files[0]))}
            className="mb-4"
        />

        {photo && (
            <img src={photo} alt="Pothole" className="w-64 rounded-lg mb-4" />
        )}

        <button
            onClick={handleNext}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
            disabled={!photo}
        >
            Next
        </button>
    </div>
  );
}
export default ReportPotholePage1