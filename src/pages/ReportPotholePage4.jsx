import PageIndicator from "../components/pageIndicator"
import { useState } from "react";
import { useLocation } from "react-router-dom";

function ReportPotholePage4() {
    const routerLocation = useLocation();
    const photo = routerLocation.state?.photo;
    const [address, setAddress] = useState("123 Maple Ave, Riverton, CA 94016");
    const [severity, setSeverity] = useState("Moderate");
    const [trafficImpact, setTrafficImpact] = useState("Some");
    const [vehicleDamage, setVehicleDamage] = useState("No");
    const [details, setDetails] = useState("Large pothole, about 1 foot wide. Causes vehicles to swerve.");

    const [editingField, setEditingField] = useState(null);

    const PencilIcon = () => (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 text-gray-500 cursor-pointer"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6.232-6.232a2 2 0 112.828 2.828L11.828 13.828a2 2 0 01-1.414.586H9v-2z" />
        </svg>
    );

    // Reusable editable field
    const EditableField = ({ label, value, field, setter }) => (
        <div className="flex items-center justify-between mb-2">
        {editingField === field ? (
            <input
            type="text"
            value={value}
            onChange={(e) => setter(e.target.value)}
            onBlur={() => setEditingField(null)}
            className="border rounded-lg p-1 w-full mr-2"
            autoFocus
            />
        ) : (
            <p>
            <span className="font-semibold">{label}:</span> {value}
            </p>
        )}
        <span onClick={() => setEditingField(field)}>
            <PencilIcon />
        </span>
        </div>
    );


    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-row p-3 w-full">
                <button><img src="src/assets/Back.png" alt="Back arrow icon" className="w-5" /></button>
                <span className="text-center mx-auto font-bold">Report a Pothole</span>
            </div>

            <span className="text-center mx-auto">4 of 4</span>
            <PageIndicator current={4} total={4} />

            <div className="flex flex-col max-w-md mx-auto p-4">
                {/* Photo */}
                {photo && (
                    <img
                    src={photo}
                    alt="Pothole"
                    className="w-full rounded-lg mb-4"
                    />
                )}

                {/* Editable report details */}
                <div className="flex items-center gap-2 mt-3">
                    <img
                        src="src/assets/Location.png"
                        alt="Location Icon"
                        className="w-7"
                    />
                    <EditableField
                        label="Location"
                        value={address}
                        field="address"
                        setter={setAddress}
                    />
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <img src="src/assets/Caution.png" alt="Caution Icon" className="w-7" />
                    <EditableField label="Severity" value={severity} field="severity" setter={setSeverity} />
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <img src="src/assets/Traffic.png" alt="Traffic Icon" className="w-7" />
                    <EditableField label="Traffic impact" value={trafficImpact} field="trafficImpact" setter={setTrafficImpact} />
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <img src="src/assets/Damage.png" alt="Damage Icon" className="w-7" />
                    <EditableField label="Vehicle damage" value={vehicleDamage} field="vehicleDamage" setter={setVehicleDamage} />
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <img src="src/assets/List.png" alt="List Icon" className="w-7" />
                    <EditableField label="Additional details" value={details} field="details" setter={setDetails} />
                </div>
                

                {/* Submit button */}
                <button className="bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg w-full mt-6">
                    Submit Report
                </button>
            </div>
        </div>
        
    );
}

export default ReportPotholePage4
