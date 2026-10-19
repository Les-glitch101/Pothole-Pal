import PageIndicator from "../components/pageIndicator"
function ReportPotholePage2() {


  return (
    <div className="flex flex-col w-full">

        <div className="flex flex-row p-3 w-full">
            <button><img src="src/assets/Back.png" alt="Back arrow icon" className="w-5" /></button>
            <span className="text-center mx-auto font-bold">Report a Pothole</span>
        </div>

        <span className="text-center mx-auto">2 of 4</span>
        <PageIndicator current={2} total={4} />

        <div className="flex flex-col justify-center items-center w-75 h-100 md:w-150 md:h-100 mt-4 mx-auto">
            <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d206602.68592737647!2d27.632192596957598!3d-26.608732981011226!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e94516555ef05db%3A0x80ef0966d310a25!2sEmfuleni%20Local%20Municipality!5e1!3m2!1sen!2sza!4v1792230650233!5m2!1sen!2sza"
            className="w-full h-full rounded-lg"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
        </div>

        <button className="text-white font-semibold bg-blue-500 w-50 h-12 md:h-10 p-3 md:p-1 mt-2 mx-auto text-center rounded-xl">Confirm Location</button>

    </div>
  )
}

export default ReportPotholePage2
