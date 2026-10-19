function PageIndicator({ current, total }) {
  return (
    <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${
            i + 1 === current ? "bg-blue-500" : "bg-gray-300"
          }`}
        ></div>
      ))}
    </div>
  )
}
export default PageIndicator