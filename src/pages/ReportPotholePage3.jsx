import PageIndicator from "../components/pageIndicator"
import { useState } from "react";

function ReportPotholePage3() {
    const [severity, setSeverity] = useState("");
    const [trafficImpact, setTrafficImpact] = useState("");
    const [vehicleDamage, setVehicleDamage] = useState("");
    const [selected, setSelected] = useState("");

  return (

    <div className="flex flex-col w-full">

        <div className="flex flex-row p-3 w-full">
            <button><img src="src/assets/Back.png" alt="Back arrow icon" className="w-5" /></button>
            <span className="text-center mx-auto font-bold">Report a Pothole</span>
        </div>

        <span className="text-center mx-auto">3 of 4</span>
        <PageIndicator current={3} total={4} />

        <div className="flex flex-col p-2 max-w-md mx-auto">

            {/* Severity */}
            <label className="font-bold mb-2">Severity</label>

            <div className="flex flex-row gap-2 mb-4">
                <button
                    onClick={() => setSelected("small")}
                    className={`bg-green-300 rounded-lg p-2 border ${
                    selected === "small" ? "border-blue-500" : "border-transparent"
                    }`}>
                    <img src="src/assets/Green.png" alt="Green caution icon" className="w-10 mx-auto" /><br /><font className="font-bold">Small</font><br />(Minor issue)
                </button>
                <button
                    onClick={() => setSelected("moderate")}
                    className={`bg-yellow-300 rounded-lg p-2 border ${
                    selected === "moderate" ? "border-blue-500" : "border-transparent"
                    }`}>
                    <img src="src/assets/Yellow.png" alt="Yellow caution icon" className="w-10 mx-auto" /><br /><font className="font-bold">Moderate</font><br />(Noticeable damage)
                </button>
                <button
                    onClick={() => setSelected("severe")}
                    className={`bg-red-300 rounded-lg p-2 border ${
                    selected === "severe" ? "border-blue-500" : "border-transparent"
                    }`}>
                    <img src="src/assets/Red.png" alt="Red caution icon" className="w-10 mx-auto" /><br /><font className="font-bold">Severe</font><br />(Major hazard)
                </button>
            </div>

            {/* Road name */}
            <label className="font-semibold mb-2">Road name (optional)</label>
            <input
                type="text"
                placeholder="Maple Ave"
                className="border rounded-lg p-2 mb-4 w-full"
            />

            {/* Additional details */}
            <label className="font-semibold mb-2">Additional details (optional)</label>
            <textarea
                placeholder="Large pothole, about 1 foot wide. Causes vehicles to swerve."
                className="border rounded-lg p-2 mb-4 w-full"
            ></textarea>

            {/* Traffic impact */}
            <label className="font-semibold mb-2">Traffic impact</label>
            <div className="flex gap-4 mb-4">
                {["No", "Some", "High"].map((option) => (
                <label key={option} className="flex items-center gap-1">
                    <input
                    type="radio"
                    name="trafficImpact"
                    value={option}
                    checked={trafficImpact === option}
                    onChange={() => setTrafficImpact(option)}
                    />
                    {option}
                </label>
                ))}
            </div>

            {/* Vehicle damage */}
            <label className="font-semibold mb-2">Vehicle damage?</label>
            <div className="flex gap-4 mb-6">
                {["No", "Yes"].map((option) => (
                <label key={option} className="flex items-center gap-1">
                    <input
                    type="radio"
                    name="vehicleDamage"
                    value={option}
                    checked={vehicleDamage === option}
                    onChange={() => setVehicleDamage(option)}
                    />
                    {option}
                </label>
                ))}
            </div>

            {/* Next button */}
            <button className="bg-blue-500 text-white px-6 py-3 rounded-lg w-full">
                Next
            </button>
        </div>

    </div>

  )
}

export default ReportPotholePage3
