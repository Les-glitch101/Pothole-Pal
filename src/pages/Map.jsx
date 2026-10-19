import NavBar from "../components/navbar"
import { useState } from "react";

function Map() {
     const [selected, setSelected] = useState("");

  return (
    <div className="flex flex-col w-full">

        <div className="flex items-center justify-between w-full p-2">
            <h1 className="font-bold text-xl">Map</h1>
            <img src="src/assets/Settings.png" alt="Settings Icon" className="w-7" />
        </div>

        <div className="flex items-center w-[90%] max-w-md mx-auto border border-gray-300 rounded-lg px-3 py-2">
            <img src="src/assets/Search.png" alt="Search Icon" className="w-5 h-5 mr-2" />
            <input
                type="text"
                placeholder="Search location..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <div className="flex flex-row justify-center items-center w-full gap-2 p-2">

            <button onClick={() => setSelected("all")} className={`border border-gray-400 rounded-2xl p-2 font-semibold ${selected === "all" ? "bg-blue-500" : "bg-white"}`}>All</button>
            <button onClick={() => setSelected("new")} className={`border border-gray-400 rounded-2xl p-2 font-semibold ${selected === "new" ? "bg-blue-500" : "bg-white"}`}>New</button>
            <button onClick={() => setSelected("review")} className={`border border-gray-400 rounded-2xl p-2 font-semibold ${selected === "review" ? "bg-blue-500" : "bg-white"}`}>Under Review</button>
            <button onClick={() => setSelected("schedule")} className={`border border-gray-400 rounded-2xl p-2 font-semibold ${selected === "schedule" ? "bg-blue-500" : "bg-white"}`}>Scheduled</button>
            
        </div>

        <div className="flex flex-col justify-center items-center w-75 h-100 md:w-150 md:h-100 mt-4 mx-auto">
            <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d206602.68592737647!2d27.632192596957598!3d-26.608732981011226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e94516555ef05db%3A0x80ef0966d310a25!2sEmfuleni%20Local%20Municipality!5e1!3m2!1sen!2sza!4v1792230650233!5m2!1sen!2sza"
            className="w-full h-full rounded-lg"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>

        <NavBar />

    </div>
  )
}

export default Map