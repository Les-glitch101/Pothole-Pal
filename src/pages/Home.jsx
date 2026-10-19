import { useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/navbar";

function Home() {
    const [query, setQuery] = useState("Emfuleni Local Municipality");


  return (

    <div className="flex flex-col w-full">
        <header className="flex items-center justify-between w-full p-2">
            <div className="flex items-center">
                <img src="src/assets/Logo.png" alt="PotholePal Logo" className="w-15 md:w-30 p-1" />
                <h1 className="flex justify-center items-center font-bold text-xl md:text-3xl p-1">PotholePal</h1>
            </div>
            
            <button className=""><img src="src/assets/notification.png" alt="" className="w-5 md:w-10" /></button>
        </header>

        <br />
        <div className="flex items-center justify-center gap-2 p-2">
            <input
            type="text"
            placeholder="Search street, area, or city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg p-2"
            />
            <button
            onClick={() => setQuery(query)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
            Search
            </button>
        </div>

        <br />

        <div className="flex flex-col justify-center items-center w-75 h-100 md:w-150 md:h-100 mt-4 mx-auto">
            <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d206602.68592737647!2d27.632192596957598!3d-26.608732981011226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e94516555ef05db%3A0x80ef0966d310a25!2sEmfuleni%20Local%20Municipality!5e1!3m2!1sen!2sza!4v1792230650233!5m2!1sen!2sza"
            className="w-full h-full rounded-lg"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>
        <Link to="/report1" className="text-center mx-auto">
            <button className="text-white font-semibold bg-blue-500 w-50 h-12 md:h-10 p-3 md:p-1 mt-2 mx-auto text-center rounded-xl">+ Report a Pothole</button>
        </Link>
        
        <div className="flex justify-center gap-5 py-2">
            {/* Column 1 */}
            <div className="flex flex-col items-center">
                <h1 className="text-xl font-bold">128</h1>
                <h1 className="text-lg">Reports today</h1>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col items-center">
                <h1 className="text-xl font-bold">864</h1>
                <h1 className="text-lg">Total reports</h1>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col items-center">
                <h1 className="text-xl font-bold">312</h1>
                <h1 className="text-lg">Fixed</h1>
            </div>
        </div>
        <NavBar />
    </div>

  )
}

export default Home
