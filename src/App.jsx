import Home from "./pages/Home"
import Map from "./pages/Map"
import Profile from "./pages/Profile"
import ReportPotholePage1 from "./pages/ReportPotholePage1"
import ReportPotholePage2 from "./pages/ReportPotholePage2"
import ReportPotholePage3 from "./pages/ReportPotholePage3"
import ReportPotholePage4 from "./pages/ReportPotholePage4"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"

function App() {


  return (
    <>
  
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/report1" element={<ReportPotholePage1 />} />
        <Route path="/report2" element={<ReportPotholePage2 />} />
        <Route path="/report3" element={<ReportPotholePage3 />} />
        <Route path="/report4" element={<ReportPotholePage4 />} />
      </Routes>
      
    </>
  )
}

export default App
