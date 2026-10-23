// Demo seed data for PotholePal. Everything here is mock data —
// it will be replaced by API responses once the backend lands.

export const STATUS = {
  new: { label: "New", color: "#ef4444", bg: "#fee2e2" },
  review: { label: "Under Review", color: "#d97706", bg: "#fef3c7" },
  scheduled: { label: "Scheduled", color: "#1d5beb", bg: "#dbe4ff" },
  repairing: { label: "Repairing", color: "#1d5beb", bg: "#dbe4ff" },
  fixed: { label: "Fixed", color: "#16a34a", bg: "#dcfce7" },
};

export const FILTERS = ["All", "New", "Under Review", "Scheduled", "Fixed"];

// Simple asphalt-and-hole placeholder used wherever the design shows a photo.
export const POTHOLE_IMG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
      <defs>
        <radialGradient id="g" cx="50%" cy="55%" r="65%">
          <stop offset="0%" stop-color="#3f4650"/>
          <stop offset="55%" stop-color="#5b636e"/>
          <stop offset="100%" stop-color="#8f97a1"/>
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#a9aeb6"/>
      <ellipse cx="60" cy="40" rx="70" ry="34" fill="#b7bcc4"/>
      <ellipse cx="270" cy="170" rx="80" ry="40" fill="#9ea4ad"/>
      <ellipse cx="160" cy="105" rx="86" ry="58" fill="url(#g)"/>
      <ellipse cx="158" cy="108" rx="52" ry="34" fill="#232830"/>
      <ellipse cx="140" cy="98" rx="16" ry="9" fill="#15191f"/>
      <ellipse cx="196" cy="86" rx="14" ry="8" fill="#6d757f"/>
      <ellipse cx="96" cy="140" rx="18" ry="9" fill="#7c838d"/>
    </svg>`,
  );

export const SEED_REPORTS = [
  {
    id: 1024,
    area: "Three Rivers",
    address: "Three Rivers, Emphuleni District, Gauteng",
    lat: -26.65472,
    lng: 27.97806,
    issueType: "Pothole",
    size: "Medium",
    depth: "Moderate",
    severity: "Medium",
    traffic: "Low",
    damage: "No",
    description: "Large pothole near the traffic light, causes vehicles to swerve.",
    status: "repairing",
    reportedAt: "2 hours ago",
    severityNote: "Medium",
    photo: POTHOLE_IMG,
    isMine: false,
    timeline: ["Apr 15, 2025, 10:32 AM", "Apr 15, 2025, 11:00 AM", "Apr 16, 2025", "Apr 17, 2025", ""],
  },
  {
    id: 1023,
    area: "Sonland Park",
    address: "Sonland Park, Emphuleni District, Gauteng",
    lat: -26.60917,
    lng: 27.90889,
    issueType: "Pothole",
    size: "Large",
    depth: "Deep",
    severity: "High",
    traffic: "High",
    damage: "Yes",
    description: "Deep pothole on the inside lane, already damaged two wheels.",
    status: "scheduled",
    reportedAt: "5 hours ago",
    severityNote: "Severe",
    photo: POTHOLE_IMG,
    isMine: false,
    timeline: ["Apr 15, 2025, 7:15 AM", "Apr 15, 2025, 8:40 AM", "Apr 16, 2025", "", ""],
  },
  {
    id: 1022,
    area: "Arcon Park",
    address: "Arcon Park, Emphuleni District, Gauteng",
    lat: -26.63306,
    lng: 27.94333,
    issueType: "Pothole",
    size: "Small",
    depth: "Shallow",
    severity: "Low",
    traffic: "Low",
    damage: "No",
    description: "Small pothole forming outside the shopping centre.",
    status: "review",
    reportedAt: "yesterday",
    severityNote: "Low",
    photo: POTHOLE_IMG,
    isMine: false,
    timeline: ["Apr 14, 2025, 4:02 PM", "", "", "", ""],
  },
  {
    id: 1021,
    area: "Duncanville",
    address: "Duncanville, Emphuleni District, Gauteng",
    lat: -26.65422,
    lng: 27.92986,
    issueType: "Damaged shoulder",
    size: "Medium",
    depth: "Moderate",
    severity: "Medium",
    traffic: "Medium",
    damage: "No",
    description: "Broken road shoulder after the rain.",
    status: "fixed",
    reportedAt: "2 days ago",
    severityNote: "Medium",
    photo: POTHOLE_IMG,
    isMine: false,
    timeline: ["Apr 13, 2025, 9:12 AM", "Apr 13, 2025, 10:00 AM", "Apr 13, 2025", "Apr 14, 2025", "Apr 14, 2025"],
  },
  {
    id: 1020,
    area: "Riverview",
    address: "Riverview, Emphuleni District, Gauteng",
    lat: -26.73809,
    lng: 27.8493,
    issueType: "Pothole",
    size: "Large",
    depth: "Deep",
    severity: "High",
    traffic: "High",
    damage: "Yes",
    description: "Cluster of potholes where the bus route turns.",
    status: "new",
    reportedAt: "3 hours ago",
    severityNote: "Severe",
    photo: POTHOLE_IMG,
    isMine: false,
    timeline: ["Apr 15, 2025, 9:05 AM", "", "", "", ""],
  },
  {
    id: 1019,
    area: "Three Rivers East",
    address: "Three Rivers East, Emphuleni District, Gauteng",
    lat: -26.66361,
    lng: 27.99972,
    issueType: "Pothole",
    size: "Small",
    depth: "Shallow",
    severity: "Low",
    traffic: "Medium",
    damage: "No",
    description: "Shallow pothole near the school crossing.",
    status: "fixed",
    reportedAt: "4 days ago",
    severityNote: "Low",
    photo: POTHOLE_IMG,
    isMine: false,
    timeline: ["Apr 11, 2025, 8:00 AM", "Apr 11, 2025, 9:30 AM", "Apr 11, 2025", "Apr 12, 2025", "Apr 12, 2025"],
  },
  {
    id: 1018,
    area: "Peacehaven",
    address: "Peacehaven, Emphuleni District, Gauteng",
    lat: -26.66333,
    lng: 27.94861,
    issueType: "Pothole",
    size: "Medium",
    depth: "Moderate",
    severity: "Medium",
    traffic: "Low",
    damage: "No",
    description: "Pothole opening up on the corner.",
    status: "new",
    reportedAt: "6 hours ago",
    severityNote: "Medium",
    photo: POTHOLE_IMG,
    isMine: false,
    timeline: ["Apr 15, 2025, 6:44 AM", "", "", "", ""],
  },
];

// Fake cluster markers so the map looks populated, like the design's grouped pins.
export const CLUSTERS = [
  { lat: -26.6712, lng: 27.9279, count: 11 },
  { lat: -26.6845, lng: 27.9442, count: 8 },
  { lat: -26.6608, lng: 27.9448, count: 6 },
];

export const HEAT_POINTS = [
  { lat: -26.6639, lng: 27.9219, weight: 26 },
  { lat: -26.6803, lng: 27.9386, weight: 18 },
  { lat: -26.6702, lng: 27.9472, weight: 12 },
  { lat: -26.6889, lng: 27.9361, weight: 9 },
  { lat: -26.6572, lng: 27.9331, weight: 21 },
  { lat: -26.6961, lng: 27.9495, weight: 7 },
];

export const NOTIFICATIONS = [
  {
    group: "Today",
    items: [
      { id: 1, icon: "check", tone: "#16a34a", title: "Report #1024 verified", body: "Your pothole report has been reviewed by our team." },
      { id: 2, icon: "wrench", tone: "#1d5beb", title: "Repair scheduled", body: "Crews will begin work on your report #1024 tomorrow." },
      { id: 3, icon: "check", tone: "#16a34a", title: "Report #1019 fixed", body: "The pothole on Oak Street has been repaired." },
      { id: 4, icon: "award", tone: "#7c3aed", title: "You earned 50 points", body: "+50 points for reporting issues in your area." },
    ],
  },
  {
    group: "Earlier",
    items: [
      { id: 5, icon: "message", tone: "#d97706", title: "Comment on your report", body: "A moderator replied to your report #1019." },
      { id: 6, icon: "alert", tone: "#ef4444", title: "Severe pothole nearby", body: "Multiple severe potholes reported in Three Rivers." },
    ],
  },
];

export const STAGES = ["Reported", "Verified", "Assigned", "Repairing", "Completed"];

export const DASH_STATS = [
  { label: "1,248", sub: "Total Reports", tone: "#fee2e2", color: "#ef4444" },
  { label: "86", sub: "New Reports", tone: "#fef3c7", color: "#d97706" },
  { label: "312", sub: "Fixed Issues", tone: "#dcfce7", color: "#16a34a" },
  { label: "64%", sub: "Resolution Rate", tone: "#dbe4ff", color: "#1d5beb" },
];

export const DASH_RECENT = [
  { id: 1, name: "John Smith", area: "Three Rivers", severity: "High", status: "Scheduled" },
  { id: 2, name: "Thabo Nkosi", area: "Sonland Park", severity: "Medium", status: "Under Review" },
  { id: 3, name: "Sarah Patel", area: "Arcon Park", severity: "Low", status: "New" },
];
