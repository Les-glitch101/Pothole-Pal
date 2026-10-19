import NavBar from "../components/navbar"

function Profile() {


  return (
 
    <div className="flex flex-col w-full">

        <div className="flex items-center justify-between w-full p-2">
            <h1 className="font-bold text-xl">Profile</h1>
            <img src="src/assets/Settings.png" alt="Settings Icon" className="w-7" />
        </div>

        <div className="flex flex-col w-full max-w-md mx-auto p-4">
            {/* Top section */}
            <div className="flex flex-col items-center mb-6">
                {/* Profile photo */}
                <img
                src="src/assets/profile-photo.png" // replace with your actual photo/icon
                alt="Profile"
                className="w-24 h-24 rounded-full border-2 border-gray-300 mb-3"
                />

                {/* Name and title */}
                <h2 className="text-lg font-bold">Alex R.</h2>
                <p className="text-gray-600">Road Guardian</p>

                {/* Level badge */}
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm mt-2">
                Level 4
                </span>
            </div>

            {/* Stats */}
            <div className="flex justify-around text-center mb-6">
                <div>
                <p className="font-bold">1,250</p>
                <p className="text-gray-600 text-sm">Points</p>
                </div>
                <div>
                <p className="font-bold">48</p>
                <p className="text-gray-600 text-sm">Reports</p>
                </div>
                <div>
                <p className="font-bold">12</p>
                <p className="text-gray-600 text-sm">Verified Fixes</p>
                </div>
            </div>

            {/* Achievements */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col items-center">
                <img src="src/assets/first-report.png" alt="First Report" className="w-12 h-12 mb-1" />
                <p className="text-sm">First Report</p>
                </div>
                <div className="flex flex-col items-center">
                <img src="src/assets/road-guardian.png" alt="Road Guardian" className="w-12 h-12 mb-1" />
                <p className="text-sm">Road Guardian</p>
                </div>
                <div className="flex flex-col items-center">
                <img src="src/assets/community-hero.png" alt="Community Hero" className="w-12 h-12 mb-1" />
                <p className="text-sm">Community Hero</p>
                </div>
                <div className="flex flex-col items-center">
                <img src="src/assets/fast-reporter.png" alt="Fast Reporter" className="w-12 h-12 mb-1" />
                <p className="text-sm">Fast Reporter</p>
                </div>
            </div>

            {/* Menu options */}
            <div className="flex flex-col gap-3 mb-6">
                <button className="text-left border-b pb-2">My Reports</button>
                <button className="text-left border-b pb-2">My Impact</button>
                <button className="text-left border-b pb-2">Leaderboard</button>
                <button className="text-left border-b pb-2">Settings</button>
                <button className="text-left border-b pb-2">Help & Support</button>
            </div>

        </div>

        <NavBar />

    </div> 

  )
}

export default Profile