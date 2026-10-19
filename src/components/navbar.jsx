import { Link } from "react-router-dom"
function NavBar() {


  return (
    <div className="flex flex-col w-full">
        <nav className="flex flex-row p-2 justify-center items-center mt-5">
            <ul className="flex flex-row gap-10">
                <li>
                    <Link to="/">
                        <img src="src/assets/Home.png" alt="Home Icon" className="w-10" />
                        <span>Home</span>
                    </Link>
                </li>
                <li>
                    <Link to="/map">
                        <img src="src/assets/Map.png" alt="Map Icon" className="w-10" />
                        <span>Map</span>
                    </Link>     
                </li>
                <li>
                    <Link to="/report">
                        <img src="src/assets/Report.png" alt="Report Icon" className="w-10" />
                        <span>Reports</span>
                    </Link>    
                </li>
                <li>
                    <Link to="/profile">
                        <img src="src/assets/Profile.png" alt="Profile Icon" className="w-10" />
                        <span>Profile</span>
                    </Link>
                </li>
            </ul>
        </nav>
    </div>
  )
}

export default NavBar